(async function loadEventModals() {
    const container = document.getElementById("events-modals");
    if (!container) return;
    const year = document.body.classList.contains("home-page") ? siteConfig.homePageContentYear : siteConfig.eventsContentYear;
    const escape = siteContent.escapeHTML;

    try {
        const events = await siteContent.getEvents(year);
        container.innerHTML = events.map(event => {
            const modalId = `event-${event.id}-modal`;
            const images = event.images || (event.image ? [event.image] : []);
            const gallery = images.map((image, index) => {
                const imageURL = new URL(`assets/events/${image}`, siteConfig.getBasePath()).href;
                return `<figure><img src="${escape(imageURL)}" alt="${escape(event.title)} — photo ${index + 1} of ${images.length}" loading="lazy" decoding="async"></figure>`;
            }).join("");

            return `
                <div class="modal fade" id="${escape(modalId)}" tabindex="-1" aria-labelledby="${escape(modalId)}-title" aria-hidden="true">
                    <div class="modal-dialog modal-xl modal-dialog-scrollable modal-fullscreen-md-down">
                        <div class="modal-content">
                            <div class="modal-header">
                                <div><p class="eyebrow">${escape(event.category || "Community")} · ${escape(siteContent.formatYear(year))}</p><h2 class="modal-title" id="${escape(modalId)}-title">${escape(event.title)}</h2></div>
                                <button type="button" class="icon-button modal-close" data-bs-dismiss="modal" aria-label="Close ${escape(event.title)} recap"><svg class="arrow-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button>
                            </div>
                            <div class="modal-body" tabindex="0" role="region" aria-label="${escape(event.title)} recap and photos">
                                <p class="body-large modal-description">${escape(event.description || event.subtitle || "HKSN event recap and photos.")}</p>
                                <div class="modal-gallery-heading"><h3>Photos</h3><span class="small-label">${images.length} ${images.length === 1 ? "photo" : "photos"}</span></div>
                                <div class="event-gallery">${gallery}</div>
                            </div>
                        </div>
                    </div>
                </div>`;
        }).join("");
    } catch (error) {
        console.error("Could not load event galleries", error);
    }
})();
