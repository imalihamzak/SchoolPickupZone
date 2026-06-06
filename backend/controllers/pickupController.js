const pool = require('../config/db');
const { assertFeatureEnabledForSchool } = require('../services/packageFeatureService');
const { assertFamilyDocumentsApproved } = require('../services/documentVerificationService');
const {
  getActiveDutyGuards,
  getGuardDutyState,
  isGuardOnDutyForRole,
  normalizeDutyDate,
} = require('../services/guardDutyService');
const {
  ensureParentPickupProfileSchema,
  getParentPickupVehicle,
} = require('../services/parentPickupProfileService');
const { ensureNotificationTypeSchema } = require('../services/notificationTypeService');
const { hashQrToken, verifyPickupQrToken } = require('../utils/qrUtil');
const { createSimplePdf } = require('../utils/simplePdf');

const sameId = (left, right) => Number(left) === Number(right);

const SAFETY_ALERT_TYPES = {
  driver_concern: 'Driver concern',
  unsafe_behavior: 'Unsafe behavior',
  line_emergency: 'Line emergency',
  medical_concern: 'Medical concern',
  other: 'Other concern',
};

let guardSafetyAlertsTableReady = false;

const ensureGuardSafetyAlertsColumn = async (sql) => {
  try {
    await pool.execute(sql);
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') throw err;
  }
};

const ensureGuardSafetyAlertsTable = async () => {
  if (guardSafetyAlertsTableReady) return;

  await pool.execute(
    `CREATE TABLE IF NOT EXISTS guard_safety_alerts (
      id int(11) NOT NULL AUTO_INCREMENT,
      school_id int(11) NOT NULL,
      pickup_log_id int(11) DEFAULT NULL,
      reporting_guard_id int(11) NOT NULL,
      alert_type varchar(64) NOT NULL,
      message text DEFAULT NULL,
      location varchar(255) DEFAULT NULL,
      target_guard_ids varchar(255) DEFAULT NULL,
      guard_notified_count int(11) NOT NULL DEFAULT 0,
      admin_notified tinyint(1) NOT NULL DEFAULT 0,
      delivery_status varchar(32) NOT NULL DEFAULT 'pending',
      delivery_error varchar(255) DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      KEY idx_guard_safety_school_created (school_id, created_at),
      KEY idx_guard_safety_guard_created (reporting_guard_id, created_at),
      KEY idx_guard_safety_pickup (pickup_log_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
  );
  await ensureGuardSafetyAlertsColumn(
    'ALTER TABLE guard_safety_alerts ADD COLUMN guard_notified_count int(11) NOT NULL DEFAULT 0'
  );
  await ensureGuardSafetyAlertsColumn(
    "ALTER TABLE guard_safety_alerts ADD COLUMN delivery_status varchar(32) NOT NULL DEFAULT 'pending'"
  );
  await ensureGuardSafetyAlertsColumn(
    'ALTER TABLE guard_safety_alerts ADD COLUMN delivery_error varchar(255) DEFAULT NULL'
  );

  guardSafetyAlertsTableReady = true;
};

const getRequestIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || null;
};

const normalizeIpAddress = (value) => {
  if (!value) return null;
  return String(value).trim().replace(/^::ffff:/, '');
};

const getQrHashFromBody = (body = {}) => {
  const raw = typeof body.qrToken === 'string'
    ? body.qrToken
    : typeof body.qrData === 'string'
      ? body.qrData
      : body.qrData
        ? JSON.stringify(body.qrData)
        : null;

  return raw ? hashQrToken(raw) : null;
};

const mapSecurityEventType = (err) => {
  if (err.code === 'DEVICE_UNAUTHORIZED' || err.code === 'DEVICE_IP_UNAUTHORIZED' || err.code === 'DEVICE_IP_REQUIRED' || err.code === 'GUARD_NOT_ON_SCANNER_DUTY') return 'unauthorized_device';
  if (err.code === 'TENANT_MISMATCH') return 'tenant_mismatch';
  if (err.code === 'QR_REVOKED') return 'revoked_qr';
  if (err.code === 'QR_EXPIRED' || err.code === 'QR_TOKEN_EXPIRED') return 'expired_qr';
  if (err.code === 'DOCUMENT_VERIFICATION_REQUIRED') return 'document_verification_required';
  if (err.code === 'FEATURE_DISABLED' || err.code === 'PACKAGE_REQUIRED') return 'feature_blocked';
  return 'invalid_qr';
};

const recordSecurityEvent = async (req, err) => {
  try {
    await pool.execute(
      `INSERT INTO pickup_security_events (
         school_id,
         guard_id,
         device_id,
         event_type,
         qr_token_hash,
         message,
         ip_address,
         user_agent
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        err.guard?.school_id || err.assignment?.school_id || req.user?.school_id || null,
        err.guard?.id || req.user?.id || null,
        err.device?.id || null,
        mapSecurityEventType(err),
        getQrHashFromBody(req.body),
        err.message || 'Pickup security event',
        getRequestIp(req),
        req.body?.user_agent || req.headers['user-agent'] || null,
      ]
    );
  } catch (securityErr) {
    if (securityErr.code !== 'ER_NO_SUCH_TABLE') {
      console.error('Pickup security event error:', securityErr);
    }
  }
};

const emitToUser = (io, connectedAdmins, userId, eventName, payload) => {
  if (!io || !connectedAdmins || !userId) return;

  for (const [socketId, connectedUserId] of connectedAdmins.entries()) {
    if (String(connectedUserId) === String(userId)) {
      io.to(socketId).emit(eventName, payload);
    }
  }
};

const notifyUsers = async (userIds, title, message, type, io, connectedAdmins, extra = {}) => {
  await ensureNotificationTypeSchema(pool);
  const inserted = [];

  for (const userId of userIds) {
    const [result] = await pool.execute(
      `INSERT INTO notifications (user_id, type, title, message, timestamp, \`read\`)
       VALUES (?, ?, ?, ?, NOW(), 0)`,
      [userId, type, title, message]
    );

    const payload = {
      id: String(result.insertId),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      ...extra,
    };

    inserted.push({ userId, id: result.insertId });
    emitToUser(io, connectedAdmins, userId, 'pickup_event', payload);
  }

  return inserted;
};

const getSchoolAdminIds = async (schoolId) => {
  if (!schoolId) return [];

  const [admins] = await pool.execute(
    `SELECT id
     FROM users
     WHERE role = 'admin'
       AND school_id = ?
       AND LOWER(COALESCE(status, 'active')) = 'active'`,
    [schoolId]
  );

  return admins.map((admin) => admin.id);
};

const notifyUsersBestEffort = async (userIds, title, message, type, io, connectedAdmins, extra = {}) => {
  const uniqueUserIds = [...new Set(
    userIds
      .map((userId) => Number(userId))
      .filter((userId) => Number.isFinite(userId) && userId > 0)
  )];
  const delivered = [];
  const errors = [];

  for (const userId of uniqueUserIds) {
    try {
      delivered.push(...await notifyUsers([userId], title, message, type, io, connectedAdmins, extra));
    } catch (err) {
      console.error(`Notification delivery failed for user ${userId}:`, err);
      errors.push(err);
    }
  }

  return { delivered, errors };
};

const notifySchoolAdmins = async (schoolId, title, message, type, io, connectedAdmins, extra = {}) => {
  const adminIds = await getSchoolAdminIds(schoolId);

  return notifyUsers(
    adminIds,
    title,
    message,
    type,
    io,
    connectedAdmins,
    { school_id: schoolId, ...extra }
  );
};

const normalizeQrPayload = (payload) => {
  const normalized = {
    version: Number(payload.version ?? payload.v ?? 1),
    token_id: payload.token_id || payload.tokenId || null,
    school_id: payload.school_id ?? payload.schoolId ?? null,
    user_id: Number(payload.user_id ?? payload.userId),
    child_id: Number(payload.child_id ?? payload.childId),
    guardian_id: payload.guardian_id === null || payload.guardian_id === undefined
      ? null
      : Number(payload.guardian_id ?? payload.guardianId),
    type: payload.type || (payload.guardian_id ? 'guardian' : 'parent'),
  };

  if (
    !Number.isFinite(normalized.user_id) ||
    !Number.isFinite(normalized.child_id) ||
    (normalized.guardian_id !== null && !Number.isFinite(normalized.guardian_id))
  ) {
    const error = new Error('QR code payload is incomplete.');
    error.statusCode = 400;
    error.code = 'QR_PAYLOAD_INCOMPLETE';
    throw error;
  }

  return normalized;
};

const parseQrRequest = (qrToken, qrData) => {
  const rawToken = typeof qrToken === 'string'
    ? qrToken.trim()
    : typeof qrData === 'string'
      ? qrData.trim()
      : null;

  if (rawToken) {
    if (!rawToken.startsWith('pzqr.v2.')) {
      const error = new Error('Encrypted QR token v2 is required.');
      error.statusCode = 400;
      error.code = 'QR_ENCRYPTED_TOKEN_REQUIRED';
      throw error;
    }

    const encryptedPayload = verifyPickupQrToken(rawToken);
    return {
      rawToken,
      tokenHash: hashQrToken(rawToken),
      payload: normalizeQrPayload(encryptedPayload),
      signed: true,
    };
  }

  const error = new Error('QR data is required.');
  error.statusCode = 400;
  error.code = 'QR_REQUIRED';
  throw error;
};

