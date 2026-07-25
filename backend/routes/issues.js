const express = require("express");
const pool = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { LOAN_DAYS, addDays, toDateOnly, calcFine } = require("../utils/helpers");
const { logAudit } = require("./auth");

const router = express.Router();
const MAX_BOOKS_PER_MEMBER = 3;
const MAX_RENEWALS = 2;

function mapIssue(row) {
    return {
        id: row.id,
        bookId: row.book_id,
        bookTitle: row.title,
        bookAuthor: row.author,
        bookImage: row.image_url,
        memberId: row.member_id,
        memberName: row.member_name,
        librarianId: row.librarian_id,
        issueDate: toDateOnly(row.issue_date),
        borrowedDate: toDateOnly(row.issue_date),
        dueDate: toDateOnly(row.due_date),
        returnDate: row.return_date ? toDateOnly(row.return_date) : null,
        returnedDate: row.return_date ? toDateOnly(row.return_date) : null,
        renewals: row.renewals,
        status: row.status,
        fineAmount: Number(row.fine_amount),
        fineStatus: row.fine_status,
    };
}

const BASE_SELECT = `
    SELECT i.*, b.title, b.author, b.image_url, m.name AS member_name
    FROM issues i
    JOIN books b ON b.id = i.book_id
    JOIN members m ON m.id = i.member_id`;

