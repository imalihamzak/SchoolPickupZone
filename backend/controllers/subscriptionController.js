require('dotenv').config();
const stripe = require('../utils/stripe');
const pool = require('../config/db');
const {
  sendBillingReminderEmail,
  sendPaymentRetryEmail,
  sendSubscriptionEmail,
} = require('../utils/sendSubscriptionEmail');
const { buildClientUrl } = require('../config/appUrls');
const {
  getLatestSubscription,
  getPlanById,
  getSubscriptionById,
  markSubscriptionPaymentFailed,
  markSubscriptionPaymentSucceeded,
  refreshSubscriptionLifecycle,
  resolveBillingInterval,
} = require('../services/subscriptionService');

const resolvePlanPrice = (plan, interval) => {
  const field = interval === 'yearly' ? plan.yearly_price : plan.monthly_price;
  return Number(field ?? plan.price ?? 0);
};

const getStripeId = (value) => {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
};

const getStripeTimestamp = (timestamp) => (timestamp ? new Date(timestamp * 1000) : null);

const getInvoiceMetadata = (invoice = {}) => {
  const safeInvoice = invoice || {};
  return {
    stripeInvoiceId: getStripeId(safeInvoice),
    stripePaymentIntentId: getStripeId(safeInvoice.payment_intent),
    stripeChargeId: getStripeId(safeInvoice.charge),
    invoiceNumber: safeInvoice.number || null,
    invoiceDueDate: getStripeTimestamp(safeInvoice.due_date || safeInvoice.next_payment_attempt),
    invoiceHostedUrl: safeInvoice.hosted_invoice_url || null,
    invoicePdfUrl: safeInvoice.invoice_pdf || null,
    attemptCount: safeInvoice.attempt_count ?? null,
  };
};

const getInvoiceAmountDue = (invoice = {}) => Number(
  invoice.amount_remaining ?? invoice.amount_due ?? invoice.total ?? 0
) / 100;

const parseRetryDelaysHours = () => {
  const configured = process.env.STRIPE_RETRY_DELAYS_HOURS || '24,72,168';
  return configured
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);
};

const addHours = (date, hours) => {
  const nextDate = new Date(date);
  nextDate.setHours(nextDate.getHours() + Number(hours || 0));
  return nextDate;
};

const formatCurrency = (amount) => `$${Number(amount || 0).toFixed(2)}`;

