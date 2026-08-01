const FINE_PER_DAY = 5; // fallback default; the live value is read from system_settings
const LOAN_DAYS = 15;   // fallback default; the live value is read from system_settings

// Reads the single system_settings row. Falls back to the defaults above if the
// row is somehow missing, so the system never hard-fails on a config lookup.
async function getSettings(pool) {
    try {
        const [rows] = await pool.query("SELECT * FROM system_settings WHERE id = 1");
        if (!rows.length) return { maxBooksPerMember: 3, loanDays: LOAN_DAYS, finePerDay: FINE_PER_DAY };
        return {
            maxBooksPerMember: rows[0].max_books_per_member,
            loanDays: rows[0].loan_days,
            finePerDay: Number(rows[0].fine_per_day),
        };
    } catch (_) {
        return { maxBooksPerMember: 3, loanDays: LOAN_DAYS, finePerDay: FINE_PER_DAY };
    }
}

function isValidEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(email || "").trim());
}

function isValidPhone(phone) {
    const cleaned = String(phone || "").replace(/[\s\-()+]/g, "");
    return /^\d{7,15}$/.test(cleaned);
}

function isValidName(name) {
    const trimmed = String(name || "").trim();
    return trimmed.length >= 2 && /^[a-zA-Z\s.'-]+$/.test(trimmed);
}

// Generates the next sequential ID for a table, e.g. nextId("books", "B", 3) -> "B015"
async function nextId(pool, table, prefix, padLength = 3) {
    const [rows] = await pool.query(
        `
        SELECT MAX(CAST(SUBSTRING(id, ?) AS UNSIGNED)) AS lastId
        FROM ${table}
        WHERE id LIKE ?
        `,
        [prefix.length + 1, `${prefix}%`]
    );

    const next = (rows[0].lastId || 0) + 1;
    return `${prefix}${String(next).padStart(padLength, "0")}`;
}

function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function toDateOnly(date) {
    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function calcFine(dueDate, returnDate = new Date(), finePerDay = FINE_PER_DAY) {
    const due = new Date(`${toDateOnly(dueDate)}T00:00:00`);
    const ret = new Date(`${toDateOnly(returnDate)}T00:00:00`);
    const overdueDays = Math.max(0, Math.ceil((ret - due) / 86400000));
    return { overdueDays, fineAmount: overdueDays * finePerDay };
}

module.exports = {
    FINE_PER_DAY,
    LOAN_DAYS,
    getSettings,
    isValidEmail,
    isValidPhone,
    isValidName,
    nextId,
    addDays,
    toDateOnly,
    calcFine,
};
