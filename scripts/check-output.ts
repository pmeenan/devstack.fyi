import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse, type DefaultTreeAdapterMap } from 'parse5';
import postcss from 'postcss';
import valueParser from 'postcss-value-parser';

const origin = 'https://devstack.fyi';

export async function checkOutput(directory: string): Promise<string[]> {
  const root = resolve(directory);
  const errors: string[] = [];
  const files: string[] = [];
  async function walk(directory: string) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, item.name);
      if (item.isSymbolicLink())
        errors.push(`${relative(root, path)}: symlink in output`);
      else if (item.isDirectory()) await walk(path);
      else files.push(path);
    }
  }
  await walk(root);
  if (!files.includes(resolve(root, 'index.html')))
    errors.push('Missing index.html');
  function fail(file: string, message: string) {
    errors.push(`${relative(root, file)}: ${message}`);
  }
  function asset(file: string, value: string) {
    const cleaned = value.trim();
    // Fragments are SVG references; empty URLs are not useful assets.
    if (cleaned.startsWith('#')) return;
    if (!cleaned) {
      fail(file, 'empty asset URL');
      return;
    }
    let url: URL;
    try {
      url = new URL(
        cleaned,
        `${origin}/${relative(root, file).split(sep).join('/')}`,
      );
    } catch {
      fail(file, `invalid asset URL ${value}`);
      return;
    }
    if (url.origin !== origin || url.protocol !== 'https:') {
      fail(file, `non-self asset URL ${value}`);
      return;
    }
    let path: string;
    try {
      path = resolve(root, `.${decodeURIComponent(url.pathname)}`);
    } catch {
      fail(file, `invalid asset path ${value}`);
      return;
    }
    if (!path.startsWith(root + sep) || !files.includes(path))
      fail(file, `missing/unsafe asset ${value}`);
  }
  function html(file: string, text: string) {
    function visit(node: DefaultTreeAdapterMap['node']) {
      if ('tagName' in node) {
        const attrs = new Map(
          node.attrs.map((attr) => [
            attr.prefix ? `${attr.prefix}:${attr.name}` : attr.name,
            attr.value,
          ]),
        );
        for (const name of attrs.keys()) {
          if (name === 'style' || name.startsWith('on') || name === 'srcdoc')
            fail(file, `forbidden ${name} attribute`);
        }
        if (
          ['style', 'base', 'iframe', 'object', 'embed'].includes(node.tagName)
        )
          fail(file, `forbidden <${node.tagName}>`);
        if (node.tagName === 'script') {
          if (!attrs.has('src')) fail(file, 'inline script');
          if (
            node.childNodes.some(
              (child) => 'value' in child && child.value.trim(),
            )
          )
            fail(file, 'script body');
        }
        if (attrs.has('src')) asset(file, attrs.get('src')!);
        if (attrs.has('poster')) asset(file, attrs.get('poster')!);
        if (attrs.has('srcset')) {
          const srcset = attrs.get('srcset')!;
          if (/\b(?:data|blob):/i.test(srcset)) fail(file, 'non-self srcset');
          for (const candidate of srcset.split(','))
            asset(file, candidate.trim().split(/\s+/)[0]!);
        }
        if (node.tagName === 'link') {
          const rel = attrs.get('rel')?.toLowerCase().split(/\s+/) ?? [];
          if (
            rel.some((r) =>
              [
                'stylesheet',
                'preload',
                'modulepreload',
                'icon',
                'prefetch',
                'preconnect',
                'dns-prefetch',
              ].includes(r),
            )
          )
            asset(file, attrs.get('href') ?? '');
        }
        if (['image', 'use', 'feimage'].includes(node.tagName.toLowerCase())) {
          for (const name of ['href', 'xlink:href'])
            if (attrs.has(name)) asset(file, attrs.get(name)!);
        }
        // SVG presentation attributes can reference external resources through url().
        for (const value of attrs.values())
          if (/url\s*\(/i.test(value)) cssValue(file, value);
        if ('content' in node) visit(node.content);
      }
      if ('childNodes' in node)
        for (const child of node.childNodes) visit(child);
    }
    visit(parse(text));
  }
  function cssValue(file: string, value: string) {
    // Decode CSS escapes before parsing so escaped schemes/functions are checked too.
    const decoded = value.replace(
      /\\([0-9a-f]{1,6})\s?|\\([^\n\r])/gi,
      (_match: string, hex: string | undefined, char: string | undefined) =>
        hex ? String.fromCodePoint(parseInt(hex, 16) || 0xfffd) : char!,
    );
    valueParser(decoded).walk((node) => {
      if (node.type === 'function' && node.value.toLowerCase() === 'url') {
        asset(
          file,
          valueParser.stringify(node.nodes).replace(/^(['"])(.*)\1$/, '$2'),
        );
        return false;
      }
      if (
        node.type === 'function' &&
        /^(?:-webkit-)?image-set$/i.test(node.value)
      ) {
        for (const child of node.nodes)
          if (child.type === 'string') asset(file, child.value);
      }
    });
  }
  for (const file of files) {
    const extension = extname(file);
    if (['.html', '.svg'].includes(extension))
      html(file, await readFile(file, 'utf8'));
    if (extension === '.css') {
      const css = postcss.parse(await readFile(file, 'utf8'), { from: file });
      css.walkDecls((declaration) => {
        cssValue(file, declaration.value);
      });
      css.walkAtRules((rule) => {
        cssValue(file, rule.params);
        if (rule.name.toLowerCase() === 'import') {
          const first = valueParser(rule.params).nodes.find(
            (node) => node.type !== 'space' && node.type !== 'comment',
          );
          if (first?.type === 'string') asset(file, first.value);
        }
      });
    }
  }
  return errors;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const errors = await checkOutput(process.argv[2] ?? 'dist');
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else
    console.log(
      'Output check passed: external self-hosted assets, no inline scripts/styles.',
    );
}
