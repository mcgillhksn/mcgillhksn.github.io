(async function loadCarousel() {
    const carousel = document.getElementById("eventCarousel");
    if (!carousel || !window.bootstrap) return;

    try {
        const items = await siteContent.fetchJSON(`assets/data/${siteConfig.homePageContentYear}/carousel.json`);
        if (!items.length) return;

        const inner = carousel.querySelector(".carousel-inner");
        const first = inner.querySelector(".carousel-item");
        const fragment = document.createDocumentFragment();
        items.forEach((item, index) => {
            const slide = index === 0 && first ? first : document.createElement("div");
            slide.className = `carousel-item${index === 0 ? " active" : ""}`;
            slide.setAttribute("role", "group");
            slide.setAttribute("aria-roledescription", "slide");
            slide.setAttribute("aria-label", `${index + 1} of ${items.length}: ${item.title || "HKSN event"}`);
            const image = slide.querySelector("img") || document.createElement("img");
            image.alt = item.alt || item.title || "HKSN event";
            image.loading = "lazy";
            image.decoding = "async";
            if (item.poster) image.className = "poster-image";
            const info = siteImages.info(item.image);
            image.width = info?.[0] || 1000;
            image.height = info?.[1] || 750;
            if (index === 0) siteImages.set(image, item.image, "(max-width: 767px) calc(100vw - 40px), (max-width: 1280px) 53vw, 630px");
            if (!image.parentElement) slide.append(image);
            fragment.append(slide);
        });
        inner.replaceChildren(fragment);
        const caption = document.getElementById("carousel-caption");
        const count = document.getElementById("carousel-count");
        const updateCaption = index => {
            caption.textContent = items[index].title || "";
            count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
        };
        updateCaption(0);
        document.getElementById("carousel-controls").hidden = items.length < 2;
        const instance = bootstrap.Carousel.getOrCreateInstance(carousel, { interval: 3000, ride: items.length > 1 ? "carousel" : false, keyboard: true });
        const slides = [...inner.children];
        const requests = new Map();
        let inView = false;
        let pendingIndex = -1;
        function prepare(index) {
            if (requests.has(index)) return requests.get(index);
            const image = slides[index].querySelector("img");
            if (!image.hasAttribute("src")) siteImages.set(image, items[index].image, "(max-width: 767px) calc(100vw - 40px), (max-width: 1280px) 53vw, 630px");
            image.loading = "eager";
            const pending = image.decode().then(() => true).catch(() => {
                // A generated alternative may have failed and fallen back to its original.
                if (image.complete && image.naturalWidth) return true;
                if (!image.complete) return new Promise(resolve => {
                    image.addEventListener("load", () => resolve(true), { once: true });
                    image.addEventListener("error", () => resolve(false), { once: true });
                });
                return false;
            }).then(loaded => {
                if (!loaded) {
                    delete image.dataset.fallback;
                    image.removeAttribute("srcset");
                    image.removeAttribute("src");
                }
                return loaded;
            }).finally(() => {
                // Keep only in-flight promises. Resizing can select a new srcset
                // candidate, which must be decoded again before the next slide.
                requests.delete(index);
            });
            requests.set(index, pending);
            return pending;
        }
        function updatePlayback() {
            const hovering = matchMedia("(hover: hover) and (pointer: fine)").matches && carousel.matches(":hover");
            if (inView && !document.hidden && !hovering && items.length > 1) instance.cycle();
            else instance.pause();
        }
        carousel.addEventListener("slide.bs.carousel", event => {
            const image = event.relatedTarget.querySelector("img");
            if (image.complete && image.naturalWidth) {
                pendingIndex = -1;
                return;
            }
            // Keep the current picture visible until the next one is decoded.
            event.preventDefault();
            if (pendingIndex === event.to) return;
            pendingIndex = event.to;
            prepare(event.to).then(loaded => {
                if (pendingIndex !== event.to) return;
                pendingIndex = -1;
                if (loaded) instance.to(event.to);
            });
        });
        carousel.addEventListener("slid.bs.carousel", event => {
            updateCaption(event.to);
            if (inView && !navigator.connection?.saveData) prepare((event.to + 1) % items.length);
            updatePlayback();
        });
        new IntersectionObserver(([entry]) => {
            inView = entry.isIntersecting;
            if (inView) {
                const current = slides.findIndex(slide => slide.classList.contains("active"));
                prepare(current);
                if (!navigator.connection?.saveData && items.length > 1) prepare((current + 1) % items.length);
            }
            updatePlayback();
        }).observe(carousel);
        document.addEventListener("visibilitychange", updatePlayback);
    } catch (error) {
        // The initial photograph remains useful if the optional gallery cannot load.
        console.error("Could not load community gallery", error);
    }
})();
