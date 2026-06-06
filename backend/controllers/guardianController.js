const pool = require('../config/db');
const { getAllGuardians } = require('../models/guardianModel');
const { generateQRCodesForUser } = require('../utils/qrUtil');
const { getAllChildren } = require('../models/childModel');
const {
  CONTACT_TYPE_GUARDIAN,
  CONTACT_TYPE_SECOND_PARENT,
  contactTypeWhere,
  ensureGuardianContactSchema,
  normalizeStatus,
  normalizeVehicle,
  validateGuardianLikeContact,
} = require('../services/guardianContactService');
const {
  getFamilyDocumentVerificationStatus,
  isDocumentVerificationRequiredForParent,
} = require('../services/documentVerificationService');

const sameId = (left, right) => Number(left) === Number(right);

const revokeActiveQRCodesForParent = async (userId, actorId) => {
  const [result] = await pool.execute(
    `UPDATE qr_assignments
     SET status = 'Revoked',
         revoked_at = NOW(),
         revoked_by = ?,
         last_rotated_at = NOW()
     WHERE user_id = ?
       AND status = 'Active'`,
    [actorId || userId, userId]
  );

  return result.affectedRows || 0;
};

const revokeActiveQRCodesForGuardian = async (guardianId, actorId) => {
  const [result] = await pool.execute(
    `UPDATE qr_assignments
     SET status = 'Revoked',
         revoked_at = NOW(),
         revoked_by = ?,
         last_rotated_at = NOW()
     WHERE guardian_id = ?
       AND status = 'Active'`,
    [actorId, guardianId]
  );

  return result.affectedRows || 0;
};

const refreshQRCodesIfFamilyReady = async (userId, actorId) => {
  const [[parent]] = await pool.execute(
    'SELECT status FROM users WHERE id = ? AND role = ?',
    [userId, 'parent']
  );

  if (String(parent?.status || '').toLowerCase() !== 'active') {
    const revokedCount = await revokeActiveQRCodesForParent(userId, actorId || userId);
    return {
      generated: false,
      revoked: revokedCount > 0,
      revokedCount,
      reason: 'parent_not_active',
    };
  }

  const documentsRequired = await isDocumentVerificationRequiredForParent(userId);
  const documentVerification = documentsRequired ? await getFamilyDocumentVerificationStatus(userId) : null;

  if (documentsRequired && !documentVerification.summary.complete) {
    const revokedCount = await revokeActiveQRCodesForParent(userId, actorId || userId);
    return {
      generated: false,
      revoked: revokedCount > 0,
      revokedCount,
      reason: 'documents_incomplete',
      documentVerification,
    };
  }

  const qrCodes = await generateQRCodesForUser(userId, getAllChildren, getAllGuardians, { revokedBy: actorId || userId });
  return {
    generated: qrCodes.length > 0,
    count: qrCodes.length,
    revoked: false,
    reason: null,
    documentVerification,
  };
};

const assertParentRole = (req, message) => {
  if (req.user.role !== 'parent') {
    const error = new Error(message || 'Only parent accounts can manage this contact.');
    error.statusCode = 403;
    throw error;
  }
};

