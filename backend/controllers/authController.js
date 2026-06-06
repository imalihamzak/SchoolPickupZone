const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { createUser, getUserByEmail } = require('../models/User');
const { sendResetEmail, sendSetPasswordEmail, sendEmailVerificationCode } = require('../utils/email');
const pool = require('../config/db');
const {
  changeSchoolPackage,
  ensureSchoolCanAdd,
  getPlanById,
  refreshSubscriptionLifecycle,
  resolveBillingInterval,
} = require('../services/subscriptionService');
const { parseFeatureToggles } = require('../services/packageFeatureService');
const {
  assertUserContactAvailable,
  checkEmailAvailable,
  checkPhoneAvailable,
  normalizeEmail,
} = require('../services/userContactService');
const {
  ensureParentPickupProfileSchema,
  upsertParentPickupProfile,
  validateParentPickupDetails,
} = require('../services/parentPickupProfileService');

// const generateToken = (user) => {
//   return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
// };
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role.toLowerCase(), // make sure role is lowercase
      school_id: user.school_id,     // ✅ add this
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

const getActorFromAuthHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  try {
    return jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  } catch (_err) {
    return null;
  }
};

const toBoolean = (value) => value === true || value === 'true' || value === 1 || value === '1';

const isSchoolInviteRole = (role) => role === 'parent' || role === 'guard';

const getActiveSchoolById = async (executor, schoolId) => {
  const [[school]] = await executor.execute(
    `SELECT id, name, status
     FROM schools
     WHERE id = ?
     LIMIT 1`,
    [schoolId]
  );

  if (!school) return null;
  const status = String(school.status || 'Active').toLowerCase();
  return status === 'active' ? school : null;
};

const earliestValidDate = (...values) => {
  const dates = values
    .map((value) => (value ? new Date(value) : null))
    .filter((date) => date && !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  return dates[0] || new Date();
};

const createPasswordSetupToken = async (connection, email) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await connection.execute('DELETE FROM password_resets WHERE email = ?', [email]);
  await connection.execute(
    `INSERT INTO password_resets (email, token, expires_at)
     VALUES (?, ?, ?)`,
    [email, token, expiresAt]
  );

  return token;
};

const getSchoolName = async (connection, schoolId) => {
  if (!schoolId) return null;
  const [[school]] = await connection.execute(
    'SELECT name FROM schools WHERE id = ?',
    [schoolId]
  );
  return school?.name || null;
};

const ensureEmailChangeVerificationTable = async (executor = pool) => {
  await executor.execute(
    `CREATE TABLE IF NOT EXISTS email_change_verifications (
      id INT NOT NULL AUTO_INCREMENT,
      user_id INT NOT NULL,
      new_email VARCHAR(100) NOT NULL,
      code_hash VARCHAR(128) NOT NULL,
      expires_at DATETIME NOT NULL,
      consumed_at DATETIME DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_email_change_user (user_id),
      KEY idx_email_change_email (new_email),
      KEY idx_email_change_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
  );
};

const hashEmailVerificationCode = (userId, email, code) => {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'pickupzone')
    .update(`${userId}:${normalizeEmail(email)}:${String(code).trim()}`)
    .digest('hex');
};

const verifyEmailChangeCode = async (executor, { userId, email, code }) => {
  if (!code) {
    const error = new Error('Email verification code is required to change your email.');
    error.statusCode = 400;
    throw error;
  }

  await ensureEmailChangeVerificationTable(executor);
  const codeHash = hashEmailVerificationCode(userId, email, code);
  const [rows] = await executor.execute(
    `SELECT id
     FROM email_change_verifications
     WHERE user_id = ?
       AND LOWER(new_email) = ?
       AND code_hash = ?
       AND expires_at > NOW()
       AND consumed_at IS NULL
     ORDER BY id DESC
     LIMIT 1`,
    [userId, normalizeEmail(email), codeHash]
  );

  if (!rows.length) {
    const error = new Error('Invalid or expired email verification code.');
    error.statusCode = 400;
    throw error;
  }

  await executor.execute(
    'UPDATE email_change_verifications SET consumed_at = NOW() WHERE id = ?',
    [rows[0].id]
  );
};

const recordTermsAcceptance = async (connection, {
  schoolId,
  userId,
  planId,
  billingInterval,
  req,
}) => {
  try {
    await connection.execute(
      `INSERT INTO school_onboarding_acceptances (
         school_id,
         user_id,
         plan_id,
         billing_interval,
         terms_version,
         ip_address,
         user_agent,
         accepted_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        schoolId,
        userId,
        planId,
        billingInterval,
        process.env.TERMS_VERSION || '2026-05-01',
        req.ip || null,
        req.headers['user-agent'] || null,
      ]
    );
  } catch (err) {
    if (err.code !== 'ER_NO_SUCH_TABLE' && err.code !== 'ER_BAD_FIELD_ERROR') {
      throw err;
    }
  }
};


