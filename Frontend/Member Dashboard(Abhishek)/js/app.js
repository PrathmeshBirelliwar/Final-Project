/* Shared identity, navigation, and route guard — backed by the real backend session. */
(function () {
    const isMemberPage = () => /[\\/]pages[\\/]/.test(window.location.pathname) || /\/pages\//.test(window.location.pathname);
    const loginPath = () => isMemberPage() ? "../login.html" : "login.html";

    window.getMemberProfile = function () {
        const session = window.LibraryStore ? LibraryStore.getSession() : null;
        const cached = window.LibraryStore ? LibraryStore.getProfile() : {};
        return {
            fullName: cached.name || (session && session.name) || "Member",
            email: cached.email || (session && session.email) || "",
            phone: cached.phone || "",
            membership: cached.membership || "Student Member",
            memberId: (session && session.id) || cached.id,
            memberSince: cached.memberSince || "",
        };
    };

    window.updateMemberIdentity = function () {
        const profile = getMemberProfile();
        const initial = (profile.fullName.trim().charAt(0) || "M").toUpperCase();
        document.querySelectorAll(".profile-mini").forEach(mini => {
            const avatar = mini.querySelector(".avatar"), name = mini.querySelector("h4"), role = mini.querySelector("p");
            if (avatar) avatar.textContent = initial;
            if (name) name.textContent = profile.fullName;
            if (role) role.textContent = "Member";
        });
        const greeting = document.getElementById("dashboardGreeting");
        if (greeting) greeting.textContent = `Good Morning, ${profile.fullName} \ud83d\udc4b`;
    };

    window.logout = function () {
        if (confirm("Are you sure you want to logout?")) {
            if (window.LibraryStore) LibraryStore.logout();
            window.location.href = loginPath();
        }
    };

    document.addEventListener("DOMContentLoaded", async () => {
        const loggedIn = window.LibraryStore && LibraryStore.isLoggedIn();
        if (isMemberPage() && !loggedIn) {
            window.location.replace(loginPath());
            return;
        }
        if (window.LibraryStore) await LibraryStore.ready();
        updateMemberIdentity();
    });
}());
