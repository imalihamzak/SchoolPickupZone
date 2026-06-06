const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const sendAdminInviteEmail = require('../utils/sendAdminInviteEmail');
const stripe = require('../utils/stripe');
const { assertUserContactAvailable } = require('../services/userContactService');
const {
  assertPlanCanCoverAssignedSchools,
  cancelSubscriptionRecord,
  changeSchoolPackage,
  ensurePlanCanCoverSchool,
  getLatestSubscription,
  getPlanById,
  getSubscriptionById,
  planAmount,
  reactivateSubscriptionRecord,
  refreshSubscriptionLifecycle,
  resolveBillingInterval,
} = require('../services/subscriptionService');
const DEFAULT_FEATURE_TOGGLES = {
  qr_verification: true,
  guardian_management: true,
  pickup_logs: true,
  analytics: false,
  document_uploads: true,
  notifications: true,
  device_authorization: true,
};

const parseCurrency = (value, fieldName) => {
  const normalized = value === '' || value === undefined || value === null ? 0 : Number(value);
  if (!Number.isFinite(normalized) || normalized < 0) {
    const error = new Error(`${fieldName} must be a non-negative number`);
    error.statusCode = 400;
    throw error;
  }
  return normalized;
};

const parseLimit = (value, fieldName) => {
  if (value === undefined || value === null || value === '' || value === 'unlimited') return null;
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized < 0) {
    const error = new Error(`${fieldName} must be a whole number or unlimited`);
    error.statusCode = 400;
    throw error;
  }
  return normalized;
};

const parsePositiveInteger = (value, fieldName, fallback = 0) => {
  const raw = value === undefined || value === null || value === '' ? fallback : value;
  const normalized = Number(raw);
  if (!Number.isInteger(normalized) || normalized < 0) {
    const error = new Error(`${fieldName} must be a non-negative whole number`);
    error.statusCode = 400;
    throw error;
  }
  return normalized;
};

const parseFeatures = (features) => {
  if (Array.isArray(features)) {
    return features.map((feature) => String(feature).trim()).filter(Boolean);
  }
  if (!features) return [];
  return String(features)
    .split(',')
    .map((feature) => feature.trim())
    .filter(Boolean);
};

const parseFeatureToggles = (toggles) => {
  let parsed = toggles;
  if (typeof toggles === 'string' && toggles.trim()) {
    try {
      parsed = JSON.parse(toggles);
    } catch (_err) {
      parsed = {};
    }
  }

  return Object.keys(DEFAULT_FEATURE_TOGGLES).reduce((acc, key) => {
    acc[key] = Boolean(parsed?.[key] ?? DEFAULT_FEATURE_TOGGLES[key]);
    return acc;
  }, {});
};

const buildPackagePayload = (body) => {
  const name = String(body.name || '').trim();
  if (!name) {
    const error = new Error('Package name is required');
    error.statusCode = 400;
    throw error;
  }

  const monthlyPrice = parseCurrency(
    body.monthly_price ?? body.monthlyPrice ?? body.price,
    'Monthly price'
  );
  const yearlyPrice = parseCurrency(
    body.yearly_price ?? body.yearlyPrice ?? body.price,
    'Yearly price'
  );

  return {
    name,
    monthlyPrice,
    yearlyPrice,
    maxStudents: parseLimit(body.max_students ?? body.maxStudents, 'Maximum students'),
    maxFamilies: parseLimit(body.max_families ?? body.maxFamilies, 'Maximum families'),
    maxGuards: parseLimit(body.max_guards ?? body.maxGuards, 'Maximum guards'),
    storageLimitMb: parseLimit(body.storage_limit_mb ?? body.storageLimitMb, 'Storage limit'),
    gracePeriodDays: parsePositiveInteger(
      body.grace_period_days ?? body.gracePeriodDays,
      'Grace period days',
      7
    ),
    features: parseFeatures(body.features).join(', '),
    featureToggles: JSON.stringify(parseFeatureToggles(body.feature_toggles ?? body.featureToggles)),
    isActive: body.is_active === undefined && body.isActive === undefined
      ? 1
      : Number(Boolean(body.is_active ?? body.isActive)),
  };
};

