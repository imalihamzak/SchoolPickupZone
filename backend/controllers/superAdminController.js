const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const sendAdminInviteEmail = require('../utils/sendAdminInviteEmail');
const { CLIENT_URL } = process.env;
// GET all schools with subscription info
exports.getAllSchools = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        s.id, 
        s.name, 
        s.location, 
        s.student_count,
        sp.status AS subscription_status,
        sp.next_billing_date
      FROM schools s
      LEFT JOIN subscriptions sp ON sp.school_id = s.id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST new school
exports.createSchool = async (req, res) => {
  try {
    const { name, location, student_count } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO schools (name, location, student_count) VALUES (?, ?, ?)`,
      [name, location, student_count || 0]
    );
    res.status(201).json({ message: 'School created', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT update school
exports.updateSchool = async (req, res) => {
  try {
    const { name, location, student_count } = req.body;
    const { id } = req.params;

    await pool.execute(
      `UPDATE schools SET name = ?, location = ?, student_count = ? WHERE id = ?`,
      [name, location, student_count, id]
    );
    res.json({ message: 'School updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE school
exports.deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute(`DELETE FROM schools WHERE id = ?`, [id]);
    res.json({ message: 'School deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};





// GET all admins with school info and subscription status
exports.getAllAdmins = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        u.id,
        u.firstName,
        u.lastName,
        u.email,
        u.status,
        u.created_at,
        s.name AS school_name,
        s.location,
        sub.status AS subscription_status,
        sub.next_billing_date
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      LEFT JOIN subscriptions sub ON sub.school_id = s.id
      WHERE u.role = 'admin'
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.createAdmin = async (req, res) => {
    try {
      const { firstName, lastName, email, phone, school_id } = req.body;
  
      if (!firstName || !email || !school_id) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
  
      await pool.execute(
        `INSERT INTO users (role, firstName, lastName, email, phone, status, school_id)
         VALUES ('admin', ?, ?, ?, ?, 'pending', ?)`,
        [firstName, lastName, email, phone || null, school_id]
      );
  
      const resetToken = uuidv4();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
      await pool.execute(
        `INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)`,
        [email, resetToken, expiresAt]
      );
  
      res.status(201).json({ message: 'Admin created. Email is being sent in background.' });
  
      const resetLink = `${CLIENT_URL}/set-new-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
      await sendAdminInviteEmail({ to: email, token: resetToken, firstName });
  
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Email already exists' });
      }
      console.error('Create Admin Error:', err);
      // If response already sent, can't send another
      if (!res.headersSent) {
        res.status(500).json({ error: 'Server error while creating admin' });
      }
    }
  };
  

