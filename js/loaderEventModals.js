(async function loadEventModals() {
  try {
    const res = await fetch('./assets/data/2025-2026/events.json');
    const events = await res.json();

    const container = document.getElementById('events-modals');
    if (!container) return;

    const html = events.map(ev => {
      const modalId = `event-${ev.id}-modal`;
      const subtitle = ev.subtitle ? `<p class="mb-2 text-muted">${ev.subtitle}</p>` : '';
      const description = ev.description ? `<p>${ev.description}</p>` : '';
      const images = ev.images || [];

      const imageGallery = images.map(img => `
        <div class="col-12 col-md-6 mb-4">
          <img src="./assets/events/${img}" alt="${ev.title}" class="img-fluid rounded" loading="lazy" />
        </div>
      `).join('');

      return `
      <div class="modal fade darkModeText" id="${modalId}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-fullscreen-md-down">
          <div class="modal-content rounded-4 px-5 py-5">
            <div class="modal-header d-flex justify-content-between align-items-start">
              <h3 class="mb-4 display-6 lh-1 fw-bold">${ev.title}</h3>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body px-0">
              <h3 class="mb-0 fs-4 pb-2">Description</h3>
              ${subtitle}
              ${description}
              <h3 class="mb-3 mt-4 fs-4 pb-2">Gallery</h3>
              <div class="row">
                ${imageGallery}
              </div>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');

    container.innerHTML = html;
  } catch (e) {
    console.error('Failed to load event modals', e);
  }
})();
