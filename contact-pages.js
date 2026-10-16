import { services, projectSlugs } from "./seo-content.js";
import { articles } from "./seo-articles.js";

// The build publishes only this list of public paths, without the content modules.
export const contactPages = [
  "/", "/services/", ...services.map(({ slug }) => `/services/${slug}/`),
  "/work/", ...Object.values(projectSlugs).map((slug) => `/work/${slug}/`),
  "/guides/website-or-app/", "/about/", "/contact/", "/project-kickoff/", "/privacy/", "/insights/",
  ...articles.map(({ slug }) => `/insights/${slug}/`), "/new-york-city/",
];