const normalizeScanLocation = (location, body = {}) => {
  if (typeof location === 'string' && location.trim()) {
    return location.trim().slice(0, 255);
  }

  const source = location && typeof location === 'object'
    ? location
    : {
      latitude: body.latitude ?? body.lat,
      longitude: body.longitude ?? body.lng,
      accuracy: body.accuracy,
    };
  const latitude = Number(source.latitude ?? source.lat);
  const longitude = Number(source.longitude ?? source.lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return JSON.stringify({
    lat: Number(latitude.toFixed(6)),
    lng: Number(longitude.toFixed(6)),
    accuracy: Number.isFinite(Number(source.accuracy)) ? Math.round(Number(source.accuracy)) : null,
  }).slice(0, 255);
};

const getGuardAndDevice = async ({ guardId, deviceFingerprint, userAgent, requestIp }) => {
  const [[guard]] = await pool.execute(
    `SELECT id, firstName, lastName, role, school_id, status
     FROM users
     WHERE id = ? AND role = 'guard'`,
    [guardId]
  );

  if (!guard) {
    const error = new Error('Guard account was not found.');
    error.statusCode = 403;
    error.code = 'GUARD_NOT_FOUND';
    throw error;
  }

  if (!guard.school_id) {
    const error = new Error('Guard is not assigned to a school.');
    error.statusCode = 403;
    error.code = 'GUARD_SCHOOL_REQUIRED';
    throw error;
  }

  if (String(guard.status || '').toLowerCase() !== 'active') {
    const error = new Error('Guard account is not active.');
    error.statusCode = 403;
    error.code = 'GUARD_INACTIVE';
    throw error;
  }

  const [deviceRows] = await pool.execute(
    `SELECT id, guard_id, device_name, device_fingerprint, user_agent, registered_ip_address, allowed_ip_address, is_active
     FROM guard_devices
     WHERE guard_id = ?
       AND device_fingerprint = ?
       AND (user_agent = ? OR user_agent IS NULL OR ? IS NULL)
     ORDER BY is_active DESC, id DESC
     LIMIT 1`,
    [guardId, deviceFingerprint, userAgent || null, userAgent || null]
  );

  if (!deviceRows.length || !deviceRows[0].is_active) {
    const error = new Error('This guard device is not authorized for scanning.');
    error.statusCode = 403;
    error.code = 'DEVICE_UNAUTHORIZED';
    error.guard = guard;
    error.device = deviceRows[0] || null;
    throw error;
  }

  const device = deviceRows[0];
  const allowedIp = normalizeIpAddress(device.allowed_ip_address || device.registered_ip_address);
  const currentIp = normalizeIpAddress(requestIp);

  if (!allowedIp) {
    const error = new Error('This guard device does not have an authorized scan IP address.');
    error.statusCode = 403;
    error.code = 'DEVICE_IP_REQUIRED';
    error.guard = guard;
    error.device = device;
    throw error;
  }

  if (!currentIp || allowedIp !== currentIp) {
    const error = new Error('This guard device is not authorized from the current IP address.');
    error.statusCode = 403;
    error.code = 'DEVICE_IP_UNAUTHORIZED';
    error.guard = guard;
    error.device = device;
    throw error;
  }

  return { guard, device };
};

const findQrAssignment = async ({ payload, tokenHash }) => {
  const params = [];
  const lookupParts = [];

  if (tokenHash) {
    lookupParts.push('qa.token_hash = ?');
    params.push(tokenHash);
  }

  if (payload.token_id) {
    lookupParts.push('qa.token_id = ?');
    params.push(payload.token_id);
  }

  if (!lookupParts.length) {
    lookupParts.push('(qa.user_id = ? AND qa.child_id = ? AND qa.guardian_id <=> ?)');
    params.push(payload.user_id, payload.child_id, payload.guardian_id);
  }

  const [rows] = await pool.execute(
    `SELECT
       qa.*,
       parent.school_id AS parent_school_id,
       parent.firstName AS parent_first_name,
       parent.lastName AS parent_last_name,
       parent.phone AS parent_phone,
       parent.status AS parent_status,
       c.full_name AS child_name,
       c.grade AS child_grade,
       c.user_id AS child_user_id,
       g.full_name AS guardian_name,
       g.relation AS guardian_relation,
       g.phone AS guardian_phone,
       g.status AS guardian_status,
       g.user_id AS guardian_user_id
     FROM qr_assignments qa
     INNER JOIN users parent ON parent.id = qa.user_id
     INNER JOIN children c ON c.id = qa.child_id
     LEFT JOIN guardians g ON g.id = qa.guardian_id
     WHERE ${lookupParts.map((part) => `(${part})`).join(' OR ')}
     ORDER BY qa.status = 'Active' DESC, qa.created_at DESC
     LIMIT 1`,
    params
  );

  return rows[0] || null;
};

const validateAssignmentForScan = async ({ assignment, payload, signed, guard }) => {
  if (!assignment) {
    const error = new Error('QR code is not valid.');
    error.statusCode = 404;
    error.code = 'QR_NOT_FOUND';
    throw error;
  }

  if (assignment.status !== 'Active') {
    const error = new Error('This QR code has been revoked.');
    error.statusCode = 410;
    error.code = 'QR_REVOKED';
    error.assignment = assignment;
    throw error;
  }

  if (String(assignment.parent_status || '').toLowerCase() !== 'active') {
    const error = new Error('Family account must be approved before this QR code can be used.');
    error.statusCode = 403;
    error.code = 'PARENT_ACCOUNT_NOT_ACTIVE';
    error.assignment = assignment;
    throw error;
  }

  if (assignment.expires_at && new Date(assignment.expires_at).getTime() < Date.now()) {
    const error = new Error('This QR code has expired.');
    error.statusCode = 410;
    error.code = 'QR_EXPIRED';
    error.assignment = assignment;
    throw error;
  }

  const schoolId = assignment.school_id || assignment.parent_school_id;
  const payloadSchoolId = payload.school_id || schoolId;

  if (!schoolId || !sameId(schoolId, guard.school_id) || (signed && !sameId(payloadSchoolId, schoolId))) {
    const error = new Error('This QR code does not belong to the guard school.');
    error.statusCode = 403;
    error.code = 'TENANT_MISMATCH';
    error.assignment = assignment;
    throw error;
  }

  if (
    !sameId(payload.user_id, assignment.user_id) ||
    !sameId(payload.child_id, assignment.child_id) ||
    (payload.guardian_id === null ? assignment.guardian_id !== null : !sameId(payload.guardian_id, assignment.guardian_id))
  ) {
    const error = new Error('QR payload does not match the assigned pickup record.');
    error.statusCode = 403;
    error.code = 'QR_PAYLOAD_MISMATCH';
    error.assignment = assignment;
    throw error;
  }

  if (!sameId(assignment.child_user_id, assignment.user_id)) {
    const error = new Error('Child is not linked to the QR parent account.');
    error.statusCode = 403;
    error.code = 'CHILD_PARENT_MISMATCH';
    error.assignment = assignment;
    throw error;
  }

  if (assignment.guardian_id && !sameId(assignment.guardian_user_id, assignment.user_id)) {
    const error = new Error('Guardian is not linked to the QR parent account.');
    error.statusCode = 403;
    error.code = 'GUARDIAN_PARENT_MISMATCH';
    error.assignment = assignment;
    throw error;
  }

  if (assignment.guardian_id && String(assignment.guardian_status || '').toLowerCase() !== 'active') {
    const error = new Error('This pickup contact is inactive.');
    error.statusCode = 410;
    error.code = 'QR_REVOKED';
    error.assignment = assignment;
    throw error;
  }

  await assertFeatureEnabledForSchool(pool, schoolId, 'qr_verification');

  return schoolId;
};

const getVehicleForAssignment = async ({ guardianId, parentUserId }) => {
  if (!guardianId) {
    return getParentPickupVehicle(pool, parentUserId);
  }

  const [vehicles] = await pool.execute(
    `SELECT id, name, make, model, color, plate_number, year
     FROM vehicles
     WHERE guardian_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [guardianId]
  );

  return vehicles[0] || null;
};

const vehicleDescription = (row) => {
  const name = row.vehicleName || row.name;
  const make = row.make;
  const color = row.color;
  const plate = row.plate_number;

  if (!name && !make && !color && !plate) return 'No vehicle registered';

  const detail = [make, color].filter(Boolean).join(', ');
  return `${name || 'Vehicle'}${detail ? ` (${detail}${plate ? `, Plate: ${plate}` : ''})` : plate ? ` (Plate: ${plate})` : ''}`;
};

const getPickupDetails = async (pickupId) => {
  await ensureParentPickupProfileSchema();

  const [[row]] = await pool.execute(
    `SELECT
       pl.*,
       qa.user_id AS parent_id,
       qa.qr_code,
       c.full_name AS studentName,
       c.grade,
       parent.firstName AS parentFirstName,
       parent.lastName AS parentLastName,
       parent.phone AS parentPhone,
       g.full_name AS guardianName,
       g.relation AS guardianRelation,
       g.phone AS guardianPhone,
       guard.firstName AS guardFirstName,
       guard.lastName AS guardLastName,
       confirmer.firstName AS confirmedByFirstName,
       confirmer.lastName AS confirmedByLastName,
       gd.device_name AS deviceName,
       COALESCE(v.name, ppp.vehicle_name) AS vehicleName,
       COALESCE(v.make, ppp.vehicle_make) AS make,
       COALESCE(v.model, ppp.vehicle_model) AS model,
       COALESCE(v.color, ppp.vehicle_color) AS color,
       COALESCE(v.plate_number, ppp.vehicle_plate_number) AS plate_number,
       COALESCE(v.year, ppp.vehicle_year) AS year
     FROM pickup_logs pl
     INNER JOIN qr_assignments qa ON qa.id = pl.qr_assignment_id
     INNER JOIN children c ON c.id = COALESCE(pl.child_id, qa.child_id)
     INNER JOIN users parent ON parent.id = qa.user_id
     LEFT JOIN guardians g ON g.id = COALESCE(pl.guardian_id, qa.guardian_id)
     LEFT JOIN users guard ON guard.id = pl.guard_id
     LEFT JOIN users confirmer ON confirmer.id = pl.confirmed_by
     LEFT JOIN guard_devices gd ON gd.id = pl.device_id
     LEFT JOIN vehicles v ON v.id = pl.vehicle_id
     LEFT JOIN parent_pickup_profiles ppp ON ppp.user_id = qa.user_id AND COALESCE(pl.guardian_id, qa.guardian_id) IS NULL
     WHERE pl.id = ?`,
    [pickupId]
  );

  if (!row) return null;

  const [familyChildren] = await pool.execute(
    `SELECT c.id, c.full_name, c.grade, c.photo_path
     FROM children c
     INNER JOIN users parent ON parent.id = c.user_id
     WHERE c.user_id = ?
       AND parent.school_id = ?
     ORDER BY c.full_name ASC, c.id ASC`,
    [row.parent_id, row.school_id]
  );

  row.familyChildren = familyChildren.map((child) => ({
    id: child.id,
    name: child.full_name,
    grade: child.grade || null,
    photoPath: child.photo_path || null,
    scanned: sameId(child.id, row.child_id),
  }));

  return row || null;
};

const describePickupStudents = (row) => {
  const children = Array.isArray(row?.familyChildren) ? row.familyChildren : [];
  if (!children.length) return row?.studentName || 'Student';
  const names = children.map((child) => child.name).filter(Boolean);
  if (names.length <= 1) return names[0] || row?.studentName || 'Student';
  return `${names.join(', ')} (${names.length} students)`;
};

const normalizeStatus = (row) => {
  if (row.status === 'confirmed' || row.confirmed) return 'completed';
  if (row.status === 'rejected') return 'cancelled';
  return row.status || 'pending';
};

const formatPickupRow = (row) => {
  const status = normalizeStatus(row);
  const guardianName = row.guardianName || [row.parentFirstName, row.parentLastName].filter(Boolean).join(' ').trim() || 'Parent';
  const guardianRelation = row.guardianName ? row.guardianRelation : 'Parent';
  const scannedAt = row.scanned_at ? new Date(row.scanned_at) : null;
  const familyChildren = Array.isArray(row.familyChildren) ? row.familyChildren : [];
  const studentNames = familyChildren.length
    ? familyChildren.map((child) => child.name).filter(Boolean).join(', ')
    : row.studentName;

  return {
    id: row.id,
    schoolId: row.school_id,
    qrAssignmentId: row.qr_assignment_id,
    studentName: row.studentName,
    studentNames,
    studentCount: familyChildren.length || 1,
    familyChildren,
    grade: row.grade,
    parentName: [row.parentFirstName, row.parentLastName].filter(Boolean).join(' ').trim(),
    parentPhone: row.parentPhone,
    guardianName,
    guardianRelation,
    guardianPhone: row.guardianPhone || row.parentPhone,
    guardName: [row.guardFirstName, row.guardLastName].filter(Boolean).join(' ').trim() || 'Unknown',
    confirmedByName: [row.confirmedByFirstName, row.confirmedByLastName].filter(Boolean).join(' ').trim() || null,
    deviceName: row.deviceName || 'Registered guard device',
    vehicleName: row.vehicleName,
    make: row.make,
    model: row.model,
    color: row.color,
    plate_number: row.plate_number,
    year: row.year,
    carDescription: vehicleDescription(row),
    location: row.location,
    notes: row.notes,
    rejectionReason: row.rejection_reason,
    invalidReason: row.invalid_reason,
    status,
    rawStatus: row.status,
    approvalStatus: row.approval_status,
    confirmed: Boolean(row.confirmed),
    scannedAt: scannedAt?.toISOString() || null,
    scannedAtDisplay: scannedAt ? scannedAt.toLocaleTimeString() : '',
    dateDisplay: scannedAt ? scannedAt.toLocaleDateString() : '',
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    confirmedAt: row.confirmed_at,
    qrCode: `QR-${row.qr_assignment_id}`,
  };
};

const formatLocalDutyDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPickupDutyDate = (row) => {
  if (!row?.scanned_at) return normalizeDutyDate();
  if (row.scanned_at instanceof Date) return normalizeDutyDate(formatLocalDutyDate(row.scanned_at));
  return normalizeDutyDate(String(row.scanned_at).slice(0, 10));
};

const findActivePickupForFamily = async ({ executor = pool, schoolId, parentId }) => {
  const [[row]] = await executor.execute(
    `SELECT pl.id
     FROM pickup_logs pl
     INNER JOIN qr_assignments qa ON qa.id = pl.qr_assignment_id
     WHERE pl.school_id = ?
       AND qa.user_id = ?
       AND DATE(pl.scanned_at) = CURDATE()
       AND pl.status IN ('pending', 'approved')
       AND pl.approval_status IN ('pending', 'approved')
     ORDER BY pl.scanned_at DESC, pl.id DESC
     LIMIT 1`,
    [schoolId, parentId]
  );

  return row ? getPickupDetails(row.id) : null;
};

const getReleaseDutyGuardIds = async (schoolId, dutyDate = normalizeDutyDate()) => {
  try {
    const guards = await getActiveDutyGuards(pool, schoolId, 'release', dutyDate);
    return guards.map((guard) => guard.id).filter(Boolean);
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return [];
    console.error('Release duty guard lookup error:', err);
    return [];
  }
};

const getScannerDutyGuardIds = async (schoolId, dutyDate = normalizeDutyDate()) => {
  try {
    const guards = await getActiveDutyGuards(pool, schoolId, 'scanner', dutyDate);
    return guards.map((guard) => guard.id).filter(Boolean);
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') return [];
    console.error('Scanner duty guard lookup error:', err);
    return [];
  }
};

const getActiveSchoolGuardIds = async (schoolId, excludeGuardId = null) => {
  const params = [schoolId];
  const excludeClause = excludeGuardId ? 'AND id <> ?' : '';
  if (excludeGuardId) params.push(excludeGuardId);

  const [guards] = await pool.execute(
    `SELECT id
     FROM users
     WHERE role = 'guard'
       AND school_id = ?
       AND LOWER(COALESCE(status, 'active')) = 'active'
       ${excludeClause}
     ORDER BY firstName, lastName, id`,
    params
  );

  return guards.map((guard) => guard.id).filter(Boolean);
};

const getGuardReleaseDutyState = async (schoolId, guardId, dutyDate = normalizeDutyDate()) => {
  try {
    return getGuardDutyState(pool, schoolId, guardId, dutyDate);
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      return {
        date: normalizeDutyDate(dutyDate),
        dutyRole: null,
        isOnDuty: false,
        isScanner: false,
        isRelease: false,
      };
    }
    throw err;
  }
};

const notifyReleaseDutyGuards = async (schoolId, dutyDate, title, message, type, io, connectedAdmins, extra = {}) => {
  const releaseGuardIds = await getReleaseDutyGuardIds(schoolId, dutyDate);
  if (!releaseGuardIds.length) return [];

  return notifyUsers(
    releaseGuardIds,
    title,
    message,
    type,
    io,
    connectedAdmins,
    { school_id: schoolId, duty_date: dutyDate, release_queue: true, ...extra }
  );
};

const getGuardSafetyAlertTargetIds = async (schoolId, reportingGuardId, dutyDate = normalizeDutyDate()) => {
  let duty = null;
  try {
    duty = await getGuardDutyState(pool, schoolId, reportingGuardId, dutyDate);
  } catch (err) {
    if (err.code !== 'ER_NO_SUCH_TABLE') throw err;
  }

  let targetIds = [];
  if (duty?.isScanner && !duty?.isRelease) {
    targetIds = await getReleaseDutyGuardIds(schoolId, dutyDate);
  } else if (duty?.isRelease && !duty?.isScanner) {
    targetIds = await getScannerDutyGuardIds(schoolId, dutyDate);
  } else if (duty?.isOnDuty) {
    const scannerIds = await getScannerDutyGuardIds(schoolId, dutyDate);
    const releaseIds = await getReleaseDutyGuardIds(schoolId, dutyDate);
    targetIds = [...scannerIds, ...releaseIds];
  }

  targetIds = [...new Set(targetIds.filter((guardId) => !sameId(guardId, reportingGuardId)))];
  if (targetIds.length) return targetIds;

  return getActiveSchoolGuardIds(schoolId, reportingGuardId);
};

const assertScannerDutyIfRostered = async (schoolId, guardId) => {
  const dutyDate = normalizeDutyDate();
  const scannerGuards = await getActiveDutyGuards(pool, schoolId, 'scanner', dutyDate).catch((err) => {
    console.error('Scanner duty guard lookup error:', err);
    return [];
  });

  if (!scannerGuards.length) return;

  const isScanner = scannerGuards.some((guard) => sameId(guard.id, guardId));
  if (isScanner) return;

  const error = new Error('This guard is not assigned as the scanner guard for today.');
  error.statusCode = 403;
  error.code = 'GUARD_NOT_ON_SCANNER_DUTY';
  throw error;
};

const assertPickupAccess = async (req, row) => {
  if (!row) {
    const error = new Error('Pickup record was not found.');
    error.statusCode = 404;
    throw error;
  }

  if (req.user.role === 'admin' && sameId(row.school_id, req.user.school_id)) return;
  if (req.user.role === 'guard' && sameId(row.guard_id, req.user.id)) return;
  if (
    req.user.role === 'guard' &&
    sameId(row.school_id, req.user.school_id) &&
    await isGuardOnDutyForRole(pool, row.school_id, req.user.id, 'release', getPickupDutyDate(row)).catch((err) => {
      if (err.code === 'ER_NO_SUCH_TABLE') return false;
      throw err;
    })
  ) {
    return;
  }
  if (req.user.role === 'parent' && sameId(row.parent_id, req.user.id)) return;
  if (req.user.role === 'super-admin') return;

  const error = new Error('You do not have access to this pickup record.');
  error.statusCode = 403;
  throw error;
};

const assertGuardCanConfirmPickup = async (req, row) => {
  if (!row) {
    const error = new Error('Pickup record was not found.');
    error.statusCode = 404;
    throw error;
  }

  if (req.user.role !== 'guard' || !sameId(row.school_id, req.user.school_id)) {
    const error = new Error('Only a guard from this school can confirm pickup release.');
    error.statusCode = 403;
    throw error;
  }

  const dutyDate = getPickupDutyDate(row);
  const releaseGuardIds = await getReleaseDutyGuardIds(row.school_id, dutyDate);
  const releaseRosterExists = releaseGuardIds.length > 0;
  const isReleaseGuard = releaseGuardIds.some((guardId) => sameId(guardId, req.user.id));

  if (isReleaseGuard) return;
  if (!releaseRosterExists && sameId(row.guard_id, req.user.id)) return;

  const error = new Error(
    releaseRosterExists
      ? 'Only the active release guard can confirm this pickup.'
      : 'Only the scanner guard can confirm this pickup when no release guard is rostered.'
  );
  error.statusCode = 403;
  error.code = 'GUARD_NOT_ON_RELEASE_DUTY';
  throw error;
};

const attachGuardConfirmationState = async (req, row, formatted) => {
  if (req.user.role !== 'guard' || !sameId(row.school_id, req.user.school_id)) {
    return formatted;
  }

  const dutyDate = getPickupDutyDate(row);
  const releaseGuardIds = await getReleaseDutyGuardIds(row.school_id, dutyDate);
  const releaseRosterExists = releaseGuardIds.length > 0;
  const isReleaseGuard = releaseGuardIds.some((guardId) => sameId(guardId, req.user.id));

  return {
    ...formatted,
    releaseConfirmationRequired: releaseRosterExists,
    canConfirmRelease:
      row.status === 'approved' &&
      row.approval_status === 'approved' &&
      (isReleaseGuard || (!releaseRosterExists && sameId(row.guard_id, req.user.id))),
  };
};

const buildScopedWhere = (req, params) => {
  if (req.user.role === 'admin') {
    params.push(req.user.school_id);
    return 'pl.school_id = ?';
  }

  if (req.user.role === 'guard') {
    params.push(req.user.id);
    return 'pl.guard_id = ?';
  }

  if (req.user.role === 'parent') {
    params.push(req.user.id);
    return 'qa.user_id = ?';
  }

  return '1 = 1';
};

const mapRequestedStatus = (status) => {
  if (status === 'completed') return 'confirmed';
  if (status === 'cancelled') return 'rejected';
  return status;
};

exports.sendGuardSafetyAlert = async (req, res) => {
  const io = req.app.get('io');
  const connectedAdmins = req.app.get('connectedAdmins');

  try {
    if (req.user.role !== 'guard') {
      return res.status(403).json({ error: 'Only guard accounts can send safety alerts.' });
    }

    const [[guard]] = await pool.execute(
      `SELECT id, firstName, lastName, school_id, status
       FROM users
       WHERE id = ?
         AND role = 'guard'`,
      [req.user.id]
    );

    if (!guard || !guard.school_id || String(guard.status || '').toLowerCase() !== 'active') {
      return res.status(403).json({ error: 'Only active guards assigned to a school can send safety alerts.' });
    }

    await ensureGuardSafetyAlertsTable();

    const body = req.body || {};
    const alertType = Object.prototype.hasOwnProperty.call(SAFETY_ALERT_TYPES, body.alert_type)
      ? body.alert_type
      : 'other';
    const note = String(body.note || body.message || '').trim().slice(0, 600) || null;
    const dutyDate = normalizeDutyDate(body.duty_date);
    const location = normalizeScanLocation(body.location, body);
    const pickupId = Number(body.pickup_id || body.pickupId || 0) || null;
    let pickupRow = null;

    if (pickupId) {
      pickupRow = await getPickupDetails(pickupId);
      if (!pickupRow) {
        return res.status(404).json({ error: 'Pickup record was not found.' });
      }
      if (!sameId(pickupRow.school_id, guard.school_id)) {
        return res.status(403).json({ error: 'You can only send safety alerts for your school.' });
      }
      await assertPickupAccess(req, pickupRow);
    }

    const [[recentAlert]] = await pool.execute(
      `SELECT id
       FROM guard_safety_alerts
       WHERE reporting_guard_id = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL 20 SECOND)
         AND COALESCE(delivery_status, 'delivered') <> 'failed'
       ORDER BY created_at DESC
       LIMIT 1`,
      [guard.id]
    );

    if (recentAlert) {
      return res.status(429).json({ error: 'A safety alert was just sent. Please wait a moment before sending another.' });
    }

    const targetGuardIds = await getGuardSafetyAlertTargetIds(guard.school_id, guard.id, dutyDate);
    const guardName = [guard.firstName, guard.lastName].filter(Boolean).join(' ').trim() || 'Guard';
    const alertLabel = SAFETY_ALERT_TYPES[alertType];
    const pickupSummary = pickupRow
      ? ` Request #${pickupRow.id}; ${describePickupStudents(pickupRow)}; ${pickupRow.carDescription || vehicleDescription(pickupRow)}.`
      : '';
    const noteText = note ? ` Note: ${note}` : '';
    const message = `${guardName} reported ${alertLabel.toLowerCase()} at pickup.${pickupSummary}${noteText}`.slice(0, 900);

    const [insertResult] = await pool.execute(
      `INSERT INTO guard_safety_alerts (
         school_id,
         pickup_log_id,
         reporting_guard_id,
         alert_type,
         message,
         location,
         target_guard_ids,
         guard_notified_count,
         admin_notified
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [
        guard.school_id,
        pickupId,
        guard.id,
        alertType,
        message,
        location,
        targetGuardIds.join(',').slice(0, 255) || null,
      ]
    );

    let guardNotifications = [];
    let adminNotifications = [];
    const deliveryErrors = [];

    if (targetGuardIds.length) {
      const guardDelivery = await notifyUsersBestEffort(
        targetGuardIds,
        'Safety Alert',
        message,
        'safety_alert',
        io,
        connectedAdmins,
        {
          school_id: guard.school_id,
          duty_date: dutyDate,
          pickup_id: pickupId,
          safety_alert_id: insertResult.insertId,
          alert_type: alertType,
        }
      );
      guardNotifications = guardDelivery.delivered;
      deliveryErrors.push(...guardDelivery.errors);
    }

    try {
      const adminIds = await getSchoolAdminIds(guard.school_id);
      const adminDelivery = await notifyUsersBestEffort(
        adminIds,
        'Guard Safety Alert',
        message,
        'safety_alert',
        io,
        connectedAdmins,
        {
          school_id: guard.school_id,
          pickup_id: pickupId,
          safety_alert_id: insertResult.insertId,
          alert_type: alertType,
        }
      );
      adminNotifications = adminDelivery.delivered;
      deliveryErrors.push(...adminDelivery.errors);
    } catch (notifyErr) {
      console.error('Safety alert admin lookup error:', notifyErr);
      deliveryErrors.push(notifyErr);
    }

    const guardNotifiedCount = guardNotifications.length;
    const adminNotified = adminNotifications.length > 0;
    const deliveryStatus = guardNotifiedCount || adminNotified
      ? 'delivered'
      : deliveryErrors.length || targetGuardIds.length
        ? 'failed'
        : 'no_recipients';
    const deliveryError = deliveryErrors.length
      ? deliveryErrors
        .map((err) => err.message || 'Notification delivery failed')
        .join('; ')
        .slice(0, 255)
      : null;

    await pool.execute(
      `UPDATE guard_safety_alerts
       SET guard_notified_count = ?,
           admin_notified = ?,
           delivery_status = ?,
           delivery_error = ?
       WHERE id = ?`,
      [
        guardNotifiedCount,
        adminNotified ? 1 : 0,
        deliveryStatus,
        deliveryError,
        insertResult.insertId,
      ]
    );

    if (deliveryStatus === 'failed') {
      return res.status(503).json({
        error: 'Safety alert was recorded, but live notification delivery could not be confirmed. Use backup communication and try again.',
        id: insertResult.insertId,
        recorded: true,
        alertedGuardCount: 0,
        adminNotified: false,
      });
    }

    const guardWarning = targetGuardIds.length && guardNotifiedCount === 0 && adminNotified
      ? 'School admin was notified, but the other guard notification could not be confirmed. Use backup communication.'
      : targetGuardIds.length && guardNotifiedCount < targetGuardIds.length
        ? `Safety alert reached ${guardNotifiedCount} of ${targetGuardIds.length} guard recipients. Use backup communication for anyone missing it.`
        : null;
    let responseMessage = 'No other active guard or admin was available. Safety alert was recorded.';
    if (targetGuardIds.length && guardNotifiedCount) {
      responseMessage = adminNotified
        ? 'Safety alert sent to the other duty guard and school admin.'
        : 'Safety alert sent to the other duty guard.';
    } else if (targetGuardIds.length && adminNotified) {
      responseMessage = 'School admin was notified, but the other guard notification could not be confirmed.';
    } else if (!targetGuardIds.length && adminNotified) {
      responseMessage = 'No other active guard was available. School admin was notified.';
    }

    res.status(201).json({
      message: responseMessage,
      warning: guardWarning,
      id: insertResult.insertId,
      alertedGuardCount: guardNotifiedCount,
      intendedGuardCount: targetGuardIds.length,
      adminNotified,
    });
  } catch (err) {
    console.error('Guard safety alert error:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to send safety alert.' });
  }
};

exports.logPickup = async (req, res) => {
  const io = req.app.get('io');
  const connectedAdmins = req.app.get('connectedAdmins');
  let currentGuard = null;
  let currentDevice = null;

  try {
    const {
      qrToken,
      qrData,
      device_fingerprint: deviceFingerprint,
      user_agent: bodyUserAgent,
      location,
      notes,
    } = req.body;
    const userAgent = bodyUserAgent || req.headers['user-agent'] || null;
    const scanLocation = normalizeScanLocation(location, req.body);

    if (!deviceFingerprint) {
      return res.status(400).json({ error: 'Device fingerprint is required.' });
    }

    const requestIp = getRequestIp(req);
    const { guard, device } = await getGuardAndDevice({
      guardId: req.user.id,
      deviceFingerprint,
      userAgent,
      requestIp,
    });
    currentGuard = guard;
    currentDevice = device;
    const parsedQr = parseQrRequest(qrToken, qrData);
    const assignment = await findQrAssignment(parsedQr);
    const schoolId = await validateAssignmentForScan({
      assignment,
      payload: parsedQr.payload,
      signed: parsedQr.signed,
      guard,
    });
    await assertScannerDutyIfRostered(schoolId, guard.id);
    await assertFamilyDocumentsApproved(assignment.user_id, { skipIfFeatureDisabled: true });
    const vehicle = await getVehicleForAssignment({
      guardianId: assignment.guardian_id,
      parentUserId: assignment.user_id,
    });
    const connection = await pool.getConnection();
    let pickupId = null;

    try {
      await connection.beginTransaction();
      const [familyChildLocks] = await connection.execute(
        `SELECT id
         FROM children
         WHERE user_id = ?
         FOR UPDATE`,
        [assignment.user_id]
      );

      if (!familyChildLocks.some((child) => sameId(child.id, assignment.child_id))) {
        const error = new Error('Child record is no longer available for pickup.');
        error.statusCode = 404;
        error.code = 'CHILD_NOT_FOUND';
        throw error;
      }

      const activePickup = await findActivePickupForFamily({
        executor: connection,
        schoolId,
        parentId: assignment.user_id,
      });

      if (activePickup) {
        await connection.execute(
          `UPDATE guard_devices
           SET last_scan_ip = ?, last_scan_at = NOW()
           WHERE id = ?`,
          [requestIp, device.id]
        );
        await connection.commit();
        const formattedActivePickup = formatPickupRow(activePickup);
        return res.status(200).json({
          message: 'Pickup request is already active for this family.',
          status: formattedActivePickup.rawStatus || formattedActivePickup.status,
          pickupLog: formattedActivePickup,
          duplicate: true,
        });
      }

      const [insertResult] = await connection.execute(
        `INSERT INTO pickup_logs (
           school_id,
           qr_assignment_id,
           child_id,
           guardian_id,
           guard_id,
           device_id,
           vehicle_id,
           location,
           notes,
           scan_ip,
           scan_user_agent,
           status,
           approval_status,
           approved_by,
           approved_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 'approved', ?, NOW())`,
        [
          schoolId,
          assignment.id,
          assignment.child_id,
          assignment.guardian_id,
          guard.id,
          device.id,
          vehicle?.id || null,
          scanLocation,
          notes || null,
          requestIp,
          userAgent,
          guard.id,
        ]
      );
      pickupId = insertResult.insertId;

      await connection.execute(
        `UPDATE guard_devices
         SET last_scan_ip = ?, last_scan_at = NOW()
         WHERE id = ?`,
        [requestIp, device.id]
      );

      await connection.commit();
    } catch (transactionErr) {
      await connection.rollback();
      throw transactionErr;
    } finally {
      connection.release();
    }

    const pickupRow = await getPickupDetails(pickupId);
    const formatted = formatPickupRow(pickupRow);
    const scannedStudents = describePickupStudents(pickupRow);
    const message = `QR code for ${scannedStudents} was scanned by ${guard.firstName || 'Guard'} and is ready for release confirmation.`;

    await notifySchoolAdmins(
      schoolId,
      'Pickup Scan Logged',
      message,
      'qr_scan',
      io,
      connectedAdmins,
      { pickup_id: pickupId, status: 'approved', release_queue: true }
    );

    await notifyReleaseDutyGuards(
      schoolId,
      normalizeDutyDate(),
      'Pickup Ready for Release',
      `${scannedStudents} pickup was scanned and is ready for release confirmation.`,
      'qr_scan',
      io,
      connectedAdmins,
      { pickup_id: pickupId, status: 'approved' }
    );

    res.status(201).json({
      message: 'Pickup scan validated and sent to the release queue.',
      status: 'approved',
      pickupLog: formatted,
    });
  } catch (err) {
    if (!err.guard && currentGuard) err.guard = currentGuard;
    if (!err.device && currentDevice) err.device = currentDevice;
    console.error('Pickup scan error:', err);
    const statusCode = err.statusCode || 500;
    const guardSchoolId = err.guard?.school_id || req.user?.school_id;

    if (statusCode >= 400 && statusCode < 500 && guardSchoolId) {
      await recordSecurityEvent(req, err);
      const notificationTitle = err.code === 'DOCUMENT_VERIFICATION_REQUIRED'
        ? 'Pickup Blocked: Documents Pending'
        : err.code === 'DEVICE_UNAUTHORIZED'
          ? 'Unauthorized Scan Attempt'
          : 'Invalid QR Code Scan';
      await notifySchoolAdmins(
        guardSchoolId,
        notificationTitle,
        err.message,
        err.code === 'DEVICE_UNAUTHORIZED' ? 'unauthorized' : 'invalid_qr',
        io,
        connectedAdmins,
        { code: err.code }
      ).catch((notifyErr) => console.error('Pickup notification error:', notifyErr));
    }

    res.status(statusCode).json({
      error: statusCode === 500 ? 'Server error' : err.message,
      code: err.code,
      feature: err.feature,
      verification: err.verification,
    });
  }
};

exports.getPickupById = async (req, res) => {
  try {
    const row = await getPickupDetails(req.params.id);
    await assertPickupAccess(req, row);
    const formatted = await attachGuardConfirmationState(req, row, formatPickupRow(row));
    res.json(formatted);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.getPendingPickups = async (req, res) => {
  try {
    await assertFeatureEnabledForSchool(pool, req.user.school_id, 'qr_verification');

    const [rows] = await pool.execute(
      `SELECT pl.id
       FROM pickup_logs pl
       WHERE pl.school_id = ?
         AND pl.approval_status = 'pending'
         AND pl.status = 'pending'
       ORDER BY pl.scanned_at ASC`,
      [req.user.school_id]
    );

    const details = [];
    for (const row of rows) {
      const pickup = await getPickupDetails(row.id);
      details.push(formatPickupRow(pickup));
    }

    res.json(details);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message, code: err.code, feature: err.feature });
  }
};

exports.approvePickup = async (req, res) => {
  const io = req.app.get('io');
  const connectedAdmins = req.app.get('connectedAdmins');

  try {
    const row = await getPickupDetails(req.params.id);
    await assertPickupAccess(req, row);

    if (row.status !== 'pending' || row.approval_status !== 'pending') {
      return res.status(409).json({ error: 'Only pending pickup requests can be approved.' });
    }

    const [updateResult] = await pool.execute(
      `UPDATE pickup_logs
       SET status = 'approved',
           approval_status = 'approved',
           approved_by = ?,
           approved_at = NOW()
       WHERE id = ?
         AND status = 'pending'
         AND approval_status = 'pending'`,
      [req.user.id, req.params.id]
    );

    if (!updateResult.affectedRows) {
      return res.status(409).json({ error: 'This pickup request has already been handled.' });
    }

    const updated = await getPickupDetails(req.params.id);
    const formatted = formatPickupRow(updated);
    const dutyDate = getPickupDutyDate(updated);
    const releaseGuardIds = await getReleaseDutyGuardIds(updated.school_id, dutyDate);
    const notifyGuardIds = [...new Set([updated.guard_id, ...releaseGuardIds].filter(Boolean))];

    await notifyUsers(
      notifyGuardIds,
      'Pickup Approved',
      `${describePickupStudents(updated)} pickup was approved and is ready for release confirmation.`,
      'pickup_success',
      io,
      connectedAdmins,
      { pickup_id: updated.id, status: 'approved', duty_date: dutyDate, release_queue: true }
    );

    res.json({ message: 'Pickup request approved.', pickupLog: formatted });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.rejectPickup = async (req, res) => {
  const io = req.app.get('io');
  const connectedAdmins = req.app.get('connectedAdmins');

  try {
    const row = await getPickupDetails(req.params.id);
    await assertPickupAccess(req, row);

    if (row.status !== 'pending' || row.approval_status !== 'pending') {
      return res.status(409).json({ error: 'Only pending pickup requests can be rejected.' });
    }

    const [updateResult] = await pool.execute(
      `UPDATE pickup_logs
       SET status = 'rejected',
           approval_status = 'rejected',
           rejected_by = ?,
           rejected_at = NOW(),
           rejection_reason = ?
       WHERE id = ?
         AND status = 'pending'
         AND approval_status = 'pending'`,
      [req.user.id, req.body.reason || null, req.params.id]
    );

    if (!updateResult.affectedRows) {
      return res.status(409).json({ error: 'This pickup request has already been handled.' });
    }

    const updated = await getPickupDetails(req.params.id);
    const formatted = formatPickupRow(updated);
    const dutyDate = getPickupDutyDate(updated);
    const releaseGuardIds = await getReleaseDutyGuardIds(updated.school_id, dutyDate);
    const notifyGuardIds = [...new Set([updated.guard_id, ...releaseGuardIds].filter(Boolean))];

    await notifyUsers(
      notifyGuardIds,
      'Pickup Rejected',
      `${describePickupStudents(updated)} pickup was rejected by the school admin.`,
      'qr_scan',
      io,
      connectedAdmins,
      { pickup_id: updated.id, status: 'rejected', duty_date: dutyDate, release_queue: true }
    );

    res.json({ message: 'Pickup request rejected.', pickupLog: formatted });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.confirmPickup = async (req, res) => {
  const io = req.app.get('io');
  const connectedAdmins = req.app.get('connectedAdmins');

  try {
    const row = await getPickupDetails(req.params.id);
    await assertGuardCanConfirmPickup(req, row);

    if (row.status !== 'approved' || row.approval_status !== 'approved') {
      return res.status(409).json({ error: 'Pickup must be ready for release before guard confirmation.' });
    }

    const [updateResult] = await pool.execute(
      `UPDATE pickup_logs
       SET status = 'confirmed',
           confirmed = 1,
           confirmed_by = ?,
           confirmed_at = NOW()
       WHERE id = ?
         AND status = 'approved'
         AND approval_status = 'approved'`,
      [req.user.id, req.params.id]
    );

    if (!updateResult.affectedRows) {
      return res.status(409).json({ error: 'This pickup has already been completed or changed.' });
    }

    const updated = await getPickupDetails(req.params.id);
    const formatted = formatPickupRow(updated);

    await notifySchoolAdmins(
      updated.school_id,
      'Pickup Confirmed',
      `${describePickupStudents(updated)} left the school with the pickup vehicle. Final release time was logged.`,
      'pickup_success',
      io,
      connectedAdmins,
      { pickup_id: updated.id, status: 'confirmed' }
    );

    if (updated.guard_id && !sameId(updated.guard_id, req.user.id)) {
      await notifyUsers(
        [updated.guard_id],
        'Student Released',
        `${describePickupStudents(updated)} release was confirmed by the active release guard.`,
        'pickup_success',
        io,
        connectedAdmins,
        { pickup_id: updated.id, status: 'confirmed' }
      );
    }

    res.json({ message: 'Pickup confirmed. Final release time logged.', pickupLog: formatted });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.getReleaseQueue = async (req, res) => {
  try {
    await assertFeatureEnabledForSchool(pool, req.user.school_id, 'qr_verification');

    const dutyDate = normalizeDutyDate(req.query.date);
    const duty = await getGuardReleaseDutyState(req.user.school_id, req.user.id, dutyDate);

    if (!duty.isRelease) {
      return res.json({
        date: dutyDate,
        duty,
        pickups: [],
        stats: {
          total: 0,
          pending: 0,
          approved: 0,
        },
        message: 'This guard is not assigned as a release guard for this date.',
      });
    }

    const [rows] = await pool.execute(
      `SELECT pl.id
       FROM pickup_logs pl
       WHERE pl.school_id = ?
         AND DATE(pl.scanned_at) = ?
         AND pl.status IN ('pending', 'approved')
         AND pl.approval_status IN ('pending', 'approved')
       ORDER BY
         CASE pl.status WHEN 'approved' THEN 0 ELSE 1 END,
         pl.scanned_at ASC`,
      [req.user.school_id, dutyDate]
    );

    const pickups = [];
    for (const row of rows) {
      pickups.push(formatPickupRow(await getPickupDetails(row.id)));
    }

    res.json({
      date: dutyDate,
      duty,
      pickups,
      stats: {
        total: pickups.length,
        pending: pickups.filter((pickup) => pickup.rawStatus === 'pending').length,
        approved: pickups.filter((pickup) => pickup.rawStatus === 'approved').length,
      },
    });
  } catch (err) {
    console.error('Release queue error:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to load release queue.' });
  }
};

exports.getAllPickups = async (req, res) => {
  try {
    const params = [];
    const where = [buildScopedWhere(req, params)];
    const { status, start, end } = req.query;
    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 200);

    if (status && status !== 'all') {
      where.push('pl.status = ?');
      params.push(mapRequestedStatus(status));
    }

    if (start) {
      where.push('DATE(pl.scanned_at) >= ?');
      params.push(start);
    }

    if (end) {
      where.push('DATE(pl.scanned_at) <= ?');
      params.push(end);
    }

    const [rows] = await pool.execute(
      `SELECT pl.id
       FROM pickup_logs pl
       INNER JOIN qr_assignments qa ON qa.id = pl.qr_assignment_id
       WHERE ${where.join(' AND ')}
       ORDER BY pl.scanned_at DESC
       LIMIT ${limit}`,
      params
    );

    const details = [];
    for (const row of rows) {
      details.push(formatPickupRow(await getPickupDetails(row.id)));
    }

    res.json(details);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pickup logs' });
  }
};

exports.getTodayStats = async (req, res) => {
  try {
    const params = [];
    const scope = buildScopedWhere(req, params);
    const [rows] = await pool.execute(`
      SELECT
        HOUR(pl.scanned_at) AS hour,
        COUNT(*) AS scans
      FROM pickup_logs pl
      INNER JOIN qr_assignments qa ON qa.id = pl.qr_assignment_id
      WHERE ${scope}
        AND DATE(pl.scanned_at) = CURDATE()
      GROUP BY hour
      ORDER BY hour
    `, params);

    res.json(rows.map(row => ({
      hour: formatHour(row.hour),
      scans: row.scans,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch today\'s stats' });
  }
};

const formatHour = (hour) => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hr = hour % 12 || 12;
  return `${hr}${ampm}`;
};

const isDateString = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
const isMonthString = (value) => /^\d{4}-\d{2}$/.test(String(value || ''));

const sqlDate = (date) => date.toISOString().slice(0, 10);

const analyticsDefaultRange = () => {
  const end = new Date();
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 11, 1));
  return { start: sqlDate(start), end: sqlDate(end) };
};

const normalizeDateRange = (query = {}) => {
  const defaults = analyticsDefaultRange();
  const start = isDateString(query.start) ? query.start : defaults.start;
  const end = isDateString(query.end) ? query.end : defaults.end;
  return start <= end ? { start, end } : { start: end, end: start };
};

const normalizeLateCutoff = () => {
  const cutoff = process.env.LATE_PICKUP_CUTOFF || '15:30:00';
  return /^\d{2}:\d{2}(:\d{2})?$/.test(cutoff) ? cutoff : '15:30:00';
};

const monthKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

const monthLabel = (key) => {
  const [year, month] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
};

const buildMonthBuckets = (start, end, rows) => {
  const byMonth = new Map(rows.map((row) => [row.month_key, row]));
  const [startYear, startMonth] = start.slice(0, 7).split('-').map(Number);
  const [endYear, endMonth] = end.slice(0, 7).split('-').map(Number);
  const current = new Date(Date.UTC(startYear, startMonth - 1, 1));
  const last = new Date(Date.UTC(endYear, endMonth - 1, 1));
  const buckets = [];

  while (current <= last) {
    const key = monthKey(current);
    const row = byMonth.get(key) || {};
    buckets.push({
      month: key,
      label: monthLabel(key),
      total: Number(row.total || 0),
      completed: Number(row.completed || 0),
      rejected: Number(row.rejected || 0),
      pending: Number(row.pending || 0),
      approved: Number(row.approved || 0),
    });
    current.setUTCMonth(current.getUTCMonth() + 1);
  }

  return buckets;
};

const formatDuration = (seconds) => {
  const total = Math.max(0, Math.round(Number(seconds || 0)));
  if (!total) return '0m';
  const minutes = Math.floor(total / 60);
  const remainingSeconds = total % 60;
  if (minutes < 60) return remainingSeconds ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

const formatDateTime = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().replace('T', ' ').slice(0, 19);
};

const csvValue = (value) => {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const loadSchoolAdminAnalytics = async ({ schoolId, start, end }) => {
  const lateCutoff = normalizeLateCutoff();

  const [[summary = {}]] = await pool.execute(
    `SELECT
       COUNT(*) AS total_pickups,
       SUM(pl.status = 'confirmed') AS completed_pickups,
       SUM(pl.status = 'approved') AS approved_pickups,
       SUM(pl.status = 'pending') AS pending_pickups,
       SUM(pl.status = 'rejected') AS rejected_pickups,
       COUNT(DISTINCT pl.child_id) AS students_served,
       COUNT(DISTINCT pl.guardian_id) AS guardians_involved,
       COUNT(DISTINCT pl.guard_id) AS active_guards,
       SUM(TIME(pl.scanned_at) > ?) AS late_pickups,
       AVG(CASE WHEN pl.approved_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, pl.scanned_at, pl.approved_at) END) AS avg_approval_seconds,
       AVG(CASE WHEN pl.confirmed_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, pl.scanned_at, pl.confirmed_at) END) AS avg_completion_seconds
     FROM pickup_logs pl
     WHERE pl.school_id = ?
       AND DATE(pl.scanned_at) BETWEEN ? AND ?`,
    [lateCutoff, schoolId, start, end]
  );

  const [monthlyRows] = await pool.execute(
    `SELECT
       DATE_FORMAT(pl.scanned_at, '%Y-%m') AS month_key,
       COUNT(*) AS total,
       SUM(pl.status = 'confirmed') AS completed,
       SUM(pl.status = 'rejected') AS rejected,
       SUM(pl.status = 'pending') AS pending,
       SUM(pl.status = 'approved') AS approved
     FROM pickup_logs pl
     WHERE pl.school_id = ?
       AND DATE(pl.scanned_at) BETWEEN ? AND ?
     GROUP BY month_key
     ORDER BY month_key`,
    [schoolId, start, end]
  );

  const [hourlyRows] = await pool.execute(
    `SELECT HOUR(pl.scanned_at) AS hour, COUNT(*) AS total
     FROM pickup_logs pl
     WHERE pl.school_id = ?
       AND DATE(pl.scanned_at) BETWEEN ? AND ?
     GROUP BY hour
     ORDER BY total DESC, hour ASC`,
    [schoolId, start, end]
  );

  const [securityRows] = await pool.execute(
    `SELECT event_type, COUNT(*) AS total
     FROM pickup_security_events
     WHERE school_id = ?
       AND DATE(created_at) BETWEEN ? AND ?
     GROUP BY event_type`,
    [schoolId, start, end]
  );

  const [guardRows] = await pool.execute(
    `SELECT
       guard.id AS guard_id,
       TRIM(CONCAT(COALESCE(guard.firstName, ''), ' ', COALESCE(guard.lastName, ''))) AS guard_name,
       COUNT(*) AS total_scans,
       SUM(pl.status = 'confirmed') AS completed_pickups,
       SUM(pl.status = 'approved') AS approved_pickups,
       SUM(pl.status = 'pending') AS pending_pickups,
       SUM(pl.status = 'rejected') AS rejected_pickups,
       AVG(CASE WHEN pl.confirmed_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, pl.scanned_at, pl.confirmed_at) END) AS avg_completion_seconds,
       MAX(pl.scanned_at) AS last_scan_at
     FROM pickup_logs pl
     LEFT JOIN users guard ON guard.id = pl.guard_id
     WHERE pl.school_id = ?
       AND DATE(pl.scanned_at) BETWEEN ? AND ?
     GROUP BY guard.id, guard_name
     ORDER BY total_scans DESC, guard_name ASC`,
    [schoolId, start, end]
  );

  const [lateRows] = await pool.execute(
    `SELECT
       pl.id,
       c.full_name AS student_name,
       c.grade,
       TRIM(CONCAT(COALESCE(guard.firstName, ''), ' ', COALESCE(guard.lastName, ''))) AS guard_name,
       pl.scanned_at,
       pl.status
     FROM pickup_logs pl
     LEFT JOIN children c ON c.id = pl.child_id
     LEFT JOIN users guard ON guard.id = pl.guard_id
     WHERE pl.school_id = ?
       AND DATE(pl.scanned_at) BETWEEN ? AND ?
       AND TIME(pl.scanned_at) > ?
     ORDER BY pl.scanned_at DESC
     LIMIT 20`,
    [schoolId, start, end, lateCutoff]
  );

  const [rejectedRows] = await pool.execute(
    `SELECT
       pl.id,
       c.full_name AS student_name,
       TRIM(CONCAT(COALESCE(guard.firstName, ''), ' ', COALESCE(guard.lastName, ''))) AS guard_name,
       pl.rejection_reason,
       pl.rejected_at,
       pl.scanned_at
     FROM pickup_logs pl
     LEFT JOIN children c ON c.id = pl.child_id
     LEFT JOIN users guard ON guard.id = pl.guard_id
     WHERE pl.school_id = ?
       AND DATE(pl.scanned_at) BETWEEN ? AND ?
       AND pl.status = 'rejected'
     ORDER BY COALESCE(pl.rejected_at, pl.scanned_at) DESC
     LIMIT 20`,
    [schoolId, start, end]
  );

  const [securityEvents] = await pool.execute(
    `SELECT
       pse.id,
       pse.event_type,
       pse.message,
       pse.ip_address,
       pse.created_at,
       TRIM(CONCAT(COALESCE(guard.firstName, ''), ' ', COALESCE(guard.lastName, ''))) AS guard_name
     FROM pickup_security_events pse
     LEFT JOIN users guard ON guard.id = pse.guard_id
     WHERE pse.school_id = ?
       AND DATE(pse.created_at) BETWEEN ? AND ?
     ORDER BY pse.created_at DESC
     LIMIT 25`,
    [schoolId, start, end]
  );

  const security = securityRows.reduce((acc, row) => {
    acc[row.event_type] = Number(row.total || 0);
    return acc;
  }, {});

  const unauthorizedAttempts =
    Number(security.unauthorized_device || 0) +
    Number(security.tenant_mismatch || 0);

  const monthlyTrends = buildMonthBuckets(start, end, monthlyRows);
  const peakRow = hourlyRows[0] || null;

  return {
    range: { start, end, lateCutoff },
    operational: {
      totalPickups: Number(summary.total_pickups || 0),
      completedPickups: Number(summary.completed_pickups || 0),
      approvedPickups: Number(summary.approved_pickups || 0),
      pendingPickups: Number(summary.pending_pickups || 0),
      rejectedPickups: Number(summary.rejected_pickups || 0),
      studentsServed: Number(summary.students_served || 0),
      guardiansInvolved: Number(summary.guardians_involved || 0),
      activeGuards: Number(summary.active_guards || 0),
      latePickups: Number(summary.late_pickups || 0),
      avgApprovalSeconds: Math.round(Number(summary.avg_approval_seconds || 0)),
      avgApprovalTime: formatDuration(summary.avg_approval_seconds),
      avgCompletionSeconds: Math.round(Number(summary.avg_completion_seconds || 0)),
      avgCompletionTime: formatDuration(summary.avg_completion_seconds),
    },
    monthlyTrends,
    peakPickupTime: peakRow
      ? { hour: Number(peakRow.hour), label: formatHour(Number(peakRow.hour)), scans: Number(peakRow.total || 0) }
      : { hour: null, label: 'No scans', scans: 0 },
    hourlyDistribution: hourlyRows
      .slice()
      .sort((left, right) => Number(left.hour) - Number(right.hour))
      .map((row) => ({ hour: Number(row.hour), label: formatHour(Number(row.hour)), scans: Number(row.total || 0) })),
    security: {
      rejectedPickupAttempts: Number(summary.rejected_pickups || 0),
      revokedQrUsageAttempts: Number(security.revoked_qr || 0),
      unauthorizedScanAttempts: unauthorizedAttempts,
      invalidQrAttempts: Number(security.invalid_qr || 0),
      expiredQrAttempts: Number(security.expired_qr || 0),
      tenantMismatchAttempts: Number(security.tenant_mismatch || 0),
      unauthorizedDeviceAttempts: Number(security.unauthorized_device || 0),
    },
    latePickupReports: lateRows.map((row) => ({
      id: row.id,
      studentName: row.student_name || 'Student',
      grade: row.grade,
      guardName: row.guard_name || 'Guard',
      scannedAt: formatDateTime(row.scanned_at),
      status: row.status,
    })),
    rejectedAttempts: rejectedRows.map((row) => ({
      id: row.id,
      studentName: row.student_name || 'Student',
      guardName: row.guard_name || 'Guard',
      reason: row.rejection_reason || 'No reason provided',
      rejectedAt: formatDateTime(row.rejected_at || row.scanned_at),
    })),
    securityEvents: securityEvents.map((row) => ({
      id: row.id,
      type: row.event_type,
      message: row.message || '',
      ipAddress: row.ip_address || '',
      guardName: row.guard_name || 'Unknown guard',
      createdAt: formatDateTime(row.created_at),
    })),
    guardActivitySummary: guardRows.map((row) => ({
      guardId: row.guard_id,
      guardName: row.guard_name || 'Unknown guard',
      totalScans: Number(row.total_scans || 0),
      completedPickups: Number(row.completed_pickups || 0),
      approvedPickups: Number(row.approved_pickups || 0),
      pendingPickups: Number(row.pending_pickups || 0),
      rejectedPickups: Number(row.rejected_pickups || 0),
      avgCompletionSeconds: Math.round(Number(row.avg_completion_seconds || 0)),
      avgCompletionTime: formatDuration(row.avg_completion_seconds),
      lastScanAt: formatDateTime(row.last_scan_at),
    })),
  };
};

exports.getSchoolAdminAnalytics = async (req, res) => {
  try {
    const { start, end } = normalizeDateRange(req.query);
    const analytics = await loadSchoolAdminAnalytics({
      schoolId: req.user.school_id,
      start,
      end,
    });

    res.json(analytics);
  } catch (err) {
    console.error('School admin analytics error:', err);
    res.status(500).json({ error: 'Failed to load school analytics.' });
  }
};

exports.exportPickupLogsCsv = async (req, res) => {
  try {
    const { start, end } = normalizeDateRange(req.query);
    const params = [req.user.school_id, start, end];
    const where = ['pl.school_id = ?', 'DATE(pl.scanned_at) BETWEEN ? AND ?'];

    if (req.query.status && req.query.status !== 'all') {
      where.push('pl.status = ?');
      params.push(mapRequestedStatus(req.query.status));
    }

    const [rows] = await pool.execute(
      `SELECT
         pl.id,
         pl.status,
         pl.approval_status,
         pl.scanned_at,
         pl.approved_at,
         pl.rejected_at,
         pl.confirmed_at,
         pl.rejection_reason,
         pl.location,
         pl.scan_ip,
         c.full_name AS student_name,
         c.grade,
         TRIM(CONCAT(COALESCE(parent.firstName, ''), ' ', COALESCE(parent.lastName, ''))) AS parent_name,
         g.full_name AS guardian_name,
         g.relation AS guardian_relation,
         TRIM(CONCAT(COALESCE(guard.firstName, ''), ' ', COALESCE(guard.lastName, ''))) AS guard_name
       FROM pickup_logs pl
       INNER JOIN qr_assignments qa ON qa.id = pl.qr_assignment_id
       LEFT JOIN users parent ON parent.id = qa.user_id
       LEFT JOIN children c ON c.id = pl.child_id
       LEFT JOIN guardians g ON g.id = pl.guardian_id
       LEFT JOIN users guard ON guard.id = pl.guard_id
       WHERE ${where.join(' AND ')}
       ORDER BY pl.scanned_at DESC
       LIMIT 5000`,
      params
    );

    const header = [
      'Pickup ID',
      'Student',
      'Grade',
      'Parent',
      'Pickup Person',
      'Relation',
      'Guard',
      'Status',
      'Approval Status',
      'Scanned At',
      'Approved At',
      'Rejected At',
      'Confirmed At',
      'Rejection Reason',
      'Location',
      'Scan IP',
    ];

    const csvRows = [
      header,
      ...rows.map((row) => [
        row.id,
        row.student_name,
        row.grade,
        row.parent_name,
        row.guardian_name || row.parent_name,
        row.guardian_relation || 'Parent',
        row.guard_name,
        row.status,
        row.approval_status,
        formatDateTime(row.scanned_at),
        formatDateTime(row.approved_at),
        formatDateTime(row.rejected_at),
        formatDateTime(row.confirmed_at),
        row.rejection_reason,
        row.location,
        row.scan_ip,
      ]),
    ];

    const csv = csvRows.map((row) => row.map(csvValue).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="school-pickup-logs-${start}-to-${end}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('Pickup CSV export error:', err);
    res.status(500).json({ error: 'Failed to export pickup logs.' });
  }
};

exports.exportPickupSummaryPdf = async (req, res) => {
  try {
    const period = req.query.period === 'monthly' ? 'monthly' : 'daily';
    let start;
    let end;
    let reportLabel;

    if (period === 'monthly') {
      const month = isMonthString(req.query.month) ? req.query.month : new Date().toISOString().slice(0, 7);
      const [year, monthIndex] = month.split('-').map(Number);
      const first = new Date(Date.UTC(year, monthIndex - 1, 1));
      const last = new Date(Date.UTC(year, monthIndex, 0));
      start = sqlDate(first);
      end = sqlDate(last);
      reportLabel = monthLabel(month);
    } else {
      const date = isDateString(req.query.date) ? req.query.date : sqlDate(new Date());
      start = date;
      end = date;
      reportLabel = date;
    }

    const analytics = await loadSchoolAdminAnalytics({
      schoolId: req.user.school_id,
      start,
      end,
    });

    const lines = [
      `Report period: ${reportLabel}`,
      `Total pickups: ${analytics.operational.totalPickups}`,
      `Completed pickups: ${analytics.operational.completedPickups}`,
      `Approved waiting completion: ${analytics.operational.approvedPickups}`,
      `Pending approval: ${analytics.operational.pendingPickups}`,
      `Rejected pickup attempts: ${analytics.security.rejectedPickupAttempts}`,
      `Revoked QR usage attempts: ${analytics.security.revokedQrUsageAttempts}`,
      `Unauthorized scan attempts: ${analytics.security.unauthorizedScanAttempts}`,
      `Late pickup reports: ${analytics.operational.latePickups} after ${analytics.range.lateCutoff}`,
      `Peak pickup time: ${analytics.peakPickupTime.label} (${analytics.peakPickupTime.scans} scans)`,
      `Average approval time: ${analytics.operational.avgApprovalTime}`,
      `Average pickup completion time: ${analytics.operational.avgCompletionTime}`,
      '',
      'Monthly pickup trends:',
      ...analytics.monthlyTrends.map((item) =>
        `${item.label}: total ${item.total}, completed ${item.completed}, rejected ${item.rejected}, pending ${item.pending}`
      ),
      '',
      'Guard activity summary:',
      ...analytics.guardActivitySummary.map((guard) =>
        `${guard.guardName}: scans ${guard.totalScans}, completed ${guard.completedPickups}, rejected ${guard.rejectedPickups}, avg completion ${guard.avgCompletionTime}`
      ),
      '',
      'Recent security events:',
      ...(analytics.securityEvents.length
        ? analytics.securityEvents.map((event) => `${event.createdAt}: ${event.type} - ${event.message}`)
        : ['No security events in this period.']),
    ];

    const pdf = createSimplePdf({
      title: `PickupZone ${period === 'monthly' ? 'Monthly' : 'Daily'} Pickup Report`,
      subtitle: `School ID ${req.user.school_id}`,
      lines,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="pickup-${period}-report-${reportLabel}.pdf"`);
    res.send(pdf);
  } catch (err) {
    console.error('Pickup PDF export error:', err);
    res.status(500).json({ error: 'Failed to export pickup report.' });
  }
};

