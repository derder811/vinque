import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // Consider using environment variables
  database: process.env.DB_NAME || 'e-web',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // 10 seconds timeout
  timezone: '+00:00' // Set your timezone
});

// Test the connection when the pool is created
pool.getConnection()
  .then(connection => {
    console.log('Successfully connected to the database');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err);
  });

export default pool;