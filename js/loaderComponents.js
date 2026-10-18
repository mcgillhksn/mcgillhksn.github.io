(async function loadFragments() {
    const basePath = siteConfig.getBasePath();
    const normalizePath = path => path.replace(/\/index\.html$/, "/").replace(/\/+$/, "") || "/";

    await Promise.all([
        { target: "include-navbar", file: "navbar.html" },
        { target: "include-footer", file: "footer.html" }
    ].map(async ({ target, file }) => {
        const container = document.getElementById(target);
        if (!container) return;
        try {
            const response = await fetch(new URL(`components/${file}`, basePath));
            if (!response.ok) throw new Error(`Could not load ${file}`);
            // Resolve fragment URLs before insertion to avoid incorrect image requests on nested pages.
            const template = document.createElement("template");
            template.innerHTML = await response.text();
            template.content.querySelectorAll("[data-site-path]").forEach(link => {
                link.href = new URL(link.dataset.sitePath, basePath).href;
            });
            template.content.querySelectorAll("[data-site-asset]").forEach(image => {
                image.src = new URL(image.dataset.siteAsset, basePath).href;
            });
            template.content.querySelectorAll(".nav-link").forEach(link => {
                if (normalizePath(new URL(link.href).pathname) === normalizePath(location.pathname)) {
                    link.setAttribute("aria-current", "page");
                }
            });
            container.replaceChildren(template.content);
        } catch (error) {
            console.error(error);
            if (target === "include-navbar") {
                const nav = document.createElement("nav");
                nav.className = "site-container";
                nav.setAttribute("aria-label", "Main navigation");
                [["", "Home"], ["about/", "About"], ["events/", "Events"], ["store/", "Discount card"]].forEach(([path, title]) => {
                    const link = document.createElement("a");
                    link.href = new URL(path, basePath);
                    link.className = "text-link me-4";
                    link.textContent = title;
                    nav.append(link);
                });
                container.append(nav);
            }
        }
    }));

    const navigation = document.getElementById("navigationBar");
    const menu = document.getElementById("navbarNav");
    const toggler = navigation?.querySelector(".navbar-toggler");
    menu?.addEventListener("show.bs.collapse", () => {
        navigation.classList.add("menu-open");
        toggler.setAttribute("aria-label", "Close navigation");
    });
    menu?.addEventListener("hidden.bs.collapse", () => {
        navigation.classList.remove("menu-open");
        toggler.setAttribute("aria-label", "Open navigation");
    });
    navigation?.addEventListener("keydown", event => {
        if (event.key === "Escape" && menu.classList.contains("show") && window.bootstrap) {
            bootstrap.Collapse.getOrCreateInstance(menu).hide();
            toggler.focus();
        }
    });

    const updateNavigation = () => document.body.classList.toggle("nav-scrolled", window.scrollY > 32);
    updateNavigation();
    window.addEventListener("scroll", updateNavigation, { passive: true });
    document.dispatchEvent(new Event("fragmentsLoaded"));
})();