exports.getWeeklyStats = async (req, res) => {
  try {
    const params = [];
    const scope = buildScopedWhere(req, params);
    const [rows] = await pool.execute(`
      SELECT
        DAYNAME(pl.scanned_at) AS day,
        COUNT(*) AS scans
      FROM pickup_logs pl
      INNER JOIN qr_assignments qa ON qa.id = pl.qr_assignment_id
      WHERE ${scope}
        AND pl.scanned_at >= CURDATE() - INTERVAL 6 DAY
      GROUP BY day
    `, params);

    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const result = dayOrder.map(day => {
      const match = rows.find(r => r.day === day);
      return {
        day: day.slice(0, 3),
        scans: match ? match.scans : 0,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch weekly stats' });
  }
};

exports.getRecentPickups = async (req, res) => {
  try {
    const params = [];
    const scope = buildScopedWhere(req, params);
    const [rows] = await pool.execute(
      `SELECT pl.id
       FROM pickup_logs pl
       INNER JOIN qr_assignments qa ON qa.id = pl.qr_assignment_id
       WHERE ${scope}
       ORDER BY pl.scanned_at DESC
       LIMIT 20`,
      params
    );

    const result = [];
    for (const row of rows) {
      const details = await getPickupDetails(row.id);
      const formatted = formatPickupRow(details);
      result.push({
        id: formatted.id,
        studentName: formatted.studentName,
        guardianName: `${formatted.guardianName}${formatted.guardianRelation ? ` (${formatted.guardianRelation})` : ''}`,
        carDescription: formatted.carDescription,
        time: formatted.scannedAtDisplay,
        date: formatted.dateDisplay,
        guardName: formatted.guardName,
        status: formatted.status === 'completed'
          ? 'Completed'
          : formatted.status.charAt(0).toUpperCase() + formatted.status.slice(1),
        rawStatus: formatted.rawStatus,
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Error fetching recent pickups:', err);
    res.status(500).json({ error: 'Failed to fetch recent pickups' });
  }
};
