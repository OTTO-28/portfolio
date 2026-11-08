import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';

export const dist = fileURLToPath(new URL('../../dist/', import.meta.url));

export function attribute(node, name) {
  return node.attrs?.find((entry) => entry.name === name)?.value;
}

export function* elements(node) {
  if (node.tagName) yield node;
  for (const child of node.childNodes ?? []) yield* elements(child);
}

export function textContent(node) {
  return node.nodeName === '#text'
    ? node.value
    : (node.childNodes ?? []).map(textContent).join('');
}

export async function readPage(path) {
  const html = await readFile(resolve(dist, path), 'utf8');
  return { html, nodes: [...elements(parse(html))] };
}

/** Astro may inline small scripts or emit them as local assets. Test either form. */
export async function clientScript(path) {
  const { nodes } = await readPage(path);
  const scripts = nodes.filter(
    (node) => node.tagName === 'script' && attribute(node, 'type') === 'module',
  );
  if (!scripts.length) throw new Error(`No client script found in ${path}`);
  return (
    await Promise.all(
      scripts.map(async (node) => {
        const src = attribute(node, 'src');
        return src
          ? readFile(resolve(dist, src.replace(/^\//, '')), 'utf8')
          : textContent(node);
      }),
    )
  ).join('\n');
}
