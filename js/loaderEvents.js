(async function loadEventCards() {
    const grid = document.querySelector("[data-event-grid]");
    if (!grid) return;

    const featured = grid.dataset.featured === "true";
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
            return `
                <article class="event-card" data-category="${escape(category)}">
                    <div class="event-card-media${event.coverIsPoster ? " poster-media" : ""}">
                        <img src="${escape(imageURL)}" alt="${escape(event.coverAlt || event.title)}" loading="lazy" decoding="async"${event.coverPosition ? ` style="object-position: ${escape(event.coverPosition)}"` : ""}>
                    </div>
                    <div class="event-card-body">
                        <p class="event-card-meta"><span>${escape(category)}</span><span>${escape(siteContent.formatYear(year))}</span></p>
                        <h3><button type="button" class="event-card-trigger" data-bs-toggle="modal" data-bs-target="#${escape(modalId)}" aria-haspopup="dialog" aria-controls="${escape(modalId)}" aria-label="View ${escape(event.title)} recap">
                            ${escape(event.title)} <svg class="arrow-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>
                        </button></h3>
                    </div>
                </article>`;
        }).join("");

        if (!visibleEvents.length) grid.innerHTML = '<p class="content-status">No events listed for this year. Follow us on Instagram for announcements.</p>';
        const count = document.getElementById("events-count");
        const updateCount = number => {
            if (count) count.textContent = `${number} ${number === 1 ? "event" : "events"}`;
        };
        updateCount(visibleEvents.length);

        document.querySelectorAll("[data-event-filter]").forEach(button => {
            button.addEventListener("click", () => {
                document.querySelectorAll("[data-event-filter]").forEach(filter => {
                    filter.setAttribute("aria-pressed", String(filter === button));
                });
                let shown = 0;
                grid.querySelectorAll(".event-card").forEach(card => {
                    card.hidden = button.dataset.eventFilter !== "all" && card.dataset.category !== button.dataset.eventFilter;
                    if (!card.hidden) shown++;
                });
                updateCount(shown);
            });
        });
    } catch (error) {
        console.error("Could not load the event archive", error);
        grid.innerHTML = '<p class="content-status">The archive couldn’t load just now. You can still find our recaps on <a href="https://www.instagram.com/hksnmcgill/">Instagram ↗</a>.</p>';
    } finally {
        grid.setAttribute("aria-busy", "false");
    }
})();
