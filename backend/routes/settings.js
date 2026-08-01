const express = require("express");
const pool = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { logAudit } = require("./auth");

const router = express.Router();

function mapSettings(row) {
    return {
        libraryName: row.library_name,
        libraryAddress: row.library_address,
        libraryContact: row.library_contact,
        libraryEmail: row.library_email,
        maxBooksPerMember: row.max_books_per_member,
        loanDays: row.loan_days,
        finePerDay: Number(row.fine_per_day),
    };
}

// GET /api/settings — public read (loan/fine rules are useful for any signed-in role to see)
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM system_settings WHERE id = 1");
        if (!rows.length) return res.status(404).json({ success: false, message: "Settings not found." });
        res.json({ success: true, settings: mapSettings(rows[0]) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load settings." });
    }
});

// PUT /api/settings — Admin or Librarian; actually enforced by the backend (borrow limits,
// loan period, and fine calculation all read from this table, not hardcoded constants)
router.put("/", requireAuth, requireRole("Admin", "Librarian"), async (req, res) => {
    try {
        const s = req.body;
        const maxBooks = Number(s.maxBooksPerMember);
        const loanDays = Number(s.loanDays);
        const finePerDay = Number(s.finePerDay);

        if (!Number.isInteger(maxBooks) || maxBooks < 1 || maxBooks > 20) {
            return res.status(400).json({ success: false, message: "Max books per member must be a whole number between 1 and 20." });
        }
        if (!Number.isInteger(loanDays) || loanDays < 1 || loanDays > 90) {
            return res.status(400).json({ success: false, message: "Loan period must be a whole number of days between 1 and 90." });
        }
        if (isNaN(finePerDay) || finePerDay < 0 || finePerDay > 500) {
            return res.status(400).json({ success: false, message: "Fine per day must be a number between 0 and 500." });
        }

        await pool.query(
            `UPDATE system_settings SET library_name=?, library_address=?, library_contact=?, library_email=?,
             max_books_per_member=?, loan_days=?, fine_per_day=? WHERE id=1`,
            [
                (s.libraryName || "Smart Library").trim(), (s.libraryAddress || "").trim(),
                (s.libraryContact || "").trim(), (s.libraryEmail || "").trim(),
                maxBooks, loanDays, finePerDay,
            ]
        );
        await logAudit(req.user.role, req.user.id, "System settings updated");
        res.json({ success: true, message: "Settings saved successfully! These limits are now enforced for every borrow, renewal, and fine." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to save settings." });
    }
});

module.exports = router;
