// ==========================================
// DATABASE
// ==========================================

const books = DATABASE.books;

const issuedBooks = DATABASE.issuedBooks;

const returnedBooks = DATABASE.returnedBooks;

// ==========================================
// ELEMENTS
// ==========================================

const returnModal = document.getElementById("returnBookModal");

const returnForm = document.getElementById("returnForm");

const tableBody = document.querySelector(".return-table tbody");

const closeReturnButton = document.getElementById("closeReturnModal");

const cancelReturnButton = document.querySelector(".cancel-btn");

// ==========================================
// SELECTED ISSUE
// ==========================================

let selectedIssue = null;

// ==========================================
// CLOSE MODAL
// ==========================================

closeReturnButton.addEventListener("click", closeModal);

cancelReturnButton.addEventListener("click", closeModal);

window.addEventListener("click", function(event){

    if(event.target === returnModal){

        closeModal();

    }

});

function closeModal(){

    returnModal.style.display = "none";

}// ==========================================
// LOAD RETURN TABLE
// ==========================================

function loadReturnTable(){

    tableBody.innerHTML = "";

    issuedBooks.forEach(function(issue, index){

        if(issue.status === "Returned"){

            return;

        }

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${issue.issueId}</td>

            <td>${issue.studentName}</td>

            <td>${issue.bookName}</td>

            <td>${issue.issueDate}</td>

            <td>${issue.returnDate}</td>

            <td>₹0</td>

            <td>

                <span class="status issued">

                    ${issue.status}

                </span>

            </td>

            <td>

                <button
                    class="return-btn"
                    data-index="${index}">

                    <i class="fa-solid fa-rotate-left"></i>

                </button>

            </td>

        `;

        tableBody.appendChild(row);

    });

}

// ==========================================
// INITIAL LOAD
// ==========================================

loadReturnTable();
const pendingBooks = issuedBooks.filter(function(issue){

    return issue.status === "Issued";

});

document.getElementById("totalPendingCount").textContent = pendingBooks.length;
// ==========================================
// OPEN RETURN MODAL
// ==========================================

document.addEventListener("click", function(event){

    const returnButton = event.target.closest(".return-btn");

    if(!returnButton){

        return;

    }

    const index = Number(returnButton.dataset.index);

    selectedIssue = issuedBooks[index];

    // ===============================
    // STUDENT DETAILS
    // ===============================

    document.getElementById("returnStudent").textContent =
        selectedIssue.studentName;

    document.getElementById("returnIssueId").textContent =
        selectedIssue.issueId;

    document.getElementById("returnCourse").textContent =
        selectedIssue.course || "-";

    // ===============================
    // BOOK DETAILS
    // ===============================

    document.getElementById("returnBook").textContent =
        selectedIssue.bookName;

    document.getElementById("returnBookId").textContent =
        selectedIssue.bookId;

    document.getElementById("returnAuthor").textContent =
        selectedIssue.author || "-";

    // ===============================
    // DATES
    // ===============================

    document.getElementById("issueDate").value =
        selectedIssue.issueDate;

    document.getElementById("dueDate").value =
        selectedIssue.returnDate;

    document.getElementById("actualReturnDate").valueAsDate =
        new Date();

    document.getElementById("lateDays").value = "";

    document.getElementById("fineAmount").value = "";

    calculateFine();

    returnModal.style.display = "flex";

});// ==========================================
// CALCULATE FINE
// ==========================================

const returnDateInput = document.getElementById("actualReturnDate");

returnDateInput.addEventListener("change", calculateFine);

function calculateFine(){

    const dueDateValue = document.getElementById("dueDate").value;

    const returnDateValue = document.getElementById("actualReturnDate").value;

    if(dueDateValue === "" || returnDateValue === ""){

        document.getElementById("lateDays").value = "";

        document.getElementById("fineAmount").value = "";

        return;

    }

    const dueDate = new Date(dueDateValue);

    const returnDate = new Date(returnDateValue);

    const oneDay = 1000 * 60 * 60 * 24;

    let lateDays = Math.floor((returnDate - dueDate) / oneDay);

    if(lateDays < 0){

        lateDays = 0;

    }

    const fine = lateDays * 5;

    document.getElementById("lateDays").value = lateDays;

    document.getElementById("fineAmount").value = fine;

}// ==========================================
// CONFIRM RETURN
// ==========================================

returnForm.addEventListener("submit", function(event){

    event.preventDefault();

    if(selectedIssue === null){

        return;

    }

    // ===============================
    // UPDATE ISSUE STATUS
    // ===============================

    selectedIssue.status = "Returned";

    selectedIssue.actualReturnDate =
        document.getElementById("actualReturnDate").value;

    selectedIssue.lateDays =
        Number(document.getElementById("lateDays").value);

    selectedIssue.fine =
        Number(document.getElementById("fineAmount").value);
        // ==========================================
// CREATE FINE RECORD
// ==========================================

if(selectedIssue.fine > 0){

    const fine = {

        fineId: "FN" + String(Date.now()).slice(-5),

        issueId: selectedIssue.issueId,

        studentId: selectedIssue.studentId,

        studentName: selectedIssue.studentName,

        bookId: selectedIssue.bookId,

        bookName: selectedIssue.bookName,

        lateDays: selectedIssue.lateDays,

        fineAmount: selectedIssue.fine,

        status: "Pending",

        paidDate: ""

    };

    DATABASE.fines.push(fine);

}

    // ===============================
    // ADD TO RETURNED BOOKS
    // ===============================

    returnedBooks.push({

        ...selectedIssue

    });

    // ===============================
    // INCREASE BOOK QUANTITY
    // ===============================

    const book = books.find(function(item){

        return item.id === selectedIssue.bookId;

    });

    if(book){

        book.quantity = Number(book.quantity) + 1;

    }

    // ===============================
    // SAVE DATABASE
    // ===============================

    saveDatabase();

    // ===============================
    // REFRESH TABLE
    // ===============================

    loadReturnTable();

    // ===============================
    // RESET
    // ===============================

    selectedIssue = null;

    returnForm.reset();

    closeModal();

    alert("Book returned successfully!");

});