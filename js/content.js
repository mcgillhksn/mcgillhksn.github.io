const siteContent = {
    eventRequests: new Map(),

    async fetchJSON(path) {
        try {
            const response = await fetch(new URL(path, siteConfig.getBasePath()));
            if (!response.ok) throw new Error(`Could not load ${path}: ${response.status}`);
            return await response.json();
        } catch (error) {
            const snapshot = [...document.querySelectorAll("script[data-content-path]")].find(script => script.dataset.contentPath === path);
            if (snapshot) return JSON.parse(snapshot.textContent);
            throw error;
        }
    },

    getEvents(year = siteConfig.eventsContentYear) {
        if (!this.eventRequests.has(year)) {
            this.eventRequests.set(year, this.fetchJSON(`assets/data/${year}/events.json`).catch(error => {
                this.eventRequests.delete(year);
                throw error;
            }));
        }
        return this.eventRequests.get(year);
    },

    escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        })[character]);
    },

    formatYear(year) {
        return year.replace(/-(\d{2})(\d{2})$/, "–$2");
    }
};
