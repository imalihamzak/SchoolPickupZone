const QRCode = require('qrcode');
const pool = require('../config/db');

exports.generateQRCodesForUser = async (userId, getAllChildren, getAllGuardians) => {
  const children = await getAllChildren(userId);
  const guardians = await getAllGuardians(userId);

  if (children.length === 0) return; // Cannot generate QR codes without children

  // Clean up old QR codes
  await pool.execute('DELETE FROM qr_assignments WHERE user_id = ?', [userId]);

  const associations = [
    { type: 'parent', id: null },
    ...guardians.slice(0, 2).map(g => ({ type: 'guardian', id: g.id }))
  ];

  for (const child of children) {
    for (const assoc of associations) {
      const qrData = JSON.stringify({
        user_id: userId,
        child_id: child.id,
        guardian_id: assoc.id,
        type: assoc.type
      });

      const fileName = `uploads/qr_${userId}_${child.id}_${assoc.id ?? 'parent'}_${Date.now()}.png`;
      await QRCode.toFile(fileName, qrData);

      await pool.execute(
        `INSERT INTO qr_assignments (user_id, guardian_id, child_id, qr_code, image_path)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, assoc.id, child.id, qrData, fileName]
      );
    }
  }
};
