// The base scene and content render immediately. Depth is a progressive enhancement.
(function prepareParallax() {
    const hero = document.querySelector(".hero");
    const baseImage = hero?.querySelector(".hero-base img");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!hero || !baseImage) return;

    let started = false;
    async function loadLayers() {
        if (started || reducedMotion.matches) return;
        started = true;
        const images = [...hero.querySelectorAll(".parallax-layer img")];
        const loaded = await Promise.all(images.map(image => new Promise(resolve => {
            image.onload = () => resolve(true);
            image.onerror = () => resolve(false);
            const source = image.parentElement.querySelector("source");
            source.srcset = source.dataset.srcset;
            image.src = image.dataset.src;
        })));
        if (loaded.every(Boolean)) {
            hero.classList.add("parallax-ready");
            hero.dispatchEvent(new Event("parallaxReady"));
        }
    }

    if (baseImage.complete) loadLayers();
    else baseImage.addEventListener("load", loadLayers, { once: true });
    reducedMotion.addEventListener("change", loadLayers);
})();
