// ==========================================
// LIBRARY DATABASE
// ==========================================

const DATABASE = {

    books: JSON.parse(localStorage.getItem("books")) || [],

    students: JSON.parse(localStorage.getItem("students")) || [],

    issuedBooks: JSON.parse(localStorage.getItem("issuedBooks")) || [],

    returnedBooks: JSON.parse(localStorage.getItem("returnedBooks")) || [],

    fines: JSON.parse(localStorage.getItem("fines")) || [],

    settings: JSON.parse(localStorage.getItem("settings")) || {

        libraryName: "LibraryMS",

        finePerDay: 5,

        loanDays: 15,

        maxBooksPerStudent: 3

    }

};

// ==========================================
// SAVE DATABASE
// ==========================================

function saveDatabase(){

    localStorage.setItem("books", JSON.stringify(DATABASE.books));

    localStorage.setItem("students", JSON.stringify(DATABASE.students));

    localStorage.setItem("issuedBooks", JSON.stringify(DATABASE.issuedBooks));

    localStorage.setItem("returnedBooks", JSON.stringify(DATABASE.returnedBooks));

    localStorage.setItem("fines", JSON.stringify(DATABASE.fines));

    localStorage.setItem("settings", JSON.stringify(DATABASE.settings));

}