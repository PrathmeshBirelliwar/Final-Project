// ==========================================
// DATABASE
// ==========================================

const students = DATABASE.students;

// ==========================================
// ELEMENTS
// ==========================================

const addStudentButton = document.querySelector(".add-student-btn");

const studentModal = document.getElementById("addStudentModal");

const closeStudentButton = document.getElementById("closeStudentModal");

const cancelStudentButton = document.querySelector(".cancel-btn");

const studentForm = document.getElementById("studentForm");

const searchStudent = document.getElementById("searchStudent");

const tableBody = document.querySelector(".students-table tbody");

// ==========================================
// EDIT MODE
// ==========================================

let editIndex = null;

// ==========================================
// OPEN MODAL
// ==========================================

addStudentButton.addEventListener("click", function(){

    studentForm.reset();

    editIndex = null;

    studentModal.style.display = "flex";

});

// ==========================================
// CLOSE MODAL
// ==========================================

closeStudentButton.addEventListener("click", closeModal);

cancelStudentButton.addEventListener("click", closeModal);

window.addEventListener("click", function(event){

    if(event.target === studentModal){

        closeModal();

    }

});

function closeModal(){

    studentModal.style.display = "none";

}// ==========================================
// LOAD STUDENTS
// ==========================================

function loadStudents(){

    tableBody.innerHTML = "";

    students.forEach(function(student, index){

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${student.id}</td>

            <td>${student.name}</td>

            <td>${student.course}</td>

            <td>${student.year}</td>

            <td>${student.phone}</td>

            <td>

                <span class="status active">

                    Active

                </span>

            </td>

            <td>

                <button
                    class="edit-btn"
                    data-index="${index}">

                    <i class="fa-solid fa-pen"></i>

                </button>

                <button
                    class="delete-btn"
                    data-index="${index}">

                    <i class="fa-solid fa-trash"></i>

                </button>

            </td>

        `;

        tableBody.appendChild(row);

    });

}

// ==========================================
// INITIAL LOAD
// ==========================================

loadStudents();// ==========================================
// SAVE STUDENT
// ==========================================

studentForm.addEventListener("submit", function(event){

    event.preventDefault();

    const id = document.getElementById("studentId").value.trim();

    const name = document.getElementById("studentName").value.trim();

    const course = document.getElementById("studentCourse").value;

    const year = document.getElementById("studentYear").value;

    const phone = document.getElementById("studentPhone").value.trim();

    if(
        id === "" ||
        name === "" ||
        course === "" ||
        year === "" ||
        phone === ""
    ){

        alert("Please fill all fields.");

        return;

    }

    const student = {

        id: id,

        name: name,

        course: course,

        year: year,

        phone: phone

    };

    if(editIndex === null){

        students.push(student);

    }

    else{

        students[editIndex] = student;

        editIndex = null;

    }

    saveDatabase();

    loadStudents();

    studentForm.reset();

    closeModal();

});// ==========================================
// EDIT STUDENT
// ==========================================

document.addEventListener("click", function(event){

    const editButton = event.target.closest(".edit-btn");

    if(!editButton){

        return;

    }

    editIndex = Number(editButton.dataset.index);

    const student = students[editIndex];

    document.getElementById("studentId").value = student.id;

    document.getElementById("studentName").value = student.name;

    document.getElementById("studentCourse").value = student.course;

    document.getElementById("studentYear").value = student.year;

    document.getElementById("studentPhone").value = student.phone;

    studentModal.style.display = "flex";

});// ==========================================
// DELETE STUDENT
// ==========================================

document.addEventListener("click", function(event){

    const deleteButton = event.target.closest(".delete-btn");

    if(!deleteButton){

        return;

    }

    const index = Number(deleteButton.dataset.index);

    const confirmDelete = confirm("Are you sure you want to delete this student?");

    if(!confirmDelete){

        return;

    }

    students.splice(index, 1);

    saveDatabase();

    loadStudents();

});

// ==========================================
// LIVE SEARCH
// ==========================================

searchStudent.addEventListener("keyup", function(){

    const value = searchStudent.value.toLowerCase();

    const rows = document.querySelectorAll(".students-table tbody tr");

    rows.forEach(function(row){

        const text = row.textContent.toLowerCase();

        if(text.includes(value)){

            row.style.display = "";

        }

        else{

            row.style.display = "none";

        }

    });

});