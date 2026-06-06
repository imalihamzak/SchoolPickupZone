const pool = require('../config/db');
const {
  getActiveDutyGuards,
  getGuardDutyState,
  normalizeDutyDate,
} = require('../services/guardDutyService');
const { ensureNotificationTypeSchema } = require('../services/notificationTypeService');
const { getParentPickupVehicle } = require('../services/parentPickupProfileService');

const MESSAGE_TYPES = {
  running_late: 'Running late',
  car_line_issue: 'Car line issue',
  need_assistance: 'Need assistance',
  other: 'Other',
};

let parentGuardMessagesTableReady = false;

const sameId = (left, right) => Number(left) === Number(right);

const ensureParentGuardMessageColumn = async (sql) => {
  try {
    await pool.execute(sql);
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') throw err;
  }
};

const ensureParentGuardMessagesTable = async () => {
  if (parentGuardMessagesTableReady) return;

  await pool.execute(
    `CREATE TABLE IF NOT EXISTS parent_guard_messages (
      id int(11) NOT NULL AUTO_INCREMENT,
      school_id int(11) NOT NULL,
      parent_id int(11) NOT NULL,
      pickup_log_id int(11) DEFAULT NULL,
      message_type varchar(40) NOT NULL,
      message text DEFAULT NULL,
      children_summary varchar(500) DEFAULT NULL,
      vehicle_summary varchar(255) DEFAULT NULL,
      target_guard_ids text DEFAULT NULL,
      guard_notified_count int(11) NOT NULL DEFAULT 0,
      admin_notified tinyint(1) NOT NULL DEFAULT 0,
      delivery_status varchar(32) NOT NULL DEFAULT 'pending',
      delivery_error varchar(255) DEFAULT NULL,
      acknowledged_by int(11) DEFAULT NULL,
      acknowledged_at datetime DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (id),
      KEY idx_parent_guard_messages_school_created (school_id, created_at),
      KEY idx_parent_guard_messages_parent_created (parent_id, created_at),
      KEY idx_parent_guard_messages_pickup (pickup_log_id),
      KEY idx_parent_guard_messages_ack (acknowledged_by, acknowledged_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
  );

  await ensureParentGuardMessageColumn(
    'ALTER TABLE parent_guard_messages ADD COLUMN guard_notified_count int(11) NOT NULL DEFAULT 0'
  );
  await ensureParentGuardMessageColumn(
    "ALTER TABLE parent_guard_messages ADD COLUMN delivery_status varchar(32) NOT NULL DEFAULT 'pending'"
  );
  await ensureParentGuardMessageColumn(
    'ALTER TABLE parent_guard_messages ADD COLUMN delivery_error varchar(255) DEFAULT NULL'
  );
  await ensureParentGuardMessageColumn(
    'ALTER TABLE parent_guard_messages ADD COLUMN target_guard_ids text DEFAULT NULL'
  );
  await ensureParentGuardMessageColumn(
    'ALTER TABLE parent_guard_messages ADD COLUMN acknowledged_by int(11) DEFAULT NULL'
  );
  await ensureParentGuardMessageColumn(
    'ALTER TABLE parent_guard_messages ADD COLUMN acknowledged_at datetime DEFAULT NULL'
  );
  await pool.execute(
    'ALTER TABLE parent_guard_messages MODIFY target_guard_ids text DEFAULT NULL'
  );

  parentGuardMessagesTableReady = true;
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

    emitToUser(io, connectedAdmins, userId, 'pickup_event', {
      id: String(result.insertId),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      ...extra,
    });

    inserted.push({ userId, id: result.insertId });
  }

  return inserted;
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
      console.error(`Parent guard message notification failed for user ${userId}:`, err);
      errors.push(err);
    }
  }

  return { delivered, errors };
};

const getActiveSchoolGuardIds = async (schoolId) => {
  const [guards] = await pool.execute(
    `SELECT id
     FROM users
     WHERE role = 'guard'
       AND school_id = ?
       AND LOWER(COALESCE(status, 'active')) = 'active'
     ORDER BY firstName, lastName, id`,
    [schoolId]
  );

  return guards.map((guard) => guard.id);
};

const getSchoolAdminIds = async (schoolId) => {
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

const getDutyTargetGuardIds = async (schoolId, dutyDate = normalizeDutyDate()) => {
  const [scannerGuards, releaseGuards] = await Promise.all([
    getActiveDutyGuards(pool, schoolId, 'scanner', dutyDate).catch((err) => {
      console.error('Parent message scanner duty lookup error:', err);
      return [];
    }),
    getActiveDutyGuards(pool, schoolId, 'release', dutyDate).catch((err) => {
      console.error('Parent message release duty lookup error:', err);
      return [];
    }),
  ]);

  const dutyGuardIds = [...new Set(
    [...scannerGuards, ...releaseGuards]
      .map((guard) => guard.id)
      .filter(Boolean)
  )];

  return dutyGuardIds.length ? dutyGuardIds : getActiveSchoolGuardIds(schoolId);
};

const normalizeMessageType = (value) => {
  const type = String(value || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(MESSAGE_TYPES, type) ? type : 'other';
};

const normalizeMessageText = (value) => String(value || '').trim().replace(/\s+/g, ' ').slice(0, 600);

const normalizeDbDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return normalizeDutyDate(`${year}-${month}-${day}`);
  }

  return normalizeDutyDate(String(value || '').slice(0, 10));
};

const displayName = (row, fallback = 'User') => {
  const name = [row?.firstName, row?.lastName].filter(Boolean).join(' ').trim();
  return name || row?.email || fallback;
};

const describeVehicle = (vehicle) => {
  if (!vehicle) return 'No vehicle registered';
  const label = vehicle.name || 'Vehicle';
  const details = [vehicle.make, vehicle.model, vehicle.color].filter(Boolean).join(', ');
  const plate = vehicle.plate_number ? `Plate: ${vehicle.plate_number}` : '';
  const joined = [details, plate].filter(Boolean).join(', ');
  return joined ? `${label} (${joined})` : label;
};

const getParentProfile = async (parentId) => {
  const [[parent]] = await pool.execute(
    `SELECT id, firstName, lastName, email, phone, school_id, status
     FROM users
     WHERE id = ?
       AND role = 'parent'
     LIMIT 1`,
    [parentId]
  );

  if (!parent) {
    const error = new Error('Parent account was not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!parent.school_id) {
    const error = new Error('Parent account is not linked to a school.');
    error.statusCode = 403;
    throw error;
  }

  if (String(parent.status || '').toLowerCase() !== 'active') {
    const error = new Error('Parent account must be active before messaging pickup staff.');
    error.statusCode = 403;
    throw error;
  }

  return parent;
};

const getParentChildren = async (parentId) => {
  const [children] = await pool.execute(
    `SELECT id, full_name, grade
     FROM children
     WHERE user_id = ?
     ORDER BY full_name ASC, id ASC`,
    [parentId]
  );

  return children;
};

const getActivePickupForParent = async (schoolId, parentId) => {
  const [[pickup]] = await pool.execute(
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

  return pickup?.id || null;
};

const formatMessageRow = (row) => ({
  id: row.id,
  schoolId: row.school_id,
  parentId: row.parent_id,
  parentName: row.parent_name || row.parent_email || 'Parent',
  parentPhone: row.parent_phone || null,
  pickupId: row.pickup_log_id || null,
  messageType: row.message_type,
  messageTypeLabel: MESSAGE_TYPES[row.message_type] || 'Message',
  message: row.message || '',
  childrenSummary: row.children_summary || 'Family students',
  vehicleSummary: row.vehicle_summary || 'No vehicle registered',
  guardNotifiedCount: Number(row.guard_notified_count || 0),
  adminNotified: Boolean(row.admin_notified),
  deliveryStatus: row.delivery_status || 'pending',
  acknowledged: Boolean(row.acknowledged_at),
  acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at).toISOString() : null,
  acknowledgedByName: row.acknowledged_by_name || null,
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
});

const getMessageRows = async (whereClause, params, limit = 20) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const [rows] = await pool.execute(
    `SELECT
       pgm.*,
       TRIM(CONCAT(COALESCE(parent.firstName, ''), ' ', COALESCE(parent.lastName, ''))) AS parent_name,
       parent.email AS parent_email,
       parent.phone AS parent_phone,
       TRIM(CONCAT(COALESCE(ack.firstName, ''), ' ', COALESCE(ack.lastName, ''))) AS acknowledged_by_name
     FROM parent_guard_messages pgm
     INNER JOIN users parent ON parent.id = pgm.parent_id
     LEFT JOIN users ack ON ack.id = pgm.acknowledged_by
     WHERE ${whereClause}
     ORDER BY pgm.created_at DESC, pgm.id DESC
     LIMIT ${safeLimit}`,
    params
  );

  return rows.map(formatMessageRow);
};

exports.sendParentGuardMessage = async (req, res) => {
  const io = req.app.get('io');
  const connectedAdmins = req.app.get('connectedAdmins');

  try {
    await ensureParentGuardMessagesTable();

    const parent = await getParentProfile(req.user.id);
    const children = await getParentChildren(parent.id);
    if (!children.length) {
      return res.status(400).json({ error: 'Add a child before messaging pickup staff.' });
    }

    const messageType = normalizeMessageType(req.body?.message_type || req.body?.messageType);
    const note = normalizeMessageText(req.body?.message || req.body?.note);
    if (messageType === 'other' && !note) {
      return res.status(400).json({ error: 'Please add a short message for this pickup note.' });
    }

    const [[recentMessage]] = await pool.execute(
      `SELECT id
       FROM parent_guard_messages
       WHERE parent_id = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL 45 SECOND)
         AND COALESCE(delivery_status, 'delivered') <> 'failed'
       ORDER BY created_at DESC
       LIMIT 1`,
      [parent.id]
    );

    if (recentMessage) {
      return res.status(429).json({ error: 'A pickup team message was just sent. Please wait a moment before sending another.' });
    }

    const dutyDate = normalizeDutyDate();
    const targetGuardIds = await getDutyTargetGuardIds(parent.school_id, dutyDate);
    const adminIds = await getSchoolAdminIds(parent.school_id);
    const pickupId = await getActivePickupForParent(parent.school_id, parent.id);
    const vehicle = await getParentPickupVehicle(pool, parent.id);
    const parentName = displayName(parent, 'Parent');
    const messageLabel = MESSAGE_TYPES[messageType];
    const childrenSummary = children
      .map((child) => `${child.full_name}${child.grade ? `, Grade ${child.grade}` : ''}`)
      .join('; ')
      .slice(0, 500);
    const vehicleSummary = describeVehicle(vehicle).slice(0, 255);
    const noteText = note ? ` Note: ${note}` : '';
    const activePickupText = pickupId ? ` Active request #${pickupId}.` : '';
    const notificationMessage = `${parentName}: ${messageLabel}.${noteText} Children: ${childrenSummary}. Vehicle: ${vehicleSummary}.${activePickupText}`.slice(0, 900);

    const [insertResult] = await pool.execute(
      `INSERT INTO parent_guard_messages (
         school_id,
         parent_id,
         pickup_log_id,
         message_type,
         message,
         children_summary,
         vehicle_summary,
         target_guard_ids,
         guard_notified_count,
         admin_notified
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [
        parent.school_id,
        parent.id,
        pickupId,
        messageType,
        note || null,
        childrenSummary,
        vehicleSummary,
        targetGuardIds.join(',') || null,
      ]
    );

    const extra = {
      school_id: parent.school_id,
      parent_id: parent.id,
      pickup_id: pickupId,
      parent_guard_message_id: insertResult.insertId,
      message_type: messageType,
      duty_date: dutyDate,
    };
    const deliveryErrors = [];
    const guardDelivery = await notifyUsersBestEffort(
      targetGuardIds,
      'Parent Pickup Message',
      notificationMessage,
      'parent_message',
      io,
      connectedAdmins,
      extra
    );
    deliveryErrors.push(...guardDelivery.errors);

    const adminDelivery = await notifyUsersBestEffort(
      adminIds,
      'Parent Message to Pickup Team',
      notificationMessage,
      'parent_message',
      io,
      connectedAdmins,
      extra
    );
    deliveryErrors.push(...adminDelivery.errors);

    const guardNotifiedCount = guardDelivery.delivered.length;
    const adminNotified = adminDelivery.delivered.length > 0;
    const deliveryStatus = guardNotifiedCount || adminNotified
      ? 'delivered'
      : deliveryErrors.length || targetGuardIds.length || adminIds.length
        ? 'failed'
        : 'no_recipients';
    const deliveryError = deliveryErrors.length
      ? deliveryErrors.map((err) => err.message || 'Notification delivery failed').join('; ').slice(0, 255)
      : null;

    await pool.execute(
      `UPDATE parent_guard_messages
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
        error: 'Message was saved, but live notification delivery could not be confirmed. Please call the school if this is urgent.',
        id: insertResult.insertId,
        recorded: true,
      });
    }

    let warning = null;
    if (targetGuardIds.length && guardNotifiedCount === 0 && adminNotified) {
      warning = 'School admin was notified, but duty guard delivery could not be confirmed.';
    } else if (targetGuardIds.length && guardNotifiedCount < targetGuardIds.length) {
      warning = `Message reached ${guardNotifiedCount} of ${targetGuardIds.length} duty guard recipients.`;
    } else if (!targetGuardIds.length && adminNotified) {
      warning = 'No duty guard was available. School admin was notified.';
    } else if (!targetGuardIds.length && !adminNotified) {
      warning = 'No duty guard or admin was available. Message was saved for audit only.';
    }
    const responseMessage = guardNotifiedCount
      ? 'Message sent to the pickup team.'
      : adminNotified
        ? 'No duty guard was available. School admin was notified.'
        : 'No duty guard or admin was available. Message was saved.';

    res.status(201).json({
      message: responseMessage,
      warning,
      id: insertResult.insertId,
      pickupId,
      alertedGuardCount: guardNotifiedCount,
      intendedGuardCount: targetGuardIds.length,
      adminNotified,
    });
  } catch (err) {
    console.error('Send parent guard message error:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to send pickup team message.' });
  }
};

