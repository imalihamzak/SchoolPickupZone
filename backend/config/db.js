const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration from environment variables
// Change these values in .env file to switch between local and production
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
(async () => {
    try {
        const connection = await pool.getConnection();
        const env = process.env.NODE_ENV || 'development';
        console.log(`✅ Database connected successfully (${env} environment)`);
        console.log(`   Host: ${process.env.DB_HOST}`);
        console.log(`   Database: ${process.env.DB_NAME}`);
        connection.release();
    } catch (error) {
        console.error("❌ Error connecting to the database:", error.message);
        console.error("   Please check your .env file configuration:");
        console.error("   - DB_HOST");
        console.error("   - DB_USER");
        console.error("   - DB_PASSWORD");
        console.error("   - DB_NAME");
    }
})();

module.exports = pool;
