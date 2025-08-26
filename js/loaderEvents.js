(async function loadEventCards() {
  try {
    const res = await fetch('./assets/data/2025-2026/events.json');
    const events = await res.json();

    const grid = document.getElementById('events-grid');
    if (!grid) return;

    // No date fields for past events; keep original JSON order
    const cards = events.map(ev => {
      const modalId = `event-${ev.id}-modal`;
      const subtitle = ev.subtitle ?? '';
      const desc = ev.description ?? '';

      return `
        <div class="col default-col hiddenBlur" data-bs-toggle="modal" data-bs-target="#${modalId}">
          <div class="position-relative h-100 overflow-hidden rounded-4 shadow-sm">
            <img src="./assets/${ev.image}" alt="${ev.title}" loading="lazy" style="object-fit: cover; width: 100%; height: 100%; position: absolute; inset: 0; z-index: -1;" />
            <div class="position-absolute top-0 start-0 w-100 h-100" style="background: linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.75) 100%); z-index: 0;"></div>
            <div class="d-flex flex-column h-100 p-5 text-white" style="position: relative; z-index: 1;">
              <h3 class="display-6 lh-1 fw-bold mb-1 mt-auto">${ev.title}</h3>
              ${subtitle ? `<div class="small">${subtitle}</div>` : ''}
              ${desc ? `<div class="small text-white-50 mt-1">${desc}</div>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    grid.innerHTML = `
      <div class="row row-cols-1 row-cols-xl-2 align-items-stretch g-4 pb-4">
        ${cards}
      </div>
    `;

    document.dispatchEvent(new Event('fragmentsLoaded'));
  } catch (e) {
    console.error('Failed to load events', e);
  }
})();
