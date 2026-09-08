# Rough edges — findings log

Astro, pnpm, browser, web-server, and vendor-documentation quirks, surprising
limits, and missing capabilities encountered while building devstack.fyi. Log
the ones that burned real debugging time and will bite again — this is a
save-future-you log, not a compliance artifact. (Findings about a *service's
behavior* that belong in the published notes go in that service's content or
working docs, not here.)

**Before adding:** grep for the API/library involved to avoid duplicates.
**Before debugging weirdness:** check here first — it may be known.

A good entry says what environment it happened in and what was observed vs.
expected; include a reproduction when it's cheap to capture.

Format:

```
## RE-NNN: Title  (YYYY-MM-DD, status: open | fixed-upstream | worked-around | wontfix)
Environment / Repro or measurement / Observed / Expected / Impact / Links
```

Newest first. RE-numbers are never reused.

---

## RE-007: Prettier Astro formatting can need a second pass for compact custom-element markup  (2026-09-08, status: worked-around)
Environment: Prettier 3.9.6, prettier-plugin-astro 0.14.1, Astro 7.3.2.
Observed: formatting a compact document containing two adjacent `<ds-test>` elements succeeded, but an immediate `--check` failed. The second write moved the closing `body` tag's final `>` onto a new line; the next check passed.
Impact: after a first formatting pass, run the check before assuming the result is stable. A second write resolved this fixture; do not introduce a loop that silently retries forever.
Links: https://github.com/withastro/prettier-plugin-astro

## RE-006: Astro's permissively licensed direct packages pull in copyleft build dependencies  (2026-09-08, status: worked-around)
Environment: Astro 7.3.2, MDX 8.0.1, pnpm 12.3.4, Node 24.18.1, Linux x64.
Observed: `pnpm licenses list --json` found `lightningcss@1.33.0` and `lightningcss-linux-x64-gnu@1.33.0` under MPL-2.0 through `vite@8.2.2`, plus `@img/sharp-libvips-linux-x64@1.3.3` under LGPL-3.0-or-later through optional `sharp@0.35.4`. Confirmed in installed package metadata and Lightning CSS's LICENSE. Lightning CSS is a regular Vite dependency, so disabling a transform does not remove the licensing issue; omitting Sharp alone does not fix it.
Impact: checking only Astro's MIT metadata misses a conflict with D-002. The owner approved named build-only exceptions (D-016); the installed tree and newly locked platform packages still need an audit in M1. Published site assets retain the existing policy.
Links: https://registry.npmjs.org/lightningcss/1.33.0 ; https://registry.npmjs.org/@img/sharp-libvips-linux-x64/1.3.3 ; https://pnpm.io/cli/licenses

## RE-005: Astro's `security.csp` does not hash `is:inline` scripts, and its meta tag lands after them  (2026-09-08, status: worked-around)
Environment: Astro 7.3.2, `security: { csp: true }`, static build; headless Chrome 152 driven over the DevTools protocol.
Repro: a page with an `is:inline` theme script as the first child of `<head>` plus a processed component `<script>`; build; hash every inline script body and compare with the emitted `<meta http-equiv="content-security-policy">`; then serve the same HTML with that policy copied into a `Content-Security-Policy` header.
Observed: the processed component script and Astro's own island hydration scripts are hashed; the `is:inline` script is not. The meta tag is emitted after the `is:inline` script in `<head>`, and a meta policy only governs content parsed after it, so `pnpm preview` and a browser run of the built HTML execute the script with no violation. The same policy sent as a header blocks it ("Executing inline script violates the following Content Security Policy directive 'script-src ...'").
Expected: either a hash for every inline script the build emits, or a warning that `is:inline` scripts are unhashed.
Impact: the theme no-flash snippet passes every local check and fails only in production, exactly the gap RE-004 describes. Work-around: add the snippet's hash through `security.csp.scriptDirective.hashes` (Chrome prints the needed value in the violation message) or ship it as an external blocking `<script src>`; either way, test against a real header before the first deploy (the diagram mechanism spike in architecture.md used a 15-line Node static server that injects the header). Related: the build also warns that Shiki's inline `style` attributes are incompatible with the hashed `style-src`, which matters for the code snippets every service page will carry; that is part of the open question 10 decision.
Links: https://docs.astro.build/en/reference/configuration-reference/#securitycsp

