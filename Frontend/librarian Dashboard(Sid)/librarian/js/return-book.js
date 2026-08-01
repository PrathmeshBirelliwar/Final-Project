// ==========================================
// AUTH GUARD
// ==========================================
if (!window.LibAPI.isLoggedIn()) {
    window.location.href = "login.html";
}

// ==========================================
// STATE
// ==========================================
let issues = [];
let selectedIssue = null;

// ==========================================
// ELEMENTS
// ==========================================
const returnModal = document.getElementById("returnBookModal");
const returnForm = document.getElementById("returnForm");
const tableBody = document.querySelector(".return-table tbody");
const closeReturnButton = document.getElementById("closeReturnModal");
const cancelReturnButton = document.querySelector(".cancel-btn");
const searchReturn = document.getElementById("searchReturn");

// ==========================================
// CLOSE MODAL
// ==========================================
closeReturnButton.addEventListener("click", closeModal);
cancelReturnButton.addEventListener("click", closeModal);
window.addEventListener("click", function (event) {
    if (event.target === returnModal) closeModal();
});
function closeModal() {
    returnModal.style.display = "none";
}

// ==========================================
// LOAD RETURN TABLE
// ==========================================
function renderReturnTable(query) {
    const pending = issues.filter(i => i.status === "Issued");
    const term = (query || "").trim().toLowerCase();
    const visible = term
        ? pending.filter(i => `${i.issueId} ${i.studentName} ${i.bookName}`.toLowerCase().includes(term))
        : pending;

    tableBody.innerHTML = "";
    visible.forEach(function (issue) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${issue.issueId}</td>
            <td>${issue.studentName}</td>
            <td>${issue.bookName}</td>
            <td>${issue.issueDate}</td>
            <td>${issue.returnDate}</td>
            <td>&#8377;0</td>
            <td>
                <span class="status issued">${issue.status}</span>
            </td>
            <td>
                <button class="return-btn" data-id="${issue.issueId}">
                    <i class="fa-solid fa-rotate-left"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    const totalPendingEl = document.getElementById("totalpendingCount");
    if (totalPendingEl) totalPendingEl.textContent = pending.length;
}

async function loadIssues() {
    issues = await window.LibAPI.getIssues();
    renderReturnTable(searchReturn ? searchReturn.value : "");
}

window.LibAPI.getSettings().then(settings => {
    if (settings) currentFinePerDay = settings.finePerDay;
});

if (searchReturn) {
    searchReturn.addEventListener("keyup", function () {
        renderReturnTable(this.value);
    });
}

// ==========================================
// OPEN RETURN MODAL
// ==========================================
document.addEventListener("click", function (event) {
    const returnButton = event.target.closest(".return-btn");
    if (!returnButton) return;

    selectedIssue = issues.find(i => String(i.issueId) === returnButton.dataset.id);
    if (!selectedIssue) return;

    document.getElementById("returnStudent").textContent = selectedIssue.studentName;
    document.getElementById("returnIssueId").textContent = selectedIssue.issueId;
    document.getElementById("returnCourse").textContent = selectedIssue.course || "-";

    document.getElementById("returnBook").textContent = selectedIssue.bookName;
    document.getElementById("returnBookId").textContent = selectedIssue.bookId;
    document.getElementById("returnAuthor").textContent = selectedIssue.author || "-";

    document.getElementById("issueDate").value = selectedIssue.issueDate;
    document.getElementById("dueDate").value = selectedIssue.returnDate;
    document.getElementById("actualReturnDate").valueAsDate = new Date();

    document.getElementById("lateDays").value = "";
    document.getElementById("fineAmount").value = "";

    calculateFine();
    returnModal.style.display = "flex";
});

let currentFinePerDay = 5; // fallback until /api/settings responds

// ==========================================
// CALCULATE FINE (preview only — the server recalculates authoritatively on return)
// ==========================================
const returnDateInput = document.getElementById("actualReturnDate");
returnDateInput.addEventListener("change", calculateFine);

function calculateFine() {
    const dueDateValue = document.getElementById("dueDate").value;
    const returnDateValue = document.getElementById("actualReturnDate").value;

    if (dueDateValue === "" || returnDateValue === "") {
        document.getElementById("lateDays").value = "";
        document.getElementById("fineAmount").value = "";
        return;
    }

    const dueDate = new Date(dueDateValue);
    const returnDate = new Date(returnDateValue);
    const oneDay = 1000 * 60 * 60 * 24;
    let lateDays = Math.floor((returnDate - dueDate) / oneDay);
    if (lateDays < 0) lateDays = 0;

    const fine = lateDays * currentFinePerDay;
    document.getElementById("lateDays").value = lateDays;
    document.getElementById("fineAmount").value = fine;
}

// ==========================================
// CONFIRM RETURN
// ==========================================
returnForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (selectedIssue === null) return;

    const submitBtn = returnForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const res = await window.LibAPI.returnBook(selectedIssue.issueId);

    if (submitBtn) submitBtn.disabled = false;

    if (!res.success) {
        alert(res.message);
        return;
    }

    await loadIssues();

    selectedIssue = null;
    returnForm.reset();
    closeModal();

    alert(
        res.fineAmount > 0
            ? `Book returned successfully! A fine of \u20b9${res.fineAmount} was applied for ${res.overdueDays} day(s) late.`
            : "Book returned successfully!"
    );
});

// ==========================================
// INITIAL LOAD
// ==========================================
loadIssues();
