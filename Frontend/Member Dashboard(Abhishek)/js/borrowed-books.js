// Member-scoped loan UI, backed by the real backend. Uses stable loan and book IDs.
(function () {
    let activeFilter = "all";

    const daysUntil = dueDate => Math.ceil((new Date(`${dueDate}T00:00:00`) - new Date(`${LibraryStore.today()}T00:00:00`)) / 86400000);
    const loanStatus = loan => daysUntil(loan.dueDate) < 0 ? "Overdue" : daysUntil(loan.dueDate) <= 3 ? "Due Soon" : "On Time";

    function renderLoans() {
        const loans = LibraryStore.getBorrowedBooks();
        const query = document.getElementById("borrowSearch")?.value.trim().toLowerCase() || "";

        const visible = loans.filter(loan => {
            const book = LibraryCatalog.getById(loan.bookId) || { title: loan.title || "" };
            const state = loanStatus(loan);
            return book.title.toLowerCase().includes(query) &&
                (activeFilter === "all" ||
                    (activeFilter === "due" && state === "Due Soon") ||
                    (activeFilter === "overdue" && state === "Overdue"));
        });

        const list = document.getElementById("borrowedBooksList");
        const empty = document.getElementById("emptyState");
        if (!list) return;

        list.innerHTML = visible.map(loan => {
            const book = LibraryCatalog.getById(loan.bookId) || { title: loan.title, author: loan.author, image: loan.image };
            const state = loanStatus(loan);
            const className = state.toLowerCase().replace(" ", "-");
            return `<article class="borrowed-book-card">
                <div class="book-mini-cover"><img src="${book.image}" alt=""></div>
                <div class="book-info"><h3>${book.title}</h3><p>By ${book.author}</p>
                    <div class="book-dates">
                        <div class="date-item"><span>Borrowed On</span><strong>${LibraryStore.dateLabel(loan.borrowedDate)}</strong></div>
                        <div class="date-item"><span>Due Date</span><strong class="due-date">${LibraryStore.dateLabel(loan.dueDate)}</strong></div>
                    </div>
                </div>
                <div class="book-actions">
                    <span class="status-badge ${className}">${state}</span>
                    <div class="action-buttons">
                       
                        <button class="return-btn" type="button" data-action="return" data-loan-id="${loan.id}">Return</button>
                    </div>
                </div>
            </article>`;
        }).join("");

        if (empty) empty.style.display = visible.length ? "none" : "block";
        document.getElementById("totalBorrowed").textContent = loans.length;
        document.getElementById("dueSoon").textContent = loans.filter(loan => loanStatus(loan) === "Due Soon").length;
        document.getElementById("onTime").textContent = loans.filter(loan => loanStatus(loan) === "On Time").length;
    }

    document.addEventListener("DOMContentLoaded", async () => {
        await Promise.all([window.LibraryCatalog.ready(), window.LibraryStore.ready()]);

        document.getElementById("borrowSearch")?.addEventListener("input", renderLoans);

        document.querySelectorAll(".filter-tab[data-filter]").forEach(button => {
            button.addEventListener("click", () => {
                activeFilter = button.dataset.filter;
                document.querySelectorAll(".filter-tab").forEach(item => item.classList.toggle("active", item === button));
                renderLoans();
            });
        });

        document.getElementById("borrowedBooksList")?.addEventListener("click", async event => {
            const button = event.target.closest("button[data-loan-id]");
            if (!button) return;
            const isRenew = button.dataset.action === "renew";

            if (!isRenew) {
                const book = LibraryCatalog.getById(
                    LibraryStore.getBorrowedBooks().find(l => String(l.id) === button.dataset.loanId)?.bookId
                );
                if (!confirm(`Are you sure you want to return "${book ? book.title : "this book"}"?`)) return;
            }

            button.disabled = true;
            const result = isRenew
                ? await LibraryStore.renewLoan(button.dataset.loanId)
                : await LibraryStore.returnLoan(button.dataset.loanId);

            alert(result.ok
                ? (isRenew ? "Book renewed successfully." : `Book returned successfully.${result.historyItem?.fineAmount ? ` Fine created: \u20b9${result.historyItem.fineAmount}.` : ""}`)
                : result.message);

            renderLoans();
        });

        renderLoans();
    });
}());
