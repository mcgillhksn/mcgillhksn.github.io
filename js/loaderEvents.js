(async function loadEventCards() {
    const grid = document.querySelector("[data-event-grid]");
    if (!grid) return;

    const featured = grid.dataset.featured === "true";
    const polaroidBoard = grid.hasAttribute("data-polaroid-board");
    const year = featured ? siteConfig.homePageContentYear : siteConfig.eventsContentYear;
    const escape = siteContent.escapeHTML;
    document.querySelectorAll("[data-events-year]").forEach(label => {
        label.textContent = siteContent.formatYear(year);
    });

    try {
        const events = await siteContent.getEvents(year);
        const selected = featured ? events.filter(event => event.homeFeatured).slice(0, 3) : events;
        const visibleEvents = featured && !selected.length ? events.slice(0, 3) : selected;
        grid.innerHTML = visibleEvents.map(event => {
            const image = event.cover || event.images?.[0] || event.image;
            const category = event.category || "Community";
            const modalId = `event-${event.id}-modal`;
            const imageURL = new URL(`assets/events/${image}`, siteConfig.getBasePath()).href;
            const linkAttributes = `href="${escape(siteModalLinks.href(siteModalLinks.slug(event.id)))}" class="event-card-trigger" data-modal-link aria-haspopup="dialog" aria-controls="${escape(modalId)}" aria-label="View ${escape(event.title)} recap"`;
            const media = `
                <div class="event-card-media${event.coverIsPoster ? " poster-media" : ""}">
                    <img src="${escape(imageURL)}" alt="${escape(event.coverAlt || event.title)}" loading="lazy" decoding="async"${polaroidBoard ? ' draggable="false"' : ""}${event.coverPosition ? ` style="object-position: ${escape(event.coverPosition)}"` : ""}>
                </div>`;
            const content = polaroidBoard
                ? `<a ${linkAttributes} aria-describedby="polaroid-instructions" draggable="false">${media}<div class="event-card-body"><h3>${escape(event.title)}</h3></div></a>`
                : `${media}<div class="event-card-body"><h3><a ${linkAttributes}>${escape(event.title)} <svg class="arrow-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></a></h3></div>`;
            return `
                <article class="event-card" data-category="${escape(category)}">
                    ${content}
                </article>`;
        }).join("");

        if (!visibleEvents.length) grid.innerHTML = '<p class="content-status">No events listed for this year. Follow us on Instagram for announcements.</p>';
        const polaroids = polaroidBoard && typeof siteEventPolaroids !== "undefined" ? siteEventPolaroids.create(grid) : null;

        document.querySelectorAll("[data-event-filter]").forEach(button => {
            button.addEventListener("click", () => {
                document.querySelectorAll("[data-event-filter]").forEach(filter => {
                    filter.setAttribute("aria-pressed", String(filter === button));
                });
                grid.querySelectorAll(".event-card").forEach(card => {
                    card.hidden = button.dataset.eventFilter !== "all" && card.dataset.category !== button.dataset.eventFilter;
                });
                polaroids?.refresh();
            });
        });
    } catch (error) {
        console.error("Could not load the event archive", error);
        grid.innerHTML = '<p class="content-status">The archive couldn’t load just now. You can still find our recaps on <a href="https://www.instagram.com/hksnmcgill/">Instagram ↗</a>.</p>';
    } finally {
        grid.setAttribute("aria-busy", "false");
    }
})();
