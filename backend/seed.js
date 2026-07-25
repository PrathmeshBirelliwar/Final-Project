/**
 * Run this once after loading schema.sql to set correct bcrypt password hashes
 * for the demo accounts (the placeholder hashes in schema.sql are not guaranteed
 * to match across bcrypt versions, so this script re-hashes them for real).
 *
 * Usage: node seed.js
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./config/db");

async function run() {
    const adminHash = await bcrypt.hash("admin123", 10);
    const librarianHash = await bcrypt.hash("librarian123", 10);
    const memberHash = await bcrypt.hash("member123", 10);

    await pool.query("UPDATE admins SET password_hash = ? WHERE username = 'admin'", [adminHash]);
    await pool.query("UPDATE librarians SET password_hash = ? WHERE id = 'LIB001'", [librarianHash]);
    await pool.query("UPDATE members SET password_hash = ? WHERE id IN ('MEM001','MEM002')", [memberHash]);

    console.log("Demo account passwords set:");
    console.log("  Admin      -> username: admin            password: admin123");
    console.log("  Librarian  -> email: soham@library.com    password: librarian123");
    console.log("  Member     -> email: rahul@gmail.com      password: member123");
    process.exit(0);
}

run().catch(err => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
