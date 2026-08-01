// ==========================================
// AUTH GUARD
// ==========================================
if (!window.LibAPI.isLoggedIn()) {
    window.location.href = "login.html";
}

// ==========================================
// ELEMENTS
// ==========================================
const libraryName = document.getElementById("libraryName");
const libraryAddress = document.getElementById("libraryAddress");
const libraryContact = document.getElementById("libraryContact");
const libraryEmail = document.getElementById("libraryEmail");
const maxBooks = document.getElementById("maxBooks");
const loanDays = document.getElementById("loanDays");
const finePerDay = document.getElementById("finePerDay");
const saveSettingsBtn = document.getElementById("saveSettings");
const resetSettingsBtn = document.getElementById("resetSettings");
const clearDatabaseBtn = document.getElementById("clearDatabase");

const DEFAULTS = { libraryName: "Smart Library", libraryAddress: "", libraryContact: "", libraryEmail: "", maxBooksPerMember: 3, loanDays: 15, finePerDay: 5 };

// ==========================================
// LOAD SETTINGS — these are the real, live values enforced by the backend
// for every borrow, renewal, and fine calculation across the whole system.
// ==========================================
function fillForm(settings) {
    libraryName.value = settings.libraryName;
    libraryAddress.value = settings.libraryAddress;
    libraryContact.value = settings.libraryContact;
    libraryEmail.value = settings.libraryEmail;
    maxBooks.value = settings.maxBooksPerMember;
    loanDays.value = settings.loanDays;
    finePerDay.value = settings.finePerDay;
}

async function loadSettings() {
    const settings = await window.LibAPI.getSettings();
    fillForm(settings || DEFAULTS);
}

// ==========================================
// SAVE SETTINGS
// ==========================================
saveSettingsBtn.addEventListener("click", async function () {
    saveSettingsBtn.disabled = true;

    const res = await window.LibAPI.saveSettings({
        libraryName: libraryName.value.trim(),
        libraryAddress: libraryAddress.value.trim(),
        libraryContact: libraryContact.value.trim(),
        libraryEmail: libraryEmail.value.trim(),
        maxBooksPerMember: Number(maxBooks.value),
        loanDays: Number(loanDays.value),
        finePerDay: Number(finePerDay.value),
    });

    saveSettingsBtn.disabled = false;
    alert(res.message);
    if (res.success) await loadSettings();
});

// ==========================================
// RESTORE DEFAULT SETTINGS
// ==========================================
resetSettingsBtn.addEventListener("click", async function () {
    if (!confirm("Restore default settings for the whole system?")) return;
    fillForm(DEFAULTS);
    const res = await window.LibAPI.saveSettings(DEFAULTS);
    alert(res.success ? "Default settings restored." : res.message);
    if (res.success) await loadSettings();
});

// ==========================================
// CLEAR LOCAL SESSION (this does NOT touch the live library database)
// ==========================================
clearDatabaseBtn.addEventListener("click", function () {
    if (!confirm("This clears your saved login and preferences on this device only — it will NOT delete any books, students, or records from the library database. Continue?")) return;
    localStorage.removeItem("rememberUser");
    window.LibAPI.logout();
    alert("Local data cleared. You'll be redirected to the login page.");
    window.location.href = "login.html";
});

// ==========================================
// INITIAL LOAD
// ==========================================
loadSettings();
