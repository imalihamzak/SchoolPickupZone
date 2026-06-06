const pool = require('../config/db');
const stripe = require('../utils/stripe');
const { buildClientUrl } = require('../config/appUrls');
const {
  cancelSubscriptionRecord,
  changeSchoolPackage,
  ensurePlanCanCoverSchool,
  getLatestSubscription,
  getPlanById,
  getSchoolUsage,
  planAmount,
  reactivateSubscriptionRecord,
  refreshSubscriptionLifecycle,
  resolveBillingInterval,
} = require('../services/subscriptionService');

const getStripeId = (value) => {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
};

const parseRequiredPlanId = (value) => {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized <= 0) {
    const error = new Error('A subscription package is required.');
    error.statusCode = 400;
    throw error;
  }
  return normalized;
};

const createControllerError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getAdminSchoolId = (req) => {
  const schoolId = Number(req.user?.school_id || 0);
  if (!schoolId) {
    throw createControllerError('Your account is not assigned to a school.', 400);
  }
  return schoolId;
};

const createStripePriceForPlan = async (plan, billingInterval) => {
  const interval = resolveBillingInterval(billingInterval);
  const amount = planAmount(plan, interval);

  if (!amount || amount <= 0) {
    throw createControllerError(`No ${interval} price configured for this package.`, 400);
  }

  const product = await stripe.products.create({
    name: `Pickup Zone - ${plan.name}`,
    metadata: {
      pickupzone_plan_id: String(plan.id),
    },
  });

  return stripe.prices.create({
    currency: process.env.STRIPE_CURRENCY || 'usd',
    unit_amount: Math.round(amount * 100),
    recurring: {
      interval: interval === 'yearly' ? 'year' : 'month',
    },
    product: product.id,
    nickname: `${plan.name} (${interval})`,
    metadata: {
      pickupzone_plan_id: String(plan.id),
      pickupzone_billing_interval: interval,
    },
  });
};

const retrieveStripeSubscriptionForChange = async (stripeSubscriptionId) => {
  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
    expand: ['items.data.price', 'latest_invoice.payment_intent'],
  });
  const primaryItem = stripeSubscription.items?.data?.[0];

  if (!primaryItem?.id) {
    throw createControllerError('Stripe subscription has no billable item to update.', 400);
  }

  return { stripeSubscription, primaryItem };
};

const updateStripeSubscriptionImmediately = async ({
  subscription,
  nextPlan,
  billingInterval,
  prorate,
}) => {
  const interval = resolveBillingInterval(billingInterval);
  const { stripeSubscription, primaryItem } = await retrieveStripeSubscriptionForChange(
    subscription.stripe_subscription_id
  );
  const price = await createStripePriceForPlan(nextPlan, interval);
  const scheduleId = getStripeId(stripeSubscription.schedule);

  if (scheduleId) {
    await stripe.subscriptionSchedules.release(scheduleId);
  }

  const updatePayload = {
    items: [
      {
        id: primaryItem.id,
        price: price.id,
        quantity: primaryItem.quantity || 1,
      },
    ],
    proration_behavior: prorate ? 'always_invoice' : 'create_prorations',
    payment_behavior: 'allow_incomplete',
    metadata: {
      pickupzone_plan_id: String(nextPlan.id),
      pickupzone_billing_interval: interval,
      pickupzone_school_id: String(subscription.school_id),
      pickupzone_subscription_id: String(subscription.id),
    },
    expand: ['latest_invoice.payment_intent', 'items.data.price'],
  };

  if (!scheduleId) {
    updatePayload.cancel_at_period_end = false;
  }

  const updatedSubscription = await stripe.subscriptions.update(stripeSubscription.id, updatePayload);

  return {
    synced: true,
    mode: 'immediate',
    releasedScheduleId: scheduleId,
    stripeSubscriptionId: updatedSubscription.id,
    stripeInvoiceId: getStripeId(updatedSubscription.latest_invoice),
    stripeStatus: updatedSubscription.status,
  };
};

