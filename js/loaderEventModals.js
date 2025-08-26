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

      return `
      <div class="modal fade darkModeText" id="${modalId}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-fullscreen-md-down">
          <div class="modal-content rounded-4 px-5 py-5 glass">
            <div class="modal-header d-flex justify-content-between align-items-start">
              <h3 class="mb-4 display-6 lh-1 fw-bold">${ev.title}</h3>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body px-0">
              ${subtitle}
              <h3 class="mb-0 fs-4 pb-2">Description</h3>
              ${description}
              <div style="display: flex; justify-content: center; align-items: center;" class="mt-3">
                <img src="./assets/${ev.image}" alt="${ev.title}" class="img-fluid rounded neumorphicButton" style="width: 100%; object-fit: cover;" loading="lazy" />
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
