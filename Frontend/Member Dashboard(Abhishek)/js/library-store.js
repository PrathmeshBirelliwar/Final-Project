/* Member-scoped data + session, backed by the real Library Hub backend. */
(function () {
    const API_BASE = window.LIBRARY_API_BASE || "http://localhost:5000/api";
    const SESSION_KEY = "library_member_session";
    let DAILY_FINE_RATE = 5; // fallback until /api/settings responds
    apiFetch("/settings").then(res => { if (res.success) DAILY_FINE_RATE = res.settings.finePerDay; });

    const cache = { loans: [], history: [], reservations: [], fines: [], notifications: [], profile: {} };
    let readyPromise = null;

    function getSession() {
        try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch (_) { return null; }
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

    const today = () => new Date().toISOString().slice(0, 10);
    const dateLabel = value => value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";

    async function refreshCache() {
        if (!getToken()) return;
        const [loansRes, historyRes, reservationsRes, finesRes, notifRes, profileRes] = await Promise.all([
            apiFetch("/issues/mine"),
            apiFetch("/issues/history/mine"),
            apiFetch("/reservations/mine"),
            apiFetch("/fines/mine"),
            apiFetch("/notifications/mine"),
            apiFetch(`/members/${getSession().id}/profile`),
        ]);
        if (loansRes.success) cache.loans = loansRes.issues.map(i => ({
            id: i.id, bookId: i.bookId, title: i.bookTitle, author: i.bookAuthor, image: i.bookImage,
            borrowedDate: i.borrowedDate, dueDate: i.dueDate, status: "Active", renewals: i.renewals,
        }));
        if (historyRes.success) cache.history = historyRes.history.map(i => ({
            id: i.id, bookId: i.bookId, title: i.bookTitle, author: i.bookAuthor,
            borrowedDate: i.borrowedDate, dueDate: i.dueDate, returnedDate: i.returnedDate,
            fineAmount: i.fineAmount, status: "Returned",
        }));
        if (reservationsRes.success) cache.reservations = reservationsRes.reservations.map(r => ({
            id: r.id, bookId: r.bookId, reservedDate: r.reservedDate, status: r.status,
        }));
        if (finesRes.success) cache.fines = finesRes.fines.map(f => ({
            id: f.issueId, issueId: f.issueId, bookId: f.bookId, book: f.book, amount: f.amount,
            status: f.status, createdDate: f.createdDate,
        }));
        if (notifRes.success) cache.notifications = notifRes.notifications;
        if (profileRes.success) cache.profile = profileRes.member;
    }

    const Store = {
        dateLabel, today, currentMemberId: () => (getSession() || {}).id,
        get DAILY_FINE_RATE() { return DAILY_FINE_RATE; },

        ready() {
            if (!readyPromise) readyPromise = refreshCache();
            return readyPromise;
        },
        refresh() {
            readyPromise = refreshCache();
            return readyPromise;
        },

        // ---- Auth ----
        isLoggedIn() { return !!getToken(); },
        getSession,
        async login(email, password) {
            const res = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ identifier: email, password, role: "Member" }) });
            if (res.success) {
                sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: res.user.id, name: res.user.name, email: res.user.email, token: res.token }));
            }
            return res;
        },
        async register(name, email, password, phone) {
            const res = await apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password, phone }) });
            if (res.success) {
                sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: res.user.id, name: res.user.name, email: res.user.email, token: res.token }));
            }
            return res;
        },
        logout() { sessionStorage.removeItem(SESSION_KEY); },
        async changePassword(currentPassword, newPassword) {
            return apiFetch("/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
        },

        // ---- Reads (from cache; call ready() first) ----
        getAvailableCopies(bookId) {
            const book = window.LibraryCatalog.getById(bookId);
            return book ? book.availableCopies : 0;
        },
        getBorrowedBooks() { return cache.loans; },
        getHistory() { return cache.history; },
        getReservations() { return cache.reservations; },
        getFines() { return cache.fines; },
        getNotifications() { return cache.notifications; },
        getProfile() { return cache.profile || {}; },

        // ---- Mutations (call the real backend, then refresh the cache) ----
        async borrowBook(bookId) {
            const res = await apiFetch("/issues", { method: "POST", body: JSON.stringify({ bookId }) });
            if (res.success) { await Store.refresh(); await window.LibraryCatalog.refresh(); }
            return { ok: res.success, message: res.message };
        },
        async renewLoan(loanId) {
            const res = await apiFetch(`/issues/${loanId}/renew`, { method: "POST" });
            if (res.success) await Store.refresh();
            return { ok: res.success, message: res.message };
        },
        async returnLoan(loanId) {
            const res = await apiFetch(`/issues/${loanId}/return`, { method: "POST" });
            if (res.success) { await Store.refresh(); await window.LibraryCatalog.refresh(); }
            return { ok: res.success, message: res.message, historyItem: { fineAmount: res.fineAmount || 0 } };
        },
        async reserveBook(bookId) {
            const res = await apiFetch("/reservations", { method: "POST", body: JSON.stringify({ bookId }) });
            if (res.success) await Store.refresh();
            return { ok: res.success, message: res.message };
        },
        async cancelReservation(id) {
            const res = await apiFetch(`/reservations/${id}/cancel`, { method: "PUT" });
            if (res.success) await Store.refresh();
            return { ok: res.success, message: res.message };
        },
        async payFine(issueId) {
            const res = await apiFetch(`/fines/${issueId}/pay`, { method: "POST" });
            if (res.success) await Store.refresh();
            return { ok: res.success, message: res.message };
        },
        async saveProfile(profile) {
            const session = getSession();
            const res = await apiFetch(`/members/${session.id}/profile`, { method: "PUT", body: JSON.stringify(profile) });
            if (res.success) await Store.refresh();
            return { ok: res.success, message: res.message };
        },
        async markAllNotificationsRead() {
            const res = await apiFetch("/notifications/mark-all-read", { method: "PUT" });
            if (res.success) await Store.refresh();
            return res;
        },
    };

    window.LibraryStore = Store;
}());
