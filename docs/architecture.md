# Architecture

> **Status: skeleton.** The first full draft is an M0 exit criterion; what is
> written here now is the load-bearing shape already settled, so drafting can
> build on it rather than re-derive it.

## Fixed points (from decisions)

- **Build output is static files.** Astro builds to `dist/`; nothing in
  `dist/` requires a server process, serverless function, or runtime API.
  In-page JavaScript is allowed for interaction. (D-001)
- **Deploy is rsync over ssh** from a Linux dev machine to
  `plex:/var/www/devstack.fyi/`, run by the human via a script in the repo.
  The site is fronted by Cloudflare. (D-001)
- **Astro + MDX, custom layout, pnpm, TypeScript strict.** Content lives in
  Astro content collections; no docs theme. (D-004)
- **No third-party runtime behavior.** No analytics, telemetry, or cookies.
  (D-005)
- **Every service page carries source citations and a last-verified date**
  as first-class fields, not prose. (D-006)
- **Diagrams are SVG/Astro components,** theme-aware, with interaction as an
  enhancement over a readable static rendering. (D-007)
- **Two content planes per service:** user-facing pages at `/<slug>/` and
  working docs (AGENTS.md, README.md, docs/) that are never rendered. The
  catalog groups services by an offering category. (D-008)
- **Light and dark themes** are both first-class. (D-009)

## Expected shape (to be validated in the M0 draft)

The 2026-09-08 feature triage settled the scope these bullets lean on
(D-010 content model, D-011 stale policy, D-012 cache policy); what remains
to validate is the mechanism, not the intent.

- **Repository layout (candidate):**

  | Path | Purpose |
  | --- | --- |
  | `src/pages/` | Landing catalog, `[service]/` routes, 404 |
  | `src/layouts/` | Site shell (header, theme toggle, footer with GitHub links) |
  | `src/components/` | UI pieces; `diagrams/` for the SVG component library |
  | `src/styles/` | Design tokens (colors per theme, neon accents), base styles |
  | `src/content.config.ts` | Collection definitions and schemas |
  | `services/<slug>/` | Per-service working docs (`AGENTS.md`, `README.md`, `docs/`) beside the rendered content in `content/`: `index.mdx` (the service page), `products/*.yaml` (one record per product), optional `<page>/index.mdx` sub-pages (open question 2, answered by the spike below; layout in [content-schema.md](content-schema.md)) |
  | `scripts/deploy.sh` | Build + rsync to plex |
  | `public/` | Static assets copied verbatim (favicons, robots.txt) |

- **Content model (D-010, hybrid; drafted in
  [content-schema.md](content-schema.md), D-014).** Three collections loaded
  from `services/`: `services` (frontmatter `title`, `website`, `category`,
  `summary`, `status` draft/reviewed, `groups`, `sources[]`, `lastVerified`;
  the MDX body is the service-wide prose), `pages` (optional sub-pages), and
  `products` (one YAML record per product: `name`, `aliases`, `group`,
  `docs`, `capability`, `localDev[]`, `limits`, `sources`, `lastVerified`).
  The `limits` sub-record is a tier-by-metric table with its own source and
  date (D-013). The directory name is the slug; "stale" is derived, never
  authored. Stale flagging (D-011) compares every `lastVerified` against a
  180-day threshold at build time, warns, and drives the badge.
- **Categories.** A fixed enum in the schema (D-010) with a display name and
  sort order per value. Initial values: Cloud Providers (and CDN), Databases,
  Event Buses and Queues.
- **Theming.** CSS custom properties for every color; `data-theme` on
  `<html>` set by a tiny inline script before first paint from
  `localStorage` falling back to `prefers-color-scheme`; a toggle in the
  header. Diagram components consume the same tokens so they invert cleanly.
- **Diagrams.** Astro components emitting inline SVG with a shared neon
  palette; hover/click behavior via a small vanilla `<script>` unless open
  question 3 lands on an island framework. Static rendering must be readable
  without JavaScript.
