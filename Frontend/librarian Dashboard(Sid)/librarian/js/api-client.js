/**
 * Librarian Dashboard - API Client (js/api-client.js)
 * Talks to the real Library Hub backend (Node/Express + MySQL).
 * Exposed as `window.LibAPI`. Session is a JWT stored in sessionStorage.
 */
(function (window) {
    const API_BASE = window.LIBRARY_API_BASE || "http://localhost:5000/api";
    const SESSION_KEY = "librarian_session";

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

    // Maps a backend book to the field names the librarian pages already use (id, name, author, category, quantity)
    function mapBook(b) {
        return { id: b.id, name: b.title, author: b.author, category: b.category, publisher: b.publisher, isbn: b.isbn, quantity: b.availableCopies, totalQuantity: b.totalCopies };
    }
    // Maps a backend member to the "student" shape the librarian pages use (id, name, course, year, phone, email)
    function mapStudent(m) {
        return { id: m.id, name: m.name, course: m.department || "", year: m.type || "", phone: m.phone, email: m.email };
    }
    function mapIssue(i) {
        return {
            issueId: i.id, studentId: i.memberId, studentName: i.memberName, bookId: i.bookId, bookName: i.bookTitle,
            issueDate: i.issueDate, returnDate: i.dueDate, status: i.status === "Active" ? "Issued" : i.status,
            actualReturnDate: i.returnDate, fine: i.fineAmount,
        };
    }
    function mapFine(f) {
        return { fineId: f.issueId, issueId: f.issueId, studentId: f.memberId, studentName: f.memberName, bookId: f.bookId, bookName: f.book, fineAmount: f.amount, status: f.status, lateDays: undefined };
    }

    const LibAPI = {
        SESSION_KEY,
        getSession,
        isLoggedIn() { return !!getToken(); },

        async login(identifier, password) {
            const res = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({ identifier, password, role: "Librarian" }),
            });
            if (res.success) {
                sessionStorage.setItem(SESSION_KEY, JSON.stringify({
                    id: res.user.id, name: res.user.name, email: res.user.email, token: res.token,
                }));
            }
            return res;
        },

        logout() {
            sessionStorage.removeItem(SESSION_KEY);
        },

        // ---- Books ----
        async getBooks() {
            const res = await apiFetch("/books");
            return res.success ? res.books.map(mapBook) : [];
        },
        async addBook(book) {
            return apiFetch("/books", {
                method: "POST",
                body: JSON.stringify({ name: book.name, author: book.author, category: book.category, isbn: book.isbn, quantity: Number(book.quantity) }),
            });
        },
        async updateBook(id, book) {
            return apiFetch(`/books/${encodeURIComponent(id)}`, {
                method: "PUT",
                body: JSON.stringify({ name: book.name, author: book.author, category: book.category, isbn: book.isbn, quantity: Number(book.quantity) }),
            });
        },
        async deleteBook(id) {
            return apiFetch(`/books/${encodeURIComponent(id)}`, { method: "DELETE" });
        },

        // ---- Students / Members ----
        async getStudents() {
            const res = await apiFetch("/members");
            return res.success ? res.members.map(mapStudent) : [];
        },
        async addStudent(student) {
            return apiFetch("/members", {
                method: "POST",
                body: JSON.stringify({ id: student.id, name: student.name, email: student.email, phone: student.phone, department: student.course, type: "Student" }),
            });
        },
        async updateStudent(id, student) {
            return apiFetch(`/members/${encodeURIComponent(id)}`, {
                method: "PUT",
                body: JSON.stringify({ name: student.name, email: student.email, phone: student.phone, department: student.course }),
            });
        },
        async deleteStudent(id) {
            return apiFetch(`/members/${encodeURIComponent(id)}`, { method: "DELETE" });
        },

        // ---- Issues (borrow/return) ----
        async getIssues() {
            const res = await apiFetch("/issues");
            return res.success ? res.issues.map(mapIssue) : [];
        },
        async issueBook(bookId, memberId) {
            return apiFetch("/issues", { method: "POST", body: JSON.stringify({ bookId, memberId }) });
        },
        async returnBook(issueId) {
            return apiFetch(`/issues/${issueId}/return`, { method: "POST" });
        },

        // ---- Fines ----
        async getFines() {
            const res = await apiFetch("/fines");
            return res.success ? res.fines.map(mapFine) : [];
        },
        async payFine(issueId) {
            return apiFetch(`/fines/${issueId}/pay`, { method: "POST" });
        },

        // ---- Stats ----
        async getStats() {
            const res = await apiFetch("/stats/librarian");
            return res.success ? res.stats : { totalBooks: 0, totalStudents: 0, issuedToday: 0, dueToday: 0, overdue: 0, pendingFines: 0 };
        },

        async updateMyProfile(name, phone) {
            const res = await apiFetch("/librarians/me", { method: "PUT", body: JSON.stringify({ name, phone }) });
            if (res.success) {
                const session = getSession();
                if (session) {
                    session.name = name || session.name;
                    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
                }
            }
            return res;
        },
    };

    window.LibAPI = LibAPI;
})(window);
