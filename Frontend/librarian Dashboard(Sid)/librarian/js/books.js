// ==========================================
// DATABASE
// ==========================================

let books = JSON.parse(localStorage.getItem("books")) || [];

console.log("books.js loaded");
// ==========================================
// ELEMENTS
// ==========================================

const addBookButton = document.querySelector(".add-book-btn");

const modal = document.getElementById("addBookModal");

const closeButton = document.getElementById("closeModal");

const cancelButton = document.querySelector(".cancel-btn");
// ==========================================
// EDIT MODE
// ==========================================

let editIndex = null;

// ==========================================
// OPEN MODAL
// ==========================================

addBookButton.addEventListener("click", function(){

    modal.style.display = "flex";

});

// ==========================================
// CLOSE MODAL (X BUTTON)
// ==========================================

closeButton.addEventListener("click", function(){

    modal.style.display = "none";

});

// ==========================================
// CLOSE MODAL (CANCEL BUTTON)
// ==========================================

cancelButton.addEventListener("click", function(){

    modal.style.display = "none";

});

// ==========================================
// CLOSE WHEN CLICKING OUTSIDE
// ==========================================

window.addEventListener("click", function(event){

    if(event.target === modal){

        modal.style.display = "none";

    }

});// ==========================================
// ADD BOOK TO TABLE
// ==========================================

const bookForm = document.getElementById("bookForm");

// ==========================================
// SAVE BOOK
// ==========================================

bookForm.addEventListener("submit", function(event){

    event.preventDefault();

    const bookName = document.getElementById("bookName").value.trim();

    const authorName = document.getElementById("authorName").value.trim();

    const category = document.getElementById("bookCategory").value;

    const quantity = document.getElementById("bookQuantity").value;

    if(bookName === "" || authorName === "" || quantity === ""){

        alert("Please fill all required fields.");

        return;

    }

   if(editIndex !== null){

    books[editIndex].name = bookName;

    books[editIndex].author = authorName;

    books[editIndex].category = category;

    books[editIndex].quantity = quantity;

    editIndex = null;

}

else{

    const book = {

        id: "BK" + String(Date.now()).slice(-5),

        name: bookName,

        author: authorName,

        category: category,

        quantity: quantity

    };

    books.push(book);

}

    localStorage.setItem(

        "books",

        JSON.stringify(books)

    );

    loadBooks();
    updateTotalBooks();

    bookForm.reset();

    modal.style.display = "none";

});// ==========================================
/// ==========================================
// DELETE BOOK
// ==========================================

document.addEventListener("click", function(event){

    const deleteButton = event.target.closest(".delete-btn");

    if(!deleteButton){

        return;

    }

    const index = deleteButton.dataset.index;

    const confirmDelete = confirm("Are you sure you want to delete this book?");

    if(!confirmDelete){

        return;

    }

    books.splice(index,1);

    localStorage.setItem(

        "books",

        JSON.stringify(books)

    );

    loadBooks();
    updateTotalBooks();

});
// ==========================================
// ==========================================
// EDIT BOOK
// ==========================================

document.addEventListener("click", function(event){

    const editButton = event.target.closest(".edit-btn");

    if(!editButton){

        return;

    }

    editIndex = Number(editButton.dataset.index);

    const book = books[editIndex];

    document.getElementById("bookName").value = book.name;

    document.getElementById("authorName").value = book.author;

    document.getElementById("bookCategory").value = book.category;

    document.getElementById("bookQuantity").value = book.quantity;

    modal.style.display = "flex";

});
// ==========================================
// LOAD BOOKS
// ==========================================

function loadBooks(){

    const tableBody = document.querySelector(".books-table tbody");

    tableBody.innerHTML = "";

    books.forEach(function(book,index){

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${book.id}</td>

            <td>${book.name}</td>

            <td>${book.author}</td>

            <td>${book.category}</td>

            <td>${book.quantity}</td>

            <td>

                <span class="status available">

                    Available

                </span>

            </td>

            <td>

                <button class="edit-btn" data-index="${index}">

                    <i class="fa-solid fa-pen"></i>

                </button>

                <button class="delete-btn" data-index="${index}">

                    <i class="fa-solid fa-trash"></i>

                </button>

            </td>

        `;

        tableBody.appendChild(row);

    });

}

loadBooks();

updateTotalBooks();

// ==========================================
// TOTAL BOOKS
// ==========================================

function updateTotalBooks(){

    document.getElementById("totalBooks").textContent =
        "Total Books : " + books.length;

}

