import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  email,
  projects,
  featuredProjects,
  filterProjects,
} from "../projects.js";

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
  "taylosite",
  "PinsAndNeedlesComedyWebsite",
  "Open-Micer-Timer",
  "vlognudge",
  "CONTROLLEREVENT",
  "staybusy",
  "Laugh-Map",
  "dictype",
  "laugh-extractor",
  "markvegas",
  "tlcmassagewellness",
  "mystorydailjournal",
  "comedysub",
  "HealYourHeart",
  "the-trip-handler",
  "Role-Call",
];

test("the catalog represents all 24 owned projects once, excluding profile and portfolio repos", () => {
  assert.equal(projects.length, 24);
  assert.equal(new Set(projects.map((project) => project.id)).size, 24);
  assert.deepEqual(
    projects.map((project) => project.id).sort(),
    expectedIds.sort(),
  );
  assert.equal(email, "taylordrew4u@gmail.com");
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
      assert.match(project.image, /^\.\/assets\/[a-z0-9-]+\.(webp|png|svg)$/);
      assert.ok(
        existsSync(new URL(`../${project.image}`, import.meta.url)),
        `${project.id}: missing ${project.image}`,
      );
      assert.ok(project.imageAlt.trim());
    }
  }
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
  for (const id of [
    "nycstandupopenmicmaster",
    "CONTROLLEREVENT",
    "comedysub",
  ]) {
    assert.equal(find(id).demoUrl, null);
  }
  assert.match(find("usbmic").notes, /physical[- ]microphone validation/i);
  assert.match(`${find("mystorydailjournal").imageCaption} ${find("mystorydailjournal").notes}`,
    /in development|no current runtime|runtime.*not verified/i);
});

test("all 24 projects have traceable covers and galleries with accurate asset dimensions", () => {
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
        assert.match(image.image, /^\.\/assets\/[a-z0-9-]+\.(webp|png|svg)$/);
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

test("limited capture states retain their user-facing disclosures", () => {
  const find = (id) => projects.find((project) => project.id === id);
  assert.match(find("dictype").imageCaption, /onboarding/i);
  assert.match(find("dictype").imageCaption, /permissions were not granted/i);
  assert.match(find("dictype").imageCaption, /dictation was not exercised/i);
  assert.ok(find("usbmic").gallery.every((frame) => /virtual microphones/i.test(frame.caption)));
  assert.match(find("mystorydailjournal").imageCaption, /in development/i);
  assert.match(find("comedysub").imageCaption, /previously reviewed source/i);
  const binder = find("The-Bit-Binder");
  for (const frame of binder.gallery.filter((view) => view.workflow)) {
    assert.match(frame.caption, /workflow.*source/i);
  }
});

test("platform filters are case-insensitive and keep all three platforms populated", () => {
  assert.equal(filterProjects(projects).length, 24);
  for (const [category, count] of [
    ["web", 11],
    ["ios", 9],
    ["desktop", 4],
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
  assert.equal(filterProjects(projects, "all", "   ").length, 24);
  assert.deepEqual(
    filterProjects(projects, "all", "no-project-matches-this"),
    [],
  );
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
