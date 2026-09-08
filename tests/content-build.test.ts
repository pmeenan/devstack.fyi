import assert from 'node:assert/strict';
import {
  cp,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  writeFile,
  rm,
  symlink,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { parse, stringify } from 'yaml';

test('content build validates records, routes, working-doc exclusion, and stale warnings', async () => {
  const root = await mkdtemp(join(tmpdir(), 'devstack-content-'));
  const project = resolve(import.meta.dirname, '..');
  try {
    for (const name of [
      'src',
      'services',
      'astro.config.ts',
      'tsconfig.json',
      'package.json',
    ]) {
      await cp(join(project, name), join(root, name), { recursive: true });
    }
    await symlink(
      join(project, 'node_modules'),
      join(root, 'node_modules'),
      'dir',
    );
    await cp(join(root, 'services/_template'), join(root, 'services/example'), {
      recursive: true,
    });
    const subpage = join(root, 'services/example/content/local-dev');
    await mkdir(subpage);
    await writeFile(
      join(subpage, 'index.mdx'),
      `---
title: Local fixture
summary: Fictional sub-page for route verification.
sources:
  - url: https://example.com/docs/
    title: Fictional documentation
lastVerified: 2020-01-01
---

Sub-page fixture is rendered.
`,
    );
    await writeFile(
      join(root, 'services/example/docs/private.mdx'),
      'WORKING_DOC_MUST_NOT_SHIP',
    );
    const file = join(root, 'services/example/content/products/widgets.yaml');
    const original = await readFile(file, 'utf8');
    function build() {
      const result = spawnSync(
        process.execPath,
        [join(project, 'node_modules/astro/bin/astro.mjs'), 'build'],
        {
          cwd: root,
          encoding: 'utf8',
          timeout: 30_000,
          env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', NO_COLOR: '1' },
        },
      );
      if (result.error) throw result.error;
      return { status: result.status, output: result.stdout + result.stderr };
    }
    const staleProduct = original.replaceAll('2026-09-08', '2020-01-01');
    await writeFile(file, staleProduct);
    const success = build();
    assert.equal(success.status, 0, success.output);
    assert.match(success.output, /\[stale\] page example\/local-dev/);
    assert.match(success.output, /\[stale\] product example\/widgets/);
    assert.match(success.output, /\[stale\] limits example\/widgets/);
    assert.match(
      await readFile(join(root, 'dist/example/local-dev/index.html'), 'utf8'),
      /Sub-page fixture is rendered/,
    );
    assert.match(
      await readFile(join(root, 'dist/example/index.html'), 'utf8'),
      /href="\/example\/local-dev\/"/,
    );
    const paths = await readdir(join(root, 'dist'), { recursive: true });
    assert.ok(
      !paths.some(
        (path) =>
          path.includes('_template') ||
          path.includes('docs/') ||
          path.includes('content/'),
      ),
    );
    for (const path of paths.filter((path) => path.endsWith('.html'))) {
      assert.doesNotMatch(
        await readFile(join(root, 'dist', path), 'utf8'),
        /WORKING_DOC_MUST_NOT_SHIP/,
      );
    }
    // Each invalid fixture is a real Astro build, not a copy of the schema's logic.
    const fixtures: [string, RegExp][] = [
      [original + '\nlastverified: 2026-09-08\n', /lastverified/],
      [
        original.replace('group: compute', 'group: missing'),
        /undeclared group/,
      ],
      [
        original.replace('paid: "Unlimited"', 'other: "Unlimited"'),
        /unknown tier/,
      ],
      [original.replace(', paid: "Unlimited"', ''), /missing value for tier/],
      [original.replace('2026-09-08', '2026-9-8'), /lastVerified/],
      [
        original.replace('https://example.com/docs/widgets/', 'not-a-url'),
        /docs/,
      ],
    ];
    // YAML formatting may differ after pnpm format; modify the parsed metric for tier cases.
    const record = parse(original) as {
      limits: { metrics: { values: Record<string, string> }[] };
    };
    const extraTier = structuredClone(record);
    extraTier.limits.metrics[0]!.values.other = '1';
    const missingTier = structuredClone(record);
    delete missingTier.limits.metrics[0]!.values.paid;
    fixtures[2] = [stringify(extraTier), /unknown tier/];
    fixtures[3] = [stringify(missingTier), /missing value for tier/];
    for (const [yaml, expected] of fixtures) {
      await writeFile(file, yaml);
      const result = build();
      assert.notEqual(
        result.status,
        0,
        `Invalid fixture built successfully: ${expected}`,
      );
      assert.match(result.output, expected);
      assert.match(result.output, /widgets|example/);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
