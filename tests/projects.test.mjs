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

test("the catalog represents all 16 public projects once, excluding profile and portfolio repos", () => {
  assert.equal(projects.length, 16);
  assert.equal(new Set(projects.map((project) => project.id)).size, 16);
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

test("the public-only catalog matches the October 12 GitHub inventory and canonical source links", () => {
  assert.equal(repositoryVerifiedAt, "2026-10-12");
  assert.equal(Object.keys(publicRepositories).length, 16);
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

test("the homepage hero uses the public Pins & Needles website and no removed projects", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const website = projects.find((project) => project.id === "PinsAndNeedlesComedyWebsite");
  const hero = html.match(/<div class="hero-stage"[\s\S]*?<\/section>/)?.[0];
  assert.ok(hero, "Hero previews must be present");
  assert.match(hero, /class="hero-web" data-project="PinsAndNeedlesComedyWebsite"/);
  assert.ok(hero.includes(website.image), "Hero website image must match the public project");
  assert.match(hero, /Pins &amp; Needles website|Pins & Needles website/);
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
      assert.match(project.image, /^\.\/assets\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(webp|png|svg)$/);
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

test("all 15 genuine project icons match their asset dimensions and have primary source provenance", () => {
  const withIcons = projects.filter((project) => project.icon);
  const iconKinds = new Set(["brand-mark", "app-icon", "ios-app-icon", "desktop-app-icon", "favicon"]);
  assert.equal(withIcons.length, 15);
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
    } else {
      assert.ok(["github.com", "raw.githubusercontent.com"].includes(source.hostname));
      const segments = decodeURIComponent(source.pathname).split("/").filter(Boolean);
      assert.equal(segments[0], "taylordrew4u2");
      assert.equal(segments[1], project.id);
      assert.ok(segments.some((segment) => /^[a-f0-9]{40}$/.test(segment)), `${project.id}: icon source pinned to a revision`);
    }
  }
});

test("the film website uses neutral initials rather than an invented project logo", () => {
  const withoutIcons = projects.filter((project) => !project.icon);
  assert.deepEqual(withoutIcons.map((project) => project.id), ["micro-short-website"]);
  const film = withoutIcons[0];
  assert.equal(film.icon, null);
  assert.equal(film.iconFallback, "MS");
  assert.equal(film.iconKind, "neutral-initials");
  assert.equal(film.iconSource, undefined);
  assert.match(film.iconNotes, /not an official project logo/i);
});

test("App Store listings, RoleCall development captures, and known unavailable demos are represented accurately", () => {
  const find = (id) => projects.find((project) => project.id === id);
  for (const id of ["The-Bit-Binder", "MyGigCalendar"]) {
    assert.equal(new URL(find(id).demoUrl).hostname, "apps.apple.com");
    assert.equal(find(id).demoLabel, "App Store");
    assert.equal(find(id).badge, "APP STORE");
  }
  assert.equal(find("Role-Call").demoUrl, "https://rolecall.space");
  const role = find("Role-Call");
  assert.equal(role.badge, "DEV PREVIEW");
  assert.equal(role.imageKind, "development-capture");
  assert.match(role.imageAlt, /shot list.*fictional.*sample/i);
  assert.match(role.imageCaption, /development capture.*actual.*component.*sample/i);
  assert.deepEqual(role.gallery.map((frame) => frame.label), ["Shot list", "Script workspace"]);
  for (const frame of role.gallery) {
    assert.match(frame.image, /\.(webp|png)$/);
    assert.match(frame.caption, /development capture.*actual.*sample/i);
    assert.match(frame.sourceUrl, /\/components\/(ShotListBoard|ScriptWorkspace)\.tsx$/);
  }
  assert.equal(find("nycstandupopenmicmaster").demoUrl, null);
  assert.match(find("usbmic").notes, /physical[- ]microphone validation/i);
});

test("all 16 public projects have traceable covers and galleries with accurate asset dimensions", () => {
  const imageKinds = new Set(["app-screenshot", "development-capture", "project-overview"]);
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
        assert.match(image.image, /^\.\/assets\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(webp|png|svg)$/);
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
      assert.match(project.image, /\.(webp|png)$/);
    }
    if (project.imageKind === "development-capture") {
      assert.match(`${project.imageLabel} ${project.imageCaption}`, /development/i);
      assert.ok(project.gallery.every((frame) =>
        /development|sample|fictional|isolated|repository-default/i.test(`${frame.caption} ${project.notes || ""}`),
      ), `${project.id}: each development view discloses its capture or sample context`);
    }
  }
});

test("My Gig Calendar keeps its native cover and all seven unaltered supplied product images", () => {
  const calendar = projects.find((project) => project.id === "MyGigCalendar");
  assert.equal(calendar.image, "./assets/gigcalendar-native-calendar.webp");
  assert.equal(calendar.gallery.length, 9);
  assert.ok(calendar.gallery.slice(0, 2).every((frame) => /native/i.test(frame.caption) && !frame.sourceKind));
  const expectedArtwork = {
    "banner-1920x1080.png": "3d5797b60c00d03be95778317dbf2ad12f7eb41618d9ce938c310e16e222986f",
    "01-every-gig.png": "c69db9ee63294c90b35a20084706c7b48cd81625b22f71c8d266b2832b63d309",
    "02-poster-scan.png": "682d60f1c8bccec66c333c416758bcd48179de6ab61c88a5a80b00b8afed74ed",
    "03-flyer-studio.png": "7d064745a44233e98a93453619ee053d11b17519e5bdd9a89cb403e490ebdd66",
    "04-fans.png": "8ea891cdb8f3868498fef84d9e32388befc37b0fcd2a061f701137910ccdfa0f",
    "05-siri.png": "e487549d633c93f89da0c1d1472ca58cce65632803321d3174a97a2a23224270",
    "06-features.png": "2cd0b49191fae139ea49f98c535b5c746e4363bd7fe99fbfb1fa84190625c221",
  };
  const artwork = calendar.gallery.slice(2);
  assert.deepEqual(artwork.map((frame) => frame.image).sort(),
    Object.keys(expectedArtwork).map((name) => `./assets/my-gig-calendar/${name}`).sort());
  for (const frame of artwork) {
    assert.equal(frame.sourceKind, "owner-supplied-product-artwork");
    assert.match(frame.caption, /^Supplied product artwork/);
    const bytes = readFileSync(new URL(`../${frame.image}`, import.meta.url));
    const name = frame.image.split("/").at(-1);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expectedArtwork[name],
      `${name}: original supplied pixels must remain unchanged`);
  }
});

