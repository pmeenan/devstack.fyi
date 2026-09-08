# Toolchain contract

**M0 contract, verified 2026-09-08; D-016.** The build and browser spike
passes. The owner approved the named build-tool license exceptions; the full
nginx CSP was approved by the owner on 2026-09-08 (question 10 answered).
This document supplies the concrete M1 implementation contract; no application files or server changes land in this planning step.

## Versions and local setup

Pin direct dependencies exactly (no caret or tilde), commit `pnpm-lock.yaml`,
and use `pnpm install --frozen-lockfile` in CI and deploy. Upgrades are deliberate
working-tree changes followed by both checks and a dependency-license review.

| Tool/package | Pin | Package metadata license |
| --- | --- | --- |
| Node | 24.18.1 in `.node-version` | Check upstream distribution notices in M1 |
| pnpm | 12.3.4 in `packageManager` | MIT |
| astro | 7.3.2 | MIT |
| @astrojs/mdx | 8.0.1 | MIT |
| @astrojs/sitemap | 3.7.4 | MIT |
| @astrojs/check | 0.9.10 | MIT |
| typescript | 6.0.3 | Apache-2.0 |
| prettier | 3.9.6 | MIT |
| prettier-plugin-astro | 0.14.1 | MIT |

These are tested pins, not a promise to track `latest`. Metadata was read from
`https://registry.npmjs.org/<package>/<version>` and the installed packages.
Astro and MDX require Node >=22.12.0; the selected Node meets that requirement.
The checker accepts TypeScript 5/6; do not use TypeScript 7 (RE-001).

Local setup: install the pinned Node, then enable Corepack's pnpm shim if
Corepack is available (`corepack enable pnpm`); `corepack pnpm` also works
without the shim and was used for this spike. Document an explicit pnpm 12.3.4
installation alternative in M1; do not assume a bare `pnpm` is on PATH.
`pnpm-workspace.yaml` sets `allowBuilds: { esbuild: true }`, retaining strict
build-script approval (RE-002). Review and commit any exact
`minimumReleaseAgeExclude` entries pnpm adds during the initial install; never
turn off that policy globally. This spike added Astro, MDX, and
`@astrojs/markdown-satteri@0.4.1` exceptions.

`tsconfig.json` extends `astro/tsconfigs/strict`, includes `.astro/types.d.ts`
and project source, excludes `dist`, and defines the architecture's aliases.
Keep typed logic in `.ts` and `.astro`; MDX compilation is not a component-prop
type check. No `any` without the explanatory comment required by AGENTS.md.

## Checks and PR workflow

- `pnpm check`: `astro check` followed by `prettier --check .` and a license
  check over the installed dependency tree. The latter is an M1 script that
  consumes `pnpm licenses list --json`; include dev and optional packages.
- `pnpm build`: `astro build` followed by an output check for the CSP contract
  below. Collection validation and the stale warning pass run in the build.
- `pnpm format`: `prettier --write .`. Load `prettier-plugin-astro` explicitly
  and specify its parser for `*.astro`. Ignore generated `.astro/`, `dist/`,
  dependencies, and the lockfile; format the tracked M0 docs once in M1.
- No separate ESLint stack initially. The type checker, formatter, schema
  validation, and output checks form the gate; this is not a claim that a
  formatter catches logic or accessibility errors. Add targeted lint rules
  when a concrete recurring defect warrants them.

