(async function loadEventCards() {
    const grid = document.querySelector("[data-event-grid]");
    if (!grid) return;

    const featured = grid.dataset.featured === "true";
    const polaroidBoard = grid.hasAttribute("data-polaroid-board");
    const year = featured ? siteConfig.homePageContentYear : siteConfig.eventsContentYear;
    document.querySelectorAll("[data-events-year]").forEach(label => {
        label.textContent = siteContent.formatYear(year);
    });

    try {
        const events = await siteContent.getEvents(year);
        const selected = featured ? events.filter(event => event.homeFeatured).slice(0, 3) : events;
        const visibleEvents = featured && !selected.length ? events.slice(0, 3) : selected;
        if (grid.dataset.year !== year || grid.dataset.contentKey !== siteTemplates.key(events)) {
            grid.innerHTML = siteTemplates.events(events, year, featured);
        }

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
        if (!grid.querySelector(".event-card")) grid.innerHTML = '<p class="content-status">The archive couldn’t load just now. You can still find our recaps on <a href="https://www.instagram.com/hksnmcgill/">Instagram ↗</a>.</p>';
    } finally {
        grid.setAttribute("aria-busy", "false");
    }
})();
