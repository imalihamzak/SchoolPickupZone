const pool = require('../config/db');

const LIMIT_CONFIG = {
  students: {
    field: 'max_students',
    usage: 'students',
    label: 'students',
  },
  families: {
    field: 'max_families',
    usage: 'families',
    label: 'families',
  },
  guards: {
    field: 'max_guards',
    usage: 'guards',
    label: 'guards',
  },
};

const VALID_INTERVALS = new Set(['monthly', 'yearly']);

const resolveBillingInterval = (value) => (value === 'yearly' ? 'yearly' : 'monthly');

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addBillingPeriod = (date, billingInterval) => {
  const nextDate = new Date(date);
  if (billingInterval === 'yearly') {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  } else {
    nextDate.setMonth(nextDate.getMonth() + 1);
  }
  return nextDate;
};

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + Number(days || 0));
  return nextDate;
};

const calculateElapsedDays = (startDate, now = new Date()) => {
  const date = toDate(startDate);
  if (!date) return 0;
  return Math.max(Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)), 0);
};

const earliestDate = (...values) => {
  const dates = values
    .map(toDate)
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime());
  return dates[0] || null;
};

const isPastOrNow = (value, now = new Date()) => {
  const date = toDate(value);
  return Boolean(date && date.getTime() <= now.getTime());
};

const createHttpError = (message, statusCode = 400, details = {}) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  Object.assign(error, details);
  return error;
};

const planAmount = (plan, billingInterval = 'monthly') => {
  if (!plan) return 0;
  const interval = resolveBillingInterval(billingInterval);
  const amount = interval === 'yearly'
    ? plan.yearly_price ?? plan.price
    : plan.monthly_price ?? plan.price;
  return Number(amount || 0);
};

const getUserSchoolId = async (executor, userId) => {
  if (!userId) return null;
  const [[user]] = await executor.execute(
    'SELECT school_id FROM users WHERE id = ?',
    [userId]
  );
  return user?.school_id || null;
};

const getLatestSubscription = async (executor, schoolId) => {
  if (!schoolId) return null;
  const [[subscription]] = await executor.execute(
    `SELECT
       s.*,
       p.name AS plan_name,
       p.price AS plan_price,
       p.monthly_price,
       p.yearly_price,
       p.max_students,
       p.max_families,
       p.max_guards,
       p.storage_limit_mb,
       p.feature_toggles,
       p.grace_period_days,
       p.is_active AS plan_is_active,
       pending.name AS pending_plan_name,
       pending.monthly_price AS pending_monthly_price,
       pending.yearly_price AS pending_yearly_price
     FROM subscriptions s
     LEFT JOIN subscription_plans p ON p.id = s.plan_id
     LEFT JOIN subscription_plans pending ON pending.id = s.pending_plan_id
     WHERE s.school_id = ?
     ORDER BY s.id DESC
     LIMIT 1`,
    [schoolId]
  );
  return subscription || null;
};

const getPlanById = async (executor, planId) => {
  if (!planId) return null;
  const [[plan]] = await executor.execute(
    'SELECT * FROM subscription_plans WHERE id = ?',
    [planId]
  );
  return plan || null;
};

const getSchoolUsage = async (executor, schoolId) => {
  const [[{ students }]] = await executor.execute(
    `SELECT COUNT(*) AS students
     FROM children c
     JOIN users parent_user ON parent_user.id = c.user_id
     WHERE parent_user.school_id = ?`,
    [schoolId]
  );

  const [[{ families }]] = await executor.execute(
    `SELECT COUNT(*) AS families
     FROM users
     WHERE school_id = ? AND role = 'parent'`,
    [schoolId]
  );

  const [[{ guards }]] = await executor.execute(
    `SELECT COUNT(*) AS guards
     FROM users
     WHERE school_id = ? AND role = 'guard'`,
    [schoolId]
  );

  return {
    students: Number(students || 0),
    families: Number(families || 0),
    guards: Number(guards || 0),
  };
};

