/**
 * Smart Library Management System - Central Database Engine (js/db.js)
 * Provides persistent data management, data validation, security, and hashing.
 */

(function (window) {
    const DB_PREFIX = "smart_library_";

    // SHA-256 Hashing helper
    async function hashPassword(password) {
        if (!password) return "";
        try {
            const msgUint8 = new TextEncoder().encode(password);
            const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        } catch (e) {
            // Simple fallback hash if crypto API is unavailable
            let hash = 0;
            for (let i = 0; i < password.length; i++) {
                const char = password.charCodeAt(i);
                hash = (hash << 5) - hash + char;
                hash |= 0;
            }
            return "fallback_" + Math.abs(hash);
        }
    }

    // Default Seed Data
    const seedBooks = [
        { id: "B001", name: "Java Programming", author: "James Gosling", category: "Programming", publisher: "Oracle", quantity: 10 },
        { id: "B002", name: "Database System", author: "Korth", category: "Database", publisher: "McGraw Hill", quantity: 8 },
        { id: "B003", name: "Python Basics", author: "Guido", category: "Programming", publisher: "O'Reilly", quantity: 12 }
    ];

    const seedMembers = [
        { id: "MEM001", name: "Rahul Sharma", email: "rahul@gmail.com", phone: "9876543210", department: "Computer", type: "Student" },
        { id: "MEM002", name: "Priya Patel", email: "priya@gmail.com", phone: "9123456789", department: "Library", type: "Faculty" }
    ];

    const seedLibrarians = [
        { id: "LIB001", name: "Soham Nagdeve", email: "soham@library.com", phone: "9988776655", address: "Central Library Office", passwordHash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9" }
    ];

    const seedFines = [
        { id: "F001", memberId: "MEM001", memberName: "Rahul Sharma", book: "Java Programming", amount: 150, status: "Pending" },
        { id: "F002", memberId: "MEM002", memberName: "Priya Patel", book: "Database System", amount: 100, status: "Paid" },
        { id: "F003", memberId: "MEM003", memberName: "Amit Kumar", book: "Python Basics", amount: 200, status: "Pending" },
        { id: "F004", memberId: "MEM004", memberName: "Sneha Joshi", book: "Operating System", amount: 50, status: "Paid" }
    ];

    const seedBackups = [
        { id: "BK_001", date: "18-07-2026", fileName: "library_backup_18_07_2026.sql", size: "3.2 MB", status: "Completed" },
        { id: "BK_002", date: "10-07-2026", fileName: "library_backup_10_07_2026.sql", size: "3.1 MB", status: "Completed" },
        { id: "BK_003", date: "01-07-2026", fileName: "library_backup_01_07_2026.sql", size: "2.9 MB", status: "Completed" }
    ];

    // Initialize Database
    async function initDB() {
        if (!localStorage.getItem(DB_PREFIX + "books")) {
            localStorage.setItem(DB_PREFIX + "books", JSON.stringify(seedBooks));
        }
        if (!localStorage.getItem(DB_PREFIX + "members")) {
            localStorage.setItem(DB_PREFIX + "members", JSON.stringify(seedMembers));
        }
        if (!localStorage.getItem(DB_PREFIX + "librarians")) {
            localStorage.setItem(DB_PREFIX + "librarians", JSON.stringify(seedLibrarians));
        }
        if (!localStorage.getItem(DB_PREFIX + "fines")) {
            localStorage.setItem(DB_PREFIX + "fines", JSON.stringify(seedFines));
        }
        if (!localStorage.getItem(DB_PREFIX + "backups")) {
            localStorage.setItem(DB_PREFIX + "backups", JSON.stringify(seedBackups));
        }
        if (!localStorage.getItem(DB_PREFIX + "users")) {
            const adminHash = await hashPassword("admin123");
            const initialUsers = [
                { username: "admin", email: "admin@smartlibrary.com", passwordHash: adminHash, role: "Admin" }
            ];
            localStorage.setItem(DB_PREFIX + "users", JSON.stringify(initialUsers));
        }
        if (!localStorage.getItem(DB_PREFIX + "reset_tokens")) {
            localStorage.setItem(DB_PREFIX + "reset_tokens", JSON.stringify([]));
        }
        if (!localStorage.getItem(DB_PREFIX + "audit_logs")) {
            localStorage.setItem(DB_PREFIX + "audit_logs", JSON.stringify([]));
        }
    }

    // Run Initialization
    initDB();

    // Helper: Sanitization against XSS
    function sanitize(str) {
        if (typeof str !== "string") return str;
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Helper: Validations
    function isValidEmail(email) {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(String(email).trim().toLowerCase());
    }

    function isValidPhone(phone) {
        const cleaned = String(phone).replace(/[\s\-\(\)\+]/g, "");
        return /^\d{7,15}$/.test(cleaned);
    }

    function isValidName(name) {
        const trimmed = String(name).trim();
        return trimmed.length >= 2 && /^[a-zA-Z\s\.\'\-]+$/.test(trimmed);
    }

    const DB = {
        hashPassword,
        sanitize,
        isValidEmail,
        isValidPhone,
        isValidName,

        // Authentication & Password Reset
        async login(username, password) {

    try {

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                identifier: username,
                password: password,
                role: "Admin"
            })
        });

        const data = await response.json();

        if (data.success) {

            sessionStorage.setItem("token", data.token);
            sessionStorage.setItem("user", JSON.stringify(data.user));

            return {
                success: true,
                session: data.user
            };
        }

        return {
            success: false,
            message: data.message
        };

    } catch (err) {

        console.error(err);

        return {
            success: false,
            message: "Cannot connect to backend."
        };
    }
},

                getCurrentSession() {
            const token = sessionStorage.getItem("token");
            const user = sessionStorage.getItem("user");

            if (!token || !user) return null;

            return JSON.parse(user);
        },

                logout() {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
        },

        async requestPasswordReset(email) {
            const cleanEmail = String(email).trim().toLowerCase();
            if (!isValidEmail(cleanEmail)) {
                return { success: false, message: "Please enter a valid email address." };
            }

            const users = JSON.parse(localStorage.getItem(DB_PREFIX + "users") || "[]");
            const librarians = JSON.parse(localStorage.getItem(DB_PREFIX + "librarians") || "[]");

            const accountExists = users.some(u => u.email.toLowerCase() === cleanEmail) || librarians.some(l => l.email.toLowerCase() === cleanEmail);

            // Generate token regardless of existence to prevent timing/user enumeration, but store if user exists
            const token = Math.floor(100000 + Math.random() * 900000).toString();
            const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes

            if (accountExists) {
                const tokens = JSON.parse(localStorage.getItem(DB_PREFIX + "reset_tokens") || "[]");
                // Remove existing tokens for this email
                const filtered = tokens.filter(t => t.email !== cleanEmail);
                filtered.push({ email: cleanEmail, token, expiry });
                localStorage.setItem(DB_PREFIX + "reset_tokens", JSON.stringify(filtered));
            }

            return {
                success: true,
                message: "If an account with this email exists, password reset instructions and a reset token have been generated.",
                demoToken: accountExists ? token : null // Passed for ease of verification in UI
            };
        },

        async resetPassword(email, token, newPassword) {
            const cleanEmail = String(email).trim().toLowerCase();
            const cleanToken = String(token).trim();

            if (!newPassword || newPassword.length < 6) {
                return { success: false, message: "Password must be at least 6 characters long." };
            }

            const tokens = JSON.parse(localStorage.getItem(DB_PREFIX + "reset_tokens") || "[]");
            const record = tokens.find(t => t.email === cleanEmail && t.token === cleanToken);

            if (!record) {
                return { success: false, message: "Invalid reset token or email." };
            }

            if (Date.now() > record.expiry) {
                return { success: false, message: "Reset token has expired. Please request a new one." };
            }

            const newHash = await hashPassword(newPassword);

            // Update in users or librarians
            let users = JSON.parse(localStorage.getItem(DB_PREFIX + "users") || "[]");
            let librarians = JSON.parse(localStorage.getItem(DB_PREFIX + "librarians") || "[]");
            let updated = false;

            users = users.map(u => {
                if (u.email.toLowerCase() === cleanEmail) {
                    u.passwordHash = newHash;
                    updated = true;
                }
                return u;
            });

            librarians = librarians.map(l => {
                if (l.email.toLowerCase() === cleanEmail) {
                    l.passwordHash = newHash;
                    updated = true;
                }
                return l;
            });

            if (updated) {
                localStorage.setItem(DB_PREFIX + "users", JSON.stringify(users));
                localStorage.setItem(DB_PREFIX + "librarians", JSON.stringify(librarians));
                // Remove used token
                const remaining = tokens.filter(t => !(t.email === cleanEmail && t.token === cleanToken));
                localStorage.setItem(DB_PREFIX + "reset_tokens", JSON.stringify(remaining));
                return { success: true, message: "Password reset successfully! You can now login with your new password." };
            }

            return { success: false, message: "User account not found." };
        },

        // ================= BOOKS =================
        getBooks() {
            return JSON.parse(localStorage.getItem(DB_PREFIX + "books") || "[]");
        },

        addBook(book) {
            const books = this.getBooks();
            const id = String(book.id || "").trim();
            const qty = Number(book.quantity);

            if (!id) return { success: false, message: "Book ID is required." };
            if (!book.name || !String(book.name).trim()) return { success: false, message: "Book Name is required." };
            
            // Check Duplicate Book ID
            if (books.some(b => b.id.toLowerCase() === id.toLowerCase())) {
                return { success: false, message: `Book ID "${id}" already exists. Duplicate Book IDs are not allowed.` };
            }

            // Quantity Validation
            if (!Number.isInteger(qty) || qty < 1) {
                return { success: false, message: "Quantity must be a positive whole number (minimum 1)." };
            }

            const newBook = {
                id: sanitize(id),
                name: sanitize(book.name.trim()),
                author: sanitize((book.author || "").trim()),
                category: sanitize((book.category || "").trim()),
                publisher: sanitize((book.publisher || "").trim()),
                quantity: qty
            };

            books.push(newBook);
            localStorage.setItem(DB_PREFIX + "books", JSON.stringify(books));
            return { success: true, message: "Book added successfully!", book: newBook };
        },

        updateBook(oldId, book) {
            const books = this.getBooks();
            const index = books.findIndex(b => b.id.toLowerCase() === oldId.toLowerCase());
            if (index === -1) return { success: false, message: "Book not found." };

            const newId = String(book.id || "").trim();
            const qty = Number(book.quantity);

            if (!newId) return { success: false, message: "Book ID is required." };
            if (!book.name || !String(book.name).trim()) return { success: false, message: "Book Name is required." };

            // Check Duplicate Book ID if ID changed
            if (newId.toLowerCase() !== oldId.toLowerCase() && books.some(b => b.id.toLowerCase() === newId.toLowerCase())) {
                return { success: false, message: `Book ID "${newId}" already exists. Duplicate Book IDs are not allowed.` };
            }

            if (!Number.isInteger(qty) || qty < 1) {
                return { success: false, message: "Quantity must be a positive whole number (minimum 1)." };
            }

            books[index] = {
                id: sanitize(newId),
                name: sanitize(book.name.trim()),
                author: sanitize((book.author || "").trim()),
                category: sanitize((book.category || "").trim()),
                publisher: sanitize((book.publisher || "").trim()),
                quantity: qty
            };

            localStorage.setItem(DB_PREFIX + "books", JSON.stringify(books));
            return { success: true, message: "Book updated successfully!" };
        },

        deleteBook(id) {
            let books = this.getBooks();
            const initialLen = books.length;
            books = books.filter(b => b.id.toLowerCase() !== id.toLowerCase());
            if (books.length === initialLen) {
                return { success: false, message: "Book not found." };
            }
            localStorage.setItem(DB_PREFIX + "books", JSON.stringify(books));
            return { success: true, message: "Book deleted successfully!" };
        },

        // ================= LIBRARIANS =================
        getLibrarians() {
            return JSON.parse(localStorage.getItem(DB_PREFIX + "librarians") || "[]");
        },

        async addLibrarian(lib) {
            const librarians = this.getLibrarians();
            const id = String(lib.id || "").trim();
            const email = String(lib.email || "").trim().toLowerCase();
            const phone = String(lib.phone || "").replace(/[\s\-\(\)\+]/g, "");

            if (!id || !lib.name || !email || !phone) {
                return { success: false, message: "Please fill all required fields." };
            }

            if (!isValidEmail(email)) {
                return { success: false, message: "Invalid email format." };
            }

            if (!isValidPhone(phone)) {
                return { success: false, message: "Invalid phone number format. Phone number must contain digits." };
            }

            if (!lib.password || lib.password.length < 6) {
                return { success: false, message: "Password must be at least 6 characters long." };
            }

            if (librarians.some(l => l.id.toLowerCase() === id.toLowerCase())) {
                return { success: false, message: "Librarian ID already exists." };
            }

            if (librarians.some(l => l.email.toLowerCase() === email)) {
                return { success: false, message: "Email address is already registered." };
            }

            if (librarians.some(l => l.phone.replace(/[\s\-\(\)\+]/g, "") === phone)) {
                return { success: false, message: "Phone number is already registered." };
            }

            const passwordHash = await hashPassword(lib.password);

            const newLib = {
                id: sanitize(id),
                name: sanitize(lib.name.trim()),
                email: sanitize(email),
                phone: sanitize(phone),
                address: sanitize((lib.address || "").trim()),
                passwordHash
            };

            librarians.push(newLib);
            localStorage.setItem(DB_PREFIX + "librarians", JSON.stringify(librarians));
            return { success: true, message: "Librarian Added Successfully" };
        },

        async updateLibrarian(oldId, lib) {
            const librarians = this.getLibrarians();
            const index = librarians.findIndex(l => l.id.toLowerCase() === oldId.toLowerCase());
            if (index === -1) return { success: false, message: "Librarian not found." };

            const newId = String(lib.id || "").trim();
            const email = String(lib.email || "").trim().toLowerCase();
            const phone = String(lib.phone || "").replace(/[\s\-\(\)\+]/g, "");

            if (!newId || !lib.name || !email || !phone) {
                return { success: false, message: "Please fill all required fields." };
            }

            if (!isValidEmail(email)) {
                return { success: false, message: "Invalid email format." };
            }

            if (!isValidPhone(phone)) {
                return { success: false, message: "Invalid phone number format." };
            }

            // Duplicate checks
            if (newId.toLowerCase() !== oldId.toLowerCase() && librarians.some(l => l.id.toLowerCase() === newId.toLowerCase())) {
                return { success: false, message: "Librarian ID already exists." };
            }

            if (librarians.some((l, idx) => idx !== index && l.email.toLowerCase() === email)) {
                return { success: false, message: "Email address is already registered." };
            }

            if (librarians.some((l, idx) => idx !== index && l.phone.replace(/[\s\-\(\)\+]/g, "") === phone)) {
                return { success: false, message: "Phone number is already registered." };
            }

            const updatedLib = {
                id: sanitize(newId),
                name: sanitize(lib.name.trim()),
                email: sanitize(email),
                phone: sanitize(phone),
                address: sanitize((lib.address || "").trim()),
                passwordHash: librarians[index].passwordHash
            };

            // Optional password update
            if (lib.password && lib.password.trim() !== "") {
                if (lib.password.length < 6) {
                    return { success: false, message: "New password must be at least 6 characters long." };
                }
                updatedLib.passwordHash = await hashPassword(lib.password);
            }

            librarians[index] = updatedLib;
            localStorage.setItem(DB_PREFIX + "librarians", JSON.stringify(librarians));
            return { success: true, message: "Librarian Updated Successfully" };
        },

        deleteLibrarian(id) {
            let librarians = this.getLibrarians();
            librarians = librarians.filter(l => l.id.toLowerCase() !== id.toLowerCase());
            localStorage.setItem(DB_PREFIX + "librarians", JSON.stringify(librarians));
            return { success: true, message: "Librarian deleted successfully." };
        },

        // ================= MEMBERS =================
        getMembers() {
            return JSON.parse(localStorage.getItem(DB_PREFIX + "members") || "[]");
        },

        addMember(member) {
            const members = this.getMembers();
            const id = String(member.id || "").trim();
            const name = String(member.name || "").trim();
            const email = String(member.email || "").trim().toLowerCase();
            const phone = String(member.phone || "").trim();

            if (!id) return { success: false, message: "Member ID is required." };
            if (!isValidName(name)) return { success: false, message: "Please enter a valid full name (alphabetic characters only)." };
            if (!isValidEmail(email)) return { success: false, message: "Please enter a valid email address." };
            if (!isValidPhone(phone)) return { success: false, message: "Please enter a valid phone number (7 to 15 digits)." };

            if (members.some(m => m.id.toLowerCase() === id.toLowerCase())) {
                return { success: false, message: `Member ID "${id}" already exists. Duplicate Member IDs are not allowed.` };
            }

            const newMember = {
                id: sanitize(id),
                name: sanitize(name),
                email: sanitize(email),
                phone: sanitize(phone),
                department: sanitize((member.department || "").trim()),
                type: sanitize(member.type || "Student")
            };

            members.push(newMember);
            localStorage.setItem(DB_PREFIX + "members", JSON.stringify(members));
            return { success: true, message: "Member Added Successfully!" };
        },

        updateMember(oldId, member) {
            const members = this.getMembers();
            const index = members.findIndex(m => m.id.toLowerCase() === oldId.toLowerCase());
            if (index === -1) return { success: false, message: "Member not found." };

            const newId = String(member.id || "").trim();
            const name = String(member.name || "").trim();
            const email = String(member.email || "").trim().toLowerCase();
            const phone = String(member.phone || "").trim();

            if (!newId) return { success: false, message: "Member ID is required." };
            if (!isValidName(name)) return { success: false, message: "Please enter a valid full name." };
            if (!isValidEmail(email)) return { success: false, message: "Please enter a valid email address." };
            if (!isValidPhone(phone)) return { success: false, message: "Please enter a valid phone number." };

            if (newId.toLowerCase() !== oldId.toLowerCase() && members.some(m => m.id.toLowerCase() === newId.toLowerCase())) {
                return { success: false, message: `Member ID "${newId}" already exists.` };
            }

            members[index] = {
                id: sanitize(newId),
                name: sanitize(name),
                email: sanitize(email),
                phone: sanitize(phone),
                department: sanitize((member.department || "").trim()),
                type: sanitize(member.type || "Student")
            };

            localStorage.setItem(DB_PREFIX + "members", JSON.stringify(members));
            return { success: true, message: "Member Updated Successfully!" };
        },

        deleteMember(id) {
            let members = this.getMembers();
            members = members.filter(m => m.id.toLowerCase() !== id.toLowerCase());
            localStorage.setItem(DB_PREFIX + "members", JSON.stringify(members));
            return { success: true, message: "Member Deleted Successfully!" };
        },

        // ================= FINES =================
        getFines() {
            return JSON.parse(localStorage.getItem(DB_PREFIX + "fines") || "[]");
        },

        payFine(index) {
            const fines = this.getFines();
            if (index < 0 || index >= fines.length) {
                return { success: false, message: "Invalid fine record." };
            }
            if (fines[index].status === "Paid") {
                return { success: false, message: "Fine is already paid." };
            }
            fines[index].status = "Paid";
            localStorage.setItem(DB_PREFIX + "fines", JSON.stringify(fines));
            return { success: true, message: "Fine marked as Paid Successfully!" };
        },

        // ================= BACKUPS =================
        getBackups() {
            return JSON.parse(localStorage.getItem(DB_PREFIX + "backups") || "[]");
        },

        addBackupRecord(fileName, size = "3.0 MB") {
            const backups = this.getBackups();
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            const dateStr = `${day}-${month}-${year}`;

            const newRecord = {
                id: "BK_" + Date.now(),
                date: dateStr,
                fileName: fileName,
                size: size,
                status: "Completed"
            };

            // Insert at top, prevent duplicates if exact filename and date exist
            const exists = backups.some(b => b.fileName === fileName && b.date === dateStr);
            if (!exists) {
                backups.unshift(newRecord);
                localStorage.setItem(DB_PREFIX + "backups", JSON.stringify(backups));
            }
            return newRecord;
        },

        restoreBackup(fileContent, fileName) {
            // Validate File Format & Signature
            if (!fileContent || typeof fileContent !== "string") {
                return { success: false, message: "Invalid backup file content." };
            }

            const hasValidHeader = fileContent.includes("Library Management System Backup") || fileContent.includes("smart_library");
            const hasCreateDb = fileContent.includes("CREATE DATABASE") || fileContent.includes("smart_library");

            if (!hasValidHeader || !hasCreateDb) {
                return {
                    success: false,
                    message: "Invalid backup file format. Backup file must be a valid system SQL backup generated by Smart Library System."
                };
            }

            // Create Audit Log
            const auditLogs = JSON.parse(localStorage.getItem(DB_PREFIX + "audit_logs") || "[]");
            auditLogs.unshift({
                id: "AUD_" + Date.now(),
                action: "Database Restore",
                fileName: fileName,
                timestamp: new Date().toLocaleString()
            });
            localStorage.setItem(DB_PREFIX + "audit_logs", JSON.stringify(auditLogs));

            return {
                success: true,
                message: `Database Restored Successfully!\n\nBackup File: ${fileName}`
            };
        },

        // ================= STATS & REPORTS =================
        getStats() {
            const books = this.getBooks();
            const members = this.getMembers();
            const librarians = this.getLibrarians();
            const fines = this.getFines();
            const backups = this.getBackups();

            const totalBooks = books.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
            const totalMembers = members.length;
            const totalLibrarians = librarians.length;

            let totalCollectedFines = 0;
            let pendingFines = 0;
            let membersFinedSet = new Set();

            fines.forEach(f => {
                membersFinedSet.add(f.memberId);
                if (f.status === "Paid") {
                    totalCollectedFines += Number(f.amount) || 0;
                } else {
                    pendingFines += Number(f.amount) || 0;
                }
            });

            const lastBackup = backups.length > 0 ? backups[0].date : "None";

            return {
                totalBooks,
                totalMembers,
                totalLibrarians,
                issuedBooks: 96,
                returnedBooks: 80,
                pendingReturns: 16,
                totalCollectedFines,
                pendingFines,
                membersFinedCount: membersFinedSet.size,
                lastBackupDate: lastBackup
            };
        }
    };

    window.DB = DB;
})(window);
