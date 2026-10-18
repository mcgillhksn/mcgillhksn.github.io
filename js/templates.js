// Shared by the browser and the asset builder, keeping first paint and live updates identical.
const siteTemplates = {
    key(value) {
        let hash = 2166136261;
        for (const character of JSON.stringify(value)) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
        return (hash >>> 0).toString(36);
    },

    hasPortrait(member) {
        return Boolean(member.image && !/placeholder/i.test(member.image));
    },

    portrait(member, year, history = false) {
        const escape = siteContent.escapeHTML;
        const initials = member.name.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join("");
        const photo = this.hasPortrait(member);
        const sizes = history
            ? "(max-width: 767px) calc((100vw - 56px) / 2), (max-width: 1200px) calc((100vw - 130px) / 3), 300px"
            : "(max-width: 767px) calc((100vw - 56px) / 2), (max-width: 1280px) calc((100vw - 128px) / 3), 384px";
        return `<div class="member-portrait"><div class="member-placeholder" aria-hidden="true"${photo ? " hidden" : ""}><span>${escape(initials)}</span></div><span class="visually-hidden"${photo ? " hidden" : ""}>No photo available for ${escape(member.name)} in ${escape(siteContent.formatYear(year))}.</span>${photo ? siteImages.markup(`assets/members/${year}/${member.image}`, `${member.name}, ${member.position}, ${siteContent.formatYear(year)}`, sizes, 'loading="lazy"') : ""}</div>`;
    },

    member(member, year) {
        const escape = siteContent.escapeHTML;
        return `<article class="member">${this.portrait(member, year)}<h3 class="member-name"><a href="#${siteModalLinks.slug(member.name)}" class="member-trigger" data-modal-link data-member-name="${escape(member.name)}" aria-haspopup="dialog" aria-controls="member-modal" aria-label="View all team years for ${escape(member.name)}"><span>${escape(member.name)}</span></a></h3><p class="member-role">${escape(member.position)}</p></article>`;
    },

    events(events, year, featured) {
        const escape = siteContent.escapeHTML;
        const selected = featured ? events.filter(event => event.homeFeatured).slice(0, 3) : events;
        const visible = featured && !selected.length ? events.slice(0, 3) : selected;
        return visible.map(event => {
            const image = event.cover || event.images?.[0] || event.image;
            const slug = siteModalLinks.slug(event.id);
            const attributes = featured
                ? `href="${escape(new URL(`events/#${slug}`, siteConfig.getBasePath()).href)}" class="event-card-trigger" aria-label="View ${escape(event.title)} recap on the Events page"`
                : `href="#${slug}" class="event-card-trigger" data-modal-link aria-haspopup="dialog" aria-controls="event-${escape(event.id)}-modal" aria-label="View ${escape(event.title)} recap"`;
            const sizes = featured ? "(max-width: 767px) calc(100vw - 40px), (max-width: 991px) calc((100vw - 104px) / 2), 384px" : "(max-width: 479px) calc((100vw - 40px) * .6552), (max-width: 599px) min(274.32px, calc((100vw - 128px) * .819)), (max-width: 767px) calc((100vw - 128px) * .3694), (max-width: 1039px) min(274.32px, calc((100vw - 168px) * .3694)), min(274.32px, calc((100vw - 168px) * .2592))";
            const media = `<div class="event-card-media${event.coverIsPoster ? " poster-media" : ""}">${siteImages.markup(`assets/events/${image}`, event.coverAlt || event.title, sizes, `loading="lazy" draggable="false"${event.coverPosition ? ` style="object-position: ${escape(event.coverPosition)}"` : ""}`)}</div>`;
            const content = featured
                ? `${media}<div class="event-card-body"><h3><a ${attributes}>${escape(event.title)} <svg class="arrow-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></a></h3></div>`
                : `<a ${attributes} aria-describedby="polaroid-instructions" draggable="false">${media}<div class="event-card-body"><h3>${escape(event.title)}</h3></div></a>`;
            return `<article class="event-card" data-category="${escape(event.category || "Community")}">${content}</article>`;
        }).join("");
    },

    partners(data, category = "all") {
        const escape = siteContent.escapeHTML;
        return data.categories.map(group => {
            const members = data.partners.filter(partner => partner.category === group.id && (category === "all" || category === partner.category));
            if (!members.length) return "";
            const rows = members.map(partner => {
                const name = partner.spotlight ? `<a href="#${siteModalLinks.slug(partner.name)}" data-modal-link aria-haspopup="dialog" aria-controls="partner-modal">${escape(partner.name)}</a>` : escape(partner.name);
                return `<li><div><h4 class="partner-name">${name}</h4>${partner.terms ? `<p class="partner-terms">${escape(partner.terms)}</p>` : ""}</div><span class="partner-offer">${escape(partner.offer)}</span></li>`;
            }).join("");
            return `<section class="partner-category" aria-labelledby="partner-${escape(group.id)}-title"><div class="partner-category-heading"><h3 id="partner-${escape(group.id)}-title">${escape(group.label)}</h3><span class="small-label">${members.length} ${members.length === 1 ? "spot" : "spots"}</span></div><ul class="partner-list">${rows}</ul></section>`;
        }).join("");
    }
};
