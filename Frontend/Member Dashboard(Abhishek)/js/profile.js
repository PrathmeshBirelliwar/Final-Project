document.addEventListener("DOMContentLoaded", async function () {
    await window.LibraryStore.ready();

    const profile = getMemberProfile();
    const form = document.getElementById("profileForm");
    const fullName = document.getElementById("fullName");
    const email = document.getElementById("emailAddress");
    const phone = document.getElementById("phoneNumber");
    const membership = document.getElementById("membershipType");

    fullName.value = profile.fullName;
    email.value = profile.email;
    email.disabled = true; // email is your login ID, so it isn't editable here
    email.title = "Your email is your login ID and can't be changed here.";
    phone.value = profile.phone;
    if (membership) membership.value = profile.membership;
    document.getElementById("profileName").textContent = profile.fullName;
    document.getElementById("largeAvatar").textContent = (profile.fullName || "M").trim().charAt(0).toUpperCase() || "M";

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        const result = await window.LibraryStore.saveProfile({
            name: fullName.value.trim(),
            phone: phone.value.trim(),
        });

        if (submitBtn) submitBtn.disabled = false;

        if (!result.ok) {
            alert(result.message);
            return;
        }

        document.getElementById("profileName").textContent = fullName.value.trim();
        document.getElementById("largeAvatar").textContent = fullName.value.trim().charAt(0).toUpperCase();
        updateMemberIdentity();
        alert("Profile updated successfully!");
    });
});

function changePassword() {
    window.location.href = "../change-password.html";
}
