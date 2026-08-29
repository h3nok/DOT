#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const frontendRoot = process.cwd();
const repositoryRoot = path.resolve(frontendRoot, '..');
const manuscriptRoot = path.join(
  repositoryRoot,
  'docs/blueprint/book-one-complete/v4-working/manuscript',
);
const coverAssetUrl = pathToFileURL(
  path.join(
    repositoryRoot,
    'docs/blueprint/book-one-complete/v4-working/assets/complete-book-one-v4-cover.png',
  ),
).href;
const outputPath = process.argv[2]
  ? path.resolve(frontendRoot, process.argv[2])
  : path.join('/tmp', 'DOT-Complete-Book-One-v4-Editorial.html');

const sections = [
  { file: 'preface.md', label: 'PREFACE', title: 'The Observer Belongs in the Inquiry' },
  {
    file: 'the-digital-organism.md',
    label: 'CHAPTER 1',
    title: 'The Digital Organism',
    equationPrefix: 1,
  },
  {
    file: 'the-decoupling-principle.md',
    label: 'CHAPTER 2',
    title: 'The Decoupling Principle',
    equationPrefix: 2,
  },
  {
    file: 'architecture-of-continuity.md',
    label: 'CHAPTER 3',
    title: 'Architecture of Continuity',
    equationPrefix: 3,
  },
  { file: 'reality-frames.md', label: 'CHAPTER 4', title: 'Reality Frames', equationPrefix: 4 },
  { file: 'the-canvas.md', label: 'CHAPTER 5', title: 'The Canvas', equationPrefix: 5 },
  { file: 'the-painting.md', label: 'CHAPTER 6', title: 'The Painting', equationPrefix: 6 },
  {
    file: 'the-research-program.md',
    label: 'CHAPTER 7',
    title: 'The Research Program',
    equationPrefix: 7,
  },
  { file: 'coda.md', label: 'CODA', title: 'The Theory Returns to One Life' },
  {
    file: 'equation-and-notation-guide.md',
    label: 'APPENDIX',
    title: 'Equation and Notation Guide',
  },
  { file: 'glossary.md', label: 'GLOSSARY', title: 'Core Terms' },
  { file: 'references.md', label: 'NOTES AND SOURCES', title: 'References' },
];

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function textFromChildren(children) {
  return React.Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') return String(child);
      if (React.isValidElement(child)) return textFromChildren(child.props.children);
      return '';
    })
    .join('');
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function heading(level, sectionSlug, duplicateHeadingSlugs) {
  return function MarkdownHeading({ children }) {
    const text = textFromChildren(children);
    const baseId = slugify(text);
    const id = /^Reference\s+(\d+)$/i.test(text)
      ? `reference-${text.match(/\d+/)[0]}`
      : duplicateHeadingSlugs.has(baseId)
        ? `${sectionSlug}--${baseId}`
        : baseId;
    return React.createElement(`h${level}`, { id }, children);
  };
}

function normalizeLinks(markdown) {
  return markdown.replace(
    /\[([^\]]+)]\(\/book\/digital-organism-theory\/references#reference-(\d+)\)/g,
    '[$1](#reference-$2)',
  );
}

function normalizeMath(value) {
  return value
    .trim()
    .replace(/\\operatorname\{([^}]+)}/g, '$1')
    .replace(/\\math(?:cal|bb)\{([^}]+)}/g, '$1')
    .replace(/\\widehat\{B}/g, 'B̂')
    .replace(/\\longrightarrow|\\rightarrow/g, '→')
    .replace(/\\Rightarrow/g, '⇒')
    .replace(/\\geq/g, '≥')
    .replace(/\\leq/g, '≤')
    .replace(/\\subset/g, '⊂')
    .replace(/\\cap/g, '∩')
    .replace(/\\mid/g, '|')
    .replace(/\\times/g, '×')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\Gamma/g, 'Γ')
    .replace(/\\Psi/g, 'Ψ')
    .replace(/\\Pi/g, 'Π')
    .replace(/\\pi/g, 'π')
    .replace(/\\xi/g, 'ξ')
    .replace(/\\varepsilon/g, 'ε')
    .replace(/\\kappa/g, 'κ')
    .replace(/\\lbrack/g, '[')
    .replace(/\\rbrack/g, ']')
    .replace(/_\{([^}]+)}/g, '_$1')
    .replace(/\^\{([^}]+)}/g, '^$1')
    .replace(/\{([A-Za-z][A-Za-z0-9]*)}/g, '$1')
    .replace(/\\\{/g, '{')
    .replace(/\\}/g, '}')
    .replace(/\\[;,!:]?\s*/g, ' ')
    .replace(/\{([^{}]+)}/g, '$1')
    .replace(/\s*:\s*=\s*/g, ' := ')
    .replace(/\s+/g, ' ')
    .trim();
}

