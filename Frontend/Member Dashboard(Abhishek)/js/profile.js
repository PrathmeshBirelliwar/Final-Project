document.addEventListener("DOMContentLoaded", function () {
    const profile = getMemberProfile();
    const form = document.getElementById("profileForm");
    const fullName = document.getElementById("fullName");
    const email = document.getElementById("emailAddress");
    const phone = document.getElementById("phoneNumber");
    const membership = document.getElementById("membershipType");

    fullName.value = profile.fullName;
    email.value = profile.email;
    phone.value = profile.phone;
    membership.value = profile.membership;
    document.getElementById("profileName").textContent = profile.fullName;
    document.getElementById("largeAvatar").textContent = profile.fullName.trim().charAt(0).toUpperCase() || "M";

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        const savedProfile = {
            ...profile,
            fullName: fullName.value.trim() || DEFAULT_MEMBER_PROFILE.fullName,
            email: email.value.trim(),
            phone: phone.value.trim()
        };
        LibraryStore.saveProfile(savedProfile);
        document.getElementById("profileName").textContent = savedProfile.fullName;
        document.getElementById("largeAvatar").textContent = savedProfile.fullName.charAt(0).toUpperCase();
        updateMemberIdentity();
        alert("Profile updated successfully!");
    });
});


function changePassword() {

    alert(

        "Password change feature will be connected to the backend."

    );

}