const validateContactBasics = ({ full_name, relation, phone }) => {
  const normalized = {
    full_name: String(full_name || '').trim(),
    relation: String(relation || '').trim(),
    phone: String(phone || '').trim(),
  };

  if (!normalized.full_name) {
    const error = new Error('Full name is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!normalized.relation) {
    const error = new Error('Relation to child is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!normalized.phone) {
    const error = new Error('Phone number is required.');
    error.statusCode = 400;
    throw error;
  }

  return normalized;
};

const getScopedGuardian = async (guardianId, req, contactType = CONTACT_TYPE_GUARDIAN) => {
  await ensureGuardianContactSchema();

  const [params, typeFilter] = contactType
    ? [[guardianId], ` AND ${contactTypeWhere('g', contactType)}`]
    : [[guardianId], ''];

  const [[guardian]] = await pool.execute(
    `SELECT g.*, u.school_id AS parent_school_id
     FROM guardians g
     INNER JOIN users u ON u.id = g.user_id
     WHERE g.id = ?${typeFilter}`,
    params
  );

  if (!guardian) {
    const error = new Error('Guardian not found');
    error.statusCode = 404;
    throw error;
  }

  if (req.user.role === 'parent' && sameId(guardian.user_id, req.user.id)) return guardian;
  if (req.user.role === 'admin' && sameId(guardian.parent_school_id, req.user.school_id)) return guardian;

  const error = new Error('You can only access guardians in your school or family.');
  error.statusCode = 403;
  throw error;
};

const groupContactRows = (rows) => Object.values(rows.reduce((acc, row) => {
  const {
    id,
    full_name,
    relation,
    phone,
    status,
    contact_type,
    created_at,
    vehicle_id,
    vehicle_name,
    make,
    model,
    color,
    plate_number,
    year,
  } = row;

  if (!acc[id]) {
    acc[id] = {
      id,
      full_name,
      relation,
      phone,
      status,
      contact_type: contact_type || CONTACT_TYPE_GUARDIAN,
      created_at,
      vehicle: vehicle_id
        ? {
            id: vehicle_id,
            name: vehicle_name,
            make,
            model,
            color,
            plate_number,
            year,
          }
        : null,
    };
  }

  return acc;
}, {}));

const fetchContactsForUser = async (userId, contactType) => {
  const [rows] = await pool.execute(
    `SELECT g.*, v.id as vehicle_id, v.name AS vehicle_name, v.make, v.model, v.color, v.plate_number, v.year
     FROM guardians g
     LEFT JOIN vehicles v ON g.id = v.guardian_id
     WHERE g.user_id = ?
       AND ${contactTypeWhere('g', contactType)}
     ORDER BY g.created_at DESC, g.id DESC`,
    [userId]
  );

  return groupContactRows(rows);
};

const countContacts = async (executor, userId, contactType) => {
  const [[row]] = await executor.execute(
    `SELECT COUNT(*) AS total
     FROM guardians g
     WHERE g.user_id = ?
       AND ${contactTypeWhere('g', contactType)}`,
    [userId]
  );

  return Number(row.total || 0);
};

const insertContactWithVehicle = async (executor, userId, contactType, contact) => {
  const [result] = await executor.execute(
    `INSERT INTO guardians (user_id, full_name, relation, phone, status, contact_type)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, contact.full_name, contact.relation, contact.phone, 'Active', contactType]
  );
  const guardianId = result.insertId;

  await executor.execute(
    `INSERT INTO vehicles (guardian_id, name, make, model, color, plate_number, year)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      guardianId,
      contact.vehicle.name,
      contact.vehicle.make,
      contact.vehicle.model,
      contact.vehicle.color,
      contact.vehicle.plate_number,
      contact.vehicle.year,
    ]
  );

  return guardianId;
};

const upsertVehicle = async (executor, guardianId, vehicle) => {
  if (!vehicle) return;

  const normalizedVehicle = normalizeVehicle(vehicle);
  const [existingVehicle] = await executor.execute(
    'SELECT id FROM vehicles WHERE guardian_id = ?',
    [guardianId]
  );

  if (existingVehicle.length > 0) {
    await executor.execute(
      'UPDATE vehicles SET name = ?, make = ?, model = ?, color = ?, plate_number = ?, year = ? WHERE guardian_id = ?',
      [
        normalizedVehicle.name,
        normalizedVehicle.make,
        normalizedVehicle.model,
        normalizedVehicle.color,
        normalizedVehicle.plate_number,
        normalizedVehicle.year,
        guardianId,
      ]
    );
    return;
  }

  await executor.execute(
    'INSERT INTO vehicles (guardian_id, name, make, model, color, plate_number, year) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      guardianId,
      normalizedVehicle.name,
      normalizedVehicle.make,
      normalizedVehicle.model,
      normalizedVehicle.color,
      normalizedVehicle.plate_number,
      normalizedVehicle.year,
    ]
  );
};

