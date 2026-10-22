import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  email,
  projects,
  featuredProjects,
  filterProjects,
} from "../projects.js";
import { publicRepositories, repositoryVerifiedAt } from "../repository-state.js";
import { projectIdentities } from "../identities.js";
import { projects as publicProjects, featuredProjects as publicFeaturedProjects } from "../public-projects.js";
import { portfolioProjectIds, featuredProjectIds } from "../portfolio-selection.js";

// Check the actual asset headers so stale dimensions cannot stretch a preview.
function assetDimensions(image) {
  const bytes = readFileSync(new URL(`../${image}`, import.meta.url));
  if (image.endsWith(".svg")) {
    const root = bytes.toString().match(/<svg\b[^>]*>/)?.[0];
    assert.ok(root, `${image}: SVG root missing`);
    const viewBox = root.match(/\bviewBox=["']([^"']+)["']/)?.[1]
      .trim().split(/[\s,]+/).map(Number);
    return viewBox?.length === 4
      ? { width: viewBox[2], height: viewBox[3] }
      : {
          width: Number(root.match(/\bwidth=["']([\d.]+)/)?.[1]),
          height: Number(root.match(/\bheight=["']([\d.]+)/)?.[1]),
        };
  }
  if (image.endsWith(".png")) {
    assert.equal(bytes.subarray(1, 4).toString(), "PNG");
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (/\.jpe?g$/i.test(image)) {
    assert.equal(bytes.readUInt16BE(0), 0xffd8, `${image}: JPEG start marker`);
    for (let offset = 2; offset + 4 <= bytes.length;) {
      assert.equal(bytes[offset], 0xff, `${image}: JPEG segment marker`);
      while (bytes[offset] === 0xff) offset += 1;
      const marker = bytes[offset++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      const size = bytes.readUInt16BE(offset);
      assert.ok(size >= 2 && offset + size <= bytes.length, `${image}: valid JPEG segment length`);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3) };
      }
      offset += size;
    }
    assert.fail(`${image}: JPEG dimensions missing`);
  }
  assert.equal(bytes.subarray(0, 4).toString(), "RIFF", `${image}: WebP header`);
  assert.equal(bytes.subarray(8, 12).toString(), "WEBP", `${image}: WebP type`);
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const type = bytes.subarray(offset, offset + 4).toString();
    const size = bytes.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (type === "VP8X") {
      return { width: 1 + bytes.readUIntLE(data + 4, 3), height: 1 + bytes.readUIntLE(data + 7, 3) };
    }
    if (type === "VP8 ") {
      return { width: bytes.readUInt16LE(data + 6) & 0x3fff, height: bytes.readUInt16LE(data + 8) & 0x3fff };
    }
    if (type === "VP8L") {
      const dimensions = bytes.readUInt32LE(data + 1);
      return { width: 1 + (dimensions & 0x3fff), height: 1 + ((dimensions >>> 14) & 0x3fff) };
    }
    offset = data + size + (size % 2);
  }
  assert.fail(`${image}: image dimensions missing`);
}

const expectedIds = [
  "BriefBooth.com",
  "Showrunner-ICanRunAShow",
  "nycstandupopenmicmaster",
  "usbmic",
  "micro-short-website",
  "The-Bit-Binder",
  "MyGigCalendar",
  "Bill-Spilt",
  "bleepkit",
  "taylordrewwebsite",
  "PinsAndNeedlesComedyWebsite",
  "Open-Micer-Timer",
  "vlognudge",
  "dictype",
  "tlcmassagewellness",
  "the-trip-handler",
  "Role-Call",
];

const removedIds = [
  "HealYourHeart",
  "laugh-extractor",
  "Laugh-Map",
  "markvegas",
  "mystorydailjournal",
  "CONTROLLEREVENT",
  "comedysub",
  "staybusy",
];

test("the catalog represents all 17 public projects once, excluding profile and portfolio repos", () => {
  assert.equal(projects.length, 17);
  assert.equal(new Set(projects.map((project) => project.id)).size, 17);
  assert.deepEqual(
    projects.map((project) => project.id).sort(),
    expectedIds.sort(),
  );
  assert.equal(email, "admin@customtechbuilt4u.com");
});

test("featured work is ordered and points to the canonical catalog entries", () => {
  assert.deepEqual(
    featuredProjects.map((project) => project.id),
    [
      "Showrunner-ICanRunAShow",
      "The-Bit-Binder",
      "the-trip-handler",
      "Bill-Spilt",
      "Role-Call",
      "MyGigCalendar",
    ],
  );
  for (const project of featuredProjects) {
    assert.equal(
      project,
      projects.find((entry) => entry.id === project.id),
    );
  }
});

test("the public portfolio selects ten complete projects while the audited inventory stays internal", () => {
  const expectedPublic = [
    "Showrunner-ICanRunAShow", "The-Bit-Binder", "MyGigCalendar", "Open-Micer-Timer", "Bill-Spilt",
    "the-trip-handler", "PinsAndNeedlesComedyWebsite", "usbmic", "BriefBooth.com", "micro-short-website",
  ];
  const expectedFeatured = [
    "BriefBooth.com", "Showrunner-ICanRunAShow", "The-Bit-Binder", "micro-short-website", "the-trip-handler", "Bill-Spilt", "PinsAndNeedlesComedyWebsite", "MyGigCalendar",
  ];
  assert.deepEqual(portfolioProjectIds, expectedPublic);
  assert.deepEqual(featuredProjectIds, expectedFeatured);
  assert.equal(publicProjects.length, 10);
  assert.deepEqual(publicProjects.map((project) => project.id).sort(), [...expectedPublic].sort());
  assert.deepEqual(publicFeaturedProjects.map((project) => project.id), expectedFeatured);
  assert.deepEqual(publicFeaturedProjects.filter((project) => project.projectType === "Website").map((project) => project.id),
    ["micro-short-website", "PinsAndNeedlesComedyWebsite"], "The featured range includes two distinct websites");
  assert.equal(publicFeaturedProjects.filter((project) => /web application$/i.test(project.projectType)).length, 4);
  assert.equal(publicFeaturedProjects.filter((project) => project.category === "ios").length, 2);
  assert.equal(projects.length, 17, "Unselected evidence remains in the internal audited inventory");
  for (const project of publicProjects) {
    assert.ok(project.sourceAvailable);
    assert.match(project.caseUrl, /^\.\/work\/[a-z0-9-]+\/$/);
  }
  for (const project of publicFeaturedProjects) assert.equal(project, publicProjects.find((entry) => entry.id === project.id));
  for (const id of ["Role-Call", "bleepkit", "dictype", "vlognudge", "nycstandupopenmicmaster", "tlcmassagewellness", "taylordrewwebsite"]) {
    assert.ok(projects.some((project) => project.id === id), `${id}: internal evidence is retained`);
    assert.equal(publicProjects.some((project) => project.id === id), false, `${id}: excluded from public pages and search data`);
  }
});

test("BriefBooth is a leading live product with honest public repository and capture labels", () => {
  const project = publicProjects.find((entry) => entry.id === "BriefBooth.com");
  assert.ok(project, "BriefBooth is part of the approved public selection");
  assert.equal(publicFeaturedProjects[0], project, "The booking platform is the first featured project");
  assert.equal(project.caseUrl, "./work/briefbooth/");
  assert.equal(project.demoUrl, "https://briefbooth.com/");
  assert.equal(project.sourceAvailable, true, "The public repository is eligible for the portfolio");
  assert.equal(project.codeAvailable, false, "A README-only repository is not labeled application source");
  assert.equal(project.repoLabel, "Project repository");
  assert.match(project.notes, /README.*rather than.*source/i);
  assert.match(project.notes, /no private.*records/i);
  assert.equal(project.imageKind, "app-screenshot");
  assert.match(project.imageLabel, /live.*capture/i);
  assert.match(project.previewContext, /live.*(?:website|capture).*demo/i);
  assert.equal(project.gallery.length, 3);
  for (const frame of project.gallery) {
    assert.equal(frame.sourceKind, "live-site-capture");
    assert.equal(new URL(frame.sourceUrl).hostname, "briefbooth.com");
    assert.match(frame.caption, /live.*(?:website|capture)/i);
    assert.match(frame.imageAlt, /BriefBooth/i);
    assert.deepEqual(assetDimensions(frame.image), { width: frame.width, height: frame.height });
  }
  assert.equal(project.gallery[0].width, 1440);
  assert.equal(project.gallery[0].height, 900);
  assert.ok(project.gallery.some((frame) => frame.portrait && frame.width === 390 && frame.height === 1195),
    "The showcase includes a real mobile view");
  assert.equal(project.iconSource, "https://briefbooth.com/icon.svg");
});

test("the audited catalog preserves inventory dates and canonical source links", () => {
  assert.equal(repositoryVerifiedAt, "2026-10-12");
  assert.equal(Object.keys(publicRepositories).length, 17);
  assert.equal(publicRepositories["BriefBooth.com"].verifiedAt, "2026-10-19");
  assert.equal(publicRepositories["BriefBooth.com"].codeAvailable, false);
  assert.equal(publicRepositories["micro-short-website"].verifiedAt, "2026-10-22");
  assert.equal(publicRepositories["micro-short-website"].headSha, "f55e1f820e78a99bf9a9ebbb97a1ac47be6e812f");
  assert.deepEqual(
    projects.map((project) => project.id).sort(),
    Object.keys(publicRepositories).sort(),
  );
  for (const [id, repository] of Object.entries(publicRepositories)) {
    const project = projects.find((entry) => entry.id === id);
    assert.ok(project, `${id}: current GitHub project must be represented`);
    assert.equal(project.repoUrl, repository.repoUrl);
    assert.equal(project.sourceAvailable, true);
    assert.equal(project.repositoryArchived, repository.archived);
    assert.match(project.repositoryHead, /^[a-f0-9]{40}$/);
  }
  assert.ok(projects.every((project) => project.sourceAvailable === true));
  assert.equal(projects.find((project) => project.id === "tlcmassagewellness").repositoryArchived, true);
  assert.equal(projects.some((project) => project.id === "taylosite"), false);
});

test("removed repositories cannot appear in the catalog or search results", () => {
  for (const id of removedIds) {
    assert.equal(projects.some((project) => project.id === id), false, `${id}: removed from catalog`);
    assert.deepEqual(filterProjects(projects, "all", id), [], `${id}: removed from search`);
  }
});

test("the homepage opening shows real website and desktop work while preserving the supplied app banners", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const attribute = (tag, name) => tag.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1];
  const capabilities = html.match(/<nav\b[^>]*class="hero-capabilities"[^>]*>[\s\S]*?<\/nav>/)?.[0];
  assert.ok(capabilities, "The opening includes native navigation for the development range");
  assert.equal([...capabilities.matchAll(/<a\b[^>]*class="hero-capability"/g)].length, 4);
  for (const label of ["iPhone & iPad apps", "Business websites", "Web apps & platforms", "Desktop software"]) {
    assert.ok(capabilities.replaceAll("&amp;", "&").includes(label), `${label}: visible in the opening`);
  }
  const hero = html.match(/<section class="intro wrap"[\s\S]*?<\/section>/)?.[0];
  assert.ok(hero, "Hero banners must be present");
  assert.match(hero, /aria-label="Featured websites, desktop software, and iPhone apps"/);
  assert.match(hero, /<div\b[^>]*class="hero-app-previews"/,
    "The supplied banners stay in their own group outside the project explorer");
  const buttons = [...hero.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)]
    .filter(([, attributes]) => attribute(attributes, "class")?.split(/\s+/).includes("hero-project"));
  assert.deepEqual(buttons.map(([, attributes]) => [attribute(attributes, "data-project"), attribute(attributes, "aria-label")]), [
    ["The-Bit-Binder", "View the BitBinder project"],
    ["MyGigCalendar", "View the My Gig Calendar project"],
  ]);
  assert.equal([...hero.matchAll(/\bdata-project=/g)].length, 2);
  assert.equal([...hero.matchAll(/<img\b[^>]*class="hero-project-screen"/g)].length, 2);
  for (const [, attributes, contents] of buttons) {
    const id = attribute(attributes, "data-project");
    const project = projects.find((entry) => entry.id === id);
    assert.equal(project.sourceAvailable, true);
    assert.ok(contents.includes(`class="hero-project-screen" src="${project.image}" alt="${project.imageAlt}" width="1920" height="1080"`),
      `${id}: opening artwork matches the supplied banner cover and its actual dimensions`);
    assert.match(project.image, /\/banner-1920x1080\.png$/);
    assert.equal(project.gallery[0].sourceKind, "owner-supplied-product-artwork");
    assert.equal(contents.replace(/<img\b[^>]*>/g, "").trim(), "", `${id}: only the banner is inside its button`);
  }
  const explorer = [...hero.matchAll(/<fieldset\b([^>]*)>([\s\S]*?)<\/fieldset>/g)]
    .find(([, attributes]) => attribute(attributes, "class")?.split(/\s+/).includes("hero-explorer"))?.[0];
  assert.ok(explorer, "Real project choices use a native fieldset without depending on JavaScript");
  assert.match(explorer, /<legend\b[^>]*>[\s\S]*?\S[\s\S]*?<\/legend>/,
    "The explorer has a visible group name");
  assert.doesNotMatch(explorer, /class="hero-project"|hero-project-screen/,
    "The supplied app banners remain outside the selectable previews");
  const radioChoices = [...explorer.matchAll(/<input\b[^>]*>/g)]
    .map(([tag]) => tag).filter((tag) => attribute(tag, "type") === "radio");
  assert.equal(radioChoices.length, 3);
  assert.deepEqual(radioChoices.map((tag) => attribute(tag, "name")), Array(3).fill("hero-project"));
  assert.deepEqual(radioChoices.map((tag) => attribute(tag, "value")), ["briefbooth", "website", "desktop"]);
  assert.deepEqual(radioChoices.filter((tag) => /\schecked(?:\s|=|\/?>)/.test(tag))
    .map((tag) => attribute(tag, "value")), ["briefbooth"], "Only BriefBooth is selected initially");
  const controls = radioChoices.map((tag) => attribute(tag, "aria-controls"));
  assert.equal(new Set(controls).size, 3, "Each choice controls a different project preview");
  for (const control of controls) assert.match(control, /^hero-/);
  const choiceLabels = [...explorer.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/g)];
  for (const radio of radioChoices) {
    const value = attribute(radio, "value");
    const label = choiceLabels.find(([, , contents]) => contents.includes(radio))?.[2];
    assert.ok(label, `${value}: its wrapping native label activates the radio`);
    assert.equal([...label.matchAll(/<input\b/g)].length, 1, `${value}: its label controls one radio`);
    assert.match(label, /hero-choice-screen/);
    assert.ok(label.replace(/<[^>]*>/g, "").trim(), `${value}: its choice has a text label`);
  }
  const platformCards = [...explorer.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
    .filter(([, attributes]) => attribute(attributes, "class")?.split(/\s+/).includes("hero-platform-project"));
  const thumbnails = [...explorer.matchAll(/<img\b[^>]*>/g)]
    .map(([tag]) => tag).filter((tag) => attribute(tag, "class")?.split(/\s+/).includes("hero-choice-screen"));
  assert.equal(platformCards.length, 3, "Website, web app, and desktop previews are present in the HTML");
  assert.equal(thumbnails.length, 3, "Every native choice includes its genuine project thumbnail");
  for (const [index, [id, status, imageDescription, displayName]] of [
    ["BriefBooth.com", "Live website capture", /BriefBooth.*(?:booking|consultation|homepage)/i, "BriefBooth"],
    ["micro-short-website", "Repository website capture", /Micro-short.*(?:film|website).*home/i, "Micro-short Film Website"],
    ["usbmic", "Release candidate", /SobStage.*repository product artwork/i, "SobStage"],
  ].entries()) {
    const project = publicProjects.find((entry) => entry.id === id);
    const frame = project.gallery[0];
    const [, attributes, contents] = platformCards[index];
    assert.equal(attribute(attributes, "id"), controls[index], `${id}: its radio identifies the matching panel`);
    assert.ok(attributes.includes(`href="${project.caseUrl}"`), `${id}: the preview links to its real project story`);
    const screen = contents.match(/<img class="hero-platform-screen"[^>]*>/)?.[0];
    assert.ok(screen, `${id}: the real application screen is present`);
    assert.ok(screen.includes(`src="${frame.image}"`), `${id}: the real screenshot matches the catalog`);
    assert.ok(screen.includes(`width="${frame.width}" height="${frame.height}"`), `${id}: screenshot dimensions match the original`);
    assert.match(attribute(screen, "alt"), imageDescription,
      `${id}: the artwork has a project-specific description`);
    const thumbnail = thumbnails[index];
    assert.equal(attribute(thumbnail, "src"), frame.image, `${id}: its thumbnail uses the same genuine source`);
    assert.equal(attribute(thumbnail, "width"), String(frame.width));
    assert.equal(attribute(thumbnail, "height"), String(frame.height));
    assert.equal(attribute(thumbnail, "alt"), "", `${id}: its choice label supplies the thumbnail's accessible name`);
    if (project.icon) {
      assert.ok(contents.includes(`src="${project.icon}" alt="" width="${project.iconWidth}" height="${project.iconHeight}"`),
        `${id}: the project uses its authentic icon`);
    } else {
      assert.match(contents, /class="project-initials">MS<\/span>/,
        "Micro-short uses its honest neutral initials rather than an invented logo");
    }
    const caption = contents.match(/<div\b[^>]*class="hero-platform-caption"[^>]*>([\s\S]*?)<\/div>/)?.[1];
    assert.ok(caption, `${id}: its project caption is outside the image`);
    assert.ok(caption.replaceAll("&amp;", "&").includes(displayName));
    assert.ok(caption.includes(status), `${id}: the preview identifies its development or demo status`);
    if (frame.sourceKind === "repository-product-artwork") {
      assert.match(caption, /Repository product artwork/i, `${id}: repository artwork is identified below its image`);
    }
    assert.deepEqual(assetDimensions(frame.image), { width: frame.width, height: frame.height });
  }
  const heroClasses = [...hero.matchAll(/\bclass="([^"]*)"/g)].flatMap(([, value]) => value.split(/\s+/));
  for (const name of ["hero-web", "hero-phone", "hero-orbit", "hero-asterisk", "hero-project-info", "hero-project-icon", "hero-project-copy", "hero-project-arrow"]) {
    assert.ok(!heroClasses.includes(name), `${name}: no decorative mockup or text over the supplied artwork`);
  }
  assert.doesNotMatch(hero, /Mark Vegas|markvegas/i);
  for (const id of removedIds) {
    assert.ok(!hero.includes(`data-project="${id}"`), `${id}: removed from hero`);
  }
});

test("selected products have complete cases and the leading stories have traceable proof and screens", () => {
  for (const project of featuredProjects) {
    assert.ok(project.clientSummary.trim());
    assert.ok(project.challenge.trim());
    assert.ok(project.build.trim());
    assert.ok(project.demonstrates.length >= 3);
    assert.ok(project.demoUrl);
    assert.ok(project.image);
  }
  for (const project of featuredProjects.slice(0, 3)) {
    assert.equal(project.highlights.length, 3);
    for (const item of project.highlights) {
      assert.ok(item.title.trim());
      assert.ok(item.text.trim());
      assert.ok(project.sources.includes(item.source));
    }
    assert.ok(project.gallery.length >= 2);
    for (const frame of project.gallery) {
      assert.ok(frame.label.trim());
      assert.ok(frame.caption.trim());
      for (const image of [frame, frame.companion].filter(Boolean)) {
        assert.ok(image.imageAlt.trim());
        assert.ok(image.width > 0 && image.height > 0);
        assert.ok(existsSync(new URL(`../${image.image}`, import.meta.url)));
        assert.ok(project.sources.includes(image.sourceUrl));
      }
    }
  }
});

test("catalog entries have usable content, owned HTTPS source links, and known local assets", () => {
  const tones = new Set([
    "sage",
    "peach",
    "blue",
    "slate",
    "yellow",
    "dark",
  ]);
  for (const project of projects) {
    assert.ok(project.title.trim());
    assert.ok(project.summary.trim());
    assert.ok(project.stack.length > 0);
    assert.ok(project.features.length > 0);
    assert.ok(["web", "ios", "desktop"].includes(project.category));
    assert.ok(tones.has(project.tone));
    assert.equal(typeof project.portrait, "boolean");
    assert.equal(typeof project.experiment, "boolean");
    assert.equal(
      project.repoUrl,
      `https://github.com/taylordrew4u2/${project.id}`,
    );
    assert.ok(project.sources.includes(project.repoUrl));
    for (const link of [
      project.repoUrl,
      project.demoUrl,
      ...project.sources,
    ].filter(Boolean)) {
      assert.equal(new URL(link).protocol, "https:");
    }
    if (project.image) {
      assert.match(project.image, /^\.\/assets\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(webp|png|svg|jpe?g)$/);
      assert.ok(
        existsSync(new URL(`../${project.image}`, import.meta.url)),
        `${project.id}: missing ${project.image}`,
      );
      assert.ok(project.imageAlt.trim());
    }
  }
});

test("every public project has a purpose, three distinct workflows, and a visible capture context", () => {
  assert.deepEqual(Object.keys(projectIdentities).sort(), projects.map((project) => project.id).sort());
  for (const project of projects) {
    assert.ok(project.purpose?.trim(), `${project.id}: plain-language purpose required`);
    assert.equal(project.workflows?.length, 3, `${project.id}: three workflow labels required`);
    assert.ok(project.workflows.every((workflow) => typeof workflow === "string" && workflow.trim()));
    assert.equal(new Set(project.workflows).size, 3, `${project.id}: workflows must be distinguishable`);
    assert.ok(project.previewContext?.trim(), `${project.id}: capture context required`);
  }
});

test("all 16 genuine project icons match their asset dimensions and have primary source provenance", () => {
  const withIcons = projects.filter((project) => project.icon);
  const iconKinds = new Set(["brand-mark", "app-icon", "ios-app-icon", "desktop-app-icon", "favicon"]);
  assert.equal(withIcons.length, 16);
  for (const project of withIcons) {
    assert.match(project.icon, /^\.\/assets\/project-icons\/[a-z0-9-]+\.(png|svg)$/);
    assert.ok(existsSync(new URL(`../${project.icon}`, import.meta.url)), `${project.id}: icon file required`);
    assert.ok(Number.isInteger(project.iconWidth) && project.iconWidth > 0);
    assert.ok(Number.isInteger(project.iconHeight) && project.iconHeight > 0);
    assert.deepEqual(assetDimensions(project.icon), {
      width: project.iconWidth,
      height: project.iconHeight,
    }, `${project.id}: icon dimensions match the file`);
    assert.ok(iconKinds.has(project.iconKind), `${project.id}: authentic icon type required`);
    assert.ok(project.iconNotes?.trim(), `${project.id}: icon origin documented`);
    assert.ok(project.sources.includes(project.iconSource), `${project.id}: icon source included in project provenance`);
    const source = new URL(project.iconSource);
    assert.equal(source.protocol, "https:");
    if (project.id === "taylordrewwebsite") {
      assert.equal(source.href, "https://www.taylordrew4u.com/favicon.svg");
    } else if (project.id === "BriefBooth.com") {
      assert.equal(source.hostname, "briefbooth.com");
      assert.equal(project.iconKind, "favicon");
      assert.match(project.iconNotes, /live|public|production/i);
    } else {
      assert.ok(["github.com", "raw.githubusercontent.com"].includes(source.hostname));
      const segments = decodeURIComponent(source.pathname).split("/").filter(Boolean);
      assert.equal(segments[0], "taylordrew4u2");
      assert.equal(segments[1], project.id);
      assert.ok(segments.some((segment) => /^[a-f0-9]{40}$/.test(segment)), `${project.id}: icon source pinned to a revision`);
    }
  }
});

test("the film website uses neutral initials and preserves its five original repository captures", () => {
  const withoutIcons = projects.filter((project) => !project.icon);
  assert.deepEqual(withoutIcons.map((project) => project.id), ["micro-short-website"]);
  const film = publicProjects.find((project) => project.id === "micro-short-website");
  assert.ok(film, "The original film website is part of the approved public selection");
  assert.equal(film.icon, null);
  assert.equal(film.iconFallback, "MS");
  assert.equal(film.iconKind, "neutral-initials");
  assert.equal(film.iconSource, undefined);
  assert.match(film.iconNotes, /not an official project logo/i);
  assert.equal(film.caseUrl, "./work/micro-short-film-website/");
  assert.equal(film.image, "./assets/micro-short/home.jpg");
  assert.equal(film.imageKind, "app-screenshot");
  assert.equal(film.imageLabel, "Repository website capture");
  const originals = [
    ["home", "Film homepage", "55f83607570f9496adac9d84d93673b5f23833d572cce651451c0dfabac0d8a7"],
    ["awards", "Festival recognition", "701c3c042ce3658320cb2b42336ba0e55abada719e9abdbb53d50206c14d42a2"],
    ["cast", "Cast", "0346f0a2815a4d8880882005e536a660f655a4c35b6badf80902d9528c417841"],
    ["crew", "Crew", "ce5f775dc2509b89a774db6379f44b8a7e8c4c821e3389fcced56a08ccf2cd4d"],
    ["contact", "Film contact", "b36983f25dd4683e6a67b10c39a0fcf2152e1d0d0db024809a8799013bb84f5d"],
  ];
  assert.deepEqual(film.gallery.map((frame) => frame.label), originals.map(([, label]) => label));
  for (const [index, [file, , sha256]] of originals.entries()) {
    const frame = film.gallery[index];
    assert.equal(frame.image, `./assets/micro-short/${file}.jpg`);
    assert.equal(frame.sourceKind, "repository-website-capture");
    assert.equal(frame.imageKind, "app-screenshot");
    assert.equal(frame.imageLabel, "Repository website capture");
    assert.equal(frame.portrait, false);
    assert.equal(frame.sourceUrl, `https://github.com/taylordrew4u2/micro-short-website/blob/f55e1f820e78a99bf9a9ebbb97a1ac47be6e812f/docs/media/screen-${file}.jpg`);
    assert.deepEqual(assetDimensions(frame.image), { width: 1600, height: 1000 });
    assert.equal(frame.width, 1600);
    assert.equal(frame.height, 1000);
    assert.equal(createHash("sha256").update(readFileSync(new URL(`../${frame.image}`, import.meta.url))).digest("hex"), sha256,
      `${file}: original repository bytes preserve the image's composition and color`);
  }
});

test("App Store listings, RoleCall development captures, and known unavailable demos are represented accurately", () => {
  const find = (id) => projects.find((project) => project.id === id);
  for (const [id, listing] of [
    ["The-Bit-Binder", "https://apps.apple.com/us/app/the-bitbinder/id6756085897"],
    ["MyGigCalendar", "https://apps.apple.com/us/app/my-gig-calendar/id6760590068"],
    ["Open-Micer-Timer", "https://apps.apple.com/us/app/open-micer-timer/id6756205253"],
  ]) {
    const project = find(id);
    assert.equal(project.demoUrl, listing);
    assert.equal(project.demoLabel, "App Store");
    assert.equal(project.badge, "APP STORE");
    assert.equal(project.experiment, false);
  }
  assert.ok(find("Open-Micer-Timer").sources.includes(find("Open-Micer-Timer").demoUrl));
  assert.equal(find("Role-Call").demoUrl, "https://rolecall.space");
  const role = find("Role-Call");
  assert.equal(role.badge, "DEV PREVIEW");
  assert.equal(role.imageKind, "product-artwork");
  assert.equal(role.gallery[0].sourceKind, "repository-product-artwork");
  assert.deepEqual(role.gallery.map((frame) => frame.label), ["Product overview", "Shot list", "Script workspace"]);
  for (const frame of role.gallery.slice(1)) {
    assert.equal(frame.imageKind, "development-capture");
    assert.equal(frame.imageLabel, "Development preview");
    assert.match(frame.previewContext, /development capture.*fictional/i);
    assert.match(frame.image, /\.(webp|png)$/);
    assert.match(frame.caption, /development capture.*actual.*sample/i);
    assert.match(frame.sourceUrl, /\/components\/(ShotListBoard|ScriptWorkspace)\.tsx$/);
  }
  assert.equal(find("nycstandupopenmicmaster").demoUrl, null);
  assert.match(find("usbmic").notes, /physical[- ]microphone validation/i);
});

test("all 17 public projects have traceable covers and galleries with accurate asset dimensions", () => {
  const imageKinds = new Set(["app-screenshot", "development-capture", "project-overview", "product-artwork"]);
  for (const project of projects) {
    assert.ok(project.image, `${project.id}: cover required`);
    assert.ok(imageKinds.has(project.imageKind), `${project.id}: image provenance kind required`);
    assert.ok(project.imageLabel?.trim(), `${project.id}: visible image label required`);
    assert.ok(project.imageCaption?.trim(), `${project.id}: capture disclosure required`);
    assert.ok(project.gallery?.length >= 1, `${project.id}: at least one image view required`);
    assert.equal(project.gallery[0].image, project.image, `${project.id}: cover matches its first view`);
    assert.equal(new Set(project.gallery.map((frame) => frame.label)).size, project.gallery.length,
      `${project.id}: gallery choices must be distinguishable`);
    assert.deepEqual(assetDimensions(project.image), {
      width: project.imageWidth,
      height: project.imageHeight,
    }, `${project.id}: cover dimensions match the file`);
    for (const frame of project.gallery) {
      assert.ok(frame.label?.trim(), `${project.id}: view label required`);
      assert.ok(frame.caption?.trim(), `${project.id}: view disclosure required`);
      assert.equal(typeof frame.portrait, "boolean", `${project.id}: view orientation declared`);
      for (const image of [frame, frame.companion].filter(Boolean)) {
        assert.match(image.image, /^\.\/assets\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(webp|png|svg|jpe?g)$/);
        assert.ok(image.imageAlt?.trim(), `${project.id}: descriptive image alternative required`);
        assert.ok(Number.isInteger(image.width) && image.width > 0);
        assert.ok(Number.isInteger(image.height) && image.height > 0);
        assert.deepEqual(assetDimensions(image.image), { width: image.width, height: image.height },
          `${project.id}: ${image.image} dimensions match the file`);
        assert.equal(new URL(image.sourceUrl).protocol, "https:");
        assert.ok(project.sources.includes(image.sourceUrl), `${project.id}: image source listed in provenance`);
      }
    }
    if (project.imageKind === "project-overview") {
      assert.match(project.imageLabel, /source|overview/i);
      assert.match(project.imageCaption, /overview.*source|source.*overview/i);
      assert.match(project.image, /\.svg$/);
      assert.ok(project.gallery.every((frame) => /source|overview/i.test(frame.caption)));
    } else {
      assert.match(project.image, /\.(webp|png|jpe?g)$/);
    }
    if (project.imageKind === "development-capture") {
      assert.match(`${project.imageLabel} ${project.imageCaption}`, /development/i);
      assert.ok(project.gallery.every((frame) =>
        /development|sample|fictional|isolated|repository-default/i.test(`${frame.caption} ${project.notes || ""}`),
      ), `${project.id}: each development view discloses its capture or sample context`);
    }
    if (project.imageKind === "product-artwork") {
      assert.equal(project.gallery[0].label, "Product overview");
      assert.equal(project.imageCaption, project.gallery[0].caption);
      assert.equal(project.portrait, false);
      if (project.gallery[0].sourceKind === "owner-supplied-product-artwork") {
        assert.ok(["The-Bit-Binder", "MyGigCalendar", "Open-Micer-Timer"].includes(project.id));
        assert.equal(project.imageLabel, "Supplied product artwork");
        assert.match(project.imageCaption, /^Supplied product artwork/);
        assert.match(project.previewContext, /owner-supplied.*promotional artwork/i);
        assert.equal(project.imageWidth, 1920);
        assert.equal(project.imageHeight, 1080);
      } else {
        assert.ok(["Bill-Spilt", "Showrunner-ICanRunAShow", "bleepkit", "dictype", "usbmic",
          "Role-Call", "the-trip-handler", "PinsAndNeedlesComedyWebsite"].includes(project.id));
        assert.equal(project.gallery[0].sourceKind, "repository-product-artwork");
        assert.equal(project.imageLabel, "Repository product artwork");
        assert.match(project.imageCaption, /^Repository product artwork/);
        assert.match(project.previewContext, /repository.*(?:promotional|product) artwork/i);
        if (project.id === "usbmic") assert.match(project.previewContext, /release candidate/i);
        const source = new URL(project.gallery[0].sourceUrl);
        assert.ok(["github.com", "raw.githubusercontent.com"].includes(source.hostname));
        assert.match(source.pathname,
          new RegExp(`^/taylordrew4u2/${project.id === "usbmic" ? "SobStage" : project.id}/${source.hostname === "github.com" ? "blob/" : ""}[a-f0-9]{40}/`));
      }
    }
  }
});

test("My Gig Calendar uses its supplied banner as cover and keeps its native views and all seven unaltered product images", () => {
  const calendar = projects.find((project) => project.id === "MyGigCalendar");
  assert.equal(calendar.image, "./assets/my-gig-calendar/banner-1920x1080.png");
  assert.equal(calendar.gallery.length, 9);
  assert.equal(calendar.gallery[0].label, "Product overview");
  const native = calendar.gallery.filter((frame) => frame.sourceKind !== "owner-supplied-product-artwork");
  assert.deepEqual(native.map((frame) => ({
    label: frame.label, image: frame.image, caption: frame.caption,
    width: frame.width, height: frame.height, portrait: frame.portrait,
  })), [
    {
      label: "Calendar", image: "./assets/gigcalendar-native-calendar.webp",
      caption: "My Gig Calendar native iPhone calendar with fictional example gigs.",
      width: 960, height: 2086, portrait: true,
    },
    {
      label: "Gig details", image: "./assets/gigcalendar-details.webp",
      caption: "My Gig Calendar native gig details for a fictional Friday Night Live show.",
      width: 960, height: 2086, portrait: true,
    },
  ]);
  assert.ok(native.every((frame) => !frame.sourceKind));
  assert.ok(native.every((frame) => frame.imageLabel === "Native app screenshot" &&
    frame.previewContext === "Native app · Sample gigs"));
  assert.deepEqual(calendar.gallery.map((frame) => frame.label), [
    "Product overview", "Calendar", "Gig details", "Every gig", "Poster scan",
    "Flyer studio", "Fan calendar", "Siri & Shortcuts", "Features",
  ]);
  const expectedArtwork = {
    "banner-1920x1080.png": "3d5797b60c00d03be95778317dbf2ad12f7eb41618d9ce938c310e16e222986f",
    "01-every-gig.png": "c69db9ee63294c90b35a20084706c7b48cd81625b22f71c8d266b2832b63d309",
    "02-poster-scan.png": "682d60f1c8bccec66c333c416758bcd48179de6ab61c88a5a80b00b8afed74ed",
    "03-flyer-studio.png": "7d064745a44233e98a93453619ee053d11b17519e5bdd9a89cb403e490ebdd66",
    "04-fans.png": "8ea891cdb8f3868498fef84d9e32388befc37b0fcd2a061f701137910ccdfa0f",
    "05-siri.png": "e487549d633c93f89da0c1d1472ca58cce65632803321d3174a97a2a23224270",
    "06-features.png": "2cd0b49191fae139ea49f98c535b5c746e4363bd7fe99fbfb1fa84190625c221",
  };
  const artwork = calendar.gallery.filter((frame) => frame.sourceKind === "owner-supplied-product-artwork");
  assert.deepEqual(artwork.map((frame) => frame.image),
    Object.keys(expectedArtwork).map((name) => `./assets/my-gig-calendar/${name}`));
  for (const frame of artwork) {
    assert.equal(frame.sourceKind, "owner-supplied-product-artwork");
    assert.match(frame.caption, /^Supplied product artwork/);
    const bytes = readFileSync(new URL(`../${frame.image}`, import.meta.url));
    const name = frame.image.split("/").at(-1);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expectedArtwork[name],
      `${name}: original supplied pixels must remain unchanged`);
  }
});

