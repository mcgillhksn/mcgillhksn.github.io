(async function loadCarousel() {
    const carousel = document.getElementById("eventCarousel");
    if (!carousel || !window.bootstrap) return;

    try {
        const items = await siteContent.fetchJSON(`assets/data/${siteConfig.homePageContentYear}/carousel.json`);
        if (!items.length) return;

        const fragment = document.createDocumentFragment();
        items.forEach((item, index) => {
            const slide = document.createElement("div");
            slide.className = `carousel-item${index === 0 ? " active" : ""}`;
            slide.setAttribute("role", "group");
            slide.setAttribute("aria-roledescription", "slide");
            slide.setAttribute("aria-label", `${index + 1} of ${items.length}: ${item.alt}`);
            const image = document.createElement("img");
            image.src = new URL(item.image, siteConfig.getBasePath());
            image.alt = item.alt || "Life with HKSN";
            image.loading = "lazy";
            image.decoding = "async";
            if (item.poster) image.className = "poster-image";
            slide.append(image);
            fragment.append(slide);
        });
        carousel.querySelector(".carousel-inner").replaceChildren(fragment);
        const caption = document.getElementById("carousel-caption");
        const count = document.getElementById("carousel-count");
        const updateCaption = index => {
            caption.textContent = items[index].alt;
            count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
        };
        updateCaption(0);
        document.getElementById("carousel-controls").hidden = items.length < 2;
        bootstrap.Carousel.getOrCreateInstance(carousel, { interval: false, ride: false, keyboard: true });
        carousel.addEventListener("slid.bs.carousel", event => updateCaption(event.to));
    } catch (error) {
        // The initial photograph remains useful if the optional gallery cannot load.
        console.error("Could not load community gallery", error);
    }
})();
