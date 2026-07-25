// ==========================================
// DATABASE
// ==========================================

const books = DATABASE.books;

const students = DATABASE.students;

const issuedBooks = DATABASE.issuedBooks;

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

// ==========================================
// OPEN MODAL
// ==========================================

issueButton.addEventListener("click", function(){

    issueForm.reset();

    resetDetails();

    issueModal.style.display = "flex";

});

// ==========================================
// CLOSE MODAL
// ==========================================

closeIssueButton.addEventListener("click", closeModal);

cancelIssueButton.addEventListener("click", closeModal);

window.addEventListener("click", function(event){

    if(event.target === issueModal){

        closeModal();

    }

});

function closeModal(){

    issueModal.style.display = "none";

}

// ==========================================
// RESET DETAILS
// ==========================================

function resetDetails(){

    document.getElementById("displayStudentId").textContent="-";

    document.getElementById("displayStudentName").textContent="-";

    document.getElementById("displayStudentCourse").textContent="-";

    document.getElementById("displayBookId").textContent="-";

    document.getElementById("displayAuthor").textContent="-";

    document.getElementById("displayCopies").textContent="-";

}// ==========================================
// LOAD STUDENTS
// ==========================================

function loadStudents(){

    studentSelect.innerHTML = `

        <option value="">Select Student</option>

    `;

    students.forEach(function(student, index){

        studentSelect.innerHTML += `

            <option value="${index}">

                ${student.id} - ${student.name}

            </option>

        `;

    });

}

// ==========================================
// LOAD BOOKS
// ==========================================

function loadBooks(){

    bookSelect.innerHTML = `

        <option value="">Select Book</option>

    `;

    books.forEach(function(book, index){

        bookSelect.innerHTML += `

            <option value="${index}">

                ${book.id} - ${book.name}

            </option>

        `;

    });

}

// ==========================================
// INITIAL LOAD
// ==========================================

loadStudents();

loadBooks();

refreshSelectedBook();// ==========================================
// STUDENT DETAILS
// ==========================================

studentSelect.addEventListener("change", function(){

    if(this.value === ""){

        document.getElementById("displayStudentId").textContent = "-";
        document.getElementById("displayStudentName").textContent = "-";
        document.getElementById("displayStudentCourse").textContent = "-";

        return;

    }

    const student = students[Number(this.value)];

    document.getElementById("displayStudentId").textContent = student.id;

    document.getElementById("displayStudentName").textContent = student.name;

    document.getElementById("displayStudentCourse").textContent = student.course;

});

// ==========================================
// BOOK DETAILS
// ==========================================

bookSelect.addEventListener("change", function(){

    if(this.value === ""){

        document.getElementById("displayBookId").textContent = "-";
        document.getElementById("displayAuthor").textContent = "-";
        document.getElementById("displayCopies").textContent = "-";

        return;

    }

    const book = books[Number(this.value)];

    document.getElementById("displayBookId").textContent = book.id;

    document.getElementById("displayAuthor").textContent = book.author;

    document.getElementById("displayCopies").textContent = book.quantity;

});// ==========================================
// ISSUE BOOK
// ==========================================

issueForm.addEventListener("submit", function(event){

    event.preventDefault();

    if(studentSelect.value === "" || bookSelect.value === ""){

        alert("Please select both Student and Book.");

        return;

    }

    const issueDate = document.getElementById("issueDate").value;

    const returnDate = document.getElementById("returnDate").value;

    if(issueDate === "" || returnDate === ""){

        alert("Please select Issue Date and Return Date.");

        return;

    }

    const student = students[Number(studentSelect.value)];

    const book = books[Number(bookSelect.value)];

    if(Number(book.quantity) <= 0){

    alert("This book is out of stock.");

    return;

}

    const issueRecord = {

        issueId: "IS" + String(Date.now()).slice(-5),

        studentId: student.id,

        studentName: student.name,

        bookId: book.id,

        bookName: book.name,

        issueDate: issueDate,

        returnDate: returnDate,

        status: "Issued"

    };

    issuedBooks.push(issueRecord);

    book.quantity = Number(book.quantity) - 1;
    refreshSelectedBook();

    saveDatabase();

    loadIssueTable();

    loadBooks();

    closeModal();

});// ==========================================
// LOAD ISSUE TABLE
// ==========================================

function loadIssueTable(){

    tableBody.innerHTML = "";

    issuedBooks.forEach(function(issue){

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${issue.issueId}</td>

            <td>${issue.studentName}</td>

            <td>${issue.bookName}</td>

            <td>${issue.issueDate}</td>

            <td>${issue.returnDate}</td>

            <td>

                <span class="status issued">

                    ${issue.status}

                </span>

            </td>

            <td>

                <button class="view-btn">

                    <i class="fa-solid fa-eye"></i>

                </button>

            </td>

        `;

        tableBody.appendChild(row);

    });

}

loadIssueTable();
        const activeIssued = issuedBooks.filter(function(issue){

            return issue.status === "Issued";

        });

        document.getElementById("totalIssuedCount").textContent = activeIssued.length;
// ==========================================
// REFRESH BOOK DETAILS
// ==========================================

function refreshSelectedBook(){

    if(bookSelect.value === ""){

        return;

    }

    const book = books[Number(bookSelect.value)];

    document.getElementById("displayBookId").textContent = book.id;

    document.getElementById("displayAuthor").textContent = book.author;

    document.getElementById("displayCopies").textContent = book.quantity;

}

// ==========================================
// UPDATE BOOK DETAILS AFTER ISSUE
// ==========================================

bookSelect.addEventListener("change", refreshSelectedBook);