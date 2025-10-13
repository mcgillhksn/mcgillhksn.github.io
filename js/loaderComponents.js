// Load common HTML fragments (navbar, footer) into the page
(async function loadFragments() {
    const parts = [
      { targetId: "include-navbar", file: "navbar.html"},
      { targetId: "include-footer", file: "footer.html"},
    ];
  
    const basePath = siteConfig.getBasePath();
    const componentBasePath = `${basePath}components/`;
  
    await Promise.all(
      parts.map(async ({ targetId, file }) => {
        const res  = await fetch(`${componentBasePath}${file}`);
        const html = await res.text();
        document.getElementById(targetId).innerHTML = html;
      })
    );

    // Fix asset paths and navigation links in navbar if we're in a subdirectory
    if (basePath === '../') {
        const navbarLogo = document.querySelector('#include-navbar img[src="./assets/logo/logoText.png"]');
        if (navbarLogo) {
            navbarLogo.src = '../assets/logo/logoText.png';
        }
        
        // Fix ALL navigation links to use correct relative paths from subdirectory
        const homeLinks = document.querySelectorAll('#include-navbar a[href="./"]');
        homeLinks.forEach(link => {
            link.href = '../';
        });
        
        const aboutLinks = document.querySelectorAll('#include-navbar a[href="./about"]');
        aboutLinks.forEach(link => {
            link.href = '../about/';
        });
        
        const eventsLinks = document.querySelectorAll('#include-navbar a[href="./events"]');
        eventsLinks.forEach(link => {
            link.href = '../events/';
        });
        
        const storeLinks = document.querySelectorAll('#include-navbar a[href="./store"]');
        storeLinks.forEach(link => {
            link.href = '../store/';
        });
    }

    // Highlight active navbar link
    const navLinks = document.querySelectorAll("#include-navbar .nav-link");
    const currentPath = window.location.pathname;
    navLinks.forEach(link => {
        const linkHref = link.getAttribute("href");

        // Handle subdirectory pages - check for both original and updated hrefs
        if (currentPath.includes("/events") && (linkHref === "./events" || linkHref === "../events/")) {
            link.classList.remove("richLink");
            link.classList.add("richLinkHighlight");
        }
        else if (currentPath.includes("/about") && (linkHref === "./about" || linkHref === "../about/")) {
            link.classList.remove("richLink");
            link.classList.add("richLinkHighlight");
        }
        else if (currentPath.includes("/store") && (linkHref === "./store" || linkHref === "../store/")) {
            link.classList.remove("richLink");
            link.classList.add("richLinkHighlight");
        }
    });
  
    console.log("Fragments loaded, dispatching event...");
    document.dispatchEvent(new Event("fragmentsLoaded"));
})();