import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseAllDocuments } from 'yaml';

type Evidence = { license: string; source: string };
type Inventory = Record<string, Evidence>;
const bundledLibvips = new Map([
  ['@img/sharp-win32-arm64', 'Apache-2.0 AND LGPL-3.0-or-later'],
  ['@img/sharp-win32-ia32', 'Apache-2.0 AND LGPL-3.0-or-later'],
  ['@img/sharp-win32-x64', 'Apache-2.0 AND LGPL-3.0-or-later'],
  ['@img/sharp-wasm32', 'Apache-2.0 AND LGPL-3.0-or-later AND MIT'],
]);
const permissive = new Set([
  'MIT',
  'ISC',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  '0BSD',
  'CC0-1.0',
  'BlueOak-1.0.0',
  'Python-2.0',
]);
// D-016: named, unmodified build tools only. Exact versions still require inventory evidence.
export function allowedLicense(name: string, license: string): boolean {
  return (
    permissive.has(license) ||
    bundledLibvips.get(name) === license ||
    (license === 'MPL-2.0' &&
      (name === 'lightningcss' || name.startsWith('lightningcss-'))) ||
    (license === 'LGPL-3.0-or-later' && name.startsWith('@img/sharp-libvips-'))
  );
}
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function verifyLicenses(
  report: unknown,
  locked: string[],
  inventory: Inventory,
): string[] {
  const errors: string[] = [];
  const keys = new Set(locked);
  if (!object(report) || Object.keys(report).length === 0)
    return ['Empty or malformed pnpm license report'];
  for (const entries of Object.values(report)) {
    if (!Array.isArray(entries)) {
      errors.push('Malformed pnpm license group');
      continue;
    }
    for (const entry of entries as unknown[]) {
      if (
        !object(entry) ||
        typeof entry.name !== 'string' ||
        typeof entry.license !== 'string' ||
        !Array.isArray(entry.versions) ||
        !entry.versions.length
      ) {
        errors.push('Malformed pnpm license entry');
        continue;
      }
      for (const version of entry.versions as unknown[]) {
        const key = `${entry.name}@${String(version)}`;
        if (typeof version !== 'string' || !keys.has(key))
          errors.push(`${key}: installed package absent from lockfile`);
        if (inventory[key]?.license !== entry.license)
          errors.push(
            `${key}: installed license differs from reviewed metadata (${entry.license})`,
          );
        if (!allowedLicense(entry.name, entry.license))
          errors.push(`${key}: unapproved license ${entry.license}`);
      }
    }
  }
  for (const key of locked) {
    const evidence = inventory[key];
    const name = key.slice(0, key.lastIndexOf('@'));
    if (
      !evidence ||
      typeof evidence.license !== 'string' ||
      evidence.source !==
        `https://registry.npmjs.org/${key.slice(0, key.lastIndexOf('@'))}/${key.slice(key.lastIndexOf('@') + 1)}`
    ) {
      errors.push(`${key}: missing exact package/version/source evidence`);
      continue;
    }
    if (!allowedLicense(name, evidence.license))
      errors.push(`${key}: unapproved license ${evidence.license}`);
  }
  for (const key of Object.keys(inventory))
    if (!keys.has(key))
      errors.push(`${key}: stale inventory record; reconcile with lockfile`);
  return errors;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  // npm_execpath is pnpm's own entry point when invoked through a pnpm script.
  // Use corepack as a fallback for direct invocation; no shell interpolation.
  const pnpmEntry = process.env.npm_execpath;
  const report: unknown = JSON.parse(
    pnpmEntry
      ? execFileSync(
          /\.[cm]?js$/.test(pnpmEntry) ? process.execPath : pnpmEntry,
          /\.[cm]?js$/.test(pnpmEntry)
            ? [pnpmEntry, 'licenses', 'list', '--json']
            : ['licenses', 'list', '--json'],
          { encoding: 'utf8' },
        )
      : execFileSync('corepack', ['pnpm', 'licenses', 'list', '--json'], {
          encoding: 'utf8',
        }),
  );
  const locked = new Set<string>();
  // pnpm 12 stores its package-manager graph and project graph as separate YAML documents.
  for (const document of parseAllDocuments(
    await readFile('pnpm-lock.yaml', 'utf8'),
  )) {
    if (document.errors.length)
      throw new Error(document.errors.map((error) => error.message).join('\n'));
    const lock: unknown = document.toJSON();
    if (
      !object(lock) ||
      !object(lock.packages) ||
      !Object.keys(lock.packages).length
    )
      throw new Error('Invalid lockfile packages');
    for (const key of Object.keys(lock.packages)) locked.add(key);
  }
  const inventory = JSON.parse(
    await readFile('docs/dependency-licenses.json', 'utf8'),
  ) as Inventory;
  const errors = verifyLicenses(report, [...locked], inventory);
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else
    console.log(
      `License check passed: installed tree and ${locked.size} locked packages (all platforms).`,
    );
}
