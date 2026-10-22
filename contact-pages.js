import { services, projectSlugs } from "./seo-content.js";
import { articles } from "./seo-articles.js";
import { portfolioProjectIds } from "./portfolio-selection.js";

// The build publishes only this list of public paths, without the content modules.
export const contactPages = [
  "/", "/services/", ...services.map(({ slug }) => `/services/${slug}/`),
  "/work/", ...portfolioProjectIds.map((id) => `/work/${projectSlugs[id]}/`),
  "/guides/website-or-app/", "/about/", "/contact/", "/project-kickoff/", "/privacy/", "/insights/",
  ...articles.map(({ slug }) => `/insights/${slug}/`), "/new-york-city/", "/offer/",
];
