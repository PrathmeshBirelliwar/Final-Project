let fines = [];
let paymentFineIds = [];

document.addEventListener("DOMContentLoaded", () => {
    fines = LibraryStore.getFines();
    loadFines();
});

function currency(amount) { return `₹${amount}`; }

function loadFines() {
    const table = document.getElementById("fineTable");
    table.innerHTML = fines.map(fine => `
        <tr>
            <td><strong>${LibraryCatalog.getById(fine.bookId)?.title || fine.book || "Library fine"}</strong></td><td>${fine.reason || "Overdue return"}</td><td>${LibraryStore.dateLabel(fine.createdDate || fine.date)}</td>
            <td><strong>${currency(fine.amount)}</strong></td>
            <td><span class="status ${fine.status.toLowerCase()}">${fine.status}</span></td>
            <td>${fine.status === "Pending" ? `<button class="action-btn" onclick="openPaymentModal(['${fine.id}'])">Pay Now</button>` : `<span class="completed-payment">Paid${fine.paymentMethod ? ` · ${fine.paymentMethod}` : ""}</span>`}</td>
        </tr>`).join("");
    updateSummary();
    filterFines();
}

function updateSummary() {
    const pending = fines.filter(fine => fine.status === "Pending").reduce((sum, fine) => sum + fine.amount, 0);
    const paid = fines.filter(fine => fine.status === "Paid").reduce((sum, fine) => sum + fine.amount, 0);
    document.getElementById("totalFine").textContent = currency(pending);
    document.getElementById("totalPaid").textContent = currency(paid);
    document.getElementById("totalTransactions").textContent = fines.length;
}

function payAllFines() {
    const ids = fines.filter(fine => fine.status === "Pending").map(fine => fine.id);
    if (!ids.length) { alert("You have no outstanding fines."); return; }
    openPaymentModal(ids);
}

function openPaymentModal(ids) {
    paymentFineIds = ids;
    const selected = fines.filter(fine => ids.includes(fine.id));
    const amount = selected.reduce((sum, fine) => sum + fine.amount, 0);
    document.getElementById("paymentTitle").textContent = ids.length === 1 ? "Pay library fine" : "Pay all library fines";
    document.getElementById("paymentDescription").textContent = ids.length === 1 ? `Payment for ${LibraryCatalog.getById(selected[0].bookId)?.title || "library fine"}` : `${ids.length} outstanding fine${ids.length > 1 ? "s" : ""} selected`;
    document.getElementById("paymentAmount").textContent = currency(amount);
    document.getElementById("paymentModal").classList.add("open");
    document.getElementById("paymentModal").setAttribute("aria-hidden", "false");
}

function closePaymentModal() {
    document.getElementById("paymentModal").classList.remove("open");
    document.getElementById("paymentModal").setAttribute("aria-hidden", "true");
    paymentFineIds = [];
}

function confirmPayment() {
    const method = document.getElementById("paymentMethod").value;
    const paidDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    fines = fines.map(fine => paymentFineIds.includes(fine.id) ? { ...fine, status: "Paid", paymentMethod: method, paidDate } : fine);
    LibraryStore.saveFines(fines);
    closePaymentModal();
    loadFines();
    alert("Payment successful. Your fine status has been updated.");
}

function filterFines() {
    const filter = document.getElementById("fineFilter").value;
    document.querySelectorAll("#fineTable tr").forEach(row => {
        const status = row.querySelector(".status")?.textContent.toLowerCase();
        row.style.display = filter === "all" || status === filter ? "" : "none";
    });
}
