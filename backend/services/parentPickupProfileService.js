const pool = require('../config/db');

const vehicleFieldMap = {
  name: 'vehicle_name',
  make: 'vehicle_make',
  model: 'vehicle_model',
  color: 'vehicle_color',
  plate_number: 'vehicle_plate_number',
  year: 'vehicle_year',
};

const requiredVehicleFields = Object.keys(vehicleFieldMap);

let schemaEnsured = false;

const normalizeText = (value) => String(value || '').trim();

const normalizeVehicle = (vehicle = {}) => ({
  name: normalizeText(vehicle.name),
  make: normalizeText(vehicle.make),
  model: normalizeText(vehicle.model),
  color: normalizeText(vehicle.color),
  plate_number: normalizeText(vehicle.plate_number),
  year: normalizeText(vehicle.year),
});

const validateParentPickupDetails = ({ relation, vehicle }) => {
  if (!normalizeText(relation)) {
    const error = new Error('Relation to child is required.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedVehicle = normalizeVehicle(vehicle);
  const missingVehicleField = requiredVehicleFields.find((field) => !normalizedVehicle[field]);

  if (missingVehicleField) {
    const error = new Error('Please complete all required vehicle details.');
    error.statusCode = 400;
    throw error;
  }

  return {
    relation: normalizeText(relation),
    vehicle: normalizedVehicle,
  };
};

const ensureParentPickupProfileSchema = async (executor = pool) => {
  if (schemaEnsured) return;

  await executor.execute(
    `CREATE TABLE IF NOT EXISTS parent_pickup_profiles (
      user_id int(11) NOT NULL,
      relation varchar(50) DEFAULT NULL,
      vehicle_name varchar(100) DEFAULT NULL,
      vehicle_make varchar(100) DEFAULT NULL,
      vehicle_model varchar(100) DEFAULT NULL,
      vehicle_color varchar(50) DEFAULT NULL,
      vehicle_plate_number varchar(50) DEFAULT NULL,
      vehicle_year varchar(10) DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT current_timestamp(),
      updated_at timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
      PRIMARY KEY (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`
  );

  schemaEnsured = true;
};

const upsertParentPickupProfile = async (executor, { userId, relation, vehicle }) => {
  const normalized = validateParentPickupDetails({ relation, vehicle });

  await executor.execute(
    `INSERT INTO parent_pickup_profiles (
       user_id,
       relation,
       vehicle_name,
       vehicle_make,
       vehicle_model,
       vehicle_color,
       vehicle_plate_number,
       vehicle_year
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       relation = VALUES(relation),
       vehicle_name = VALUES(vehicle_name),
       vehicle_make = VALUES(vehicle_make),
       vehicle_model = VALUES(vehicle_model),
       vehicle_color = VALUES(vehicle_color),
       vehicle_plate_number = VALUES(vehicle_plate_number),
       vehicle_year = VALUES(vehicle_year),
       updated_at = NOW()`,
    [
      userId,
      normalized.relation,
      normalized.vehicle.name,
      normalized.vehicle.make,
      normalized.vehicle.model,
      normalized.vehicle.color,
      normalized.vehicle.plate_number,
      normalized.vehicle.year,
    ]
  );
};

const getParentPickupVehicle = async (executor, userId) => {
  if (!userId) return null;
  await ensureParentPickupProfileSchema(executor);

  const [[profile]] = await executor.execute(
    `SELECT
       vehicle_name AS name,
       vehicle_make AS make,
       vehicle_model AS model,
       vehicle_color AS color,
       vehicle_plate_number AS plate_number,
       vehicle_year AS year
     FROM parent_pickup_profiles
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  if (!profile) return null;

  return {
    id: null,
    name: profile.name,
    make: profile.make,
    model: profile.model,
    color: profile.color,
    plate_number: profile.plate_number,
    year: profile.year,
  };
};

module.exports = {
  ensureParentPickupProfileSchema,
  getParentPickupVehicle,
  normalizeVehicle,
  upsertParentPickupProfile,
  validateParentPickupDetails,
};
