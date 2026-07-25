/**
 * Smart Library Management System - Auth & Navigation Middleware (js/auth.js)
 * Manages route protection, session validation, and logout confirmation dialog.
 */

(function (window) {
    // Check Authentication for protected pages
    function checkAuth() {
        const path = window.location.pathname.toLowerCase();
        const isLoginPage = path.endsWith("login.html") || path === "/" || path.endsWith("/");
        const isLogoutPage = path.endsWith("logout.html");

        if (isLoginPage || isLogoutPage) return;

        if (!window.DB) {
            console.error("DB engine not loaded.");
            return;
        }

        const session = window.DB.getCurrentSession();
        if (!session) {
            alert("Session expired or unauthorized access. Redirecting to login...");
            window.location.href = "login.html";
        }
    }

    // Attach Logout confirmation listener on all links pointing to logout.html
    function initLogoutConfirmation() {
        document.addEventListener("DOMContentLoaded", function () {
            // Find all sidebar or navbar links pointing to logout.html
            const logoutLinks = document.querySelectorAll('a[href="logout.html"], a[href*="logout"]');

            logoutLinks.forEach(link => {
                link.addEventListener("click", function (e) {
                    e.preventDefault();
                    showLogoutModal();
                });
            });

            // Auto-highlight active sidebar link matching current page
            const currentPath = window.location.pathname.toLowerCase();
            const sidebarLinks = document.querySelectorAll('.sidebar a');
            sidebarLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && currentPath.endsWith(href.toLowerCase())) {
                    link.classList.add('active');
                }
            });
        });
    }

    // Create & Show Bootstrap / Custom Modal for Logout Confirmation
    function showLogoutModal() {
        // Check if modal container exists, else create it
        let modal = document.getElementById("logoutConfirmModal");
        if (!modal) {
            const modalHtml = `
            <div class="modal fade" id="logoutConfirmModal" tabindex="-1" aria-labelledby="logoutModalLabel" aria-hidden="true" style="z-index: 9999;">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content" style="border-radius: 20px; border: none; box-shadow: 0 20px 40px rgba(0,0,0,0.25);">
                        <div class="modal-header" style="background: linear-gradient(135deg, #4facfe, #00c6fb); color: white; border-top-left-radius: 20px; border-top-right-radius: 20px;">
                            <h5 class="modal-title fw-bold" id="logoutModalLabel"><i class="bi bi-box-arrow-right me-2"></i> Confirm Logout</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" id="btnCloseLogoutModal"></button>
                        </div>
                        <div class="modal-body text-center p-4">
                            <i class="bi bi-exclamation-circle text-warning" style="font-size: 50px;"></i>
                            <h4 class="mt-3 text-dark fw-semibold">Are you sure you want to logout?</h4>
                            <p class="text-muted fs-6">You will be logged out of your session and redirected to the login page.</p>
                        </div>
                        <div class="modal-footer justify-content-center border-0 pb-4">
                            <button type="button" class="btn btn-secondary px-4 py-2" style="border-radius: 25px;" data-bs-dismiss="modal" id="btnCancelLogout">Cancel</button>
                            <button type="button" class="btn btn-danger px-4 py-2" style="border-radius: 25px; background: linear-gradient(135deg, #ff416c, #ff4b2b); border: none;" id="btnConfirmLogout">Confirm Logout</button>
                        </div>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML("beforeend", modalHtml);
            modal = document.getElementById("logoutConfirmModal");
        }

        // Attach event listeners
        const confirmBtn = document.getElementById("btnConfirmLogout");
        const cancelBtn = document.getElementById("btnCancelLogout");
        const closeBtn = document.getElementById("btnCloseLogoutModal");

        function hideModal() {
            if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) bsModal.hide();
            } else {
                modal.style.display = "none";
                modal.classList.remove("show");
            }
        }

        confirmBtn.onclick = function () {
            hideModal();
            if (window.DB) {
                window.DB.logout();
            }
            window.location.href = "logout.html";
        };

        cancelBtn.onclick = hideModal;
        if (closeBtn) closeBtn.onclick = hideModal;

        if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        } else {
            // Fallback display if bootstrap JS is not loaded
            modal.style.display = "block";
            modal.classList.add("show");
        }
    }

    // Run auth check immediately
    function checkAuth() {
    const path = window.location.pathname.toLowerCase();

    const publicPages = [
        "login.html",
        "logout.html",
        "index.html"
    ];

    if (publicPages.some(page => path.endsWith(page)) || path.endsWith("/")) {
        return;
    }

    const token = sessionStorage.getItem("token");
    const user = sessionStorage.getItem("user");

    if (!token || !user) {
        alert("Session expired or unauthorized access. Redirecting to login...");
        window.location.href = "login.html";
        return;
    }
}
})(window);
