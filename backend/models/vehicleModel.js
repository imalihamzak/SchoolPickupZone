const pool = require('../config/db');

// Create a new vehicle
exports.createVehicle = async (vehicle) => {
  const [result] = await pool.execute(
    'INSERT INTO vehicles (guardian_id, name, year, make, model, color, plate_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      vehicle.guardian_id,
      vehicle.name,
      vehicle.year,
      vehicle.make,
      vehicle.model,
      vehicle.color,
      vehicle.plate_number
    ]
  );
  return result;
};

// Get vehicle by guardian_id
exports.getVehicleByGuardianId = async (guardianId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM vehicles WHERE guardian_id = ?',
    [guardianId]
  );
  return rows[0]; // assuming one vehicle per guardian
};

// Update vehicle
exports.updateVehicle = async (guardianId, vehicle) => {
  const [result] = await pool.execute(
    'UPDATE vehicles SET name = ?, year = ?, make = ?, model = ?, color = ?, plate_number = ? WHERE guardian_id = ?',
    [
      vehicle.name,
      vehicle.year,
      vehicle.make,
      vehicle.model,
      vehicle.color,
      vehicle.plate_number,
      guardianId
    ]
  );
  return result;
};

// Optionally: delete vehicle directly if ever needed
exports.deleteVehicle = async (guardianId) => {
  const [result] = await pool.execute(
    'DELETE FROM vehicles WHERE guardian_id = ?',
    [guardianId]
  );
  return result;
};
