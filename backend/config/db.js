require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST,                      // 144.126.134.74
  port:     parseInt(process.env.DB_PORT, 10) || 3306,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: true }
    : undefined,
//evita conversiones implícitas de fecha
  dateStrings: true, // DATETIME/TIMESTAMP como 'YYYY-MM-DD HH:mm:ss' (no Date)
  timezone: 'Z',
  
});

module.exports = pool;

