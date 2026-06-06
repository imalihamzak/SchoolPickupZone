const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
let guardDutyTableReady = false;

const ensureGuardDutyRosterTable = async (executor) => {
  if (guardDutyTableReady) return;

  await executor.execute(
    `CREATE TABLE IF NOT EXISTS guard_duty_roster (
      id int(11) NOT NULL AUTO_INCREMENT,
      school_id int(11) NOT NULL,
      guard_id int(11) NOT NULL,
      duty_date date NOT NULL,
      duty_role enum('scanner','release','both') NOT NULL DEFAULT 'release',
      is_active tinyint(1) NOT NULL DEFAULT 1,
      created_by int(11) DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (id),
      UNIQUE KEY unique_guard_duty_day (school_id, guard_id, duty_date),
      KEY idx_guard_duty_school_date (school_id, duty_date, is_active),
      KEY idx_guard_duty_guard_date (guard_id, duty_date, is_active),
      KEY idx_guard_duty_role (duty_role),
      CONSTRAINT fk_guard_duty_school
        FOREIGN KEY (school_id) REFERENCES schools (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      CONSTRAINT fk_guard_duty_guard
        FOREIGN KEY (guard_id) REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      CONSTRAINT fk_guard_duty_created_by
        FOREIGN KEY (created_by) REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
  );

  guardDutyTableReady = true;
};

const toSqlDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDutyDate = (value) => {
  const candidate = String(value || '').trim();
  return DATE_PATTERN.test(candidate) ? candidate : toSqlDate(new Date());
};

const normalizeDutyRole = (value) => {
  const role = String(value || '').trim().toLowerCase();
  return ['scanner', 'release', 'both'].includes(role) ? role : null;
};

const dutyFlags = (role) => ({
  isOnDuty: Boolean(role),
  isScanner: role === 'scanner' || role === 'both',
  isRelease: role === 'release' || role === 'both',
});

const getActiveDutyGuards = async (executor, schoolId, dutyRole, dutyDate = normalizeDutyDate()) => {
  const role = normalizeDutyRole(dutyRole);
  if (!schoolId || !role) return [];

  await ensureGuardDutyRosterTable(executor);

  const [rows] = await executor.execute(
    `SELECT DISTINCT
       u.id,
       u.firstName,
       u.lastName,
       u.email,
       gdr.duty_role
     FROM guard_duty_roster gdr
     INNER JOIN users u ON u.id = gdr.guard_id
     WHERE gdr.school_id = ?
       AND gdr.duty_date = ?
       AND gdr.is_active = 1
       AND (gdr.duty_role = ? OR gdr.duty_role = 'both')
       AND u.role = 'guard'
       AND u.school_id = gdr.school_id
       AND LOWER(COALESCE(u.status, 'active')) = 'active'
     ORDER BY u.firstName, u.lastName, u.id`,
    [schoolId, normalizeDutyDate(dutyDate), role]
  );

  return rows;
};

const getGuardDutyState = async (executor, schoolId, guardId, dutyDate = normalizeDutyDate()) => {
  if (!schoolId || !guardId) {
    return {
      date: normalizeDutyDate(dutyDate),
      dutyRole: null,
      ...dutyFlags(null),
    };
  }

  await ensureGuardDutyRosterTable(executor);

  const [[row]] = await executor.execute(
    `SELECT duty_role
     FROM guard_duty_roster
     WHERE school_id = ?
       AND guard_id = ?
       AND duty_date = ?
       AND is_active = 1
     LIMIT 1`,
    [schoolId, guardId, normalizeDutyDate(dutyDate)]
  );

  const dutyRole = normalizeDutyRole(row?.duty_role);
  return {
    date: normalizeDutyDate(dutyDate),
    dutyRole,
    ...dutyFlags(dutyRole),
  };
};

const isGuardOnDutyForRole = async (executor, schoolId, guardId, dutyRole, dutyDate = normalizeDutyDate()) => {
  const dutyState = await getGuardDutyState(executor, schoolId, guardId, dutyDate);
  if (dutyRole === 'scanner') return dutyState.isScanner;
  if (dutyRole === 'release') return dutyState.isRelease;
  return dutyState.isOnDuty;
};

module.exports = {
  ensureGuardDutyRosterTable,
  getActiveDutyGuards,
  getGuardDutyState,
  isGuardOnDutyForRole,
  normalizeDutyDate,
  normalizeDutyRole,
};
