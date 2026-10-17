const mysql = require("mysql2/promise");
require("dotenv").config();

const requiredEnv = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
    throw new Error(
        `Missing required database environment variables: ${missingEnv.join(", ")}. ` +
        "Set them in backend/.env for local development or in your hosting provider's environment settings."
    );
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
});

module.exports = pool;
