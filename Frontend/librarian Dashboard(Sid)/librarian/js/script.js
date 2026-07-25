// ===============================
// Sidebar Active Menu
// ===============================

const menuItems = document.querySelectorAll(".sidebar-nav ul li");

menuItems.forEach((item) => {

    item.addEventListener("click", () => {

        menuItems.forEach((menu) => {

            menu.classList.remove("active");

        });

        item.classList.add("active");

    });

});