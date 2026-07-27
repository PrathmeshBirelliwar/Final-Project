// ==========================================
// DATABASE
// ==========================================

const BOOK_API = "http://localhost:5000/api/books";
const MEMBER_API = "http://localhost:5000/api/members";
const ISSUE_API = "http://localhost:5000/api/issues";

function getToken() {
    return sessionStorage.getItem("token");
}

let books = [];
let students = [];
let issuedBooks = [];

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


issueButton.addEventListener("click", function () {

    issueForm.reset();

    resetDetails();

    issueModal.style.display = "flex";

});


issueForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    if (studentSelect.value === "" || bookSelect.value === "") {
        alert("Please select both Student and Book.");
        return;
    }

    const body = {
       member_id: students[Number(studentSelect.value)].id,
        book_id: books[Number(bookSelect.value)].id,
        issue_date: document.getElementById("issueDate").value,
        return_date: document.getElementById("returnDate").value
    };

    try {

        const response = await fetch(ISSUE_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error("Issue failed");
        }

        alert("Book Issued Successfully");

        closeModal();

        await loadBooks();

        await loadIssueTable();

    } catch (err) {

        console.error(err);

        alert("Unable to issue book");

    }

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

function closeModal() {

    issueModal.style.display = "none";

    issueForm.reset();

    resetDetails();

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

async function loadStudents() {

    const response = await fetch(MEMBER_API, {
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    });

   const result = await response.json();

        console.log("Books API =", result);

        books = result.books || [];

        console.log("Books =", books);

    studentSelect.innerHTML = `<option value="">Select Student</option>`;

    students.forEach((student, index) => {

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

async function loadBooks() {

    const response = await fetch(BOOK_API, {
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    });

    const result = await response.json();

        console.log("Issues API =", result);

        issuedBooks = result.issues || [];

        console.log("Issued =", issuedBooks);

    bookSelect.innerHTML = `<option value="">Select Book</option>`;

    books.forEach((book, index) => {

        bookSelect.innerHTML += `
            <option value="${index}">
                ${book.id} - ${book.title}
            </option>
        `;

    });

}

// ==========================================
// INITIAL LOAD
// ==========================================

(async function () {

    await loadStudents();

    await loadBooks();

    await loadIssueTable();

    refreshSelectedBook();

})();
// ==========================================
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
// LOAD ISSUE TABLE
// ==========================================

async function loadIssueTable() {

    try {

        const response = await fetch(ISSUE_API, {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });

        const result = await response.json();

        console.log("Members API =", result);

        students = result.members || [];

        console.log("Students =", students);

        tableBody.innerHTML = "";

        issuedBooks.forEach(issue => {

            tableBody.innerHTML += `
                <tr>
                    <td>${issue.id}</td>
                    <td>${issue.member_name}</td>
                    <td>${issue.book_title}</td>
                    <td>${issue.issue_date}</td>
                    <td>${issue.return_date}</td>
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
                </tr>
            `;

        });

        document.getElementById("totalIssuedCount").textContent =
            issuedBooks.length;

    } catch (err) {

        console.error(err);

    }

}


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