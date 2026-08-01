// ==========================================
// AUTH GUARD
// ==========================================
if (!window.LibAPI.isLoggedIn()) {
    window.location.href = "login.html";
}

// ==========================================
// STATE
// ==========================================
let books = [];
let students = [];
let issues = [];

// ==========================================
// ELEMENTS
// ==========================================
const issueButton = document.querySelector(".issue-book-btn");
const issueModal = document.getElementById("issueBookModal");
const closeIssueButton = document.getElementById("closeIssueModal");
const cancelIssueButton = document.querySelector(".cancel-btn");
const issueForm = document.getElementById("issueForm");
const studentSelect = document.getElementById("studentSelect");
const bookSelect = document.getElementById("bookSelect");
const tableBody = document.querySelector(".issue-table tbody");
const searchIssue = document.getElementById("searchIssue");

// ==========================================
// OPEN / CLOSE MODAL
// ==========================================
issueButton.addEventListener("click", function () {

    issueForm.reset();
    resetDetails();

    const today = new Date();

    document.getElementById("issueDate").value =
        today.toISOString().split("T")[0];

    const returnDate = new Date(today);
    returnDate.setDate(returnDate.getDate() + 15);

    document.getElementById("expectedReturnDate").value =
        returnDate.toISOString().split("T")[0];

    issueModal.style.display = "flex";
});

closeIssueButton.addEventListener("click", closeModal);
cancelIssueButton.addEventListener("click", closeModal);
window.addEventListener("click", function (event) {
    if (event.target === issueModal) closeModal();
});
function closeModal() {
    issueModal.style.display = "none";
}

function resetDetails() {
    document.getElementById("displayStudentId").textContent = "-";
    document.getElementById("displayStudentName").textContent = "-";
    document.getElementById("displayStudentCourse").textContent = "-";
    document.getElementById("displayBookId").textContent = "-";
    document.getElementById("displayAuthor").textContent = "-";
    document.getElementById("displayCopies").textContent = "-";
}

// ==========================================
// LOAD DROPDOWNS
// ==========================================
function loadStudentOptions() {
    studentSelect.innerHTML = `<option value="">Select Student</option>`;
    students.forEach(function (student) {
        studentSelect.innerHTML += `<option value="${student.id}">${student.id} - ${student.name}</option>`;
    });
}

function loadBookOptions() {
    bookSelect.innerHTML = `<option value="">Select Book</option>`;
    books.forEach(function (book) {
        bookSelect.innerHTML += `<option value="${book.id}">${book.id} - ${book.name} (${book.quantity} left)</option>`;
    });
}

// ==========================================
// STUDENT / BOOK DETAILS ON SELECT
// ==========================================
studentSelect.addEventListener("change", function () {
    if (this.value === "") {
        document.getElementById("displayStudentId").textContent = "-";
        document.getElementById("displayStudentName").textContent = "-";
        document.getElementById("displayStudentCourse").textContent = "-";
        return;
    }
    const student = students.find(s => s.id === this.value);
    if (!student) return;
    document.getElementById("displayStudentId").textContent = student.id;
    document.getElementById("displayStudentName").textContent = student.name;
    document.getElementById("displayStudentCourse").textContent = student.course || "-";
});

bookSelect.addEventListener("change", refreshSelectedBook);

function refreshSelectedBook() {
    if (bookSelect.value === "") {
        document.getElementById("displayBookId").textContent = "-";
        document.getElementById("displayAuthor").textContent = "-";
        document.getElementById("displayCopies").textContent = "-";
        return;
    }
    const book = books.find(b => b.id === bookSelect.value);
    if (!book) return;
    document.getElementById("displayBookId").textContent = book.id;
    document.getElementById("displayAuthor").textContent = book.author;
    document.getElementById("displayCopies").textContent = book.quantity;
}

// ==========================================
// ISSUE BOOK
// ==========================================
issueForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (studentSelect.value === "" || bookSelect.value === "") {
        alert("Please select both Student and Book.");
        return;
    }

   const issueDate = document.getElementById("issueDate").value;

if (issueDate === "") {
    alert("Please select Issue Date.");
    return;
}

    const book = books.find(b => b.id === bookSelect.value);
    if (!book || Number(book.quantity) <= 0) {
        alert("This book is out of stock.");
        return;
    }

    const submitBtn = issueForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const res = await window.LibAPI.issueBook(bookSelect.value, studentSelect.value);

    if (submitBtn) submitBtn.disabled = false;

    if (!res.success) {
        alert(res.message);
        return;
    }

    await loadAll();
    closeModal();
    alert("Book issued successfully! Due back on " + res.dueDate);
});

// ==========================================
// LOAD ISSUE TABLE
// ==========================================
function renderIssueTable(query) {
    const term = (query || "").trim().toLowerCase();
    const visible = term
        ? issues.filter(i => `${i.issueId} ${i.studentName} ${i.bookName}`.toLowerCase().includes(term))
        : issues;

    tableBody.innerHTML = "";

    visible.forEach(function (issue) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${issue.issueId}</td>
            <td>${issue.studentName}</td>
            <td>${issue.bookName}</td>
            <td>${issue.issueDate}</td>
            <td>${issue.returnDate}</td>
            <td>
                <span class="status ${issue.status.toLowerCase()}">
                    ${issue.status}
                </span>
            </td>
            <td>
    ${
        issue.status === "Issued"
        ? `
        <button class="return-btn" data-id="${issue.issueId}" title="Return Book">
            <i class="fa-solid fa-rotate-left"></i>
        </button>
        `
        : `
        <span class="returned-label">
            <i class="fa-solid fa-check-circle"></i> Returned
        </span>
        `
    }
</td>
        `;

        tableBody.appendChild(row);
    });

    // Attach click event AFTER creating all rows
    document.querySelectorAll(".return-btn").forEach(btn => {

        btn.addEventListener("click", async function () {

            const issueId = this.dataset.id;

            if (!confirm("Return this book?")) return;

            const res = await window.LibAPI.returnBook(issueId);

            alert(res.message);

            if (res.success) {
                await loadAll();
            }

        });

    });

    const activeIssued = issues.filter(i => i.status === "Issued");

    const totalCountEl = document.getElementById("totalIssuedCount");

    if (totalCountEl)
        totalCountEl.textContent = activeIssued.length;
}

            document.querySelectorAll(".return-btn").forEach(btn => {

    btn.addEventListener("click", async function () {

        const issueId = this.dataset.id;

        if (!confirm("Return this book?")) return;

        const res = await window.LibAPI.returnBook(issueId);

        alert(res.message);

        if (res.success) {
            loadAll();
        }

    });

});

// ==========================================
// LOAD EVERYTHING
// ==========================================
async function loadAll() {
    [books, students, issues] = await Promise.all([
        window.LibAPI.getBooks(),
        window.LibAPI.getStudents(),
        window.LibAPI.getIssues(),
    ]);
    loadStudentOptions();
    loadBookOptions();
    refreshSelectedBook();
    renderIssueTable(searchIssue ? searchIssue.value : "");
}

if (searchIssue) {
    searchIssue.addEventListener("keyup", function () {
        renderIssueTable(this.value);
    });
}

loadAll();
