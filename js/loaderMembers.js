(function setupTeamArchive() {
    const selector = document.getElementById("year-selector");
    const container = document.getElementById("about-container");
    const groupPhoto = document.getElementById("group-photo");
    const groupFigure = document.querySelector(".team-group");
    const status = document.getElementById("team-status");
    const previousYear = document.getElementById("previous-year");
    const nextYear = document.getElementById("next-year");
    const yearMenu = document.getElementById("year-menu");
    const yearSelection = document.getElementById("year-selection");
    const memberModal = document.getElementById("member-modal");
    const memberHistory = document.getElementById("member-history");
    const memberHistoryStatus = document.getElementById("member-history-status");
    const memberHistoryRetry = document.getElementById("member-history-retry");
    if (!selector || !container || !groupPhoto || !groupFigure || !yearMenu || !yearSelection) return;

    const years = siteConfig.allYears;
    const memberRequests = new Map();
    let selectedIndex = -1;
    let request = 0;
    let historyRequest = 0;
    let selectedMember = "";

    function getMembers(year) {
        if (!memberRequests.has(year)) {
            const pending = siteContent.fetchJSON(`assets/members/${year}/members.json`).catch(error => {
                memberRequests.delete(year);
                throw error;
            });
            memberRequests.set(year, pending);
        }
        return memberRequests.get(year);
    }

    function hasPortrait(member) {
        return Boolean(member.image && !/placeholder/i.test(member.image));
    }

    function createPortrait(member, year, onError) {
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
        const noPhoto = document.createElement("span");
        noPhoto.className = "visually-hidden";
        noPhoto.textContent = `No photo available for ${member.name} in ${siteContent.formatYear(year)}.`;
        noPhoto.hidden = hasPortrait(member);
        portrait.append(placeholder, noPhoto);

        if (hasPortrait(member)) {
            const image = document.createElement("img");
            image.alt = `${member.name}, ${member.position}, ${siteContent.formatYear(year)}`;
            image.loading = "lazy";
            image.decoding = "async";
            image.width = 500;
            image.height = 500;
            image.addEventListener("load", () => { placeholder.hidden = true; });
            image.addEventListener("error", () => {
                image.hidden = true;
                placeholder.hidden = false;
                noPhoto.hidden = false;
                if (onError) onError();
            });
            image.src = new URL(`assets/members/${year}/${member.image}`, siteConfig.getBasePath());
            portrait.append(image);
        }
        return portrait;
    }

    async function loadMemberHistory(name) {
        const currentRequest = ++historyRequest;
        const memberKey = name.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
        memberHistory.replaceChildren();
        memberHistory.setAttribute("aria-busy", "true");
        memberHistoryStatus.textContent = "Loading team years…";
        memberHistoryStatus.hidden = false;
        if (document.activeElement === memberHistoryRetry) {
            memberModal.querySelector(".modal-body").focus({ preventScroll: true });
        }
        memberHistoryRetry.hidden = true;

        // Fetch only the team lists; portrait images load only for the selected person.
        const historyYears = [...years].sort();
        const results = await Promise.allSettled(historyYears.map(getMembers));
        if (currentRequest !== historyRequest) return;
        const fragment = document.createDocumentFragment();
        results.forEach((result, index) => {
            if (result.status !== "fulfilled") return;
            const year = historyYears[index];
            result.value.filter(member => member.name.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase() === memberKey).forEach(member => {
                const figure = document.createElement("figure");
                figure.className = "member-history-year";
                figure.dataset.memberYear = year;
                const caption = document.createElement("figcaption");
                const yearLabel = document.createElement("h3");
                yearLabel.className = "member-history-label";
                yearLabel.textContent = siteContent.formatYear(year);
                const role = document.createElement("p");
                role.className = "member-role";
                role.textContent = member.position;
                caption.append(yearLabel, role);
                figure.append(createPortrait(member, year), caption);
                fragment.append(figure);
            });
        });
        const hasHistory = fragment.childElementCount > 0;
        const incomplete = results.some(result => result.status === "rejected");
        memberHistory.replaceChildren(fragment);
        memberHistory.setAttribute("aria-busy", "false");
        memberHistoryStatus.textContent = incomplete
            ? "Some team years couldn’t load. Try again to see the full history."
            : hasHistory ? "" : "No team years found for this member.";
        memberHistoryStatus.hidden = hasHistory && !incomplete;
        memberHistoryRetry.hidden = !incomplete;
    }

    if (memberModal && memberHistory && memberHistoryStatus && memberHistoryRetry) {
        memberModal.addEventListener("show.bs.modal", event => {
            selectedMember = event.relatedTarget.dataset.memberName;
            document.getElementById("member-modal-title").textContent = selectedMember;
            memberModal.querySelector(".modal-body").setAttribute("aria-label", `${selectedMember} — photos by team year`);
            memberModal.querySelector(".modal-body").scrollTop = 0;
            loadMemberHistory(selectedMember);
        });
        memberModal.addEventListener("hidden.bs.modal", () => {
            historyRequest++;
            selectedMember = "";
            memberHistory.replaceChildren();
            memberHistory.setAttribute("aria-busy", "false");
        });
        memberHistoryRetry.addEventListener("click", () => loadMemberHistory(selectedMember));
    }

    groupPhoto.addEventListener("load", () => {
        groupFigure.classList.remove("is-unavailable");
    });
    groupPhoto.addEventListener("error", () => {
        groupFigure.classList.add("is-unavailable");
    });

    async function loadMembers(year) {
        const currentRequest = ++request;
        container.setAttribute("aria-busy", "true");
        status.textContent = `Loading the ${siteContent.formatYear(year)} team.`;
        groupFigure.classList.add("is-unavailable");
        groupPhoto.alt = `The ${siteContent.formatYear(year)} HKSN team at McGill`;
        groupPhoto.src = new URL(`assets/members/${year}/groupPhoto.jpg`, siteConfig.getBasePath());
        document.getElementById("group-photo-caption").textContent = `The ${siteContent.formatYear(year)} team`;

        try {
            const members = await getMembers(year);
            if (currentRequest !== request) return;
            const memberCards = members.map(member => ({
                member,
                hasPhoto: hasPortrait(member),
                element: null
            }));
            function renderMembers() {
                // Always partition the original order, even when images fail out of order.
                const orderedCards = [
                    ...memberCards.filter(card => card.hasPhoto),
                    ...memberCards.filter(card => !card.hasPhoto)
                ];
                container.replaceChildren(...orderedCards.map(card => card.element));
            }
            memberCards.forEach(card => {
                const { member } = card;
                const article = document.createElement("article");
                article.className = "member";
                card.element = article;
                const portrait = createPortrait(member, year, () => {
                    card.hasPhoto = false;
                    if (currentRequest === request) renderMembers();
                });
                const name = document.createElement("h3");
                name.className = "member-name";
                const trigger = document.createElement("button");
                trigger.type = "button";
                trigger.className = "member-trigger";
                trigger.dataset.bsToggle = "modal";
                trigger.dataset.bsTarget = "#member-modal";
                trigger.dataset.memberName = member.name;
                trigger.setAttribute("aria-haspopup", "dialog");
                trigger.setAttribute("aria-controls", "member-modal");
                trigger.setAttribute("aria-label", `View all team years for ${member.name}`);
                const memberName = document.createElement("span");
                memberName.textContent = member.name;
                trigger.append(memberName);
                trigger.insertAdjacentHTML("beforeend", '<svg class="arrow-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 17 10-10M7 7h10v10"/></svg>');
                name.append(trigger);
                const role = document.createElement("p");
                role.className = "member-role";
                role.textContent = member.position;
                article.append(portrait, name, role);
            });
            renderMembers();
            status.textContent = `Showing ${members.length} members of the ${siteContent.formatYear(year)} team.`;
        } catch (error) {
            if (currentRequest !== request) return;
            console.error("Could not load the team archive", error);
            container.innerHTML = '<p class="content-status">This team couldn’t load just now. Try another year, or <a href="https://www.instagram.com/hksnmcgill/">say hello on Instagram</a>.</p>';
            groupFigure.classList.add("is-unavailable");
            status.textContent = "The selected team could not be loaded.";
        } finally {
            if (currentRequest === request) container.setAttribute("aria-busy", "false");
        }
    }

    years.forEach(year => {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "dropdown-item";
        button.dataset.teamYear = year;
        button.textContent = siteContent.formatYear(year);
        item.append(button);
        yearMenu.append(item);
    });
    selector.disabled = !years.length;

    function selectYear(index) {
        if (index < 0 || index >= years.length) return;
        selectedIndex = index;
        const year = years[index];
        selector.dataset.year = year;
        yearSelection.textContent = siteContent.formatYear(year);
        yearMenu.querySelectorAll("[data-team-year]").forEach(button => {
            const selected = button.dataset.teamYear === year;
            button.classList.toggle("active", selected);
            if (selected) button.setAttribute("aria-current", "true");
            else button.removeAttribute("aria-current");
        });
        const focusedControl = document.activeElement;
        previousYear.hidden = index >= years.length - 1;
        nextYear.hidden = index <= 0;
        if (!previousYear.hidden) previousYear.title = `Previous year (${siteContent.formatYear(years[index + 1])})`;
        if (!nextYear.hidden) nextYear.title = `Next year (${siteContent.formatYear(years[index - 1])})`;
        if ([previousYear, nextYear].some(button => button.hidden && focusedControl === button)) {
            selector.focus({ preventScroll: true });
        }
        loadMembers(year);
    }

    yearMenu.addEventListener("click", event => {
        const button = event.target.closest("[data-team-year]");
        if (!button) return;
        selectYear(years.indexOf(button.dataset.teamYear));
        selector.focus({ preventScroll: true });
    });
    [[previousYear, 1], [nextYear, -1]].forEach(([button, direction]) => {
        button.addEventListener("click", () => selectYear(selectedIndex + direction));
    });
    if (years.length) selectYear(0);
    else {
        yearSelection.textContent = "No years available";
        container.innerHTML = '<p class="content-status">The team archive will be back soon.</p>';
        container.setAttribute("aria-busy", "false");
    }
})();
