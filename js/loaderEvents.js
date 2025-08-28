(async function loadEventCards() {
  try {
    // Determine if we're in a subdirectory or root
    const currentPath = window.location.pathname;
    const isInSubdirectory = currentPath.includes('/events') || currentPath.includes('/about') || currentPath.includes('/store');
    const basePath = isInSubdirectory ? '../' : './';
    
    const res = await fetch(`${basePath}assets/data/2025-2026/events.json`);
    const events = await res.json();

    const grid = document.getElementById('events-grid');
    if (!grid) return;

    // No date fields for past events; keep original JSON order
    const cards = events.map(ev => {
      const modalId = `event-${ev.id}-modal`;
      const subtitle = ev.subtitle ?? '';
      const image = ev.images ? ev.images[0] : ev.image;
      const displayInfo = ev.displayInfoOnCard;

      const cardText = displayInfo ? `
        <h3 class="display-6 lh-1 fw-bold mb-1 mt-auto">${ev.title}</h3>
        ${subtitle ? `<div class="small">${subtitle}</div>` : ''}
      ` : '';

      return `
        <div class="col default-col" data-bs-toggle="modal" data-bs-target="#${modalId}">
          <div class="position-relative h-100 overflow-hidden rounded hoverable">
            <img src="${basePath}assets/events/${image}" alt="${ev.title}" loading="lazy" style="object-fit: cover; width: 100%; height: 100%; position: absolute; inset: 0; z-index: -1; ${ev.alignImageLeft ? 'object-position: left;' : ''}" />
            <div class="position-absolute top-0 start-0 w-100 h-100"></div>
            <div class="d-flex flex-column h-100 p-5 text-white" style="position: relative; z-index: 1;">
              ${cardText}
            </div>
          </div>
        </div>
      `;
    }).join('');

    grid.innerHTML = `
      <div class="row row-cols-1 row-cols-lg-2 align-items-stretch g-4 pb-4">
        ${cards}
      </div>
    `;

    document.dispatchEvent(new Event('fragmentsLoaded'));
  } catch (e) {
    console.error('Failed to load events', e);
  }
})();
