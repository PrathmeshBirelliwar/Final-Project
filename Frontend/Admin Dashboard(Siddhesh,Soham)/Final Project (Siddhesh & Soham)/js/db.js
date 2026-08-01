/**
 * Smart Library Management System - API Client (js/db.js)
 * Talks to the real Library Hub backend (Node/Express + MySQL) instead of localStorage.
 * Keeps the same method names the rest of the admin dashboard already calls, so the
 * HTML pages barely needed to change — just add `await window.DB.ready()` before reading
 * cached data, and `await` the mutator calls (addBook, addMember, ...).
 */
(function (window) {
    const API_BASE = window.LIBRARY_API_BASE || "http://localhost:5000/api";
    const SESSION_KEY = "smart_library_session";

    // In-memory cache populated by ready(); getBooks()/getMembers()/etc. read from here
    // so the rest of the app can keep calling them synchronously, like before.
    const cache = { books: [], members: [], librarians: [], fines: [], backups: [], stats: null };
    let readyPromise = null;

    function getSession() {
        const raw = sessionStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    }

    function getToken() {
        const s = getSession();
        return s ? s.token : null;
    }

    async function apiFetch(path, options = {}) {
        const token = getToken();
        const headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
        if (token) headers["Authorization"] = "Bearer " + token;
        try {
            const res = await fetch(`${API_BASE}${path}`, Object.assign({}, options, { headers }));
            let data;
            try { data = await res.json(); } catch (_) { data = {}; }
            if (typeof data.success === "undefined") data.success = res.ok;
            return data;
        } catch (err) {
            console.error("Network error calling", path, err);
            return { success: false, message: "Could not reach the server. Please check your connection and that the backend is running." };
        }
    }

    async function refreshCache() {
        if (!getToken()) return;
        const [booksRes, membersRes, librariansRes, finesRes, backupsRes, statsRes] = await Promise.all([
            apiFetch("/books"),
            apiFetch("/members"),
            apiFetch("/librarians"),
            apiFetch("/fines"),
            apiFetch("/backups"),
            apiFetch("/stats/admin"),
        ]);
        if (booksRes.success) cache.books = booksRes.books;
        if (membersRes.success) cache.members = membersRes.members;
        if (librariansRes.success) cache.librarians = librariansRes.librarians;
        if (finesRes.success) cache.fines = finesRes.fines;
        if (backupsRes.success) cache.backups = backupsRes.backups;
        if (statsRes.success) cache.stats = statsRes.stats;
    }

    // ---- Validation helpers (kept client-side for instant feedback; the server re-validates too) ----
    function sanitize(str) {
        if (typeof str !== "string") return str;
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
    function isValidEmail(email) { return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(email).trim().toLowerCase()); }
    function isValidPhone(phone) { return /^\d{7,15}$/.test(String(phone).replace(/[\s\-()+]/g, "")); }
    function isValidName(name) { const t = String(name).trim(); return t.length >= 2 && /^[a-zA-Z\s.'-]+$/.test(t); }

    const DB = {
        sanitize, isValidEmail, isValidPhone, isValidName,

        // Resolves once the initial data pull from the backend has completed.
        // Call `await window.DB.ready()` at the top of any page that reads getBooks()/getMembers()/etc.
        ready() {
            if (!readyPromise) readyPromise = refreshCache();
            return readyPromise;
        },

        async refresh() {
            readyPromise = refreshCache();
            return readyPromise;
        },

        // ================= AUTH =================
        async login(username, password) {
            let res = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({ identifier: username, password, role: "Admin" }),
            });
            if (!res.success) {
                res = await apiFetch("/auth/login", {
                    method: "POST",
                    body: JSON.stringify({ identifier: username, password, role: "Librarian" }),
                });
            }
            if (res.success) {
                const session = {
                    username: res.user.username || res.user.name,
                    role: res.user.role,
                    token: res.token,
                    loginTime: Date.now(),
                };
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
                readyPromise = null; // force a fresh pull now that we're authenticated
                await DB.ready();
                return { success: true, session };
            }
            return { success: false, message: res.message || "Invalid Username or Password" };
        },

        getCurrentSession() {
            return getSession();
        },

        logout() {
            sessionStorage.removeItem(SESSION_KEY);
            readyPromise = null;
        },

        // Email-based password reset requires an outbound email service, which this
        // deployment doesn't have configured. Kept as a clear, honest message instead
        // of pretending it works.
        async requestPasswordReset(email) {
            if (!isValidEmail(email)) return { success: false, message: "Please enter a valid email address." };
            return {
                success: false,
                message: "Self-service password reset by email isn't set up on this server yet. Please ask another administrator to reset your password, or sign in and use Change Password from your account settings.",
            };
        },

        async resetPassword() {
            return { success: false, message: "Self-service password reset isn't available yet. Please contact another administrator." };
        },

        async changePassword(currentPassword, newPassword) {
            return apiFetch("/auth/change-password", {
                method: "POST",
                body: JSON.stringify({ currentPassword, newPassword }),
            });
        },

        // ================= BOOKS =================
        getBooks() { return cache.books; },

        async addBook(book) {
            const res = await apiFetch("/books", {
                method: "POST",
                body: JSON.stringify({
                    id: book.id, name: book.name, author: book.author, category: book.category,
                    publisher: book.publisher, quantity: Number(book.quantity),
                }),
            });
            if (res.success) await DB.refresh();
            return res;
        },

        async updateBook(oldId, book) {
            const res = await apiFetch(`/books/${encodeURIComponent(oldId)}`, {
                method: "PUT",
                body: JSON.stringify({
                    name: book.name, author: book.author, category: book.category,
                    publisher: book.publisher, quantity: Number(book.quantity),
                }),
            });
            if (res.success) await DB.refresh();
            return res;
        },

        async deleteBook(id) {
            const res = await apiFetch(`/books/${encodeURIComponent(id)}`, { method: "DELETE" });
            if (res.success) await DB.refresh();
            return res;
        },

        // ================= LIBRARIANS =================
        getLibrarians() { return cache.librarians; },

        async addLibrarian(lib) {
            const res = await apiFetch("/librarians", {
                method: "POST",
                body: JSON.stringify(lib),
            });
            if (res.success) await DB.refresh();
            return res;
        },

        async updateLibrarian(oldId, lib) {
            const res = await apiFetch(`/librarians/${encodeURIComponent(oldId)}`, {
                method: "PUT",
                body: JSON.stringify(lib),
            });
            if (res.success) await DB.refresh();
            return res;
        },

        async deleteLibrarian(id) {
            const res = await apiFetch(`/librarians/${encodeURIComponent(id)}`, { method: "DELETE" });
            if (res.success) await DB.refresh();
            return res;
        },

        // ================= MEMBERS =================
        getMembers() { return cache.members; },

        async addMember(member) {
            const res = await apiFetch("/members", { method: "POST", body: JSON.stringify(member) });
            if (res.success) await DB.refresh();
            return res;
        },

        async updateMember(oldId, member) {
            const res = await apiFetch(`/members/${encodeURIComponent(oldId)}`, { method: "PUT", body: JSON.stringify(member) });
            if (res.success) await DB.refresh();
            return res;
        },

        async deleteMember(id) {
            const res = await apiFetch(`/members/${encodeURIComponent(id)}`, { method: "DELETE" });
            if (res.success) await DB.refresh();
            return res;
        },

        // ================= FINES =================
        getFines() { return cache.fines; },

        async payFine(index) {
            const fine = cache.fines[index];
            if (!fine) return { success: false, message: "Invalid fine record." };
            const res = await apiFetch(`/fines/${fine.issueId}/pay`, { method: "POST" });
            if (res.success) await DB.refresh();
            return res;
        },

        // ================= BACKUPS =================
        getBackups() { return cache.backups; },

        // Triggers a real `mysqldump` on the server and returns the record; the caller
        // (backup.html) then downloads the file from /api/backups/:id/download.
        async createBackup() {
            const res = await apiFetch("/backups", { method: "POST" });
            if (res.success) await DB.refresh();
            return res;
        },

        downloadBackupUrl(id) {
            return `${API_BASE}/backups/${encodeURIComponent(id)}/download`;
        },

        async restoreBackup(fileContent, fileName) {
            if (!fileContent || typeof fileContent !== "string") {
                return { success: false, message: "Invalid backup file content." };
            }
            const looksLikeSql = fileContent.includes("CREATE") || fileContent.includes("INSERT") || fileContent.includes("library_hub");
            if (!looksLikeSql) {
                return { success: false, message: "Invalid backup file format. Please upload a valid .sql backup file." };
            }
            return apiFetch("/backups/restore-log", { method: "POST", body: JSON.stringify({ fileName }) });
        },

        // ================= STATS =================
        getStats() {
            return cache.stats || {
                totalBooks: 0, totalMembers: 0, totalLibrarians: 0, issuedBooks: 0, returnedBooks: 0,
                pendingReturns: 0, totalCollectedFines: 0, pendingFines: 0, membersFinedCount: 0, lastBackupDate: "None",
            };
        },

        async getMonthlyReport() {
            const res = await apiFetch("/stats/monthly");
            return res.success ? res.months : [];
        },
    };

    window.DB = DB;
})(window);
