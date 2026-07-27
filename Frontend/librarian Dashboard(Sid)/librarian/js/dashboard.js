// ==========================================
// LOGIN PROTECTION
// ==========================================

const API = "http://localhost:5000/api/stats/librarian";

function getToken() {
    return sessionStorage.getItem("token");
}

if (!getToken()) {
    window.location.href = "login.html";
}

// ==========================================
// LIBRARY DASHBOARD
// ==========================================

document.addEventListener("DOMContentLoaded", function(){

    updateDashboard();
    loadRecentBooks();

    console.log("Librarian Dashboard Loaded Successfully");

    // ==========================================
    // DATABASE
    // ==========================================

    // ==========================================
    // UPDATE DASHBOARD
    // ==========================================

async function updateDashboard() {

    try {

        const response = await fetch(API, {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to load dashboard");
        }

        const result = await response.json();

        console.log(result);

        const stats = result.stats || {};
        console.log("Stats =", stats);

        document.getElementById("totalBooks").textContent =
            stats.totalBooks || 0;

        document.getElementById("totalStudents").textContent =
            stats.totalStudents || 0;

        document.getElementById("issuedBooks").textContent =
            stats.issuedToday || 0;

        // Backend availableBooks nahi bhej raha
        document.getElementById("availableBooks").textContent =
            stats.totalBooks || 0;

    } catch (err) {

        console.error(err);

    }

}


async function loadRecentBooks() {

    const tableBody = document.querySelector(".books-table tbody");

    if (!tableBody) return;

    tableBody.innerHTML = "";

    try {

        const response = await fetch(API, {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });

        const data = await response.json();

        const recentBooks = data.recentIssues || [];

        recentBooks.forEach(issue => {

            tableBody.innerHTML += `
                <tr>
                    <td>${issue.book_id}</td>
                    <td>${issue.book_title}</td>
                    <td>${issue.member_name}</td>
                    <td>${issue.issue_date}</td>
                    <td>
                        <span class="status-badge ${issue.status.toLowerCase()}">
                            ${issue.status}
                        </span>
                    </td>
                </tr>
            `;

        });

    } catch (err) {

        console.error(err);

    }

}

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

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    window.location.href = "login.html";

});