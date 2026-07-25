/* Shared identity, navigation, and route guard. */
(function () {
    const isMemberPage = () => /[\\/]pages[\\/]/.test(window.location.pathname) || /\/pages\//.test(window.location.pathname);
    const loginPath = () => isMemberPage() ? "../login.html" : "login.html";
    const auth = () => { try { return JSON.parse(localStorage.getItem("library_auth")); } catch (_) { return null; } };
    window.getMemberProfile = function () {
        const member = auth() || { memberId: "demo-member", email: "akshay@example.com", fullName: "Akshay", membership: "Student Member", memberSince: "2025" };
        const legacy = (() => { try { return JSON.parse(localStorage.getItem("memberProfile")) || {}; } catch (_) { return {}; } })();
        const saved = window.LibraryStore ? LibraryStore.getProfile() : legacy;
        return { fullName: saved.fullName || member.fullName || legacy.fullName || "Akshay", email: saved.email || member.email || legacy.email || "akshay@example.com", phone: saved.phone || legacy.phone || "+91 98765 43210", membership: member.membership || legacy.membership || "Student Member", memberId: member.memberId, memberSince: member.memberSince || "2025" };
    };
    window.updateMemberIdentity = function () {
        const profile = getMemberProfile(), initial = (profile.fullName.trim().charAt(0) || "M").toUpperCase();
        document.querySelectorAll(".profile-mini").forEach(mini => { const avatar = mini.querySelector(".avatar"), name = mini.querySelector("h4"), role = mini.querySelector("p"); if (avatar) avatar.textContent = initial; if (name) name.textContent = profile.fullName; if (role) role.textContent = "Member"; });
        const greeting = document.getElementById("dashboardGreeting"); if (greeting) greeting.textContent = `Good Morning, ${profile.fullName} 👋`;
    };
    window.logout = function () { if (confirm("Are you sure you want to logout?")) { localStorage.removeItem("isLoggedIn"); localStorage.removeItem("memberEmail"); localStorage.removeItem("library_auth"); window.location.href = loginPath(); } };
    document.addEventListener("DOMContentLoaded", () => {
        if (isMemberPage() && (!auth() && localStorage.getItem("isLoggedIn") !== "true")) { window.location.replace(loginPath()); return; }
        updateMemberIdentity();
    });
}());