const assertPlanCanCoverUsage = (plan, usage, resource = null, increment = 0) => {
  const checks = resource ? [resource] : Object.keys(LIMIT_CONFIG);

  checks.forEach((key) => {
    const config = LIMIT_CONFIG[key];
    const limit = plan?.[config.field];
    const currentUsage = Number(usage?.[config.usage] || 0);
    const nextUsage = currentUsage + (key === resource ? Number(increment || 0) : 0);

    if (limit !== null && limit !== undefined && nextUsage > Number(limit)) {
      throw createHttpError(
        `Package limit reached: ${config.label} usage would be ${nextUsage}/${limit}. Upgrade the school's package to continue.`,
        403,
        {
          code: 'PACKAGE_LIMIT_REACHED',
          resource: key,
          limit: Number(limit),
          usage: currentUsage,
          requested: Number(increment || 0),
        }
      );
    }
  });
};

const findPlanUsageConflicts = (plan, schoolRows) => {
  const conflicts = [];

  schoolRows.forEach((school) => {
    Object.entries(LIMIT_CONFIG).forEach(([key, config]) => {
      const limit = plan?.[config.field];
      if (limit === null || limit === undefined) return;

      const actualUsage = Number(school?.[config.usage] || 0);
      const plannedStudents = key === 'students' ? Number(school?.student_count || 0) : 0;
      const usage = key === 'students' ? Math.max(actualUsage, plannedStudents) : actualUsage;

      if (usage > Number(limit)) {
        conflicts.push({
          schoolId: school.id,
          schoolName: school.name,
          resource: key,
          label: config.label,
          usage,
          limit: Number(limit),
        });
      }
    });
  });

  return conflicts;
};

const assertPlanCanCoverAssignedSchools = async (executor, plan) => {
  if (!plan?.id) {
    throw createHttpError('Package id is required for limit validation.', 400);
  }

  const [schools] = await executor.execute(
    `SELECT
       s.id,
       s.name,
       COALESCE(s.student_count, 0) AS student_count,
       (
         SELECT COUNT(*)
         FROM children c
         JOIN users parent_user ON parent_user.id = c.user_id
         WHERE parent_user.school_id = s.id
       ) AS students,
       (
         SELECT COUNT(*)
         FROM users parent_user
         WHERE parent_user.school_id = s.id AND parent_user.role = 'parent'
       ) AS families,
       (
         SELECT COUNT(*)
         FROM users guard_user
         WHERE guard_user.school_id = s.id AND guard_user.role = 'guard'
       ) AS guards
     FROM schools s
     JOIN subscriptions sub ON sub.id = (
       SELECT sub2.id
       FROM subscriptions sub2
       WHERE sub2.school_id = s.id
       ORDER BY sub2.id DESC
       LIMIT 1
     )
     WHERE sub.plan_id = ? OR sub.pending_plan_id = ?`,
    [plan.id, plan.id]
  );

  const conflicts = findPlanUsageConflicts(plan, schools);
  if (conflicts.length) {
    const first = conflicts[0];
    throw createHttpError(
      `Cannot update package. ${first.schoolName} already uses ${first.usage}/${first.limit} ${first.label}. Raise the limit or move the school to another package first.`,
      403,
      {
        code: 'PACKAGE_LIMIT_CONFLICT',
        conflicts,
      }
    );
  }

  return { schoolsChecked: schools.length };
};

const ensureSchoolCanAdd = async (executor, schoolId, resource, increment = 1) => {
  if (!schoolId) {
    return { skipped: true, reason: 'No school assigned to this user.' };
  }

  const config = LIMIT_CONFIG[resource];
  if (!config) {
    throw createHttpError(`Unknown package resource "${resource}"`, 500);
  }

  await refreshSubscriptionLifecycle(executor, schoolId);

  const [[school]] = await executor.execute(
    'SELECT id, status FROM schools WHERE id = ?',
    [schoolId]
  );

  if (!school) {
    throw createHttpError('School not found.', 404);
  }

  if (school.status === 'Suspended') {
    throw createHttpError(
      'This school is suspended. Reactivate the school or subscription before adding new records.',
      403,
      { code: 'SCHOOL_SUSPENDED' }
    );
  }

  const subscription = await getLatestSubscription(executor, schoolId);
  if (!subscription?.plan_id) {
    throw createHttpError(
      'No package is assigned to this school. Assign a package before adding new records.',
      403,
      { code: 'PACKAGE_REQUIRED' }
    );
  }

  const plan = await getPlanById(executor, subscription.plan_id);
  if (!plan) {
    throw createHttpError('Assigned package was not found.', 404);
  }

  const usage = await getSchoolUsage(executor, schoolId);
  assertPlanCanCoverUsage(plan, usage, resource, increment);

  return { subscription, plan, usage };
};