const scheduleStripeSubscriptionDowngrade = async ({
  subscription,
  nextPlan,
  billingInterval,
}) => {
  const interval = resolveBillingInterval(billingInterval);
  const { stripeSubscription, primaryItem } = await retrieveStripeSubscriptionForChange(
    subscription.stripe_subscription_id
  );
  const price = await createStripePriceForPlan(nextPlan, interval);
  const scheduleId = getStripeId(stripeSubscription.schedule);
  const schedule = scheduleId
    ? await stripe.subscriptionSchedules.retrieve(scheduleId)
    : await stripe.subscriptionSchedules.create({
      from_subscription: stripeSubscription.id,
    });

  const currentPeriodStart = stripeSubscription.current_period_start || schedule.current_phase?.start_date;
  const currentPeriodEnd = stripeSubscription.current_period_end || schedule.current_phase?.end_date;

  if (!currentPeriodStart || !currentPeriodEnd) {
    throw createControllerError('Stripe subscription is missing current billing period dates.', 400);
  }

  const currentItems = stripeSubscription.items.data.map((item) => ({
    price: getStripeId(item.price),
    quantity: item.quantity || 1,
  }));
  const nextItems = stripeSubscription.items.data.map((item) => ({
    price: item.id === primaryItem.id ? price.id : getStripeId(item.price),
    quantity: item.quantity || 1,
  }));

  await stripe.subscriptionSchedules.update(schedule.id, {
    end_behavior: 'release',
    phases: [
      {
        start_date: currentPeriodStart,
        end_date: currentPeriodEnd,
        items: currentItems,
      },
      {
        items: nextItems,
        iterations: 1,
        metadata: {
          pickupzone_plan_id: String(nextPlan.id),
          pickupzone_billing_interval: interval,
          pickupzone_school_id: String(subscription.school_id),
          pickupzone_subscription_id: String(subscription.id),
        },
      },
    ],
    metadata: {
      pickupzone_pending_plan_id: String(nextPlan.id),
      pickupzone_pending_billing_interval: interval,
      pickupzone_subscription_id: String(subscription.id),
    },
  });

  return {
    synced: true,
    mode: 'scheduled_downgrade',
    stripeScheduleId: schedule.id,
  };
};

const normalizePayment = (payment) => ({
  id: payment.id,
  amount: Number(payment.amount || 0),
  status: payment.status,
  method: payment.method,
  paymentDate: payment.payment_date,
  transactionId: payment.transaction_id,
  stripeInvoiceId: payment.stripe_invoice_id,
  invoiceNumber: payment.invoice_number,
  invoiceDueDate: payment.invoice_due_date,
  invoiceHostedUrl: payment.invoice_hosted_url,
  invoicePdfUrl: payment.invoice_pdf_url,
  billingReason: payment.billing_reason,
  failureReason: payment.failure_reason,
});

const normalizePlan = (plan) => ({
  id: plan.id,
  name: plan.name,
  monthlyPrice: Number(plan.monthly_price ?? plan.price ?? 0),
  yearlyPrice: Number(plan.yearly_price ?? 0),
  maxStudents: plan.max_students ?? null,
  maxFamilies: plan.max_families ?? null,
  maxGuards: plan.max_guards ?? null,
  storageLimitMb: plan.storage_limit_mb ?? null,
  gracePeriodDays: Number(plan.grace_period_days ?? 7),
  isActive: Boolean(plan.is_active),
});

const normalizeSubscription = (subscription) => {
  if (!subscription) return null;
  return {
    id: subscription.id,
    planId: subscription.plan_id,
    planName: subscription.plan_name,
    billingInterval: subscription.billing_interval || 'monthly',
    status: subscription.status || 'Inactive',
    startDate: subscription.start_date,
    endDate: subscription.end_date,
    nextBillingDate: subscription.next_billing_date,
    lastPaymentAmount: Number(subscription.last_payment_amount || 0),
    failedPaymentCount: Number(subscription.failed_payment_count || 0),
    lastPaymentFailedAt: subscription.last_payment_failed_at,
    gracePeriodEndsAt: subscription.grace_period_ends_at,
    gracePeriodDays: Number(subscription.grace_period_days ?? 7),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    cancelledAt: subscription.cancelled_at,
    pendingPlanId: subscription.pending_plan_id || null,
    pendingPlanName: subscription.pending_plan_name || null,
    pendingBillingInterval: subscription.pending_billing_interval || null,
    pendingChangeType: subscription.pending_change_type || null,
    pendingChangeEffectiveAt: subscription.pending_change_effective_at || null,
    latestInvoiceId: subscription.latest_invoice_id || null,
    hasStripeCustomer: Boolean(subscription.stripe_customer_id),
    hasStripeSubscription: Boolean(subscription.stripe_subscription_id),
  };
};

