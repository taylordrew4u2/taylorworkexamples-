import { email, projects as auditedProjects, filterProjects } from "./projects.js";
import { projectSlugs } from "./seo-content.js";
import { portfolioProjectIds, featuredProjectIds } from "./portfolio-selection.js";

// 4u Digital presents software work independently of the owner's personal stand-up site.
export { email, filterProjects };
export const projects = auditedProjects
  .filter((project) => portfolioProjectIds.includes(project.id))
  .map((project) => ({
    ...project,
    caseUrl: `./work/${projectSlugs[project.id]}/`,
    // The public repository was renamed; retain its stable catalog key and pinned image evidence.
    ...(project.id === "usbmic" ? {
      repoUrl: "https://github.com/taylordrew4u2/SobStage",
      documentationUrl: "https://github.com/taylordrew4u2/SobStage#readme",
    } : {}),
  }));
export const featuredProjects = featuredProjectIds.map((id) => projects.find((project) => project.id === id)).filter(Boolean);
