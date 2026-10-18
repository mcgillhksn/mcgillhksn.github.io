(async function loadPartnerDirectory() {
    const directory = document.getElementById("partner-directory");
    const count = document.getElementById("partner-count");
    const empty = document.getElementById("partner-empty");
    const filters = [...document.querySelectorAll("[data-partner-filter]")];
    if (!directory) return;
    const modal = document.getElementById("partner-modal");
    const modalTitle = document.getElementById("partner-modal-title");
    const spotlightImage = document.getElementById("partner-spotlight-image");

    try {
        const data = await siteContent.fetchJSON("assets/data/member-card.json");
        let initial = true;
        const renderPartners = () => {
            const category = filters.find(button => button.getAttribute("aria-pressed") === "true")?.dataset.partnerFilter || "all";
            const partners = data.partners.filter(partner => category === "all" || category === partner.category);
            if (!initial || directory.dataset.contentKey !== siteTemplates.key(data)) {
                directory.innerHTML = siteTemplates.partners(data, category);
            }
            initial = false;
            directory.hidden = !partners.length;
            empty.hidden = !!partners.length;
            count.textContent = `${partners.length} ${partners.length === 1 ? "partner" : "partners"}`;
        };

        filters.forEach(button => button.addEventListener("click", () => {
            filters.forEach(filter => filter.setAttribute("aria-pressed", String(filter === button)));
            renderPartners();
        }));
        renderPartners();
        modal.addEventListener("hidden.bs.modal", () => {
            siteImages.release(spotlightImage);
            spotlightImage.classList.remove("is-loaded");
        });
        siteModalLinks.register(id => {
            const partner = data.partners.find(partner => partner.spotlight && siteModalLinks.slug(partner.name) === id);
            if (!partner) return null;
            return {
                modal,
                title: partner.name,
                prepare() {
                    modalTitle.textContent = partner.name;
                    spotlightImage.alt = `${partner.name} sponsor spotlight. Offer: ${partner.offer}.${partner.terms ? ` ${partner.terms}.` : ""}`;
                    siteImages.set(spotlightImage, `assets/membershipCard/${partner.spotlight}`, "(max-width: 767px) calc(100vw - 40px), 614px");
                    modal.querySelector(".modal-body").scrollTop = 0;
                },
                focusTarget: () => [...directory.querySelectorAll("a[data-modal-link]")]
                    .find(link => link.hash.slice(1) === id)
            };
        });
    } catch (error) {
        console.error("Could not load partner directory", error);
        if (!directory.querySelector(".partner-category")) {
            directory.innerHTML = '<p class="content-status">The directory couldn’t load just now. Please refresh and try again.</p>';
            count.textContent = "Directory unavailable";
        }
    } finally {
        directory.setAttribute("aria-busy", "false");
    }
})();
