(async function loadPartnerDirectory() {
    const directory = document.getElementById("partner-directory");
    const count = document.getElementById("partner-count");
    const empty = document.getElementById("partner-empty");
    const filters = [...document.querySelectorAll("[data-partner-filter]")];
    if (!directory) return;
    const escape = siteContent.escapeHTML;

    try {
        const data = await siteContent.fetchJSON("assets/data/discount-card.json");
        const renderPartners = () => {
            const category = filters.find(button => button.getAttribute("aria-pressed") === "true")?.dataset.partnerFilter || "all";
            const partners = data.partners.filter(partner => category === "all" || category === partner.category);
            directory.innerHTML = data.categories.map(group => {
                const members = partners.filter(partner => partner.category === group.id);
                if (!members.length) return "";
                const rows = members.map(partner => `
                    <li><div><h4 class="partner-name">${escape(partner.name)}</h4>${partner.terms ? `<p class="partner-terms">${escape(partner.terms)}</p>` : ""}</div><span class="partner-offer">${escape(partner.offer)}</span></li>
                `).join("");
                return `<section class="partner-category" aria-labelledby="partner-${escape(group.id)}-title"><div class="partner-category-heading"><h3 id="partner-${escape(group.id)}-title">${escape(group.label)}</h3><span class="small-label">${members.length} ${members.length === 1 ? "spot" : "spots"}</span></div><ul class="partner-list">${rows}</ul></section>`;
            }).join("");
            directory.hidden = !partners.length;
            empty.hidden = !!partners.length;
            count.textContent = `${partners.length} ${partners.length === 1 ? "partner" : "partners"}`;
        };

        filters.forEach(button => button.addEventListener("click", () => {
            filters.forEach(filter => filter.setAttribute("aria-pressed", String(filter === button)));
            renderPartners();
        }));
        renderPartners();
    } catch (error) {
        console.error("Could not load partner directory", error);
        directory.innerHTML = '<p class="content-status">The directory couldn’t load just now. The original offer sheet is available below.</p>';
        count.textContent = "Directory unavailable";
    } finally {
        directory.setAttribute("aria-busy", "false");
    }
})();
