const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

// Verifies the token and attaches { id, role, name, email } to req.user
function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ success: false, message: "Authentication token missing." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid or expired session. Please log in again." });
    }
}

// Restrict a route to one or more roles: requireRole("Admin"), requireRole("Admin","Librarian")
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: "You do not have permission to perform this action." });
        }
        next();
    };
}

module.exports = { signToken, requireAuth, requireRole, JWT_SECRET };
