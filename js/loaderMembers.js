(function setupTeamArchive() {
    const selector = document.getElementById("year-selector");
    const container = document.getElementById("about-container");
    const groupPhoto = document.getElementById("group-photo");
    const groupFallback = document.getElementById("group-photo-fallback");
    const status = document.getElementById("team-status");
    if (!selector || !container || !groupPhoto) return;

    let request = 0;
    groupPhoto.addEventListener("error", () => {
        groupPhoto.hidden = true;
        groupFallback.hidden = false;
    });

    async function loadMembers(year) {
        const currentRequest = ++request;
        container.setAttribute("aria-busy", "true");
        status.textContent = `Loading the ${siteContent.formatYear(year)} team.`;

        try {
            const members = await siteContent.fetchJSON(`assets/members/${year}/members.json`);
            if (currentRequest !== request) return;
            const fragment = document.createDocumentFragment();
            members.forEach(member => {
                const article = document.createElement("article");
                article.className = "member";
                const portrait = document.createElement("div");
                portrait.className = "member-portrait";
                const placeholder = document.createElement("div");
                placeholder.className = "member-placeholder";
                placeholder.setAttribute("aria-hidden", "true");
                const initials = document.createElement("span");
                initials.textContent = member.name.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join("");
                const label = document.createElement("small");
                label.textContent = "HKSN TEAM";
                placeholder.append(initials, label);
                portrait.append(placeholder);

                if (member.image && !/placeholder/i.test(member.image)) {
                    const image = document.createElement("img");
                    image.alt = `${member.name}, ${member.position}`;
                    image.loading = "lazy";
                    image.decoding = "async";
                    image.width = 500;
                    image.height = 500;
                    image.addEventListener("load", () => { placeholder.hidden = true; });
                    image.addEventListener("error", () => {
                        image.hidden = true;
                        placeholder.hidden = false;
                    });
                    image.src = new URL(`assets/members/${year}/${member.image}`, siteConfig.getBasePath());
                    portrait.append(image);
                }
                const name = document.createElement("h3");
                name.className = "member-name";
                name.textContent = member.name;
                const role = document.createElement("p");
                role.className = "member-role";
                role.textContent = member.position;
                article.append(portrait, name, role);
                fragment.append(article);
            });
            container.replaceChildren(fragment);
            groupPhoto.hidden = false;
            groupFallback.hidden = true;
            groupPhoto.alt = `The ${siteContent.formatYear(year)} HKSN team at McGill`;
            groupPhoto.src = new URL(`assets/members/${year}/groupPhoto.jpg`, siteConfig.getBasePath());
            document.getElementById("group-photo-caption").textContent = `The ${siteContent.formatYear(year)} team`;
            document.getElementById("team-count").textContent = `${members.length} people · ${siteContent.formatYear(year)}`;
            status.textContent = `Showing ${members.length} members of the ${siteContent.formatYear(year)} team.`;
        } catch (error) {
            if (currentRequest !== request) return;
            console.error("Could not load the team archive", error);
            container.innerHTML = '<p class="content-status">This team couldn’t load just now. Try another year, or <a href="https://www.instagram.com/hksnmcgill/">say hello on Instagram</a>.</p>';
            document.getElementById("team-count").textContent = siteContent.formatYear(year);
            groupPhoto.hidden = true;
            groupFallback.hidden = false;
            document.getElementById("group-photo-caption").textContent = `The ${siteContent.formatYear(year)} team`;
            status.textContent = "The selected team could not be loaded.";
        } finally {
            if (currentRequest === request) container.setAttribute("aria-busy", "false");
        }
    }

    selector.replaceChildren();
    siteConfig.allYears.forEach(year => {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = siteContent.formatYear(year);
        selector.append(option);
    });
    selector.disabled = !siteConfig.allYears.length;
    selector.addEventListener("change", () => loadMembers(selector.value));
    if (siteConfig.allYears.length) loadMembers(siteConfig.allYears[0]);
    else {
        container.innerHTML = '<p class="content-status">The team archive will be back soon.</p>';
        container.setAttribute("aria-busy", "false");
    }
})();
