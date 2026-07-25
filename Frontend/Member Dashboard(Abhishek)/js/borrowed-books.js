let borrowedBooks = LibraryStore.getBorrowedBooks();
let currentFilter = "all";

// Legacy rendering functions remain for backwards compatibility; the scoped renderer below owns this page.

function daysUntilDue(book) {
    const due = new Date(book.dueDateISO || book.dueDate);
    if (Number.isNaN(due.getTime())) return 99;
    return Math.ceil((due.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
}

function getBookStatus(book) {
    const days = daysUntilDue(book);
    if (days < 0) return "Overdue";
    if (days <= 3) return "Due Soon";
    return "On Time";
}

function displayBorrowedBooks() {
    const container = document.getElementById("borrowedBooksList");
    const emptyState = document.getElementById("emptyState");
    const searchValue = document.getElementById("borrowSearch").value.toLowerCase();
    let visibleBooks = borrowedBooks.filter(book => book.title.toLowerCase().includes(searchValue));
    if (currentFilter === "due") visibleBooks = visibleBooks.filter(book => getBookStatus(book) === "Due Soon");
    if (currentFilter === "overdue") visibleBooks = visibleBooks.filter(book => getBookStatus(book) === "Overdue");

    container.innerHTML = "";
    emptyState.style.display = visibleBooks.length ? "none" : "block";
    visibleBooks.forEach(book => {
        const status = getBookStatus(book);
        const card = document.createElement("div");
        card.className = "borrowed-book-card";
        card.innerHTML = `
            <div class="book-mini-cover">${book.image ? `<img src="${book.image}" alt="">` : '<i class="fa-solid fa-book"></i>'}</div>
            <div class="book-info"><h3>${book.title}</h3><p>By ${book.author}</p>
                <div class="book-dates"><div class="date-item"><span>Borrowed On</span><strong>${book.borrowedDate}</strong></div>
                <div class="date-item"><span>Due Date</span><strong class="due-date">${book.dueDate}</strong></div></div></div>
            <div class="book-actions"><span class="status-badge ${status.toLowerCase().replace(" ", "-")}">${status}</span>
                <div class="action-buttons"><button class="renew-btn" onclick="renewBook('${book.id}')"><i class="fa-solid fa-rotate"></i> Renew</button>
                <button class="return-btn" onclick="returnBook('${book.id}')"><i class="fa-solid fa-check"></i> Return</button></div></div>`;
        container.appendChild(card);
    });
}

function updateSummary() {
    document.getElementById("totalBorrowed").textContent = borrowedBooks.length;
    document.getElementById("dueSoon").textContent = borrowedBooks.filter(book => getBookStatus(book) === "Due Soon").length;
    document.getElementById("onTime").textContent = borrowedBooks.filter(book => getBookStatus(book) === "On Time").length;
}

function filterBooks(filter, button) {
    currentFilter = filter;
    document.querySelectorAll(".filter-tab").forEach(tab => tab.classList.remove("active"));
    button.classList.add("active");
    displayBorrowedBooks();
}

function searchBorrowedBooks() { displayBorrowedBooks(); }

function renewBook(id) {
    const book = borrowedBooks.find(item => item.id === id);
    if (!book || !confirm(`Do you want to renew "${book.title}" for another 14 days?`)) return;
    const baseDate = new Date(book.dueDateISO || Date.now());
    baseDate.setDate(baseDate.getDate() + 14);
    book.dueDateISO = baseDate.toISOString();
    book.dueDate = baseDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    LibraryStore.saveBorrowedBooks(borrowedBooks);
    displayBorrowedBooks(); updateSummary();
}

function returnBook(id) {
    const book = borrowedBooks.find(item => item.id === id);
    if (!book || !confirm(`Are you sure you want to return "${book.title}"?`)) return;
    const history = LibraryStore.getHistory();
    history.push({ ...book, returnedDate: new Date().toLocaleDateString("en-GB"), status: "Returned" });
    LibraryStore.saveHistory(history);
    borrowedBooks = borrowedBooks.filter(item => item.id !== id);
    LibraryStore.saveBorrowedBooks(borrowedBooks);
    alert(`"${book.title}" has been returned successfully.`);
    displayBorrowedBooks(); updateSummary();
}

// Member-scoped loan UI. This uses stable loan and book IDs instead of titles.
(function () {
    let activeFilter = "all";
    const daysUntil = dueDate => Math.ceil((new Date(`${dueDate}T00:00:00`) - new Date(`${LibraryStore.today()}T00:00:00`)) / 86400000);
    const loanStatus = loan => daysUntil(loan.dueDate) < 0 ? "Overdue" : daysUntil(loan.dueDate) <= 3 ? "Due Soon" : "On Time";
    function renderScopedLoans() {
        const loans = LibraryStore.getBorrowedBooks(), query = document.getElementById("borrowSearch")?.value.trim().toLowerCase() || "";
        const visible = loans.filter(loan => { const book = LibraryCatalog.getById(loan.bookId); const state = loanStatus(loan); return book && book.title.toLowerCase().includes(query) && (activeFilter === "all" || (activeFilter === "due" && state === "Due Soon") || (activeFilter === "overdue" && state === "Overdue")); });
        const list = document.getElementById("borrowedBooksList"), empty = document.getElementById("emptyState"); if (!list) return;
        list.innerHTML = visible.map(loan => { const book = LibraryCatalog.getById(loan.bookId), state = loanStatus(loan), className = state.toLowerCase().replace(" ", "-"); return `<article class="borrowed-book-card"><div class="book-mini-cover"><img src="${book.image}" alt=""></div><div class="book-info"><h3>${book.title}</h3><p>By ${book.author}</p><div class="book-dates"><div class="date-item"><span>Borrowed On</span><strong>${LibraryStore.dateLabel(loan.borrowedDate)}</strong></div><div class="date-item"><span>Due Date</span><strong class="due-date">${LibraryStore.dateLabel(loan.dueDate)}</strong></div></div></div><div class="book-actions"><span class="status-badge ${className}">${state}</span><div class="action-buttons"><button class="renew-btn" type="button" data-action="renew" data-loan-id="${loan.id}">Renew</button><button class="return-btn" type="button" data-action="return" data-loan-id="${loan.id}">Return</button></div></div></article>`; }).join("");
        empty.style.display = visible.length ? "none" : "block";
        document.getElementById("totalBorrowed").textContent = loans.length;
        document.getElementById("dueSoon").textContent = loans.filter(loan => loanStatus(loan) === "Due Soon").length;
        document.getElementById("onTime").textContent = loans.filter(loan => loanStatus(loan) === "On Time").length;
    }
    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("borrowSearch")?.addEventListener("input", renderScopedLoans);
        document.querySelectorAll(".filter-tab[data-filter]").forEach(button => button.addEventListener("click", () => { activeFilter = button.dataset.filter; document.querySelectorAll(".filter-tab").forEach(item => item.classList.toggle("active", item === button)); renderScopedLoans(); }));
        document.getElementById("borrowedBooksList")?.addEventListener("click", event => { const button = event.target.closest("button[data-loan-id]"); if (!button) return; const result = button.dataset.action === "renew" ? LibraryStore.renewLoan(button.dataset.loanId) : LibraryStore.returnLoan(button.dataset.loanId); alert(result.ok ? (button.dataset.action === "renew" ? "Book renewed successfully." : `Book returned successfully.${result.historyItem.fineAmount ? ` Fine created: ₹${result.historyItem.fineAmount}.` : ""}`) : result.message); renderScopedLoans(); });
        renderScopedLoans();
    });
}());