## RE-004: The devstack.fyi vhost on plex sends a CSP that blocks inline scripts  (2026-09-08, status: open)
Environment: nginx 1.31.5 on plex; confirmed by reading `/etc/nginx/sites-available/devstack.fyi` over ssh (first seen over HTTP).
Observed: a server-level `add_header Content-Security-Policy "default-src 'self' data: blob:; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;` with no per-`location` override, so it is inherited by every response. No nonce, hash, or `'unsafe-inline'` in `script-src`.
Expected: an origin with no site on it yet to send no CSP, or one the build controls.
Impact: any inline `<script>` (the theme no-flash snippet, diagram scripts Astro inlines when small, `is:inline` scripts) works in `pnpm preview` and is silently blocked in production; `pnpm preview` does not send the header, so the gap is invisible until deploy. Two nginx facts matter for the fix: a nested block that sets its own `add_header` drops all inherited `add_header` directives (so a future `/_astro/` cache block must re-add CSP), and `frame-ancestors` is ignored in a `<meta>` CSP, so it must stay in the header even if Astro's `security.csp` takes over `script-src`/`style-src`. Resolution is open question 10; options in the plex server check section of architecture.md.
Links: https://docs.astro.build/en/reference/configuration-reference/#securitycsp

## RE-003: Astro's glob() loader does not skip underscore-prefixed directories  (2026-09-08, status: worked-around)
Environment: Astro 7.3.1, `glob({ pattern: '*/content/**/*.mdx', base: './services' })`.
Observed: `services/_template/content/index.mdx` was loaded and rendered as `/_template/`.
Expected: the legacy-collection habit of `_`-prefixed files and folders being ignored.
Impact: a template or draft service leaks into the published site. Work-around: add a negative pattern (`'!_*/**'`); the loader passes negations through as ignores (see `astro/dist/content/loaders/glob.js`). Also note the default entry id keeps the `content/` path segment, so `generateId` is required for clean slugs.
Links: https://docs.astro.build/en/reference/content-loader-reference/

## RE-002: pnpm 12 fails install on unapproved build scripts (esbuild)  (2026-09-08, status: worked-around)
Environment: pnpm 12.3.4 via corepack 0.35.0, Node 24.18.1, adding `astro@7.3.1`.
Observed: `ERR_PNPM_IGNORED_BUILDS ... Ignored build scripts: esbuild@0.28.2` and a non-zero exit. The `pnpm.onlyBuiltDependencies` field in package.json is ignored with a warning (removed in pnpm 11).
Expected: a warning, or the historical prompt.
Impact: every fresh clone, CI job, and agent session hits it. Work-around: an `allowBuilds` map in `pnpm-workspace.yaml` with `esbuild: true` (pnpm writes a placeholder for that key itself). `strictDepBuilds` defaults to true. The Astro build itself works even without the script because esbuild's platform binary arrives as an optional dependency, so the failure is install-time only.
Links: https://pnpm.io/settings/build

## RE-001: `typescript@latest` (7.x) breaks `astro check`  (2026-09-08, status: worked-around)
Environment: `@astrojs/check` 0.9.x with `@astrojs/language-server` 2.16.16, TypeScript 7.0.2 (npm `latest` as of 2026-09-08).
Observed: `astro check` throws "The TypeScript module loaded (found 7.0.2) does not expose the programmatic API that `astro check` relies on. TypeScript's native compiler (7.0 and later) does not ship this API yet."
Expected: a type check.
Impact: `pnpm check` cannot be the standard gate with an unpinned TypeScript. Work-around: pin `typescript` to 6.x (6.0.3 verified; 5.9.3 also works). Track https://github.com/withastro/roadmap/discussions/1321 for when 7.x becomes usable.
Links: https://www.npmjs.com/package/typescript