const ensurePlanCanCoverSchool = async (executor, schoolId, planId) => {
  const plan = await getPlanById(executor, planId);
  if (!plan) {
    throw createHttpError('Selected package does not exist.', 400);
  }

  if (!Boolean(plan.is_active)) {
    throw createHttpError('Selected package is inactive and cannot be assigned.', 400);
  }

  const usage = await getSchoolUsage(executor, schoolId);
  assertPlanCanCoverUsage(plan, usage);
  return { plan, usage };
};

const recordSubscriptionChange = async (executor, change) => {
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
        proration_amount,
        notes,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        change.subscriptionId,
        change.schoolId,
        change.fromPlanId || null,
        change.toPlanId || null,
        change.fromBillingInterval || null,
        change.toBillingInterval || null,
        change.changeType,
        change.effectiveAt || null,
        Number(change.prorationAmount || 0),
        change.notes || null,
        change.createdBy || null,
      ]
    );
  } catch (err) {
    if (err.code !== 'ER_NO_SUCH_TABLE' && err.code !== 'ER_BAD_FIELD_ERROR') {
      throw err;
    }
  }
};

const calculateProrationAmount = (subscription, currentPlan, nextPlan, nextInterval) => {
  const currentAmount = planAmount(currentPlan, subscription.billing_interval);
  const nextAmount = planAmount(nextPlan, nextInterval);
  const difference = nextAmount - currentAmount;

  if (difference <= 0) return 0;

  const now = new Date();
  const periodEnd = toDate(subscription.end_date || subscription.next_billing_date);
  if (!periodEnd || periodEnd.getTime() <= now.getTime()) return Number(difference.toFixed(2));

  const periodStart = toDate(subscription.start_date) || (
    subscription.billing_interval === 'yearly'
      ? new Date(periodEnd.getFullYear() - 1, periodEnd.getMonth(), periodEnd.getDate())
      : new Date(periodEnd.getFullYear(), periodEnd.getMonth() - 1, periodEnd.getDate())
  );

  const totalMs = Math.max(periodEnd.getTime() - periodStart.getTime(), 1);
  const remainingMs = Math.max(periodEnd.getTime() - now.getTime(), 0);
  return Number((difference * (remainingMs / totalMs)).toFixed(2));
};

const addPendingProrationPayment = async (executor, subscription, nextPlan, prorationAmount) => {
  if (!prorationAmount || prorationAmount <= 0) return;

  await executor.execute(
    `INSERT INTO payments (
      school_id,
      plan_id,
      amount,
      method,
      status,
      payment_date,
      transaction_id,
      billing_reason
    ) VALUES (?, ?, ?, 'Credit Card', 'Pending', ?, ?, 'upgrade_proration')`,
    [
      subscription.school_id,
      nextPlan.id,
      prorationAmount,
      new Date(),
      `proration-${subscription.id}-${Date.now()}`,
    ]
  );
};

