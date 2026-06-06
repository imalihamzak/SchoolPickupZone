const crypto = require('crypto');
const fs = require('fs');
const QRCode = require('qrcode');
const pool = require('../config/db');

const QR_TOKEN_PREFIX = 'pzqr';
const QR_TOKEN_VERSION = 2;
const QR_TOKEN_AAD = Buffer.from('pickupzone.pickup-qr.v2', 'utf8');

const getQrSecret = () => {
  const secret = process.env.QR_SECRET || process.env.QR_CODE_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('QR token secret is not configured.');
  }
  return secret;
};

const hashQrToken = (token) =>
  crypto.createHash('sha256').update(String(token || '')).digest('hex');

const getQrEncryptionKey = () =>
  crypto.createHash('sha256').update(`${getQrSecret()}:pickupzone-qr-encryption-v2`).digest();

const encryptPayload = (payload) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getQrEncryptionKey(), iv);
  cipher.setAAD(QR_TOKEN_AAD);

  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('base64url'),
    ciphertext: ciphertext.toString('base64url'),
    tag: tag.toString('base64url'),
  };
};

const decryptPayload = ({ iv, ciphertext, tag }) => {
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      getQrEncryptionKey(),
      Buffer.from(iv, 'base64url')
    );
    decipher.setAAD(QR_TOKEN_AAD);
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));

    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64url')),
      decipher.final(),
    ]);

    return JSON.parse(plaintext.toString('utf8'));
  } catch (_err) {
    const error = new Error('QR token could not be decrypted.');
    error.code = 'QR_TOKEN_DECRYPT_FAILED';
    error.statusCode = 403;
    throw error;
  }
};

const createPickupQrToken = ({
  userId,
  schoolId,
  childId,
  guardianId = null,
  type,
  expiresAt = null,
}) => {
  const now = Math.floor(Date.now() / 1000);
  const ttlDays = Number(process.env.QR_TOKEN_TTL_DAYS || 365);
  const expirySeconds = expiresAt
    ? Math.floor(new Date(expiresAt).getTime() / 1000)
    : ttlDays > 0
      ? now + ttlDays * 24 * 60 * 60
      : null;
  const tokenId = crypto.randomUUID();
  const payload = {
    version: QR_TOKEN_VERSION,
    token_id: tokenId,
    school_id: schoolId || null,
    user_id: Number(userId),
    child_id: Number(childId),
    guardian_id: guardianId === null || guardianId === undefined ? null : Number(guardianId),
    type,
    iat: now,
    exp: expirySeconds,
  };
  const encrypted = encryptPayload(payload);
  const token = `${QR_TOKEN_PREFIX}.v${QR_TOKEN_VERSION}.${encrypted.iv}.${encrypted.ciphertext}.${encrypted.tag}`;

  return {
    token,
    tokenId,
    tokenVersion: QR_TOKEN_VERSION,
    tokenHash: hashQrToken(token),
    expiresAt: expirySeconds ? new Date(expirySeconds * 1000) : null,
    payload,
  };
};

const verifyPickupQrToken = (token) => {
  if (!token || typeof token !== 'string' || !token.startsWith(`${QR_TOKEN_PREFIX}.`)) {
    return null;
  }

  const parts = token.split('.');

  if (parts.length === 5 && parts[1] === `v${QR_TOKEN_VERSION}`) {
    const payload = decryptPayload({
      iv: parts[2],
      ciphertext: parts[3],
      tag: parts[4],
    });

    if (Number(payload.version) !== QR_TOKEN_VERSION) {
      const error = new Error('QR token version is not supported.');
      error.code = 'QR_TOKEN_UNSUPPORTED_VERSION';
      error.statusCode = 400;
      throw error;
    }

    if (payload.exp && Number(payload.exp) < Math.floor(Date.now() / 1000)) {
      const error = new Error('QR token has expired.');
      error.code = 'QR_TOKEN_EXPIRED';
      error.statusCode = 410;
      throw error;
    }

    return payload;
  }

  const error = new Error('Encrypted QR token v2 is required.');
  error.code = 'QR_TOKEN_UNSUPPORTED_VERSION';
  error.statusCode = 400;
  throw error;
};

const resolveParentSchoolId = async (executor, userId) => {
  const [[parent]] = await executor.execute(
    'SELECT school_id FROM users WHERE id = ? AND role = ?',
    [userId, 'parent']
  );
  return parent?.school_id || null;
};

const ensureUploadsDirectory = () => {
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
  }
};

exports.hashQrToken = hashQrToken;
exports.createPickupQrToken = createPickupQrToken;
exports.verifyPickupQrToken = verifyPickupQrToken;

exports.generateQRCodesForUser = async (userId, getAllChildren, getAllGuardians, options = {}) => {
  const executor = options.executor || pool;
  const children = await getAllChildren(userId);
  const guardians = await getAllGuardians(userId);
  const schoolId = await resolveParentSchoolId(executor, userId);

  if (children.length === 0) return [];

  ensureUploadsDirectory();

  await executor.execute(
    `UPDATE qr_assignments
     SET status = 'Revoked',
         revoked_at = NOW(),
         revoked_by = ?,
         last_rotated_at = NOW()
     WHERE user_id = ? AND status = 'Active'`,
    [options.revokedBy || userId, userId]
  );

  const associations = [
    { type: 'parent', id: null },
    ...guardians
      .filter((guardian) => guardian.status !== 'Inactive')
      .map((guardian) => ({
        type: String(guardian.contact_type || '').toLowerCase() === 'second_parent'
          ? 'second_parent'
          : 'guardian',
        id: guardian.id,
      })),
  ];
  const results = [];

  for (const child of children) {
    for (const assoc of associations) {
      const tokenData = createPickupQrToken({
        userId,
        schoolId,
        childId: child.id,
        guardianId: assoc.id,
        type: assoc.type,
      });

      const fileName = `uploads/qr_${userId}_${child.id}_${assoc.id ?? 'parent'}_${Date.now()}.png`;
      await QRCode.toFile(fileName, tokenData.token);

      await executor.execute(
        `INSERT INTO qr_assignments (
           school_id,
           token_id,
           token_version,
           token_hash,
           user_id,
           guardian_id,
           child_id,
           qr_code,
           image_path,
           expires_at,
           last_rotated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          schoolId,
          tokenData.tokenId,
          tokenData.tokenVersion,
          tokenData.tokenHash,
          userId,
          assoc.id,
          child.id,
          tokenData.token,
          fileName,
          tokenData.expiresAt,
        ]
      );

      results.push({
        child: child.full_name,
        child_id: child.id,
        for: assoc.type,
        guardian_id: assoc.id,
        file: fileName,
        qr_code: tokenData.token,
        token_version: tokenData.tokenVersion,
      });
    }
  }

  return results;
};
