const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool (BEST PRACTICE)
const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Function to test DB connection (like mongoose.connect)
const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL Connected');
    connection.release(); // IMPORTANT
  } catch (err) {
    console.error('DB Connection Failed:', err);
    process.exit(1);
  }
};

module.exports = {
  pool,
  connectDB
};