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
let editingBookId = null;

// ==========================================
// ELEMENTS
// ==========================================
const addBookButton = document.querySelector(".add-book-btn");
const modal = document.getElementById("addBookModal");
const closeButton = document.getElementById("closeModal");
const cancelButton = document.querySelector(".cancel-btn");
const bookForm = document.getElementById("bookForm");
const searchBookInput = document.getElementById("searchBook");

// ==========================================
// OPEN / CLOSE MODAL
// ==========================================
addBookButton.addEventListener("click", function () {
    editingBookId = null;
    bookForm.reset();
    modal.style.display = "flex";
});

closeButton.addEventListener("click", closeModal);
cancelButton.addEventListener("click", closeModal);
window.addEventListener("click", function (event) {
    if (event.target === modal) closeModal();
});
function closeModal() {
    modal.style.display = "none";
}

// ==========================================
// SAVE BOOK (add or edit)
// ==========================================
bookForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const bookName = document.getElementById("bookName").value.trim();
    const authorName = document.getElementById("authorName").value.trim();
    const category = document.getElementById("bookCategory").value;
    const isbn = document.getElementById("bookISBN") ? document.getElementById("bookISBN").value.trim() : "";
    const quantity = document.getElementById("bookQuantity").value;

    if (bookName === "" || authorName === "" || quantity === "") {
        alert("Please fill all required fields.");
        return;
    }
    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
        alert("Quantity must be a positive whole number.");
        return;
    }

    const submitBtn = bookForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const payload = { name: bookName, author: authorName, category, isbn, quantity: Number(quantity) };
    const res = editingBookId
        ? await window.LibAPI.updateBook(editingBookId, payload)
        : await window.LibAPI.addBook(payload);

    if (submitBtn) submitBtn.disabled = false;

    if (!res.success) {
        alert(res.message);
        return;
    }

    editingBookId = null;
    await loadBooks();
    bookForm.reset();
    modal.style.display = "none";
});

// ==========================================
// DELETE BOOK
// ==========================================
document.addEventListener("click", async function (event) {
    const deleteButton = event.target.closest(".delete-btn");
    if (!deleteButton) return;

    const id = deleteButton.dataset.id;
    if (!confirm("Are you sure you want to delete this book?")) return;

    const res = await window.LibAPI.deleteBook(id);
    if (!res.success) {
        alert(res.message);
        return;
    }
    await loadBooks();
});

// ==========================================
// EDIT BOOK
// ==========================================
document.addEventListener("click", function (event) {
    const editButton = event.target.closest(".edit-btn");
    if (!editButton) return;

    const id = editButton.dataset.id;
    const book = books.find(b => b.id === id);
    if (!book) return;

    editingBookId = book.id;
    document.getElementById("bookName").value = book.name;
    document.getElementById("authorName").value = book.author;
    document.getElementById("bookCategory").value = book.category || "";
    if (document.getElementById("bookISBN")) document.getElementById("bookISBN").value = book.isbn || "";
    document.getElementById("bookQuantity").value = book.quantity;

    modal.style.display = "flex";
});

// ==========================================
// LOAD BOOKS
// ==========================================
async function loadBooks() {
    books = await window.LibAPI.getBooks();
    renderBooks(searchBookInput ? searchBookInput.value : "");
    updateTotalBooks();
}

function renderBooks(query) {
    const tableBody = document.querySelector(".books-table tbody");
    const term = (query || "").trim().toLowerCase();
    const visible = term
        ? books.filter(b => `${b.id} ${b.name} ${b.author} ${b.category}`.toLowerCase().includes(term))
        : books;

    tableBody.innerHTML = "";
    visible.forEach(function (book) {
        const row = document.createElement("tr");
        const available = Number(book.quantity) > 0;
        row.innerHTML = `
            <td>${book.id}</td>
            <td>${book.name}</td>
            <td>${book.author}</td>
            <td>${book.category || "-"}</td>
            <td>${book.quantity}</td>
            <td>
                <span class="status ${available ? "available" : "unavailable"}">
                    ${available ? "Available" : "Out of Stock"}
                </span>
            </td>
            <td>
                <button class="edit-btn" data-id="${book.id}">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="delete-btn" data-id="${book.id}">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// ==========================================
// TOTAL BOOKS
// ==========================================
function updateTotalBooks() {
    document.getElementById("totalBooks").textContent = "Total Books : " + books.length;
}

// ==========================================
// SEARCH
// ==========================================
if (searchBookInput) {
    searchBookInput.addEventListener("keyup", function () {
        renderBooks(this.value);
    });
}

// ==========================================
// INITIAL LOAD
// ==========================================
loadBooks();
