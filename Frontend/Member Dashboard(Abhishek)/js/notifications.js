function timeAgo(isoString) {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
}

async function loadNotifications() {
    await window.LibraryStore.ready();
    const notifications = window.LibraryStore.getNotifications();
    const container = document.getElementById("notificationList");

    if (!notifications.length) {
        container.innerHTML = '<p style="text-align:center; padding: 24px; color:#888;">No notifications yet.</p>';
        return;
    }

    container.innerHTML = notifications.map(notification => `
        <article class="notification-card ${notification.unread ? "unread" : ""}">
            <div class="notification-icon"><i class="fa-solid ${notification.icon || "fa-circle-info"}"></i></div>
            <div class="notification-content">
                <h3>${notification.title}</h3>
                <p>${notification.message}</p>
            </div>
            <span class="notification-time">${timeAgo(notification.time)}</span>
        </article>
    `).join("");
}

async function markAllRead() {
    await window.LibraryStore.markAllNotificationsRead();
    document.querySelectorAll(".notification-card").forEach(card => card.classList.remove("unread"));
    alert("All notifications marked as read.");
}

document.addEventListener("DOMContentLoaded", loadNotifications);
