const pool = require('../config/db');

const createUser = async (user) => {
    const [result] = await pool.execute(
        'INSERT INTO users (role, firstName, lastName, email, phone, password, childName, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [user.role, user.firstName, user.lastName, user.email, user.phone ?? null, user.password, user.childName ?? null, user.status]
    );
    return result;
};

const getUserByEmail = async (email) => {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
};

module.exports = {
    createUser,
    getUserByEmail
};
