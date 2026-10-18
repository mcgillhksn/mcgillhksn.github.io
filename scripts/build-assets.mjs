import { readFile, writeFile, mkdir, copyFile, stat, unlink } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { createHash } from "node:crypto";
import sharp from "sharp";
import * as sass from "sass";
import * as esbuild from "esbuild";
import { PurgeCSS } from "purgecss";
import { prepareSkylineLayers } from "./skyline-overlap.mjs";

const root = path.resolve(import.meta.dirname, "..");
process.chdir(root);
const read = file => readFile(file, "utf8");
const json = async file => JSON.parse(await read(file));
const sources = {};
const jobs = new Map();
const add = (file, widths, lossless = false) => jobs.set(file, { widths, lossless });
const config = await read("js/config.js");
const context = vm.createContext({ URL, console });
vm.runInContext(config.replace('document.currentScript.src', '"https://build.invalid/js/config.js"'), context);
const years = vm.runInContext("siteConfig.allYears", context);
const homeYear = vm.runInContext("siteConfig.homePageContentYear", context);
const eventsYear = vm.runInContext("siteConfig.eventsContentYear", context);
for (const year of years) {
    for (const member of await json(`assets/members/${year}/members.json`)) {
        if (member.image && !/placeholder/i.test(member.image)) add(`assets/members/${year}/${member.image}`, [256, 384, 500]);
    }
    add(`assets/members/${year}/groupPhoto.jpg`, [640, 960, 1280, 1920]);
}
for (const year of new Set([homeYear, eventsYear])) {
    for (const event of await json(`assets/data/${year}/events.json`)) {
        for (const image of new Set([event.cover, ...(event.images || [])].filter(Boolean))) add(`assets/events/${image}`, [480, 640, 960, 1440]);
    }
    for (const item of await json(`assets/data/${year}/carousel.json`)) add(item.image.replace(/^\.\//, ""), [480, 640, 960, 1440]);
}
const card = await json("assets/data/member-card.json");
for (const partner of card.partners) if (partner.spotlight) add(`assets/membershipCard/${partner.spotlight}`, [540, 800, 1080]);
add("assets/membershipCard/2026-2027/front.png", [480, 960, 1200], true);
add("assets/membershipCard/2026-2027/sponsorship-map.webp", [640, 1280, 1920], true);
add("assets/logo/logoText.png", [244], true);
add("assets/logo/logoTextWhite.png", [244, 800], true);

await mkdir("assets/optimized", { recursive: true });
let totalOriginal = 0, totalLargest = 0;
// Limit concurrent encoders rather than loading the entire photo archive into RAM.
for (const [file, { widths, lossless }] of jobs) {
    let original;
    try { original = await stat(file); } catch { continue; }
    const metadata = await sharp(file).metadata();
    const rotated = metadata.orientation >= 5 && metadata.orientation <= 8;
    const width = rotated ? metadata.height : metadata.width;
    const height = rotated ? metadata.width : metadata.height;
    const variants = [];
    const sizes = [...new Set(widths.map(size => Math.min(size, width)))];
    for (const size of sizes) {
        const output = `assets/optimized/${file.slice(7).replace(/\.[^.]+$/, "")}-${size}.webp`;
        await mkdir(path.dirname(output), { recursive: true });
        let existing;
        try { existing = await stat(output); } catch {}
        const cached = existing && existing.mtimeMs >= original.mtimeMs;
        // Reuse existing WebP bytes at native resolution instead of recompressing
        // an already compressed spotlight (which can actually make it larger).
        if (metadata.format === "webp" && size === width) {
            if (!cached || existing.size !== original.size) await copyFile(file, output);
        } else if (!cached || (file.includes("/spotlights/") && existing.size > original.size)) {
            await sharp(file).rotate().resize({ width: size, withoutEnlargement: true })
                .webp({ quality: file.includes("/spotlights/") ? 90 : 85, alphaQuality: 100, effort: 6, lossless }).toFile(output);
        }
        variants.push([size, output]);
    }
    // Resizing flat-color artwork can make a lossless file larger. Do not offer
    // a variant when a larger, sharper version costs fewer bytes to download.
    const efficient = [];
    let smallest = Infinity;
    for (const variant of [...variants].reverse()) {
        const bytes = (await stat(variant[1])).size;
        if (bytes < smallest) efficient.unshift(variant);
        smallest = Math.min(smallest, bytes);
    }
    sources[file] = [width, height, efficient];
    for (const variant of variants) {
        if (!efficient.includes(variant)) await unlink(variant[1]);
    }
    totalOriginal += original.size;
    totalLargest += (await stat(efficient.at(-1)[1])).size;
}

const hero = {};
const heroTrims = {};
const repairedLayers = await prepareSkylineLayers(Array.from({ length: 5 }, (_, index) => `assets/home/repaired/layer${index + 1}.png`));
const overlapModified = (await stat("scripts/skyline-overlap.mjs")).mtimeMs;
async function transparentBounds(file, crop) {
    let image = sharp(file);
    if (crop) image = image.extract(crop);
    const { data, info } = await image.ensureAlpha().extractChannel("alpha").raw().toBuffer({ resolveWithObject: true });
    let left = info.width, top = info.height, right = -1, bottom = -1;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
        if (!data[y * info.width + x]) continue;
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    // Some skyline strips are entirely outside the narrow portrait crop.
    if (right < 0) return { left: 0, top: 0, width: 1, height: 1 };
    return { left, top, width: right - left + 1, height: bottom - top + 1 };
}
for (const name of ["bg", ...Array.from({ length: 8 }, (_, i) => `layer${i + 1}`)]) {
    const repaired = /^layer[1-5]$/.test(name);
    const file = `assets/home/${repaired ? "repaired/" : ""}${name}.png`;
    const input = repaired ? repairedLayers[Number(name.slice(5)) - 1] : file;
    const version = createHash("sha256").update(repaired ? input : await readFile(file)).digest("hex").slice(0, 12);
    if (repaired) {
        // Full-canvas alternatives support browsers without container units.
        await sharp(input).webp({ quality: 88, alphaQuality: 100, effort: 6 }).toFile(file.replace(/\.png$/, ".webp"));
    }
    const metadata = await sharp(file).metadata();
    const variants = [];
    for (const mobile of [false, true]) {
        const crop = mobile ? { left: 759, top: 0, width: 552, height: 1381 } : null;
        const canvasWidth = mobile ? 552 : metadata.width;
        const canvasHeight = metadata.height;
        const trim = name === "bg" ? null : await transparentBounds(input, crop);
        (heroTrims[name] ||= []).push(trim ? { ...trim, canvasWidth, canvasHeight } : null);
        const widths = mobile ? [384, 552] : [1280, 1600, metadata.width];
        const list = [];
        for (const width of widths) {
            const output = `assets/optimized/home/${name}${trim ? "-trim" : ""}${mobile ? "-portrait" : ""}-${width}.webp`;
            await mkdir(path.dirname(output), { recursive: true });
            let existing;
            try { existing = await stat(output); } catch {}
            if (!existing || existing.mtimeMs < Math.max((await stat(file)).mtimeMs, repaired ? overlapModified : 0)) {
                let image = sharp(input);
                if (crop || trim) image = image.extract({ left: (crop?.left || 0) + (trim?.left || 0), top: trim?.top || 0, width: trim?.width || crop.width, height: trim?.height || crop.height });
                await image.resize({ width: trim ? Math.max(1, Math.round(width * trim.width / canvasWidth)) : width }).webp({ quality: 88, alphaQuality: 100, effort: 6 }).toFile(output);
            }
            const actualWidth = trim ? Math.max(1, Math.round(width * trim.width / canvasWidth)) : width;
            if (!list.some(([size]) => size === actualWidth)) list.push([actualWidth, `${output}?v=${version}`]);
            else await unlink(output);
        }
        variants.push(list);
    }
    hero[name] = variants;
}
const compactSources = Object.fromEntries(Object.entries(sources).map(([file, [width, height, variants]]) => [file, [width, height, variants.map(([size]) => size)]]));
await writeFile("js/imageSources.js", `// Generated by npm run build. Original images are never modified.\nconst siteImageSources = ${JSON.stringify(compactSources)};\n`);
vm.runInContext(await read("js/content.js"), context);
vm.runInContext(await read("js/imageSources.js"), context);
vm.runInContext(await read("js/images.js"), context);
vm.runInContext(`const siteModalLinks = { slug(value) { return String(value).normalize("NFKD").replace(/[\\u0300-\\u036f]/g, "").replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); } };`, context);
vm.runInContext(await read("js/templates.js"), context);
const render = expression => vm.runInContext(expression, context);
const encode = value => JSON.stringify(value);
function region(html, name, content, initial) {
    const start = `<!-- ${name}:start -->`, end = `<!-- ${name}:end -->`;
    const existing = new RegExp(`${start}[\\s\\S]*?${end}`);
    return html.replace(existing.test(html) ? existing : initial, `${start}\n${content}\n${end}`);
}
function image(file, alt, sizes, extra = "") {
    return render(`siteImages.markup(${encode(file)}, ${encode(alt)}, ${encode(sizes)}, ${encode(extra)})`);
}
const srcset = list => list.map(([width, file]) => `./${file} ${width}w`).join(", ");

for (const [file, page] of [["index.html", "home"], ["about/index.html", "about"], ["events/index.html", "events"], ["store/index.html", "store"]]) {
    const prefix = page === "home" ? "./" : "../";
    let html = await read(file);
    const styles = `<style>html,body{background:#111720;color-scheme:dark}</style>\n    <link rel="stylesheet" href="${prefix}styles/site.min.css?v=performance-1">\n    <link rel="stylesheet" href="${prefix}styles/${page}.min.css?v=performance-1">`;
    // Replace only stylesheet elements; metadata and font preloads stay editable.
    html = html.replace(/\s*<style>html,body\{background:#111720;color-scheme:dark\}<\/style>/, "");
    let first = true;
    html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, () => {
        if (!first) return "";
        first = false;
        return styles;
    });
    const navbar = (await read("components/navbar.html")).replace(/data-site-path="([^"]*)"/g, (_, target) => `data-site-path="${target}"`)
        .replace(/href="\.\/([^"]*)"/g, (_, target) => `href="${prefix}${target}"`)
        .replace(/<img[^>]+>/, image("assets/logo/logoText.png", "HKSN", "122px"));
    const active = page === "home" ? "" : page === "about" ? "about/" : page === "events" ? "events/" : "store/";
    const currentNav = navbar.replace(`data-site-path="${active}" class="nav-link"`, `data-site-path="${active}" class="nav-link" aria-current="page"`);
    const footer = (await read("components/footer.html")).replace(/href="\.\/([^"]*)"/g, (_, target) => `href="${prefix}${target}"`)
        .replace(/<img[^>]+>/, image("assets/logo/logoTextWhite.png", "HKSN", "112px", 'loading="lazy"'));
    html = region(html, "navigation", `<div id="include-navbar">${currentNav}</div>`, /<div id="include-navbar"><\/div>/);
    html = region(html, "footer", `<div id="include-footer">${footer}</div>`, /<div id="include-footer"><\/div>/);
    const dataPaths = page === "home" ? [`assets/data/${homeYear}/events.json`, `assets/data/${homeYear}/carousel.json`]
        : page === "events" ? [`assets/data/${eventsYear}/events.json`]
        : page === "about" ? [`assets/members/${years[0]}/members.json`] : ["assets/data/member-card.json"];
    const snapshots = (await Promise.all(dataPaths.map(async source => `<script type="application/json" data-content-path="${source}">${JSON.stringify(await json(source)).replaceAll("<", "\\u003c")}</script>`))).join("\n");
    if (!html.includes("<!-- content-snapshots:start -->")) html = html.replace("</body>", "<!-- content-snapshots:start -->\n<!-- content-snapshots:end -->\n</body>");
    html = region(html, "content-snapshots", snapshots);
    if (page === "home" || page === "events") {
        const year = page === "home" ? homeYear : eventsYear;
        const events = await json(`assets/data/${year}/events.json`);
        const featured = page === "home";
        const markup = render(`siteTemplates.events(${encode(events)}, ${encode(year)}, ${featured})`);
        const attributes = featured ? 'class="events-grid" data-event-grid data-featured="true"' : 'id="events-grid" class="events-grid polaroid-board" data-event-grid data-polaroid-board';
        const key = render(`siteTemplates.key(${encode(events)})`);
        html = region(html, "event-cards", `<div ${attributes} data-content-key="${key}" data-year="${year}" aria-busy="false">${markup}</div>`, /<div[^>]*data-event-grid[^>]*>[\s\S]*?<\/div>/);
    }
    if (page === "about") {
        const members = await json(`assets/members/${years[0]}/members.json`);
        const ordered = [...members.filter(member => member.image && !/placeholder/i.test(member.image)), ...members.filter(member => !member.image || /placeholder/i.test(member.image))];
        const markup = ordered.map(member => render(`siteTemplates.member(${encode(member)}, ${encode(years[0])})`)).join("");
        const key = render(`siteTemplates.key(${encode(members)})`);
        html = region(html, "team-cards", `<div id="about-container" class="team-grid" data-content-key="${key}" data-year="${years[0]}" aria-busy="false">${markup}</div>`, /<div id="about-container"[^>]*>[\s\S]*?<\/div>/);
        html = html.replace(/<img\b[^>]*id="group-photo"[^>]*>/, image(`assets/members/${years[0]}/groupPhoto.jpg`, `The ${years[0].replace(/-(\d{2})(\d{2})$/, "–$2")} HKSN team at McGill`, "(max-width: 767px) calc(100vw - 40px), (max-width: 1280px) 53vw, 625px", 'id="group-photo" fetchpriority="high"'));
        html = html.replace(/<span id="year-selection">[^<]*<\/span>/, `<span id="year-selection">${years[0].replace(/-(\d{2})(\d{2})$/, "–$2")}</span>`);
        html = html.replace('id="previous-year" class="icon-button"', 'id="previous-year" class="icon-button"').replace(/(id="previous-year"[^>]*) hidden/, "$1");
    }
    if (page === "home" || page === "store") {
        html = html.replace(/<img\b[^>]*alt="The 2026–27 joint member card[^>]*>/, image("assets/membershipCard/2026-2027/front.png", "The 2026–27 joint member card, illustrated with rabbits, a crescent moon, and lanterns", "(max-width: 767px) calc(100vw - 90px), (max-width: 1280px) 40vw, 550px", page === "home" ? 'loading="lazy"' : 'fetchpriority="high"'));
    }
    if (page === "home") {
        const sizes = "max(100vw, 195svh)";
        const sceneSizes = (name, mobile) => {
            const trim = heroTrims[name][mobile ? 1 : 0];
            const factor = trim ? trim.width / trim.canvasWidth : 1;
            return `max(${100 * factor}vw, ${(mobile ? 52 : 195) * factor}svh)`;
        };
        const scene = name => `<source media="(max-width: 767px) and (max-aspect-ratio: 1/2)" ${name === "bg" ? "" : "data-"}srcset="${srcset(hero[name][1])}" sizes="${sceneSizes(name, true)}" type="image/webp"><source ${name === "bg" ? "" : "data-"}srcset="${srcset(hero[name][0])}" sizes="${sceneSizes(name, false)}" type="image/webp">`;
        html = html.replace(/<picture class="hero-base"[\s\S]*?<\/picture>/, `<picture class="hero-base" aria-hidden="true">${scene("bg")}<img src="./assets/home/bg.png" alt="" width="2070" height="1381" fetchpriority="high" decoding="async" draggable="false"></picture>`);
        html = html.replace(/<picture class="parallax-layer img(\d)"[^>]*>[\s\S]*?<\/picture>/g, (_, number) => `<picture class="parallax-layer img${number}" data-depth="${({ 1: "0.28", 2: "0.25", 3: "0.21", 4: "0.17", 5: "0.14", 6: "0.11", 7: "0.09", 8: "0.07" })[number]}">${scene(`layer${number}`)}<img data-src="./assets/home/${Number(number) <= 5 ? "repaired/" : ""}layer${number}.png" alt="" width="2070" height="1381" decoding="async" fetchpriority="low" draggable="false"></picture>`);
        html = html.replace(/(<h1 id="hero-title"[\s\S]*?)<img[^>]*>/, `$1${image("assets/logo/logoTextWhite.png", "Hong Kong Student Network (HKSN)", "(max-width: 767px) min(76vw, 300px), 400px", 'draggable="false"')}`);
        const firstSlide = (await json(`assets/data/${homeYear}/carousel.json`))[0];
        html = html.replace(/(<div class="carousel-item active">)<img[^>]*>/, `$1${image(firstSlide.image, firstSlide.alt, "(max-width: 767px) calc(100vw - 40px), (max-width: 1280px) 53vw, 630px", `loading="lazy"${firstSlide.poster ? ' class="poster-image"' : ""}`)}`);
    }
    if (page === "store") {
        const markup = render(`siteTemplates.partners(${encode(card)})`);
        const key = render(`siteTemplates.key(${encode(card)})`);
        html = region(html, "partner-directory", `<div id="partner-directory" class="partner-directory" data-content-key="${key}" aria-busy="false">${markup}</div>`, /<div id="partner-directory"[^>]*>[\s\S]*?<\/div>/);
        html = html.replace(/<img\b[^>]*alt="The 2026–27 sponsorship map[^>]*>/, image("assets/membershipCard/2026-2027/sponsorship-map.webp", "The 2026–27 sponsorship map showing partner locations across Montréal", "(max-width: 767px) calc(100vw - 40px), (max-width: 1280px) calc(100vw - 80px), 1200px", 'loading="lazy"'));
        html = html.replace(/(<p id="partner-count"[^>]*>)[\s\S]*?<\/p>/, `$1${card.partners.length} partners</p>`);
    }
    html = html.replace(/\s*<script defer[^>]*><\/script>/g, "");
    html = html.replace("</body>", `    <script defer src="${prefix}js/site.min.js?v=performance-1"></script>\n    <script defer src="${prefix}js/${page}.min.js?v=performance-1"></script>\n</body>`);
    html = html.replaceAll("https://build.invalid/", prefix).replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, "\n\n");
    await writeFile(file, html);
}

// Only the Bootstrap components used by this site; keep its battle-tested keyboard/focus behavior.
const bootstrapCSS = sass.compileString(`
@import "bootstrap/scss/functions";
@import "bootstrap/scss/variables";
@import "bootstrap/scss/variables-dark";
$theme-colors: map-get-multiple($theme-colors, ("primary"));
@import "bootstrap/scss/maps";
@import "bootstrap/scss/mixins";
@import "bootstrap/scss/utilities";
$utilities: (
  "display": (property: display, class: d, values: flex),
  "margin-start": (property: margin-left, class: ms, values: (auto: auto)),
  "margin-end": (property: margin-right, class: me, values: (4: $spacer * 1.5)),
  "flex-wrap": (property: flex-wrap, values: wrap),
  "align-items": (property: align-items, values: center),
  "column-gap": (property: column-gap, class: column-gap, values: (4: $spacer * 1.5))
);
@import "bootstrap/scss/root";
@import "bootstrap/scss/reboot";
@import "bootstrap/scss/type";
@import "bootstrap/scss/transitions";
@import "bootstrap/scss/dropdown";
@import "bootstrap/scss/buttons";
@import "bootstrap/scss/nav";
@import "bootstrap/scss/navbar";
@import "bootstrap/scss/modal";
@import "bootstrap/scss/carousel";
@import "bootstrap/scss/helpers/visually-hidden";
@import "bootstrap/scss/utilities/api";
`, { loadPaths: ["node_modules"], silenceDeprecations: ["import", "global-builtin", "color-functions"] }).css;
const copyright = "/*! Bootstrap v5.3.3 | MIT License | Copyright 2011-2024 The Bootstrap Authors */\n";
const usedContent = await Promise.all(["index.html", "about/index.html", "events/index.html", "store/index.html", "js/templates.js", "js/loaderMembers.js", "js/loaderEventModals.js"].map(read));
const [prunedBootstrap] = await new PurgeCSS().purge({
    content: usedContent.map(raw => ({ raw, extension: "html" })),
    css: [{ raw: bootstrapCSS }],
    safelist: ["active", "show", "showing", "hiding", "fade", "collapse", "collapsing", "collapsed", "modal-open", "modal-backdrop", "modal-static", "carousel-item-next", "carousel-item-prev", "carousel-item-start", "carousel-item-end", "pointer-event", "disabled"]
});
// Match the JS board's initial positions in CSS, before scripts/data have loaded.
// This prevents a grid-to-scatter flash and reserves the entire board's height.
const patterns = [[-8, 0, 0.06], [5, -0.04, 0.23], [-5, -0.03, 0], [7, 0.2, 0.12], [-9, 0.08, 0.25], [6, -0.1, 0.06]];
const count = (await json(`assets/data/${eventsYear}/events.json`)).length;
const ratio = 107.52 / 88.47;
let snapshotCSS = '.polaroid-board[data-content-key]:not(.is-scattered){--board-width:min(1200px,calc(100vw - 80px));--board-padding:min(44px,calc(var(--board-width)*.1));display:block;padding:0}.polaroid-board[data-content-key]:not(.is-scattered) .event-card{position:absolute;width:var(--polaroid-width)}@media(max-width:767.98px){.polaroid-board[data-content-key]:not(.is-scattered){--board-width:calc(100vw - 40px)}}';
for (const available of [1, 2, 3]) {
    const columns = Math.min(available, count || 1);
    const media = available === 1 ? '(max-width:599.98px)' : available === 2 ? '(min-width:600px) and (max-width:1039.98px)' : '(min-width:1040px)';
    const selector = '.polaroid-board[data-content-key]:not(.is-scattered)';
    const width = `min(316px,calc((var(--board-width) - var(--board-padding)*2)/${available + (available === 1 ? 0.06 : 0.35)}))`;
    const positions = Array.from({ length: count }, (_, index) => {
        const [rotation, x, y] = patterns[index % patterns.length];
        const angle = columns === 1 ? rotation * 0.6 : rotation;
        const radians = Math.abs(angle) * Math.PI / 180;
        return { angle, x, y, edgeX: (Math.cos(radians) + ratio * Math.sin(radians) - 1) / 2, edgeY: (ratio * Math.cos(radians) + Math.sin(radians) - ratio) / 2, row: Math.floor(index / columns), column: index % columns };
    });
    const stagger = columns === 1 ? 0.25 : columns === 2 ? 0.65 : 1;
    const step = columns === 1 ? 1.14 : 1.12;
    const height = Math.max(0, ...positions.map(p => (p.row * step + p.y * stagger + 1) * ratio + p.edgeY));
    snapshotCSS += `@media${media}{${selector}{--polaroid-width:${width};height:calc(var(--board-padding)*2 + var(--polaroid-width)*${height})}`;
    positions.forEach((p, index) => {
        const stepX = available === 1 ? '0px' : `((var(--board-width) - var(--board-padding)*2 - var(--polaroid-width))/${available - 1})`;
        const x = `((var(--board-width) - var(--polaroid-width) - ${stepX}*${columns - 1})/2 + ${stepX}*${p.column} + var(--polaroid-width)*${p.x})`;
        const y = `(var(--board-padding) + var(--polaroid-width)*${(p.row * step + p.y * stagger) * ratio})`;
        snapshotCSS += `${selector} .event-card:nth-child(${index + 1}){transform:rotate(${p.angle}deg);left:clamp(calc(var(--polaroid-width)*${p.edgeX} + 8px),calc(${x}),calc(var(--board-width) - var(--polaroid-width)*${1 + p.edgeX} - 8px));top:clamp(calc(var(--polaroid-width)*${p.edgeY} + 12px),calc(${y}),calc(var(--board-padding)*2 + var(--polaroid-width)*${height - ratio - p.edgeY} - 12px))}`;
    });
    snapshotCSS += '}';
}
const sharedCSS = ["global", "navbar", "buttons", "links", "modals", "footer"];
let heroCSS = '.parallax-layer{container-type:size}.parallax-layer img{position:absolute;max-width:none;object-fit:fill;--scene-width:max(100cqw,149.8913830557567cqh);--scene-height:max(100cqh,66.71497584541063cqw);width:calc(var(--scene-width)*var(--trim-width));height:calc(var(--scene-height)*var(--trim-height));left:calc((100cqw - var(--scene-width))/2 + var(--scene-width)*var(--trim-left));top:calc((100cqh - var(--scene-height))/2 + var(--scene-height)*var(--trim-top))}';
for (const mobile of [false, true]) {
    if (mobile) heroCSS += '@media(max-width:767px) and (max-aspect-ratio:1/2){.parallax-layer img{--scene-width:max(100cqw,39.97103548153512cqh);--scene-height:max(100cqh,250.18115942028984cqw)}';
    for (let index = 1; index <= 8; index++) {
        const trim = heroTrims[`layer${index}`][mobile ? 1 : 0];
        heroCSS += `.img${index}{--trim-width:${trim.width / trim.canvasWidth};--trim-height:${trim.height / trim.canvasHeight};--trim-left:${trim.left / trim.canvasWidth};--trim-top:${trim.top / trim.canvasHeight}}`;
    }
    if (mobile) heroCSS += '}';
}
heroCSS += '.parallax-layer.original-scene{--trim-width:1;--trim-height:1;--trim-left:0;--trim-top:0}.parallax-layer.original-scene img{--scene-width:max(100cqw,149.8913830557567cqh);--scene-height:max(100cqh,66.71497584541063cqw)}';
heroCSS += '.hero.legacy-scene .parallax-layer img{position:static;max-width:100%;width:100%;height:100%;object-fit:cover}';
await writeFile("styles/site.min.css", copyright + (await esbuild.transform(prunedBootstrap.css + (await Promise.all(sharedCSS.map(name => read(`styles/${name}.css`)))).join("\n"), { loader: "css", minify: true, target: ["safari16", "chrome109"] })).code);
for (const [page, files] of Object.entries({ home: ["home", "events"], about: ["about"], events: ["events", "eventPolaroids"], store: ["store"] })) {
    await writeFile(`styles/${page}.min.css`, (await esbuild.transform((await Promise.all(files.map(name => read(`styles/${name}.css`)))).join("\n") + (page === "events" ? snapshotCSS : page === "home" ? heroCSS : ""), { loader: "css", minify: true, target: ["safari16", "chrome109"] })).code);
}
const vendor = await esbuild.build({ stdin: { contents: `export { default as Collapse } from "bootstrap/js/src/collapse.js"; export { default as Dropdown } from "bootstrap/js/src/dropdown.js"; export { default as Modal } from "bootstrap/js/src/modal.js"; export { default as Carousel } from "bootstrap/js/src/carousel.js";`, resolveDir: root }, bundle: true, format: "iife", globalName: "bootstrap", write: false, minify: true, target: ["safari16", "chrome109"] });
const sharedJS = ["config", "content", "images", "templates", "modalLinks", "loaderComponents"];
const minifyJS = async files => (await esbuild.transform((await Promise.all(files.map(name => read(`js/${name}.js`)))).join("\n"), { minify: true, target: ["safari16", "chrome109"] })).code;
await writeFile("js/site.min.js", vendor.outputFiles[0].text + "\nconst siteImageSources = {};\n" + await minifyJS(sharedJS));
for (const [page, files] of Object.entries({ home: ["imagePreloader", "parallax", "loaderCarousel", "loaderEventModals", "loaderEvents"], about: ["loaderMembers"], events: ["loaderEventModals", "eventPolaroids", "loaderEvents"], store: ["loaderSponsors"] })) {
    const pageSources = Object.fromEntries(Object.entries(compactSources).filter(([file]) => file.startsWith("assets/logo/")
        || (page === "about" && file.startsWith("assets/members/"))
        || (["home", "events"].includes(page) && file.startsWith("assets/events/"))
        || (["home", "store"].includes(page) && file.startsWith("assets/membershipCard/"))));
    await writeFile(`js/${page}.min.js`, `Object.assign(siteImageSources,${JSON.stringify(pageSources)});\n` + await minifyJS(files));
}
for (const file of ["index.html", "about/index.html", "events/index.html", "store/index.html"]) {
    let html = await read(file);
    for (const match of [...html.matchAll(/(?:styles|js)\/[a-z]+\.min\.(?:css|js)\?v=[^"]+/g)]) {
        const asset = match[0].split("?")[0];
        const hash = createHash("sha256").update(await readFile(asset)).digest("hex").slice(0, 12);
        html = html.replace(match[0], `${asset}?v=${hash}`);
    }
    await writeFile(file, html);
}
await mkdir("assets/vendor", { recursive: true });
await copyFile("node_modules/bootstrap/LICENSE", "assets/vendor/bootstrap-LICENSE.txt");
await copyFile("node_modules/@popperjs/core/LICENSE.md", "assets/vendor/popper-LICENSE.md");
console.log(`Optimized ${Object.keys(sources).length} originals without replacing them: ${(totalOriginal / 1048576).toFixed(1)} MiB → ${(totalLargest / 1048576).toFixed(1)} MiB (largest alternatives).`);
