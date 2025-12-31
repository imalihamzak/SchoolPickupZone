const pool = require('../config/db');

exports.getAllGuardians = async (userId) => {
  const [rows] = await pool.execute('SELECT * FROM guardians WHERE user_id = ?', [userId]);
  return rows;
};

exports.getGuardianById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM guardians WHERE id = ?', [id]);
  return rows[0];
};

exports.createGuardian = async (guardian) => {
  const [result] = await pool.execute(
    'INSERT INTO guardians (user_id, full_name, relation, phone, status) VALUES (?, ?, ?, ?, ?)',
    [
      guardian.user_id,
      guardian.full_name,
      guardian.relation,
      guardian.phone,
      guardian.status
    ]
  );
  return result;
};

exports.updateGuardianVehicle = async (guardian_id, vehicle) => {
  const [rows] = await pool.execute(
    'SELECT id FROM guardian_vehicles WHERE guardian_id = ?',
    [guardian_id]
  );

  if (rows.length > 0) {
    // Vehicle exists, update
    await pool.execute(
      `UPDATE guardian_vehicles SET year = ?, make = ?, model = ?, color = ?, plate_number = ?, vehicle_name = ?
       WHERE guardian_id = ?`,
      [vehicle.year, vehicle.make, vehicle.model, vehicle.color, vehicle.plate_number, vehicle.vehicle_name, guardian_id]
    );
  } else {
    // No vehicle yet, insert new
    await pool.execute(
      `INSERT INTO guardian_vehicles (guardian_id, year, make, model, color, plate_number, vehicle_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [guardian_id, vehicle.year, vehicle.make, vehicle.model, vehicle.color, vehicle.plate_number, vehicle.vehicle_name]
    );
  }
};

exports.deleteGuardian = async (id) => {
  const [result] = await pool.execute('DELETE FROM guardians WHERE id = ?', [id]);
  return result;
};