- **Deploy script.** `pnpm install --frozen-lockfile`, `pnpm build`, then
  `rsync -az --delete dist/ plex:/var/www/devstack.fyi/`, with a dry-run
  first. No Cloudflare purge step (D-012). Stop before rsync if installation
  or the build fails; never publish stale or partial output from a failed
  build. Cache policy per D-012: long immutable TTLs only for content-hashed
  asset URLs; short TTL for HTML and for files copied unchanged from
  `public/`; previous deploys' hashed assets are protected from `--delete`
  for a grace period so cached HTML keeps resolving. The
  `Cache-Control` headers are set in the nginx vhost config for
  devstack.fyi on plex, applied by the owner from a reference block kept in
  the repo (plex server check below). The devstack.fyi Cloudflare zone honors origin cache headers
  and uses strict origin TLS (owner, 2026-09-08), so origin headers are the
  whole cache policy. `public/` copy behavior verified 2026-09-08 against the
  official
  [Astro project structure docs](https://docs.astro.build/en/basics/project-structure/#public).
- **URLs.** One directory per service (`/cloudflare/index.html`), with
  sub-pages allowed under it (`/cloudflare/local-dev/`). Trailing-slash
  policy: `trailingSlash: 'always'` with the default `build.format:
  'directory'`, matching nginx's directory redirect (plex server check
  below; answered question 5).
- **Contribution surface.** "Edit this page" links point at the MDX source
  on GitHub; GitHub Actions runs `pnpm check` and `pnpm build` on pull
  requests (no deploy).

## Content-layer spike (2026-09-08)

