const express = require("express");
const pool = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { toDateOnly } = require("../utils/helpers");
const { logAudit } = require("./auth");

const router = express.Router();

function mapReservation(row) {
    return {
        id: row.id,
        bookId: row.book_id,
        bookTitle: row.title,
        bookAuthor: row.author,
        bookImage: row.image_url,
        memberId: row.member_id,
        memberName: row.member_name,
        reservedDate: toDateOnly(row.reserved_date),
        status: row.status,
    };
}

const BASE = `
    SELECT r.*, b.title, b.author, b.image_url, m.name AS member_name
    FROM reservations r
    JOIN books b ON b.id = r.book_id
    JOIN members m ON m.id = r.member_id`;

// GET /api/reservations — Admin/Librarian
router.get("/", requireAuth, requireRole("Admin", "Librarian"), async (req, res) => {
    try {
        const [rows] = await pool.query(BASE + " ORDER BY r.reserved_date DESC");
        res.json({ success: true, reservations: rows.map(mapReservation) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load reservations." });
    }
});

// GET /api/reservations/mine — Member
router.get("/mine", requireAuth, requireRole("Member"), async (req, res) => {
    try {
        const [rows] = await pool.query(BASE + " WHERE r.member_id = ? ORDER BY r.reserved_date DESC", [req.user.id]);
        res.json({ success: true, reservations: rows.map(mapReservation) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load your reservations." });
    }
});

// POST /api/reservations — Member reserves a book
router.post("/", requireAuth, requireRole("Member"), async (req, res) => {
    try {
        const { bookId } = req.body;
        const [books] = await pool.query("SELECT * FROM books WHERE id = ?", [bookId]);
        if (!books.length) return res.status(404).json({ success: false, message: "Book not found." });

        const [existing] = await pool.query(
            "SELECT id FROM reservations WHERE book_id = ? AND member_id = ? AND status IN ('Pending','Ready')",
            [bookId, req.user.id]
        );
        if (existing.length) return res.status(409).json({ success: false, message: "You already have an active reservation for this book." });

        const [result] = await pool.query(
            "INSERT INTO reservations (book_id, member_id, reserved_date, status) VALUES (?,?,CURDATE(),'Pending')",
            [bookId, req.user.id]
        );
        await logAudit("Member", req.user.id, "Book reserved", bookId);
        res.status(201).json({ success: true, message: "Reservation placed successfully!", id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to place reservation." });
    }
});

// PUT /api/reservations/:id/cancel
router.put("/:id/cancel", requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM reservations WHERE id = ?", [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: "Reservation not found." });
        if (req.user.role === "Member" && req.user.id !== rows[0].member_id) {
            return res.status(403).json({ success: false, message: "You may only cancel your own reservations." });
        }
        await pool.query("UPDATE reservations SET status = 'Cancelled' WHERE id = ?", [req.params.id]);
        res.json({ success: true, message: "Reservation cancelled successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to cancel reservation." });
    }
});

// PUT /api/reservations/:id/ready — Admin/Librarian marks a copy ready for pickup
router.put("/:id/ready", requireAuth, requireRole("Admin", "Librarian"), async (req, res) => {
    try {
        await pool.query("UPDATE reservations SET status = 'Ready' WHERE id = ?", [req.params.id]);
        res.json({ success: true, message: "Reservation marked ready for pickup." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to update reservation." });
    }
});

module.exports = router;
