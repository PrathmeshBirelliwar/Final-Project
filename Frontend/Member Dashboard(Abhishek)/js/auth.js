// ===============================
// LOGIN SYSTEM
// ===============================


const loginForm =
    document.getElementById("loginForm");


if (loginForm) {


    loginForm.addEventListener(

        "submit",

        function (event) {


            event.preventDefault();


            const email =
                document.getElementById("email").value;


            const password =
                document.getElementById("password").value;


            const errorMessage =
                document.getElementById("errorMessage");


            // DEMO LOGIN

            if (

                email.trim() !== ""

                &&

                password.trim() !== ""

            ) {


                // Save login status

                localStorage.setItem(

                    "isLoggedIn",

                    "true"

                );


                localStorage.setItem("memberEmail", email.trim().toLowerCase());
                const memberId = `member-${email.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "demo-member"}`;
                localStorage.setItem("library_auth", JSON.stringify({
                    memberId,
                    email: email.trim().toLowerCase(),
                    fullName: email.trim().split("@")[0] || "Member",
                    membership: "Student Member",
                    memberSince: "2025"
                }));


                // Redirect to dashboard

                window.location.href =
                    "pages/dashboard.html";


            }

            else {


                errorMessage.textContent =

                    "Please enter both email and password.";

            }

        }

    );

}


// ===============================
// SHOW / HIDE PASSWORD
// ===============================


function togglePassword() {


    const passwordInput =
        document.getElementById("password");


    const eyeIcon =
        document.getElementById("eyeIcon");


    if (

        passwordInput.type === "password"

    ) {


        passwordInput.type = "text";


        eyeIcon.classList.remove(
            "fa-eye"
        );


        eyeIcon.classList.add(
            "fa-eye-slash"
        );

    }

    else {


        passwordInput.type = "password";


        eyeIcon.classList.remove(
            "fa-eye-slash"
        );


        eyeIcon.classList.add(
            "fa-eye"
        );

    }

}
