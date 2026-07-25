const express = require("express");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { logAudit } = require("./auth");

const router = express.Router();
const BACKUP_DIR = path.join(__dirname, "..", "backups_files");
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

function mapBackup(row) {
    return { id: row.id, fileName: row.file_name, size: row.size_label, status: row.status, date: row.created_at };
}

// GET /api/backups — Admin only
router.get("/", requireAuth, requireRole("Admin"), async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM backups ORDER BY created_at DESC");
        res.json({ success: true, backups: rows.map(mapBackup) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to load backups." });
    }
});

// POST /api/backups — Admin only, runs mysqldump if available on the host
router.post("/", requireAuth, requireRole("Admin"), async (req, res) => {
    const now = new Date();
    const stamp = now.toISOString().replace(/[:.]/g, "-");
    const fileName = `library_backup_${stamp}.sql`;
    const filePath = path.join(BACKUP_DIR, fileName);
    const id = "BK_" + Date.now();

    execFile(
        "mysqldump",
        ["-h", process.env.DB_HOST || "127.0.0.1", "-u", process.env.DB_USER || "library_admin",
            `-p${process.env.DB_PASSWORD || "Krish@2007"}`, process.env.DB_NAME || "library_hub"],
        { maxBuffer: 1024 * 1024 * 50 },
        async (err, stdout) => {
            let sizeLabel = "0 KB";
            try {
                if (!err && stdout) {
                    fs.writeFileSync(filePath, stdout);
                    sizeLabel = `${(Buffer.byteLength(stdout) / 1024).toFixed(1)} KB`;
                }
                await pool.query(
                    "INSERT INTO backups (id, file_name, size_label, status) VALUES (?,?,?,?)",
                    [id, fileName, sizeLabel, err ? "Failed" : "Completed"]
                );
                await logAudit("Admin", req.user.id, "Database backup created", fileName);
                res.status(201).json({
                    success: true,
                    message: err ? "Backup record created, but mysqldump was unavailable on this server." : "Backup Created Successfully!",
                    backup: { id, fileName, size: sizeLabel, status: err ? "Failed" : "Completed" },
                });
            } catch (dbErr) {
                console.error(dbErr);
                res.status(500).json({ success: false, message: "Failed to record backup." });
            }
        }
    );
});

// GET /api/backups/:id/download — Admin only
router.get("/:id/download", requireAuth, requireRole("Admin"), async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM backups WHERE id = ?", [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: "Backup not found." });
        const filePath = path.join(BACKUP_DIR, rows[0].file_name);
        if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: "Backup file is no longer available on disk." });
        res.download(filePath);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to download backup." });
    }
});

module.exports = router;
