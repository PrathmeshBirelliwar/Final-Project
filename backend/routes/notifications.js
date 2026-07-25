const express = require("express");
const pool = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

function mapNotif(row) {
    return {
        id: row.id,
        icon: row.icon,
        title: row.title,
        message: row.message,
        unread: !row.is_read,
        time: row.created_at,
    };
}

// GET /api/notifications/mine — Member
router.get("/mine", requireAuth, requireRole("Member"), async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM notifications WHERE member_id = ? ORDER BY created_at DESC LIMIT 50", [req.user.id]);
        res.json({ success: true, notifications: rows.map(mapNotif) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load notifications." });
    }
});

// PUT /api/notifications/mark-all-read
router.put("/mark-all-read", requireAuth, requireRole("Member"), async (req, res) => {
    try {
        await pool.query("UPDATE notifications SET is_read = 1 WHERE member_id = ?", [req.user.id]);
        res.json({ success: true, message: "All notifications marked as read." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to update notifications." });
    }
});

// POST /api/notifications/broadcast — Admin/Librarian sends an announcement to all members
router.post("/broadcast", requireAuth, requireRole("Admin", "Librarian"), async (req, res) => {
    try {
        const { title, message, icon } = req.body;
        if (!title || !message) return res.status(400).json({ success: false, message: "Title and message are required." });
        const [members] = await pool.query("SELECT id FROM members WHERE status = 'Active'");
        if (members.length) {
            const values = members.map(m => [m.id, icon || "fa-circle-info", title, message]);
            await pool.query("INSERT INTO notifications (member_id, icon, title, message) VALUES ?", [values]);
        }
        res.status(201).json({ success: true, message: `Announcement sent to ${members.length} member(s).` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to send announcement." });
    }
});

module.exports = router;
