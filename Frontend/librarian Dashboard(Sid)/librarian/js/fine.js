// ==========================================
// AUTH GUARD
// ==========================================
if (!window.LibAPI.isLoggedIn()) {
    window.location.href = "login.html";
}

// ==========================================
// STATE
// ==========================================
let fines = [];
let selectedFineId = null;

// ==========================================
// ELEMENTS
// ==========================================
const tableBody = document.querySelector(".fine-table tbody");
const totalFineAmount = document.getElementById("totalFineAmount");
const pendingFine = document.getElementById("pendingFine");
const paidFine = document.getElementById("paidFine");
const totalFineRecords = document.getElementById("totalFineRecords");
const searchFine = document.getElementById("searchFine");
const payFineModal = document.getElementById("payFineModal");
const closeFineModal = document.getElementById("closeFineModal");
const cancelFineButton = document.querySelector(".cancel-btn");
const fineForm = document.getElementById("fineForm");

// ==========================================
// CLOSE MODAL
// ==========================================
function closeModal() {
    payFineModal.style.display = "none";
}
closeFineModal.addEventListener("click", closeModal);
cancelFineButton.addEventListener("click", closeModal);
window.addEventListener("click", function (event) {
    if (event.target === payFineModal) closeModal();
});

// ==========================================
// LOAD DASHBOARD CARDS
// ==========================================
function loadCards() {
    let total = 0, pending = 0, paid = 0;
    fines.forEach(function (fine) {
        total += Number(fine.fineAmount);
        if (fine.status === "Pending") pending += Number(fine.fineAmount);
        else paid += Number(fine.fineAmount);
    });
    totalFineAmount.textContent = "\u20b9" + total;
    pendingFine.textContent = "\u20b9" + pending;
    paidFine.textContent = "\u20b9" + paid;
    totalFineRecords.textContent = fines.length;
}

// ==========================================
// LOAD TABLE
// ==========================================
function loadFineTable(query) {
    const term = (query || "").trim().toLowerCase();
    const visible = term
        ? fines.filter(f => `${f.fineId} ${f.studentName} ${f.bookName}`.toLowerCase().includes(term))
        : fines;

    tableBody.innerHTML = "";
    visible.forEach(function (fine) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${fine.fineId}</td>
            <td>${fine.studentName}</td>
            <td>${fine.bookName}</td>
            <td>${fine.lateDays ?? "-"}</td>
            <td>&#8377;${fine.fineAmount}</td>
            <td>
                <span class="status ${fine.status.toLowerCase()}">${fine.status}</span>
            </td>
            <td>
                <button class="pay-btn" data-id="${fine.issueId}" ${fine.status === "Paid" ? "disabled" : ""}>
                    <i class="fa-solid fa-wallet"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// ==========================================
// OPEN PAY FINE MODAL
// ==========================================
document.addEventListener("click", function (event) {
    const payButton = event.target.closest(".pay-btn");
    if (!payButton) return;

    const fine = fines.find(f => String(f.issueId) === payButton.dataset.id);
    if (!fine) return;
    if (fine.status === "Paid") {
        alert("This fine has already been paid.");
        return;
    }

    selectedFineId = fine.issueId;
    document.getElementById("fineStudent").value = fine.studentName;
    document.getElementById("fineBook").value = fine.bookName;
    document.getElementById("fineLateDays").value = fine.lateDays ?? "-";
    document.getElementById("fineAmount").value = "\u20b9" + fine.fineAmount;
    payFineModal.style.display = "flex";
});

// ==========================================
// PAY FINE
// ==========================================
fineForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (selectedFineId === null) return;

    const submitBtn = fineForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const res = await window.LibAPI.payFine(selectedFineId);

    if (submitBtn) submitBtn.disabled = false;

    if (!res.success) {
        alert(res.message);
        return;
    }

    await refreshPage();
    closeModal();
    selectedFineId = null;
    alert("Fine paid successfully.");
});

// ==========================================
// SEARCH
// ==========================================
searchFine.addEventListener("keyup", function () {
    loadFineTable(this.value);
});

// ==========================================
// REFRESH / INITIAL LOAD
// ==========================================
async function refreshPage() {
    fines = await window.LibAPI.getFines();
    loadCards();
    loadFineTable(searchFine ? searchFine.value : "");
}

refreshPage();
