let selectedBookId = null;
let selectedRow = null;

document.addEventListener("DOMContentLoaded", () => {
    loadBooks();

    document.getElementById("btnSaveBook").addEventListener("click", addBook);
    document.getElementById("btnUpdateBook").addEventListener("click", updateBook);
    document.getElementById("btnDeleteBook").addEventListener("click", deleteBook);
});

async function loadBooks() {
    const books = await window.AdminAPI.getBooks();

    const table = document.getElementById("bookTable");
    table.innerHTML = "";

    books.forEach(book => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${book.id}</td>
            <td>${book.title || book.name}</td>
            <td>${book.author}</td>
            <td>${book.category || ""}</td>
            <td>${book.publisher || ""}</td>
            <td>${book.total_quantity ?? book.totalCopies ?? book.quantity}</td>
        `;

        tr.addEventListener("click", () => selectBook(tr, book));

        table.appendChild(tr);
    });
}

function selectBook(row, book) {

    if (selectedRow)
        selectedRow.classList.remove("selected");

    selectedRow = row;
    selectedBookId = book.id;

    row.classList.add("selected");

    document.getElementById("bookId").value = book.id;
    document.getElementById("bookName").value = book.title || book.name;
    document.getElementById("author").value = book.author;
    document.getElementById("category").value = book.category || "";
    document.getElementById("publisher").value = book.publisher || "";
    document.getElementById("quantity").value =
        book.total_quantity ?? book.totalCopies ?? book.quantity;
}

async function addBook() {

    const book = {
        id: document.getElementById("bookId").value.trim(),
        name: document.getElementById("bookName").value.trim(),
        author: document.getElementById("author").value.trim(),
        category: document.getElementById("category").value.trim(),
        publisher: document.getElementById("publisher").value.trim(),
        quantity: Number(document.getElementById("quantity").value)
    };

    const res = await window.AdminAPI.addBook(book);

    alert(res.message);

    if (!res.success) return;

    clearForm();
    await loadBooks();
}

async function updateBook() {

    if (!selectedBookId) {
        alert("Select a book first.");
        return;
    }

    const book = {
        id: document.getElementById("bookId").value.trim(),
        name: document.getElementById("bookName").value.trim(),
        author: document.getElementById("author").value.trim(),
        category: document.getElementById("category").value.trim(),
        publisher: document.getElementById("publisher").value.trim(),
        quantity: Number(document.getElementById("quantity").value)
    };

    const res = await window.AdminAPI.updateBook(selectedBookId, book);

    alert(res.message);

    if (!res.success) return;

    clearForm();
    await loadBooks();
}

async function deleteBook() {

    if (!selectedBookId) {
        alert("Select a book first.");
        return;
    }

    if (!confirm("Delete this book?")) return;

    const res = await window.AdminAPI.deleteBook(selectedBookId);

    alert(res.message);

    if (!res.success) return;

    clearForm();
    await loadBooks();
}

function clearForm() {

    selectedBookId = null;

    if (selectedRow)
        selectedRow.classList.remove("selected");

    selectedRow = null;

    document.getElementById("bookId").value = "";
    document.getElementById("bookName").value = "";
    document.getElementById("author").value = "";
    document.getElementById("category").value = "";
    document.getElementById("publisher").value = "";
    document.getElementById("quantity").value = "";
}

function searchBook() {

    const value = document.getElementById("search").value.toUpperCase();

    document.querySelectorAll("#bookTable tr").forEach(row => {

        row.style.display =
            row.innerText.toUpperCase().includes(value)
                ? ""
                : "none";

    });
}
