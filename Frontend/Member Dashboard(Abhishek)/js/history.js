let history = [];

document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([window.LibraryCatalog.ready(), window.LibraryStore.ready()]);
    displayHistory();
});

function displayHistory() {
    history = LibraryStore.getHistory();

    const container = document.getElementById("historyList");
    const emptyState = document.getElementById("emptyHistory");
    const totalHistory = document.getElementById("totalHistory");

    totalHistory.textContent = `${history.length} Books`;

    if (history.length === 0) {
        container.innerHTML = "";
        emptyState.style.display = "block";
        return;
    }

    emptyState.style.display = "none";
    container.innerHTML = "";

    // Show newest returned books first
    [...history].reverse().forEach(book => {
        const catalogBook = LibraryCatalog.getById(book.bookId);
        const card = document.createElement("div");
        card.className = "history-card";
        card.innerHTML = `
            <div class="history-icon"><i class="fa-solid fa-check"></i></div>
            <div class="history-info">
                <h3>${catalogBook?.title || book.title}</h3>
                <p>By ${catalogBook?.author || book.author || "Unknown author"}</p>
                <div class="history-dates">
                    <div><span>Borrowed On</span><strong>${LibraryStore.dateLabel(book.borrowedDate)}</strong></div>
                    <div><span>Returned On</span><strong>${LibraryStore.dateLabel(book.returnedDate)}</strong></div>
                </div>
            </div>
            <div>
                <span class="returned-status">Returned</span>
                ${book.fineAmount > 0 ? `<span class="status pending" style="margin-left:8px;">Fine: \u20b9${book.fineAmount}</span>` : ""}
            </div>
        `;
        container.appendChild(card);
    });
}
