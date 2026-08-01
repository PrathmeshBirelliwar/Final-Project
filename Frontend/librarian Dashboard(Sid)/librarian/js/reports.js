// ==========================================
// AUTH GUARD
// ==========================================
if (!window.LibAPI.isLoggedIn()) {
    window.location.href = "login.html";
}

// ==========================================
// STATE
// ==========================================
let books = [], students = [], issues = [], fines = [];

// ==========================================
// ELEMENTS
// ==========================================
const reportBooks = document.getElementById("reportBooks");
const reportStudents = document.getElementById("reportStudents");
const reportIssued = document.getElementById("reportIssued");
const reportFine = document.getElementById("reportFine");
const reportType = document.getElementById("reportType");
const reportTitle = document.getElementById("reportTitle");
const reportHead = document.getElementById("reportHead");
const reportBody = document.getElementById("reportBody");
const searchReport = document.getElementById("searchReport");

// ==========================================
// DASHBOARD CARDS
// ==========================================
function loadDashboard() {
    reportBooks.textContent = books.length;
    reportStudents.textContent = students.length;
    reportIssued.textContent = issues.filter(i => i.status === "Issued").length;
    const totalFine = fines.reduce((sum, f) => sum + Number(f.fineAmount || 0), 0);
    reportFine.textContent = "\u20b9" + totalFine;
}

// ==========================================
// REPORT SWITCH
// ==========================================
function loadReport(type) {
    reportHead.innerHTML = "";
    reportBody.innerHTML = "";
    switch (type) {
        case "books": loadBooksReport(); break;
        case "students": loadStudentsReport(); break;
        case "issued": loadIssuedReport(); break;
        case "returned": loadReturnedReport(); break;
        case "fines": loadFineReport(); break;
    }
}

function loadBooksReport() {
    reportTitle.textContent = "Books Report";
    reportHead.innerHTML = `<tr><th>Book ID</th><th>Name</th><th>Author</th><th>Category</th><th>Available Copies</th></tr>`;
    books.forEach(book => {
        reportBody.innerHTML += `<tr><td>${book.id}</td><td>${book.name}</td><td>${book.author}</td><td>${book.category || "-"}</td><td>${book.quantity}</td></tr>`;
    });
}

function loadStudentsReport() {
    reportTitle.textContent = "Students Report";
    reportHead.innerHTML = `<tr><th>Student ID</th><th>Name</th><th>Course</th><th>Year</th><th>Phone</th></tr>`;
    students.forEach(student => {
        reportBody.innerHTML += `<tr><td>${student.id}</td><td>${student.name}</td><td>${student.course || "-"}</td><td>${student.year || "-"}</td><td>${student.phone || "-"}</td></tr>`;
    });
}

function loadIssuedReport() {
    reportTitle.textContent = "Issued Books Report";
    reportHead.innerHTML = `<tr><th>Issue ID</th><th>Student</th><th>Book</th><th>Issue Date</th><th>Return Date</th><th>Status</th></tr>`;
    issues.forEach(issue => {
        reportBody.innerHTML += `<tr><td>${issue.issueId}</td><td>${issue.studentName}</td><td>${issue.bookName}</td><td>${issue.issueDate}</td><td>${issue.returnDate}</td><td><span class="status ${issue.status.toLowerCase()}">${issue.status}</span></td></tr>`;
    });
}

function loadReturnedReport() {
    reportTitle.textContent = "Returned Books Report";
    reportHead.innerHTML = `<tr><th>Issue ID</th><th>Student</th><th>Book</th><th>Return Date</th><th>Fine</th></tr>`;
    issues.filter(i => i.status === "Returned").forEach(book => {
        reportBody.innerHTML += `<tr><td>${book.issueId}</td><td>${book.studentName}</td><td>${book.bookName}</td><td>${book.actualReturnDate || "-"}</td><td>&#8377;${book.fine || 0}</td></tr>`;
    });
}

function loadFineReport() {
    reportTitle.textContent = "Fine Report";
    reportHead.innerHTML = `<tr><th>Issue ID</th><th>Student</th><th>Book</th><th>Fine</th><th>Status</th></tr>`;
    fines.forEach(fine => {
        reportBody.innerHTML += `<tr><td>${fine.fineId}</td><td>${fine.studentName}</td><td>${fine.bookName}</td><td>&#8377;${fine.fineAmount}</td><td><span class="status ${fine.status.toLowerCase()}">${fine.status}</span></td></tr>`;
    });
}

// ==========================================
// EVENTS
// ==========================================
reportType.addEventListener("change", function () {
    loadReport(this.value);
});

searchReport.addEventListener("keyup", function () {
    const value = this.value.toLowerCase();
    document.querySelectorAll("#reportBody tr").forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(value) ? "" : "none";
    });
});

document.getElementById("printReport").addEventListener("click", function () {
    window.print();
});

document.getElementById("pdfReport").addEventListener("click", function () {
    alert("PDF export isn't available yet — use Print, which lets you save as PDF from the browser's print dialog.");
});

document.getElementById("excelReport").addEventListener("click", function () {
    // Simple CSV export of whatever report is currently displayed — works without extra libraries.
    const rows = [...document.querySelectorAll("#reportHead tr, #reportBody tr")];
    const csv = rows.map(row => [...row.children].map(cell => `"${cell.textContent.trim().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${reportTitle.textContent.replace(/\s+/g, "_")}.csv`;
    link.click();
});

// ==========================================
// INITIAL LOAD
// ==========================================
async function init() {
    [books, students, issues, fines] = await Promise.all([
        window.LibAPI.getBooks(),
        window.LibAPI.getStudents(),
        window.LibAPI.getIssues(),
        window.LibAPI.getFines(),
    ]);
    loadDashboard();
    loadReport("books");
}

init();