exports.getGuardians = async (req, res) => {
  try {
    await ensureGuardianContactSchema();

    const role = req.user.role;
    let userId = req.user.id;
    let rows;

    if (role === 'admin' && req.query.parent_id) {
      const [[parent]] = await pool.execute(
        'SELECT id FROM users WHERE id = ? AND role = ? AND school_id = ?',
        [req.query.parent_id, 'parent', req.user.school_id]
      );

      if (!parent) {
        return res.status(403).json({ error: 'You can only view guardians for parents in your school.' });
      }

      userId = req.query.parent_id;
    }

    if (role === 'admin' && !req.query.parent_id) {
      [rows] = await pool.execute(
        `SELECT g.*, v.id as vehicle_id, v.name AS vehicle_name, v.make, v.model, v.color, v.plate_number, v.year
         FROM guardians g
         INNER JOIN users u ON u.id = g.user_id
         LEFT JOIN vehicles v ON g.id = v.guardian_id
         WHERE u.school_id = ?
           AND ${contactTypeWhere('g', CONTACT_TYPE_GUARDIAN)}
         ORDER BY g.full_name`,
        [req.user.school_id]
      );
    } else {
      [rows] = await pool.execute(
        `SELECT g.*, v.id as vehicle_id, v.name AS vehicle_name, v.make, v.model, v.color, v.plate_number, v.year
         FROM guardians g
         LEFT JOIN vehicles v ON g.id = v.guardian_id
         WHERE g.user_id = ?
           AND ${contactTypeWhere('g', CONTACT_TYPE_GUARDIAN)}
         ORDER BY g.created_at DESC, g.id DESC`,
        [userId]
      );
    }

    res.json(groupContactRows(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGuardian = async (req, res) => {
  try {
    const guardianId = req.params.id;
    await getScopedGuardian(guardianId, req, CONTACT_TYPE_GUARDIAN);

    const [rows] = await pool.execute(
      `SELECT g.*, v.id as vehicle_id, v.name AS vehicle_name, v.make, v.model, v.color, v.plate_number, v.year
       FROM guardians g
       LEFT JOIN vehicles v ON g.id = v.guardian_id
       WHERE g.id = ?
         AND ${contactTypeWhere('g', CONTACT_TYPE_GUARDIAN)}`,
      [guardianId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Guardian not found' });

    res.json(groupContactRows(rows)[0]);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.addGuardian = async (req, res) => {
  let connection;
  let committed = false;

  try {
    await ensureGuardianContactSchema();
    connection = await pool.getConnection();
    assertParentRole(req, 'Only parent accounts can add guardians to their family.');

    const userId = req.user.id;
    const contact = validateGuardianLikeContact(req.body);

    await connection.beginTransaction();

    const guardianCount = await countContacts(connection, userId, CONTACT_TYPE_GUARDIAN);
    if (guardianCount >= 2) {
      const error = new Error('You can add up to 2 guardians.');
      error.statusCode = 400;
      throw error;
    }

    const guardianId = await insertContactWithVehicle(connection, userId, CONTACT_TYPE_GUARDIAN, contact);
    await connection.commit();
    committed = true;

    const qrRefresh = await refreshQRCodesIfFamilyReady(userId, userId);

    res.status(201).json({ id: guardianId, qrRefresh });
  } catch (err) {
    if (connection && !committed) await connection.rollback();
    res.status(err.statusCode || 500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
};

exports.updateGuardian = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const guardianId = req.params.id;
    const { full_name, relation, phone, status, vehicle } = req.body;
    const guardian = await getScopedGuardian(guardianId, req, CONTACT_TYPE_GUARDIAN);
    const contact = validateContactBasics({ full_name, relation, phone });
    const nextStatus = normalizeStatus(status);

    await connection.beginTransaction();

    await connection.execute(
      'UPDATE guardians SET full_name = ?, relation = ?, phone = ?, status = ? WHERE id = ?',
      [contact.full_name, contact.relation, contact.phone, nextStatus, guardianId]
    );

    await upsertVehicle(connection, guardianId, vehicle);

    await connection.commit();

    const qrRefresh = nextStatus === 'Inactive'
      ? {
        generated: false,
        revoked: (await revokeActiveQRCodesForGuardian(guardianId, req.user.id)) > 0,
        reason: 'guardian_inactive',
      }
      : await refreshQRCodesIfFamilyReady(guardian.user_id, req.user.id);

    res.json({ message: 'Guardian updated', qrRefresh });
  } catch (err) {
    await connection.rollback();
    res.status(err.statusCode || 500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

exports.deleteGuardian = async (req, res) => {
  try {
    const guardianId = req.params.id;
    await getScopedGuardian(guardianId, req, CONTACT_TYPE_GUARDIAN);

    await pool.execute(
      `UPDATE qr_assignments
       SET status = 'Revoked',
           revoked_at = NOW(),
           revoked_by = ?,
           last_rotated_at = NOW()
       WHERE guardian_id = ?
         AND status = 'Active'`,
      [req.user.id, guardianId]
    );
    await pool.execute('DELETE FROM guardians WHERE id = ?', [guardianId]);
    res.json({ message: 'Guardian deleted' });
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.getSecondParents = async (req, res) => {
  try {
    await ensureGuardianContactSchema();
    assertParentRole(req, 'Only parent accounts can view second parent access.');
    res.json(await fetchContactsForUser(req.user.id, CONTACT_TYPE_SECOND_PARENT));
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.addSecondParent = async (req, res) => {
  let connection;
  let committed = false;

  try {
    await ensureGuardianContactSchema();
    connection = await pool.getConnection();
    assertParentRole(req, 'Only parent accounts can add a second parent.');

    const userId = req.user.id;
    const contact = validateGuardianLikeContact(req.body);

    await connection.beginTransaction();

    const secondParentCount = await countContacts(connection, userId, CONTACT_TYPE_SECOND_PARENT);
    if (secondParentCount >= 1) {
      const error = new Error('A second parent is already added for this family.');
      error.statusCode = 400;
      throw error;
    }

    const secondParentId = await insertContactWithVehicle(
      connection,
      userId,
      CONTACT_TYPE_SECOND_PARENT,
      contact
    );
    await connection.commit();
    committed = true;

    const qrRefresh = await refreshQRCodesIfFamilyReady(userId, userId);

    res.status(201).json({ id: secondParentId, qrRefresh });
  } catch (err) {
    if (connection && !committed) await connection.rollback();
    res.status(err.statusCode || 500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
};

exports.updateSecondParent = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    assertParentRole(req, 'Only parent accounts can update a second parent.');

    const secondParentId = req.params.id;
    const { full_name, relation, phone, status, vehicle } = req.body;
    const secondParent = await getScopedGuardian(secondParentId, req, CONTACT_TYPE_SECOND_PARENT);
    const contact = validateContactBasics({ full_name, relation, phone });
    const nextStatus = normalizeStatus(status);

    await connection.beginTransaction();
    await connection.execute(
      'UPDATE guardians SET full_name = ?, relation = ?, phone = ?, status = ? WHERE id = ?',
      [contact.full_name, contact.relation, contact.phone, nextStatus, secondParentId]
    );
    await upsertVehicle(connection, secondParentId, vehicle);
    await connection.commit();

    const qrRefresh = nextStatus === 'Inactive'
      ? {
        generated: false,
        revoked: (await revokeActiveQRCodesForGuardian(secondParentId, req.user.id)) > 0,
        reason: 'second_parent_inactive',
      }
      : await refreshQRCodesIfFamilyReady(secondParent.user_id, req.user.id);

    res.json({ message: 'Second parent updated', qrRefresh });
  } catch (err) {
    await connection.rollback();
    res.status(err.statusCode || 500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

exports.deleteSecondParent = async (req, res) => {
  try {
    assertParentRole(req, 'Only parent accounts can remove a second parent.');

    const secondParentId = req.params.id;
    await getScopedGuardian(secondParentId, req, CONTACT_TYPE_SECOND_PARENT);

    await pool.execute(
      `UPDATE qr_assignments
       SET status = 'Revoked',
           revoked_at = NOW(),
           revoked_by = ?,
           last_rotated_at = NOW()
       WHERE guardian_id = ?
         AND status = 'Active'`,
      [req.user.id, secondParentId]
    );
    await pool.execute('DELETE FROM guardians WHERE id = ?', [secondParentId]);
    res.json({ message: 'Second parent removed' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};
