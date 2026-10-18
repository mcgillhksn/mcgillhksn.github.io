// The base scene and content render immediately. Depth is a progressive enhancement.
(function prepareParallax() {
    const hero = document.querySelector(".hero");
    const baseImage = hero?.querySelector(".hero-base img");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!hero || !baseImage) return;

    const portrait = matchMedia("(max-width: 767px) and (max-aspect-ratio: 1/2)");
    const legacyScene = !window.CSS?.supports("width", "1cqw");
    if (legacyScene) hero.classList.add("legacy-scene");
    const images = [...hero.querySelectorAll(".parallax-layer img")];
    const scene = [baseImage, ...images];
    let started = false;
    let inView = true;
    let revealRequest = 0;

    function matchesScene(image) {
        if (!image.complete || !image.currentSrc) return false;
        const file = new URL(image.currentSrc, location.href).pathname;
        return legacyScene || file.endsWith(".png") || file.includes("-portrait-") === portrait.matches;
    }

    async function reveal() {
        if (!started || hero.classList.contains("parallax-ready") || !scene.every(matchesScene)) return;
        const request = ++revealRequest;
        try {
            await Promise.all(scene.map(image => image.decode()));
            if (request !== revealRequest || !scene.every(matchesScene)) return;
            images.forEach(image => image.parentElement.classList.toggle("original-scene", new URL(image.currentSrc).pathname.endsWith(".png")));
            hero.classList.add("parallax-ready");
            hero.dispatchEvent(new Event("parallaxReady"));
        } catch {
            // The complete base scene stays visible if an optional layer fails.
        }
    }

    function loadLayers() {
        if (started || reducedMotion.matches || !inView || document.hidden || !baseImage.complete || !baseImage.naturalWidth) return;
        started = true;
        images.forEach(image => {
            image.parentElement.querySelectorAll("source").forEach(source => {
                source.srcset = legacyScene ? image.dataset.src.replace(/\.png$/, ".webp") : source.dataset.srcset;
            });
            image.src = image.dataset.src;
        });
        reveal();
    }

    scene.forEach(image => image.addEventListener("load", reveal));
    images.forEach(image => image.addEventListener("error", () => {
        revealRequest++;
        hero.classList.remove("parallax-ready");
    }));
    portrait.addEventListener("change", () => {
        // Do not show portrait-cropped layers with landscape positioning while
        // their replacement files are still downloading after a rotation.
        revealRequest++;
        hero.classList.remove("parallax-ready");
        requestAnimationFrame(reveal);
    });
    new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        if (inView) loadLayers();
    }).observe(hero);
    if (baseImage.complete) loadLayers();
    else baseImage.addEventListener("load", loadLayers, { once: true });
    reducedMotion.addEventListener("change", loadLayers);
    document.addEventListener("visibilitychange", loadLayers);
})();