exports.getParentGuardMessages = async (req, res) => {
  try {
    await ensureParentGuardMessagesTable();

    if (req.user.role === 'parent') {
      const parent = await getParentProfile(req.user.id);
      const messages = await getMessageRows('pgm.parent_id = ?', [parent.id], req.query.limit);
      return res.json({ messages });
    }

    if (req.user.role === 'guard') {
      const [[guard]] = await pool.execute(
        `SELECT id, school_id, status
         FROM users
         WHERE id = ?
           AND role = 'guard'
         LIMIT 1`,
        [req.user.id]
      );

      if (!guard || !guard.school_id || String(guard.status || '').toLowerCase() !== 'active') {
        return res.status(403).json({ error: 'Only active guards assigned to a school can view pickup team messages.' });
      }

      const dutyDate = normalizeDutyDate(req.query.date);
      const duty = await getGuardDutyState(pool, guard.school_id, guard.id, dutyDate).catch((err) => {
        console.error('Parent message guard duty lookup error:', err);
        return { date: dutyDate, dutyRole: null, isOnDuty: false, isScanner: false, isRelease: false };
      });
      const messages = await getMessageRows(
        `pgm.school_id = ?
         AND DATE(pgm.created_at) = ?
         AND (
           pgm.target_guard_ids IS NULL
           OR FIND_IN_SET(?, pgm.target_guard_ids)
           OR ? = 1
         )`,
        [guard.school_id, dutyDate, String(guard.id), duty.isOnDuty ? 1 : 0],
        req.query.limit
      );

      return res.json({ date: dutyDate, duty, messages });
    }

    res.status(403).json({ error: 'Access forbidden.' });
  } catch (err) {
    console.error('Get parent guard messages error:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to load pickup team messages.' });
  }
};

