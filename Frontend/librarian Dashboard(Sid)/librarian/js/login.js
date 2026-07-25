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
// LOGIN
// ==========================================

loginForm.addEventListener("submit", function(event){

    event.preventDefault();

    const user = username.value.trim();

    const pass = password.value.trim();

    if(

        user === defaultUser.username &&

        pass === defaultUser.password

    ){

        sessionStorage.setItem(

    "isLoggedIn",

    "true"

); 

        if(rememberMe.checked){

            localStorage.setItem(

                "rememberUser",

                user

            );

        }

        else{

            localStorage.removeItem(

                "rememberUser"

            );

        }

        window.location.href = "index.html";

    }

    else{

        loginError.textContent =

        "Invalid username or password.";

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