function prepareMarkdown(markdown, equationPrefix) {
  const linked = normalizeLinks(markdown);
  let equationCounter = 0;
  const withDisplayMath = linked.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (_match, math) => {
    equationCounter += 1;
    const equationNumber = equationPrefix
      ? `${equationPrefix}.${equationCounter}`
      : `${equationCounter}`;
    const encoded = Buffer.from(math.trim(), 'utf8').toString('base64url');
    return `\n\n~~~dotmath\nDOT_DISPLAY_MATH:${equationNumber}:${encoded}\n~~~\n\n`;
  });
  return withDisplayMath.replace(/\$([^$\n]+)\$/g, (_match, math) => {
    const encoded = Buffer.from(math.trim(), 'utf8').toString('base64url');
    return `\`DOT_INLINE_MATH:${encoded}\``;
  });
}

function renderMarkdown(markdown, equationPrefix, sectionSlug, duplicateHeadingSlugs) {
  return renderToStaticMarkup(
    React.createElement(ReactMarkdown, {
      remarkPlugins: [remarkGfm],
      components: {
        h1: heading(1, sectionSlug, duplicateHeadingSlugs),
        h2: heading(2, sectionSlug, duplicateHeadingSlugs),
        h3: heading(3, sectionSlug, duplicateHeadingSlugs),
        code: ({ children, className }) => {
          const value = textFromChildren(children);
          if (!className && value.startsWith('DOT_INLINE_MATH:')) {
            const latex = Buffer.from(value.slice('DOT_INLINE_MATH:'.length), 'base64url').toString(
              'utf8',
            );
            return React.createElement(
              'span',
              { className: 'math-inline', 'data-latex': latex },
              normalizeMath(latex),
            );
          }
          return React.createElement('code', { className }, children);
        },
        pre: ({ children }) => {
          const child = React.Children.only(children);
          if (
            React.isValidElement(child) &&
            child.props.className === 'language-dotmath'
          ) {
            const value = textFromChildren(child.props.children).trim();
            const match = value.match(/^DOT_DISPLAY_MATH:([0-9]+\.[0-9]+):([A-Za-z0-9_-]+)$/);
            if (!match) throw new Error(`Invalid display-math payload: ${value}`);
            const equationNumber = match[1];
            const latex = Buffer.from(match[2], 'base64url').toString('utf8');
            return React.createElement(
              'div',
              {
                className: 'math-display',
                id: `equation-${equationNumber.replace('.', '-')}`,
                'data-latex': latex,
                'data-equation-number': equationNumber,
              },
              normalizeMath(latex),
            );
          }
          return React.createElement('pre', null, children);
        },
      },
      children: prepareMarkdown(markdown, equationPrefix),
    }),
  );
}