test("limited capture states retain their user-facing disclosures", () => {
  const find = (id) => projects.find((project) => project.id === id);
  assert.match(find("dictype").imageCaption, /onboarding/i);
  assert.match(find("dictype").imageCaption, /permissions were not granted/i);
  assert.match(find("dictype").imageCaption, /dictation was not exercised/i);
  assert.ok(find("usbmic").gallery.every((frame) => /virtual microphones/i.test(frame.caption)));
  assert.match(find("usbmic").previewContext, /virtual microphone demo/i);
  assert.match(find("dictype").previewContext, /onboarding.*permissions pending/i);
  assert.match(find("bleepkit").previewContext, /workflow overview.*source/i);
  for (const id of ["The-Bit-Binder", "Role-Call"]) {
    assert.match(find(id).previewContext, /development capture.*fictional/i);
  }
  assert.match(find("tlcmassagewellness").previewContext, /development capture.*sample/i);
  const binder = find("The-Bit-Binder");
  for (const frame of binder.gallery.filter((view) => view.workflow)) {
    assert.match(frame.caption, /workflow.*source/i);
  }
});

test("platform filters are case-insensitive and keep all three platforms populated", () => {
  assert.equal(filterProjects(projects).length, 16);
  for (const [category, count] of [
    ["web", 9],
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
  assert.ok(results.some((project) => project.id === "Open-Micer-Timer"));
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
  assert.equal(filterProjects(projects, "all", "   ").length, 16);
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
