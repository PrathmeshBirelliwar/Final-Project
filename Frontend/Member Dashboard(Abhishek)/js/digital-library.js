const resources = [

    {
        title: "Clean Code",
        type: "E-Book",
        author: "Robert C. Martin",
        icon: "fa-code"
    },

    {
        title: "Web Development Journal",
        type: "Journal",
        author: "Digital Library",
        icon: "fa-newspaper"
    },

    {
        title: "Database Research Papers",
        type: "Research",
        author: "Academic Collection",
        icon: "fa-file-lines"
    },

    {
        title: "JavaScript Handbook",
        type: "E-Book",
        author: "David Flanagan",
        icon: "fa-laptop-code"
    }

];


function loadResources() {

    const container =
        document.getElementById("digitalResources");


    resources.forEach(resource => {

        container.innerHTML += `

            <article class="resource-card">

                <div class="resource-cover">

                    <i class="fa-solid ${resource.icon}"></i>

                </div>


                <h3>
                    ${resource.title}
                </h3>


                <p>
                    ${resource.type}
                    •
                    ${resource.author}
                </p>


                <button class="read-btn"
                    onclick="openResource('${resource.title}')">

                    <i class="fa-solid fa-book-open"></i>

                    Open Resource

                </button>

            </article>

        `;

    });

}


function openResource(title) {

    alert(

        `Opening "${title}"...`

    );

}


document.addEventListener(

    "DOMContentLoaded",

    loadResources

);