const getLatestPackageChange = async (schoolId) => {
  try {
    const [[change]] = await pool.execute(
      `SELECT
         log.change_type,
         log.from_billing_interval,
         log.to_billing_interval,
         log.effective_at,
         log.created_at,
         log.notes,
         from_plan.name AS from_plan_name,
         to_plan.name AS to_plan_name,
         actor.role AS created_by_role,
         TRIM(CONCAT(COALESCE(actor.firstName, ''), ' ', COALESCE(actor.lastName, ''))) AS created_by_name
       FROM subscription_change_logs log
       LEFT JOIN subscription_plans from_plan ON from_plan.id = log.from_plan_id
       LEFT JOIN subscription_plans to_plan ON to_plan.id = log.to_plan_id
       LEFT JOIN users actor ON actor.id = log.created_by
       WHERE log.school_id = ?
         AND log.change_type IN ('upgrade', 'downgrade', 'plan_change')
       ORDER BY log.created_at DESC, log.id DESC
       LIMIT 1`,
      [schoolId]
    );

    if (!change) return null;

    return {
      changeType: change.change_type,
      fromPlanName: change.from_plan_name || null,
      toPlanName: change.to_plan_name || null,
      fromBillingInterval: change.from_billing_interval || null,
      toBillingInterval: change.to_billing_interval || null,
      effectiveAt: change.effective_at || null,
      createdAt: change.created_at || null,
      notes: change.notes || null,
      createdByRole: change.created_by_role || null,
      createdByName: change.created_by_name || null,
    };
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_FIELD_ERROR') {
      return null;
    }
    throw err;
  }
};

