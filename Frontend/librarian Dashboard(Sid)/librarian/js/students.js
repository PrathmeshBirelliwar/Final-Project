// ==========================================
// AUTH GUARD
// ==========================================
if (!window.LibAPI.isLoggedIn()) {
    window.location.href = "login.html";
}

// ==========================================
// STATE
// ==========================================
let students = [];
let editingStudentId = null;

// ==========================================
// ELEMENTS
// ==========================================
const addStudentButton = document.querySelector(".add-student-btn");
const studentModal = document.getElementById("addStudentModal");
const closeStudentButton = document.getElementById("closeStudentModal");
const cancelStudentButton = document.querySelector(".cancel-btn");
const studentForm = document.getElementById("studentForm");
const searchStudent = document.getElementById("searchStudent");

// ==========================================
// OPEN / CLOSE MODAL
// ==========================================
addStudentButton.addEventListener("click", function () {
    studentForm.reset();
    editingStudentId = null;
    studentModal.style.display = "flex";
});

closeStudentButton.addEventListener("click", closeModal);
cancelStudentButton.addEventListener("click", closeModal);
window.addEventListener("click", function (event) {
    if (event.target === studentModal) closeModal();
});
function closeModal() {
    studentModal.style.display = "none";
}

// ==========================================
// LOAD STUDENTS
// ==========================================
async function loadStudents() {
    students = await window.LibAPI.getStudents();
    renderStudents(searchStudent ? searchStudent.value : "");
    const countEl = document.getElementById("totalStudentsCount");
    if (countEl) countEl.textContent = students.length;
}

function renderStudents(query) {
    const tableBody = document.querySelector(".students-table tbody");
    const term = (query || "").trim().toLowerCase();
    const visible = term
        ? students.filter(s => `${s.id} ${s.name} ${s.course} ${s.phone} ${s.email}`.toLowerCase().includes(term))
        : students;

    tableBody.innerHTML = "";
    visible.forEach(function (student) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.course || "-"}</td>
            <td>${student.year || "-"}</td>
            <td>${student.phone || "-"}</td>
            <td>
                <span class="status active">Active</span>
            </td>
            <td>
                <button class="edit-btn" data-id="${student.id}">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="delete-btn" data-id="${student.id}">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// ==========================================
// SAVE STUDENT (add or edit)
// ==========================================
studentForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const id = document.getElementById("studentId").value.trim();
    const name = document.getElementById("studentName").value.trim();
    const course = document.getElementById("studentCourse").value;
    const year = document.getElementById("studentYear").value;
    const phone = document.getElementById("studentPhone").value.trim();
    const email = document.getElementById("studentEmail") ? document.getElementById("studentEmail").value.trim() : "";

    if (id === "" || name === "" || course === "" || year === "" || phone === "" || email === "") {
        alert("Please fill all fields.");
        return;
    }

    const submitBtn = studentForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const payload = { id, name, course, year, phone, email };
    const res = editingStudentId
        ? await window.LibAPI.updateStudent(editingStudentId, payload)
        : await window.LibAPI.addStudent(payload);

    if (submitBtn) submitBtn.disabled = false;

    if (!res.success) {
        alert(res.message);
        return;
    }

    editingStudentId = null;
    await loadStudents();
    studentForm.reset();
    closeModal();
});

// ==========================================
// EDIT STUDENT
// ==========================================
document.addEventListener("click", function (event) {
    const editButton = event.target.closest(".edit-btn");
    if (!editButton) return;

    const student = students.find(s => s.id === editButton.dataset.id);
    if (!student) return;

    editingStudentId = student.id;
    document.getElementById("studentId").value = student.id;
    document.getElementById("studentName").value = student.name;
    document.getElementById("studentCourse").value = student.course || "";
    document.getElementById("studentYear").value = student.year || "";
    document.getElementById("studentPhone").value = student.phone || "";
    if (document.getElementById("studentEmail")) document.getElementById("studentEmail").value = student.email || "";

    studentModal.style.display = "flex";
});

// ==========================================
// DELETE STUDENT
// ==========================================
document.addEventListener("click", async function (event) {
    const deleteButton = event.target.closest(".delete-btn");
    if (!deleteButton) return;

    if (!confirm("Are you sure you want to delete this student?")) return;

    const res = await window.LibAPI.deleteStudent(deleteButton.dataset.id);
    if (!res.success) {
        alert(res.message);
        return;
    }
    await loadStudents();
});

// ==========================================
// LIVE SEARCH
// ==========================================
searchStudent.addEventListener("keyup", function () {
    renderStudents(this.value);
});

// ==========================================
// INITIAL LOAD
// ==========================================
loadStudents();
