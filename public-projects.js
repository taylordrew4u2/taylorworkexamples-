import { email, projects as auditedProjects, featuredProjects as selected, filterProjects } from "./projects.js";
import { projectSlugs } from "./seo-content.js";

// 4u Digital presents software work independently of the owner's personal stand-up site.
export { email, filterProjects };
export const projects = auditedProjects
  .filter((project) => project.id !== "taylordrewwebsite")
  .map((project) => ({
    ...project,
    caseUrl: `./work/${projectSlugs[project.id]}/`,
    // The public repository was renamed; retain its stable catalog key and pinned image evidence.
    ...(project.id === "usbmic" ? {
      repoUrl: "https://github.com/taylordrew4u2/SobStage",
      documentationUrl: "https://github.com/taylordrew4u2/SobStage#readme",
    } : {}),
  }));
export const featuredProjects = selected.map((project) => projects.find((entry) => entry.id === project.id)).filter(Boolean);