test("The BitBinder uses its supplied banner as cover and keeps its three native views and all nine unaltered product images", () => {
  const binder = projects.find((project) => project.id === "The-Bit-Binder");
  assert.equal(binder.image, "./assets/bitbinder/banner-1920x1080.png");
  assert.equal(binder.imageKind, "product-artwork");
  assert.equal(binder.gallery.length, 12);
  assert.equal(binder.gallery[0].label, "Product overview");
  const native = binder.gallery.filter((frame) => frame.sourceKind !== "owner-supplied-product-artwork");
  assert.deepEqual(native.map((frame) => ({
    label: frame.label, image: frame.image, caption: frame.caption,
    width: frame.width, height: frame.height, portrait: frame.portrait,
  })), [
    {
      label: "Library & writing", image: "./assets/bitbinder-native-library.webp",
      caption: "Native development capture · Oct 8, 2026 · Fictional joke library",
      width: 960, height: 2087, portrait: true,
    },
    {
      label: "Writing editor", image: "./assets/bitbinder-native-writing.webp",
      caption: "Native development capture · Oct 8, 2026 · Fictional writing sample",
      width: 960, height: 2087, portrait: true,
    },
    {
      label: "Set rehearsal", image: "./assets/bitbinder-native-setlist.webp",
      caption: "Native development capture · Oct 8, 2026 · Fictional set rehearsal",
      width: 960, height: 2087, portrait: true,
    },
  ]);
  assert.ok(native.every((frame) => !frame.sourceKind));
  assert.ok(native.every((frame) => frame.imageLabel === "Native development preview" &&
    frame.previewContext === "Native development capture · Fictional sample"));
  assert.equal(native[0].companion.image, "./assets/bitbinder-native-writing.webp");
  assert.equal(native[0].companion.width, 960);
  assert.equal(native[0].companion.height, 2087);
  assert.equal(native[1].companion, undefined);
  assert.equal(native[2].companion, undefined);

  const expectedArtwork = [
    ["banner-1920x1080.png", "Product overview", "ed9135937396cf4830bb4b4ded886c62d3b47a6ec5d1356253e19c653294cc73"],
    ["01-every-bit.png", "Every bit", "7165d87af8d6886ef811202adb1c0c8241c00eca94569280686fa787c7b00cfa"],
    ["02-import.png", "Import material", "eef534c2a6f79973b126afd3fa808b753b5c5b18d95456477708e39b328e1ec3"],
    ["03-joke-library.png", "Joke library", "a5e6d5a6eb1ddd9469d8d65505563473e57d92c1cf8ba4666e923080fd67fcd2"],
    ["04-record-transcribe.png", "Record & transcribe", "57e085c85d3e1654790087c328a6bd9ce29f59235aaf17795ecc4eed92188bd5"],
    ["05-set-lists.png", "Set lists", "a2bb56a3418d56dfa75d927e22390b1650cba9d81ff8d0d577681338aad52f4c"],
    ["06-brainstorm.png", "Brainstorm", "ad4a5e00c7700a6d7d0fb61c5151123eb8b473465ea0d0ce3618b2f27f24c26b"],
    ["07-bitbuddy.png", "BitBuddy", "1359e4e9ea28e4b378e928f9a8c4e96719f034a0395df3664e373ef1086d2410"],
    ["08-roast-mode.png", "Roast mode", "f5f2896eeddf8e3a3e40bf832ba62376147922a730597a1e593dd438d1082c5c"],
  ];
  const artwork = binder.gallery.filter((frame) => frame.sourceKind === "owner-supplied-product-artwork");
  assert.deepEqual(artwork.map((frame) => [frame.image, frame.label]),
    expectedArtwork.map(([name, label]) => [`./assets/bitbinder/${name}`, label]));
  assert.deepEqual(binder.gallery.map((frame) => frame.label), [
    "Product overview", ...native.map((frame) => frame.label),
    ...expectedArtwork.slice(1).map(([, label]) => label),
  ]);
  for (const [index, frame] of artwork.entries()) {
    const [name, , sha256] = expectedArtwork[index];
    assert.equal(frame.sourceKind, "owner-supplied-product-artwork");
    assert.match(frame.caption, /^Supplied product artwork/);
    assert.equal(frame.width, index === 0 ? 1920 : 1320);
    assert.equal(frame.height, index === 0 ? 1080 : 2868);
    assert.equal(frame.portrait, index !== 0);
    assert.equal(frame.companion, undefined);
    assert.equal(frame.sourceUrl, `https://customtechbuilt4u.com/assets/bitbinder/${name}`);
    assert.ok(binder.sources.includes(frame.sourceUrl));
    const bytes = readFileSync(new URL(`../${frame.image}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), sha256,
      `${name}: original supplied pixels must remain unchanged`);
  }
});

test("Open Micer Timer uses its supplied banner and keeps three native countdown views plus all seven original product images", () => {
  const timer = projects.find((project) => project.id === "Open-Micer-Timer");
  assert.equal(timer.image, "./assets/open-micer-timer/banner-1920x1080.png");
  assert.equal(timer.imageKind, "product-artwork");
  assert.equal(timer.imageWidth, 1920);
  assert.equal(timer.imageHeight, 1080);
  assert.equal(timer.portrait, false);
  assert.equal(timer.gallery.length, 10);
  assert.deepEqual(timer.gallery.map((frame) => frame.label), [
    "Product overview", "Final-minute cue", "Running countdown", "Ready",
    "On the clock", "Hands-free", "Final minute", "Time’s up", "Set lengths", "Any screen",
  ]);
  const native = timer.gallery.filter((frame) => frame.sourceKind !== "owner-supplied-product-artwork");
  assert.deepEqual(native.map((frame) => ({
    label: frame.label, image: frame.image, imageAlt: frame.imageAlt,
    caption: frame.caption, width: frame.width, height: frame.height, portrait: frame.portrait,
  })), [
    {
      label: "Final-minute cue", image: "./assets/open-micer-timer-final-minute.webp",
      imageAlt: "Open Micer Timer native simulator showing the final-minute visual cue during an actual countdown.",
      caption: "Open Micer Timer native simulator showing the final-minute visual cue during an actual countdown.",
      width: 960, height: 2087, portrait: true,
    },
    {
      label: "Running countdown", image: "./assets/open-micer-timer-countdown.webp",
      imageAlt: "Open Micer Timer native simulator running a configured 75-second countdown.",
      caption: "Open Micer Timer native simulator running a configured 75-second countdown.",
      width: 960, height: 2087, portrait: true,
    },
    {
      label: "Ready", image: "./assets/open-micer-timer-ready.webp",
      imageAlt: "Open Micer Timer native iPhone simulator screen ready for a five-minute set.",
      caption: "Open Micer Timer native iPhone simulator screen ready for a five-minute set.",
      width: 960, height: 2087, portrait: true,
    },
  ]);
  assert.ok(native.every((frame) => !frame.sourceKind && !frame.companion &&
    frame.imageLabel === "Native app screenshot" && frame.previewContext === "Native countdown capture"));
  const expectedArtwork = [
    ["banner-1920x1080.png", "Product overview", "a7710f13e1a19f4f6c994afae83818f3cbee4fc5e94e6e37d25086b3105d47c2"],
    ["01-on-the-clock.png", "On the clock", "82aa937954871ec89e3371a316a11d91fbb75f3a386eb4498d77fedadcce8932"],
    ["02-hands-free.png", "Hands-free", "ac5fc6be1382e32b28bd1375b57d8879774d40c9ccf4275116f236de02922ec9"],
    ["03-final-minute.png", "Final minute", "dd4208e4732d3c1ce813cd8cb048c98b40f7c2dd47377b4ed65cd1e8ce4ea75f"],
    ["04-times-up.png", "Time’s up", "6e1aff348e1be35fc0f3386607fd9f902a92237f867bd3a9e91f37e38715e51c"],
    ["05-any-length.png", "Set lengths", "e0889dd92cbf6b643b11c1c27769f402e8085043ae6177c69de39ad830b3b6e3"],
    ["06-any-screen.png", "Any screen", "7e953c0cdc825f11a5da3ef946b9d4784f4fee3f75fce795b0cdac9638fc1aac"],
  ];
  const artwork = timer.gallery.filter((frame) => frame.sourceKind === "owner-supplied-product-artwork");
  assert.deepEqual(artwork.map((frame) => [frame.image, frame.label]),
    expectedArtwork.map(([name, label]) => [`./assets/open-micer-timer/${name}`, label]));
  for (const [index, frame] of artwork.entries()) {
    const [name, , sha256] = expectedArtwork[index];
    assert.equal(frame.sourceKind, "owner-supplied-product-artwork");
    assert.match(frame.caption, /^Supplied product artwork/);
    assert.equal(frame.width, index === 0 ? 1920 : 1320);
    assert.equal(frame.height, index === 0 ? 1080 : 2868);
    assert.equal(frame.portrait, index !== 0);
    assert.equal(frame.companion, undefined);
    assert.equal(frame.sourceUrl, `https://customtechbuilt4u.com/assets/open-micer-timer/${name}`);
    assert.ok(timer.sources.includes(frame.sourceUrl));
    const bytes = readFileSync(new URL(`../${frame.image}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), sha256,
      `${name}: original supplied pixels must remain unchanged`);
  }
});

test("BillSpilt uses eight original repository visuals with pinned sources and distinct artwork and app capture context", () => {
  const bill = projects.find((project) => project.id === "Bill-Spilt");
  const commit = "a45aad25f6274313a3c82329a87bba196f860aae";
  const expected = [
    ["hero.png", "Product overview", "docs/readme/hero.png", 2560, 1440, "66147df6cf2a40f8f8ffc12e7f9655f1b836787b3db3d9320a7834a90f7c4646"],
    ["home-balances.png", "Balances", "docs/screenshots/home-balances.png", 780, 1688, "31499c6ccdcc5ffd8c538dc27bad05b619b01f669143fb7c89b660b2c177d221"],
    ["settle-up.png", "Settlement", "docs/screenshots/settle-up.png", 780, 1688, "4a22108df51ae0bd05a6c44d3119c4c563bc4020c89f1914c78e0daaa1ab31f9"],
    ["add-expense.png", "Expense split", "docs/screenshots/add-expense.png", 780, 1688, "7550455973e98aa30a6a63b8bea7d400cac56556f670214db8488baed16b2e64"],
    ["expenses.png", "Expense history", "docs/screenshots/expenses.png", 780, 1688, "c5a6d24e56a759fce83ca198db3a61c0d420a3de588aed7b8bdd3bb819b7241c"],
    ["stats.png", "Spending overview", "docs/screenshots/stats.png", 780, 1688, "a309383c9ceeafe92e2404576d36fde166cd1a033ce0e8dc3e6958e934cc7f3a"],
    ["how-it-works.png", "How it works", "docs/readme/how-it-works.png", 2558, 1440, "b8ff4d37e616c4e2d62f33d3d875612f6b02e68b32ffc8affc4fb9dfb792176b"],
    ["features.png", "Features", "docs/readme/features.png", 2560, 1280, "6495e02ae0db25d5a9d65259501328a419bc4c8759c2277d322bb3719814212f"],
  ];
  assert.equal(bill.repositoryHead, commit);
  assert.equal(bill.repositoryVerifiedAt, "2026-10-13");
  assert.equal(bill.image, "./assets/billspilt/hero.png");
  assert.equal(bill.imageKind, "product-artwork");
  assert.equal(bill.imageLabel, "Repository product artwork");
  assert.equal(bill.imageWidth, 2560);
  assert.equal(bill.imageHeight, 1440);
  assert.equal(bill.portrait, false);
  assert.deepEqual(bill.gallery.map((frame) => [frame.image, frame.label]),
    expected.map(([file, label]) => [`./assets/billspilt/${file}`, label]));
  for (const [index, frame] of bill.gallery.entries()) {
    const [file, , sourcePath, width, height, sha256] = expected[index];
    const artwork = sourcePath.startsWith("docs/readme/");
    assert.equal(frame.width, width);
    assert.equal(frame.height, height);
    assert.equal(frame.portrait, !artwork);
    assert.equal(frame.companion, undefined);
    assert.ok([
      `https://github.com/taylordrew4u2/Bill-Spilt/blob/${commit}/${sourcePath}`,
      `https://raw.githubusercontent.com/taylordrew4u2/Bill-Spilt/${commit}/${sourcePath}`,
    ].includes(frame.sourceUrl), `${file}: source points to the verified repository commit`);
    assert.ok(bill.sources.includes(frame.sourceUrl));
    if (artwork) {
      assert.equal(frame.sourceKind, "repository-product-artwork");
      assert.equal(frame.imageLabel, "Repository product artwork");
      assert.equal(frame.previewContext, "Repository promotional artwork · Illustrative sample data");
      assert.match(frame.caption, /^Repository product artwork/);
    } else {
      assert.equal(frame.sourceKind, "repository-app-capture");
      assert.equal(frame.imageLabel, "App screenshot");
      assert.equal(frame.previewContext, "Repository app capture · Sample household");
      assert.match(frame.caption, /^Repository app capture/);
      assert.match(frame.caption, /sample|fictional/i);
    }
    assert.notEqual(frame.sourceKind, "owner-supplied-product-artwork");
    const bytes = readFileSync(new URL(`../${frame.image}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), sha256,
      `${file}: original repository pixels must remain unchanged`);
  }
});

test("I Can Run A Show uses thirteen repository views with fifteen original image files and pinned provenance", () => {
  const show = projects.find((project) => project.id === "Showrunner-ICanRunAShow");
  const commit = "2989ec0dfb5439d888276bf1bceba7d53fc76995";
  const expectedFiles = {
    "banner-1920x1080.png": ["docs/promo/banner-1920x1080.png", 1920, 1080, "31e6ca8faf68ac6c8025f8cb8bc4e3888f5e98dc72b312c2dade6c1ad02cb960"],
    "01-every-show.png": ["docs/promo/01-every-show.png", 1320, 2868, "1f9933a81fcd37f597b0a9795862e4545455c917e8a4430875e842d6d0ab748a"],
    "02-run-show.png": ["docs/promo/02-run-show.png", 1320, 2868, "2881743c27230e9852779e51f9f5fd072c7be65acf0a314f82dab39833637d56"],
    "03-run-of-show.png": ["docs/promo/03-run-of-show.png", 1320, 2868, "6f6371af9492b2e76fa13730cb22b3a40a32fcbb19f320f1cf67e3ebf652b262"],
    "04-show-page.png": ["docs/promo/04-show-page.png", 1320, 2868, "9d52b5f3ffd8f489bfbccb60b674729505e5ce3472b3e77c08a9efe532498afa"],
    "05-rolodex.png": ["docs/promo/05-rolodex.png", 1320, 2868, "34d75b23ee4612dcc773e00b21dcba68f0210923948a6fcb7c908cabebeaf1e5"],
    "06-stage-remote.png": ["docs/promo/06-stage-remote.png", 1320, 2868, "7973ceee78d1fbde19c604c7be07dc3ae9aa04f5250bb3c36c2d2cd8067b49c6"],
    "desktop-show.png": ["docs/screenshots/desktop-show.png", 2560, 1800, "ba875a9345a3a09d20d0b1e522dff2d0050779493c366a6421dd597fea2edeec"],
    "run-show.png": ["docs/screenshots/run-show.png", 860, 2090, "94de4d94ddd204e83cd696ab1b2c4a7b1a8fc9c4a511ea48d9374bfc7fac1e3a"],
    "desktop-light.png": ["docs/screenshots/desktop-light.png", 2560, 1800, "18d1fec28c2294a4535c5b9d17a1eb07e2d355b25040357a44e20bbba98cdf97"],
    "contracts.png": ["docs/screenshots/contracts.png", 860, 1864, "25a39391868e8d5198f3ff7d4fb739d8306e64f7aed1d4381771941517433cfc"],
    "schedule.png": ["docs/screenshots/schedule.png", 860, 1864, "bd38aef13848ea44771afb94ebfecca66f810226a21cb6678979196dd4fb54dc"],
    "show-detail.png": ["docs/screenshots/show-detail.png", 860, 1864, "62c0bb7da9109c64546662b9be2bb069b9df4c537563aac579964abe0bdd4f05"],
    "rolodex.png": ["docs/screenshots/rolodex.png", 860, 1864, "8381ffab8742e5e20f40fe668961497b53aeab952a63c5b2f43a0689393518fa"],
    "stage-remote.png": ["docs/screenshots/stage-remote.png", 860, 1864, "2606c282a155bd938703f2b8ddb8195171ff1a9116bcba95cbe76be2946b686d"],
  };
  const expectedViews = [
    ["Product overview", "banner-1920x1080.png", null],
    ["Workspace & cues", "desktop-show.png", "run-show.png"],
    ["Show planning", "desktop-light.png", null],
    ["Contracts & cues", "contracts.png", "schedule.png"],
    ["Mobile workspace", "show-detail.png", null],
    ["Performer directory", "rolodex.png", null],
    ["Stage remote", "stage-remote.png", null],
    ["Every show", "01-every-show.png", null],
    ["Run the show", "02-run-show.png", null],
    ["Run of show", "03-run-of-show.png", null],
    ["Show page", "04-show-page.png", null],
    ["Rolodex overview", "05-rolodex.png", null],
    ["Stage remote overview", "06-stage-remote.png", null],
  ];
  assert.equal(show.repositoryHead, commit);
  assert.equal(show.image, "./assets/showrunner/banner-1920x1080.png");
  assert.equal(show.imageKind, "product-artwork");
  assert.equal(show.imageLabel, "Repository product artwork");
  assert.equal(show.imageWidth, 1920);
  assert.equal(show.imageHeight, 1080);
  assert.equal(show.portrait, false);
  assert.deepEqual(show.gallery.map((frame) => [frame.label, frame.image, frame.companion?.image || null]),
    expectedViews.map(([label, file, companion]) => [label, `./assets/showrunner/${file}`,
      companion ? `./assets/showrunner/${companion}` : null]));
  const images = show.gallery.flatMap((frame) => [frame, frame.companion].filter(Boolean));
  assert.equal(images.length, 15);
  assert.deepEqual(images.map((image) => image.image.split("/").at(-1)).sort(), Object.keys(expectedFiles).sort());
  for (const frame of show.gallery) {
    const sourcePath = expectedFiles[frame.image.split("/").at(-1)][0];
    const artwork = sourcePath.startsWith("docs/promo/");
    assert.equal(frame.sourceKind, artwork ? "repository-product-artwork" : "repository-app-capture");
    assert.equal(frame.imageLabel, artwork ? "Repository product artwork" : "App screenshot");
    assert.equal(frame.previewContext, artwork
      ? "Repository promotional artwork · Illustrative sample data"
      : "Repository app capture · Sample show");
    assert.match(frame.caption, artwork ? /^Repository product artwork/ : /^Repository app capture/);
    assert.equal(frame.portrait, frame.width < frame.height);
    assert.notEqual(frame.sourceKind, "owner-supplied-product-artwork");
  }
  for (const image of images) {
    const file = image.image.split("/").at(-1);
    const [sourcePath, width, height, sha256] = expectedFiles[file];
    assert.equal(image.width, width);
    assert.equal(image.height, height);
    assert.ok([
      `https://github.com/taylordrew4u2/Showrunner-ICanRunAShow/blob/${commit}/${sourcePath}`,
      `https://raw.githubusercontent.com/taylordrew4u2/Showrunner-ICanRunAShow/${commit}/${sourcePath}`,
    ].includes(image.sourceUrl), `${file}: source points to the verified repository commit`);
    assert.ok(show.sources.includes(image.sourceUrl));
    const bytes = readFileSync(new URL(`../${image.image}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), sha256,
      `${file}: original repository pixels must remain unchanged`);
  }
});

test("six README product covers keep pinned repository pixels and every earlier gallery view", () => {
  const manifest = JSON.parse(readFileSync(new URL("../docs/readme-overviews.json", import.meta.url), "utf8"));
  const expected = {
    bleepkit: {
      file: "bleepkit", repository: "bleepkit", commit: "35903d2b3398648f9095f6d761b8988f28a0fe03",
      sha256: "b9ed3db8f976d06ea57cc5515c22c0672330388c19cc68bd6891e7a79ad22781",
      labels: ["Workflow overview"], evidence: "2f7f81ffae7f7cf22446e7e7ed44cffd35a544f0153dee290fbe336b0e890c6b",
    },
    dictype: {
      file: "dictype", repository: "dictype", commit: "66a5e7964410ed3d18062a7c8bd89ba1830f2720",
      sha256: "042f24386f5cead359a97d2544b5392e8c1268e9e9318e790a796eb611311776",
      labels: ["Onboarding"], evidence: "b3ae2561619c80c2fe18a7e0bb7e254ee95d024b7030fe19a13a7e47b4d40d2c",
    },
    usbmic: {
      file: "sobstage", repository: "SobStage", commit: "8843186a58f62c91911ad6df99f879391144938e",
      sha256: "0e0bb60eba493857cd504af1b0b620c9a07737754f858eaa241e01d4cee95b42",
      labels: ["Recording", "Take alerts", "Saved take", "Recovery"], evidence: "fe5143c8e88cd61a898a1203ae40d3815adf0dd3bca64f55a56085fade7207d3",
    },
    "Role-Call": {
      file: "rolecall", repository: "Role-Call", commit: "d138489bc7b61a4f02f92f0a0f548662451effbf",
      sha256: "947cb3d11eeff8888ef164f60df73943f630d3278442075d96e475d49ea75f96",
      labels: ["Shot list", "Script workspace"], evidence: "8e6c61501de7f3219d886d217747a7a0daa628d122c8bacaf2885fd098fef29f",
    },
    "the-trip-handler": {
      file: "trip-handler", repository: "the-trip-handler", commit: "765fe03d725033e1352ff221412b982c316be9ce",
      sha256: "7a1f5d4183f6cf30f9e48bce8f7a3bd2d872ce9cd6b858726566655de6c3bd19",
      labels: ["Meal voting", "Approvals", "Shared board", "Itinerary", "On mobile"], evidence: "5d1e21a5270c87d51142bf084d38e3d15193d7f597cc08ec670f1a15a3555e9b",
    },
    PinsAndNeedlesComedyWebsite: {
      file: "pins-and-needles", repository: "PinsAndNeedlesComedyWebsite", commit: "0c3cea8cfb74297e75c00f4c4408a571fa7392d7",
      sha256: "ebfe01a6fab2b176a760a0b67fc29f1a31f793b145969d5d9cc8d5d357ee9131",
      labels: ["Public website", "Control center", "Audience countdown"], evidence: "805501561899afccf991da6a59c61f3ebec6b7377024628814517b1fedde03bf",
    },
  };
  assert.equal(manifest.kind, "repository-product-artwork");
  assert.equal(manifest.images.length, 6);
  assert.deepEqual(manifest.images.map((record) => record.project).sort(), Object.keys(expected).sort());
  // Capture the original evidence fields in their original order, while allowing new display labels.
  const originalEvidence = (frame) => Object.fromEntries([
    "label", "image", "imageAlt", "width", "height", "portrait", "caption", "sourceUrl", "sourceKind", "companion", "workflow",
  ].filter((key) => frame[key] !== undefined).map((key) => [key, frame[key]]));
  for (const record of manifest.images) {
    const contract = expected[record.project];
    const project = projects.find((entry) => entry.id === record.project);
    const cover = project.gallery[0];
    const image = `./assets/readme-overviews/${contract.file}.png`;
    assert.equal(record.file, image.slice(2));
    assert.equal(record.repository, `taylordrew4u2/${contract.repository}`);
    assert.equal(record.commit, contract.commit);
    assert.match(record.commit, /^[a-f0-9]{40}$/);
    assert.equal(record.sourceUrl, `https://github.com/${record.repository}/blob/${record.commit}/${record.sourcePath}`);
    assert.equal(cover.sourceUrl, record.sourceUrl);
    assert.ok(project.sources.includes(record.sourceUrl));
    assert.equal(project.image, image);
    assert.equal(cover.image, image);
    assert.equal(project.imageKind, "product-artwork");
    assert.equal(cover.sourceKind, "repository-product-artwork");
    assert.equal(cover.imageKind, "product-artwork");
    assert.equal(cover.imageLabel, "Repository product artwork");
    assert.equal(cover.label, "Product overview");
    assert.equal(cover.portrait, false);
    assert.deepEqual({ width: record.width, height: record.height }, { width: 2400, height: 1500 });
    assert.deepEqual(assetDimensions(image), { width: cover.width, height: cover.height });
    assert.equal(cover.width, 2400);
    assert.equal(cover.height, 1500);
    const bytes = readFileSync(new URL(`../${image}`, import.meta.url));
    assert.equal(bytes.length, record.bytes);
    assert.equal(record.sha256, contract.sha256);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), contract.sha256,
      `${project.title}: the original repository artwork pixels are unchanged`);
    assert.equal(createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex"), record.gitBlobSha,
      `${project.title}: the original file matches its repository Git blob`);
    const previous = project.gallery.slice(1);
    assert.deepEqual(previous.map((frame) => frame.label), contract.labels);
    assert.equal(createHash("sha256").update(JSON.stringify(previous.map(originalEvidence))).digest("hex"), contract.evidence,
      `${project.title}: all earlier images, captions, dimensions, source links, and ordering are retained`);
    for (const frame of previous) {
      assert.ok(frame.imageLabel?.trim(), `${project.title}: old views keep their own capture label`);
      assert.ok(frame.previewContext?.trim(), `${project.title}: old views keep their own evidence limits`);
      assert.notEqual(frame.imageKind, "product-artwork", `${project.title}: a real capture or code diagram is not relabeled as new product artwork`);
    }
  }
});

test("limited capture states retain their user-facing disclosures beside their original images", () => {
  const find = (id) => projects.find((project) => project.id === id);
  const onboarding = find("dictype").gallery.find((frame) => frame.label === "Onboarding");
  assert.match(onboarding.caption, /onboarding/i);
  assert.match(onboarding.caption, /permissions were not granted/i);
  assert.match(onboarding.caption, /dictation was not exercised/i);
  assert.match(onboarding.previewContext, /onboarding.*permissions pending.*dictation not exercised/i);
  assert.equal(onboarding.imageKind, "app-screenshot");
  const virtualCaptures = find("usbmic").gallery.slice(1);
  assert.equal(virtualCaptures.length, 4);
  assert.ok(virtualCaptures.every((frame) => /virtual microphones/i.test(frame.caption)));
  assert.ok(virtualCaptures.every((frame) => /virtual microphones/i.test(frame.previewContext)));
  assert.ok(virtualCaptures.every((frame) => frame.imageKind === "app-screenshot"));
  assert.match(find("usbmic").notes, /physical[- ]microphone validation/i);
  const sourceOverview = find("bleepkit").gallery.find((frame) => frame.label === "Workflow overview");
  assert.equal(sourceOverview.imageKind, "project-overview");
  assert.equal(sourceOverview.imageLabel, "Source overview");
  assert.match(sourceOverview.caption, /overview.*source/i);
  assert.match(sourceOverview.previewContext, /source-derived workflow.*no product interface/i);
  for (const frame of find("Role-Call").gallery.slice(1)) {
    assert.match(frame.previewContext, /development capture.*fictional/i);
  }
  for (const frame of find("the-trip-handler").gallery.slice(1)) {
    assert.match(frame.previewContext, /seeded demo.*no real payment/i);
  }
  assert.match(find("tlcmassagewellness").previewContext, /development capture.*sample/i);
  const binder = find("The-Bit-Binder");
  assert.match(binder.previewContext, /owner-supplied.*promotional artwork/i);
  assert.ok(binder.gallery.filter((view) => !view.sourceKind).every((frame) =>
    /development capture.*fictional/i.test(frame.previewContext)));
  assert.ok(binder.gallery.filter((view) => !view.sourceKind).every((frame) =>
    /native development capture.*Oct 8, 2026.*fictional/i.test(frame.caption)));
  for (const frame of binder.gallery.filter((view) => view.workflow)) {
    assert.match(frame.caption, /workflow.*source/i);
  }
});

test("platform filters are case-insensitive and keep all three platforms populated", () => {
  assert.equal(filterProjects(projects).length, 17);
  for (const [category, count] of [
    ["web", 10],
    ["ios", 5],
    ["desktop", 2],
  ]) {
    const results = filterProjects(projects, category.toUpperCase());
    assert.equal(results.length, count);
    assert.ok(results.every((project) => project.category === category));
  }
});

test("tools includes focused utilities and development projects independently of platform", () => {
  const results = filterProjects(projects, "tools");
  assert.ok(results.length > 0 && results.length < projects.length);
  assert.ok(results.every((project) => project.experiment));
  assert.ok(results.some((project) => project.id === "dictype"));
  assert.ok(results.some((project) => project.id === "bleepkit"));
  assert.ok(!results.some((project) => project.id === "Open-Micer-Timer"));
  assert.ok(!results.some((project) => project.id === "The-Bit-Binder"));
});

test("search finds names, repository names, summaries, stacks, and categories without case sensitivity", () => {
  assert.equal(
    filterProjects(projects, "all", "bItBiNdEr")[0].id,
    "The-Bit-Binder",
  );
  assert.equal(
    filterProjects(projects, "all", "Showrunner-ICanRunAShow")[0].id,
    "Showrunner-ICanRunAShow",
  );
  assert.equal(filterProjects(projects, "all", "profanity")[0].id, "bleepkit");
  assert.ok(
    filterProjects(projects, "all", "STRIPE").some(
      (project) => project.id === "the-trip-handler",
    ),
  );
  const desktopSearch = filterProjects(projects, "all", "desktop");
  assert.ok(
    projects
      .filter((project) => project.category === "desktop")
      .every((project) => desktopSearch.includes(project)),
  );
  assert.equal(filterProjects(projects, "all", "   ").length, 17);
  assert.deepEqual(
    filterProjects(projects, "all", "no-project-matches-this"),
    [],
  );
});

test("search finds client-facing purposes and workflows even when their terms are absent from the technical summary", () => {
  for (const query of ["REPAYMENTS", "pay whom", "whom repayments"]) {
    assert.deepEqual(filterProjects(projects, "all", query).map((project) => project.id), ["Bill-Spilt"]);
  }
  assert.deepEqual(filterProjects(projects, "ios", "repayments"), []);
});

test("category and search compose, with all search terms required and no catalog mutation", () => {
  const before = JSON.stringify(projects);
  assert.deepEqual(filterProjects(projects, "web", "Swift"), []);
  assert.deepEqual(
    filterProjects(projects, "tools", "dictation").map((project) => project.id),
    ["dictype"],
  );
  assert.deepEqual(
    filterProjects(projects, "WEB", " group   stripe ").map(
      (project) => project.id,
    ),
    ["the-trip-handler"],
  );
  assert.equal(JSON.stringify(projects), before);
  assert.notEqual(filterProjects(projects), projects);
});
