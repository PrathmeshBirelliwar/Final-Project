// ========================================
// CHANGE PASSWORD
// ========================================

const form = document.getElementById("changePasswordForm");
const message = document.getElementById("message");

form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const currentPassword = document
        .getElementById("currentPassword")
        .value.trim();

    const newPassword = document
        .getElementById("newPassword")
        .value.trim();

    const confirmPassword = document
        .getElementById("confirmPassword")
        .value.trim();

    message.style.color = "red";
    message.textContent = "";

    if (!currentPassword || !newPassword || !confirmPassword) {
        message.textContent = "Please fill all fields.";
        return;
    }

    if (newPassword.length < 6) {
        message.textContent = "Password must be at least 6 characters.";
        return;
    }

    if (newPassword !== confirmPassword) {
        message.textContent = "Passwords do not match.";
        return;
    }

    const res = await window.LibraryStore.changePassword(
        currentPassword,
        newPassword
    );

    if (res.success || res.ok) {
        message.style.color = "green";
        message.textContent = "Password changed successfully.";

                setTimeout(() => {
            window.LibraryStore.logout();
            window.location.href = "login.html";
        }, 1500);
    } else {
        message.style.color = "red";
        message.textContent =
            res.message || "Unable to change password.";
    }
});