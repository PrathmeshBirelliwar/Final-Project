// ==========================================
// DATABASE
// ==========================================

const books = DATABASE.books;

const students = DATABASE.students;

const issuedBooks = DATABASE.issuedBooks;

const returnedBooks = DATABASE.returnedBooks;

const fines = DATABASE.fines;

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
// DASHBOARD
// ==========================================

function loadDashboard(){

    reportBooks.textContent = books.length;

    reportStudents.textContent = students.length;

    const activeIssued = issuedBooks.filter(function(issue){

        return issue.status === "Issued";

    });

    reportIssued.textContent = activeIssued.length;

    let totalFine = 0;

    fines.forEach(function(fine){

        totalFine += Number(fine.fineAmount);

    });

    reportFine.textContent = "₹" + totalFine;

}

// ==========================================
// LOAD REPORT
// ==========================================

function loadReport(type){

    reportHead.innerHTML = "";

    reportBody.innerHTML = "";

    switch(type){

        case "books":

            loadBooksReport();

            break;

        case "students":

            loadStudentsReport();

            break;

        case "issued":

            loadIssuedReport();

            break;

        case "returned":

            loadReturnedReport();

            break;

        case "fines":

            loadFineReport();

            break;

    }

}

// ==========================================
// BOOKS REPORT
// ==========================================

function loadBooksReport(){

    reportTitle.textContent = "Books Report";

    reportHead.innerHTML = `

        <tr>

            <th>Book ID</th>

            <th>Name</th>

            <th>Author</th>

            <th>Category</th>

            <th>Quantity</th>

        </tr>

    `;

    books.forEach(function(book){

        reportBody.innerHTML += `

            <tr>

                <td>${book.id}</td>

                <td>${book.name}</td>

                <td>${book.author}</td>

                <td>${book.category}</td>

                <td>${book.quantity}</td>

            </tr>

        `;

    });

}

// ==========================================
// STUDENTS REPORT
// ==========================================

function loadStudentsReport(){

    reportTitle.textContent = "Students Report";

    reportHead.innerHTML = `

        <tr>

            <th>Student ID</th>

            <th>Name</th>

            <th>Course</th>

            <th>Year</th>

            <th>Phone</th>

        </tr>

    `;

    students.forEach(function(student){

        reportBody.innerHTML += `

            <tr>

                <td>${student.id}</td>

                <td>${student.name}</td>

                <td>${student.course}</td>

                <td>${student.year}</td>

                <td>${student.phone}</td>

            </tr>

        `;

    });

}

// ==========================================
// ISSUED BOOKS REPORT
// ==========================================

function loadIssuedReport(){

    reportTitle.textContent = "Issued Books Report";

    reportHead.innerHTML = `

        <tr>

            <th>Issue ID</th>

            <th>Student</th>

            <th>Book</th>

            <th>Issue Date</th>

            <th>Return Date</th>

            <th>Status</th>

        </tr>

    `;

    issuedBooks.forEach(function(issue){

        reportBody.innerHTML += `

            <tr>

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

            </tr>

        `;

    });

}

// ==========================================
// RETURNED BOOKS REPORT
// ==========================================

function loadReturnedReport(){

    reportTitle.textContent = "Returned Books Report";

    reportHead.innerHTML = `

        <tr>

            <th>Issue ID</th>

            <th>Student</th>

            <th>Book</th>

            <th>Return Date</th>

            <th>Fine</th>

        </tr>

    `;

    returnedBooks.forEach(function(book){

        reportBody.innerHTML += `

            <tr>

                <td>${book.issueId}</td>

                <td>${book.studentName}</td>

                <td>${book.bookName}</td>

                <td>${book.actualReturnDate}</td>

                <td>₹${book.fine}</td>

            </tr>

        `;

    });

}

// ==========================================
// FINE REPORT
// ==========================================

function loadFineReport(){

    reportTitle.textContent = "Fine Report";

    reportHead.innerHTML = `

        <tr>

            <th>Fine ID</th>

            <th>Student</th>

            <th>Book</th>

            <th>Fine</th>

            <th>Status</th>

        </tr>

    `;

    fines.forEach(function(fine){

        reportBody.innerHTML += `

            <tr>

                <td>${fine.fineId}</td>

                <td>${fine.studentName}</td>

                <td>${fine.bookName}</td>

                <td>₹${fine.fineAmount}</td>

                <td>

                    <span class="status ${fine.status.toLowerCase()}">

                        ${fine.status}

                    </span>

                </td>

            </tr>

        `;

    });

}

// ==========================================
// REPORT SWITCH
// ==========================================

reportType.addEventListener("change", function(){

    loadReport(this.value);

});

// ==========================================
// SEARCH
// ==========================================

searchReport.addEventListener("keyup", function(){

    const value = this.value.toLowerCase();

    const rows = document.querySelectorAll("#reportBody tr");

    rows.forEach(function(row){

        const text = row.textContent.toLowerCase();

        row.style.display = text.includes(value) ? "" : "none";

    });

});

// ==========================================
// PRINT REPORT
// ==========================================

document.getElementById("printReport").addEventListener("click", function(){

    window.print();

});

// ==========================================
// EXPORT PDF
// ==========================================

document.getElementById("pdfReport").addEventListener("click", function(){

    alert("PDF Export will be added in the next version.");

});

// ==========================================
// EXPORT EXCEL
// ==========================================

document.getElementById("excelReport").addEventListener("click", function(){

    alert("Excel Export will be added in the next version.");

});

// ==========================================
// INITIAL LOAD
// ==========================================

loadDashboard();

loadReport("books");


