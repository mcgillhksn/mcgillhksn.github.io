(function setupHeroScroll() {
    const link = document.querySelector(".hero-scroll");
    if (!link) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let controls;

    function cancelScroll() {
        cancelAnimationFrame(frame);
        frame = 0;
        controls?.abort();
        controls = null;
    }

    link.addEventListener("click", event => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || reducedMotion.matches) return;
        const target = document.getElementById(link.hash.slice(1));
        if (!target) return;
        event.preventDefault();
        cancelScroll();

        const start = window.scrollY;
        const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
        const end = Math.max(0, Math.min(start + target.getBoundingClientRect().top - padding, document.documentElement.scrollHeight - window.innerHeight));
        const duration = 2000;
        const started = performance.now();
        if (location.hash !== link.hash) history.pushState(history.state, "", link.hash);

        // Keep the slower animation local to this cue; manual navigation always wins.
        controls = new AbortController();
        for (const type of ["wheel", "touchstart", "pointerdown", "resize", "popstate", "hashchange", "pagehide"]) {
            window.addEventListener(type, cancelScroll, { passive: true, signal: controls.signal });
        }
        window.addEventListener("keydown", event => {
            if (["Escape", "Tab", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) cancelScroll();
        }, { signal: controls.signal });

        function step(now) {
            const progress = Math.min(1, (now - started) / duration);
            const eased = (1 - Math.cos(Math.PI * progress)) / 2;
            // Avoid restarting the browser's CSS smooth scroll on every frame.
            window.scrollTo({ top: start + (end - start) * eased, behavior: "instant" });
            if (progress < 1) frame = requestAnimationFrame(step);
            else {
                cancelScroll();
                target.focus({ preventScroll: true });
            }
        }
        frame = requestAnimationFrame(step);
    });
    reducedMotion.addEventListener("change", cancelScroll);
})();
