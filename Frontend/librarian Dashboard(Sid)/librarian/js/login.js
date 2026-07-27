// ==========================================
// DEFAULT LOGIN
// ==========================================

const defaultUser = {

    username: "admin",

    password:

        localStorage.getItem("adminPassword")

        || "admin123"

};
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

togglePassword.addEventListener("click", function(){

    if(password.type === "password"){

        password.type = "text";

        togglePassword.innerHTML =

        '<i class="fa-solid fa-eye-slash"></i>';

    }

    else{

        password.type = "password";

        togglePassword.innerHTML =

        '<i class="fa-solid fa-eye"></i>';

    }

});


// ==========================================
// LOGIN (BACKEND)
// ==========================================

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    loginError.textContent = "";

    try {

        const response = await fetch("http://localhost:5000/api/auth/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                identifier: username.value.trim(),

                password: password.value.trim(),

                role: "Admin"

            })

        });

        const result = await response.json();

        if (!response.ok) {

            loginError.textContent =
                result.message || "Login failed.";

            return;

        }

        // Save JWT Token
        sessionStorage.setItem("token", result.token);

        // Save Logged In User
        sessionStorage.setItem(
            "user",
            JSON.stringify(result.user)
        );

        // Remember Username
        if (rememberMe.checked) {

            localStorage.setItem(
                "rememberUser",
                username.value.trim()
            );

        } else {

            localStorage.removeItem(
                "rememberUser"
            );

        }

        // Go Dashboard
        window.location.href = "index.html";

    } catch (err) {

        console.error(err);

        loginError.textContent =
            "Unable to connect to server.";

    }

});

// ==========================================
// REMEMBER USERNAME
// ==========================================

const rememberedUser =

localStorage.getItem("rememberUser");

if(rememberedUser){

    username.value = rememberedUser;

    rememberMe.checked = true;

}// ==========================================
// FORGOT PASSWORD
// ==========================================

const forgotPassword = document.getElementById("forgotPassword");

const forgotModal = document.getElementById("forgotModal");

const closeForgotModal = document.getElementById("closeForgotModal");

const savePassword = document.getElementById("savePassword");

const newPassword = document.getElementById("newPassword");

const confirmPassword = document.getElementById("confirmPassword");

// Open Modal

forgotPassword.addEventListener("click", function(event){

    event.preventDefault();

    forgotModal.style.display = "flex";

});

// Close Modal

closeForgotModal.addEventListener("click", function(){

    forgotModal.style.display = "none";

});

// Close Outside

window.addEventListener("click", function(event){

    if(event.target === forgotModal){

        forgotModal.style.display = "none";

    }

});

// Save Password

savePassword.addEventListener("click", function(){

    const pass1 = newPassword.value.trim();

    const pass2 = confirmPassword.value.trim();

    if(pass1 === "" || pass2 === ""){

        alert("Please fill all fields.");

        return;

    }

    if(pass1 !== pass2){

        alert("Passwords do not match.");

        return;

    }

    localStorage.setItem("adminPassword", pass1);

    alert("Password updated successfully.");

    forgotModal.style.display = "none";

    newPassword.value = "";

    confirmPassword.value = "";

});