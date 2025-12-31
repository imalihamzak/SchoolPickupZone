const pool = require('../config/db');

const sendAdminNotification = async (title, message, type = 'qr_scan', io = null, connectedAdmins = null) => {
  const [adminUsers] = await pool.execute(`SELECT id FROM users WHERE role = 'admin'`);
  const insertedIds = [];

  for (const admin of adminUsers) {
    const [result] = await pool.execute(
      `INSERT INTO notifications (user_id, type, title, message, timestamp, \`read\`) 
       VALUES (?, ?, ?, ?, NOW(), 0)`,
      [admin.id, type, title, message]
    );

    const insertedId = result.insertId;
    insertedIds.push({ userId: admin.id, id: insertedId });

    // 🔁 Send directly to specific admin if online
    if (io && connectedAdmins) {
      for (const [socketId, userId] of connectedAdmins.entries()) {
        if (userId === admin.id) {
          io.to(socketId).emit('pickup_event', {
            id: insertedId.toString(),
            type,
            title,
            message,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
  }

  // ✅ Emit global event so ALL admins update
  if (io) {
    io.emit('pickup_event', {
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  return insertedIds;
};


exports.logPickup = async (req, res) => {
  const io = req.app.get('io');
  const connectedAdmins = req.app.get('connectedAdmins');

  try {
    const { qrData, device_fingerprint, user_agent } = req.body;

    // Step 1: Validate device
    const [deviceRows] = await pool.execute(
      `SELECT id, guard_id FROM guard_devices WHERE device_fingerprint = ? AND user_agent = ?`,
      [device_fingerprint, user_agent]
    );

    if (deviceRows.length === 0) {
      const message = `Unauthorized scan attempt by unknown device (fingerprint: ${device_fingerprint}, agent: ${user_agent}).`;

      await sendAdminNotification('Unauthorized Scan Attempt', message, 'unauthorized', io, connectedAdmins);
      return res.status(403).json({ error: 'Unauthorized device' });
    }

    const device = deviceRows[0];

    // Step 2: Validate QR
    const [qrRows] = await pool.execute(
      `SELECT id FROM qr_assignments WHERE user_id = ? AND child_id = ? AND guardian_id <=> ?`,
      [qrData.user_id, qrData.child_id, qrData.guardian_id]
    );

    if (qrRows.length === 0) {
      const message = `Invalid QR scan for child ID ${qrData.child_id} using device ID ${device.id}.`;

      await sendAdminNotification('Invalid QR Code Scan', message, 'invalid_qr', io, connectedAdmins);
      return res.status(404).json({ error: 'QR code not valid' });
    }

    const qr_assignment_id = qrRows[0].id;

    // Step 3: Fetch guardian and vehicle info BEFORE logging
    const [[guardianRow]] = await pool.execute(`
      SELECT g.full_name AS guardianName, 
             v.name AS vehicleName, v.make, v.model, v.color, v.plate_number, v.year, v.id AS vehicle_id
      FROM guardians g
      LEFT JOIN vehicles v ON g.id = v.guardian_id
      WHERE g.id = ?
    `, [qrData.guardian_id]);

    const vehicleId = guardianRow.vehicle_id || null;

    // Step 4: Log pickup
    await pool.execute(
      `INSERT INTO pickup_logs (qr_assignment_id, guard_id, device_id, vehicle_id) VALUES (?, ?, ?, ?)`,
      [qr_assignment_id, device.guard_id, device.id, vehicleId]
    );

    // Step 5: Fetch child and guard names
    const [[{ full_name: childName }]] = await pool.execute(
      'SELECT full_name FROM children WHERE id = ?',
      [qrData.child_id]
    );

    const [[{ firstName: guardName }]] = await pool.execute(
      `SELECT firstName FROM users WHERE id = ?`,
      [device.guard_id]
    );

    const guardianName = guardianRow.guardianName;
    const vehicleInfo = guardianRow.vehicleName
      ? `${guardianRow.vehicleName} (${guardianRow.make}, ${guardianRow.color}, Plate: ${guardianRow.plate_number})`
      : 'No vehicle registered';

      const message = `QR code for child <strong>${childName}</strong> was scanned by guard <strong>${guardName}</strong> for pickup by <strong>${guardianName}</strong>, using vehicle <strong>${vehicleInfo}</strong>.`;
      const title = 'QR Code Scanned for Pickup';

    // Step 6: Notify admins
    await sendAdminNotification(title, message, 'pickup_success', io, connectedAdmins);

    // Emit to all
    io.emit('pickup_event', {
      type: 'success',
      title,
      message,
      guard_id: device.guard_id,
      child_id: qrData.child_id,
      guardian_id: qrData.guardian_id,
      vehicle: vehicleInfo,
      timestamp: new Date().toISOString(),
    });

    res.json({ message: 'Pickup logged successfully' });

  } catch (err) {
    console.error('Pickup Logging Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};



// GET /api/pickups/stats/today
exports.getTodayStats = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        HOUR(scanned_at) AS hour,
        COUNT(*) AS scans
      FROM pickup_logs
      WHERE DATE(scanned_at) = CURDATE()
      GROUP BY hour
      ORDER BY hour
    `);

    const result = rows.map(row => ({
      hour: formatHour(row.hour),
      scans: row.scans
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch today\'s stats' });
  }
};

const formatHour = (hour) => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hr = hour % 12 || 12;
  return `${hr}${ampm}`;
};

// GET /api/pickups/stats/week
exports.getWeeklyStats = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        DAYNAME(scanned_at) AS day,
        COUNT(*) AS scans
      FROM pickup_logs
      WHERE scanned_at >= CURDATE() - INTERVAL 6 DAY
      GROUP BY day
    `);

    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const result = dayOrder.map(day => {
      const match = rows.find(r => r.day === day);
      return {
        day: day.slice(0, 3), // 'Mon', 'Tue' etc.
        scans: match ? match.scans : 0
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch weekly stats' });
  }
};


exports.getRecentPickups = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        pl.id,
        pl.scanned_at,
        pl.confirmed,
        c.full_name AS studentName,
        g.full_name AS guardianName,
        g.relation AS guardianRelation,
        v.name AS vehicleName,
        v.make,
        v.model,
        v.color,
        v.plate_number,
        u.firstName AS guardName
      FROM pickup_logs pl
      INNER JOIN qr_assignments qa ON pl.qr_assignment_id = qa.id
      INNER JOIN children c ON qa.child_id = c.id
      LEFT JOIN guardians g ON qa.guardian_id = g.id
      LEFT JOIN vehicles v ON pl.vehicle_id = v.id
      LEFT JOIN users u ON pl.guard_id = u.id
      ORDER BY pl.scanned_at DESC
      LIMIT 20
    `);

    const result = rows.map(row => ({
      id: row.id,
      studentName: row.studentName,
      guardianName: `${row.guardianName || 'Parent'}${row.guardianRelation ? ` (${row.guardianRelation})` : ''}`,
      carDescription: row.vehicleName
        ? `${row.vehicleName} (${row.make}, ${row.color}, Plate: ${row.plate_number})`
        : 'No vehicle registered',
      time: new Date(row.scanned_at).toLocaleTimeString(),
      date: new Date(row.scanned_at).toLocaleDateString(),
      guardName: row.guardName || 'Unknown',
      status: row.confirmed ? 'Completed' : 'Pending',
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching recent pickups:', err);
    res.status(500).json({ error: 'Failed to fetch recent pickups' });
  }
};
