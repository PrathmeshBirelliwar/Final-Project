// ==========================================
// LOGIN PROTECTION
// ==========================================


if(sessionStorage.getItem("isLoggedIn") !== "true"){

    window.location.href = "login.html";

}

// ==========================================
// LIBRARY DASHBOARD
// ==========================================

document.addEventListener("DOMContentLoaded", function(){

    console.log("Librarian Dashboard Loaded Successfully");

    // ==========================================
    // DATABASE
    // ==========================================

    const books = DATABASE.books;

    const students = DATABASE.students;

    const issuedBooks = DATABASE.issuedBooks;

    // ==========================================
// LOAD RECENT ISSUED BOOKS
// ==========================================

function loadRecentBooks(){

    if(!tableBody){

        return;

    }

    tableBody.innerHTML = "";

    issuedBooks.slice().reverse().slice(0,5).forEach(function(issue){

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${issue.bookId}</td>

            <td>${issue.bookName}</td>

            <td>${issue.studentName}</td>

            <td>${issue.issueDate}</td>

            <td>

                <span class="status-badge ${issue.status.toLowerCase()}">

                    ${issue.status}

                </span>

            </td>

        `;

        tableBody.appendChild(row);

    });

}

    // ==========================================
    // UPDATE DASHBOARD
    // ==========================================

    function updateDashboard(){

        const totalBooks = document.getElementById("totalBooks");

        const availableBooks = document.getElementById("availableBooks");

        const issuedBooksCard = document.getElementById("issuedBooks");

        const totalStudents = document.getElementById("totalStudents");

        if(totalBooks){

            totalBooks.textContent = books.length;

        }

        if(totalStudents){

            totalStudents.textContent = students.length;

        }

        if(issuedBooksCard){

            const activeIssues = issuedBooks.filter(function(issue){

                return issue.status === "Issued";

            });

            issuedBooksCard.textContent = activeIssues.length;

        }

        if(availableBooks){

            let totalAvailable = 0;

            books.forEach(function(book){

                totalAvailable += Number(book.quantity);

            });

            availableBooks.textContent = totalAvailable;

        }

    }

    updateDashboard();

loadRecentBooks();

    // ==========================================
    // SEARCH
    // ==========================================

   
});


// ==========================================
// QUICK ACTIONS
// ==========================================

document.getElementById("addBookBtn").addEventListener("click", function(){

    window.location.href = "books.html";

});

document.getElementById("addStudentBtn").addEventListener("click", function(){

    window.location.href = "students.html";

});

document.getElementById("issueBookBtn").addEventListener("click", function(){

    window.location.href = "issue-book.html";

});

document.getElementById("returnBookBtn").addEventListener("click", function(){

    window.location.href = "return-book.html";

});

// ==========================================
// PROFILE MODAL
// ==========================================

const profileButton = document.getElementById("profileButton");

const profileModal = document.getElementById("profileModal");

const closeProfileModal = document.getElementById("closeProfileModal");

// ==========================================
// OPEN PROFILE
// ==========================================

profileButton.addEventListener("click", function(){

    profileModal.style.display = "flex";

});

// ==========================================
// CLOSE PROFILE
// ==========================================

closeProfileModal.addEventListener("click", function(){

    profileModal.style.display = "none";

});

// ==========================================
// CLOSE WHEN CLICK OUTSIDE
// ==========================================

window.addEventListener("click", function(event){

    if(event.target === profileModal){

        profileModal.style.display = "none";

    }

});// ==========================================
// PROFILE DATABASE
// ==========================================

const profile = JSON.parse(localStorage.getItem("profile")) || {

    name: "Admin",

    email: "admin@library.com",

    phone: "+91 9876543210",

    library: "LibraryMS"

};

// ==========================================
// LOAD PROFILE
// ==========================================

function loadProfile(){

    document.getElementById("profileName").textContent = profile.name;

    document.getElementById("modalProfileName").textContent = profile.name;

    document.getElementById("modalEmail").textContent = profile.email;

    document.getElementById("modalPhone").textContent = profile.phone;

    document.getElementById("modalLibrary").textContent = profile.library;

    document.getElementById("editName").value = profile.name;

    document.getElementById("editEmail").value = profile.email;

    document.getElementById("editPhone").value = profile.phone;

    document.getElementById("editLibrary").value = profile.library;

}

loadProfile();// ==========================================
// SAVE PROFILE
// ==========================================

document.getElementById("editProfileBtn").addEventListener("click", function(){

    profile.name = document.getElementById("editName").value.trim();

    profile.email = document.getElementById("editEmail").value.trim();

    profile.phone = document.getElementById("editPhone").value.trim();

    profile.library = document.getElementById("editLibrary").value.trim();

    localStorage.setItem(

        "profile",

        JSON.stringify(profile)

    );

    loadProfile();

    alert("Profile updated successfully.");

});// ==========================================
// LOGOUT
// ==========================================

document.getElementById("logoutBtn").addEventListener("click", function(){

    const logout = confirm("Do you want to logout?");

    if(!logout){

        return;

    }

   sessionStorage.removeItem("isLoggedIn");

    window.location.href = "login.html";

});