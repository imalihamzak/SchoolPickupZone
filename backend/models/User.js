const pool = require('../config/db');

const createUser = async (user, executor = pool) => {
    const [result] = await executor.execute(
        `INSERT INTO users (
            role,
            firstName,
            lastName,
            email,
            phone,
            password,
            childName,
            status,
            profile_picture,
            school_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            user.role,
            user.firstName,
            user.lastName,
            user.email,
            user.phone ?? null,
            user.password,
            user.childName ?? null,
            user.status,
            user.profile_picture ?? null,
            user.school_id ?? null
        ]
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
