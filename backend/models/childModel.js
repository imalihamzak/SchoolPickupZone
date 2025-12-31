const pool = require('../config/db');

exports.getAllChildren = async (userId) => {
  const [rows] = await pool.execute('SELECT * FROM children WHERE user_id = ?', [userId]);
  return rows;
};

exports.getChildById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM children WHERE id = ?', [id]);
  return rows[0];
};

exports.createChild = async (child) => {
  const [result] = await pool.execute(
    'INSERT INTO children (user_id, full_name, age, grade, medical_info, photo_path) VALUES (?, ?, ?, ?, ?, ?)',
    [child.user_id, child.full_name, child.age, child.grade, child.medical_info, child.photo_path]
  );
  return result;
};

exports.updateChild = async (id, child) => {
  const [result] = await pool.execute(
    'UPDATE children SET full_name = ?, age = ?, grade = ?, medical_info = ?, photo_path = ? WHERE id = ?',
    [child.full_name, child.age, child.grade, child.medical_info, child.photo_path, id]
  );
  return result;
};

exports.deleteChild = async (id) => {
  const [result] = await pool.execute('DELETE FROM children WHERE id = ?', [id]);
  return result;
};