The M1 GitHub Actions workflow runs on `pull_request` with `contents: read`,
no secrets, no deploy, and no `pull_request_target`. Use `actions/checkout`,
`pnpm/action-setup` (reads `packageManager`), then `actions/setup-node` (reads
`.node-version`, caches pnpm), frozen install, check, build. Pin action commits
and verify their own licenses when adding the workflow. Cancel superseded runs
for the same PR; a successful run is the human's merge evidence.
[setup-node](https://github.com/actions/setup-node) and
[pnpm/action-setup](https://github.com/pnpm/action-setup) document this ordering.

## Dependency audit and the build-tool exception

Direct-package licenses alone are insufficient. The Linux x64 spike's
[`pnpm licenses list --json`](https://pnpm.io/cli/licenses) reports:

- `astro@7.3.2` → `vite@8.2.2` → `lightningcss@1.33.0` and
  `lightningcss-linux-x64-gnu@1.33.0`: **MPL-2.0**. Lightning CSS is a regular
  Vite dependency; disabling a CSS option does not remove it from the install.
- Astro's optional `sharp@0.35.4` → `@img/sharp-libvips-linux-x64@1.3.3`:
  **LGPL-3.0-or-later**. Omitting Sharp would change the image-processing
  architecture, and would not resolve Lightning CSS.

The licenses above were confirmed from the installed packages' `package.json`
and Lightning CSS's LICENSE, not inferred from runtime usage. The owner approved build-only use on 2026-09-08; D-016 amends D-002
for these named tools. MPL remains file-level copyleft, not a permissive
license ([Mozilla FAQ](https://www.mozilla.org/en-US/MPL/2.0/FAQ/)).

**Approved narrow amendment:** allow these named Lightning CSS packages and
Sharp's libvips distributions solely as unmodified local/CI build tools.
Keep all shipped JavaScript, CSS, and other site assets under the existing
policy; do not publish `node_modules`, native tool binaries, or a build image.
This is not a general exception for every development dependency. Record
exact package/version/license/source evidence in `docs/dependency-licenses.md`
in M1, including any additional platform packages before admitting them.
An older Astro/Vite combination would require repeating the content, font,
and diagram spikes; the accepted exception avoids that compatibility detour.

The M1 audit permits only an explicit list of permissive SPDX identifiers or
reviewed expressions, plus any owner-approved named exceptions. Missing,
unknown, or unapproved metadata fails with package and version; an `OR`
expression needs a documented accepted branch, an `AND` expression needs every
license accepted. Read the package's LICENSE when metadata is ambiguous; no
blanket `UNKNOWN` bypass. Audit lockfile changes, including optional platform
packages absent from the current machine, against their published metadata.

Fonts: use Inter for prose and JetBrains Mono for code, Latin WOFF2 variable
files through Astro's local font provider. The candidate Fontsource packages
`@fontsource-variable/inter@5.3.0` and
`@fontsource-variable/jetbrains-mono@5.3.0` both report **OFL-1.1** in their own
registry metadata. Before copying fonts in M1, verify and retain their actual
font license files and record the font-specific redistribution terms in the
license inventory; do not relabel fonts Apache-2.0. No remote font provider.

## CSP and code rendering (accepted answer to question 10)

Use a full, static nginx header, no Astro CSP meta policy and no per-deploy
hash list. This is option (b) in the architecture evidence, replacing its
earlier recommendation of option (a). The chosen custom elements need no
inline hydration code; an external theme script costs one blocking request
on a cold load but removes hash maintenance and the meta-order trap (RE-005).

```text
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
```

Set `vite.build.assetsInlineLimit: 0`, `build.inlineStylesheets: 'never'`, and
`markdown.syntaxHighlight: 'prism'`. Author theme-aware CSS for Prism's token
classes; no client highlighter and no inline Shiki styles. For dynamically
supplied code use the Prism component, checking its package license if added.
The [Astro syntax guide](https://docs.astro.build/en/guides/syntax-highlighting/)
documents Prism's class output; the
[configuration reference](https://docs.astro.build/en/reference/configuration-reference/#buildinlinestylesheets)
documents stylesheet externalization.

Import the plain JavaScript theme initializer with `?url` and emit
`<script is:inline src={themeUrl}></script>` early in `<head>`, before styles.
Here `is:inline` preserves the external, classic, parser-blocking tag; it has
no inline body, `async`, or `defer`. `?url` plus the zero inline limit puts it
under `/_astro/` with a content hash. Catch storage failures and keep the
CSS system-theme fallback. All other scripts use processed component scripts.

The output check rejects inline executable scripts, inline event handlers,
`style` attributes, `<style>` tags, and remote script/style/font/image URLs.
Keep font-generated CSS external too; verify the fonts API in the M1 build.
No data/blob assets or eval are needed by this shell. The M1 browser pass must
exercise the theme, copy button, diagrams, fonts, and both color schemes under
this real header; `pnpm preview` alone cannot prove that they work.

## Cache and nginx reference contract

Use `public, max-age=300, must-revalidate` for successful HTML and unhashed
files; use `public, max-age=31536000, immutable` for successful `/_astro/**`.
Use `no-store` on the custom 404 response, including missing asset requests,
so a missing file is never cached for a year. A cache TTL bounds cached
responses, not the lifetime of an already-open tab.

M1 writes `deploy/nginx/devstack.fyi.conf` against the current vhost, preserving
its TLS/certbot wiring. Its five changes are the real 404 routing, immutable
asset location, five-minute default TTL, apex redirect, and full CSP above.
Use `expires off` to prevent a second cache policy. The reference must include:

- Both HTTP hosts redirect to `https://devstack.fyi$request_uri`; HTTPS www
  redirects to the same apex with its existing certificate.
- Apex: docroot `/var/www/devstack.fyi`, `index index.html`,
  `try_files $uri $uri/ =404`, and `error_page 404 /404.html`.
- `location ^~ /_astro/` checks actual file existence before serving it.
  Its immutable `add_header` does not use `always`; errors go to the custom
  404 location, which sends `Cache-Control: no-store` with `always`.
- Every location defining `add_header` repeats the full security-header set
  (or includes a shared snippet). CSP uses `always` on success and errors.
  Preserve existing unrelated security headers. Do not accidentally combine
  the old HTML `expires -1` rule with the new cache policy.

[nginx's header documentation](https://nginx.org/en/docs/http/ngx_http_headers_module.html)
explains header inheritance and the status-code filter. Validate the complete
reference with local nginx in M1, including 200, slash redirect, missing page,
missing asset, and HTTP/HTTPS host redirects. Only the owner installs it with sudo, runs `nginx -t`, and reloads nginx on
plex. M1 provides the reviewed configuration and exact commands; no sudo or
server changes are needed in this planning step.

## Retired assets and safe cleanup

Keep retired hashed assets for **seven full days (604800 seconds)** from their
first absence after a successful deployment, measured in UTC epoch seconds.
This exceeds the five-minute HTML TTL and covers a week of open tabs; tabs
older than the grace period may need a reload. Reappearing assets immediately
lose their retirement entry; a later retirement starts a new seven-day clock.

Use a JSON ledger outside the docroot at
`~/.local/state/devstack.fyi/retired-assets.json` on plex. The deploy script's
M1 implementation must:

1. Hold a remote site-specific lock from inventory through upload and cleanup;
   all mutating deploys use it. A dry run takes the same snapshot without
   changing the ledger or deleting files. Recheck the snapshot before applying
   a previously displayed plan; never delete from an outdated preview.
2. Upload the complete new `/_astro/` set before replacing HTML, then rsync the
   rest with `--delete` and receiver protection for `/_astro/**` (including
   its directory tree). An interrupted upload leaves the old assets intact;
   mixed HTML during rsync can refer to either asset set. This is not an atomic
   site deployment.
3. Only after both transfers succeed, reconcile the ledger against the local
   asset manifest and remote inventory. Remove active paths from the ledger;
   timestamp newly absent assets using the remote clock. File mtimes are not
   retirement dates. Missing ledger means restart the grace period for all
   absent assets; a malformed ledger stops cleanup without deleting anything.
4. Save the reconciled ledger atomically before cleanup. Delete only expired
   regular files still absent from the active manifest. Restrict paths to
   relative `_astro/` descendants, reject traversal and symlinks (including
   symlinked parents), and never interpolate manifest paths into shell code.
   Pass structured data or NUL-delimited paths to the remote helper.
5. Remove ledger entries only after deletion succeeds (already-absent paths
   can be cleared). An interrupted cleanup is retryable. Never clean up after
   a failed transfer; report a cleanup failure even if the upload succeeded.

The script remains human-run. M1 tests these rules using temporary local
fixtures: first retirement, unexpired/expired files, rollback/reactivation,
second retirement, transfer failure, missing/corrupt ledger, unsafe paths,
and lock contention. The dry-run output includes proposed ledger changes and
exact cleanup paths. Confirm the required remote helper/runtime in M1 before
choosing its implementation; no hidden new server dependency.

## Evidence from the throwaway spike

On 2026-09-08, outside the repository, the pinned packages above passed a
frozen install, `astro check` (zero errors/warnings/hints), and static build
with MDX, sitemap, Prism, a blocking theme script, external CSS, and two
instances of a custom element. Built HTML contained two external hashed
scripts, one external stylesheet, Prism token classes, and no inline styles
or executable script bodies. Headless Chrome loaded it from a local Python
HTTP server sending the proposed CSP; the theme and processed module both
set their expected DOM markers. This checks script execution, not full UI
interaction or nginx routing; those remain M1 checks.

Prettier's Astro formatter needed a second write for adjacent custom elements
in compact markup; the following `--check` passed (RE-007). The complete
installed-license report exposed the D-002 conflict above (RE-006). No build
outputs, scratch dependencies, or browser profiles were added to this repo.
