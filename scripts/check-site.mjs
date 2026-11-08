// Validate the generated site rather than duplicating page implementation details.
import assert from 'node:assert/strict';
import { readdir, readFile, access } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { attribute, readPage, textContent, dist } from './lib/built-site.mjs';

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) => {
        const path = resolve(directory, entry.name);
        return entry.isDirectory()
          ? htmlFiles(path)
          : path.endsWith('.html')
            ? [path]
            : [];
      }),
    )
  ).flat();
}
const pages = new Map();
for (const path of await htmlFiles(dist)) pages.set(path, await readPage(path));
for (const [path, { nodes }] of pages) {
  const ids = nodes.map((node) => attribute(node, 'id')).filter(Boolean);
  assert.equal(ids.length, new Set(ids).size, `Duplicate IDs: ${path}`);
  const isRedirect = nodes.some(
    (node) =>
      node.tagName === 'meta' &&
      attribute(node, 'http-equiv')?.toLowerCase() === 'refresh',
  );
  if (!isRedirect) {
    assert.equal(
      nodes.filter((node) => node.tagName === 'h1').length,
      1,
      `One h1 required: ${path}`,
    );
    assert.equal(
      nodes.filter((node) => attribute(node, 'aria-current') === 'page').length,
      1,
      `One active nav link required: ${path}`,
    );
    assert.ok(
      nodes.some(
        (node) =>
          node.tagName === 'meta' && attribute(node, 'name') === 'description',
      ),
      `Missing description: ${path}`,
    );
  }
  for (const node of nodes) {
    const href = attribute(node, 'href') ?? attribute(node, 'src');
    if (!href || /^(?:[a-z]+:|\/\/)/i.test(href)) continue;
    const url = new URL(
      href,
      `https://local.test/${relative(dist, path).split(sep).join('/')}`,
    );
    let target = resolve(
      dist,
      decodeURIComponent(url.pathname).replace(/^\//, ''),
    );
    if (url.pathname.endsWith('/')) target = resolve(target, 'index.html');
    assert.ok(target.startsWith(dist), `Link escapes build: ${href}`);
    await access(target).catch(() => {
      throw new Error(`Broken link in ${relative(dist, path)}: ${href}`);
    });
    if (url.hash && pages.has(target)) {
      assert.ok(
        pages
          .get(target)
          .nodes.some(
            (item) =>
              attribute(item, 'id') === decodeURIComponent(url.hash.slice(1)),
          ),
        `Broken anchor: ${href}`,
      );
    }
  }
}
const home = pages.get(resolve(dist, 'index.html'));
const quoteIndex = home.nodes.findIndex(
  (node) => attribute(node, 'class') === 'landing-quote',
);
const contactIndex = home.nodes.findIndex(
  (node) => attribute(node, 'class') === 'contact',
);
assert.ok(
  quoteIndex >= 0 && quoteIndex < contactIndex,
  'Quote must appear above the hello/contact section',
);
for (const [path, { nodes, html }] of pages) {
  if (path !== resolve(dist, 'index.html'))
    assert.ok(
      !html.includes('Excellence is never an accident.'),
      'Quote belongs only on the homepage',
    );
  assert.ok(
    !nodes.some((node) => attribute(node, 'class') === 'site-footer'),
    'Copyright footer must stay removed',
  );
  assert.ok(!html.includes('/rss.xml'), 'RSS links must stay removed');
}
const blog = pages.get(resolve(dist, 'blog/index.html'));
const postFiles = (
  await readdir(new URL('../src/content/blog/', import.meta.url))
).filter((file) => file.endsWith('.mdx'));
assert.equal(
  blog.nodes.filter((node) => attribute(node, 'class') === 'post-card').length,
  postFiles.length,
);
const cv = pages.get(resolve(dist, 'cv/index.html'));
assert.ok(!cv.html.includes('A few milestones'));
assert.ok(
  cv.html.includes('Knowledge Graphs &amp; Clinical Trial Eligibility'),
);
const download = cv.nodes.find(
  (node) => node.tagName === 'a' && attribute(node, 'download'),
);
assert.ok(download && attribute(download, 'href') === '/assets/resume.pdf');
const resume = pages.get(resolve(dist, 'resume/index.html'));
assert.ok(resume.html.includes('/cv/'), 'Preserve old resume bookmarks');
for (const removed of ['rss.xml', 'blog/using-mdx/index.html']) {
  await assert.rejects(
    access(resolve(dist, removed)),
    `Removed route must not be generated: ${removed}`,
  );
}
const sitemap = await readFile(resolve(dist, 'sitemap-0.xml'), 'utf8');
for (const route of [
  '/blog/',
  '/cv/',
  '/blog/knowledge-graphs-clinical-trials/',
])
  assert.ok(sitemap.includes(route));
assert.ok(
  textContent(home.nodes.find((node) => node.tagName === 'h1')).includes(
    'Making sense.',
  ),
);
console.log(
  `PASS: ${pages.size} pages, local assets/anchors, navigation, metadata, article routes, CV download, removed routes, and quote placement.`,
);
