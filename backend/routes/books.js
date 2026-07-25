const express = require("express");
const pool = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { nextId } = require("../utils/helpers");
const { logAudit } = require("./auth");

const router = express.Router();

function mapBook(row) {
    return {
        id: row.id,
        name: row.title,
        title: row.title,
        author: row.author,
        category: row.category,
        categoryLabel: row.category,
        publisher: row.publisher,
        isbn: row.isbn,
        published: row.published_year,
        pages: row.pages,
        description: row.description,
        image: row.image_url,
        location: row.location,
        shelf: row.shelf,
        rating: row.rating,
        reviews: row.reviews_count ? `${row.reviews_count} Reviews` : "0 Reviews",
        quantity: row.total_quantity,
        totalCopies: row.total_quantity,
        availableCopies: row.available_quantity,
    };
}

// GET /api/books  — public catalog (search + category filter)
router.get("/", async (req, res) => {
    try {
        const { search, category } = req.query;
        let sql = "SELECT * FROM books WHERE 1=1";
        const params = [];
        if (category && category !== "all") {
            sql += " AND category = ?";
            params.push(category);
        }
        if (search) {
            sql += " AND (title LIKE ? OR author LIKE ? OR isbn LIKE ? OR id LIKE ?)";
            const like = `%${search}%`;
            params.push(like, like, like, like);
        }
        sql += " ORDER BY title ASC";
        const [rows] = await pool.query(sql, params);
        res.json({ success: true, books: rows.map(mapBook) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load books." });
    }
});

// GET /api/books/:id
router.get("/:id", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM books WHERE id = ?", [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: "Book not found." });
        res.json({ success: true, book: mapBook(rows[0]) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load book." });
    }
});

// POST /api/books  — Admin or Librarian
router.post("/", requireAuth, requireRole("Admin", "Librarian"), async (req, res) => {
    try {
        const b = req.body;
        if (!b.name && !b.title) return res.status(400).json({ success: false, message: "Book title is required." });
        if (!b.author) return res.status(400).json({ success: false, message: "Author is required." });

        const id = b.id && b.id.trim() ? b.id.trim() : await nextId(pool, "books", "B", 3);
        const [existing] = await pool.query("SELECT id FROM books WHERE id = ?", [id]);
        if (existing.length) return res.status(409).json({ success: false, message: `Book ID "${id}" already exists.` });

        const qty = Number(b.quantity ?? b.totalCopies ?? 0);
        await pool.query(
            `INSERT INTO books (id, title, author, category, publisher, isbn, published_year, pages, description, image_url, location, shelf, total_quantity, available_quantity)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [id, b.name || b.title, b.author, b.category || null, b.publisher || null, b.isbn || null,
                b.published || null, b.pages || null, b.description || null, b.image || null,
                b.location || null, b.shelf || null, qty, qty]
        );
        await logAudit(req.user.role, req.user.id, "Book added", id);
        res.status(201).json({ success: true, message: "Book Added Successfully!", id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to add book." });
    }
});

// PUT /api/books/:id  — Admin or Librarian
router.put("/:id", requireAuth, requireRole("Admin", "Librarian"), async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM books WHERE id = ?", [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: "Book not found." });
        const existing = rows[0];
        const b = req.body;

        const newQty = b.quantity ?? b.totalCopies;
        let availableQty = existing.available_quantity;
        if (newQty !== undefined) {
            const issuedOut = existing.total_quantity - existing.available_quantity;
            availableQty = Math.max(0, Number(newQty) - issuedOut);
        }

        await pool.query(
            `UPDATE books SET title=?, author=?, category=?, publisher=?, isbn=?, published_year=?, pages=?, description=?, image_url=?, location=?, shelf=?, total_quantity=?, available_quantity=?
             WHERE id=?`,
            [b.name || b.title || existing.title, b.author || existing.author, b.category ?? existing.category,
                b.publisher ?? existing.publisher, b.isbn ?? existing.isbn, b.published ?? existing.published_year,
                b.pages ?? existing.pages, b.description ?? existing.description, b.image ?? existing.image_url,
                b.location ?? existing.location, b.shelf ?? existing.shelf,
                newQty !== undefined ? Number(newQty) : existing.total_quantity, availableQty, req.params.id]
        );
        await logAudit(req.user.role, req.user.id, "Book updated", req.params.id);
        res.json({ success: true, message: "Book Updated Successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to update book." });
    }
});

// DELETE /api/books/:id  — Admin or Librarian
router.delete("/:id", requireAuth, requireRole("Admin", "Librarian"), async (req, res) => {
    try {
        const [active] = await pool.query("SELECT id FROM issues WHERE book_id = ? AND status = 'Active'", [req.params.id]);
        if (active.length) {
            return res.status(409).json({ success: false, message: "Cannot delete: this book currently has active loans." });
        }
        await pool.query("DELETE FROM books WHERE id = ?", [req.params.id]);
        await logAudit(req.user.role, req.user.id, "Book deleted", req.params.id);
        res.json({ success: true, message: "Book Deleted Successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to delete book." });
    }
});

module.exports = router;
