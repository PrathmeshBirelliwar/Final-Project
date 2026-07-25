const express = require("express");
const pool = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/stats/admin
router.get("/admin", requireAuth, requireRole("Admin"), async (req, res) => {
    try {
        const [[{ totalBooks }]] = await pool.query("SELECT COALESCE(SUM(total_quantity),0) AS totalBooks FROM books");
        const [[{ totalMembers }]] = await pool.query("SELECT COUNT(*) AS totalMembers FROM members");
        const [[{ totalLibrarians }]] = await pool.query("SELECT COUNT(*) AS totalLibrarians FROM librarians");
        const [[{ issuedBooks }]] = await pool.query("SELECT COUNT(*) AS issuedBooks FROM issues WHERE status='Active'");
        const [[{ returnedBooks }]] = await pool.query("SELECT COUNT(*) AS returnedBooks FROM issues WHERE status='Returned'");
        const [[{ pendingReturns }]] = await pool.query(
            "SELECT COUNT(*) AS pendingReturns FROM issues WHERE status='Active' AND due_date < CURDATE()"
        );
        const [[{ totalCollectedFines }]] = await pool.query(
            "SELECT COALESCE(SUM(fine_amount),0) AS totalCollectedFines FROM issues WHERE fine_status='Paid'"
        );
        const [[{ pendingFines }]] = await pool.query(
            "SELECT COALESCE(SUM(fine_amount),0) AS pendingFines FROM issues WHERE fine_status='Pending'"
        );
        const [[{ membersFinedCount }]] = await pool.query(
            "SELECT COUNT(DISTINCT member_id) AS membersFinedCount FROM issues WHERE fine_amount > 0"
        );
        const [[lastBackup]] = await pool.query("SELECT created_at FROM backups ORDER BY created_at DESC LIMIT 1");

        res.json({
            success: true,
            stats: {
                totalBooks, totalMembers, totalLibrarians, issuedBooks, returnedBooks, pendingReturns,
                totalCollectedFines: Number(totalCollectedFines), pendingFines: Number(pendingFines),
                membersFinedCount, lastBackupDate: lastBackup ? lastBackup.created_at : "None",
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load statistics." });
    }
});

// GET /api/stats/librarian
router.get("/librarian", requireAuth, requireRole("Librarian", "Admin"), async (req, res) => {
    try {
        const [[{ totalBooks }]] = await pool.query("SELECT COALESCE(SUM(total_quantity),0) AS totalBooks FROM books");
        const [[{ totalStudents }]] = await pool.query("SELECT COUNT(*) AS totalStudents FROM members");
        const [[{ issuedToday }]] = await pool.query("SELECT COUNT(*) AS issuedToday FROM issues WHERE issue_date = CURDATE()");
        const [[{ dueToday }]] = await pool.query("SELECT COUNT(*) AS dueToday FROM issues WHERE status='Active' AND due_date = CURDATE()");
        const [[{ overdue }]] = await pool.query("SELECT COUNT(*) AS overdue FROM issues WHERE status='Active' AND due_date < CURDATE()");
        const [[{ pendingFines }]] = await pool.query("SELECT COALESCE(SUM(fine_amount),0) AS pendingFines FROM issues WHERE fine_status='Pending'");
        const [recent] = await pool.query(`
            SELECT i.id, b.title, b.author, m.name AS member_name, i.issue_date, i.due_date, i.status
            FROM issues i JOIN books b ON b.id=i.book_id JOIN members m ON m.id=i.member_id
            ORDER BY i.issue_date DESC LIMIT 10`);

        res.json({
            success: true,
            stats: { totalBooks, totalStudents, issuedToday, dueToday, overdue, pendingFines: Number(pendingFines) },
            recentIssues: recent,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load statistics." });
    }
});

// GET /api/stats/member — the logged-in member's own dashboard stats
router.get("/member", requireAuth, requireRole("Member"), async (req, res) => {
    try {
        const [[{ borrowedCount }]] = await pool.query("SELECT COUNT(*) AS borrowedCount FROM issues WHERE member_id=? AND status='Active'", [req.user.id]);
        const [[{ dueSoon }]] = await pool.query(
            "SELECT COUNT(*) AS dueSoon FROM issues WHERE member_id=? AND status='Active' AND due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)",
            [req.user.id]
        );
        const [[{ activeReservations }]] = await pool.query(
            "SELECT COUNT(*) AS activeReservations FROM reservations WHERE member_id=? AND status IN ('Pending','Ready')",
            [req.user.id]
        );
        const [[{ pendingFineTotal }]] = await pool.query(
            "SELECT COALESCE(SUM(fine_amount),0) AS pendingFineTotal FROM issues WHERE member_id=? AND fine_status='Pending'",
            [req.user.id]
        );
        res.json({
            success: true,
            stats: { borrowedCount, dueSoon, activeReservations, pendingFineTotal: Number(pendingFineTotal) },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load your dashboard." });
    }
});

module.exports = router;
