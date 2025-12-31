const pool = require('../config/db');
const {
  getAllChildren,
  getChildById,
  createChild,
  updateChild,
  deleteChild: deleteChildFromModel 
} = require('../models/childModel');

const { generateQRCodesForUser } = require('../utils/qrUtil');
const { getAllGuardians } = require('../models/guardianModel');

exports.getChildren = async (req, res) => {
  try {
    const userId = req.user.id;
    const children = await getAllChildren(userId);
    res.json(children);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getChild = async (req, res) => {
  try {
    const child = await getChildById(req.params.id);
    if (!child) return res.status(404).json({ error: 'Child not found' });
    res.json(child);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addChild = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, age, grade, medical_info } = req.body;
    const photo = req.files?.photo;
    let photo_path = '';

    if (photo) {
      const uploadPath = `uploads/${Date.now()}_${photo.name}`;
      await photo.mv(uploadPath);
      photo_path = uploadPath;
    }

    const result = await createChild({ user_id: userId, full_name, age, grade, medical_info, photo_path });

    await generateQRCodesForUser(userId, getAllChildren, getAllGuardians);

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateChild = async (req, res) => {
  try {
    const { full_name, age, grade, medical_info } = req.body;
    const photo = req.files?.photo;
    let photo_path = req.body.photo_path || '';

    if (photo) {
      const uploadPath = `uploads/${Date.now()}_${photo.name}`;
      await photo.mv(uploadPath);
      photo_path = uploadPath;
    }

    await updateChild(req.params.id, { full_name, age, grade, medical_info, photo_path });
    res.json({ message: 'Child updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteChild = async (req, res) => {
  const childId = req.params.id;

  try {
    // Delete related records first (due to foreign key constraints)
    await pool.execute('DELETE FROM documents WHERE child_id = ?', [childId]);
    await pool.execute('DELETE FROM qr_assignments WHERE child_id = ?', [childId]);

    // Now delete the child
    await deleteChildFromModel(childId);

    res.json({ message: 'Child deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete child: ' + err.message });
  }
};
