const pool = require('../config/db');
const {
  getAllGuardians,
  getGuardianById,
  createGuardian,
  updateGuardian,
  deleteGuardian
} = require('../models/guardianModel');

const { generateQRCodesForUser } = require('../utils/qrUtil');
const { getAllChildren } = require('../models/childModel');

// Fetch all guardians with vehicle
// Fetch all guardians with vehicle
exports.getGuardians = async (req, res) => {
  try {
    const role = req.user.role;
    let userId = req.user.id;

    // ✅ Allow admin to fetch guardians for any parent via query param
    if (role === 'admin' && req.query.parent_id) {
      userId = req.query.parent_id;
    }

    const [rows] = await pool.execute(`
      SELECT g.*, v.id as vehicle_id, v.name AS vehicle_name, v.make, v.model, v.color, v.plate_number, v.year
      FROM guardians g
      LEFT JOIN vehicles v ON g.id = v.guardian_id
      WHERE g.user_id = ?
    `, [userId]);

    const grouped = rows.reduce((acc, row) => {
      const {
        id, full_name, relation, phone, status, created_at,
        vehicle_id, vehicle_name, make, model, color, plate_number, year
      } = row;

      if (!acc[id]) {
        acc[id] = {
          id,
          full_name,
          relation,
          phone,
          status,
          created_at,
          vehicle: vehicle_id
            ? {
                id: vehicle_id,
                name: vehicle_name,
                make,
                model,
                color,
                plate_number,
                year
              }
            : null
        };
      }
      return acc;
    }, {});

    res.json(Object.values(grouped));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Fetch single guardian by ID with vehicle
exports.getGuardian = async (req, res) => {
  try {
    const guardianId = req.params.id;
    const [rows] = await pool.execute(`
      SELECT g.*, v.id as vehicle_id, v.name AS vehicle_name, v.make, v.model, v.color, v.plate_number, v.year
      FROM guardians g
      LEFT JOIN vehicles v ON g.id = v.guardian_id
      WHERE g.id = ?
    `, [guardianId]);

    if (rows.length === 0) return res.status(404).json({ error: 'Guardian not found' });

    const row = rows[0];
    const guardian = {
      id: row.id,
      full_name: row.full_name,
      relation: row.relation,
      phone: row.phone,
      status: row.status,
      created_at: row.created_at,
      vehicle: row.vehicle_id ? {
        id: row.vehicle_id,
        name: row.vehicle_name,
        make: row.make,
        model: row.model,
        color: row.color,
        plate_number: row.plate_number,
        year: row.year
      } : null
    };

    res.json(guardian);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add guardian with vehicle
exports.addGuardian = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const { full_name, relation, phone, vehicle } = req.body;

    await connection.beginTransaction();

    const [result] = await connection.execute(
      'INSERT INTO guardians (user_id, full_name, relation, phone, status) VALUES (?, ?, ?, ?, ?)',
      [userId, full_name, relation, phone, 'Active']
    );
    const guardianId = result.insertId;

    if (vehicle) {
      await connection.execute(
        'INSERT INTO vehicles (guardian_id, name, make, model, color, plate_number, year) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [guardianId, vehicle.name, vehicle.make, vehicle.model, vehicle.color, vehicle.plate_number, vehicle.year]
      );
    }
    await connection.commit();

    await generateQRCodesForUser(userId, getAllChildren, getAllGuardians);

    res.status(201).json({ id: guardianId });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

// Update guardian and vehicle
exports.updateGuardian = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const guardianId = req.params.id;
    const { full_name, relation, phone, status, vehicle } = req.body;

    await connection.beginTransaction();

    await connection.execute(
      'UPDATE guardians SET full_name = ?, relation = ?, phone = ?, status = ? WHERE id = ?',
      [full_name, relation, phone, status, guardianId]
    );

    if (vehicle) {
      const [existingVehicle] = await connection.execute('SELECT id FROM vehicles WHERE guardian_id = ?', [guardianId]);

      if (existingVehicle.length > 0) {
        await connection.execute(
          'UPDATE vehicles SET name = ?, make = ?, model = ?, color = ?, plate_number = ?, year = ? WHERE guardian_id = ?',
          [vehicle.name, vehicle.make, vehicle.model, vehicle.color, vehicle.plate_number, vehicle.year, guardianId]
        );
      } else {
        await connection.execute(
          'INSERT INTO vehicles (guardian_id, name, make, model, color, plate_number, year) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [guardianId, vehicle.name, vehicle.make, vehicle.model, vehicle.color, vehicle.plate_number, vehicle.year]
        );
      }
    }

    await connection.commit();
    res.json({ message: 'Guardian updated' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
};

// ✅ Delete guardian by ID (vehicle auto-deletes via FK constraint)
exports.deleteGuardian = async (req, res) => {
  try {
    const guardianId = req.params.id; // <- this is critical
    await pool.execute('DELETE FROM guardians WHERE id = ?', [guardianId]);
    res.json({ message: 'Guardian deleted' });
  } catch (err) {
    console.error(err); // Useful for debugging
    res.status(500).json({ error: err.message });
  }
};