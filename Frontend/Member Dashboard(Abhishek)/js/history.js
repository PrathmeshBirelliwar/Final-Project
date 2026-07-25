// =====================================
// GET HISTORY
// =====================================

let history = [];


// =====================================
// LOAD PAGE
// =====================================

document.addEventListener(

    "DOMContentLoaded",

    displayHistory

);


// =====================================
// DISPLAY HISTORY
// =====================================

function displayHistory() {

    history = LibraryStore.getHistory();


    const container = document.getElementById(

        "historyList"

    );


    const emptyState = document.getElementById(

        "emptyHistory"

    );


    const totalHistory = document.getElementById(

        "totalHistory"

    );


    totalHistory.textContent =

        `${history.length} Books`;


    if (history.length === 0) {


        container.innerHTML = "";


        emptyState.style.display = "block";


        return;

    }


    emptyState.style.display = "none";


    container.innerHTML = "";


    // Show newest returned books first

    [...history].reverse().forEach(

        book => {


            const card = document.createElement(

                "div"

            );


            card.className = "history-card";


            card.innerHTML = `


                <div class="history-icon">

                    <i class="fa-solid fa-check"></i>

                </div>


                <div class="history-info">


                    <h3>

                        ${LibraryCatalog.getById(book.bookId)?.title || book.title}

                    </h3>


                    <p>

                        By ${LibraryCatalog.getById(book.bookId)?.author || book.author || "Unknown author"}

                    </p>


                    <div class="history-dates">


                        <div>

                            <span>Borrowed On</span>

                            <strong>

                                ${LibraryStore.dateLabel(book.borrowedDate)}

                            </strong>

                        </div>


                        <div>

                            <span>Returned On</span>

                            <strong>

                                ${LibraryStore.dateLabel(book.returnedDate)}

                            </strong>

                        </div>


                    </div>


                </div>


                <div>

                    <span class="returned-status">

                        Returned

                    </span>

                </div>

            `;


            container.appendChild(card);

        }

    );

}
