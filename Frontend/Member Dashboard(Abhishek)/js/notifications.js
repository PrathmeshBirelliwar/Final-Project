const notifications = [

    {
        icon: "fa-calendar-check",
        title: "Book Due Soon",
        message: "Clean Code is due in 2 days.",
        time: "2 hours ago",
        unread: true
    },

    {
        icon: "fa-bookmark",
        title: "Reservation Confirmed",
        message: "Your reservation has been successfully created.",
        time: "Yesterday",
        unread: true
    },

    {
        icon: "fa-circle-info",
        title: "Library Announcement",
        message: "The library will remain closed on Sunday.",
        time: "2 days ago",
        unread: false
    }

];


function loadNotifications() {

    const container =
        document.getElementById("notificationList");


    notifications.forEach(notification => {

        container.innerHTML += `

            <article class="notification-card
                ${notification.unread ? "unread" : ""}">

                <div class="notification-icon">

                    <i class="fa-solid
                        ${notification.icon}"></i>

                </div>


                <div class="notification-content">

                    <h3>
                        ${notification.title}
                    </h3>


                    <p>
                        ${notification.message}
                    </p>

                </div>


                <span class="notification-time">

                    ${notification.time}

                </span>

            </article>

        `;

    });

}


function markAllRead() {

    document

        .querySelectorAll(".notification-card")

        .forEach(card => {

            card.classList.remove("unread");

        });


    alert("All notifications marked as read.");

}


document.addEventListener(

    "DOMContentLoaded",

    loadNotifications

);