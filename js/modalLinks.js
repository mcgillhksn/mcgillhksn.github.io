const siteModalLinks = (function setupModalLinks() {
    const pageTitle = document.title;
    const pageURL = new URL(location.href);
    pageURL.hash = "";
    let resolveModal;
    let active = null;
    let clickedLink = null;
    let request = 0;
    let pending = Promise.resolve();
    let notice;

    function slug(value) {
        return String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
            .replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
            .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }

    function href(id) {
        const url = new URL(pageURL);
        url.hash = id;
        return url.href;
    }

    function fragment() {
        try {
            return decodeURIComponent(location.hash.slice(1));
        } catch {
            return "";
        }
    }

    function showNotice(message) {
        if (!notice) {
            const grid = document.querySelector("[data-event-grid], #about-container, #partner-directory");
            if (!grid) return;
            notice = document.createElement("p");
            notice.className = "content-status";
            notice.setAttribute("role", "status");
            grid.before(notice);
        }
        notice.textContent = message;
        notice.hidden = !message;
    }

    function clearModalState() {
        const state = { ...history.state };
        delete state.hksnModalLink;
        return state;
    }

    function synchronize() {
        const currentRequest = ++request;
        pending = pending.then(async () => {
            if (currentRequest !== request || !resolveModal || !window.bootstrap) return;
            const id = fragment();
            if (active?.id === id && !active.closing) return;

            if (active) {
                const previous = active;
                previous.routing = true;
                // Back/Forward can arrive before Bootstrap finishes opening the dialog.
                await previous.shown;
                if (!previous.closing) bootstrap.Modal.getOrCreateInstance(previous.modal).hide();
                await previous.hidden;
            }
            if (currentRequest !== request) return;
            document.title = pageTitle;
            if (notice) notice.hidden = true;
            // Ordinary page anchors, such as #team and #community, keep their usual behavior.
            if (!id || document.getElementById(id)) return;

            const entry = await resolveModal(id);
            if (currentRequest !== request) return;
            if (!entry) {
                showNotice("This gallery link couldn’t be found. Please choose another.");
                return;
            }

            const trigger = clickedLink?.href === location.href ? clickedLink : null;
            clickedLink = null;
            entry.prepare?.();
            const record = { ...entry, id, trigger, routing: false, closing: false };
            record.shown = new Promise(resolve => entry.modal.addEventListener("shown.bs.modal", resolve, { once: true }));
            record.hidden = new Promise(resolve => entry.modal.addEventListener("hidden.bs.modal", () => {
                if (active === record) active = null;
                document.title = pageTitle;
                // Without animations, hidden can fire before history.back() finishes.
                if (!record.routing || !fragment() || document.getElementById(fragment())) {
                    const target = record.trigger?.isConnected ? record.trigger : entry.focusTarget?.();
                    target?.focus({ preventScroll: true });
                }
                resolve();
            }, { once: true }));
            entry.modal.addEventListener("hide.bs.modal", () => {
                record.closing = true;
                if (record.routing || fragment() !== id) return;
                // Only go Back when this page actually added the modal history entry.
                if (history.state?.hksnModalLink?.href === location.href) history.back();
                else history.replaceState(clearModalState(), "", pageURL);
            }, { once: true });
            active = record;
            document.title = `${entry.title} — HKSN`;
            bootstrap.Modal.getOrCreateInstance(entry.modal).show(trigger);
            await record.shown;
        }).catch(error => {
            console.error("Could not open the gallery link", error);
            if (currentRequest === request) showNotice("This gallery couldn’t load. Please refresh and try again.");
        });
    }

    document.addEventListener("click", event => {
        const link = event.target.closest("a[data-modal-link]");
        if (!link || !resolveModal || !window.bootstrap || event.defaultPrevented || event.button !== 0
            || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
            || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
        const url = new URL(link.href);
        if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
        event.preventDefault();
        clickedLink = link;
        if (url.href !== location.href) {
            history.pushState({ ...clearModalState(), hksnModalLink: { href: url.href } }, "", url);
        }
        synchronize();
    });
    window.addEventListener("popstate", synchronize);
    window.addEventListener("hashchange", synchronize);

    return {
        slug,
        href,
        register(resolve) {
            resolveModal = resolve;
            synchronize();
        }
    };
})();
