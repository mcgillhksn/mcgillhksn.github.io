(async function loadFragments() {
    const parts = [
      { targetId: "include-navbar", file: "navbar.html"},
      { targetId: "include-footer", file: "footer.html"},
    ];
  
    await Promise.all(
      parts.map(async ({ targetId, file }) => {
        const res  = await fetch(`./components/${file}`);
        const html = await res.text();
        document.getElementById(targetId).innerHTML = html;
      })
    );

    // Highlight active navbar link
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll("#include-navbar .nav-link");
    navLinks.forEach(link => {
        const linkPage = link.getAttribute("href").split("/").pop();
        if (linkPage === currentPage) {
            link.classList.remove("richLink");
            link.classList.add("richLinkHighlight");
        }
    });
  
    console.log("Fragments loaded, dispatching event...");
    document.dispatchEvent(new Event("fragmentsLoaded"));
})();