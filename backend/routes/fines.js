const express = require("express");
const pool = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { toDateOnly } = require("../utils/helpers");
const { logAudit } = require("./auth");

const router = express.Router();

function mapFine(row) {
    return {
        id: row.id,
        issueId: row.id,
        memberId: row.member_id,
        memberName: row.member_name,
        bookId: row.book_id,
        book: row.title,
        amount: Number(row.fine_amount),
        status: row.fine_status,
        createdDate: toDateOnly(row.return_date || row.due_date),
        dueDate: toDateOnly(row.due_date),
    };
}

const BASE = `
    SELECT i.*, b.title, m.name AS member_name
    FROM issues i
    JOIN books b ON b.id = i.book_id
    JOIN members m ON m.id = i.member_id
    WHERE i.fine_amount > 0`;

// GET /api/fines — Admin / Librarian
router.get("/", requireAuth, requireRole("Admin", "Librarian"), async (req, res) => {
    try {
        const [rows] = await pool.query(BASE + " ORDER BY i.return_date DESC, i.due_date DESC");
        res.json({ success: true, fines: rows.map(mapFine) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load fines." });
    }
});

// GET /api/fines/mine — Member
router.get("/mine", requireAuth, requireRole("Member"), async (req, res) => {
    try {
        const [rows] = await pool.query(BASE + " AND i.member_id = ? ORDER BY i.return_date DESC", [req.user.id]);
        res.json({ success: true, fines: rows.map(mapFine) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load your fines." });
    }
});

// POST /api/fines/:issueId/pay — mark a fine paid. Admin/Librarian (collect in person) or Member (self pay)
router.post("/:issueId/pay", requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM issues WHERE id = ?", [req.params.issueId]);
        if (!rows.length) return res.status(404).json({ success: false, message: "Fine record not found." });
        const issue = rows[0];
        if (req.user.role === "Member" && req.user.id !== issue.member_id) {
            return res.status(403).json({ success: false, message: "You may only pay your own fines." });
        }
        if (issue.fine_status === "Paid") return res.status(409).json({ success: false, message: "This fine is already paid." });
        if (Number(issue.fine_amount) <= 0) return res.status(400).json({ success: false, message: "There is no fine on this record." });

        await pool.query("UPDATE issues SET fine_status = 'Paid' WHERE id = ?", [req.params.issueId]);
        await logAudit(req.user.role, req.user.id, "Fine paid", `issue #${req.params.issueId}`);
        res.json({ success: true, message: "Fine marked as Paid Successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to update fine." });
    }
});

module.exports = router;