const HANDLED_STRIPE_EVENTS = new Set([
  'checkout.session.completed',
  'invoice.paid',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'invoice.upcoming',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

const getBillingAdmins = async (executor, schoolId) => {
  const [admins] = await executor.execute(
    `SELECT id, email, firstName, lastName
     FROM users
     WHERE school_id = ? AND role = 'admin' AND email IS NOT NULL`,
    [schoolId]
  );
  return admins;
};

const insertBillingNotification = async (executor, {
  userId,
  type,
  title,
  message,
}) => {
  try {
    await executor.execute(
      `INSERT INTO notifications (user_id, type, title, message, timestamp, \`read\`)
       VALUES (?, ?, ?, ?, NOW(), 0)`,
      [userId, type, title, message]
    );
  } catch (err) {
    if (err.code !== 'WARN_DATA_TRUNCATED' && err.code !== 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
      throw err;
    }
    await executor.execute(
      `INSERT INTO notifications (user_id, type, title, message, timestamp, \`read\`)
       VALUES (?, 'message', ?, ?, NOW(), 0)`,
      [userId, title, message]
    );
  }
};

const notifyBillingAdmins = async ({
  schoolId,
  notificationType,
  title,
  message,
  emailType,
  emailPayload,
}) => {
  const admins = await getBillingAdmins(pool, schoolId);
  await Promise.all(admins.map(async (admin) => {
    await insertBillingNotification(pool, {
      userId: admin.id,
      type: notificationType,
      title,
      message,
    });

    const adminName = `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || admin.email;
    const payload = { ...emailPayload, to: admin.email, adminName };

    if (emailType === 'reminder') {
      await sendBillingReminderEmail(payload);
    } else if (emailType === 'retry') {
      await sendPaymentRetryEmail(payload);
    }
  }));
};

const recordBillingReminder = async (executor, {
  subscription,
  invoice,
  stripeEventId = null,
  reminderType,
  dueAt = null,
  status = 'sent',
  errorMessage = null,
}) => {
  try {
    await executor.execute(
      `INSERT INTO billing_reminders (
        subscription_id,
        school_id,
        plan_id,
        stripe_invoice_id,
        stripe_event_id,
        reminder_type,
        amount_due,
        due_at,
        sent_at,
        status,
        error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        sent_at = VALUES(sent_at),
        status = VALUES(status),
        error_message = VALUES(error_message)`,
      [
        subscription?.id || null,
        subscription.school_id,
        subscription.plan_id || null,
        getStripeId(invoice),
        stripeEventId,
        reminderType,
        getInvoiceAmountDue(invoice),
        dueAt,
        new Date(),
        status,
        errorMessage,
      ]
    );
  } catch (err) {
    if (err.code !== 'ER_NO_SUCH_TABLE' && err.code !== 'ER_BAD_FIELD_ERROR') {
      throw err;
    }
  }
};

const cancelPendingInvoiceRetries = async (executor, stripeInvoiceId) => {
  if (!stripeInvoiceId) return;
  try {
    await executor.execute(
      `UPDATE stripe_invoice_retries
       SET status = 'cancelled', processed_at = COALESCE(processed_at, ?)
       WHERE stripe_invoice_id = ? AND status IN ('scheduled', 'processing')`,
      [new Date(), stripeInvoiceId]
    );
  } catch (err) {
    if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
  }
};

const scheduleInvoiceRetries = async (executor, {
  subscription,
  invoice,
  stripeEventId = null,
}) => {
  const stripeInvoiceId = getStripeId(invoice);
  if (!stripeInvoiceId) return [];

  const delays = parseRetryDelaysHours();
  const now = new Date();
  const scheduledRetries = delays.map((hours, index) => ({
    attemptNumber: index + 1,
    scheduledAt: addHours(now, hours),
  }));

  for (const retry of scheduledRetries) {
    await executor.execute(
      `INSERT INTO stripe_invoice_retries (
        subscription_id,
        school_id,
        plan_id,
        stripe_invoice_id,
        stripe_subscription_id,
        stripe_event_id,
        attempt_number,
        amount_due,
        scheduled_at,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
      ON DUPLICATE KEY UPDATE
        amount_due = VALUES(amount_due),
        scheduled_at = CASE
          WHEN status = 'scheduled' THEN VALUES(scheduled_at)
          ELSE scheduled_at
        END,
        stripe_event_id = COALESCE(stripe_event_id, VALUES(stripe_event_id))`,
      [
        subscription.id,
        subscription.school_id,
        subscription.plan_id,
        stripeInvoiceId,
        getStripeId(invoice.subscription) || subscription.stripe_subscription_id || null,
        stripeEventId,
        retry.attemptNumber,
        getInvoiceAmountDue(invoice),
        retry.scheduledAt,
      ]
    );
  }

  return scheduledRetries;
};

const beginStripeWebhookEvent = async (event) => {
  const objectId = getStripeId(event.data?.object);

  try {
    const [result] = await pool.execute(
      `INSERT INTO stripe_webhook_events (
        stripe_event_id,
        event_type,
        object_id,
        processing_status
      ) VALUES (?, ?, ?, 'processing')
      ON DUPLICATE KEY UPDATE
        retry_count = retry_count + 1,
        processing_status = CASE
          WHEN processing_status IN ('processed', 'ignored') THEN processing_status
          ELSE 'processing'
        END,
        error_message = CASE
          WHEN processing_status IN ('processed', 'ignored') THEN error_message
          ELSE NULL
        END`,
      [event.id, event.type, objectId]
    );

    if (result.affectedRows === 1) return { shouldProcess: true };

    const [[existing]] = await pool.execute(
      `SELECT processing_status FROM stripe_webhook_events WHERE stripe_event_id = ? LIMIT 1`,
      [event.id]
    );

    if (
      existing?.processing_status === 'ignored' &&
      HANDLED_STRIPE_EVENTS.has(event.type)
    ) {
      await pool.execute(
        `UPDATE stripe_webhook_events
         SET processing_status = 'processing',
             error_message = NULL
         WHERE stripe_event_id = ?`,
        [event.id]
      );
      return { shouldProcess: true };
    }

    return { shouldProcess: !['processed', 'ignored'].includes(existing?.processing_status) };
  } catch (err) {
    if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
    return { shouldProcess: true };
  }
};

const completeStripeWebhookEvent = async (eventId, status = 'processed') => {
  try {
    await pool.execute(
      `UPDATE stripe_webhook_events
       SET processing_status = ?, processed_at = ?, error_message = NULL
       WHERE stripe_event_id = ?`,
      [status, new Date(), eventId]
    );
  } catch (err) {
    if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
  }
};

const failStripeWebhookEvent = async (eventId, errorMessage) => {
  try {
    await pool.execute(
      `UPDATE stripe_webhook_events
       SET processing_status = 'failed', processed_at = ?, error_message = ?
       WHERE stripe_event_id = ?`,
      [new Date(), errorMessage, eventId]
    );
  } catch (err) {
    if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
  }
};

const recordSubscriptionWebhookLog = async (executor, {
  subscription,
  changeType,
  notes,
  effectiveAt = new Date(),
}) => {
  try {
    await executor.execute(
      `INSERT INTO subscription_change_logs (
        subscription_id,
        school_id,
        from_plan_id,
        to_plan_id,
        from_billing_interval,
        to_billing_interval,
        change_type,
        effective_at,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        subscription.id,
        subscription.school_id,
        subscription.plan_id,
        subscription.plan_id,
        subscription.billing_interval,
        subscription.billing_interval,
        changeType,
        effectiveAt,
        notes,
      ]
    );
  } catch (err) {
    if (err.code !== 'ER_NO_SUCH_TABLE' && err.code !== 'ER_BAD_FIELD_ERROR') {
      throw err;
    }
  }
};

const mapStripeSubscriptionStatus = (status, cancelAtPeriodEnd = false) => {
  if (cancelAtPeriodEnd) return 'Cancelled';
  if (status === 'active' || status === 'trialing') return 'Active';
  if (status === 'past_due' || status === 'unpaid') return 'Expiring Soon';
  if (status === 'canceled') return 'Cancelled';
  return 'Inactive';
};

const findSubscriptionByStripeId = async (executor, stripeSubscriptionId) => {
  if (!stripeSubscriptionId) return null;

  const [[subscription]] = await executor.execute(
    `SELECT
       s.*,
       p.name AS plan_name,
       p.grace_period_days,
       p.monthly_price,
       p.yearly_price,
       p.price,
       sch.name AS school_name
     FROM subscriptions s
     LEFT JOIN subscription_plans p ON p.id = s.plan_id
     LEFT JOIN schools sch ON sch.id = s.school_id
     WHERE s.stripe_subscription_id = ?
     ORDER BY s.id DESC
     LIMIT 1`,
    [stripeSubscriptionId]
  );
  return subscription || null;
};

const ensureSubscriptionRow = async (executor, schoolId, planId, billingInterval) => {
  const existing = await getLatestSubscription(executor, schoolId);
  if (existing) return existing;

  const [result] = await executor.execute(
    `INSERT INTO subscriptions (school_id, plan_id, billing_interval, status)
     VALUES (?, ?, ?, 'Inactive')`,
    [schoolId, planId, billingInterval]
  );

  return getSubscriptionById(executor, result.insertId);
};

const resolvePaidInvoiceSubscription = async (invoice, stripeSubscriptionId) => {
  const existingSubscription = await findSubscriptionByStripeId(pool, stripeSubscriptionId);
  if (existingSubscription) return existingSubscription;

  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
    expand: ['items.data.price'],
  });
  const metadata = {
    ...(stripeSubscription.metadata || {}),
    ...(invoice.subscription_details?.metadata || {}),
    ...(invoice.metadata || {}),
  };
  const schoolId = parseInt(
    metadata.schoolId || metadata.school_id || metadata.pickupzone_school_id,
    10
  );
  const planId = parseInt(
    metadata.planId || metadata.plan_id || metadata.pickupzone_plan_id,
    10
  );
  const stripeInterval = stripeSubscription.items?.data?.[0]?.price?.recurring?.interval;
  const billingInterval = resolveBillingInterval(
    metadata.billingInterval ||
    metadata.billing_interval ||
    metadata.pickupzone_billing_interval ||
    (stripeInterval === 'year' ? 'yearly' : 'monthly')
  );

  if (!schoolId || !planId) {
    console.warn(
      `Paid invoice ${invoice.id} could not be matched because Stripe metadata is missing schoolId or planId.`
    );
    return null;
  }

  return ensureSubscriptionRow(pool, schoolId, planId, billingInterval);
};

const sendActivationEmail = async (schoolId, planId, amountPaid, nextBilling) => {
  const [[admin]] = await pool.execute(`
    SELECT u.email, u.firstName, u.lastName, p.name AS planName
    FROM users u
    JOIN subscription_plans p ON p.id = ?
    WHERE u.school_id = ? AND u.role = 'admin'
    LIMIT 1
  `, [planId, schoolId]);

  if (!admin) return;

  const adminName = `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || admin.email;
  await sendSubscriptionEmail(admin.email, adminName, admin.planName, amountPaid, nextBilling);
};

exports.createCheckoutSession = async (req, res) => {
  try {
    const requestedPlanId = req.body.planId || req.body.plan_id;
    const schoolId = req.user?.school_id;

    if (!schoolId) {
      return res.status(400).json({ error: 'Missing schoolId' });
    }

    await refreshSubscriptionLifecycle(pool, schoolId);

    const existingSubscription = await getLatestSubscription(pool, schoolId);
    const existingStatus = existingSubscription?.status;
    const planId =
      existingStatus === 'Active'
        ? existingSubscription?.plan_id || requestedPlanId
        : requestedPlanId || existingSubscription?.plan_id;
    const billingInterval = resolveBillingInterval(
      req.body.billingInterval ||
      req.body.billing_interval ||
      existingSubscription?.billing_interval ||
      'monthly'
    );

    if (!planId) {
      return res.status(400).json({ error: 'Missing schoolId or planId' });
    }

    if (
      req.user?.role === 'admin' &&
      existingStatus === 'Active' &&
      existingSubscription?.plan_id &&
      requestedPlanId &&
      Number(requestedPlanId) !== Number(existingSubscription.plan_id)
    ) {
      console.warn(
        `Checkout plan mismatch for school ${schoolId}: requested ${requestedPlanId}, assigned ${existingSubscription.plan_id}. Using assigned package.`
      );
    }

    if (
      existingSubscription?.status === 'Active' &&
      !existingSubscription.cancel_at_period_end
    ) {
      return res.status(400).json({ error: 'You already have an active subscription.' });
    }

    const plan = await getPlanById(pool, planId);
    if (!plan || !Boolean(plan.is_active)) {
      return res.status(404).json({ error: 'Package not found or inactive' });
    }

    const amount = resolvePlanPrice(plan, billingInterval);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: `No ${billingInterval} price configured for this package.` });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: plan.name },
          unit_amount: Math.round(amount * 100),
          recurring: {
            interval: billingInterval === 'yearly' ? 'year' : 'month',
          },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      subscription_data: {
        metadata: {
          schoolId: String(schoolId),
          planId: String(planId),
          billingInterval,
          pickupzoneRetryScheduleHours: parseRetryDelaysHours().join(','),
        },
      },
      metadata: {
        schoolId: String(schoolId),
        planId: String(planId),
        billingInterval,
        subscriptionId: existingSubscription?.id ? String(existingSubscription.id) : '',
      },
      success_url: buildClientUrl('/payment-success?payment=success&session_id={CHECKOUT_SESSION_ID}'),
      cancel_url: buildClientUrl('/payment-cancel'),
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe session error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

const handleCheckoutCompleted = async (session, stripeEventId = null) => {
  const sessionWithLineItems = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ['line_items', 'subscription', 'subscription.latest_invoice.payment_intent'],
  });

  const metadata = session.metadata || {};
  const schoolId = parseInt(metadata.schoolId, 10);
  const planId = parseInt(metadata.planId, 10);
  const amountPaid = Number(sessionWithLineItems.amount_total || 0) / 100;
  const recurringInterval = sessionWithLineItems.line_items?.data?.[0]?.price?.recurring?.interval;
  const billingInterval = metadata.billingInterval === 'yearly' || recurringInterval === 'year'
    ? 'yearly'
    : 'monthly';
  const stripeSubscriptionId = getStripeId(sessionWithLineItems.subscription);
  const stripeCustomerId = getStripeId(sessionWithLineItems.customer || session.customer);
  const latestInvoice = sessionWithLineItems.subscription?.latest_invoice;
  const latestInvoiceId = getStripeId(latestInvoice);
  const invoiceMetadata = latestInvoice && typeof latestInvoice === 'object'
    ? getInvoiceMetadata(latestInvoice)
    : { stripeInvoiceId: latestInvoiceId };
  const defaultPaymentMethodId = latestInvoice && typeof latestInvoice === 'object'
    ? getStripeId(latestInvoice.payment_intent?.payment_method)
    : null;

  if (!schoolId || !planId) {
    throw new Error('Checkout session missing schoolId or planId metadata.');
  }

  const duplicateParams = latestInvoiceId
    ? [session.id, latestInvoiceId]
    : [session.id, '__no_invoice__'];
  const [[existingPayment]] = await pool.execute(
    `SELECT id
     FROM payments
     WHERE status = 'Successful'
       AND (transaction_id = ? OR stripe_invoice_id = ?)
     LIMIT 1`,
    duplicateParams
  );

  if (existingPayment) {
    await refreshSubscriptionLifecycle(pool, schoolId);
    return { alreadyProcessed: true };
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const subscription = await ensureSubscriptionRow(connection, schoolId, planId, billingInterval);

    const { endDate } = await markSubscriptionPaymentSucceeded(connection, {
      subscriptionId: subscription.id,
      schoolId,
      planId,
      billingInterval,
      amount: amountPaid,
      transactionId: session.id,
      ...invoiceMetadata,
      stripeInvoiceId: invoiceMetadata.stripeInvoiceId || latestInvoiceId,
      stripeEventId,
      stripeSubscriptionId,
      stripeCustomerId,
      stripeStatus: sessionWithLineItems.subscription?.status || null,
      billingReason: 'subscription_create',
    });

    await connection.commit();
    if (stripeSubscriptionId && defaultPaymentMethodId) {
      await stripe.subscriptions.update(stripeSubscriptionId, {
        default_payment_method: defaultPaymentMethodId,
      }).catch((stripeErr) => {
        console.error('Failed to save Stripe default payment method:', stripeErr.message);
      });
    }
    await sendActivationEmail(schoolId, planId, amountPaid, endDate).catch((emailErr) => {
      console.error('Failed to send subscription email:', emailErr.message);
    });
    return { alreadyProcessed: false, endDate };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

exports.confirmCheckoutSession = async (req, res) => {
  try {
    const sessionId = req.body?.sessionId || req.body?.session_id || req.query?.session_id;
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing Stripe checkout session ID.' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const metadata = session.metadata || {};
    const schoolId = parseInt(metadata.schoolId, 10);

    if (!schoolId) {
      return res.status(400).json({ error: 'Checkout session is missing school metadata.' });
    }

    if (req.user?.role === 'admin' && Number(req.user.school_id) !== schoolId) {
      return res.status(403).json({ error: 'This checkout session does not belong to your school.' });
    }

    if (session.status !== 'complete' && session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Checkout session is not paid yet.' });
    }

    await handleCheckoutCompleted(session, `manual_confirm:${session.id}`);
    await refreshSubscriptionLifecycle(pool, schoolId);
    const subscription = await getLatestSubscription(pool, schoolId);

    res.json({
      message: 'Subscription confirmed successfully.',
      subscriptionStatus: subscription?.status || 'Inactive',
      schoolId,
    });
  } catch (err) {
    console.error('Checkout confirmation failed:', err.message);
    res.status(500).json({ error: 'Failed to confirm checkout session.' });
  }
};

const handleInvoicePaymentSucceeded = async (invoice, stripeEventId = null) => {
  const stripeSubscriptionId = getStripeId(invoice.subscription);
  if (!stripeSubscriptionId) return;

  const [[existingPayment]] = await pool.execute(
    `SELECT id FROM payments WHERE stripe_invoice_id = ? AND status = 'Successful' LIMIT 1`,
    [invoice.id]
  );
  if (existingPayment) return;

  const subscription = await resolvePaidInvoiceSubscription(invoice, stripeSubscriptionId);
  if (!subscription) return;

  const amountPaid = Number(invoice.amount_paid || invoice.amount_due || 0) / 100;
  const invoiceMetadata = getInvoiceMetadata(invoice);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await markSubscriptionPaymentSucceeded(connection, {
      subscriptionId: subscription.id,
      schoolId: subscription.school_id,
      planId: subscription.plan_id,
      billingInterval: subscription.billing_interval,
      amount: amountPaid,
      transactionId: invoice.id,
      ...invoiceMetadata,
      stripeEventId,
      stripeSubscriptionId,
      stripeCustomerId: getStripeId(invoice.customer),
      stripeStatus: 'active',
      billingReason: invoice.billing_reason === 'subscription_create'
        ? 'subscription_create'
        : 'subscription_cycle',
    });
    await cancelPendingInvoiceRetries(connection, invoice.id);
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const handleInvoicePaymentFailed = async (invoice, stripeEventId = null) => {
  const stripeSubscriptionId = getStripeId(invoice.subscription);
  if (!stripeSubscriptionId) return;

  const subscription = await findSubscriptionByStripeId(pool, stripeSubscriptionId);
  if (!subscription) return;
  const invoiceMetadata = getInvoiceMetadata(invoice);
  const failureReason =
    invoice.last_finalization_error?.message ||
    invoice.last_payment_error?.message ||
    'Invoice payment failed.';

  const connection = await pool.getConnection();
  let scheduledRetries = [];
  try {
    await connection.beginTransaction();
    await markSubscriptionPaymentFailed(connection, {
      subscriptionId: subscription.id,
      schoolId: subscription.school_id,
      planId: subscription.plan_id,
      amount: Number(invoice.amount_due || 0) / 100,
      transactionId: stripeEventId ? `${invoice.id}:${stripeEventId}` : invoice.id,
      ...invoiceMetadata,
      stripeEventId,
      failureReason,
    });
    scheduledRetries = await scheduleInvoiceRetries(connection, {
      subscription,
      invoice,
      stripeEventId,
    });
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  const nextRetry = scheduledRetries[0]?.scheduledAt || getStripeTimestamp(invoice.next_payment_attempt);
  const message = nextRetry
    ? `Payment of ${formatCurrency(getInvoiceAmountDue(invoice))} failed. Next retry is scheduled for ${nextRetry.toLocaleString()}.`
    : `Payment of ${formatCurrency(getInvoiceAmountDue(invoice))} failed.`;

  await notifyBillingAdmins({
    schoolId: subscription.school_id,
    notificationType: 'payment_failed',
    title: 'Subscription payment failed',
    message,
    emailType: 'retry',
    emailPayload: {
      schoolName: subscription.school_name,
      planName: subscription.plan_name,
      amountDue: getInvoiceAmountDue(invoice),
      nextRetryAt: nextRetry,
      invoiceUrl: invoice.hosted_invoice_url || null,
    },
  }).catch((notifyErr) => {
    console.error('Failed to send payment failure notifications:', notifyErr.message);
  });

  await recordBillingReminder(pool, {
    subscription,
    invoice,
    stripeEventId,
    reminderType: 'payment_failed',
    dueAt: nextRetry || null,
  });
};

const handleInvoiceUpcoming = async (invoice, stripeEventId = null) => {
  const stripeSubscriptionId = getStripeId(invoice.subscription);
  if (!stripeSubscriptionId) return;

  const subscription = await findSubscriptionByStripeId(pool, stripeSubscriptionId);
  if (!subscription) return;

  const dueAt =
    getStripeTimestamp(invoice.due_date) ||
    getStripeTimestamp(invoice.next_payment_attempt) ||
    getStripeTimestamp(invoice.period_end);
  const amountDue = getInvoiceAmountDue(invoice);
  const message = `Upcoming subscription invoice for ${formatCurrency(amountDue)} is due ${dueAt ? dueAt.toLocaleDateString() : 'soon'}.`;

  try {
    await notifyBillingAdmins({
      schoolId: subscription.school_id,
      notificationType: 'payment_reminder',
      title: 'Upcoming subscription payment',
      message,
      emailType: 'reminder',
      emailPayload: {
        schoolName: subscription.school_name,
        planName: subscription.plan_name,
        amountDue,
        dueAt,
        invoiceUrl: invoice.hosted_invoice_url || null,
      },
    });

    await recordBillingReminder(pool, {
      subscription,
      invoice,
      stripeEventId,
      reminderType: 'upcoming_invoice',
      dueAt,
      status: 'sent',
    });
  } catch (err) {
    await recordBillingReminder(pool, {
      subscription,
      invoice,
      stripeEventId,
      reminderType: 'upcoming_invoice',
      dueAt,
      status: 'failed',
      errorMessage: err.message,
    });
    console.error('Failed to send upcoming invoice reminder:', err.message);
  }
};

const handleStripeSubscriptionUpdated = async (stripeSubscription) => {
  const stripeSubscriptionId = stripeSubscription.id;
  const subscription = await findSubscriptionByStripeId(pool, stripeSubscriptionId);
  if (!subscription) return;

  const status = mapStripeSubscriptionStatus(
    stripeSubscription.status,
    Boolean(stripeSubscription.cancel_at_period_end)
  );
  const currentPeriodEnd =
    getStripeTimestamp(stripeSubscription.current_period_end) ||
    getStripeTimestamp(stripeSubscription.items?.data?.[0]?.current_period_end);

  await pool.execute(
    `UPDATE subscriptions
     SET status = ?,
         stripe_status = ?,
         cancel_at_period_end = ?,
         end_date = COALESCE(?, end_date),
         next_billing_date = COALESCE(?, next_billing_date),
         cancelled_at = CASE WHEN ? = 'Cancelled' THEN COALESCE(cancelled_at, ?) ELSE cancelled_at END
     WHERE id = ?`,
    [
      status,
      stripeSubscription.status || null,
      stripeSubscription.cancel_at_period_end ? 1 : 0,
      currentPeriodEnd,
      currentPeriodEnd,
      status,
      new Date(),
      subscription.id,
    ]
  );

  if (status === 'Cancelled' && !subscription.cancel_at_period_end) {
    await recordSubscriptionWebhookLog(pool, {
      subscription,
      changeType: 'cancel',
      effectiveAt: currentPeriodEnd || new Date(),
      notes: 'Stripe scheduled this subscription to cancel at period end.',
    });
  }

  await refreshSubscriptionLifecycle(pool, subscription.school_id);
};

const handleStripeSubscriptionDeleted = async (stripeSubscription) => {
  const subscription = await findSubscriptionByStripeId(pool, stripeSubscription.id);
  if (!subscription) return;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `UPDATE subscriptions
       SET status = 'Cancelled',
           stripe_status = ?,
           end_date = COALESCE(end_date, ?),
           next_billing_date = COALESCE(next_billing_date, ?),
           cancelled_at = COALESCE(cancelled_at, ?),
           cancel_at_period_end = 0
       WHERE id = ?`,
      [stripeSubscription.status || 'canceled', new Date(), new Date(), new Date(), subscription.id]
    );
    await connection.execute(
      `UPDATE schools
       SET status = 'Suspended',
           suspension_reason = 'Subscription cancelled.',
           suspended_at = COALESCE(suspended_at, ?)
       WHERE id = ?`,
      [new Date(), subscription.school_id]
    );
    await recordSubscriptionWebhookLog(connection, {
      subscription,
      changeType: 'cancel',
      notes: 'Stripe cancelled the subscription.',
    });
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const getDueInvoiceRetries = async (limit = 10) => {
  const normalizedLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const [rows] = await pool.query(
    `SELECT
       r.*,
       s.billing_interval,
       s.stripe_subscription_id AS current_stripe_subscription_id,
       p.name AS plan_name,
       sch.name AS school_name
     FROM stripe_invoice_retries r
     JOIN subscriptions s ON s.id = r.subscription_id
     LEFT JOIN subscription_plans p ON p.id = r.plan_id
     LEFT JOIN schools sch ON sch.id = r.school_id
     WHERE r.status = 'scheduled' AND r.scheduled_at <= NOW()
     ORDER BY r.scheduled_at ASC, r.id ASC
     LIMIT ?`,
    [normalizedLimit]
  );
  return rows;
};

const processInvoiceRetryRow = async (retryRow) => {
  const [claimResult] = await pool.execute(
    `UPDATE stripe_invoice_retries
     SET status = 'processing', processed_at = ?, error_message = NULL
     WHERE id = ? AND status = 'scheduled'`,
    [new Date(), retryRow.id]
  );

  if (!claimResult.affectedRows) {
    return { id: retryRow.id, status: 'skipped' };
  }

  const subscription = {
    id: retryRow.subscription_id,
    school_id: retryRow.school_id,
    plan_id: retryRow.plan_id,
    plan_name: retryRow.plan_name,
    school_name: retryRow.school_name,
    billing_interval: retryRow.billing_interval,
    stripe_subscription_id: retryRow.current_stripe_subscription_id,
  };

  try {
    const invoice = await stripe.invoices.pay(retryRow.stripe_invoice_id);
    const paid = invoice.paid || invoice.status === 'paid';

    if (paid) {
      await handleInvoicePaymentSucceeded(invoice, null);
      await pool.execute(
        `UPDATE stripe_invoice_retries
         SET status = 'succeeded', processed_at = ?, error_message = NULL
         WHERE id = ?`,
        [new Date(), retryRow.id]
      );
      await cancelPendingInvoiceRetries(pool, retryRow.stripe_invoice_id);
      await recordBillingReminder(pool, {
        subscription,
        invoice,
        reminderType: 'retry_succeeded',
        dueAt: new Date(),
      });
      return { id: retryRow.id, status: 'succeeded' };
    }

    await pool.execute(
      `UPDATE stripe_invoice_retries
       SET status = 'failed', processed_at = ?, error_message = ?
       WHERE id = ?`,
      [new Date(), `Stripe invoice status after retry: ${invoice.status || 'unknown'}`, retryRow.id]
    );
    await recordBillingReminder(pool, {
      subscription,
      invoice,
      reminderType: 'retry_failed',
      dueAt: new Date(),
      status: 'failed',
      errorMessage: `Stripe invoice status after retry: ${invoice.status || 'unknown'}`,
    });
    return { id: retryRow.id, status: 'failed', error: invoice.status || 'unknown' };
  } catch (err) {
    await pool.execute(
      `UPDATE stripe_invoice_retries
       SET status = 'failed', processed_at = ?, error_message = ?
       WHERE id = ?`,
      [new Date(), err.message, retryRow.id]
    );
    await recordBillingReminder(pool, {
      subscription,
      invoice: { id: retryRow.stripe_invoice_id, amount_due: Number(retryRow.amount_due || 0) * 100 },
      reminderType: 'retry_failed',
      dueAt: new Date(),
      status: 'failed',
      errorMessage: err.message,
    });
    return { id: retryRow.id, status: 'failed', error: err.message };
  }
};

const processDueInvoiceRetriesBatch = async (limit = 10) => {
  let rows = [];
  try {
    rows = await getDueInvoiceRetries(limit);
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return { processed: 0, results: [] };
    }
    throw err;
  }

  const results = [];
  for (const row of rows) {
    results.push(await processInvoiceRetryRow(row));
  }

  return { processed: results.length, results };
};

exports.processDueInvoiceRetries = async (req, res) => {
  try {
    const result = await processDueInvoiceRetriesBatch(req.body?.limit || req.query?.limit || 10);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Invoice retry processor failed:', err.message);
    res.status(500).json({ error: 'Failed to process invoice retries.' });
  }
};

exports.getInvoiceRetries = async (req, res) => {
  try {
    const status = String(req.query.status || 'all').toLowerCase();
    const limit = Math.min(Math.max(Number(req.query.limit || 200), 1), 500);
    const params = [];
    let statusClause = '';

    if (status !== 'all') {
      statusClause = 'WHERE r.status = ?';
      params.push(status);
    }

    params.push(limit);

    const [rows] = await pool.query(
      `SELECT
         r.id,
         r.subscription_id,
         r.school_id,
         r.plan_id,
         r.stripe_invoice_id,
         r.stripe_subscription_id,
         r.stripe_event_id,
         r.attempt_number,
         r.amount_due,
         r.scheduled_at,
         r.processed_at,
         r.status,
         r.error_message,
         sch.name AS school_name,
         p.name AS plan_name,
         s.billing_interval,
         s.status AS subscription_status
       FROM stripe_invoice_retries r
       LEFT JOIN schools sch ON sch.id = r.school_id
       LEFT JOIN subscription_plans p ON p.id = r.plan_id
       LEFT JOIN subscriptions s ON s.id = r.subscription_id
       ${statusClause}
       ORDER BY r.scheduled_at DESC, r.id DESC
       LIMIT ?`,
      params
    );

    res.json(rows);
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return res.json([]);
    }
    console.error('Failed to load invoice retries:', err.message);
    res.status(500).json({ error: 'Failed to load invoice retries.' });
  }
};

let invoiceRetryWorkerStarted = false;
exports.startInvoiceRetryWorker = () => {
  if (invoiceRetryWorkerStarted || process.env.ENABLE_BILLING_RETRY_WORKER === 'false') return;
  invoiceRetryWorkerStarted = true;

  const intervalMinutes = Math.max(Number(process.env.BILLING_RETRY_WORKER_INTERVAL_MINUTES || 15), 1);
  const runWorker = async () => {
    try {
      const result = await processDueInvoiceRetriesBatch(10);
      if (result.processed) {
        console.log(`Processed ${result.processed} scheduled invoice retry attempt(s).`);
      }
    } catch (err) {
      console.error('Scheduled invoice retry worker failed:', err.message);
    }
  };

  const timer = setInterval(runWorker, intervalMinutes * 60 * 1000);
  if (typeof timer.unref === 'function') timer.unref();
  runWorker();
};

exports.handleStripeWebhook = async (req, res) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const eventState = await beginStripeWebhookEvent(event);
    if (!eventState.shouldProcess) {
      return res.json({ received: true, duplicate: true });
    }

    let handled = true;
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, event.id);
        break;
      case 'invoice.paid':
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object, event.id);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object, event.id);
        break;
      case 'invoice.upcoming':
        await handleInvoiceUpcoming(event.data.object, event.id);
        break;
      case 'customer.subscription.updated':
        await handleStripeSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleStripeSubscriptionDeleted(event.data.object);
        break;
      default:
        handled = false;
        break;
    }

    await completeStripeWebhookEvent(event.id, handled ? 'processed' : 'ignored');
    res.json({ received: true });
  } catch (err) {
    await failStripeWebhookEvent(event.id, err.message).catch((logErr) => {
      console.error('Failed to record Stripe webhook failure:', logErr.message);
    });
    console.error(`Stripe webhook ${event.type} handling failed:`, err.message);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
};
