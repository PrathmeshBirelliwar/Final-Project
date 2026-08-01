const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { nextId, isValidEmail, isValidPhone, isValidName } = require("../utils/helpers");
const { logAudit } = require("./auth");

const router = express.Router();

function mapMember(row) {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        department: row.department,
        type: row.type,
        membership: row.membership,
        memberSince: row.member_since,
        status: row.status,
    };
}

// GET /api/members  — Admin or Librarian
router.get("/", requireAuth, requireRole("Admin", "Librarian"), async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM members ORDER BY created_at DESC");
        res.json({ success: true, members: rows.map(mapMember) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load members." });
    }
});

// GET /api/members/:id/profile — the member themself, or Admin/Librarian
router.get("/:id/profile", requireAuth, async (req, res) => {
    if (req.user.role === "Member" && req.user.id !== req.params.id) {
        return res.status(403).json({ success: false, message: "You can only view your own profile." });
    }
    try {
        const [rows] = await pool.query("SELECT * FROM members WHERE id = ?", [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: "Member not found." });
        res.json({ success: true, member: mapMember(rows[0]) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load profile." });
    }
});

// PUT /api/members/:id/profile — the member themself
router.put("/:id/profile", requireAuth, async (req, res) => {
    if (req.user.role === "Member" && req.user.id !== req.params.id) {
        return res.status(403).json({ success: false, message: "You can only edit your own profile." });
    }
    try {
        const { name, phone } = req.body;
        const [rows] = await pool.query("SELECT * FROM members WHERE id = ?", [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: "Member not found." });
        await pool.query("UPDATE members SET name = ?, phone = ? WHERE id = ?", [
            name ? String(name).trim() : rows[0].name,
            phone ? String(phone).trim() : rows[0].phone,
            req.params.id,
        ]);
        res.json({ success: true, message: "Profile updated successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to update profile." });
    }
});

// POST /api/members  — Admin or Librarian creates a member (with a temp password)
router.post("/", requireAuth, requireRole("Admin", "Librarian"), async (req, res) => {
    try {
        const m = req.body;
        const name = String(m.name || "").trim();
        const email = String(m.email || "").trim().toLowerCase();
        const phone = String(m.phone || "").trim();

        if (!isValidName(name)) return res.status(400).json({ success: false, message: "Please enter a valid full name." });
        if (!isValidEmail(email)) return res.status(400).json({ success: false, message: "Please enter a valid email address." });
        if (!isValidPhone(phone)) return res.status(400).json({ success: false, message: "Please enter a valid phone number (7 to 15 digits)." });

        const [existingEmail] = await pool.query("SELECT id FROM members WHERE LOWER(email) = ?", [email]);
        if (existingEmail.length) return res.status(409).json({ success: false, message: "A member with this email already exists." });

        let id = m.id && m.id.trim() ? m.id.trim() : await nextId(pool, "members", "MEM", 3);
        const [existingId] = await pool.query("SELECT id FROM members WHERE id = ?", [id]);
        if (existingId.length) return res.status(409).json({ success: false, message: `Member ID "${id}" already exists.` });

       // Default password = Member ID
        const tempPassword = id;
        const hash = await bcrypt.hash(tempPassword, 10);
        await pool.query(
            `INSERT INTO members (id, name, email, phone, department, type, password_hash) VALUES (?,?,?,?,?,?,?)`,
            [id, name, email, phone, (m.department || "").trim() || null, m.type || "Student", hash]
        );
        await logAudit(req.user.role, req.user.id, "Member added", id);
        res.status(201).json({ success: true, message: "Member Added Successfully!", id, temporaryPassword: tempPassword });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to add member." });
    }
});

// PUT /api/members/:id  — Admin or Librarian
router.put("/:id", requireAuth, requireRole("Admin", "Librarian"), async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM members WHERE id = ?", [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: "Member not found." });

        const m = req.body;
        const name = String(m.name || rows[0].name).trim();
        const email = String(m.email || rows[0].email).trim().toLowerCase();
        const phone = String(m.phone || rows[0].phone).trim();

        if (!isValidName(name)) return res.status(400).json({ success: false, message: "Please enter a valid full name." });
        if (!isValidEmail(email)) return res.status(400).json({ success: false, message: "Please enter a valid email address." });
        if (!isValidPhone(phone)) return res.status(400).json({ success: false, message: "Please enter a valid phone number." });

        await pool.query(
            `UPDATE members SET name=?, email=?, phone=?, department=?, type=? WHERE id=?`,
            [name, email, phone, (m.department ?? rows[0].department), m.type || rows[0].type, req.params.id]
        );
        await logAudit(req.user.role, req.user.id, "Member updated", req.params.id);
        res.json({ success: true, message: "Member Updated Successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to update member." });
    }
});

// DELETE /api/members/:id — Admin or Librarian
router.delete("/:id", requireAuth, requireRole("Admin", "Librarian"), async (req, res) => {
    try {
        const [active] = await pool.query("SELECT id FROM issues WHERE member_id = ? AND status = 'Active'", [req.params.id]);
        if (active.length) {
            return res.status(409).json({ success: false, message: "Cannot delete: this member has active book loans." });
        }
        await pool.query("DELETE FROM members WHERE id = ?", [req.params.id]);
        await logAudit(req.user.role, req.user.id, "Member deleted", req.params.id);
        res.json({ success: true, message: "Member Deleted Successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to delete member." });
    }
});

module.exports = router;
