/* Canonical catalog shared by every member-facing page — now sourced from the real backend. */
(function () {
    const API_BASE = window.LIBRARY_API_BASE || "http://localhost:5000/api";
    let cache = [];
    let readyPromise = null;

    async function fetchCatalog() {
        try {
            const res = await fetch(`${API_BASE}/books`);
            const data = await res.json();
            if (data.success) cache = data.books;
        } catch (err) {
            console.error("Failed to load book catalog:", err);
        }
    }

    async function fetchDigital() {
        try {
            const res = await fetch(`${API_BASE}/books?digital=true`);
            const data = await res.json();
            return data.success ? data.books : [];
        } catch (err) {
            console.error("Failed to load digital resources:", err);
            return [];
        }
    }

    window.LibraryCatalog = {
        // Resolves once the catalog has been fetched at least once.
        ready() {
            if (!readyPromise) readyPromise = fetchCatalog();
            return readyPromise;
        },
        refresh() {
            readyPromise = fetchCatalog();
            return readyPromise;
        },
        all: () => cache.map(book => ({ ...book })),
        getById: id => cache.find(book => book.id === id) || null,
        getByTitle: title => cache.find(book => book.title === title) || null,
        getDigitalResources: fetchDigital,
    };
}());
