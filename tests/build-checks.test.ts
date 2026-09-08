import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkOutput } from '../scripts/check-output.ts';
import { verifyLicenses } from '../scripts/check-licenses.ts';

async function outputFixture(html: string, css = '') {
  const root = await mkdtemp(join(tmpdir(), 'devstack-output-'));
  await mkdir(join(root, '_astro'));
  await writeFile(join(root, 'index.html'), html);
  await writeFile(join(root, '_astro', 'app.js'), 'console.log("fixture");');
  await writeFile(join(root, '_astro', 'app.css'), css);
  await writeFile(join(root, '_astro', 'font.woff2'), 'fixture');
  await writeFile(
    join(root, '_astro', 'image.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
  );
  try {
    return await checkOutput(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('output guard accepts local external assets and escaped snippet text', async () => {
  assert.deepEqual(
    await outputFixture(
      `<!doctype html><html><head><link rel="stylesheet" href="/_astro/app.css"><script src="/_astro/app.js"></script></head><body><a href="https://vendor.example/docs">Source</a><pre>&lt;style&gt;example&lt;/style&gt;</pre><img src="/_astro/image.svg"><svg><use href="#node"></use></svg></body></html>`,
      '@font-face { font-family: test; src: url("./font.woff2"); }',
    ),
    [],
  );
});

test('output guard rejects inline execution, styles, and remote/missing assets', async () => {
  for (const html of [
    '<script>alert(1)</script>',
    '<button onclick="alert(1)">Click</button>',
    '<style>body { color: red }</style>',
    '<p style="color:red">text</p>',
    '<script src="https://cdn.example/app.js"></script>',
    '<img src="//cdn.example/image.png">',
    '<img src="data:image/png;base64,AAAA">',
    '<img srcset="/_astro/image.svg 1x, https://cdn.example/image.svg 2x">',
    '<link rel="preload" as="font" href="https://cdn.example/font.woff2">',
    '<img src="/missing.png">',
    '<template><img onerror="alert(1)" src="/missing.png"></template>',
    '<svg><image href="https://cdn.example/image.svg"></image></svg>',
  ])
    assert.ok((await outputFixture(html)).length > 0, html);
});

test('output guard rejects CSS imports and escaped remote resource URLs', async () => {
  for (const css of [
    '@import "https://cdn.example/app.css";',
    '.x { background: url(https://cdn.example/a.png) }',
    '.x { background: u\\72l(https://cdn.example/a.png) }',
    '.x { background: image-set("https://cdn.example/a.png" 1x) }',
    '@font-face { src: url(data:font/woff2;base64,AAAA) }',
  ])
    assert.ok((await outputFixture('<p>Text</p>', css)).length > 0, css);
});

const source = (name: string, version: string) =>
  `https://registry.npmjs.org/${name}/${version}`;
test('license guard covers uninstalled platform packages and fails closed', () => {
  const report = {
    MIT: [{ name: 'example', versions: ['1.0.0'], license: 'MIT' }],
  };
  const inventory = {
    'example@1.0.0': { license: 'MIT', source: source('example', '1.0.0') },
    'lightningcss-linux-arm64-gnu@1.33.0': {
      license: 'MPL-2.0',
      source: source('lightningcss-linux-arm64-gnu', '1.33.0'),
    },
  };
  const locked = Object.keys(inventory);
  assert.deepEqual(verifyLicenses(report, locked, inventory), []);
  assert.ok(
    verifyLicenses(report, [...locked, 'unreviewed@1.0.0'], inventory).length,
  );
  for (const license of [
    'UNKNOWN',
    'GPL-3.0-only',
    'MIT OR GPL-3.0-only',
    'MIT AND GPL-3.0-only',
    'MPL-2.0',
  ]) {
    const bad = {
      ...inventory,
      'example@1.0.0': { license, source: source('example', '1.0.0') },
    };
    assert.ok(verifyLicenses(report, locked, bad).length, license);
  }
  assert.ok(verifyLicenses({}, locked, inventory).length);
  assert.ok(verifyLicenses({ MIT: [{}] }, locked, inventory).length);
  assert.ok(
    verifyLicenses(
      { MIT: [{ name: 'example', versions: ['1.0.0'], license: 'ISC' }] },
      locked,
      inventory,
    ).length,
  );
});
