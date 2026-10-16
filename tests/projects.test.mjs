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

test("the homepage hero uses the BitBinder and My Gig Calendar supplied banners without extra visible copy", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const hero = html.match(/<div class="hero-stage"[\s\S]*?<\/section>/)?.[0];
  assert.ok(hero, "Hero banners must be present");
  assert.match(hero, /aria-label="Featured app previews"/);
  const buttons = [...hero.matchAll(/<button class="hero-project" data-project="([^"]+)" aria-label="([^"]+)">([\s\S]*?)<\/button>/g)];
  assert.deepEqual(buttons.map(([, id, label]) => [id, label]), [
    ["The-Bit-Binder", "View the BitBinder project"],
    ["MyGigCalendar", "View the My Gig Calendar project"],
  ]);
  assert.equal([...hero.matchAll(/\bdata-project=/g)].length, 2);
  assert.equal([...hero.matchAll(/<img\b/g)].length, 2);
  for (const [, id, , contents] of buttons) {
    const project = projects.find((entry) => entry.id === id);
    assert.equal(project.sourceAvailable, true);
    assert.ok(contents.includes(`class="hero-project-screen" src="${project.image}" alt="${project.imageAlt}" width="1920" height="1080"`),
      `${id}: opening artwork matches the supplied banner cover and its actual dimensions`);
    assert.match(project.image, /\/banner-1920x1080\.png$/);
    assert.equal(project.gallery[0].sourceKind, "owner-supplied-product-artwork");
    assert.equal(contents.replace(/<img\b[^>]*>/g, "").trim(), "", `${id}: only the banner is inside its button`);
  }
  assert.doesNotMatch(hero, /hero-web|hero-phone|hero-orbit|hero-asterisk|hero-project-info|hero-project-icon|hero-project-copy|hero-project-arrow/);
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
        assert.ok(["Bill-Spilt", "Showrunner-ICanRunAShow"].includes(project.id));
        assert.equal(project.gallery[0].sourceKind, "repository-product-artwork");
        assert.equal(project.imageLabel, "Repository product artwork");
        assert.match(project.imageCaption, /^Repository product artwork/);
        assert.match(project.previewContext, /repository.*promotional artwork/i);
        const source = new URL(project.gallery[0].sourceUrl);
        assert.ok(["github.com", "raw.githubusercontent.com"].includes(source.hostname));
        assert.match(source.pathname,
          new RegExp(`^/taylordrew4u2/${project.id}/${source.hostname === "github.com" ? "blob/" : ""}[a-f0-9]{40}/`));
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

test("limited capture states retain their user-facing disclosures", () => {
  const find = (id) => projects.find((project) => project.id === id);
  assert.match(find("dictype").imageCaption, /onboarding/i);
  assert.match(find("dictype").imageCaption, /permissions were not granted/i);
  assert.match(find("dictype").imageCaption, /dictation was not exercised/i);
  assert.ok(find("usbmic").gallery.every((frame) => /virtual microphones/i.test(frame.caption)));
  assert.match(find("usbmic").previewContext, /virtual microphone demo/i);
  assert.match(find("dictype").previewContext, /onboarding.*permissions pending/i);
  assert.match(find("bleepkit").previewContext, /workflow overview.*source/i);
  assert.match(find("Role-Call").previewContext, /development capture.*fictional/i);
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
