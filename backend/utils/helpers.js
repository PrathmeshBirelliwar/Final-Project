const FINE_PER_DAY = 5; // rupees per day overdue (matches librarian default settings)
const LOAN_DAYS = 15;   // default loan period

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
        `SELECT id FROM ${table} WHERE id LIKE ? ORDER BY LENGTH(id) DESC, id DESC LIMIT 1`,
        [`${prefix}%`]
    );
    if (!rows.length) return `${prefix}${"1".padStart(padLength, "0")}`;
    const lastNum = parseInt(String(rows[0].id).replace(prefix, ""), 10) || 0;
    return `${prefix}${String(lastNum + 1).padStart(padLength, "0")}`;
}

function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function toDateOnly(date) {
    return new Date(date).toISOString().slice(0, 10);
}

function calcFine(dueDate, returnDate = new Date()) {
    const due = new Date(`${toDateOnly(dueDate)}T00:00:00`);
    const ret = new Date(`${toDateOnly(returnDate)}T00:00:00`);
    const overdueDays = Math.max(0, Math.ceil((ret - due) / 86400000));
    return { overdueDays, fineAmount: overdueDays * FINE_PER_DAY };
}

module.exports = {
    FINE_PER_DAY,
    LOAN_DAYS,
    isValidEmail,
    isValidPhone,
    isValidName,
    nextId,
    addDays,
    toDateOnly,
    calcFine,
};
