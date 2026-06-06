const pool = require('../config/db');

const CONTACT_TYPE_GUARDIAN = 'guardian';
const CONTACT_TYPE_SECOND_PARENT = 'second_parent';

const requiredVehicleFields = ['name', 'make', 'model', 'color', 'plate_number', 'year'];

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

const ensureColumn = async (executor, ddl) => {
  try {
    await executor.execute(`ALTER TABLE guardians ADD COLUMN ${ddl}`);
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') throw err;
  }
};

const ensureIndex = async (executor, ddl) => {
  try {
    await executor.execute(`ALTER TABLE guardians ADD INDEX ${ddl}`);
  } catch (err) {
    if (err.code !== 'ER_DUP_KEYNAME') throw err;
  }
};

const ensureGuardianContactSchema = async (executor = pool) => {
  if (schemaEnsured) return;

  await ensureColumn(
    executor,
    "contact_type varchar(30) NOT NULL DEFAULT 'guardian' AFTER status"
  );
  await ensureIndex(executor, 'idx_guardians_user_contact_type (user_id, contact_type)');

  schemaEnsured = true;
};

const contactTypeWhere = (alias = 'g', contactType = CONTACT_TYPE_GUARDIAN) =>
  `COALESCE(${alias}.contact_type, '${CONTACT_TYPE_GUARDIAN}') = '${contactType}'`;

const validateGuardianLikeContact = ({ full_name, relation, phone, vehicle }) => {
  if (!normalizeText(full_name)) {
    const error = new Error('Full name is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!normalizeText(relation)) {
    const error = new Error('Relation to child is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!normalizeText(phone)) {
    const error = new Error('Phone number is required.');
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
    full_name: normalizeText(full_name),
    relation: normalizeText(relation),
    phone: normalizeText(phone),
    vehicle: normalizedVehicle,
  };
};

const normalizeStatus = (value) =>
  String(value || 'Active').toLowerCase() === 'inactive' ? 'Inactive' : 'Active';

module.exports = {
  CONTACT_TYPE_GUARDIAN,
  CONTACT_TYPE_SECOND_PARENT,
  contactTypeWhere,
  ensureGuardianContactSchema,
  normalizeStatus,
  normalizeVehicle,
  validateGuardianLikeContact,
};
