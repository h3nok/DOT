// Rebuild the public PDF after editing author.json or career.json:
// pnpm --dir frontend exec node scripts/generate-resume.mjs
// Uses the browser already installed for this repository's E2E checks.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = new URL("../", import.meta.url);
const author = JSON.parse(await readFile(new URL("src/content/author.json", root), "utf8"));
const career = JSON.parse(await readFile(new URL("src/content/career.json", root), "utf8"));
const escape = (text) => String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const byline = author.suffix ? `${author.name}, ${author.suffix}` : author.name;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(byline)} — Résumé</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; color: #182b25; font-family: Arial, sans-serif; font-size: 9.25pt; line-height: 1.42; }
  h1 { margin: 0 0 5pt; font-size: 23pt; font-weight: 600; letter-spacing: -0.6pt; }
  .role { margin: 0; font-size: 10pt; font-weight: 600; }
  .contact { margin: 7pt 0 16pt; font-size: 9pt; }
  a { color: inherit; text-decoration: none; }
  h2 { margin: 17pt 0 8pt; padding-bottom: 4pt; border-bottom: 0.5pt solid #b9c8c1; font-size: 10pt; letter-spacing: 1pt; text-transform: uppercase; break-after: avoid; }
  h3 { margin: 0; font-size: 11pt; break-after: avoid; }
  p { margin: 0; }
  .job { margin-top: 13pt; }
  .job-heading { display: flex; justify-content: space-between; align-items: baseline; gap: 10pt; break-after: avoid; }
  .period { white-space: nowrap; color: #44594f; font-size: 8.5pt; }
  .job-role { margin-top: 3pt; font-weight: 600; break-after: avoid; }
  .location { font-weight: 400; color: #44594f; }
  ul { margin: 6pt 0 0; padding-left: 13pt; }
  li { padding-left: 2pt; margin-bottom: 4pt; break-inside: avoid; }
  .education { break-inside: avoid; margin-top: 8pt; }
  .education p + p { margin-top: 2pt; }
  .thesis { margin-top: 4pt; color: #44594f; }
  .skills { margin: 0; }
  .skill { display: grid; grid-template-columns: 125pt 1fr; gap: 10pt; padding: 4pt 0; break-inside: avoid; }
  dt { font-weight: 600; } dd { margin: 0; }
  .resume-nav { display: none; }
  @media screen {
    body { max-width: 880px; margin: 0 auto; padding: 40px 28px; font-size: 15px; line-height: 1.65; }
    h1 { font-size: 32px; line-height: 1.2; overflow-wrap: anywhere; }
    h2 { margin-top: 32px; font-size: 14px; }
    h3 { font-size: 19px; }
    .role { font-size: 15px; }
    .contact { font-size: 14px; margin-top: 12px; }
    .resume-nav { display: flex; flex-wrap: wrap; gap: 12px 24px; margin-bottom: 36px; font-size: 14px; }
    a { text-decoration: underline; text-underline-offset: 4px; }
    a:focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
    .job-heading { flex-wrap: wrap; gap: 4px 16px; }
    .period { font-size: 13px; }
    .job { margin-top: 24px; }
    li { margin-bottom: 10px; }
    .education { margin-top: 18px; }
    .skill { grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); padding-block: 8px; }
  }
  @media screen and (max-width: 600px) {
    body { padding: 24px 18px; }
    h1 { font-size: 28px; }
    .skill { grid-template-columns: minmax(0, 1fr); gap: 4px; }
  }
</style></head><body>
<nav class="resume-nav" aria-label="Résumé"><a href="/about">Back to portfolio</a><a href="${escape(author.resumeUrl)}" download>Download PDF</a></nav>
<header><h1>${escape(byline)}</h1><p class="role">${escape(author.role)}</p>
<p class="contact">${escape(career.location)} · <a href="mailto:${escape(author.email)}">${escape(author.email)}</a> · <a href="${escape(author.links.linkedin)}">LinkedIn</a> · <a href="${escape(author.links.github)}">GitHub</a></p></header>
<section><h2>Profile</h2><p>${escape(career.profile)}</p></section>
<section><h2>Experience</h2>${career.experience.map((job) => `<article class="job"><div class="job-heading"><h3>${escape(job.company)}</h3><span class="period">${escape(job.period)}</span></div><p class="job-role">${escape(job.role)} <span class="location">· ${escape(job.location)}</span></p><ul>${job.highlights.map((point) => `<li>${escape(point)}</li>`).join("")}</ul></article>`).join("")}</section>
<section><h2>Education</h2>${author.credentials.map((credential) => `<div class="education"><p><strong>${escape(credential.degree)}</strong></p><p>${escape(credential.institution)} · ${credential.year}</p>${credential.dissertation ? `<p class="thesis">Thesis: ${escape(credential.dissertation.title)}</p>` : ""}</div>`).join("")}</section>
<section><h2>Technical skills</h2><dl class="skills">${career.skills.map((skill) => `<div class="skill"><dt>${escape(skill.domain)}</dt><dd>${escape(skill.technologies)}</dd></div>`).join("")}</dl></section>
</body></html>`;

const directory = new URL("public/resume/", root);
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setContent(html);
  await page.pdf({
    path: fileURLToPath(new URL("henok-ghebrechristos.pdf", directory)),
    format: "A4",
    margin: { top: "14mm", bottom: "16mm", left: "16mm", right: "16mm" },
    printBackground: true,
    tagged: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `<div style="width:100%;padding:0 16mm;font:8px Arial;color:#44594f;display:flex;justify-content:space-between"><span>${escape(byline)}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  });
  // Keep the accessible source beside the PDF for readers who prefer HTML.
  await writeFile(new URL("henok-ghebrechristos.html", directory), html);
  process.stdout.write("Generated public résumé PDF and accessible HTML from author.json and career.json.\n");
} finally {
  await browser.close();
}
