(function () {
    function selectedBook() {
        return LibraryCatalog.getById(new URLSearchParams(window.location.search).get("book"));
    }

    function renderNotFound() {
        const container = document.querySelector(".book-details-page");
        if (container) container.innerHTML = '<div class="empty-state" style="display:block"><div class="empty-icon"><i class="fa-solid fa-book"></i></div><h1>Book Not Found</h1><p>The requested book is not in the catalog.</p><a href="books.html" class="browse-btn">Browse Books</a></div>';
    }

    function renderBookDetails() {
        const book = selectedBook();
        if (!book) { renderNotFound(); return; }

        const availableCopies = book.availableCopies;
        const set = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = value; };
        const image = document.getElementById("bookImage");
        if (image) { image.src = book.image; image.alt = book.title; }

        set("bookCategory", (book.categoryLabel || "").toUpperCase());
        set("bookTitle", book.title);
        set("bookAuthor", book.author);
        set("bookDescription", book.description);
        set("bookISBN", book.isbn);
        set("bookPublished", book.published);
        set("bookPublisher", book.publisher);
        set("bookPages", `${book.pages || "?"} Pages`);
        set("breadcrumbTitle", book.title);

        const rating = document.querySelector(".book-rating > span");
        if (rating) rating.textContent = book.rating;
        const reviews = document.querySelector(".review-count");
        if (reviews) reviews.textContent = `(${book.reviews})`;

        const info = document.querySelectorAll(".library-info-list strong");
        [book.location, book.shelf, `${book.totalCopies} Copies`, `${availableCopies} Copies`].forEach((value, index) => {
            if (info[index]) info[index].textContent = value;
        });

        set("availabilityTitle", availableCopies > 0 ? "Available for Borrowing" : "Currently Unavailable");
        set("availabilityText", availableCopies > 0
            ? `${availableCopies} ${availableCopies === 1 ? "copy" : "copies"} available in the library.`
            : "This book is currently unavailable for borrowing.");

        const borrow = document.getElementById("borrowButton");
        const reserve = document.getElementById("reserveButton");
        if (borrow) borrow.hidden = availableCopies < 1;
        if (reserve) reserve.hidden = availableCopies > 0;
    }

    async function borrow() {
        const book = selectedBook();
        if (!book) return;
        const borrowBtn = document.getElementById("borrowButton");
        if (borrowBtn) borrowBtn.disabled = true;

        const result = await LibraryStore.borrowBook(book.id);

        if (borrowBtn) borrowBtn.disabled = false;
        alert(result.ok ? `"${book.title}" was borrowed successfully.` : result.message);
        if (result.ok) window.location.href = "borrowed-books.html";
        else renderBookDetails();
    }

    async function reserve() {
        const book = selectedBook();
        if (!book) return;
        const reserveBtn = document.getElementById("reserveButton");
        if (reserveBtn) reserveBtn.disabled = true;

        const result = await LibraryStore.reserveBook(book.id);

        if (reserveBtn) reserveBtn.disabled = false;
        alert(result.ok ? `Reservation placed for "${book.title}".` : result.message);
    }

    document.addEventListener("DOMContentLoaded", async () => {
        await Promise.all([window.LibraryCatalog.ready(), window.LibraryStore.ready()]);
        renderBookDetails();
        document.getElementById("borrowButton")?.addEventListener("click", borrow);
        document.getElementById("reserveButton")?.addEventListener("click", reserve);
    });
}());
