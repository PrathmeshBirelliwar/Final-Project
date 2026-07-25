const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { nextId, isValidEmail, isValidPhone, isValidName } = require("../utils/helpers");
const { logAudit } = require("./auth");

const router = express.Router();

function mapLibrarian(row) {
    return { id: row.id, name: row.name, email: row.email, phone: row.phone, address: row.address, status: row.status };
}

// GET /api/librarians — Admin only
router.get("/", requireAuth, requireRole("Admin"), async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM librarians ORDER BY created_at DESC");
        res.json({ success: true, librarians: rows.map(mapLibrarian) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load librarians." });
    }
});

// POST /api/librarians — Admin only
router.post("/", requireAuth, requireRole("Admin"), async (req, res) => {
    try {
        const l = req.body;
        const name = String(l.name || "").trim();
        const email = String(l.email || "").trim().toLowerCase();
        const phone = String(l.phone || "").trim();

        if (!isValidName(name)) return res.status(400).json({ success: false, message: "Please enter a valid full name." });
        if (!isValidEmail(email)) return res.status(400).json({ success: false, message: "Please enter a valid email address." });
        if (!isValidPhone(phone)) return res.status(400).json({ success: false, message: "Please enter a valid phone number." });

        const [existingEmail] = await pool.query("SELECT id FROM librarians WHERE LOWER(email) = ?", [email]);
        if (existingEmail.length) return res.status(409).json({ success: false, message: "A librarian with this email already exists." });

        const id = await nextId(pool, "librarians", "LIB", 3);
        const tempPassword = l.password && l.password.length >= 6 ? l.password : "librarian123";
        const hash = await bcrypt.hash(tempPassword, 10);

        await pool.query(
            `INSERT INTO librarians (id, name, email, phone, address, password_hash) VALUES (?,?,?,?,?,?)`,
            [id, name, email, phone, (l.address || "").trim() || null, hash]
        );
        await logAudit("Admin", req.user.id, "Librarian added", id);
        res.status(201).json({ success: true, message: "Librarian Added Successfully!", id, temporaryPassword: tempPassword });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to add librarian." });
    }
});

// PUT /api/librarians/:id — Admin only
router.put("/:id", requireAuth, requireRole("Admin"), async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM librarians WHERE id = ?", [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: "Librarian not found." });
        const l = req.body;

        await pool.query(
            `UPDATE librarians SET name=?, email=?, phone=?, address=?, status=? WHERE id=?`,
            [
                l.name ? String(l.name).trim() : rows[0].name,
                l.email ? String(l.email).trim().toLowerCase() : rows[0].email,
                l.phone ? String(l.phone).trim() : rows[0].phone,
                l.address ?? rows[0].address,
                l.status || rows[0].status,
                req.params.id,
            ]
        );
        await logAudit("Admin", req.user.id, "Librarian updated", req.params.id);
        res.json({ success: true, message: "Librarian Updated Successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to update librarian." });
    }
});

// DELETE /api/librarians/:id — Admin only
router.delete("/:id", requireAuth, requireRole("Admin"), async (req, res) => {
    try {
        await pool.query("DELETE FROM librarians WHERE id = ?", [req.params.id]);
        await logAudit("Admin", req.user.id, "Librarian deleted", req.params.id);
        res.json({ success: true, message: "Librarian Deleted Successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to delete librarian." });
    }
});

module.exports = router;
