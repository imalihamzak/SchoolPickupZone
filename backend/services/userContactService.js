const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const normalizePhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return `92${digits.slice(1)}`;
  return digits;
};

const createConflictError = (message) => {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
};

const checkEmailAvailable = async (executor, email, excludeUserId = null) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return { available: true };

  const params = [normalized];
  let excludeSql = '';
  if (excludeUserId) {
    excludeSql = ' AND id <> ?';
    params.push(excludeUserId);
  }

  const [rows] = await executor.execute(
    `SELECT id, role FROM users WHERE LOWER(email) = ?${excludeSql} LIMIT 1`,
    params
  );

  return {
    available: rows.length === 0,
    conflict: rows[0] || null,
  };
};

const checkPhoneAvailable = async (executor, phone, excludeUserId = null) => {
  const normalized = normalizePhone(phone);
  if (!normalized) return { available: true };

  const [rows] = await executor.execute(
    `SELECT id, role, phone
     FROM users
     WHERE phone IS NOT NULL AND TRIM(phone) <> ''`
  );

  const conflict = rows.find((row) => {
    if (excludeUserId && Number(row.id) === Number(excludeUserId)) return false;
    return normalizePhone(row.phone) === normalized;
  });

  return {
    available: !conflict,
    conflict: conflict || null,
  };
};

const assertUserContactAvailable = async (executor, {
  email,
  phone,
  excludeUserId = null,
}) => {
  const emailCheck = await checkEmailAvailable(executor, email, excludeUserId);
  if (!emailCheck.available) {
    throw createConflictError('Email address is already taken.');
  }

  const phoneCheck = await checkPhoneAvailable(executor, phone, excludeUserId);
  if (!phoneCheck.available) {
    throw createConflictError('Mobile number is already taken.');
  }
};

module.exports = {
  assertUserContactAvailable,
  checkEmailAvailable,
  checkPhoneAvailable,
  normalizeEmail,
  normalizePhone,
};
