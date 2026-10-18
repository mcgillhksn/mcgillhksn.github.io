(function setupParallax() {
    const hero = document.querySelector(".hero");
    if (!hero) return;

    const layers = [...hero.querySelectorAll(".parallax-layer")];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let ticking = false;
    let inView = true;

    function render() {
        const scroll = Math.min(Math.max(0, -hero.getBoundingClientRect().top), hero.offsetHeight);
        layers.forEach(layer => {
            layer.style.transform = reducedMotion.matches ? "" : `translate3d(0, -${scroll * Number(layer.dataset.depth)}px, 0)`;
        });
        ticking = false;
    }

    function requestRender() {
        if (ticking || !inView || !hero.classList.contains("parallax-ready")) return;
        ticking = true;
        requestAnimationFrame(render);
    }

    new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        requestRender();
    }).observe(hero);
    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", requestRender, { passive: true });
    hero.addEventListener("parallaxReady", requestRender);
    reducedMotion.addEventListener("change", render);
})();
