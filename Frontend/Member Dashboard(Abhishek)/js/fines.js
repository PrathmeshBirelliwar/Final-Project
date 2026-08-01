let fines = [];
let paymentFineIds = [];

document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([window.LibraryCatalog.ready(), window.LibraryStore.ready()]);
    await loadFines();
});

function currency(amount) { return `\u20b9${amount}`; }

async function loadFines() {
    fines = LibraryStore.getFines();
    const table = document.getElementById("fineTable");
    table.innerHTML = fines.map(fine => `
        <tr>
            <td><strong>${LibraryCatalog.getById(fine.bookId)?.title || fine.book || "Library fine"}</strong></td><td>Overdue return</td><td>${LibraryStore.dateLabel(fine.createdDate)}</td>
            <td><strong>${currency(fine.amount)}</strong></td>
            <td><span class="status ${fine.status.toLowerCase()}">${fine.status}</span></td>
            <td>${fine.status === "Pending" ? `<button class="action-btn" onclick="openPaymentModal(['${fine.id}'])">Pay Now</button>` : `<span class="completed-payment">Paid</span>`}</td>
        </tr>`).join("");
    updateSummary();
    filterFines();
}

function updateSummary() {
    const pending = fines.filter(fine => fine.status === "Pending").reduce((sum, fine) => sum + Number(fine.amount), 0);
    const paid = fines.filter(fine => fine.status === "Paid").reduce((sum, fine) => sum + Number(fine.amount), 0);
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
    const amount = selected.reduce((sum, fine) => sum + Number(fine.amount), 0);
    document.getElementById("paymentTitle").textContent = ids.length === 1 ? "Pay library fine" : "Pay all library fines";
    document.getElementById("paymentDescription").textContent = ids.length === 1
        ? `Payment for ${LibraryCatalog.getById(selected[0].bookId)?.title || "library fine"}`
        : `${ids.length} outstanding fine${ids.length > 1 ? "s" : ""} selected`;
    document.getElementById("paymentAmount").textContent = currency(amount);
    document.getElementById("paymentModal").classList.add("open");
    document.getElementById("paymentModal").setAttribute("aria-hidden", "false");
}

function closePaymentModal() {
    document.getElementById("paymentModal").classList.remove("open");
    document.getElementById("paymentModal").setAttribute("aria-hidden", "true");
    paymentFineIds = [];
}

async function confirmPayment() {
    const confirmBtn = document.querySelector('#paymentModal .action-btn, #paymentModal button[onclick="confirmPayment()"]');
    if (confirmBtn) confirmBtn.disabled = true;

    // The demo "payment method" field is cosmetic — the backend just marks the fine Paid.
    for (const id of paymentFineIds) {
        await LibraryStore.payFine(id);
    }

    if (confirmBtn) confirmBtn.disabled = false;
    closePaymentModal();
    await loadFines();
    alert("Payment successful. Your fine status has been updated.");
}

function filterFines() {
    const filter = document.getElementById("fineFilter").value;
    document.querySelectorAll("#fineTable tr").forEach(row => {
        const status = row.querySelector(".status")?.textContent.toLowerCase();
        row.style.display = filter === "all" || status === filter ? "" : "none";
    });
}