const changeSchoolPackage = async (
  executor,
  {
    schoolId,
    planId,
    billingInterval = 'monthly',
    createdBy = null,
    recordPendingProrationPayment = true,
  }
) => {
  const interval = resolveBillingInterval(billingInterval);
  const { plan: nextPlan } = await ensurePlanCanCoverSchool(executor, schoolId, planId);
  const subscription = await getLatestSubscription(executor, schoolId);

  if (!subscription) {
    const [result] = await executor.execute(
      `INSERT INTO subscriptions (school_id, plan_id, billing_interval, status)
       VALUES (?, ?, ?, 'Inactive')`,
      [schoolId, planId, interval]
    );

    await recordSubscriptionChange(executor, {
      subscriptionId: result.insertId,
      schoolId,
      toPlanId: planId,
      toBillingInterval: interval,
      changeType: 'plan_change',
      effectiveAt: new Date(),
      createdBy,
      notes: 'Initial package assignment.',
    });

    return { mode: 'created', subscriptionId: result.insertId };
  }

  const currentPlan = await getPlanById(executor, subscription.plan_id);
  const currentAmount = planAmount(currentPlan, subscription.billing_interval);
  const nextAmount = planAmount(nextPlan, interval);
  const isSamePackage =
    Number(subscription.plan_id) === Number(planId) &&
    resolveBillingInterval(subscription.billing_interval) === interval;

  if (isSamePackage && !subscription.pending_plan_id) {
    return { mode: 'unchanged', subscriptionId: subscription.id };
  }

  const activeNow = subscription.status === 'Active';
  const changeType = nextAmount < currentAmount ? 'downgrade' : nextAmount > currentAmount ? 'upgrade' : 'plan_change';

  if (activeNow && changeType === 'downgrade') {
    const effectiveAt = toDate(subscription.next_billing_date || subscription.end_date) || addBillingPeriod(new Date(), subscription.billing_interval);
    await executor.execute(
      `UPDATE subscriptions
       SET pending_plan_id = ?,
           pending_billing_interval = ?,
           pending_change_type = 'downgrade',
           pending_change_effective_at = ?
       WHERE id = ?`,
      [planId, interval, effectiveAt, subscription.id]
    );

    await recordSubscriptionChange(executor, {
      subscriptionId: subscription.id,
      schoolId,
      fromPlanId: subscription.plan_id,
      toPlanId: planId,
      fromBillingInterval: subscription.billing_interval,
      toBillingInterval: interval,
      changeType: 'downgrade',
      effectiveAt,
      createdBy,
      notes: 'Downgrade scheduled for the next billing cycle.',
    });

    return { mode: 'scheduled_downgrade', subscriptionId: subscription.id, effectiveAt };
  }

  const prorationAmount = activeNow && changeType === 'upgrade'
    ? calculateProrationAmount(subscription, currentPlan, nextPlan, interval)
    : 0;

  await executor.execute(
    `UPDATE subscriptions
     SET plan_id = ?,
         billing_interval = ?,
         last_payment_amount = CASE
           WHEN status = 'Active' THEN last_payment_amount
           ELSE last_payment_amount
         END,
         pending_plan_id = NULL,
         pending_billing_interval = NULL,
         pending_change_type = NULL,
         pending_change_effective_at = NULL
     WHERE id = ?`,
    [planId, interval, subscription.id]
  );

  if (recordPendingProrationPayment) {
    await addPendingProrationPayment(executor, subscription, nextPlan, prorationAmount);
  }
  await recordSubscriptionChange(executor, {
    subscriptionId: subscription.id,
    schoolId,
    fromPlanId: subscription.plan_id,
    toPlanId: planId,
    fromBillingInterval: subscription.billing_interval,
    toBillingInterval: interval,
    changeType,
    effectiveAt: new Date(),
    prorationAmount,
    createdBy,
    notes: prorationAmount > 0
      ? 'Upgrade applied immediately with pending prorated charge.'
      : 'Package change applied immediately.',
  });

  return { mode: changeType, subscriptionId: subscription.id, prorationAmount };
};

const applyPendingPlanChange = async (executor, subscription, now) => {
  if (!subscription.pending_plan_id || !isPastOrNow(subscription.pending_change_effective_at, now)) {
    return false;
  }

  const nextInterval = VALID_INTERVALS.has(subscription.pending_billing_interval)
    ? subscription.pending_billing_interval
    : subscription.billing_interval;
  const nextPlan = await getPlanById(executor, subscription.pending_plan_id);

  if (!nextPlan) {
    await executor.execute(
      `UPDATE subscriptions
       SET pending_plan_id = NULL,
           pending_billing_interval = NULL,
           pending_change_type = NULL,
           pending_change_effective_at = NULL
       WHERE id = ?`,
      [subscription.id]
    );
    return false;
  }

  await executor.execute(
    `UPDATE subscriptions
     SET plan_id = ?,
         billing_interval = ?,
         last_payment_amount = ?,
         pending_plan_id = NULL,
         pending_billing_interval = NULL,
         pending_change_type = NULL,
         pending_change_effective_at = NULL
     WHERE id = ?`,
    [nextPlan.id, nextInterval, planAmount(nextPlan, nextInterval), subscription.id]
  );

  await recordSubscriptionChange(executor, {
    subscriptionId: subscription.id,
    schoolId: subscription.school_id,
    fromPlanId: subscription.plan_id,
    toPlanId: nextPlan.id,
    fromBillingInterval: subscription.billing_interval,
    toBillingInterval: nextInterval,
    changeType: subscription.pending_change_type || 'plan_change',
    effectiveAt: now,
    notes: 'Scheduled package change applied.',
  });

  return true;
};

