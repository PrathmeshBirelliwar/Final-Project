// ==========================================
// LIBRARY API
// ==========================================

const LibAPI = window.LibAPI;

let books = [];

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

bookForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const body = {
    name: document.getElementById("bookName").value.trim(),
    author: document.getElementById("authorName").value.trim(),
    category: document.getElementById("bookCategory").value,
    isbn: document.getElementById("bookISBN").value.trim(),
    quantity: Number(document.getElementById("bookQuantity").value)
};

    try {

        if (editIndex === null) {

            await LibAPI.addBook(body);

        } else {

            await LibAPI.updateBook(books[editIndex].id, body);

            editIndex = null;
        }

        bookForm.reset();
        modal.style.display = "none";

        await loadBooks();

    } catch (err) {

        console.error(err);

    }

});

// ==========================================
// LOAD BOOKS
// ==========================================


   async function loadBooks() {

    try {

       books = await LibAPI.getBooks();

        console.log(books);

        renderBooks(books);
        updateTotalBooks();

    } catch (err) {

        console.error(err);

    }

}
loadBooks();

function renderBooks(bookList) {

    const tableBody = document.querySelector(".books-table tbody");

    tableBody.innerHTML = "";

    bookList.forEach((book, index) => {

        tableBody.innerHTML += `
            <tr>
                <td>${book.id}</td>
                <td>${book.name}</td>
                <td>${book.author}</td>
                <td>${book.category}</td>
                <td>${book.quantity}</td>
                <td>
                    <span class="status ${book.quantity > 0 ? "available" : "issued"}">
                        ${book.quantity > 0 ? "Available" : "Out of Stock"}
                    </span>
                </td>
                <td>
                    <button class="edit-btn" data-index="${index}">
                        <i class="fa-solid fa-pen"></i>
                    </button>

                    <button class="delete-btn" data-id="${book.id}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

}


// ==========================================
/// ==========================================
// DELETE BOOK
// ==========================================

document.addEventListener("click", async function (event) {

    const button = event.target.closest(".delete-btn");

    if (!button) return;

    if (!confirm("Delete this book?")) return;

    try {

       await LibAPI.deleteBook(button.dataset.id);

        await loadBooks();

    } catch (err) {

        console.error(err);

    }

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
// TOTAL BOOKS
// ==========================================

function updateTotalBooks(){

    document.getElementById("totalBooks").textContent =
        "Total Books : " + books.length;

}

const searchBook = document.getElementById("searchBook");

searchBook.addEventListener("input", function () {

    const keyword = this.value.toLowerCase().trim();

    const filteredBooks = books.filter(book =>

        book.id.toLowerCase().includes(keyword) ||

       book.name.toLowerCase().includes(keyword) ||

        book.author.toLowerCase().includes(keyword) ||

        book.category.toLowerCase().includes(keyword)

    );

    renderBooks(filteredBooks);

});
