// controllers/familyController.js
const pool = require('../config/db');

exports.getFamilyProfile = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get parent
    const [[parent]] = await pool.execute(
      'SELECT id, firstName, lastName, email, phone, status FROM users WHERE id = ?',
      [userId]
    );

    if (!parent) return res.status(404).json({ error: 'Parent not found' });

    // Get children
    const [children] = await pool.execute(
      'SELECT full_name AS name, age, grade, medical_info AS medical FROM children WHERE user_id = ?',
      [userId]
    );

    // Get guardians + vehicle
    const [guardianRows] = await pool.execute(`
      SELECT g.full_name AS name, g.relation, g.phone,
             v.name AS vehicle_name, v.make, v.model, v.color, v.plate_number, v.year
      FROM guardians g
      LEFT JOIN vehicles v ON g.id = v.guardian_id
      WHERE g.user_id = ?
    `, [userId]);

    const guardians = guardianRows.map(row => ({
      name: row.name,
      relation: row.relation,
      phone: row.phone,
      vehicle: row.vehicle_name ? {
        name: row.vehicle_name,
        make: row.make,
        model: row.model,
        color: row.color,
        plate_number: row.plate_number,
        year: row.year
      } : null
    }));

    // Get documents
    const [documents] = await pool.execute(
      `SELECT id, type AS name, file_path, status FROM documents WHERE user_id = ?`,
      [userId]
    );

    const formattedDocs = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      type: doc.file_path.split('.').pop() || 'file',
      status: doc.status?.toLowerCase()
    }));

    res.json({
      id: parent.id,
      familyName: `${parent.firstName} Family`,
      status: parent.status === 'active' ? 'Active' : 'Pending',
      submittedAt: parent.created_at,
      parent: {
        name: `${parent.firstName} ${parent.lastName}`,
        email: parent.email,
        phone: parent.phone,
        address: 'N/A'
      },
      children,
      guardians,
      documents: formattedDocs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getAllFamilies = async (req, res) => {
  try {
    const [parents] = await pool.execute(`SELECT * FROM users WHERE role = 'parent'`);

    const families = await Promise.all(
      parents.map(async (parent) => {
        const userId = parent.id;

        // Get children
        const [children] = await pool.execute(
          'SELECT full_name AS name, age, grade, medical_info AS medical FROM children WHERE user_id = ?',
          [userId]
        );

        // Get guardians with vehicles
        const [guardianRows] = await pool.execute(`
          SELECT g.full_name AS name, g.relation, g.phone,
                v.name AS vehicle_name, v.make, v.model, v.color, v.plate_number, v.year
          FROM guardians g
          LEFT JOIN vehicles v ON g.id = v.guardian_id
          WHERE g.user_id = ?
        `, [userId]);

        const guardians = guardianRows.map(row => ({
          name: row.name,
          relation: row.relation,
          phone: row.phone,
          vehicle: row.vehicle_name ? {
            name: row.vehicle_name,
            make: row.make,
            model: row.model,
            color: row.color,
            plate_number: row.plate_number,
            year: row.year
          } : null
        }));

        // Get documents
        const [documents] = await pool.execute(
          'SELECT id, type AS name, file_path, status FROM documents WHERE user_id = ?',
          [userId]
        );

        const formattedDocs = documents.map(doc => ({
          id: doc.id,
          name: doc.name,
          type: doc.file_path.split('.').pop(),
          status:
          doc.status === 'approved'
            ? 'verified'
            : doc.status === 'rejected'
            ? 'rejected'
            : 'pending',
                  file_path: doc.file_path, // ✅ Keep this
          url: `https://pickupzone.org/${doc.file_path}` // ✅ Optional
        }));
        

        return {
          id: userId,
          familyName: `${parent.firstName} Family`,
          status: parent.status === 'active' ? 'Active' : 'Pending',
          submittedAt: parent.created_at,
          parent: {
            name: `${parent.firstName} ${parent.lastName}`,
            email: parent.email,
            phone: parent.phone,
            address: 'N/A',
          },
          guardians,
          children,
          documents: formattedDocs
        };
      })
    );

    res.json(families);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// controllers/familyController.js
exports.approveFamily = async (req, res) => {
  const userId = req.params.id;
  try {
    await pool.execute('UPDATE users SET status = ? WHERE id = ?', ['active', userId]);
    res.json({ message: 'Family approved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.denyFamily = async (req, res) => {
  const userId = req.params.id;
  const { reason } = req.body;

  try {
    await pool.execute('UPDATE users SET status = ? WHERE id = ?', ['inactive', userId]);

    // Optionally store denial reason in a `denial_reasons` table if you want
    // await pool.execute('INSERT INTO denial_reasons (user_id, reason) VALUES (?, ?)', [userId, reason]);

    res.json({ message: 'Family denied' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
