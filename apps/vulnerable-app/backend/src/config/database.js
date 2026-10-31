import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER || "securesaas_app",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "securesaas",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 20
});

export default pool;
