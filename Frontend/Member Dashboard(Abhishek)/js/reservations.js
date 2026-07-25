// =====================================
// GET RESERVATIONS
// =====================================

let reservations = [];


// =====================================
// LOAD RESERVATIONS
// =====================================

document.addEventListener(

    "DOMContentLoaded",

    function () {

        displayReservations();

        updateReservationSummary();

    }

);


// =====================================
// DISPLAY RESERVATIONS
// =====================================

function displayReservations() {

    reservations = LibraryStore.getReservations();


    const container = document.getElementById(

        "reservationsList"

    );


    const emptyState = document.getElementById(

        "emptyReservations"

    );


    if (reservations.length === 0) {

        container.innerHTML = "";

        emptyState.style.display = "block";

        return;

    }


    emptyState.style.display = "none";


    container.innerHTML = "";


    reservations.forEach(

        (reservation, index) => {


            const card = document.createElement(

                "div"

            );


            card.className = "reservation-card";


            card.innerHTML = `

                <div class="reservation-icon">

                    <i class="fa-solid fa-book"></i>

                </div>


                <div class="reservation-info">

                    <h3>

                        ${LibraryCatalog.getById(reservation.bookId)?.title || "Unknown book"}

                    </h3>


                    <p>

                        By ${LibraryCatalog.getById(reservation.bookId)?.author || "Unknown author"}

                    </p>


                    <div class="reservation-date">

                        Reserved on:

                        ${LibraryStore.dateLabel(reservation.reservedDate)}

                    </div>

                </div>


                <div class="reservation-actions">

                    <span class="reservation-status">

                        ${reservation.status}

                    </span>


                    <button

                        class="cancel-btn"

                        onclick="cancelReservation(${index})">

                        Cancel Reservation

                    </button>

                </div>

            `;


            container.appendChild(card);

        }

    );

}


// =====================================
// UPDATE SUMMARY
// =====================================

function updateReservationSummary() {


    document.getElementById(

        "activeReservations"

    ).textContent = reservations.length;


    document.getElementById(

        "pendingReservations"

    ).textContent = reservations.filter(

        reservation => reservation.status === "Pending"

    ).length;


    document.getElementById(

        "readyReservations"

    ).textContent = reservations.filter(

        reservation => reservation.status === "Ready"

    ).length;

}


// =====================================
// CANCEL RESERVATION
// =====================================

function cancelReservation(index) {


    const reservation = reservations[index];


    const confirmCancel = confirm(

        `Cancel reservation for "${LibraryCatalog.getById(reservation.bookId)?.title || "this book"}"?`

    );


    if (!confirmCancel) return;


    reservations.splice(index, 1);


    LibraryStore.saveReservations(reservations);


    displayReservations();

    updateReservationSummary();


    alert(

        "Reservation cancelled successfully."

    );

}
