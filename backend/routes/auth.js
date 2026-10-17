const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { signToken, requireAuth } = require("../middleware/auth");
const { isValidEmail, isValidPhone, isValidName, nextId } = require("../utils/helpers");

const router = express.Router();

async function logAudit(actorRole, actorId, action, details = "") {
    try {
        await pool.query(
            "INSERT INTO audit_logs (actor_role, actor_id, action, details) VALUES (?,?,?,?)",
            [actorRole, actorId, action, details]
        );
    } catch (_) { /* auditing must never break the request */ }
}

// ---------------------------------------------------------------------
// POST /api/auth/login
// Body: { identifier, password, role }  role is optional: "Admin" | "Librarian" | "Member"
// ---------------------------------------------------------------------
router.post("/login", async (req, res) => {
    const { identifier, password, role } = req.body;
    if (!identifier || !password) {
        return res.status(400).json({ success: false, message: "Please enter both your login ID and password." });
    }
    const id = String(identifier).trim().toLowerCase();

    try {
        // ---- Admin ----
        if (!role || role === "Admin") {
            const [rows] = await pool.query(
                "SELECT * FROM admins WHERE LOWER(username) = ? OR LOWER(email) = ? LIMIT 1",
                [id, id]
            );
            if (rows.length) {
                const admin = rows[0];
                const ok = await bcrypt.compare(password, admin.password_hash);
                if (ok) {
                    const token = signToken({ id: admin.id, role: "Admin", name: admin.username, email: admin.email });
                    await logAudit("Admin", admin.username, "Login");
                    return res.json({
                        success: true,
                        token,
                        user: { id: admin.id, username: admin.username, email: admin.email, role: "Admin" },
                    });
                }
                if (role === "Admin") return res.status(401).json({ success: false, message: "Invalid username or password." });
            }
        }

        // ---- Librarian ----
        if (!role || role === "Librarian") {
            const [rows] = await pool.query(
                "SELECT * FROM librarians WHERE LOWER(email) = ? OR LOWER(id) = ? LIMIT 1",
                [id, id]
            );
            if (rows.length) {
                const lib = rows[0];
                const ok = await bcrypt.compare(password, lib.password_hash);
                if (ok) {
                    if (lib.status === "Inactive") {
                        return res.status(403).json({ success: false, message: "Your librarian account has been deactivated. Contact the admin." });
                    }
                    const token = signToken({ id: lib.id, role: "Librarian", name: lib.name, email: lib.email });
                    await logAudit("Librarian", lib.id, "Login");
                    return res.json({
                        success: true,
                        token,
                        user: { id: lib.id, name: lib.name, email: lib.email, role: "Librarian" },
                    });
                }
                if (role === "Librarian") return res.status(401).json({ success: false, message: "Invalid email or password." });
            }
        }

        // ---- Member ----
        if (!role || role === "Member") {
            const [rows] = await pool.query(
                "SELECT * FROM members WHERE LOWER(email) = ? OR LOWER(id) = ? LIMIT 1",
                [id, id]
            );
            if (rows.length) {
                const member = rows[0];
                const ok = await bcrypt.compare(password, member.password_hash);
                if (ok) {
                    if (member.status === "Inactive") {
                        return res.status(403).json({ success: false, message: "Your membership is inactive. Contact the library." });
                    }
                    const token = signToken({ id: member.id, role: "Member", name: member.name, email: member.email });
                    await logAudit("Member", member.id, "Login");
                    return res.json({
                        success: true,
                        token,
                        user: {
                            id: member.id, name: member.name, email: member.email, phone: member.phone,
                            department: member.department, type: member.type, membership: member.membership,
                            memberSince: member.member_since, role: "Member",
                        },
                    });
                }
                if (role === "Member") return res.status(401).json({ success: false, message: "Invalid email or password." });
            }
        }

        return res.status(401).json({ success: false, message: "Invalid credentials. Please check your login details and try again." });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ success: false, message: "Server error while logging in." });
    }
});

// ---------------------------------------------------------------------
// POST /api/auth/register  (self-service member sign-up)
// ---------------------------------------------------------------------
router.post("/register", async (req, res) => {
    const { name, email, password, phone, department } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!isValidName(name)) return res.status(400).json({ success: false, message: "Please enter a valid full name." });
    if (!isValidEmail(cleanEmail)) return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    if (typeof password !== "string" || password.length < 12) return res.status(400).json({ success: false, message: "Password must be at least 12 characters." });
    if (phone && !isValidPhone(phone)) return res.status(400).json({ success: false, message: "Please enter a valid phone number." });

    try {
        const [existing] = await pool.query("SELECT id FROM members WHERE LOWER(email) = ?", [cleanEmail]);
        if (existing.length) {
            return res.status(409).json({ success: false, message: "An account with this email already exists." });
        }

        const newId = await nextId(pool, "members", "MEM", 3);
        const hash = await bcrypt.hash(password, 10);
        await pool.query(
            `INSERT INTO members (id, name, email, phone, department, type, password_hash)
             VALUES (?,?,?,?,?,?,?)`,
            [newId, String(name).trim(), cleanEmail, phone || null, department || null, "Student", hash]
        );

        const token = signToken({ id: newId, role: "Member", name: String(name).trim(), email: cleanEmail });
        await logAudit("Member", newId, "Registered");
        return res.status(201).json({
            success: true,
            token,
            user: { id: newId, name: String(name).trim(), email: cleanEmail, role: "Member" },
        });
    } catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({ success: false, message: "Server error while registering." });
    }
});

// ---------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------
router.get("/me", requireAuth, async (req, res) => {
    res.json({ success: true, user: req.user });
});

// ---------------------------------------------------------------------
// POST /api/auth/change-password
// ---------------------------------------------------------------------
router.post("/change-password", requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (typeof newPassword !== "string" || newPassword.length < 12) {
        return res.status(400).json({ success: false, message: "New password must be at least 12 characters." });
    }
    const table = req.user.role === "Admin" ? "admins" : req.user.role === "Librarian" ? "librarians" : "members";

    try {
        const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [req.user.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: "Account not found." });

        const ok = await bcrypt.compare(currentPassword || "", rows[0].password_hash);
        if (!ok) return res.status(401).json({ success: false, message: "Current password is incorrect." });

        const hash = await bcrypt.hash(newPassword, 10);
        await pool.query(`UPDATE ${table} SET password_hash = ? WHERE id = ?`, [hash, req.user.id]);
        await logAudit(req.user.role, req.user.id, "Password changed");
        res.json({ success: true, message: "Password updated successfully." });
    } catch (err) {
        console.error("Change password error:", err);
        res.status(500).json({ success: false, message: "Server error while changing password." });
    }
});

module.exports = { router, logAudit };
