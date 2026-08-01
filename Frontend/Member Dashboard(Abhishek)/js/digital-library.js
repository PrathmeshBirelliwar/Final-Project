const RESOURCE_ICONS = {
    "E-Book": "fa-book",
    "Journal": "fa-newspaper",
    "Research": "fa-file-lines",
};

let allResources = [];
let activeType = "all";
let searchQuery = "";

function renderResources() {
    const container = document.getElementById("digitalResources");
    const query = searchQuery.trim().toLowerCase();

    const visible = allResources.filter(resource =>
        (activeType === "all" || resource.resourceType === activeType) &&
        (!query || `${resource.title} ${resource.author}`.toLowerCase().includes(query))
    );

    if (!visible.length) {
        container.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#888;">No digital resources match your search.</p>';
        return;
    }

    container.innerHTML = visible.map(resource => `
        <article class="resource-card">
            <div class="resource-cover">
                <i class="fa-solid ${RESOURCE_ICONS[resource.resourceType] || "fa-book"}"></i>
            </div>
            <h3>${resource.title}</h3>
            <p>${resource.resourceType || "E-Book"} &bull; ${resource.author}</p>
            <button class="read-btn" type="button" data-book-id="${resource.id}">
                <i class="fa-solid fa-book-open"></i>
                Open Resource
            </button>
        </article>
    `).join("");
}

async function loadResources() {
    const container = document.getElementById("digitalResources");
    container.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#888;">Loading digital resources&hellip;</p>';
    allResources = await window.LibraryCatalog.getDigitalResources();
    renderResources();
}

function openResource(id) {
    // Full digital reading isn't implemented yet, so this takes the member to
    // that book's real details page (library location, availability, etc.)
    // instead of a fake "opening" alert.
    window.location.href = `book-details.html?book=${encodeURIComponent(id)}`;
}

document.addEventListener("DOMContentLoaded", () => {
    loadResources();

    document.getElementById("digitalResources").addEventListener("click", event => {
        const button = event.target.closest("button[data-book-id]");
        if (button) openResource(button.dataset.bookId);
    });

    document.getElementById("digitalSearch")?.addEventListener("input", event => {
        searchQuery = event.target.value;
        renderResources();
    });

    document.querySelectorAll(".resource-filters button[data-type]").forEach(button => {
        button.addEventListener("click", () => {
            activeType = button.dataset.type;
            document.querySelectorAll(".resource-filters button").forEach(item => item.classList.toggle("active", item === button));
            renderResources();
        });
    });
});
