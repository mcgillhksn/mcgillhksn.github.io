(function setupTeamArchive() {
    const selector = document.getElementById("year-selector");
    const container = document.getElementById("about-container");
    let groupPhoto = document.getElementById("group-photo");
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
    let groupYear = container.dataset.year;
    let reuseSnapshot = true;

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
        return siteTemplates.hasPortrait(member);
    }

    function preparePortrait(portrait, onError) {
        const image = portrait.querySelector("img");
        const placeholder = portrait.querySelector(".member-placeholder");
        const noPhoto = portrait.querySelector(".visually-hidden");
        if (image) {
            const loaded = () => { placeholder.hidden = true; };
            image.addEventListener("load", loaded);
            const failed = () => {
                image.hidden = true;
                placeholder.hidden = false;
                noPhoto.hidden = false;
                if (onError) onError();
            };
            image.addEventListener("error", failed);
            if (image.complete && image.naturalWidth) loaded();
            else if (image.complete && image.getAttribute("src") && !image.dataset.fallback) queueMicrotask(failed);
        }
        return portrait;
    }

    function createPortrait(member, year) {
        const template = document.createElement("template");
        template.innerHTML = siteTemplates.portrait(member, year, true);
        return preparePortrait(template.content.firstElementChild);
    }

    async function loadMemberHistory(name) {
        const currentRequest = ++historyRequest;
        const memberKey = name.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
        siteImages.release(memberHistory);
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
            selectedMember = event.relatedTarget?.dataset.memberName || selectedMember;
            document.getElementById("member-modal-title").textContent = selectedMember;
            memberModal.querySelector(".modal-body").setAttribute("aria-label", `${selectedMember} — photos by team year`);
            memberModal.querySelector(".modal-body").scrollTop = 0;
            loadMemberHistory(selectedMember);
        });
        memberModal.addEventListener("hidden.bs.modal", () => {
            historyRequest++;
            selectedMember = "";
            siteImages.release(memberHistory);
            memberHistory.replaceChildren();
            memberHistory.setAttribute("aria-busy", "false");
        });
        memberHistoryRetry.addEventListener("click", () => loadMemberHistory(selectedMember));
        siteModalLinks.register(async id => {
            const trigger = [...container.querySelectorAll(".member-trigger")]
                .find(link => siteModalLinks.slug(link.dataset.memberName) === id);
            let name = trigger?.dataset.memberName;
            if (!name) {
                const results = await Promise.allSettled(years.map(getMembers));
                const members = results.filter(result => result.status === "fulfilled").flatMap(result => result.value);
                name = members.find(member => siteModalLinks.slug(member.name) === id)?.name;
                if (!name && results.some(result => result.status === "rejected")) {
                    throw new Error("Some team years could not be loaded to resolve the member link.");
                }
            }
            if (!name) return null;
            return {
                modal: memberModal,
                title: name,
                prepare() { selectedMember = name; },
                focusTarget: () => [...container.querySelectorAll(".member-trigger")]
                    .find(link => link.dataset.memberName === name) || selector
            };
        });
    }

    function prepareGroupPhoto(image, year) {
        image.addEventListener("load", () => {
            if (image === groupPhoto && year === groupYear && image.naturalWidth) groupFigure.classList.remove("is-unavailable");
        });
        image.addEventListener("error", () => {
            if (image === groupPhoto && year === groupYear) groupFigure.classList.add("is-unavailable");
        });
        if (image.complete && !image.naturalWidth && !image.dataset.fallback) groupFigure.classList.add("is-unavailable");
    }
    prepareGroupPhoto(groupPhoto, groupYear);

    async function loadMembers(year) {
        const currentRequest = ++request;
        container.setAttribute("aria-busy", "true");
        status.textContent = `Loading the ${siteContent.formatYear(year)} team.`;
        if (groupYear !== year || (groupPhoto.complete && !groupPhoto.naturalWidth)) {
            groupYear = year;
            groupFigure.classList.add("is-unavailable");
            // Give each selection its own element so a queued load event from
            // an older year cannot reveal the wrong photograph during a switch.
            const previousPhoto = groupPhoto;
            groupPhoto = document.createElement("img");
            groupPhoto.id = "group-photo";
            groupPhoto.decoding = "async";
            groupPhoto.fetchPriority = "high";
            prepareGroupPhoto(groupPhoto, year);
            groupPhoto.alt = `The ${siteContent.formatYear(year)} HKSN team at McGill`;
            siteImages.set(groupPhoto, `assets/members/${year}/groupPhoto.jpg`, "(max-width: 767px) calc(100vw - 40px), (max-width: 1280px) 53vw, 625px");
            siteImages.release(previousPhoto);
            previousPhoto.replaceWith(groupPhoto);
        }

        try {
            const members = await getMembers(year);
            if (currentRequest !== request) return;
            const reuse = reuseSnapshot && container.dataset.year === year && container.dataset.contentKey === siteTemplates.key(members);
            reuseSnapshot = false;
            const existing = reuse ? [...container.children] : [];
            const memberCards = members.map(member => ({
                member,
                hasPhoto: hasPortrait(member),
                element: existing.find(card => card.querySelector(".member-trigger")?.dataset.memberName === member.name) || null
            }));
            function renderMembers() {
                // Always partition the original order, even when images fail out of order.
                const orderedCards = [
                    ...memberCards.filter(card => card.hasPhoto),
                    ...memberCards.filter(card => !card.hasPhoto)
                ];
                const elements = orderedCards.map(card => card.element);
                if (elements.some((element, index) => container.children[index] !== element) || container.childElementCount !== elements.length) {
                    [...container.children].filter(element => !elements.includes(element)).forEach(element => siteImages.release(element));
                    container.replaceChildren(...elements);
                }
            }
            memberCards.forEach(card => {
                const { member } = card;
                if (!card.element) {
                    const template = document.createElement("template");
                    template.innerHTML = siteTemplates.member(member, year);
                    card.element = template.content.firstElementChild;
                }
                preparePortrait(card.element.querySelector(".member-portrait"), () => {
                    card.hasPhoto = false;
                    if (currentRequest === request) renderMembers();
                });
            });
            renderMembers();
            container.dataset.year = year;
            container.dataset.contentKey = siteTemplates.key(members);
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