exports.register = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      status,
      phone,
      childName,
      relation,
      vehicle,
      schoolName,
      city,
      school_id,
      schoolId,
      plan_id,
      planId,
      billing_interval,
      billingInterval,
      accepted_terms,
      acceptTerms,
      termsAccepted
    } = req.body;

    const normalizedRole = String(role || 'parent').toLowerCase();
    const actor = getActorFromAuthHeader(req);
    const publicParentRegistration = normalizedRole === 'parent' && !actor;
    let assignedSchoolId = null;
    let selectedPlanId = null;
    let selectedBillingInterval = resolveBillingInterval(billing_interval || billingInterval);
    const acceptedTerms = toBoolean(accepted_terms ?? acceptTerms ?? termsAccepted);
    let passwordSetupContext = null;
    let parentPickupDetails = null;

    let profilePicturePath = null;

    if (req.files && req.files.profilePicture) {
      const picture = req.files.profilePicture;
      const uploadDir = path.join(__dirname, '..', 'uploads', 'profile_pictures');

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filename = `${Date.now()}_${picture.name}`;
      const filepath = path.join(uploadDir, filename);

      await picture.mv(filepath);
      profilePicturePath = `/uploads/profile_pictures/${filename}`;
    }

    if (publicParentRegistration) {
      await ensureParentPickupProfileSchema(connection);
      parentPickupDetails = validateParentPickupDetails({ relation, vehicle });
    }

    await connection.beginTransaction();

    if (normalizedRole === 'admin') {
      if (!actor) {
        const error = new Error('School admin accounts cannot be created from public signup. Please sign in or contact the platform admin.');
        error.statusCode = 403;
        throw error;
      }

      if (actor.role !== 'super-admin') {
        const error = new Error('Only the platform admin can create school admin accounts.');
        error.statusCode = 403;
        throw error;
      }

      if (school_id) {
        assignedSchoolId = school_id;
      } else if (schoolName?.trim()) {
        selectedPlanId = Number(plan_id || planId || 0);
        if (!selectedPlanId) {
          const error = new Error('Please select a subscription package to register a school.');
          error.statusCode = 400;
          throw error;
        }

        if (!acceptedTerms) {
          const error = new Error('You must accept the terms before registering a school.');
          error.statusCode = 400;
          throw error;
        }

        const selectedPlan = await getPlanById(connection, selectedPlanId);
        if (!selectedPlan || !Boolean(selectedPlan.is_active)) {
          const error = new Error('Selected package was not found or is inactive.');
          error.statusCode = 400;
          throw error;
        }

        const [schoolResult] = await connection.execute(
          `INSERT INTO schools (name, location, student_count)
           VALUES (?, ?, 0)`,
          [schoolName.trim(), city || null]
        );
        assignedSchoolId = schoolResult.insertId;
        await changeSchoolPackage(connection, {
          schoolId: assignedSchoolId,
          planId: selectedPlanId,
          billingInterval: selectedBillingInterval,
          createdBy: null,
          recordPendingProrationPayment: false,
        });
      }

      if (!assignedSchoolId) {
        const error = new Error('School details are required for school admin registration.');
        error.statusCode = 400;
        throw error;
      }
    } else if (publicParentRegistration) {
      assignedSchoolId = Number(school_id || schoolId || 0);

      if (!assignedSchoolId) {
        const error = new Error('Please select your school to register as a parent.');
        error.statusCode = 400;
        throw error;
      }

      const school = await getActiveSchoolById(connection, assignedSchoolId);
      if (!school) {
        const error = new Error('Selected school is not available for parent registration.');
        error.statusCode = 400;
        throw error;
      }
    } else if (isSchoolInviteRole(normalizedRole)) {
      if (actor?.role === 'admin') {
        assignedSchoolId = actor.school_id || null;
      } else if (actor?.role === 'super-admin' && school_id) {
        assignedSchoolId = school_id;
      } else {
        const error = new Error('Parent and guard accounts must be created by a school admin.');
        error.statusCode = 403;
        throw error;
      }

      if (!assignedSchoolId) {
        const error = new Error('A school is required before creating parent or guard accounts.');
        error.statusCode = 400;
        throw error;
      }
    } else {
      const error = new Error('Unsupported account role.');
      error.statusCode = 400;
      throw error;
    }

    if (assignedSchoolId && normalizedRole === 'parent') {
      await ensureSchoolCanAdd(connection, assignedSchoolId, 'families');
    }

    if (assignedSchoolId && normalizedRole === 'guard') {
      await ensureSchoolCanAdd(connection, assignedSchoolId, 'guards');
    }

    await assertUserContactAvailable(connection, { email, phone });

    const schoolManagedInvite = isSchoolInviteRole(normalizedRole) && !publicParentRegistration;
    const passwordSource = schoolManagedInvite
      ? crypto.randomBytes(32).toString('hex')
      : password;

    if (!passwordSource || String(passwordSource).length < 8) {
      const error = new Error('Password must be at least 8 characters.');
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(passwordSource, 10);
    const accountStatus = schoolManagedInvite
      ? 'inactive'
      : publicParentRegistration
        ? 'active'
        : (status || 'inactive');

    const user = {
      role: normalizedRole,
      firstName,
      lastName,
      email,
      phone: phone || null,
      password: hashedPassword,
      childName: publicParentRegistration ? null : (childName || null),
      status: accountStatus,
      profile_picture: profilePicturePath,
      school_id: assignedSchoolId,
    };

    const createResult = await createUser(user, connection);
    const createdUser = {
      id: createResult.insertId,
      role: normalizedRole,
      school_id: assignedSchoolId,
    };

    if (publicParentRegistration && parentPickupDetails) {
      await upsertParentPickupProfile(connection, {
        userId: createResult.insertId,
        relation: parentPickupDetails.relation,
        vehicle: parentPickupDetails.vehicle,
      });
    }

    if (normalizedRole === 'admin' && !actor && assignedSchoolId && selectedPlanId) {
      await recordTermsAcceptance(connection, {
        schoolId: assignedSchoolId,
        userId: createResult.insertId,
        planId: selectedPlanId,
        billingInterval: selectedBillingInterval,
        req,
      });
    }

    if (schoolManagedInvite) {
      const setupToken = await createPasswordSetupToken(connection, email);
      passwordSetupContext = {
        email,
        token: setupToken,
        firstName,
        lastName,
        role: normalizedRole,
        schoolName: await getSchoolName(connection, assignedSchoolId),
      };
    }

    await connection.commit();
    let setupEmailSent = false;
    let setupEmailWarning = null;

    if (passwordSetupContext) {
      try {
        await sendSetPasswordEmail(passwordSetupContext.email, passwordSetupContext.token, passwordSetupContext);
        setupEmailSent = true;
      } catch (emailErr) {
        setupEmailWarning = 'Account was created, but the password setup email could not be sent.';
      }
    }

    const response = {
      message: passwordSetupContext
        ? setupEmailSent
          ? 'User created successfully. Password setup email sent.'
          : 'User created successfully, but password setup email could not be sent.'
        : 'User registered successfully',
    };

    if (passwordSetupContext) {
      response.passwordSetupRequired = true;
      response.emailSent = setupEmailSent;
      if (setupEmailWarning) response.warning = setupEmailWarning;
    }

    if (normalizedRole === 'admin' && !actor && assignedSchoolId && selectedPlanId) {
      response.token = generateToken(createdUser);
      response.user = createdUser;
      response.checkoutRequired = true;
      response.schoolId = assignedSchoolId;
      response.planId = selectedPlanId;
      response.billingInterval = selectedBillingInterval;
    }

    res.status(201).json(response);

  } catch (err) {
    await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY' && err.message.includes('email')) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    res.status(err.statusCode || 500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

exports.getPublicPlans = async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         id,
         name,
         price,
         monthly_price,
         yearly_price,
         max_students,
         max_families,
         max_guards,
         storage_limit_mb,
         grace_period_days,
         billing_interval,
         features,
         feature_toggles,
         is_active
       FROM subscription_plans
       WHERE is_active = 1
       ORDER BY monthly_price ASC, price ASC`
    );

    res.json(rows.map((plan) => ({
      ...plan,
      price: Number(plan.monthly_price ?? plan.price ?? 0),
      monthly_price: Number(plan.monthly_price ?? plan.price ?? 0),
      yearly_price: Number(plan.yearly_price ?? 0),
      max_students: plan.max_students ?? null,
      max_families: plan.max_families ?? null,
      max_guards: plan.max_guards ?? null,
      storage_limit_mb: plan.storage_limit_mb ?? null,
      grace_period_days: Number(plan.grace_period_days ?? 7),
      features: plan.features
        ? String(plan.features).split(',').map((feature) => feature.trim()).filter(Boolean)
        : [],
      feature_toggles: parseFeatureToggles(plan.feature_toggles),
      is_active: Boolean(plan.is_active),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPublicSchools = async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, location
       FROM schools
       WHERE LOWER(COALESCE(status, 'Active')) = 'active'
       ORDER BY name ASC`
    );

    res.json(rows.map((school) => ({
      id: school.id,
      name: school.name,
      location: school.location || null,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.checkContactAvailability = async (req, res) => {
  try {
    const field = String(req.query.field || '').toLowerCase();
    const value = String(req.query.value || '').trim();
    const actor = getActorFromAuthHeader(req);
    let excludeUserId = null;

    if (actor?.role === 'super-admin' || actor?.role === 'admin') {
      excludeUserId = req.query.excludeUserId || null;
    } else if (actor?.id) {
      excludeUserId = actor.id;
    }

    if (!['email', 'phone'].includes(field)) {
      return res.status(400).json({ error: 'field must be email or phone.' });
    }

    const result = field === 'email'
      ? await checkEmailAvailable(pool, value, excludeUserId)
      : await checkPhoneAvailable(pool, value, excludeUserId);

    res.json({
      field,
      available: result.available,
      message: result.available
        ? `${field === 'email' ? 'Email address' : 'Mobile number'} is available.`
        : `${field === 'email' ? 'Email address' : 'Mobile number'} is already taken.`,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getUserByEmail(email);
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (
      (user.role === 'parent' || user.role === 'guard') &&
      String(user.status || '').toLowerCase() !== 'active'
    ) {
      return res.status(403).json({ error: 'Please set your password from the school invitation email before logging in.' });
    }
    const token = generateToken(user);
    console.log("Generated token payload:", user);

    res.json({
      token,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        school_id: user.school_id,
        profile_picture: user.profile_picture || null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    await sendResetEmail(user.email, token);
    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.id]);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    const [[user]] = await pool.execute(
      'SELECT id, password FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user || !user.password) {
      return res.status(404).json({ error: 'User account was not found.' });
    }

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.requestEmailChangeCode = async (req, res) => {
  try {
    const nextEmail = normalizeEmail(req.body.email);
    if (!nextEmail) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const [[user]] = await pool.execute(
      'SELECT id, firstName, lastName, email FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    if (normalizeEmail(user.email) === nextEmail) {
      return res.status(400).json({ error: 'This is already your current email.' });
    }

    await assertUserContactAvailable(pool, { email: nextEmail, excludeUserId: req.user.id });
    await ensureEmailChangeVerificationTable(pool);

    const code = String(crypto.randomInt(100000, 1000000));
    const codeHash = hashEmailVerificationCode(req.user.id, nextEmail, code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.execute(
      `DELETE FROM email_change_verifications
       WHERE user_id = ? AND consumed_at IS NULL`,
      [req.user.id]
    );

    await pool.execute(
      `INSERT INTO email_change_verifications (user_id, new_email, code_hash, expires_at)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, nextEmail, codeHash, expiresAt]
    );

    await sendEmailVerificationCode(nextEmail, code, {
      firstName: user.firstName,
      lastName: user.lastName,
    });

    res.json({ message: 'Verification code sent to your new email.', expiresInMinutes: 10 });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.getAllParents = async (req, res) => {
  try {
    const role = req.user.role;
    if (role !== 'admin' && role !== 'superadmin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const [rows] = await pool.execute(
      `SELECT id, firstName, lastName, profile_picture FROM users WHERE role = 'parent' ORDER BY firstName`
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// GET /api/auth/me
exports.getProfile = async (req, res) => {
  try {
    if (req.user.school_id) {
      await refreshSubscriptionLifecycle(pool, req.user.school_id);
    }

    const [[user]] = await pool.execute(
      `SELECT id, role, firstName, lastName, email, phone, profile_picture, school_id, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get school and latest subscription/package status
    const [[school]] = await pool.execute(
      `SELECT
         s.id,
         s.status,
         s.suspension_reason,
         s.created_at,
         first_admin.created_at AS first_admin_created_at
       FROM schools s
       LEFT JOIN (
         SELECT school_id, MIN(created_at) AS created_at
         FROM users
         WHERE role = 'admin'
         GROUP BY school_id
       ) first_admin ON first_admin.school_id = s.id
       WHERE s.id = ?`,
      [user.school_id]
    );

    const [[subscription]] = await pool.execute(
      `SELECT
         s.plan_id,
         s.billing_interval,
         s.status,
         s.next_billing_date,
         s.end_date,
         s.grace_period_ends_at,
         s.cancel_at_period_end,
         p.name AS plan_name,
         p.feature_toggles,
         p.storage_limit_mb,
         p.grace_period_days
       FROM subscriptions s
       LEFT JOIN subscription_plans p ON p.id = s.plan_id
       WHERE s.school_id = ?
       ORDER BY s.id DESC LIMIT 1`,
      [user.school_id]
    );

    const subscriptionStatus = subscription?.status || 'Inactive';
    let schoolStatus = school?.status || 'Active';
    const gracePeriodDays = Math.max(Number(subscription?.grace_period_days ?? 7), 0);

    const firstAdminCreatedAt = school?.first_admin_created_at
      ? new Date(school.first_admin_created_at)
      : null;
    const onboardingStartedAt =
      firstAdminCreatedAt && !Number.isNaN(firstAdminCreatedAt.getTime())
        ? firstAdminCreatedAt
        : earliestValidDate(school?.created_at, user.created_at);
    const now = new Date();
    const accountAgeDays = Math.max(
      Math.floor((now - onboardingStartedAt) / (1000 * 60 * 60 * 24)),
      0
    );
    const subscriptionEndDate = subscription?.end_date ? new Date(subscription.end_date) : null;
    const canUseUntilPeriodEnd =
      subscriptionStatus === 'Cancelled' &&
      subscription?.cancel_at_period_end &&
      subscriptionEndDate &&
      subscriptionEndDate >= now;

    if (
      user.school_id &&
      !canUseUntilPeriodEnd &&
      (subscriptionStatus === 'Inactive' || subscriptionStatus === 'Cancelled') &&
      accountAgeDays >= gracePeriodDays
    ) {
      await pool.execute(
        `UPDATE schools
         SET status = 'Suspended',
             suspension_reason = ?,
             suspended_at = COALESCE(suspended_at, ?)
         WHERE id = ?`,
        ['Subscription grace period expired.', new Date(), user.school_id]
      );
      schoolStatus = 'Suspended';
    }

    // Return profile + new fields
    res.json({
      id: user.id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      profile_picture: user.profile_picture,
      school_id: user.school_id,
      subscriptionStatus,
      schoolStatus,
      suspensionReason: school?.suspension_reason || null,
      gracePeriodDays,
      accountAgeDays,
      nextBillingDate: subscription?.next_billing_date || null,
      subscriptionEndDate: subscription?.end_date || null,
      gracePeriodEndsAt: subscription?.grace_period_ends_at || null,
      cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
      planId: subscription?.plan_id || null,
      planName: subscription?.plan_name || null,
      billingInterval: subscription?.billing_interval || null,
      featureToggles: subscription
        ? parseFeatureToggles(subscription.feature_toggles)
        : null,
      storageLimitMb: subscription?.storage_limit_mb ?? null,
    });
  } catch (err) {
    console.error('Auth /me error:', err);
    res.status(500).json({ error: err.message });
  }
};


// PUT /api/auth/update-profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, emailVerificationCode } = req.body;
    let profilePicturePath = null;

    const [[currentUser]] = await pool.execute(
      'SELECT id, email FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    const nextEmail = normalizeEmail(email);
    const emailChanged = nextEmail && normalizeEmail(currentUser.email) !== nextEmail;

    await assertUserContactAvailable(pool, {
      email: nextEmail,
      phone,
      excludeUserId: req.user.id,
    });

    if (emailChanged) {
      await verifyEmailChangeCode(pool, {
        userId: req.user.id,
        email: nextEmail,
        code: emailVerificationCode,
      });
    }

    if (req.files && req.files.profilePicture) {
      const picture = req.files.profilePicture;
      const uploadDir = path.join(__dirname, '..', 'uploads', 'profile_pictures');

      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      const filename = `${Date.now()}_${picture.name}`;
      const filepath = path.join(uploadDir, filename);
      await picture.mv(filepath);

      profilePicturePath = `/uploads/profile_pictures/${filename}`;

      await pool.execute(
        'UPDATE users SET profile_picture = ? WHERE id = ?',
        [profilePicturePath, req.user.id]
      );
    }

    await pool.execute(
      'UPDATE users SET firstName = ?, lastName = ?, email = ?, phone = ? WHERE id = ?',
      [firstName, lastName, nextEmail || currentUser.email, phone || null, req.user.id]
    );

    const [updatedRows] = await pool.execute(
      'SELECT id, role, firstName, lastName, email, phone, profile_picture, school_id FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json(updatedRows[0]);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};



exports.setPasswordFromToken = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Step 1: Validate the token
    const [rows] = await pool.execute(
      `SELECT * FROM password_resets WHERE email = ? AND token = ? AND expires_at > NOW()`,
      [email, token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Step 2: Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Step 3: Update user password + status
    await pool.execute(
      `UPDATE users SET password = ?, status = 'active' WHERE email = ?`,
      [hashedPassword, email]
    );

    // Step 4: Clean up the token
    await pool.execute(`DELETE FROM password_resets WHERE email = ?`, [email]);

    res.json({ message: 'Password set successfully. You can now log in.' });

  } catch (err) {
    console.error('Set Password Error:', err.message);
    res.status(500).json({ error: 'Server error while setting password' });
  }
};