const sectionSources = await Promise.all(
  sections.map(async (section) => ({
    ...section,
    sourceMarkdown: await fs.readFile(path.join(manuscriptRoot, section.file), 'utf8'),
  })),
);
const headingSlugCounts = new Map();
for (const section of sectionSources) {
  const sectionSlug = slugify(section.title);
  headingSlugCounts.set(sectionSlug, (headingSlugCounts.get(sectionSlug) ?? 0) + 1);
}
for (const section of sectionSources) {
  for (const match of section.sourceMarkdown.matchAll(/^#{2,3}\s+(.+?)\s*$/gm)) {
    const headingSlug = slugify(match[1].replace(/[*_`]/g, ''));
    headingSlugCounts.set(headingSlug, (headingSlugCounts.get(headingSlug) ?? 0) + 1);
  }
}
const duplicateHeadingSlugs = new Set(
  [...headingSlugCounts.entries()].filter(([, count]) => count > 1).map(([slug]) => slug),
);

const renderedSections = [];
for (const section of sectionSources) {
  const { sourceMarkdown } = section;
  const sectionSlug = slugify(section.title);
  const duplicateHeading = `## ${section.title}`;
  const markdown = sourceMarkdown.startsWith(duplicateHeading)
    ? sourceMarkdown.slice(duplicateHeading.length).replace(/^\s+/, '')
    : sourceMarkdown;
  const sectionClass = section.editorial ? 'chapter editorial' : 'chapter';
  renderedSections.push(`
    <p class="chapter-break">&nbsp;</p>
    <section class="${sectionClass}" id="${sectionSlug}">
      <p class="chapter-label">${escapeHtml(section.label)}</p>
      <h1 id="${sectionSlug}">${escapeHtml(section.title)}</h1>
      ${renderMarkdown(markdown, section.equationPrefix, sectionSlug, duplicateHeadingSlugs)}
    </section>
  `);
}

const toc = sections
  .map(
    (section) => `
      <p class="toc-entry"><a href="#${slugify(section.title)}">
        <span>${escapeHtml(section.label)}</span>
        ${escapeHtml(section.title)}
      </a></p>`,
  )
  .join('');

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="author" content="Henok Ghebrechristos">
  <meta name="description" content="Digital Organism Theory — Complete Book One, editorial manuscript v4.2">
  <title>Consciousness: A Digital Organism — Complete Book One</title>
  <style>
    @page { size: 6in 9in; margin: 0.72in 0.68in 0.76in; }
    * { box-sizing: border-box; }
    body {
      color: #172522;
      background: #ffffff;
      font-family: "Noto Serif", Georgia, serif;
      font-size: 10.6pt;
      line-height: 1.48;
      margin: 0;
      orphans: 3;
      widows: 3;
    }
    p { margin: 0 0 0.76em; }
    a { color: #16706f; text-decoration: none; }
    strong { font-weight: 700; }
    em { font-style: italic; }
    .cover-page {
      height: 7.5in;
      margin: 0;
      padding: 0;
      page-break-after: always;
      text-align: center;
    }
    .cover-page img {
      display: block;
      height: 7.5in;
      margin: 0 auto;
      object-fit: cover;
      width: 5in;
    }
    .title-page {
      page-break-after: always;
      text-align: center;
      padding-top: 1.05in;
    }
    .eyebrow, .chapter-label {
      color: #16706f;
      font-family: "Noto Sans", Arial, sans-serif;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.13em;
      text-transform: uppercase;
    }
    .title-page h1 {
      color: #172522;
      font-family: "Noto Serif", Georgia, serif;
      font-size: 29pt;
      font-weight: 700;
      line-height: 1.08;
      margin: 0.32in 0 0.18in;
    }
    .subtitle {
      color: #3f5551;
      font-size: 15pt;
      font-style: italic;
      margin: 0 0 0.5in;
    }
    .title-rule {
      border: 0;
      border-top: 1.5px solid #16706f;
      margin: 0.48in auto 0.42in;
      width: 1.4in;
    }
    .author { font-size: 12.5pt; margin-top: 0.34in; }
    .edition {
      color: #5f6f6c;
      font-family: "Noto Sans", Arial, sans-serif;
      font-size: 8.8pt;
      line-height: 1.45;
      margin: 0.85in auto 0;
      max-width: 3.8in;
    }
    .copyright-page {
      page-break-after: always;
      padding-top: 3.75in;
      color: #5f6f6c;
      font-family: "Noto Sans", Arial, sans-serif;
      font-size: 8.4pt;
      line-height: 1.42;
    }
    .contents { page-break-after: always; }
    .front-break, .chapter-break {
      font-size: 0;
      height: 0;
      line-height: 0;
      margin: 0;
      page-break-before: always;
    }
    .contents h1 {
      border-bottom: 1px solid #a8c7c2;
      font-size: 21pt;
      margin: 0 0 0.36in;
      padding-bottom: 0.12in;
    }
    .toc-entry {
      border-bottom: 1px dotted #c6d8d5;
      font-size: 10pt;
      margin: 0;
      padding: 0.09in 0 0.07in;
    }
    .toc-entry span {
      color: #16706f;
      display: inline-block;
      font-family: "Noto Sans", Arial, sans-serif;
      font-size: 7.7pt;
      font-weight: 700;
      min-width: 1.05in;
    }
    .chapter-label { margin: 0 0 0.08in; }
    .chapter > h1 {
      color: #172522;
      font-size: 25pt;
      line-height: 1.08;
      margin: 0 0 0.44in;
      padding: 0 0 0.16in 0.16in;
      border-bottom: 1px solid #a8c7c2;
      border-left: 4px solid #16706f;
    }
    h2 {
      color: #174d4b;
      font-size: 15pt;
      line-height: 1.18;
      margin: 0.34in 0 0.12in;
      page-break-after: avoid;
    }
    h3 {
      color: #315b57;
      font-family: "Noto Sans", Arial, sans-serif;
      font-size: 11.1pt;
      line-height: 1.2;
      margin: 0.25in 0 0.1in;
      page-break-after: avoid;
    }
    blockquote {
      background: #f2f8f7;
      border-left: 3px solid #16706f;
      color: #24423e;
      margin: 0.18in 0 0.22in;
      padding: 0.12in 0.18in 0.07in;
      page-break-inside: avoid;
    }
    blockquote p { margin-bottom: 0.55em; }
    ul, ol { margin: 0.04in 0 0.17in 0.24in; padding-left: 0.15in; }
    li { margin: 0 0 0.08in; padding-left: 0.02in; }
    table { border-collapse: collapse; margin: 0.16in 0 0.22in; width: 100%; }
    th, td { border: 1px solid #a8c7c2; padding: 0.07in; vertical-align: top; }
    th { background: #e8f3f1; font-family: "Noto Sans", Arial, sans-serif; }
    code {
      background: transparent;
      border-radius: 0;
      font-family: "Noto Sans", Arial, sans-serif;
      font-size: 9.2pt;
      font-style: italic;
      padding: 0;
    }
    .math-display {
      background: #f7faf9;
      border-top: 1px solid #d7e4e1;
      border-bottom: 1px solid #d7e4e1;
      font-family: "Noto Sans", Arial, sans-serif;
      font-size: 10pt;
      font-style: italic;
      margin: 0.15in 0 0.2in;
      overflow: hidden;
      padding: 0.1in 0.06in;
      text-align: center;
    }
    .math-inline {
      color: #174d4b;
      font-family: "Cambria Math", "Noto Serif", Georgia, serif;
      white-space: nowrap;
    }
    .editorial {
      color: #2c3533;
    }
    .editorial > h1 { border-bottom-color: #9a6d2f; }
    .editorial .chapter-label { color: #9a6d2f; }
    .editorial h2, .editorial h3 { color: #735126; }
    .editorial p:has(strong:first-child:last-child) { page-break-after: avoid; }
  </style>
</head>
<body>
  <section class="cover-page">
    <img
      src="${escapeHtml(coverAssetUrl)}"
      alt="Consciousness: A Digital Organism — Complete Book One cover"
      width="480"
      height="720"
      style="display:block;width:5in;height:7.5in;margin:0 auto"
    >
  </section>

  <section class="title-page">
    <p class="eyebrow">Digital Organism Theory · Complete Book One</p>
    <h1>Consciousness:<br>A Digital Organism</h1>
    <p class="subtitle">Foundations, Agency, and Research</p>
    <hr class="title-rule">
    <p class="author">Henok Ghebrechristos</p>
    <p class="edition">
      Editorial Manuscript v4.2 · August 2026<br>
      Prepared for author line edit and manual refinement<br>
      Expanded directly from the immutable Public Reader’s Edition v3
    </p>
  </section>

  <p class="front-break">&nbsp;</p>
  <section class="copyright-page">
    <p>© 2026 Henok Ghebrechristos. All rights reserved.</p>
    <p>This is an unreleased editorial manuscript. It is not the public Reader’s Edition and should not be treated as a sealed publication version.</p>
    <p>Prepared after developmental editing for the author’s line edit and final manual refinement. Observation, established external model, DOT derivation, and speculation remain explicitly distinguished.</p>
  </section>

  <p class="front-break">&nbsp;</p>
  <section class="contents">
    <p class="chapter-label">EDITORIAL MANUSCRIPT</p>
    <h1>Contents</h1>
    ${toc}
  </section>

  ${renderedSections.join('\n')}
</body>
</html>`;

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, html, 'utf8');
process.stdout.write(`${outputPath}\n`);