const markSchoolSuspended = async (executor, schoolId, reason) => {
  await executor.execute(
    `UPDATE schools
     SET status = 'Suspended',
         suspension_reason = ?,
         suspended_at = COALESCE(suspended_at, ?)
     WHERE id = ?`,
    [reason, new Date(), schoolId]
  );
};

const reactivateSchool = async (executor, schoolId) => {
  await executor.execute(
    `UPDATE schools
     SET status = 'Active',
         suspension_reason = NULL,
         suspended_at = NULL
     WHERE id = ?`,
    [schoolId]
  );
};

const applyExpirationRules = async (executor, subscription, now) => {
  const endDate = toDate(subscription.end_date || subscription.next_billing_date);
  if (!endDate || endDate.getTime() > now.getTime()) return;

  if (subscription.cancel_at_period_end || subscription.status === 'Cancelled') {
    await executor.execute(
      `UPDATE subscriptions
       SET status = 'Cancelled',
           cancelled_at = COALESCE(cancelled_at, ?)
       WHERE id = ?`,
      [now, subscription.id]
    );
    await markSchoolSuspended(executor, subscription.school_id, 'Subscription cancelled at period end.');
    await recordSubscriptionChange(executor, {
      subscriptionId: subscription.id,
      schoolId: subscription.school_id,
      fromPlanId: subscription.plan_id,
      fromBillingInterval: subscription.billing_interval,
      changeType: 'cancel',
      effectiveAt: now,
      notes: 'Cancellation became effective at the period end.',
    });
    return;
  }

  if (subscription.status !== 'Active' && subscription.status !== 'Expiring Soon') return;

  const gracePeriodDays = Number(subscription.grace_period_days ?? 7);
  const graceEnd = toDate(subscription.grace_period_ends_at) || addDays(endDate, gracePeriodDays);

  if (graceEnd.getTime() > now.getTime()) {
    await executor.execute(
      `UPDATE subscriptions
       SET status = 'Expiring Soon',
           grace_period_ends_at = ?
       WHERE id = ?`,
      [graceEnd, subscription.id]
    );
    return;
  }

  await executor.execute(
    `UPDATE subscriptions
     SET status = 'Inactive',
         grace_period_ends_at = ?
     WHERE id = ?`,
    [graceEnd, subscription.id]
  );
  await markSchoolSuspended(executor, subscription.school_id, 'Subscription grace period expired.');
  await recordSubscriptionChange(executor, {
    subscriptionId: subscription.id,
    schoolId: subscription.school_id,
    fromPlanId: subscription.plan_id,
    fromBillingInterval: subscription.billing_interval,
    changeType: 'auto_suspend',
    effectiveAt: now,
    notes: 'School auto-suspended after subscription grace period expired.',
  });
};

const applyOnboardingGraceRules = async (executor, subscription, now) => {
  if (subscription.status !== 'Inactive') return;
  if (
    subscription.stripe_subscription_id ||
    subscription.start_date ||
    subscription.end_date ||
    subscription.next_billing_date ||
    Number(subscription.last_payment_amount || 0) > 0
  ) {
    return;
  }

  const gracePeriodDays = Math.max(Number(subscription.grace_period_days ?? 7), 0);
  const onboardingStartedAt =
    toDate(subscription.first_admin_created_at) ||
    toDate(subscription.school_created_at) ||
    now;
  const graceEnd = addDays(onboardingStartedAt, gracePeriodDays);
  const elapsedDays = calculateElapsedDays(onboardingStartedAt, now);

  await executor.execute(
    `UPDATE subscriptions
     SET grace_period_ends_at = ?
     WHERE id = ?`,
    [graceEnd, subscription.id]
  );

  if (elapsedDays < gracePeriodDays) {
    if (
      subscription.school_status === 'Suspended' &&
      subscription.school_suspension_reason === 'Subscription grace period expired.'
    ) {
      await reactivateSchool(executor, subscription.school_id);
    }
    return;
  }

  if (subscription.school_status === 'Suspended') return;

  await markSchoolSuspended(executor, subscription.school_id, 'Subscription grace period expired.');
  await recordSubscriptionChange(executor, {
    subscriptionId: subscription.id,
    schoolId: subscription.school_id,
    fromPlanId: subscription.plan_id,
    fromBillingInterval: subscription.billing_interval,
    changeType: 'auto_suspend',
    effectiveAt: now,
    notes: 'School auto-suspended after unpaid onboarding grace period expired.',
  });
};