// GET /api/issues — Admin/Librarian, optional ?status=&memberId=&bookId=
router.get("/", requireAuth, requireRole("Admin", "Librarian"), async (req, res) => {
    try {
        const { status, memberId, bookId } = req.query;
        let sql = BASE_SELECT + " WHERE 1=1";
        const params = [];
        if (status) { sql += " AND i.status = ?"; params.push(status); }
        if (memberId) { sql += " AND i.member_id = ?"; params.push(memberId); }
        if (bookId) { sql += " AND i.book_id = ?"; params.push(bookId); }
        sql += " ORDER BY i.issue_date DESC";
        const [rows] = await pool.query(sql, params);
        res.json({ success: true, issues: rows.map(mapIssue) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load issued books." });
    }
});

// GET /api/issues/mine — Member's own active loans
router.get("/mine", requireAuth, requireRole("Member"), async (req, res) => {
    try {
        const [rows] = await pool.query(BASE_SELECT + " WHERE i.member_id = ? AND i.status = 'Active' ORDER BY i.due_date ASC", [req.user.id]);
        res.json({ success: true, issues: rows.map(mapIssue) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load your borrowed books." });
    }
});

// GET /api/issues/history/mine — Member's return history
router.get("/history/mine", requireAuth, requireRole("Member"), async (req, res) => {
    try {
        const [rows] = await pool.query(BASE_SELECT + " WHERE i.member_id = ? AND i.status = 'Returned' ORDER BY i.return_date DESC", [req.user.id]);
        res.json({ success: true, history: rows.map(mapIssue) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load your history." });
    }
});

// POST /api/issues — issue a book. Admin/Librarian (to any member) OR Member (self-borrow)
router.post("/", requireAuth, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { bookId, memberId } = req.body;
        const targetMemberId = req.user.role === "Member" ? req.user.id : memberId;
        if (!bookId || !targetMemberId) {
            return res.status(400).json({ success: false, message: "Book and member are required." });
        }
        if (req.user.role === "Member" && memberId && memberId !== req.user.id) {
            return res.status(403).json({ success: false, message: "Members may only borrow books for themselves." });
        }

        await conn.beginTransaction();

        const [books] = await conn.query("SELECT * FROM books WHERE id = ? FOR UPDATE", [bookId]);
        if (!books.length) { await conn.rollback(); return res.status(404).json({ success: false, message: "Book not found." }); }
        const book = books[0];
        if (book.available_quantity < 1) {
            await conn.rollback();
            return res.status(409).json({ success: false, message: "This book is currently unavailable. Try reserving it instead." });
        }

        const [members] = await conn.query("SELECT * FROM members WHERE id = ?", [targetMemberId]);
        if (!members.length) { await conn.rollback(); return res.status(404).json({ success: false, message: "Member not found." }); }

        const [activeForBook] = await conn.query(
            "SELECT id FROM issues WHERE book_id = ? AND member_id = ? AND status = 'Active'",
            [bookId, targetMemberId]
        );
        if (activeForBook.length) {
            await conn.rollback();
            return res.status(409).json({ success: false, message: "This member already has this book borrowed." });
        }

        const [activeCount] = await conn.query(
            "SELECT COUNT(*) AS c FROM issues WHERE member_id = ? AND status = 'Active'",
            [targetMemberId]
        );
        if (activeCount[0].c >= MAX_BOOKS_PER_MEMBER) {
            await conn.rollback();
            return res.status(409).json({ success: false, message: `Members can borrow a maximum of ${MAX_BOOKS_PER_MEMBER} books at a time.` });
        }

        const issueDate = new Date();
        const dueDate = addDays(issueDate, LOAN_DAYS);
        const librarianId = req.user.role === "Librarian" ? req.user.id : null;

        const [result] = await conn.query(
            `INSERT INTO issues (book_id, member_id, librarian_id, issue_date, due_date, status)
             VALUES (?,?,?,?,?, 'Active')`,
            [bookId, targetMemberId, librarianId, toDateOnly(issueDate), toDateOnly(dueDate)]
        );
        await conn.query("UPDATE books SET available_quantity = available_quantity - 1 WHERE id = ?", [bookId]);
        await conn.query(
            "INSERT INTO notifications (member_id, icon, title, message) VALUES (?, 'fa-book', 'Book Issued', ?)",
            [targetMemberId, `"${book.title}" has been issued to you. Due back on ${toDateOnly(dueDate)}.`]
        );

        await conn.commit();
        await logAudit(req.user.role, req.user.id, "Book issued", `${bookId} -> ${targetMemberId}`);
        res.status(201).json({ success: true, message: "Book issued successfully!", issueId: result.insertId, dueDate: toDateOnly(dueDate) });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to issue book." });
    } finally {
        conn.release();
    }
});

// POST /api/issues/:id/return — Admin/Librarian, or the Member who holds the loan
router.post("/:id/return", requireAuth, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.query("SELECT * FROM issues WHERE id = ? FOR UPDATE", [req.params.id]);
        if (!rows.length) { await conn.rollback(); return res.status(404).json({ success: false, message: "Loan record not found." }); }
        const issue = rows[0];
        if (issue.status !== "Active") { await conn.rollback(); return res.status(409).json({ success: false, message: "This book has already been returned." }); }
        if (req.user.role === "Member" && req.user.id !== issue.member_id) {
            await conn.rollback();
            return res.status(403).json({ success: false, message: "You may only return your own books." });
        }

        const returnDate = new Date();
        const { overdueDays, fineAmount } = calcFine(issue.due_date, returnDate);
        const fineStatus = fineAmount > 0 ? "Pending" : "None";

        await conn.query(
            `UPDATE issues SET status='Returned', return_date=?, fine_amount=?, fine_status=? WHERE id=?`,
            [toDateOnly(returnDate), fineAmount, fineStatus, req.params.id]
        );
        await conn.query("UPDATE books SET available_quantity = available_quantity + 1 WHERE id = ?", [issue.book_id]);

        if (fineAmount > 0) {
            await conn.query(
                "INSERT INTO notifications (member_id, icon, title, message) VALUES (?, 'fa-triangle-exclamation', 'Fine Issued', ?)",
                [issue.member_id, `A fine of Rs.${fineAmount} was applied for returning a book ${overdueDays} day(s) late.`]
            );
        }

        await conn.commit();
        await logAudit(req.user.role, req.user.id, "Book returned", `issue #${req.params.id}`);
        res.json({ success: true, message: "Book returned successfully!", overdueDays, fineAmount });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to return book." });
    } finally {
        conn.release();
    }
});

// POST /api/issues/:id/renew
router.post("/:id/renew", requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM issues WHERE id = ?", [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: "Loan record not found." });
        const issue = rows[0];
        if (issue.status !== "Active") return res.status(409).json({ success: false, message: "Only active loans can be renewed." });
        if (req.user.role === "Member" && req.user.id !== issue.member_id) {
            return res.status(403).json({ success: false, message: "You may only renew your own books." });
        }
        if (issue.renewals >= MAX_RENEWALS) {
            return res.status(409).json({ success: false, message: "This loan has reached the renewal limit." });
        }

        const base = new Date(`${toDateOnly(issue.due_date)}T00:00:00`) < new Date() ? new Date() : new Date(issue.due_date);
        const newDue = addDays(base, LOAN_DAYS);

        await pool.query("UPDATE issues SET due_date = ?, renewals = renewals + 1 WHERE id = ?", [toDateOnly(newDue), req.params.id]);
        await logAudit(req.user.role, req.user.id, "Book renewed", `issue #${req.params.id}`);
        res.json({ success: true, message: "Book renewed successfully!", dueDate: toDateOnly(newDue) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to renew book." });
    }
});

module.exports = router;
