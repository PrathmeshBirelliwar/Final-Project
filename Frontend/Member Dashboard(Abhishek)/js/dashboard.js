(function () {
    const status = loan => { const days = Math.ceil((new Date(`${loan.dueDate}T00:00:00`) - new Date(`${LibraryStore.today()}T00:00:00`)) / 86400000); return days < 0 ? "Overdue" : days <= 3 ? "Due Soon" : "On Time"; };
    function renderDashboard() {
        const loans = LibraryStore.getBorrowedBooks(), reservations = LibraryStore.getReservations(), fines = LibraryStore.getFines().filter(fine => fine.status === "Pending");
        const count = document.getElementById("borrowedCount"); if (count) count.textContent = loans.length;
        const cards = document.querySelectorAll(".stats-grid .stat-card h2"); if (cards[1]) cards[1].textContent = loans.filter(loan => status(loan) === "Due Soon").length; if (cards[2]) cards[2].textContent = reservations.filter(item => ["Pending", "Ready"].includes(item.status)).length; if (cards[3]) cards[3].textContent = `₹${fines.reduce((sum, fine) => sum + Number(fine.amount || 0), 0)}`;
        const table = document.getElementById("borrowedBooksTable"); if (!table) return;
        table.innerHTML = loans.slice(0, 5).map(loan => { const book = LibraryCatalog.getById(loan.bookId), state = status(loan); return `<tr><td><div class="book-info"><div class="book-cover"><i class="fa-solid fa-book"></i></div><div><strong>${book.title}</strong><small>${book.author}</small></div></div></td><td>${LibraryStore.dateLabel(loan.borrowedDate)}</td><td>${LibraryStore.dateLabel(loan.dueDate)}</td><td><span class="status ${state.toLowerCase().replace(" ", "-")}">${state}</span></td><td><button class="action-btn" type="button" data-loan-id="${loan.id}">Renew</button></td></tr>`; }).join("") || '<tr><td colspan="5">No books are currently borrowed.</td></tr>';
    }
    document.addEventListener("DOMContentLoaded", () => { document.getElementById("borrowedBooksTable")?.addEventListener("click", event => { const button = event.target.closest("button[data-loan-id]"); if (!button) return; const result = LibraryStore.renewLoan(button.dataset.loanId); alert(result.ok ? "Book renewed successfully." : result.message); renderDashboard(); }); renderDashboard(); });
}());
