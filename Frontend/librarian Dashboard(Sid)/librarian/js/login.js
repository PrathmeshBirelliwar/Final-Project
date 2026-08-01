// ==========================================
// ELEMENTS
// ==========================================

const loginForm = document.getElementById("loginForm");
const username = document.getElementById("username");
const password = document.getElementById("password");
const rememberMe = document.getElementById("rememberMe");
const loginError = document.getElementById("loginError");
const togglePassword = document.getElementById("togglePassword");

// ==========================================
// SHOW / HIDE PASSWORD
// ==========================================

togglePassword.addEventListener("click", function () {
    if (password.type === "password") {
        password.type = "text";
        togglePassword.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    } else {
        password.type = "password";
        togglePassword.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
});

// ==========================================
// LOGIN (real backend, JWT-based)
// ==========================================

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const user = username.value.trim();
    const pass = password.value.trim();
    loginError.textContent = "";

    if (!user || !pass) {
        loginError.textContent = "Please enter your email/ID and password.";
        return;
    }

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const res = await window.LibAPI.login(user, pass);

    if (submitBtn) submitBtn.disabled = false;

    if (res.success) {
        if (rememberMe.checked) {
            localStorage.setItem("rememberUser", user);
        } else {
            localStorage.removeItem("rememberUser");
        }
        window.location.href = "index.html";
    } else {
        loginError.textContent = res.message || "Invalid email/ID or password.";
    }
});

// ==========================================
// REMEMBER USERNAME
// ==========================================

const rememberedUser = localStorage.getItem("rememberUser");
if (rememberedUser) {
    username.value = rememberedUser;
    rememberMe.checked = true;
}

// ==========================================
// FORGOT PASSWORD
// (Email-based reset isn't wired to an email service in this deployment;
//  point librarians to the admin instead of pretending it works.)
// ==========================================

const forgotPassword = document.getElementById("forgotPassword");
const forgotModal = document.getElementById("forgotModal");
const closeForgotModal = document.getElementById("closeForgotModal");
const savePassword = document.getElementById("savePassword");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");

forgotPassword.addEventListener("click", function (event) {
    event.preventDefault();
    forgotModal.style.display = "flex";
});

closeForgotModal.addEventListener("click", function () {
    forgotModal.style.display = "none";
});

window.addEventListener("click", function (event) {
    if (event.target === forgotModal) {
        forgotModal.style.display = "none";
    }
});

savePassword.addEventListener("click", function () {
    newPassword.value = "";
    confirmPassword.value = "";
    forgotModal.style.display = "none";
    alert("Self-service password reset isn't available yet. Please ask your library administrator to reset your password from the Admin panel.");
});