// PUT update admin
exports.updateAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, school_id, status } = req.body;
    const { id } = req.params;

    await pool.execute(
      `UPDATE users SET firstName = ?, lastName = ?, email = ?, phone = ?, school_id = ?, status = ? WHERE id = ? AND role = 'admin'`,
      [firstName, lastName, email, phone || null, school_id, status || 'active', id]
    );

    res.json({ message: 'Admin updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAdminById = async (req, res) => {
    try {
      const { id } = req.params;
  
      const [rows] = await pool.execute(
        'SELECT id, firstName, lastName, email, phone, school_id FROM users WHERE id = ? AND role = "admin"',
        [id]
      );
  
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Admin not found' });
      }
  
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  

// DELETE admin
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute(`DELETE FROM users WHERE id = ? AND role = 'admin'`, [id]);
    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




// GET all subscription plans
exports.getAllPlans = async (req, res) => {
    try {
      const [rows] = await pool.execute(`SELECT * FROM subscription_plans ORDER BY price ASC`);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
  // CREATE new plan
  exports.createPlan = async (req, res) => {
    try {
      const { name, price, billing_interval, features } = req.body;
      await pool.execute(
        `INSERT INTO subscription_plans (name, price, billing_interval, features) VALUES (?, ?, ?, ?)`,
        [name, price, billing_interval, features || '']
      );
      res.status(201).json({ message: 'Plan created' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
  // UPDATE plan
  exports.updatePlan = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, price, billing_interval, features } = req.body;
      await pool.execute(
        `UPDATE subscription_plans SET name = ?, price = ?, billing_interval = ?, features = ? WHERE id = ?`,
        [name, price, billing_interval, features || '', id]
      );
      res.json({ message: 'Plan updated' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
  // DELETE plan
  exports.deletePlan = async (req, res) => {
    try {
      const { id } = req.params;
      await pool.execute(`DELETE FROM subscription_plans WHERE id = ?`, [id]);
      res.json({ message: 'Plan deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
  // GET all subscriptions with school and plan info
  exports.getAllSubscriptions = async (req, res) => {
    try {
      const [rows] = await pool.execute(`
SELECT 
  s.id AS subscription_id,
  sch.name AS school_name,
  sp.name AS plan_name,
  CONCAT(u.firstName, ' ', u.lastName) AS admin_name,
  s.status,
  s.start_date,
  s.end_date,
  s.next_billing_date,
  s.last_payment_amount
FROM subscriptions s
JOIN schools sch ON s.school_id = sch.id
JOIN subscription_plans sp ON s.plan_id = sp.id
LEFT JOIN users u ON u.school_id = sch.id AND u.role = 'admin'

      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
  // GET all payments
  exports.getAllPayments = async (req, res) => {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          p.id,
          p.amount,
          p.status,
          p.method,
          p.payment_date,
          p.transaction_id,
          sch.name AS school_name,
          sp.name AS plan_name
        FROM payments p
        JOIN schools sch ON p.school_id = sch.id
        JOIN subscription_plans sp ON p.plan_id = sp.id
        ORDER BY p.payment_date DESC
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
exports.cancelSubscription = async (req, res) => {
    const subscriptionId = req.params.id;
  
    try {
      // Update status to 'cancelled'
      await pool.execute(
        `UPDATE subscriptions SET status = 'cancelled' WHERE id = ?`,
        [subscriptionId]
      );
  
      res.json({ success: true, message: 'Subscription cancelled.' });
    } catch (err) {
      console.error('Cancel subscription error:', err.message);
      res.status(500).json({ error: 'Failed to cancel subscription.' });
    }
  };
  

  exports.getOverviewStats = async (req, res) => {
    try {
      // Total revenue from successful payments
      const [[{ totalRevenue }]] = await pool.execute(`
        SELECT COALESCE(SUM(amount), 0) AS totalRevenue
        FROM payments
        WHERE status = 'successful'
      `);
  
      // Active subscriptions
      const [[{ activeSubscriptions }]] = await pool.execute(`
        SELECT COUNT(*) AS activeSubscriptions
        FROM subscriptions
        WHERE status = 'active'
      `);
  
      // Total subscription plans
      const [[{ totalPlans }]] = await pool.execute(`
        SELECT COUNT(*) AS totalPlans
        FROM subscription_plans
      `);
  
      res.json({
        totalRevenue,
        activeSubscriptions,
        totalPlans
      });
    } catch (err) {
      console.error('Overview stats error:', err.message);
      res.status(500).json({ error: 'Failed to fetch overview statistics' });
    }
  };

  


  exports.getDashboardStats = async (req, res) => {
    try {
      const [[{ totalSchools }]] = await pool.execute(`SELECT COUNT(*) AS totalSchools FROM schools`);
      const [[{ totalRevenue }]] = await pool.execute(`
        SELECT COALESCE(SUM(amount), 0) AS totalRevenue FROM payments WHERE status = 'successful'
      `);
      const [[{ activeAdmins }]] = await pool.execute(`
        SELECT COUNT(*) AS activeAdmins FROM users WHERE role = 'admin'
      `);
      const [[{ totalStudents }]] = await pool.execute(`SELECT COUNT(*) AS totalStudents FROM children`);
      const [[{ totalParents }]] = await pool.execute(`SELECT COUNT(*) AS totalParents FROM users WHERE role = 'parent'`);
  
      res.json({
        totalSchools,
        totalRevenue,
        activeAdmins,
        totalStudents,
        totalParents,
      });
    } catch (error) {
      console.error('Error getting dashboard stats:', error.message);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  };
  