const pool = require('../config/db');
const {
  ensureGuardDutyRosterTable,
  normalizeDutyDate,
  normalizeDutyRole,
} = require('../services/guardDutyService');

const sameId = (left, right) => Number(left) === Number(right);

const isActiveUser = (status) => String(status || 'active').toLowerCase() === 'active';

const mapRosterRow = (row) => {
  const canServeDuty = isActiveUser(row.status);
  const dutyRole = canServeDuty ? normalizeDutyRole(row.duty_role) : null;

  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    status: row.status,
    deviceCount: Number(row.deviceCount || 0),
    dutyRole,
    isOnDuty: Boolean(canServeDuty && row.roster_id && row.is_active),
  };
};

const summarizeRoster = (guards) => {
  const summary = {
    scanner: 0,
    release: 0,
    both: 0,
    off: 0,
  };

  guards.forEach((guard) => {
    if (guard.dutyRole === 'both') {
      summary.both += 1;
      summary.scanner += 1;
      summary.release += 1;
    } else if (guard.dutyRole === 'scanner') {
      summary.scanner += 1;
    } else if (guard.dutyRole === 'release') {
      summary.release += 1;
    } else {
      summary.off += 1;
    }
  });

  return summary;
};

const loadRoster = async (executor, schoolId, dutyDate) => {
  await ensureGuardDutyRosterTable(executor);

  const [rows] = await executor.execute(
    `SELECT
       u.id,
       u.firstName,
       u.lastName,
       u.email,
       u.phone,
       u.status,
       COALESCE(device_counts.device_count, 0) AS deviceCount,
       gdr.id AS roster_id,
       gdr.duty_role,
       gdr.is_active
     FROM users u
     LEFT JOIN (
       SELECT guard_id, COUNT(*) AS device_count
       FROM guard_devices
       GROUP BY guard_id
     ) device_counts ON device_counts.guard_id = u.id
     LEFT JOIN guard_duty_roster gdr
       ON gdr.guard_id = u.id
      AND gdr.school_id = u.school_id
      AND gdr.duty_date = ?
      AND gdr.is_active = 1
     WHERE u.role = 'guard'
       AND u.school_id = ?
     ORDER BY
       LOWER(COALESCE(u.status, 'active')) = 'active' DESC,
       u.firstName,
       u.lastName,
       u.id`,
    [dutyDate, schoolId]
  );

  const guards = rows.map(mapRosterRow);
  return {
    date: dutyDate,
    guards,
    summary: summarizeRoster(guards),
  };
};

exports.getDutyRoster = async (req, res) => {
  try {
    const dutyDate = normalizeDutyDate(req.query.date);
    const roster = await loadRoster(pool, req.user.school_id, dutyDate);
    res.json(roster);
  } catch (err) {
    console.error('Duty roster load error:', err);
    res.status(500).json({ error: 'Failed to load duty roster.' });
  }
};

exports.updateDutyRoster = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const dutyDate = normalizeDutyDate(req.body.date);
    const rawAssignments = Array.isArray(req.body.assignments) ? req.body.assignments : [];
    const assignments = rawAssignments
      .map((assignment) => ({
        guardId: Number(assignment.guardId ?? assignment.guard_id ?? assignment.id),
        dutyRole: normalizeDutyRole(assignment.dutyRole ?? assignment.duty_role ?? assignment.role),
      }))
      .filter((assignment) => Number.isFinite(assignment.guardId) && assignment.dutyRole);

    const uniqueGuardIds = [...new Set(assignments.map((assignment) => assignment.guardId))];

    await ensureGuardDutyRosterTable(connection);
    await connection.beginTransaction();

    if (uniqueGuardIds.length) {
      const placeholders = uniqueGuardIds.map(() => '?').join(',');
      const [guards] = await connection.execute(
        `SELECT id, school_id
         FROM users
         WHERE role = 'guard'
           AND school_id = ?
           AND LOWER(COALESCE(status, 'active')) = 'active'
           AND id IN (${placeholders})`,
        [req.user.school_id, ...uniqueGuardIds]
      );
      const validGuardIds = new Set(guards.map((guard) => Number(guard.id)));
      const invalidGuardIds = uniqueGuardIds.filter((guardId) => !validGuardIds.has(Number(guardId)));

      if (invalidGuardIds.length) {
        const error = new Error('Only active guards from your school can be assigned to pickup duty.');
        error.statusCode = 400;
        throw error;
      }

      if (!guards.every((guard) => sameId(guard.school_id, req.user.school_id))) {
        const error = new Error('Duty roster assignments must stay within your school.');
        error.statusCode = 403;
        throw error;
      }
    }

    await connection.execute(
      `UPDATE guard_duty_roster
       SET is_active = 0,
           updated_at = NOW()
       WHERE school_id = ?
         AND duty_date = ?`,
      [req.user.school_id, dutyDate]
    );

    for (const assignment of assignments) {
      await connection.execute(
        `INSERT INTO guard_duty_roster (
           school_id,
           guard_id,
           duty_date,
           duty_role,
           is_active,
           created_by
         ) VALUES (?, ?, ?, ?, 1, ?)
         ON DUPLICATE KEY UPDATE
           duty_role = VALUES(duty_role),
           is_active = 1,
           updated_at = NOW()`,
        [req.user.school_id, assignment.guardId, dutyDate, assignment.dutyRole, req.user.id]
      );
    }

    const roster = await loadRoster(connection, req.user.school_id, dutyDate);
    await connection.commit();

    res.json({
      message: 'Duty roster saved.',
      ...roster,
    });
  } catch (err) {
    await connection.rollback();
    console.error('Duty roster save error:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to save duty roster.' });
  } finally {
    connection.release();
  }
};
