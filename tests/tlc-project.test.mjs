import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { projects } from "../public-projects.js";
import { publicRepositories } from "../repository-state.js";

const project = projects.find((entry) => entry.id === "tlcmassagewellness");
const root = new URL("../", import.meta.url);
const sourceHead = "0e4f734b3b87fa4e4a8e15864390d24a94e07084";

test("TLC publishes the supplied media unchanged with a current repository and honest demo boundaries", () => {
  assert.ok(project, "The supplied TLC kit adds a selected personal project");
  assert.equal(project.caseUrl, "./work/tlc-massage-wellness/");
  assert.equal(project.projectType, "Website");
  assert.equal(project.repositoryArchived, false);
  assert.equal(publicRepositories.tlcmassagewellness.headSha, sourceHead);
  assert.equal(publicRepositories.tlcmassagewellness.verifiedAt, "2026-10-28");
  assert.equal(project.demoUrl, null, "A local demo does not establish a live public deployment");
  assert.equal(project.image, "./assets/tlc/images/portfolio-cover.png");
  assert.equal(project.imageWidth, 1920);
  assert.equal(project.imageHeight, 1080);
  assert.equal(project.gallery.length, 21, "All 18 new stills and three earlier captures remain available");
  const manifest = JSON.parse(readFileSync(new URL("assets/tlc/asset-manifest.json", root), "utf8"));
  assert.equal(manifest.source_repository, project.repoUrl);
  assert.equal(manifest.source_commit, "ec8b6f349a42479765246369fae3d3919e71c287");
  const media = manifest.files.filter((file) => /^(?:images|screenshots|videos)\/.*\.(?:png|mp4)$/.test(file.path));
  assert.equal(media.length, 20);
  for (const file of media) {
    const localPath = `assets/tlc/${file.path}`;
    const bytes = readFileSync(new URL(localPath, root));
    assert.equal(bytes.length, file.bytes, `${file.path}: original byte count`);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), file.sha256, `${file.path}: supplied original is intact`);
    if (file.path.endsWith(".png")) {
      assert.equal(bytes.subarray(1, 4).toString(), "PNG");
      assert.equal(bytes.readUInt32BE(16), file.width, `${file.path}: actual width`);
      assert.equal(bytes.readUInt32BE(20), file.height, `${file.path}: actual height`);
      const frame = project.gallery.find((entry) => entry.image === `./${localPath}`);
      assert.ok(frame, `${file.path}: original is in the gallery`);
      assert.equal(frame.width, file.width);
      assert.equal(frame.height, file.height);
      assert.match(frame.sourceUrl, new RegExp(`/tlcmassagewellness/blob/${sourceHead}/docs/media/tlc/`));
      assert.match(frame.caption, /local demo|sample|conceptual|AI.generated|promotional artwork/i,
        `${file.path}: visible capture/artwork context`);
    } else {
      assert.ok(project.promotion.videos.some((video) => video.src === `./${localPath}`));
      assert.equal(file.duration_seconds, 20);
    }
  }
  for (const path of ["./assets/tlc-homepage.webp", "./assets/tlc-booking.webp", "./assets/tlc-admin-treatments-clean.webp"]) {
    assert.ok(project.gallery.some((entry) => entry.image === path), `${path}: historical capture retained`);
  }
  for (const name of ["wellness-room.png", "wellness-detail.png"]) {
    const photo = project.gallery.find((entry) => entry.image.endsWith(name));
    assert.match(photo.caption, /AI.generated/i);
    assert.match(photo.caption, /conceptual/i);
    assert.match(photo.caption, /not.*(?:premises|photograph|business|treatment)/i);
  }
  assert.match(project.notes, /local demo/i);
  assert.match(project.notes, /fictional|sample/i);
  assert.match(project.notes, /owner review|owner.*review/i);
  assert.match(project.notes, /automatic email/i);
  assert.match(project.notes, /payments/i);
  assert.match(project.notes, /synchronized calendar/i);
});