const formatPackage = (row) => {
  const monthlyPrice = Number(row.monthly_price ?? (row.billing_interval === 'monthly' ? row.price : row.price ?? 0));
  const yearlyPrice = Number(row.yearly_price ?? (row.billing_interval === 'yearly' ? row.price : 0));

  return {
    ...row,
    price: monthlyPrice || Number(row.price || 0),
    interval: row.billing_interval || 'monthly',
    monthly_price: monthlyPrice,
    yearly_price: yearlyPrice,
    max_students: row.max_students ?? null,
    max_families: row.max_families ?? null,
    max_guards: row.max_guards ?? null,
    storage_limit_mb: row.storage_limit_mb ?? null,
    grace_period_days: Number(row.grace_period_days ?? 7),
    features: parseFeatures(row.features),
    feature_toggles: parseFeatureToggles(row.feature_toggles),
    is_active: Boolean(row.is_active ?? true),
  };
};

const assignPlanToSchool = async (connection, schoolId, planId, billingInterval = 'monthly') => {
  return changeSchoolPackage(connection, {
    schoolId,
    planId,
    billingInterval,
  });
};

const parseRequiredPlanId = (value) => {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized <= 0) {
    const error = new Error('A subscription package is required for every school.');
    error.statusCode = 400;
    throw error;
  }
  return normalized;
};

const validateSchoolStudentCountForPlan = async (connection, {
  schoolId = null,
  planId = null,
  studentCount = 0,
}) => {
  const count = parsePositiveInteger(studentCount, 'Number of students', 0);
  let effectivePlanId = planId;

  if (!effectivePlanId && schoolId) {
    const subscription = await getLatestSubscription(connection, schoolId);
    effectivePlanId = subscription?.plan_id || null;
  }

  if (!effectivePlanId) return count;

  const plan = await getPlanById(connection, effectivePlanId);
  if (!plan) {
    const error = new Error('Selected package does not exist');
    error.statusCode = 400;
    throw error;
  }

  if (plan.max_students !== null && plan.max_students !== undefined && count > Number(plan.max_students)) {
    const error = new Error(
      `Selected package allows ${plan.max_students} students, but this school has ${count}. Choose a higher package or lower the student count.`
    );
    error.statusCode = 403;
    throw error;
  }

  return count;
};

const getStripeId = (value) => {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
};

const createControllerError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
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

const resolvePlanChangeContext = async ({ subscription, nextPlan, billingInterval }) => {
  const interval = resolveBillingInterval(billingInterval || subscription.billing_interval);
  const currentPlan = await getPlanById(pool, subscription.plan_id);
  const currentAmount = planAmount(currentPlan, subscription.billing_interval);
  const nextAmount = planAmount(nextPlan, interval);
  const isSamePackage =
    Number(subscription.plan_id) === Number(nextPlan.id) &&
    resolveBillingInterval(subscription.billing_interval) === interval;
  const changeType = nextAmount < currentAmount
    ? 'downgrade'
    : nextAmount > currentAmount
      ? 'upgrade'
      : 'plan_change';

  return {
    interval,
    currentPlan,
    currentAmount,
    nextAmount,
    isSamePackage,
    changeType,
  };
};

const syncStripePlanChangeForActiveSubscription = async ({
  subscription,
  nextPlan,
  billingInterval,
}) => {
  const context = await resolvePlanChangeContext({ subscription, nextPlan, billingInterval });

  if (subscription.status !== 'Active' || context.isSamePackage) {
    return { ...context, stripePlanChange: null };
  }

  if (!subscription.stripe_subscription_id) {
    throw createControllerError(
      'This active subscription is not linked to Stripe, so its package cannot be changed with real billing. Ask the school to subscribe through Stripe first.',
      409
    );
  }

  const stripePlanChange = context.changeType === 'downgrade'
    ? await scheduleStripeSubscriptionDowngrade({
      subscription,
      nextPlan,
      billingInterval: context.interval,
    })
    : await updateStripeSubscriptionImmediately({
      subscription,
      nextPlan,
      billingInterval: context.interval,
      prorate: context.changeType === 'upgrade',
    });

  return { ...context, stripePlanChange };
};

