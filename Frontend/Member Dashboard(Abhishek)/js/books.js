(function () {
    let activeCategory = "all";
    let searchQuery = "";

    function getBooks() {
        return LibraryCatalog.all();
    }

    function slugify(text) {
        return String(text || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }

    function matches(book) {
        const query = searchQuery.trim().toLowerCase();
        const matchesQuery = !query || [book.title, book.author, book.isbn, book.category, book.categoryLabel]
            .filter(Boolean).some(value => value.toLowerCase().includes(query));
        return matchesQuery && (activeCategory === "all" || slugify(book.category) === activeCategory);
    }

    function renderBooks() {
        const grid = document.getElementById("booksGrid");
        const emptyState = document.getElementById("booksEmptyState");
        if (!grid) return;
        const books = getBooks().filter(matches);
        grid.innerHTML = books.map(book => {
            const available = book.availableCopies > 0;
            return `<article class="book-card" data-book-id="${book.id}">
                <div class="book-image"><img src="${book.image}" alt="${book.title}"><span class="category">${book.categoryLabel}</span></div>
                <div class="book-content"><h3>${book.title}</h3><p class="author">By ${book.author}</p>
                <div class="book-status"><span class="${available ? "available" : "unavailable"}">${available ? `${book.availableCopies} ${book.availableCopies === 1 ? "copy" : "copies"} available` : "Currently Unavailable"}</span></div>
                <button class="view-button" type="button" data-book-id="${book.id}">View Details</button></div></article>`;
        }).join("");
        if (emptyState) emptyState.hidden = books.length !== 0;
    }

    function openDetails(id) {
        window.location.href = `book-details.html?book=${encodeURIComponent(id)}`;
    }

    document.addEventListener("DOMContentLoaded", async () => {
        await LibraryCatalog.ready();
        if (window.LibraryStore) await LibraryStore.ready();

        const searchInput = document.getElementById("bookSearch");
        const grid = document.getElementById("booksGrid");

        // Support a search prefilled from the header search box on the librarian-style dashboard link
        const prefill = new URLSearchParams(window.location.search).get("q");
        if (prefill && searchInput) { searchInput.value = prefill; searchQuery = prefill; }

        if (searchInput) searchInput.addEventListener("input", event => {
            searchQuery = event.target.value;
            renderBooks();
        });
        document.querySelectorAll(".filter-btn[data-category]").forEach(button => {
            button.addEventListener("click", () => {
                activeCategory = button.dataset.category;
                document.querySelectorAll(".filter-btn").forEach(item => item.classList.toggle("active", item === button));
                renderBooks();
            });
        });
        if (grid) grid.addEventListener("click", event => {
            const button = event.target.closest(".view-button[data-book-id]");
            if (button) openDetails(button.dataset.bookId);
        });
        renderBooks();
    });
}());
