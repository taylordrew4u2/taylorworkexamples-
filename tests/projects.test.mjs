import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import {
  email,
  projects,
  featuredProjects,
  filterProjects,
} from "../projects.js";

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

test("the catalog represents all 24 public projects once, excluding profile and portfolio repos", () => {
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
    "lavender",
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
      assert.match(project.image, /^\.\/assets\/[a-z0-9-]+\.(webp|svg)$/);
      assert.ok(
        existsSync(new URL(`../${project.image}`, import.meta.url)),
        `${project.id}: missing ${project.image}`,
      );
      assert.ok(project.imageAlt.trim());
    }
  }
});

test("App Store listings, RoleCall preview, and known unavailable demos are represented accurately", () => {
  const find = (id) => projects.find((project) => project.id === id);
  for (const id of ["The-Bit-Binder", "MyGigCalendar"]) {
    assert.equal(new URL(find(id).demoUrl).hostname, "apps.apple.com");
    assert.equal(find(id).demoLabel, "App Store");
    assert.equal(find(id).badge, "APP STORE");
  }
  assert.equal(find("Role-Call").demoUrl, "https://rolecall.space");
  assert.equal(find("Role-Call").badge, "UI PREVIEW");
  assert.match(find("Role-Call").imageAlt, /UI preview/);
  for (const id of [
    "nycstandupopenmicmaster",
    "CONTROLLEREVENT",
    "comedysub",
  ]) {
    assert.equal(find(id).demoUrl, null);
  }
  assert.match(find("usbmic").notes, /Physical-microphone validation/);
  assert.match(find("mystorydailjournal").notes, /In development/);
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
