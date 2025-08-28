// Load common HTML fragments (navbar, footer) into the page
(async function loadFragments() {
    const parts = [
      { targetId: "include-navbar", file: "navbar.html"},
      { targetId: "include-footer", file: "footer.html"},
    ];
  
    // Determine if we're in a subdirectory or root
    const currentPath = window.location.pathname;
    const isInSubdirectory = currentPath.includes('/events') || currentPath.includes('/about') || currentPath.includes('/store');
    const basePath = isInSubdirectory ? '../components/' : './components/';
    const assetBasePath = isInSubdirectory ? '../' : './';
  
    await Promise.all(
      parts.map(async ({ targetId, file }) => {
        const res  = await fetch(`${basePath}${file}`);
        const html = await res.text();
        document.getElementById(targetId).innerHTML = html;
      })
    );

    // Fix asset paths and navigation links in navbar if we're in a subdirectory
    if (isInSubdirectory) {
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
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute("href");
        
        // Handle root/home page
        if (currentPath === "/" && (linkHref === "./" || linkHref === "../")) {
            link.classList.remove("richLink");
            link.classList.add("richLinkHighlight");
        }
        // Handle subdirectory pages (events, about, store)
        else if (currentPath.includes("/events") && (linkHref === "./events" || linkHref === "../events")) {
            link.classList.remove("richLink");
            link.classList.add("richLinkHighlight");
        }
        else if (currentPath.includes("/about") && (linkHref === "./about" || linkHref === "../about")) {
            link.classList.remove("richLink");
            link.classList.add("richLinkHighlight");
        }
        else if (currentPath.includes("/store") && (linkHref === "./store" || linkHref === "../store")) {
            link.classList.remove("richLink");
            link.classList.add("richLinkHighlight");
        }
    });
  
    console.log("Fragments loaded, dispatching event...");
    document.dispatchEvent(new Event("fragmentsLoaded"));
})();