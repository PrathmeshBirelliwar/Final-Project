// ===============================
// Mobile Menu (Future Ready)
// ===============================

const navLinks = document.querySelector(".nav-links");


// ===============================
// Smooth Scroll
// ===============================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

    anchor.addEventListener("click", function (e) {

        e.preventDefault();

        const target = document.querySelector(this.getAttribute("href"));

        if (target) {

            target.scrollIntoView({

                behavior: "smooth"

            });

        }

    });

});


// ===============================
// Active Navbar While Scrolling
// ===============================

const sections = document.querySelectorAll("section");
const navItems = document.querySelectorAll(".nav-links a");

window.addEventListener("scroll", () => {

    let current = "";

    sections.forEach(section => {

        const sectionTop = section.offsetTop - 120;
        const sectionHeight = section.clientHeight;

        if (pageYOffset >= sectionTop) {

            current = section.getAttribute("id");

        }

    });

    navItems.forEach(link => {

        link.classList.remove("active");

        if (link.getAttribute("href") === "#" + current) {

            link.classList.add("active");

        }

    });

});


// ===============================
// Navbar Shadow on Scroll
// ===============================

const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {

    if (window.scrollY > 60) {

        navbar.style.boxShadow = "0 10px 25px rgba(0,0,0,0.12)";

    } else {

        navbar.style.boxShadow = "none";

    }

});

// ===============================
// Login Buttons
// ===============================

const loginButtons = document.querySelectorAll(".login-card button");

loginButtons.forEach((button, index) => {

    button.addEventListener("click", () => {

        if (index === 0) {

            alert("Admin Login Page");

            // window.location.href = "admin-login.html";

        }

        else if (index === 1) {

            alert("Librarian Login Page");

            // window.location.href = "librarian-login.html";

        }

        else {

            alert("Member Login Page");

            // window.location.href = "member-login.html";

        }

    });

});


// ===============================
// Fade Animation on Scroll
// ===============================

const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            entry.target.classList.add("show");

        }

    });

}, {

    threshold: 0.2

});

document.querySelectorAll("section").forEach(section => {

    section.classList.add("hidden");

    observer.observe(section);

});


// ===============================
// End
// ===============================


