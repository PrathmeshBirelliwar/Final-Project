// ===============================
// LOGIN SYSTEM (real backend)
// ===============================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const errorMessage = document.getElementById("errorMessage");
        errorMessage.textContent = "";

        if (email === "" || password === "") {
            errorMessage.textContent = "Please enter both email and password.";
            return;
        }

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        const res = await window.LibraryStore.login(email, password);

        if (submitBtn) submitBtn.disabled = false;

        if (res.success) {
            window.location.href = "pages/dashboard.html";
        } else {
            errorMessage.textContent = res.message || "Invalid email or password.";
        }
    });
}

// ===============================
// SHOW / HIDE PASSWORD
// ===============================

function togglePassword() {
    const passwordInput = document.getElementById("password");
    const eyeIcon = document.getElementById("eyeIcon");

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        eyeIcon.classList.remove("fa-eye");
        eyeIcon.classList.add("fa-eye-slash");
    } else {
        passwordInput.type = "password";
        eyeIcon.classList.remove("fa-eye-slash");
        eyeIcon.classList.add("fa-eye");
    }
}
