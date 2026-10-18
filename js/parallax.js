(function setupParallax() {
    const hero = document.querySelector(".hero");
    if (!hero) return;

    const layers = [...hero.querySelectorAll(".parallax-layer")].map(element => ({ element, depth: Number(element.dataset.depth) }));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Native scroll timelines stay in sync with asynchronous touch/momentum
    // scrolling, even while the main thread is busy loading the next section.
    const nativeScroll = CSS.supports("animation-timeline", "scroll(root block)")
        && CSS.supports("animation-range", "0px 100px");
    hero.classList.toggle("parallax-native", nativeScroll);
    let frame = 0;
    let inView = true;
    let height = 0;
    let top = 0;
    let lastScroll = -1;

    function render() {
        frame = 0;
        if (!inView || document.hidden || reducedMotion.matches || !hero.classList.contains("parallax-ready")) return;
        // Older browsers only read the scroll offset here, never layout geometry.
        const scroll = Math.min(Math.max(0, window.scrollY - top), height);
        if (scroll === lastScroll) return;
        layers.forEach(({ element, depth }) => {
            element.style.transform = `translate3d(0, -${scroll * depth}px, 0)`;
        });
        lastScroll = scroll;
    }

    function requestRender() {
        if (nativeScroll || frame || !inView || document.hidden || reducedMotion.matches || !hero.classList.contains("parallax-ready")) return;
        frame = requestAnimationFrame(render);
    }

    function measure() {
        const bounds = hero.getBoundingClientRect();
        top = window.scrollY + bounds.top;
        height = bounds.height;
        hero.style.setProperty("--parallax-start", `${top}px`);
        hero.style.setProperty("--parallax-end", `${top + height}px`);
        layers.forEach(({ element, depth }) => element.style.setProperty("--parallax-offset", `${-height * depth}px`));
        lastScroll = -1;
        requestRender();
    }

    function updateActivity() {
        hero.classList.toggle("parallax-active", inView && !document.hidden && !reducedMotion.matches);
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        if (reducedMotion.matches) {
            layers.forEach(({ element }) => element.style.removeProperty("transform"));
            lastScroll = -1;
        }
        requestRender();
    }

    new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        updateActivity();
    }, { rootMargin: "120px 0px" }).observe(hero);
    // Mobile browser-toolbar changes don't invalidate geometry on every scroll.
    // Remeasure only when the hero itself actually changes size (e.g. rotation).
    new ResizeObserver(measure).observe(hero);
    if (!nativeScroll) window.addEventListener("scroll", requestRender, { passive: true });
    hero.addEventListener("parallaxReady", requestRender);
    reducedMotion.addEventListener("change", updateActivity);
    document.addEventListener("visibilitychange", updateActivity);
    measure();
    updateActivity();
})();
