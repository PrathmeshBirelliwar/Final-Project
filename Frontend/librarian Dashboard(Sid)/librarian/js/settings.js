// ==========================================
// DATABASE
// ==========================================

const settings = DATABASE.settings;

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

const saveSettings = document.getElementById("saveSettings");

const resetSettings = document.getElementById("resetSettings");

const clearDatabase = document.getElementById("clearDatabase");

// ==========================================
// LOAD SETTINGS
// ==========================================

function loadSettings(){

    libraryName.value = settings.libraryName || "LibraryMS";

    libraryAddress.value = settings.libraryAddress || "";

    libraryContact.value = settings.libraryContact || "";

    libraryEmail.value = settings.libraryEmail || "";

    maxBooks.value = settings.maxBooksPerStudent || 3;

    loanDays.value = settings.loanDays || 15;

    finePerDay.value = settings.finePerDay || 5;

}

// ==========================================
// SAVE SETTINGS
// ==========================================

saveSettings.addEventListener("click", function(){

    settings.libraryName = libraryName.value.trim();

    settings.libraryAddress = libraryAddress.value.trim();

    settings.libraryContact = libraryContact.value.trim();

    settings.libraryEmail = libraryEmail.value.trim();

    settings.maxBooksPerStudent = Number(maxBooks.value);

    settings.loanDays = Number(loanDays.value);

    settings.finePerDay = Number(finePerDay.value);

    saveDatabase();

    alert("Settings saved successfully.");

});

// ==========================================
// RESTORE DEFAULT SETTINGS
// ==========================================

resetSettings.addEventListener("click", function(){

    const confirmReset = confirm("Restore default settings?");

    if(!confirmReset){

        return;

    }

    settings.libraryName = "LibraryMS";

    settings.libraryAddress = "";

    settings.libraryContact = "";

    settings.libraryEmail = "";

    settings.maxBooksPerStudent = 3;

    settings.loanDays = 15;

    settings.finePerDay = 5;

    saveDatabase();

    loadSettings();

    alert("Default settings restored.");

});

// ==========================================
// CLEAR DATABASE
// ==========================================

clearDatabase.addEventListener("click", function(){

    const confirmDelete = confirm("This will delete ALL library data. Continue?");

    if(!confirmDelete){

        return;

    }

    localStorage.clear();

    alert("All data deleted successfully.");

    location.reload();

});

// ==========================================
// INITIAL LOAD
// ==========================================

loadSettings();


