// ==========================================
// DATABASE
// ==========================================

const fines = DATABASE.fines;

// ==========================================
// ELEMENTS
// ==========================================

const tableBody = document.querySelector(".fine-table tbody");

const totalFineAmount = document.getElementById("totalFineAmount");

const pendingFine = document.getElementById("pendingFine");

const paidFine = document.getElementById("paidFine");

const totalFineRecords = document.getElementById("totalFineRecords");

const searchFine = document.getElementById("searchFine");

const payFineModal = document.getElementById("payFineModal");

const closeFineModal = document.getElementById("closeFineModal");

const cancelFineButton = document.querySelector(".cancel-btn");

const fineForm = document.getElementById("fineForm");

// ==========================================
// SELECTED FINE
// ==========================================

let selectedFineIndex = null;

// ==========================================
// CLOSE MODAL
// ==========================================

function closeModal(){

    payFineModal.style.display = "none";

}

closeFineModal.addEventListener("click", closeModal);

cancelFineButton.addEventListener("click", closeModal);

window.addEventListener("click", function(event){

    if(event.target === payFineModal){

        closeModal();

    }

});

// ==========================================
// LOAD DASHBOARD
// ==========================================

function loadCards(){

    let total = 0;

    let pending = 0;

    let paid = 0;

    fines.forEach(function(fine){

        total += Number(fine.fineAmount);

        if(fine.status === "Pending"){

            pending += Number(fine.fineAmount);

        }

        else{

            paid += Number(fine.fineAmount);

        }

    });

    totalFineAmount.textContent = "₹" + total;

    pendingFine.textContent = "₹" + pending;

    paidFine.textContent = "₹" + paid;

    totalFineRecords.textContent = fines.length;

}

// ==========================================
// LOAD TABLE
// ==========================================

function loadFineTable(){

    tableBody.innerHTML = "";

    fines.forEach(function(fine,index){

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${fine.fineId}</td>

            <td>${fine.studentName}</td>

            <td>${fine.bookName}</td>

            <td>${fine.lateDays}</td>

            <td>₹${fine.fineAmount}</td>

            <td>

                <span class="status ${fine.status.toLowerCase()}">

                    ${fine.status}

                </span>

            </td>

            <td>

                <button

                    class="pay-btn"

                    data-index="${index}"

                    ${fine.status==="Paid"?"disabled":""}>

                    <i class="fa-solid fa-wallet"></i>

                </button>

            </td>

        `;

        tableBody.appendChild(row);

    });

}// ==========================================
// OPEN PAY FINE MODAL
// ==========================================

document.addEventListener("click", function(event){

    const payButton = event.target.closest(".pay-btn");

    if(!payButton){

        return;

    }

    selectedFineIndex = Number(payButton.dataset.index);

    const fine = fines[selectedFineIndex];

    if(fine.status === "Paid"){

        alert("This fine has already been paid.");

        return;

    }

    document.getElementById("fineStudent").value = fine.studentName;

    document.getElementById("fineBook").value = fine.bookName;

    document.getElementById("fineLateDays").value = fine.lateDays;

    document.getElementById("fineAmount").value = "₹" + fine.fineAmount;

    payFineModal.style.display = "flex";

});

// ==========================================
// PAY FINE
// ==========================================

fineForm.addEventListener("submit", function(event){

    event.preventDefault();

    if(selectedFineIndex === null){

        return;

    }

    const fine = fines[selectedFineIndex];

    fine.status = "Paid";

    fine.paidDate = new Date().toISOString().split("T")[0];

    saveDatabase();

    loadCards();

    loadFineTable();

    closeModal();

    selectedFineIndex = null;

    alert("Fine paid successfully.");

});// ==========================================
// SEARCH
// ==========================================

searchFine.addEventListener("keyup", function(){

    const value = this.value.toLowerCase();

    const rows = document.querySelectorAll(".fine-table tbody tr");

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

// ==========================================
// REFRESH
// ==========================================

function refreshPage(){

    loadCards();

    loadFineTable();

}

// ==========================================
// INITIAL LOAD
// ==========================================

refreshPage();