// GET all schools with subscription info
exports.getAllSchools = async (req, res) => {
  try {
    await refreshSubscriptionLifecycle(pool);

    const [rows] = await pool.execute(`
      SELECT
        s.id,
        s.name,
        s.location,
        s.student_count,
        s.status,
        s.suspension_reason,
        s.suspended_at,
        sub.plan_id,
        sub.billing_interval,
        plan.name AS plan_name,
        sub.status AS subscription_status,
        sub.next_billing_date,
        sub.end_date,
        sub.cancel_at_period_end,
        sub.pending_plan_id,
        sub.pending_billing_interval,
        sub.pending_change_type,
        sub.pending_change_effective_at,
        plan.max_students,
        plan.max_families,
        plan.max_guards,
        pending_plan.name AS pending_plan_name,
        (
          SELECT COUNT(*)
          FROM children c
          JOIN users parent_user ON parent_user.id = c.user_id
          WHERE parent_user.school_id = s.id
        ) AS used_students,
        (
          SELECT COUNT(*)
          FROM users parent_user
          WHERE parent_user.school_id = s.id AND parent_user.role = 'parent'
        ) AS used_families,
        (
          SELECT COUNT(*)
          FROM users guard_user
          WHERE guard_user.school_id = s.id AND guard_user.role = 'guard'
        ) AS used_guards
      FROM schools s
      LEFT JOIN subscriptions sub ON sub.id = (
        SELECT s2.id
        FROM subscriptions s2
        WHERE s2.school_id = s.id
        ORDER BY s2.id DESC
        LIMIT 1
      )
      LEFT JOIN subscription_plans plan ON plan.id = sub.plan_id
      LEFT JOIN subscription_plans pending_plan ON pending_plan.id = sub.pending_plan_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST new school
exports.createSchool = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { name, location, student_count, plan_id, billing_interval } = req.body;
    const normalizedPlanId = parseRequiredPlanId(plan_id);

    if (!name?.trim()) {
      return res.status(400).json({ error: 'School name is required' });
    }

    await connection.beginTransaction();
    const normalizedStudentCount = await validateSchoolStudentCountForPlan(connection, {
      planId: normalizedPlanId,
      studentCount: student_count,
    });

    const [result] = await connection.execute(
      `INSERT INTO schools (name, location, student_count) VALUES (?, ?, ?)`,
      [name.trim(), location || null, normalizedStudentCount]
    );

    await assignPlanToSchool(connection, result.insertId, normalizedPlanId, billing_interval);
    await connection.commit();

    res.status(201).json({ message: 'School created', id: result.insertId });
  } catch (err) {
    await connection.rollback();
    res.status(err.statusCode || 500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

// PUT update school
exports.updateSchool = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { name, location, student_count, plan_id, billing_interval } = req.body;
    const { id } = req.params;
    const hasPlanChange = Object.prototype.hasOwnProperty.call(req.body, 'plan_id');
    const normalizedPlanId = hasPlanChange ? parseRequiredPlanId(plan_id) : null;
    let effectiveBillingInterval = billing_interval;
    let stripePlanChange = null;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'School name is required' });
    }

    if (hasPlanChange) {
      const nextPlan = await getPlanById(pool, normalizedPlanId);
      if (!nextPlan || !Boolean(nextPlan.is_active)) {
        return res.status(400).json({ error: 'Selected package does not exist or is inactive.' });
      }

      await validateSchoolStudentCountForPlan(pool, {
        schoolId: id,
        planId: normalizedPlanId,
        studentCount: student_count,
      });
      await ensurePlanCanCoverSchool(pool, id, normalizedPlanId);
      const currentSubscription = await getLatestSubscription(pool, id);
      effectiveBillingInterval = billing_interval || currentSubscription?.billing_interval || 'monthly';
      if (currentSubscription) {
        const stripeContext = await syncStripePlanChangeForActiveSubscription({
          subscription: currentSubscription,
          nextPlan,
          billingInterval: effectiveBillingInterval,
        });
        stripePlanChange = stripeContext.stripePlanChange;
      }
    }

    await connection.beginTransaction();
    const normalizedStudentCount = await validateSchoolStudentCountForPlan(connection, {
      schoolId: id,
      planId: normalizedPlanId,
      studentCount: student_count,
    });

    await connection.execute(
      `UPDATE schools SET name = ?, location = ?, student_count = ? WHERE id = ?`,
      [name.trim(), location || null, normalizedStudentCount, id]
    );

    if (hasPlanChange) {
      await changeSchoolPackage(connection, {
        schoolId: id,
        planId: normalizedPlanId,
        billingInterval: effectiveBillingInterval,
        createdBy: req.user?.id || null,
        recordPendingProrationPayment: !stripePlanChange?.synced,
      });
    }

    await connection.commit();
    res.json({ message: 'School updated', stripe: stripePlanChange });
  } catch (err) {
    await connection.rollback();
    res.status(err.statusCode || 500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

// DELETE school
exports.deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute(`DELETE FROM schools WHERE id = ?`, [id]);
    res.json({ message: 'School deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSchoolStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = req.body.status === 'Suspended' ? 'Suspended' : 'Active';
    const reason = status === 'Suspended' ? (req.body.reason || null) : null;

    await pool.execute(
      `UPDATE schools
       SET status = ?, suspension_reason = ?, suspended_at = ?
       WHERE id = ?`,
      [status, reason, status === 'Suspended' ? new Date() : null, id]
    );

    res.json({
      message: status === 'Suspended' ? 'School suspended' : 'School reactivated',
      status,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};





// GET all admins with school info and subscription status
exports.getAllAdmins = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        u.id,
        u.firstName,
        u.lastName,
        u.email,
        u.status,
        u.created_at,
        s.name AS school_name,
        s.location,
        sub.status AS subscription_status,
        sub.next_billing_date
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      LEFT JOIN subscriptions sub ON sub.id = (
        SELECT sub2.id
        FROM subscriptions sub2
        WHERE sub2.school_id = s.id
        ORDER BY sub2.id DESC
        LIMIT 1
      )
      WHERE u.role = 'admin'
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.createAdmin = async (req, res) => {
    try {
      const { firstName, lastName, email, phone, school_id } = req.body;

      if (!firstName || !email || !school_id) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      await assertUserContactAvailable(pool, { email, phone });

      const [userResult] = await pool.execute(
        `INSERT INTO users (role, firstName, lastName, email, phone, status, school_id)
         VALUES ('admin', ?, ?, ?, ?, 'pending', ?)`,
        [firstName, lastName, email, phone || null, school_id]
      );

      const resetToken = uuidv4();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await pool.execute(
        `INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)`,
        [email, resetToken, expiresAt]
      );

      res.status(201).json({
        message: 'Admin created. Email is being sent in background.',
        id: userResult.insertId,
      });

      await sendAdminInviteEmail({ to: email, token: resetToken, firstName });

    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Email already exists' });
      }
      console.error('Create Admin Error:', err);
      // If response already sent, can't send another
      if (!res.headersSent) {
        res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : 'Server error while creating admin' });
      }
    }
  };

exports.resendAdminInvite = async (req, res) => {
  const { id } = req.params;
  let resetToken;
  let adminEmail;
  let inviteSent = false;

  try {
    const [admins] = await pool.execute(
      `SELECT id, firstName, lastName, email
       FROM users
       WHERE id = ? AND role = 'admin'
       LIMIT 1`,
      [id]
    );

    if (!admins.length) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const admin = admins[0];
    adminEmail = admin.email;

    if (!adminEmail) {
      return res.status(400).json({ error: 'Admin does not have an email address' });
    }

    resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.execute(
      `INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)`,
      [adminEmail, resetToken, expiresAt]
    );

    await sendAdminInviteEmail({
      to: adminEmail,
      token: resetToken,
      firstName: admin.firstName || 'Admin',
    });
    inviteSent = true;

    try {
      await pool.execute(
        `DELETE FROM password_resets WHERE email = ? AND token <> ?`,
        [adminEmail, resetToken]
      );
    } catch (cleanupErr) {
      console.error('Failed to clean up older admin invite tokens:', cleanupErr);
    }

    res.json({
      message: 'Admin invite email resent successfully',
      id: admin.id,
      email: adminEmail,
    });
  } catch (err) {
    if (resetToken && adminEmail && !inviteSent) {
      try {
        await pool.execute(
          `DELETE FROM password_resets WHERE email = ? AND token = ?`,
          [adminEmail, resetToken]
        );
      } catch (cleanupErr) {
        console.error('Failed to clean up unsent admin invite token:', cleanupErr);
      }
    }

    console.error('Resend Admin Invite Error:', err);
    res.status(500).json({ error: 'Failed to resend admin invite email' });
  }
};

// PUT update admin
exports.updateAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, school_id, status } = req.body;
    const { id } = req.params;

    await assertUserContactAvailable(pool, { email, phone, excludeUserId: id });

    await pool.execute(
      `UPDATE users SET firstName = ?, lastName = ?, email = ?, phone = ?, school_id = ?, status = ? WHERE id = ? AND role = 'admin'`,
      [firstName, lastName, email, phone || null, school_id, status || 'active', id]
    );

    res.json({ message: 'Admin updated successfully' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.getAdminById = async (req, res) => {
    try {
      const { id } = req.params;

      const [rows] = await pool.execute(
        'SELECT id, firstName, lastName, email, phone, school_id FROM users WHERE id = ? AND role = "admin"',
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };


// DELETE admin
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute(`DELETE FROM users WHERE id = ? AND role = 'admin'`, [id]);
    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




// GET all subscription plans
exports.getAllPlans = async (req, res) => {
    try {
      const adminOnlyActive = req.user?.role === 'admin';
      const [rows] = await pool.execute(`
        SELECT *
        FROM subscription_plans
        ${adminOnlyActive ? 'WHERE is_active = 1' : ''}
        ORDER BY is_active DESC, monthly_price ASC, price ASC
      `);
      res.json(rows.map(formatPackage));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  // CREATE new plan
  exports.createPlan = async (req, res) => {
    try {
      const plan = buildPackagePayload(req.body);
      const [result] = await pool.execute(
        `INSERT INTO subscription_plans (
          name,
          price,
          billing_interval,
          monthly_price,
          yearly_price,
          max_students,
          max_families,
          max_guards,
          storage_limit_mb,
          grace_period_days,
          features,
          feature_toggles,
          is_active
        ) VALUES (?, ?, 'monthly', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          plan.name,
          plan.monthlyPrice,
          plan.monthlyPrice,
          plan.yearlyPrice,
          plan.maxStudents,
          plan.maxFamilies,
          plan.maxGuards,
          plan.storageLimitMb,
          plan.gracePeriodDays,
          plan.features,
          plan.featureToggles,
          plan.isActive,
        ]
      );
      res.status(201).json({ message: 'Package created', id: result.insertId });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  };
  // UPDATE plan
  exports.updatePlan = async (req, res) => {
    try {
      const { id } = req.params;
      const plan = buildPackagePayload(req.body);
      const existingPlan = await getPlanById(pool, id);
      if (!existingPlan) {
        return res.status(404).json({ error: 'Package not found' });
      }

      await assertPlanCanCoverAssignedSchools(pool, {
        id,
        max_students: plan.maxStudents,
        max_families: plan.maxFamilies,
        max_guards: plan.maxGuards,
      });

      await pool.execute(
        `UPDATE subscription_plans
         SET name = ?,
             price = ?,
             billing_interval = 'monthly',
             monthly_price = ?,
             yearly_price = ?,
             max_students = ?,
             max_families = ?,
             max_guards = ?,
             storage_limit_mb = ?,
             grace_period_days = ?,
             features = ?,
             feature_toggles = ?,
             is_active = ?
         WHERE id = ?`,
        [
          plan.name,
          plan.monthlyPrice,
          plan.monthlyPrice,
          plan.yearlyPrice,
          plan.maxStudents,
          plan.maxFamilies,
          plan.maxGuards,
          plan.storageLimitMb,
          plan.gracePeriodDays,
          plan.features,
          plan.featureToggles,
          plan.isActive,
          id,
        ]
      );
      res.json({ message: 'Package updated' });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
    }
  };

  // DELETE plan
  exports.deletePlan = async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute(`DELETE FROM subscription_plans WHERE id = ?`, [id]);
      res.json({ message: 'Package deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  // GET all subscriptions with school and plan info
  exports.getAllSubscriptions = async (req, res) => {
    try {
      await refreshSubscriptionLifecycle(pool);

      const [rows] = await pool.execute(`
SELECT
  s.id AS subscription_id,
  s.plan_id,
  s.billing_interval,
  sch.name AS school_name,
  sch.status AS school_status,
  sp.name AS plan_name,
  sp.monthly_price,
  sp.yearly_price,
  sp.grace_period_days,
  (
    SELECT CONCAT(admin_user.firstName, ' ', admin_user.lastName)
    FROM users admin_user
    WHERE admin_user.school_id = sch.id AND admin_user.role = 'admin'
    ORDER BY admin_user.id ASC
    LIMIT 1
  ) AS admin_name,
  s.status,
  s.start_date,
  s.end_date,
  s.next_billing_date,
  s.last_payment_amount,
  s.failed_payment_count,
  s.last_payment_failed_at,
  s.grace_period_ends_at,
  s.cancel_at_period_end,
  s.cancelled_at,
  s.pending_plan_id,
  pending_plan.name AS pending_plan_name,
  s.pending_billing_interval,
  s.pending_change_type,
  s.pending_change_effective_at,
  s.stripe_subscription_id,
  s.latest_invoice_id
FROM subscriptions s
JOIN schools sch ON s.school_id = sch.id
JOIN subscription_plans sp ON s.plan_id = sp.id
LEFT JOIN subscription_plans pending_plan ON pending_plan.id = s.pending_plan_id

      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  // GET all payments
  exports.getAllPayments = async (req, res) => {
    try {
      const [rows] = await pool.execute(`
        SELECT
          p.id,
          p.amount,
          p.status,
          p.method,
          p.payment_date,
          p.transaction_id,
          p.stripe_invoice_id,
          p.stripe_event_id,
          p.stripe_charge_id,
          p.invoice_number,
          p.invoice_due_date,
          p.invoice_hosted_url,
          p.invoice_pdf_url,
          p.attempt_count,
          p.billing_reason,
          p.failure_reason,
          sch.name AS school_name,
          sp.name AS plan_name
        FROM payments p
        JOIN schools sch ON p.school_id = sch.id
        JOIN subscription_plans sp ON p.plan_id = sp.id
        ORDER BY p.payment_date DESC, p.id DESC
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

exports.cancelSubscription = async (req, res) => {
  const subscriptionId = req.params.id;
  const immediate = Boolean(req.body?.immediate);
  const connection = await pool.getConnection();

  try {
    const subscription = await getSubscriptionById(pool, subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }

    if (subscription.stripe_subscription_id) {
      if (immediate) {
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
      } else {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
        const scheduleId = getStripeId(stripeSubscription.schedule);
        if (scheduleId) {
          await stripe.subscriptionSchedules.release(scheduleId);
        }

        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      }
    }

    await connection.beginTransaction();
    const result = await cancelSubscriptionRecord(connection, subscriptionId, {
      immediate,
      createdBy: req.user?.id || null,
    });
    await connection.commit();

    res.json({
      success: true,
      message: immediate
        ? 'Subscription cancelled immediately.'
        : 'Subscription will cancel at the end of the current billing period.',
      subscriptionId: Number(subscriptionId),
      immediate: result.immediate,
    });
  } catch (err) {
    await connection.rollback();
    console.error('Cancel subscription error:', err.message);
    res.status(err.statusCode || 500).json({ error: 'Failed to cancel subscription.' });
  } finally {
    connection.release();
  }
};

exports.reactivateSubscription = async (req, res) => {
  const subscriptionId = req.params.id;
  const connection = await pool.getConnection();

  try {
    const subscription = await getSubscriptionById(pool, subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (subscription.stripe_subscription_id && subscription.cancel_at_period_end) {
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
    await reactivateSubscriptionRecord(connection, subscriptionId, {
      createdBy: req.user?.id || null,
    });
    await connection.commit();

    res.json({ success: true, message: 'Subscription reactivated.', subscriptionId: Number(subscriptionId) });
  } catch (err) {
    await connection.rollback();
    console.error('Reactivate subscription error:', err.message);
    res.status(err.statusCode || 500).json({ error: 'Failed to reactivate subscription.' });
  } finally {
    connection.release();
  }
};

exports.changeSubscriptionPlan = async (req, res) => {
  const subscriptionId = req.params.id;
  const { plan_id, billing_interval } = req.body;
  const connection = await pool.getConnection();

  try {
    const normalizedPlanId = parseRequiredPlanId(plan_id);

    const subscription = await getSubscriptionById(pool, subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }

    const interval = resolveBillingInterval(billing_interval || subscription.billing_interval);
    const nextPlan = await getPlanById(pool, normalizedPlanId);
    if (!nextPlan || !Boolean(nextPlan.is_active)) {
      return res.status(400).json({ error: 'Selected package does not exist or is inactive.' });
    }

    await ensurePlanCanCoverSchool(pool, subscription.school_id, normalizedPlanId);

    const currentPlan = await getPlanById(pool, subscription.plan_id);
    const currentAmount = planAmount(currentPlan, subscription.billing_interval);
    const nextAmount = planAmount(nextPlan, interval);
    const isSamePackage =
      Number(subscription.plan_id) === Number(normalizedPlanId) &&
      resolveBillingInterval(subscription.billing_interval) === interval;
    const changeType = nextAmount < currentAmount
      ? 'downgrade'
      : nextAmount > currentAmount
        ? 'upgrade'
        : 'plan_change';

    let stripePlanChange = null;
    if (subscription.status === 'Active' && !isSamePackage) {
      if (!subscription.stripe_subscription_id) {
        throw createControllerError(
          'This active subscription is not linked to Stripe, so its package cannot be changed with real billing. Ask the school to subscribe through Stripe first.',
          409
        );
      }

      stripePlanChange = changeType === 'downgrade'
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
    }

    await connection.beginTransaction();
    const result = await changeSchoolPackage(connection, {
      schoolId: subscription.school_id,
      planId: normalizedPlanId,
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


  exports.getOverviewStats = async (req, res) => {
    try {
      await refreshSubscriptionLifecycle(pool);

      const [[{ totalRevenue }]] = await pool.execute(`
        SELECT COALESCE(SUM(amount), 0) AS totalRevenue
        FROM payments
        WHERE status = 'Successful'
      `);

      const [[{ activeSubscriptions }]] = await pool.execute(`
        SELECT COUNT(*) AS activeSubscriptions
        FROM subscriptions
        WHERE status = 'Active'
      `);

      const [[{ totalPlans }]] = await pool.execute(`
        SELECT COUNT(*) AS totalPlans
        FROM subscription_plans
      `);

      const [[{ mrr }]] = await pool.execute(`
        SELECT COALESCE(SUM(
          CASE
            WHEN s.billing_interval = 'yearly' THEN COALESCE(p.yearly_price, p.price, 0) / 12
            ELSE COALESCE(p.monthly_price, p.price, 0)
          END
        ), 0) AS mrr
        FROM subscriptions s
        JOIN subscription_plans p ON p.id = s.plan_id
        WHERE s.status = 'Active'
      `);

      const [[{ pendingRevenue }]] = await pool.execute(`
        SELECT COALESCE(SUM(amount), 0) AS pendingRevenue
        FROM (
          SELECT COALESCE(stripe_invoice_id, transaction_id) AS invoice_key, MAX(amount) AS amount
          FROM payments
          WHERE status IN ('Pending', 'Failed')
          GROUP BY COALESCE(stripe_invoice_id, transaction_id)
        ) outstanding
      `);

      const [[{ failedPayments }]] = await pool.execute(`
        SELECT COUNT(*) AS failedPayments
        FROM payments
        WHERE status = 'Failed'
      `);

      const [[{ successfulPayments }]] = await pool.execute(`
        SELECT COUNT(*) AS successfulPayments
        FROM payments
        WHERE status = 'Successful'
      `);

      const [[{ outstandingInvoices }]] = await pool.execute(`
        SELECT COUNT(DISTINCT COALESCE(stripe_invoice_id, transaction_id)) AS outstandingInvoices
        FROM payments
        WHERE status IN ('Pending', 'Failed')
      `);

      res.json({
        totalRevenue,
        activeSubscriptions,
        totalPlans,
        mrr,
        arr: Number(mrr || 0) * 12,
        pendingRevenue,
        failedPayments,
        successfulPayments,
        paymentSuccessRate: Number(successfulPayments || 0) + Number(failedPayments || 0)
          ? Number(((Number(successfulPayments || 0) / (Number(successfulPayments || 0) + Number(failedPayments || 0))) * 100).toFixed(2))
          : 0,
        outstandingInvoices,
      });
    } catch (err) {
      console.error('Overview stats error:', err.message);
      res.status(500).json({ error: 'Failed to fetch overview statistics' });
    }
  };




  exports.getDashboardStats = async (req, res) => {
    try {
      await refreshSubscriptionLifecycle(pool);

      const [[{ totalSchools }]] = await pool.execute(`SELECT COUNT(*) AS totalSchools FROM schools`);
      const [[{ activeSchools }]] = await pool.execute(`SELECT COUNT(*) AS activeSchools FROM schools WHERE status = 'Active'`);
      const [[{ suspendedSchools }]] = await pool.execute(`SELECT COUNT(*) AS suspendedSchools FROM schools WHERE status = 'Suspended'`);
      const [[{ totalRevenue }]] = await pool.execute(`
        SELECT COALESCE(SUM(amount), 0) AS totalRevenue FROM payments WHERE status = 'Successful'
      `);
      const [[{ activeSubscriptions }]] = await pool.execute(`
        SELECT COUNT(*) AS activeSubscriptions FROM subscriptions WHERE status = 'Active'
      `);
      const [[{ mrr }]] = await pool.execute(`
        SELECT COALESCE(SUM(
          CASE
            WHEN s.billing_interval = 'yearly' THEN COALESCE(p.yearly_price, p.price, 0) / 12
            ELSE COALESCE(p.monthly_price, p.price, 0)
          END
        ), 0) AS mrr
        FROM subscriptions s
        JOIN subscription_plans p ON p.id = s.plan_id
        WHERE s.status = 'Active'
      `);
      const [[{ activeAdmins }]] = await pool.execute(`
        SELECT COUNT(*) AS activeAdmins FROM users WHERE role = 'admin'
      `);
      const [[{ totalStudents }]] = await pool.execute(`SELECT COUNT(*) AS totalStudents FROM children`);
      const [[{ totalParents }]] = await pool.execute(`SELECT COUNT(*) AS totalParents FROM users WHERE role = 'parent'`);
      const [[{ totalGuards }]] = await pool.execute(`SELECT COUNT(*) AS totalGuards FROM users WHERE role = 'guard'`);
      const [[{ failedPayments }]] = await pool.execute(`SELECT COUNT(*) AS failedPayments FROM payments WHERE status = 'Failed'`);
      const [[{ totalPayments }]] = await pool.execute(`SELECT COUNT(*) AS totalPayments FROM payments`);
      const [[{ completedPaymentAttempts }]] = await pool.execute(`
        SELECT COUNT(*) AS completedPaymentAttempts
        FROM payments
        WHERE status IN ('Successful', 'Failed')
      `);
      const [[{ successfulPayments }]] = await pool.execute(`SELECT COUNT(*) AS successfulPayments FROM payments WHERE status = 'Successful'`);
      const [[{ outstandingInvoices }]] = await pool.execute(`
        SELECT COUNT(DISTINCT COALESCE(stripe_invoice_id, transaction_id)) AS outstandingInvoices
        FROM payments
        WHERE status IN ('Pending', 'Failed')
      `);
      const [[{ outstandingAmount }]] = await pool.execute(`
        SELECT COALESCE(SUM(amount), 0) AS outstandingAmount
        FROM (
          SELECT COALESCE(stripe_invoice_id, transaction_id) AS invoice_key, MAX(amount) AS amount
          FROM payments
          WHERE status IN ('Pending', 'Failed')
          GROUP BY COALESCE(stripe_invoice_id, transaction_id)
        ) outstanding
      `);
      const [[{ newSchoolsThisMonth }]] = await pool.execute(`
        SELECT COUNT(*) AS newSchoolsThisMonth
        FROM schools
        WHERE created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
      `);
      const [[{ cancelledSubscriptions }]] = await pool.execute(`
        SELECT COUNT(*) AS cancelledSubscriptions
        FROM subscriptions
        WHERE status = 'Cancelled'
      `);
      const [packageDistribution] = await pool.execute(`
        SELECT p.name, COUNT(s.id) AS count
        FROM subscription_plans p
        LEFT JOIN (
          SELECT s1.*
          FROM subscriptions s1
          INNER JOIN (
            SELECT school_id, MAX(id) AS id
            FROM subscriptions
            GROUP BY school_id
          ) latest ON latest.id = s1.id
        ) s ON s.plan_id = p.id
        GROUP BY p.id, p.name
        ORDER BY count DESC, p.name ASC
      `);
      const [revenueByPackage] = await pool.execute(`
        SELECT p.name, COALESCE(SUM(pay.amount), 0) AS revenue
        FROM subscription_plans p
        LEFT JOIN payments pay ON pay.plan_id = p.id AND pay.status = 'Successful'
        GROUP BY p.id, p.name
        ORDER BY revenue DESC, p.name ASC
      `);
      const [newSchoolsByMonth] = await pool.execute(`
        SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
        FROM schools
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month DESC
        LIMIT 12
      `);
      const [upgradeDowngradeTrends] = await pool.execute(`
        SELECT
          DATE_FORMAT(created_at, '%Y-%m') AS month,
          change_type,
          COUNT(*) AS count
        FROM subscription_change_logs
        WHERE change_type IN ('upgrade', 'downgrade')
        GROUP BY DATE_FORMAT(created_at, '%Y-%m'), change_type
        ORDER BY month DESC
        LIMIT 24
      `);

      res.json({
        totalSchools,
        activeSchools,
        suspendedSchools,
        totalRevenue,
        activeSubscriptions,
        mrr,
        arr: Number(mrr || 0) * 12,
        activeAdmins,
        totalStudents,
        totalParents,
        totalGuards,
        failedPayments,
        successfulPayments,
        totalPayments,
        completedPaymentAttempts,
        paymentSuccessRate: Number(completedPaymentAttempts || 0)
          ? Number(((Number(successfulPayments || 0) / Number(completedPaymentAttempts || 0)) * 100).toFixed(2))
          : 0,
        outstandingInvoices,
        outstandingAmount,
        averageStudentsPerSchool: totalSchools ? Number((totalStudents / totalSchools).toFixed(2)) : 0,
        newSchoolsThisMonth,
        churnRate: activeSubscriptions + cancelledSubscriptions
          ? Number(((cancelledSubscriptions / (activeSubscriptions + cancelledSubscriptions)) * 100).toFixed(2))
          : 0,
        packageDistribution,
        revenueByPackage,
        newSchoolsByMonth,
        upgradeDowngradeTrends,
      });
    } catch (error) {
      console.error('Error getting dashboard stats:', error.message);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  };
