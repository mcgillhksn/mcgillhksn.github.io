// Generated alternatives are optional: new uploads still work before the next asset build.
const siteImages = {
    info(path) {
        return siteImageSources[path.replace(/^\.\//, "")];
    },

    attributes(path, sizes = "100vw") {
        const source = path.replace(/^\.\//, "");
        const info = this.info(source);
        const url = file => new URL(file, siteConfig.getBasePath()).href;
        const escape = siteContent.escapeHTML;
        if (!info) return `src="${escape(url(source))}"`;
        const [width, height, variants] = info;
        const file = size => `assets/optimized/${source.slice(7).replace(/\.[^.]+$/, "")}-${size}.webp`;
        return `src="${escape(url(file(variants[variants.length - 1])))}" srcset="${variants.map(size => `${escape(url(file(size)))} ${size}w`).join(", ")}" sizes="${escape(sizes)}" width="${width}" height="${height}" data-fallback="${escape(url(source))}"`;
    },

    markup(path, alt, sizes, extra = "") {
        return `<img ${this.attributes(path, sizes)} alt="${siteContent.escapeHTML(alt)}" decoding="async" data-fade ${extra}>`;
    },

    set(image, path, sizes) {
        image.classList.remove("is-loaded");
        const template = document.createElement("template");
        template.innerHTML = this.markup(path, image.alt, sizes);
        const next = template.content.firstElementChild;
        // Set sizes before srcset to avoid starting a needlessly large request.
        ["sizes", "width", "height", "data-fallback", "data-fade", "srcset", "src"].forEach(name => {
            if (next.hasAttribute(name)) image.setAttribute(name, next.getAttribute(name));
            else image.removeAttribute(name);
        });
        this.ready(image);
    },

    ready(image) {
        if (!image.complete) return;
        if (image.naturalWidth) image.classList.add("is-loaded");
        else if (image.getAttribute("src") && image.dataset.fallback) this.fallback(image);
    },

    fallback(image) {
        if (!image.dataset.fallback) return false;
        const fallback = image.dataset.fallback;
        delete image.dataset.fallback;
        image.removeAttribute("srcset");
        image.src = fallback;
        return true;
    },

    release(root) {
        const images = root.tagName === "IMG" ? [root] : root.querySelectorAll("img");
        images.forEach(image => {
            delete image.dataset.fallback;
            image.removeAttribute("srcset");
            image.removeAttribute("src");
        });
    }
};

if (typeof document !== "undefined") {
    document.addEventListener("load", event => {
        if (event.target.tagName === "IMG") siteImages.ready(event.target);
    }, true);
    document.addEventListener("error", event => {
        const image = event.target;
        if (image.tagName !== "IMG" || !siteImages.fallback(image)) return;
        // Only report a missing portrait if its original also fails.
        event.stopImmediatePropagation();
    }, true);
    document.querySelectorAll("img[data-fade]").forEach(image => siteImages.ready(image));
    document.documentElement.classList.add("images-ready");
}