exports.getBillingSummary = async (req, res) => {
  try {
    const schoolId = getAdminSchoolId(req);
    await refreshSubscriptionLifecycle(pool, schoolId);

    const subscription = await getLatestSubscription(pool, schoolId);
    const usage = await getSchoolUsage(pool, schoolId);
    const latestPackageChange = await getLatestPackageChange(schoolId);

    const [plans] = await pool.execute(
      `SELECT id, name, price, monthly_price, yearly_price, max_students, max_families, max_guards,
              storage_limit_mb, grace_period_days, is_active
       FROM subscription_plans
       WHERE is_active = 1
       ORDER BY monthly_price ASC, price ASC`
    );

    const [payments] = await pool.execute(
      `SELECT id, amount, status, method, payment_date, transaction_id, stripe_invoice_id,
              invoice_number, invoice_due_date, invoice_hosted_url, invoice_pdf_url,
              billing_reason, failure_reason
       FROM payments
       WHERE school_id = ?
       ORDER BY payment_date DESC, id DESC
       LIMIT 50`,
      [schoolId]
    );

    res.json({
      subscription: normalizeSubscription(subscription),
      usage,
      plans: plans.map(normalizePlan),
      payments: payments.map(normalizePayment),
      latestPackageChange,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.changePlan = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const schoolId = getAdminSchoolId(req);
    const planId = parseRequiredPlanId(req.body.plan_id ?? req.body.planId);
    const billingInterval = resolveBillingInterval(req.body.billing_interval ?? req.body.billingInterval);

    await refreshSubscriptionLifecycle(pool, schoolId);
    const subscription = await getLatestSubscription(pool, schoolId);
    if (!subscription) {
      throw createControllerError('No subscription record exists for this school.', 404);
    }

    const nextPlan = await getPlanById(pool, planId);
    if (!nextPlan || !Boolean(nextPlan.is_active)) {
      throw createControllerError('Selected package does not exist or is inactive.', 400);
    }

    await ensurePlanCanCoverSchool(pool, schoolId, planId);

    const interval = billingInterval || subscription.billing_interval || 'monthly';
    const currentPlan = await getPlanById(pool, subscription.plan_id);
    const currentAmount = planAmount(currentPlan, subscription.billing_interval);
    const nextAmount = planAmount(nextPlan, interval);
    const isSamePackage =
      Number(subscription.plan_id) === Number(planId) &&
      resolveBillingInterval(subscription.billing_interval) === interval;

    if (isSamePackage && !subscription.pending_plan_id) {
      return res.json({
        success: true,
        message: 'This package is already active.',
        mode: 'unchanged',
      });
    }

    if (subscription.status !== 'Active') {
      await connection.beginTransaction();
      const result = await changeSchoolPackage(connection, {
        schoolId,
        planId,
        billingInterval: interval,
        createdBy: req.user?.id || null,
        recordPendingProrationPayment: false,
      });
      await connection.commit();
      return res.json({
        success: true,
        checkoutRequired: true,
        message: 'Package selected. Complete Stripe checkout to activate billing.',
        ...result,
      });
    }

    if (!subscription.stripe_subscription_id) {
      throw createControllerError(
        'This subscription is not linked to Stripe. Please complete Stripe checkout before changing packages.',
        409
      );
    }

    const changeType = nextAmount < currentAmount
      ? 'downgrade'
      : nextAmount > currentAmount
        ? 'upgrade'
        : 'plan_change';

    const stripePlanChange = changeType === 'downgrade'
      ? await scheduleStripeSubscriptionDowngrade({
        subscription,
        nextPlan,
        billingInterval: interval,
      })
      : await updateStripeSubscriptionImmediately({
        subscription,
        nextPlan,
        billingInterval: interval,
        prorate: changeType === 'upgrade',
      });

    await connection.beginTransaction();
    const result = await changeSchoolPackage(connection, {
      schoolId,
      planId,
      billingInterval: interval,
      createdBy: req.user?.id || null,
      recordPendingProrationPayment: !stripePlanChange?.synced,
    });
    await connection.commit();

    res.json({
      success: true,
      message: result.mode === 'scheduled_downgrade'
        ? 'Downgrade scheduled for the next billing cycle.'
        : 'Subscription package updated.',
      stripe: stripePlanChange,
      ...result,
    });
  } catch (err) {
    await connection.rollback();
    res.status(err.statusCode || 500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

exports.cancelSubscription = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const schoolId = getAdminSchoolId(req);
    await refreshSubscriptionLifecycle(pool, schoolId);
    const subscription = await getLatestSubscription(pool, schoolId);
    if (!subscription) {
      throw createControllerError('Subscription not found.', 404);
    }

    if (subscription.stripe_subscription_id) {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
      const scheduleId = getStripeId(stripeSubscription.schedule);
      if (scheduleId) {
        await stripe.subscriptionSchedules.release(scheduleId);
      }

      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }

    await connection.beginTransaction();
    const result = await cancelSubscriptionRecord(connection, subscription.id, {
      immediate: false,
      createdBy: req.user?.id || null,
    });
    await connection.commit();

    res.json({
      success: true,
      message: 'Subscription cancellation scheduled for the end of the current billing period.',
      immediate: result.immediate,
    });
  } catch (err) {
    await connection.rollback();
    res.status(err.statusCode || 500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

exports.reactivateSubscription = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const schoolId = getAdminSchoolId(req);
    await refreshSubscriptionLifecycle(pool, schoolId);
    const subscription = await getLatestSubscription(pool, schoolId);
    if (!subscription) {
      throw createControllerError('Subscription not found.', 404);
    }

    if (!subscription.cancel_at_period_end) {
      throw createControllerError('This subscription is not scheduled for cancellation.', 400);
    }

    if (subscription.stripe_subscription_id) {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
      const scheduleId = getStripeId(stripeSubscription.schedule);
      if (scheduleId) {
        await stripe.subscriptionSchedules.release(scheduleId);
      }

      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: false,
      });
    }

    await connection.beginTransaction();
    await reactivateSubscriptionRecord(connection, subscription.id, {
      createdBy: req.user?.id || null,
    });
    await connection.commit();

    res.json({
      success: true,
      message: 'Auto-renewal resumed.',
    });
  } catch (err) {
    await connection.rollback();
    res.status(err.statusCode || 500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

exports.createPortalSession = async (req, res) => {
  try {
    const schoolId = getAdminSchoolId(req);
    const subscription = await getLatestSubscription(pool, schoolId);
    let customerId = subscription?.stripe_customer_id || null;

    if (!customerId && subscription?.stripe_subscription_id) {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
      customerId = getStripeId(stripeSubscription.customer);
    }

    if (!customerId) {
      throw createControllerError('No Stripe customer exists yet. Complete checkout before opening billing settings.', 400);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: buildClientUrl('/admin/billing?portal=returned'),
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};
