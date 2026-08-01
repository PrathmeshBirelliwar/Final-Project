(function () {
    const status = loan => {
        const days = Math.ceil((new Date(`${loan.dueDate}T00:00:00`) - new Date(`${LibraryStore.today()}T00:00:00`)) / 86400000);
        return days < 0 ? "Overdue" : days <= 3 ? "Due Soon" : "On Time";
    };

    async function renderDashboard() {
        await Promise.all([window.LibraryCatalog.ready(), window.LibraryStore.ready()]);

        const loans = LibraryStore.getBorrowedBooks();
        const reservations = LibraryStore.getReservations();
        const fines = LibraryStore.getFines().filter(fine => fine.status === "Pending");

        const count = document.getElementById("borrowedCount");
        if (count) count.textContent = loans.length;

        const cards = document.querySelectorAll(".stats-grid .stat-card h2");
        if (cards[1]) cards[1].textContent = loans.filter(loan => status(loan) === "Due Soon").length;
        if (cards[2]) cards[2].textContent = reservations.filter(item => ["Pending", "Ready"].includes(item.status)).length;
        if (cards[3]) cards[3].textContent = `\u20b9${fines.reduce((sum, fine) => sum + Number(fine.amount || 0), 0)}`;

        const table = document.getElementById("borrowedBooksTable");
        if (table) {
            table.innerHTML = loans.slice(0, 5).map(loan => {
                const book = window.LibraryCatalog.getById(loan.bookId) || { title: loan.title, author: loan.author };
                const state = status(loan);
                return `<tr><td><div class="book-info"><div class="book-cover"><i class="fa-solid fa-book"></i></div><div><strong>${book.title}</strong><small>${book.author}</small></div></div></td><td>${LibraryStore.dateLabel(loan.borrowedDate)}</td><td>${LibraryStore.dateLabel(loan.dueDate)}</td><td><span class="status ${state.toLowerCase().replace(" ", "-")}">${state}</span></td><td><button class="action-btn" type="button" data-loan-id="${loan.id}">Renew</button></td></tr>`;
            }).join("") || '<tr><td colspan="5">No books are currently borrowed.</td></tr>';
        }

        // "Recommended" = real catalog books the member hasn't already borrowed, picked at random each visit
        const recommendedGrid = document.getElementById("recommendedGrid");
        if (recommendedGrid) {
            const borrowedIds = new Set(loans.map(loan => loan.bookId));
            const candidates = window.LibraryCatalog.all().filter(book => !borrowedIds.has(book.id));
            const picks = candidates.sort(() => Math.random() - 0.5).slice(0, 3);
            recommendedGrid.innerHTML = picks.map(book => `
                <div class="book-card">
                    <div class="book-card-cover"><i class="fa-solid fa-book-open"></i></div>
                    <div class="book-card-content">
                        <h3>${book.title}</h3>
                        <p>${book.author}</p>
                        <span class="${book.availableCopies > 0 ? "available" : "unavailable"}">${book.availableCopies > 0 ? "Available" : "Unavailable"}</span>
                        <button class="secondary-btn" type="button" data-book-id="${book.id}">View Details</button>
                    </div>
                </div>
            `).join("") || "<p>No other books in the catalog right now.</p>";
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("borrowedBooksTable")?.addEventListener("click", async event => {
            const button = event.target.closest("button[data-loan-id]");
            if (!button) return;
            button.disabled = true;
            const result = await LibraryStore.renewLoan(button.dataset.loanId);
            alert(result.ok ? "Book renewed successfully." : result.message);
            renderDashboard();
        });
        document.getElementById("recommendedGrid")?.addEventListener("click", event => {
            const button = event.target.closest("button[data-book-id]");
            if (button) window.location.href = `book-details.html?book=${encodeURIComponent(button.dataset.bookId)}`;
        });
        renderDashboard();
    });
}());
