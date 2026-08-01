// ==========================================
// AUTH GUARD
// ==========================================
if (!window.LibAPI.isLoggedIn()) {
    window.location.href = "login.html";
}

// ==========================================
// SESSION -> HEADER / PROFILE
// ==========================================
const session = window.LibAPI.getSession();
if (session) {
    document.getElementById("profileName").textContent = session.name || "Librarian";
    document.getElementById("modalProfileName").textContent = session.name || "Librarian";
    document.getElementById("modalEmail").textContent = session.email || "-";
    document.getElementById("editName").value = session.name || "";
    document.getElementById("editEmail").value = session.email || "";
    document.getElementById("editEmail").disabled = true; // email is the login ID; not editable here
}

// Fill in the real phone/address instead of leaving the markup's static placeholder text
async function loadMyProfile() {
    const profile = await window.LibAPI.getMyProfile();
    if (!profile) return;
    document.getElementById("modalPhone").textContent = profile.phone || "Not set";
    document.getElementById("editPhone").value = profile.phone || "";
    document.getElementById("editLibrary").value = profile.address || "";
}
loadMyProfile();

// ==========================================
// STATS + RECENT ACTIVITY
// ==========================================
async function loadDashboard() {
    const stats = await window.LibAPI.getStats();
    document.getElementById("totalBooks").textContent = stats.totalBooks;
    document.getElementById("issuedBooks").textContent = stats.issuedToday !== undefined
        ? (await window.LibAPI.getIssues()).filter(i => i.status === "Issued").length
        : 0;
    document.getElementById("totalStudents").textContent = stats.totalStudents;

    const books = await window.LibAPI.getBooks();
    const totalAvailable = books.reduce((sum, b) => sum + Number(b.quantity), 0);
    document.getElementById("availableBooks").textContent = totalAvailable;

    const issues = await window.LibAPI.getIssues();
    const recentTableBody = document.querySelector(".recent-books-section .books-table tbody");
    recentTableBody.innerHTML = "";
    issues.slice(0, 6).forEach(issue => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${issue.bookId}</td>
            <td>${issue.bookName}</td>
            <td>${issue.studentName}</td>
            <td>${issue.issueDate}</td>
            <td><span class="status ${issue.status.toLowerCase()}">${issue.status}</span></td>
        `;
        recentTableBody.appendChild(row);
    });
}

// ==========================================
// QUICK ACTIONS
// ==========================================
document.getElementById("addBookBtn").addEventListener("click", () => window.location.href = "books.html");
document.getElementById("addStudentBtn").addEventListener("click", () => window.location.href = "students.html");
document.getElementById("issueBookBtn").addEventListener("click", () => window.location.href = "issue-book.html");
document.getElementById("returnBookBtn").addEventListener("click", () => window.location.href = "return-book.html");

// ==========================================
// HEADER SEARCH -> jumps to Books page with the query
// ==========================================
const searchBook = document.getElementById("searchBook");
if (searchBook) {
    searchBook.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && this.value.trim()) {
            window.location.href = "books.html?q=" + encodeURIComponent(this.value.trim());
        }
    });
}

// ==========================================
// PROFILE MODAL
// ==========================================
const profileButton = document.getElementById("profileButton");
const profileModal = document.getElementById("profileModal");
const closeProfileModal = document.getElementById("closeProfileModal");
const editProfileBtn = document.getElementById("editProfileBtn");
const logoutBtn = document.getElementById("logoutBtn");

profileButton.addEventListener("click", () => profileModal.classList.add("show") || (profileModal.style.display = "flex"));
closeProfileModal.addEventListener("click", () => profileModal.style.display = "none");
window.addEventListener("click", (e) => { if (e.target === profileModal) profileModal.style.display = "none"; });

let editMode = false;
editProfileBtn.addEventListener("click", async function () {
    if (!editMode) {
        editMode = true;
        editProfileBtn.textContent = "Save Changes";
        return;
    }

    const name = document.getElementById("editName").value.trim();
    const phone = document.getElementById("editPhone").value.trim();
    const address = document.getElementById("editLibrary").value.trim();
    if (!name) {
        alert("Name cannot be empty.");
        return;
    }

    const res = await window.LibAPI.updateMyProfile(name, phone, address);
    if (!res.success) {
        alert(res.message);
        return;
    }

    document.getElementById("profileName").textContent = name;
    document.getElementById("modalProfileName").textContent = name;
    document.getElementById("modalPhone").textContent = phone || "Not set";
    editMode = false;
    editProfileBtn.textContent = "Edit Profile";
    alert("Profile updated successfully!");
});

logoutBtn.addEventListener("click", function () {
    if (!confirm("Are you sure you want to log out?")) return;
    window.LibAPI.logout();
    window.location.href = "login.html";
});

// ==========================================
// INITIAL LOAD
// ==========================================
loadDashboard();
