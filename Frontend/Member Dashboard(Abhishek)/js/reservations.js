let reservations = [];

document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([window.LibraryCatalog.ready(), window.LibraryStore.ready()]);
    displayReservations();
    updateReservationSummary();
});

function displayReservations() {
    reservations = LibraryStore.getReservations();

    const container = document.getElementById("reservationsList");
    const emptyState = document.getElementById("emptyReservations");

    if (reservations.length === 0) {
        container.innerHTML = "";
        emptyState.style.display = "block";
        return;
    }

    emptyState.style.display = "none";
    container.innerHTML = "";

    reservations.forEach((reservation, index) => {
        const book = LibraryCatalog.getById(reservation.bookId);
        const card = document.createElement("div");
        card.className = "reservation-card";
        card.innerHTML = `
            <div class="reservation-icon"><i class="fa-solid fa-book"></i></div>
            <div class="reservation-info">
                <h3>${book?.title || "Unknown book"}</h3>
                <p>By ${book?.author || "Unknown author"}</p>
                <div class="reservation-date">Reserved on: ${LibraryStore.dateLabel(reservation.reservedDate)}</div>
            </div>
            <div class="reservation-actions">
                <span class="reservation-status">${reservation.status}</span>
                <button class="cancel-btn" onclick="cancelReservation(${index})" ${reservation.status === "Cancelled" ? "disabled" : ""}>Cancel Reservation</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function updateReservationSummary() {
    document.getElementById("activeReservations").textContent = reservations.filter(r => r.status !== "Cancelled").length;
    document.getElementById("pendingReservations").textContent = reservations.filter(r => r.status === "Pending").length;
    document.getElementById("readyReservations").textContent = reservations.filter(r => r.status === "Ready").length;
}

async function cancelReservation(index) {
    const reservation = reservations[index];
    if (!reservation) return;

    const confirmCancel = confirm(`Cancel reservation for "${LibraryCatalog.getById(reservation.bookId)?.title || "this book"}"?`);
    if (!confirmCancel) return;

    const result = await LibraryStore.cancelReservation(reservation.id);
    if (!result.ok) {
        alert(result.message);
        return;
    }

    displayReservations();
    updateReservationSummary();
    alert("Reservation cancelled successfully.");
}