exports.acknowledgeParentGuardMessage = async (req, res) => {
  try {
    await ensureParentGuardMessagesTable();

    const messageId = Number(req.params.id);
    if (!Number.isFinite(messageId) || messageId <= 0) {
      return res.status(400).json({ error: 'Invalid message id.' });
    }

    const [[guard]] = await pool.execute(
      `SELECT id, school_id, status
       FROM users
       WHERE id = ?
         AND role = 'guard'
       LIMIT 1`,
      [req.user.id]
    );

    if (!guard || !guard.school_id || String(guard.status || '').toLowerCase() !== 'active') {
      return res.status(403).json({ error: 'Only active guards assigned to a school can acknowledge pickup messages.' });
    }

    const [[message]] = await pool.execute(
      `SELECT id, school_id, target_guard_ids, DATE(created_at) AS message_date
       FROM parent_guard_messages
       WHERE id = ?
       LIMIT 1`,
      [messageId]
    );

    if (!message) {
      return res.status(404).json({ error: 'Pickup team message was not found.' });
    }

    if (!sameId(message.school_id, guard.school_id)) {
      return res.status(403).json({ error: 'You can only acknowledge messages for your school.' });
    }

    const dutyDate = normalizeDbDate(message.message_date);
    const duty = await getGuardDutyState(pool, guard.school_id, guard.id, dutyDate).catch(() => ({ isOnDuty: false }));
    const targetIds = String(message.target_guard_ids || '')
      .split(',')
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);
    const targeted = !targetIds.length || targetIds.some((targetId) => sameId(targetId, guard.id));

    if (!targeted && !duty.isOnDuty) {
      return res.status(403).json({ error: 'Only a targeted or on-duty guard can acknowledge this message.' });
    }

    await pool.execute(
      `UPDATE parent_guard_messages
       SET acknowledged_by = COALESCE(acknowledged_by, ?),
           acknowledged_at = COALESCE(acknowledged_at, NOW())
       WHERE id = ?`,
      [guard.id, messageId]
    );

    res.json({ message: 'Pickup team message acknowledged.' });
  } catch (err) {
    console.error('Acknowledge parent guard message error:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to acknowledge pickup team message.' });
  }
};