const refreshSubscriptionLifecycle = async (executor = pool, schoolId = null) => {
  const params = [];
  const where = schoolId ? 'WHERE s.school_id = ?' : '';
  if (schoolId) params.push(schoolId);

  const [subscriptions] = await executor.execute(
    `SELECT
       s.*,
       sch.created_at AS school_created_at,
       sch.status AS school_status,
       sch.suspension_reason AS school_suspension_reason,
       first_admin.created_at AS first_admin_created_at,
       p.grace_period_days,
       p.monthly_price,
       p.yearly_price,
       p.price
     FROM subscriptions s
     LEFT JOIN schools sch ON sch.id = s.school_id
     LEFT JOIN (
       SELECT school_id, MIN(created_at) AS created_at
       FROM users
       WHERE role = 'admin'
       GROUP BY school_id
     ) first_admin ON first_admin.school_id = s.school_id
     LEFT JOIN subscription_plans p ON p.id = s.plan_id
     ${where}
     ORDER BY s.id ASC`,
    params
  );

  const now = new Date();
  for (const subscription of subscriptions) {
    const changed = await applyPendingPlanChange(executor, subscription, now);
    const current = changed ? await getLatestSubscription(executor, subscription.school_id) : subscription;
    await applyOnboardingGraceRules(executor, current || subscription, now);
    await applyExpirationRules(executor, current || subscription, now);
  }
};

let subscriptionLifecycleWorkerStarted = false;
const startSubscriptionLifecycleWorker = () => {
  if (
    subscriptionLifecycleWorkerStarted ||
    process.env.ENABLE_SUBSCRIPTION_LIFECYCLE_WORKER === 'false'
  ) {
    return;
  }

  subscriptionLifecycleWorkerStarted = true;
  const intervalMinutes = Math.max(
    Number(process.env.SUBSCRIPTION_LIFECYCLE_WORKER_INTERVAL_MINUTES || 15),
    1
  );

  const runWorker = async () => {
    try {
      await refreshSubscriptionLifecycle(pool);
    } catch (err) {
      console.error('Subscription lifecycle worker failed:', err.message);
    }
  };

  const timer = setInterval(runWorker, intervalMinutes * 60 * 1000);
  if (typeof timer.unref === 'function') timer.unref();
  runWorker();
};

