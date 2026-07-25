require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { router: authRouter } = require("./routes/auth");
const booksRouter = require("./routes/books");
const membersRouter = require("./routes/members");
const librariansRouter = require("./routes/librarians");
const issuesRouter = require("./routes/issues");
const finesRouter = require("./routes/fines");
const reservationsRouter = require("./routes/reservations");
const notificationsRouter = require("./routes/notifications");
const backupsRouter = require("./routes/backups");
const statsRouter = require("./routes/stats");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ success: true, message: "Library Hub API is running." }));
app.get("/", (req, res) => {
    res.send("Backend Working Successfully 🚀");
});

app.use("/api/auth", authRouter);
app.use("/api/books", booksRouter);
app.use("/api/members", membersRouter);
app.use("/api/librarians", librariansRouter);
app.use("/api/issues", issuesRouter);
app.use("/api/fines", finesRouter);
app.use("/api/reservations", reservationsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/backups", backupsRouter);
app.use("/api/stats", statsRouter);

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: "Endpoint not found." }));

// Central error handler (catches anything unexpected)
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ success: false, message: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Library Hub API listening on http://localhost:${PORT}`);
});