Verified by building a throwaway project in the session scratchpad, not from
training knowledge. Versions: the spike ran Astro 7.3.1 and `@astrojs/mdx`
8.0.0; the npm registry showed Astro 7.3.2 and `@astrojs/mdx` 8.0.1 as
latest the same day (both MIT). Astro requires Node 22.12 or newer (package
`engines`; confirmed by the
[v6 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v6/), which
dropped Node 18 and 20). Astro 6.0 (2026-03-10) removed the legacy
`src/content/` collections: every collection now needs a `loader`, config
lives in `src/content.config.ts`, and MDX is rendered with `render(entry)`
imported from `astro:content`
([content collections guide](https://docs.astro.build/en/guides/content-collections/)).
Astro 7.0 (2026-06-22) switched the default Markdown processor for `.md`
*and* `.mdx` to Sätteri; the remark/rehype pipeline is opt-in via
`@astrojs/markdown-remark` (an optional peer dependency) and
`markdown.processor: unified()`
([v7 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v7/),
[Markdown guide](https://docs.astro.build/en/guides/markdown-content/)).
The spike used the default and needed no remark plugins; revisit only if a
diagram or table feature demands a rehype plugin.

**Co-located layout works.** A `services` collection defined as
`glob({ pattern: ['*/content/**/*.mdx', '!_*/**'], base: './services' })`
loaded `services/cloudflare/content/index.mdx` and
`services/cloudflare/content/local-dev/index.mdx` with `base` pointing at a
top-level directory outside `src/`, and the build produced
`/cloudflare/index.html` and `/cloudflare/local-dev/index.html`. The working
docs (`services/cloudflare/AGENTS.md`, `services/cloudflare/docs/*.md`) never
reached `dist/` because the pattern only matches under `content/`. Two
details the docs do not spell out
([loader reference](https://docs.astro.build/en/reference/content-loader-reference/)):
the default entry id includes the `content/` segment (`cloudflare/content`),
so the collection needs a `generateId` that maps
`<slug>/content/<path>/index.mdx` to `<slug>/<path>`; and an
underscore-prefixed directory such as `services/_template/` is **not**
skipped automatically (the spike rendered `/_template/` until the `!_*/**`
negative pattern was added; the loader passes negative patterns through as
ignores).

**Diagram components in MDX ship no framework.** The MDX body imported an
Astro component (`import Diagram from '../../../src/components/Diagram.astro'`)
that emits inline SVG plus a vanilla `<script>`; the output was three HTML
files and zero `.js` files, with the script inlined as a `<script
type="module">` in the page. This answers the "framework runtime" half of
open question 3: the vanilla-script path adds no framework runtime, but the
interaction script still contributes HTML bytes and browser execution work.
Zero external `.js` files is a result of this small spike, not a guarantee:
[Astro automatically inlines sufficiently small scripts](https://docs.astro.build/en/guides/client-side-scripts/#script-processing),
and larger scripts can produce separate assets. The
relative import path is the authoring wart; a tsconfig `paths` alias
(`@components/*` → `src/components/*`) was verified to work inside MDX with
both `astro build` and `astro check`, so contributors write
`import Diagram from '@components/Diagram.astro'`.

**Schema draft (same day, same toolchain).** The spike project was extended
to verify the three-collection schema in
[content-schema.md](content-schema.md): YAML product records via `glob()`,
zod 4 (`astro/zod`; the `astro:content` `z` export is deprecated in Astro 7
and removed in 8), a clean `astro check`, and build failures with
field-level messages for bad records. Details in that doc.

**Toolchain findings that will bite in M1** (details in
[rough-edges.md](rough-edges.md)): `typescript@latest` now resolves to
7.0.2, whose native compiler lacks the API `astro check` needs, so
TypeScript must be pinned to 6.x (6.0.3 passed `astro check` with 0 errors;
5.9.3 also works). pnpm 12.3.4 (via corepack 0.35.0) refuses to install
esbuild's postinstall script unless `allowBuilds` in `pnpm-workspace.yaml`
approves it; `strictDepBuilds` defaults to true, and the old
`onlyBuiltDependencies` key was removed in pnpm 11
([pnpm build settings](https://pnpm.io/settings/build)).

## Plex server check (2026-09-08)

ssh into plex confirmed the filesystem and the nginx config directly (host
`plex.meenan.us`, ssh on port 10022, reached via the `Host plex` entry the
owner added to the dev machine's `~/.ssh/config`; earlier HTTP-only probing
is now superseded by the source config below). plex runs Ubuntu (kernel 7.0)
with nginx 1.31.5. The vhost is
`/etc/nginx/sites-available/devstack.fyi`, symlinked into `sites-enabled/`;
its verbatim contents drive the findings here.

- **Docroot is empty and owned by the deploy user (open question 9:
  answered).** `/var/www/devstack.fyi/` contains only `.`/`..`, owned
  `pmeenan:pmeenan`, mode 775. Nothing the build does not own lives there, so
  `rsync -az --delete dist/ plex:/var/www/devstack.fyi/` fully owns the
  directory and needs no protect filter for pre-existing files (the D-012
  hashed-asset grace filter is a separate concern about superseded deploys).
- **TLS, hosts, and HTTP redirect.** One `server` block on `listen 443 ssl`
  serves both `devstack.fyi` and `www.devstack.fyi` with a certbot-managed
  Let's Encrypt cert (`/etc/letsencrypt/live/devstack.fyi/`). A second block
  on `listen 80` 301-redirects both hosts to `https://$host$request_uri`
  (preserving host) and otherwise returns 404. **www is not redirected to the
  apex** — both hosts serve the same content. Recommend adding an apex
  canonical redirect (nginx `if ($host = www.devstack.fyi) { return 301
  https://devstack.fyi$request_uri; }` or a Cloudflare rule); M1 canonical URLs
  use the apex regardless.
- **Routing is currently an SPA fallback — must change for a static
  multipage site.** The vhost has `location / { try_files $uri $uri/
  /index.html; }`. With Astro's per-directory output this serves the home
  page with a 200 for every unknown URL once `index.html` exists, which
  defeats a real 404. For an existing directory, `/cloudflare` (no slash)
  still gets nginx’s **301 redirect** to `/cloudflare/`: the trailing slash
  in `try_files $uri/` marks a directory test, not a slash appended to the
  request URI. Verified against nginx’s
  [try-files source](https://github.com/nginx/nginx/blob/master/src/http/modules/ngx_http_try_files_module.c)
  and [static handler](https://github.com/nginx/nginx/blob/master/src/http/modules/ngx_http_static_module.c)
  (2026-09-08); the empty origin cannot exercise an existing service directory. **Owner change for
  M1:** `try_files $uri $uri/ =404;` plus `error_page 404 /404.html;` so
  unknown paths return the built 404 page with a 404 status. (Today every
  path 404s only because the docroot is empty and the fallback file is
  missing.)
- **URL policy (open question 5: answered).** Keep the default
  `build.format: 'directory'` and set `trailingSlash: 'always'` (the pairing
  the
  [Astro configuration reference](https://docs.astro.build/en/reference/configuration-reference/)
  recommends), so the build uses canonical `/cloudflare/` URLs. nginx
  redirects requests for existing directories to the trailing-slash URL
  under both the current and proposed `try_files` rules; verify this with
  populated output in M1.
- **Cache-Control (D-012): HTML handled, `/_astro/` rule missing.** The vhost
  sets `location ~* \.(html|htm)$ { expires -1; }`, which emits
  `Cache-Control: no-cache` and a past `Expires` — HTML revalidates on every
  load. D-012 currently specifies a short `max-age` instead. The M0
  toolchain decision must either implement that TTL or explicitly amend
  D-012 to retain revalidation; the existing server config does not settle
  that choice.
  **What is missing:** no `location` gives Astro's content-hashed
  `/_astro/` assets the `public, max-age=31536000, immutable` D-012 requires,
  and non-HTML `public/` files (robots.txt, favicons, OG images) get no
  explicit header either. **Owner change for M1:** add
  `location ^~ /_astro/ { expires off; add_header Cache-Control "public,
  max-age=31536000, immutable"; }` and a short-TTL rule for the other static
  files. Use `expires off` so only the explicit header sets the TTL:
  [`expires max`](https://nginx.org/en/docs/http/ngx_http_headers_module.html#expires)
  would add a second `Cache-Control` with a ten-year `max-age`, conflicting
  with the one-year value (verified 2026-09-08). **nginx gotcha:** a nested block that sets its own `add_header`
  drops all inherited `add_header` directives in that block, so the `/_astro/`
  block must re-add the CSP header (below) or knowingly omit it (harmless on
  a JS/CSS response). The repo will carry the full reference vhost (planned
  `deploy/nginx/devstack.fyi.conf`, M1) for review; agents never touch plex.
- **Strict CSP header confirmed from source (open question 10; RE-004).** The
  443 block has, at server level with `always`:
  `default-src 'self' data: blob:; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`.
  No `location` overrides it with its own `add_header`, so it applies to
  every response, HTML included. `script-src` carries no `'unsafe-inline'`,
  nonce, or hash, so every inline `<script>` is blocked: the theme no-flash
  snippet, diagram scripts Astro inlines when small (the spike inlined all of
  its script), and any `is:inline` script. Inline styles are allowed
  (`style-src 'unsafe-inline'`). Astro 6+ has stable
  [CSP support](https://docs.astro.build/en/reference/configuration-reference/#securitycsp)
  (`security.csp`) that emits a `<meta http-equiv="content-security-policy">`
  with per-build hashes for the scripts/styles it processes, but a meta
  policy cannot loosen a header policy (the browser enforces the intersection)
  and `frame-ancestors` is ignored in meta policies. Options for the toolchain
  decision: (a) the owner keeps `frame-ancestors` in the nginx header,
  optionally retaining `base-uri`, `form-action`, and `object-src` there too,
  and removes the header’s overlapping fetch directives (including
  `default-src`). Of these retained directives, only `frame-ancestors` is
  unsupported in meta ([CSP specification](https://www.w3.org/TR/CSP3/#meta-element)).
  Astro's `security.csp` supplies the hashed
  `script-src`/`style-src` plus the rest via `directives`; (b) keep the
  header and ship every script as an external file (Vite's
  `build.assetsInlineLimit`, default 4 kB, governs inlining; verify with `0`
  in M1) with the no-flash theme script as a blocking external
  `<script src>`; (c) the owner adds `'unsafe-inline'` to `script-src`
  (weakest). Recommendation: (a). Whichever lands, `pnpm preview` does not
  send this header, so the run notes must say to test against the real header
  (local nginx or a devtools override) before the first deploy.
- **ssh / deploy route.** plex's sshd listens on **10022 only** (port 22 is
  refused). The owner's `~/.ssh/config` maps `Host plex` →
  `plex.meenan.us:10022`, and the dev key is now authorized, so a bare
  `ssh plex` / `rsync … plex:` works. The deploy script may therefore use the
  bare `plex` alias, but its dependency on that `~/.ssh/config` entry (host,
  port 10022, an authorized key) must be documented so a fresh checkout on a
  new machine does not silently fail; have the dry run fail loudly on a
  connection error.

## Open architecture questions

See the question list in [features.md](features.md#open-questions);
questions 3 and 10 are the architecture-blocking ones still open (question 1
was answered by D-010, question 2 by the content-layer spike above,
questions 5 and 9 by the plex server check above). The two
purely technical questions that rode along with the spike (diagram components
in MDX without a framework runtime; keeping working docs out of the build)
are answered in that section.