const markSubscriptionPaymentSucceeded = async (
  executor,
  {
    subscriptionId,
    schoolId,
    planId,
    billingInterval,
    amount,
    transactionId,
    stripeInvoiceId = null,
    stripePaymentIntentId = null,
    stripeEventId = null,
    stripeChargeId = null,
    invoiceNumber = null,
    invoiceDueDate = null,
    invoiceHostedUrl = null,
    invoicePdfUrl = null,
    attemptCount = null,
    stripeSubscriptionId = null,
    stripeCustomerId = null,
    stripeStatus = null,
    billingReason = 'subscription_cycle',
  }
) => {
  const now = new Date();
  const interval = resolveBillingInterval(billingInterval);
  const endDate = addBillingPeriod(now, interval);

  await executor.execute(
    `INSERT INTO payments (
      school_id,
      plan_id,
      amount,
      method,
      status,
      payment_date,
      transaction_id,
      stripe_invoice_id,
      stripe_payment_intent_id,
      stripe_event_id,
      stripe_charge_id,
      invoice_number,
      invoice_due_date,
      invoice_hosted_url,
      invoice_pdf_url,
      attempt_count,
      billing_reason
    ) VALUES (?, ?, ?, 'Credit Card', 'Successful', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      schoolId,
      planId,
      Number(amount || 0),
      now,
      transactionId || stripeInvoiceId || `payment-${Date.now()}`,
      stripeInvoiceId,
      stripePaymentIntentId,
      stripeEventId,
      stripeChargeId,
      invoiceNumber,
      invoiceDueDate,
      invoiceHostedUrl,
      invoicePdfUrl,
      attemptCount,
      billingReason,
    ]
  );

  if (subscriptionId) {
    await executor.execute(
      `UPDATE subscriptions
       SET plan_id = ?,
           billing_interval = ?,
           status = 'Active',
           start_date = COALESCE(start_date, ?),
           end_date = ?,
           next_billing_date = ?,
           last_payment_amount = ?,
           stripe_subscription_id = COALESCE(?, stripe_subscription_id),
           stripe_customer_id = COALESCE(?, stripe_customer_id),
           stripe_status = COALESCE(?, stripe_status),
           latest_invoice_id = COALESCE(?, latest_invoice_id),
           failed_payment_count = 0,
           last_payment_failed_at = NULL,
           grace_period_ends_at = NULL,
           cancel_at_period_end = 0,
           cancelled_at = NULL
       WHERE id = ?`,
      [
        planId,
        interval,
        now,
        endDate,
        endDate,
        Number(amount || 0),
        stripeSubscriptionId,
        stripeCustomerId,
        stripeStatus,
        stripeInvoiceId,
        subscriptionId,
      ]
    );
  }

  await reactivateSchool(executor, schoolId);
  return { endDate };
};

const markSubscriptionPaymentFailed = async (
  executor,
  {
    subscriptionId,
    schoolId,
    planId,
    amount,
    transactionId,
    stripeInvoiceId = null,
    stripePaymentIntentId = null,
    stripeEventId = null,
    stripeChargeId = null,
    invoiceNumber = null,
    invoiceDueDate = null,
    invoiceHostedUrl = null,
    invoicePdfUrl = null,
    attemptCount = null,
    failureReason = null,
  }
) => {
  const now = new Date();
  const subscription = subscriptionId
    ? await getSubscriptionById(executor, subscriptionId)
    : await getLatestSubscription(executor, schoolId);
  const effectiveSchoolId = schoolId || subscription?.school_id;
  const effectivePlanId = planId || subscription?.plan_id;

  if (!subscription || !effectiveSchoolId || !effectivePlanId) {
    throw createHttpError('Subscription not found for failed payment.', 404);
  }

  const graceEnd = addDays(now, Number(subscription.grace_period_days ?? 7));

  await executor.execute(
    `INSERT INTO payments (
      school_id,
      plan_id,
      amount,
      method,
      status,
      payment_date,
      transaction_id,
      stripe_invoice_id,
      stripe_payment_intent_id,
      stripe_event_id,
      stripe_charge_id,
      invoice_number,
      invoice_due_date,
      invoice_hosted_url,
      invoice_pdf_url,
      attempt_count,
      billing_reason,
      failure_reason
    ) VALUES (?, ?, ?, 'Credit Card', 'Failed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'failed_retry', ?)`,
    [
      effectiveSchoolId,
      effectivePlanId,
      Number(amount || 0),
      now,
      transactionId || (stripeEventId ? `${stripeInvoiceId || 'invoice'}:${stripeEventId}` : stripeInvoiceId) || `failed-${Date.now()}`,
      stripeInvoiceId,
      stripePaymentIntentId,
      stripeEventId,
      stripeChargeId,
      invoiceNumber,
      invoiceDueDate,
      invoiceHostedUrl,
      invoicePdfUrl,
      attemptCount,
      failureReason,
    ]
  );

  await executor.execute(
    `UPDATE subscriptions
     SET status = 'Expiring Soon',
         latest_invoice_id = COALESCE(?, latest_invoice_id),
         failed_payment_count = failed_payment_count + 1,
         last_payment_failed_at = ?,
         grace_period_ends_at = COALESCE(grace_period_ends_at, ?)
     WHERE id = ?`,
    [stripeInvoiceId, now, graceEnd, subscription.id]
  );

  await recordSubscriptionChange(executor, {
    subscriptionId: subscription.id,
    schoolId: effectiveSchoolId,
    fromPlanId: effectivePlanId,
    fromBillingInterval: subscription.billing_interval,
    changeType: 'payment_failed',
    effectiveAt: now,
    notes: failureReason || 'Payment failed. Grace period started.',
  });

  await refreshSubscriptionLifecycle(executor, effectiveSchoolId);
};

const getSubscriptionById = async (executor, subscriptionId) => {
  const [[subscription]] = await executor.execute(
    `SELECT s.*, p.grace_period_days, p.monthly_price, p.yearly_price, p.price
     FROM subscriptions s
     LEFT JOIN subscription_plans p ON p.id = s.plan_id
     WHERE s.id = ?`,
    [subscriptionId]
  );
  return subscription || null;
};

const cancelSubscriptionRecord = async (
  executor,
  subscriptionId,
  {
    immediate = false,
    createdBy = null,
  } = {}
) => {
  const subscription = await getSubscriptionById(executor, subscriptionId);
  if (!subscription) {
    throw createHttpError('Subscription not found.', 404);
  }

  const now = new Date();

  if (immediate) {
    await executor.execute(
      `UPDATE subscriptions
       SET status = 'Cancelled',
           end_date = ?,
           next_billing_date = ?,
           cancel_at_period_end = 0,
           cancelled_at = ?,
           pending_plan_id = NULL,
           pending_billing_interval = NULL,
           pending_change_type = NULL,
           pending_change_effective_at = NULL
       WHERE id = ?`,
      [now, now, now, subscriptionId]
    );
    await markSchoolSuspended(executor, subscription.school_id, 'Subscription cancelled.');
  } else {
    const effectiveAt = toDate(subscription.end_date || subscription.next_billing_date) || now;
    await executor.execute(
      `UPDATE subscriptions
       SET status = 'Cancelled',
           cancel_at_period_end = 1,
           cancelled_at = ?,
           end_date = COALESCE(end_date, ?),
           next_billing_date = COALESCE(next_billing_date, ?),
           pending_plan_id = NULL,
           pending_billing_interval = NULL,
           pending_change_type = NULL,
           pending_change_effective_at = NULL
       WHERE id = ?`,
      [now, effectiveAt, effectiveAt, subscriptionId]
    );
  }

  await recordSubscriptionChange(executor, {
    subscriptionId,
    schoolId: subscription.school_id,
    fromPlanId: subscription.plan_id,
    fromBillingInterval: subscription.billing_interval,
    changeType: 'cancel',
    effectiveAt: immediate ? now : toDate(subscription.end_date || subscription.next_billing_date) || now,
    createdBy,
    notes: immediate ? 'Subscription cancelled immediately.' : 'Subscription cancellation scheduled for period end.',
  });

  return { subscription, immediate };
};

const reactivateSubscriptionRecord = async (
  executor,
  subscriptionId,
  {
    createdBy = null,
  } = {}
) => {
  const subscription = await getSubscriptionById(executor, subscriptionId);
  if (!subscription) {
    throw createHttpError('Subscription not found.', 404);
  }

  const plan = await getPlanById(executor, subscription.plan_id);
  const now = new Date();
  const interval = resolveBillingInterval(subscription.billing_interval);
  const endDate = toDate(subscription.end_date);
  const nextEndDate = endDate && endDate.getTime() > now.getTime()
    ? endDate
    : addBillingPeriod(now, interval);

  await executor.execute(
    `UPDATE subscriptions
     SET status = 'Active',
         start_date = COALESCE(start_date, ?),
         end_date = ?,
         next_billing_date = ?,
         last_payment_amount = COALESCE(last_payment_amount, ?),
         failed_payment_count = 0,
         last_payment_failed_at = NULL,
         grace_period_ends_at = NULL,
         cancel_at_period_end = 0,
         cancelled_at = NULL
     WHERE id = ?`,
    [
      now,
      nextEndDate,
      nextEndDate,
      planAmount(plan, interval),
      subscriptionId,
    ]
  );

  await reactivateSchool(executor, subscription.school_id);
  await recordSubscriptionChange(executor, {
    subscriptionId,
    schoolId: subscription.school_id,
    fromPlanId: subscription.plan_id,
    toPlanId: subscription.plan_id,
    fromBillingInterval: subscription.billing_interval,
    toBillingInterval: subscription.billing_interval,
    changeType: 'reactivate',
    effectiveAt: now,
    createdBy,
    notes: 'Subscription reactivated.',
  });

  return { subscription, endDate: nextEndDate };
};

module.exports = {
  addBillingPeriod,
  assertPlanCanCoverAssignedSchools,
  cancelSubscriptionRecord,
  changeSchoolPackage,
  createHttpError,
  ensurePlanCanCoverSchool,
  ensureSchoolCanAdd,
  getLatestSubscription,
  getPlanById,
  getSchoolUsage,
  getSubscriptionById,
  getUserSchoolId,
  markSubscriptionPaymentFailed,
  markSubscriptionPaymentSucceeded,
  planAmount,
  reactivateSubscriptionRecord,
  refreshSubscriptionLifecycle,
  resolveBillingInterval,
  startSubscriptionLifecycleWorker,
};
