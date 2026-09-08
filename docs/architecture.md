# Architecture

> **Status: full draft with toolchain contract (2026-09-08), M0.** Everything below the "Evidence"
> line is a dated record of a check that was actually run; everything above it
> is the shape the M1 scaffold builds to. Shape claims that no check has covered
> yet say "verify in M1". The owner points at the end are the items this draft
> asks the owner to confirm or veto before M1 starts.

The tested version pins, check commands, license exceptions, and delivery
contract are in [toolchain.md](toolchain.md) (D-016). The owner-approved CSP
there supersedes the earlier recommendation in this draft's dated evidence.
Implementation and nginx validation are M1.

## What the system is

A build pipeline with no runtime. Content and code in this repository are
turned into plain files by Astro on the maintainer's Linux machine; the files
are copied to an nginx docroot on plex over ssh; Cloudflare fronts the origin
and caches what the origin's headers allow; the browser gets HTML, CSS, a few
small scripts, and self-hosted fonts, and never talks to a third party.

```
services/<slug>/content/  src/            (this repo)
        │                   │
        ▼                   ▼
   Astro content layer ── astro build ──▶ dist/           pnpm check + pnpm build
                                            │             (also GitHub Actions on PRs)
                                            ▼
                     scripts/deploy.sh: rsync over ssh ──▶ plex:/var/www/devstack.fyi/
                                                              │  nginx: TLS, Cache-Control,
                                                              │  CSP, 404, redirects
                                                              ▼
                                                        Cloudflare zone (honors origin
                                                        cache headers, strict origin TLS)
                                                              │
                                                              ▼
                                                           browser
```

Two properties fall out of that picture and govern every later choice: nothing
exists between the browser and the static files except caches, so every
feature (search, indexes, stale badges) is computed at build time; and the
origin's response headers are the whole freshness and security policy, so the
nginx vhost is part of the architecture even though agents never touch it.

## Fixed points (from decisions)

- **Build output is static files.** Astro builds to `dist/`; nothing in
  `dist/` requires a server process, serverless function, or runtime API.
  In-page JavaScript is allowed for interaction. (D-001)
- **Deploy is rsync over ssh** from a Linux dev machine to
  `plex:/var/www/devstack.fyi/`, run by the human via a script in the repo.
  The site is fronted by Cloudflare. (D-001)
- **Astro + MDX, custom layout, pnpm, TypeScript strict.** Content lives in
  Astro content collections; no docs theme. (D-004)
- **No third-party runtime behavior.** No analytics, telemetry, or cookies,
  and no third-party asset requests: fonts and scripts are self-hosted
  (triage 2026-09-08). (D-005)
- **Every service page carries source citations and a last-verified date**
  as first-class fields, not prose. (D-006)
- **Diagrams are SVG/Astro components,** theme-aware, with interaction as an
  enhancement over a readable static rendering; the mechanism is a vanilla
  custom element per diagram, no island framework. (D-007, D-015)
- **Two content planes per service:** user-facing pages at `/<slug>/` and
  working docs (AGENTS.md, README.md, docs/) that are never rendered. The
  catalog groups services by an offering category. (D-008)
- **Light and dark themes** are both first-class. (D-009)
- **Content model** is hybrid: typed frontmatter plus MDX prose per service,
  one YAML record per product, a fixed category enum. (D-010, D-014)
- **Freshness by TTL, not purge:** short HTML TTL, immutable hashed assets,
  retired assets kept for a grace period. (D-012)
- **Staleness** is derived from `lastVerified` at 180 days; it warns and
  badges, never fails the build. (D-011)

## Repository layout

| Path | Purpose | Lands |
| --- | --- | --- |
| `astro.config.ts` | `site: 'https://devstack.fyi'`, `trailingSlash: 'always'`, default `build.format: 'directory'`, MDX and sitemap integrations, `fonts`, external scripts/CSS, no CSP meta policy (D-016) | M1 |
| `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json` | Toolchain; `pnpm-workspace.yaml` carries the `allowBuilds` map (RE-002); `tsconfig.json` extends `astro/tsconfigs/strict` and defines the `@components/*` and `@lib/*` aliases | M1 |
| `src/content.config.ts` | The three collections from [content-schema.md](content-schema.md) | M1 |
| `src/lib/` | Framework-free TypeScript: `taxonomy.ts` (categories, stale threshold, `isStale`), `urls.ts` (entry id → path, GitHub edit URL), `stale.ts` (the build-time stale pass) | M1 |
| `src/pages/` | Routes: `index.astro` (catalog), `[service]/index.astro`, `[service]/[...page].astro`, `404.astro` | M1 |
| `src/layouts/` | `Base.astro` (document shell) and `Service.astro` (service page frame) | M1 |
| `src/components/` | Catalog, service-page, and shared UI components; `diagrams/` for the SVG component library | M1, M3 |
| `src/styles/` | `tokens.css` (theme tokens, neon palette, motion tokens) and `base.css` | M1 |
| `src/assets/` | Font files and any image Astro processes | M1 |
| `public/` | Copied verbatim: `favicon.svg`, `robots.txt`, and nothing content-hashed | M1 |
| `services/<slug>/` | Working docs beside `content/` (see "Content model"); `services/_template/` is the contributor copy source, never built (RE-003) | M1 template, M2 Cloudflare |
| `scripts/deploy.sh` | Install, build, dry-run rsync, confirm, rsync, retire hashed assets | M1 |
| `deploy/nginx/devstack.fyi.conf` | Reference vhost the owner applies on plex by hand | M1 |
| `.github/workflows/check.yml` | `pnpm check` and `pnpm build` on pull requests; no deploy | M1 |
| `docs/` | Project memory (this file and its siblings) | M0 |

Update the layout table in AGENTS.md when these land (rule 4).

## URLs and routing

- **One directory per service:** `/cloudflare/` → `dist/cloudflare/index.html`.
  Sub-pages nest under it: `/cloudflare/local-dev/`. The directory name in
  `services/` is the URL segment; there is no slug field to drift (D-014).
- **Trailing slash always** with directory output (answered question 5).
  nginx already 301-redirects `/cloudflare` to `/cloudflare/` for an existing
  directory; Astro's `trailingSlash: 'always'` makes the build's own links
  and the sitemap agree with that.
- **Canonical host is the apex.** Every page emits
  `<link rel="canonical" href="https://devstack.fyi/…/">` built from
  `Astro.site`; the www host gets a 301 to the apex in the reference vhost
  (today both hosts serve the same content; plex server check below).
- **404** is `src/pages/404.astro` → `dist/404.html` (verified 2026-09-08
  against the [Astro pages docs](https://docs.astro.build/en/basics/astro-pages/#custom-404-error-page)),
  served by the vhost's `error_page 404 /404.html;` with a 404 status once
  the SPA fallback is removed. There is no 500 page: a static site cannot
  render one at request time.
- **Reserved paths.** `/_astro/` is Astro's content-hashed asset directory
  (scripts, styles, processed images, and fonts under `/_astro/fonts/`); it
  is the only path with an immutable cache TTL. Service directory names
  therefore cannot start with an underscore, which the `!_*/**` loader
  pattern already guarantees (RE-003). `/sitemap-index.xml`, `/sitemap-0.xml`,
  `/robots.txt`, `/404.html`, and `/favicon.svg` are the other non-service
  top-level files.
- **Routes are generated from collections.** `[service]/index.astro` calls
  `getStaticPaths()` over the `services` collection, `[service]/[...page].astro`
  over `pages`. Nothing in `src/pages/` names a service, so adding one adds no
  code (vision success criterion).

## Content model

The contract is [content-schema.md](content-schema.md) (D-010, D-013, D-014);
this section is only what the architecture depends on.

- Three collections load from `services/` with Astro's `glob()` loader and a
  `!_*/**` ignore: `services` (one MDX page per service), `pages` (optional
  MDX sub-pages), `products` (one YAML record per product with its
  tier-by-metric `limits` table). Entry ids are `cloudflare`,
  `cloudflare/local-dev`, `cloudflare/workers`.
- Products belong to a service by id prefix; the service page groups them by
  its own `groups` list and renders them through shared components. The MDX
  body is the service-wide prose and may import diagram components via
  `@components/*`.
- Every entry and every `limits` block has its own `lastVerified` and
  `sources`. The build derives `stale`; nobody authors it.
- Categories are the fixed `CATEGORIES` map in `src/lib/taxonomy.ts`. Adding
  one is a schema edit.

## Rendering: pages, layouts, components

Astro components only; no UI framework runtime (D-015). Every component is
TypeScript-strict in its frontmatter, takes typed props derived from the
collection schemas (`CollectionEntry<'products'>` and friends), and hard-codes
no color (D-009).

**Layouts.**

- `Base.astro` owns the document: `<html lang="en" data-theme>`, `<head>`
  (charset, viewport, title, description, canonical, OpenGraph and Twitter
  card meta, `<link rel="sitemap">`, font preloads from the fonts API, the
  theme no-flash snippet, `tokens.css` and `base.css`), a skip link, the
  header (wordmark, theme toggle, GitHub repository link), a `<main>` slot,
  and the footer (license, GitHub link, "edit this page" when the page passes
  a source path).
- `Service.astro` wraps `Base` for `/<slug>/` and its sub-pages: title block
  with status/stale badge, category chip, the vendor website link, the
  last-verified line, a sub-page list when `pages` has entries for the
  service, the slot for MDX prose, the grouped product sections, and the
  sources list.

**Catalog components** (`index.astro`): `CategorySection` (one per
`CATEGORIES` entry in `order`, skipped when empty), `ServiceCard` (title,
summary, `StatusBadge`, vendor link).

**Service-page components:** `ProductGroup` (heading and summary from the
service's `groups`), `ProductRow` (name linked to `docs`, aliases,
capability, `LocalDevList`, `LimitsTable`, notes, `Sources`, per-product
stale marker), `LimitsTable` (tiers as columns, metrics as rows, `note`
underneath, its own sources and date), `Sources` (the cited list every
entry carries), `StatusBadge` (draft / reviewed / stale; stale wins), and
`LastVerified` (date plus the derived stale state in words).

**Shared UI:** `ThemeToggle`, `CodeBlock` (Astro's built-in fenced-code
rendering wrapped with a `CopyButton`), `ExternalLink` (adds `rel="noopener"`
and the outbound marker), and `SkipLink`.

**Diagrams** live in `src/components/diagrams/` and follow the rules in the
next-but-one section.

Errors of content correctness (a product naming a `group` its service never
declared, a service in an unknown category) throw from the page template and
fail the build; staleness only warns (D-011).

## Theming and design tokens

- **Tokens.** Every color, radius, shadow, motion duration, and font stack is
  a CSS custom property in `src/styles/tokens.css`. The light palette is
  defined on `:root`; the dark palette is defined twice with identical
  values: under `:root[data-theme="dark"]` and under
  `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`.
  `color-scheme` is set alongside so form controls and scrollbars follow.
  Neon accent tokens (`--accent-*`) are what the diagrams and badges use;
  they get a per-theme value each because the same neon that reads on a
  dark ground bleeds on a light one.
- **Three states, two stored.** No stored preference means "follow the
  system"; the toggle writes `light` or `dark` to `localStorage` under one
  key and sets `data-theme` on `<html>`. `localStorage` is not a cookie and
  never leaves the browser (D-005).
- **No flash.** A tiny script as the first child of `<head>` reads the
  stored value and sets `data-theme` before the first paint. It is the only
  script that must run before render. Import it with `?url` and emit an
  external classic blocking script before styles (D-016); this avoids the
  unhashed inline-script trap in RE-005.
- **Motion.** Durations are tokens; `@media (prefers-reduced-motion: reduce)`
  zeroes them at the token level, so components and diagrams inherit the
  behavior without each checking the media query (triage 2026-09-08,
  target M1).
- **Both themes before shipping.** Any visual, including a diagram, is
  checked in light and dark before it lands (D-009).

## Client-side JavaScript

The whole inventory, so a future agent can see when it grows:

| Script | Role | Runs | Ships as |
| --- | --- | --- | --- |
| Theme snippet | Set `data-theme` from storage before paint | Every page | External hashed classic blocking script (D-016) |
| Theme toggle | Flip and store the preference | Every page | Astro component `<script>`, bundled once |
| Copy button | Copy a snippet's text; confirm in the button | Pages with code | Astro component `<script>`, bundled once |
| Diagram elements | Hover/pin/caption/keyboard for `<ds-…>` custom elements | Pages that import a diagram | Per-component `<script>`, bundled once per page (D-015) |
| Search (M4) | Static-index client search | Catalog and service pages | Pagefind or similar, self-hosted from the build |

Rules: no framework runtime, no `client:*` islands (D-015); no script fetches
anything at runtime except the M4 search index from the same origin; every
feature works without its script, degraded (the toggle disappears, the copy
button is absent, the diagram is a static SVG with its captions in the HTML).
Force external scripts with `vite.build.assetsInlineLimit: 0` and external
CSS with `build.inlineStylesheets: 'never'` (D-016). Component scripts ship
as hashed `/_astro/*.js` modules; the theme initializer is the classic
blocking exception.

## Diagrams

Each diagram is one `.astro` file in `src/components/diagrams/`: inline SVG,
a scoped `<style>` using tokens, and a `<script>` that defines one custom
element (`<ds-request-flow>`, `<ds-cache-layers>`, …). Per-instance data
travels through the markup (`data-*` attributes, a `<dl>` of captions), so
two instances on a page share one script and no state. The static rendering
is complete without JavaScript; the script adds hover highlighting, pin on
click/Enter/Space, Escape to clear, focusable nodes with `aria-pressed`, and
respects reduced motion (D-007, D-015). The M3 library adds shared primitives
(node, edge, marker, legend) and a component guide covering page-global SVG
ids and the progressive-enhancement rule. Diagrams are imported into MDX via
`@components/diagrams/<Name>.astro` and given their per-instance data as
props; they never fetch.

## Metadata, discovery, and social

- **Sitemap:** `@astrojs/sitemap`, which needs `site` set and writes
  `sitemap-index.xml` plus numbered files; `Base.astro` links the index and
  `public/robots.txt` names it (verified 2026-09-08 against the
  [integration guide](https://docs.astro.build/en/guides/integrations-guide/sitemap/);
  the package's license is read from its metadata when it is added, D-002).
  The 404 page is excluded (through `filter` if the integration does not
  already skip it; verify in M1).
- **robots.txt** allows everything and points at the sitemap; there is
  nothing to hide on a public static site.
- **OpenGraph and Twitter card** meta on every page from the entry's `title`
  and `summary`; the service page's image is a per-service generated neon
  image in M3, a single site-wide image until then. The generator is a
  build-time step whose rendering dependency needs a license check (D-002).
- **Structured data** is out of scope until a reader need appears.

## Assets, fonts, and images

- **Fonts** are self-hosted through Astro's built-in `fonts` config with the
  local provider, reading files from `src/assets/fonts/`; the build copies
  them to `_astro/fonts/`, so the immutable cache rule covers them, and the
  `<Font />` component emits preloads (verified 2026-09-08 against the
  [fonts guide](https://docs.astro.build/en/guides/fonts/); pin the Astro
  version and confirm the output path in M1). Font files must carry a
  license admitted under D-002; Inter and JetBrains Mono are the candidates
  with OFL-1.1 metadata (toolchain.md). Verify and retain the font licenses in M1.
- **Images** that pages need go through `src/assets/` so Astro hashes and
  optimizes them; `public/` holds only files whose URL must be stable
  (`favicon.svg`, `robots.txt`). Anything in `public/` gets the short TTL,
  so nothing large or frequently changed belongs there (D-012).
- **Code snippets** use `markdown.syntaxHighlight: 'prism'` for fenced MDX
  blocks and theme-aware CSS for token classes (D-016). Avoid Shiki's default
  inline style attributes, which the chosen CSP rejects (RE-005).

## Build, checks, and CI

- `pnpm check` runs `astro check` (TypeScript strict across `.astro` and
  `.ts`) plus Prettier and the dependency-license audit (D-016); no separate
  ESLint stack initially. Do not
  count MDX bodies or their component props as type-checked: the current
  [checker implementation](https://github.com/withastro/language-tools/blob/main/packages/language-server/src/check.ts)
  registers no MDX language plugin (reviewed 2026-09-08). Keep typed logic in
  imported `.ts` or `.astro` files; verify any additional MDX checking in M1
  with an intentional type error. `pnpm build` runs `astro build`, compiling
  MDX and validating collection schemas, followed by a CSP output check.
  These two commands are the gate for
  every change (workflow.md) and the checks GitHub Actions runs on pull requests.
- **The stale pass** runs inside the build: the catalog page walks every
  entry and `limits` block once, prints one `[stale] <kind> <id>` line per
  stale item, and the badge components call the same `isStale`. Warnings
  never fail the build (D-011).
- **Correctness errors fail the build**: schema violations (from the
  collection loader, with file and field), undeclared groups or categories
  (from templates), broken internal links if a checker is adopted. External
  link checking is a separate script (M5), never part of `pnpm build`.
- **Reproducible installs:** `pnpm install --frozen-lockfile` everywhere,
  including inside the deploy script; TypeScript pinned to 6.x until
  `astro check` supports 7 (RE-001); build scripts approved in
  `pnpm-workspace.yaml` (RE-002).
- **Preview is not production.** `pnpm preview` sends none of plex's
  headers; before the first deploy and after any CSP or cache change, the
  built output is served locally under the reference vhost's headers (the
  diagram mechanism spike used a 15-line Node static server for this; the
  run notes must say how).

## Hosting: plex and Cloudflare

- **nginx on plex** serves `/var/www/devstack.fyi/` for `devstack.fyi` and
  `www.devstack.fyi` with a certbot certificate and an HTTP → HTTPS redirect
  (plex server check below). The docroot is owned by the deploy user and
  holds nothing the build does not own (answered question 9).
- **The reference vhost** in `deploy/nginx/devstack.fyi.conf` is the version
  of that config the site needs. The owner applies it by hand; agents never
  change plex. It differs from today's vhost in five places:
  1. `try_files $uri $uri/ =404;` and `error_page 404 /404.html;` instead of
     the SPA fallback to `/index.html`.
  2. `location ^~ /_astro/ { expires off; add_header Cache-Control "public,
     max-age=31536000, immutable"; … }`, re-adding the CSP header inside the
     block because a nested `add_header` drops inherited ones.
  3. An explicit short TTL for HTML and for the unhashed `public/` files
     (today HTML gets `no-cache`; D-012 says a short `max-age`; the toolchain
     contract sets five minutes with `must-revalidate`, D-016).
  4. A 301 from `www.devstack.fyi` to the apex.
  5. The full static CSP from toolchain.md, including `frame-ancestors`;
     scripts and styles are external and no Astro CSP meta policy is used
     (question 10 answered, D-016).
- **Cloudflare** proxies the zone, honors origin cache headers, and uses
  strict origin TLS (owner, 2026-09-08). The origin's `Cache-Control` is
  therefore the edge policy too; nothing in the deploy talks to the
  Cloudflare API (D-012). The site is itself an instance of the
  service-wide Cloudflare notes it will publish.

## Caching and deploy

**Cache policy (D-012).** Three classes of response, set by the vhost:

| Response | `Cache-Control` | Why |
| --- | --- | --- |
| `/_astro/**` (hashed scripts, styles, images, fonts) | `public, max-age=31536000, immutable` | The URL changes when the content does |
| Successful HTML and directory indexes | `public, max-age=300, must-revalidate` | Bounds cached-page freshness |
| 404 responses, including missing assets | `no-store` | Avoids caching missing content |
| Everything else (`robots.txt`, `favicon.svg`, sitemaps) | same short TTL as HTML | Unhashed URLs that change in place |

Apply immutable caching only to successful asset responses; missing assets
use the custom 404 policy. D-016 and toolchain.md define the full reference
vhost and the M1 routing/header checks.

Cloudflare does not cache HTML by default and would apply a two-hour default
edge TTL to un-headed CSS, JS, and fonts, which is why every class gets an
explicit header.

**Deploy script (`scripts/deploy.sh`).** Run by the human from a clean
checkout on Linux; agents never run it. Steps, each of which stops the script
on failure:

1. Refuse to run with a dirty working tree unless `--allow-dirty` is given;
   print the commit being deployed.
2. `pnpm install --frozen-lockfile`, then `pnpm check`, then `pnpm build`.
   Never publish output from a failed build.
3. `rsync -az --delete --dry-run --itemize-changes dist/ plex:/var/www/devstack.fyi/`
   with the protect filter below, and show the summary (files added, changed,
   deleted), plus the proposed ledger changes and expired-asset deletions
   from step 5, computed without mutating the server. `--dry-run` as a script
   flag stops here. A connection failure
   fails loudly with a pointer to the `Host plex` requirement (see below).
4. Prompt for confirmation (`--yes` skips it), then upload the new asset set
   before running the rest of the rsync without `--dry-run`. Hold a remote
   site-specific lock across inventory, transfers, and cleanup; recheck the
   preview snapshot before mutation (D-016).
5. Retire hashed assets only after rsync succeeds. First drop from the ledger
   every path present in the new `dist/`, so a rollback cannot delete an
   active asset using its old retirement date. List `_astro/**` files on the
   server that the new `dist/` no longer contains; record each newly retired
   path with the remote UTC epoch timestamp, retaining existing retirement
   times. Delete only
   expired paths that are still absent from the new `dist/`, then drop those
   paths from the ledger after successful deletion. The ledger lives in the deploy
   user's home on plex, outside the docroot, so it is neither served nor in
   the repository. The protect filter in steps 3 and 4 is
   `--filter='protect /_astro/**'` so `--delete` never removes a hashed asset
   itself; only step 5 does, by date.

The grace period starts at retirement, not at the file's mtime, which is why
a ledger is needed (D-012). D-016 sets seven full days (604800 seconds).
Save ledger updates atomically, reject unsafe paths and symlinks, and stop
cleanup on a malformed ledger. Missing state restarts the grace clock. See
toolchain.md for failure, rollback, dry-run, and local-fixture requirements.

**ssh dependency.** The script uses the bare `plex` alias, which depends on a
`Host plex` entry in the maintainer's `~/.ssh/config` (host
`plex.meenan.us`, port 10022, an authorized key). The script's dry run
checks `ssh -G plex` resolves and that a trivial remote command succeeds
before building, so a fresh machine fails in seconds, not after a build.

## Security headers

The owner-approved policy is a full static nginx header with external
hashed scripts and CSS, a parser-blocking external theme initializer, and
Prism class-based highlighting; no Astro CSP meta policy. This avoids
RE-005's unhashed inline snippet and meta-order trap while preserving strict
script/style policy. The header text, Astro settings, and output checks are
in [toolchain.md](toolchain.md). Question 10 was answered on 2026-09-08.
M1 writes and tests the reference vhost; the owner performs the sudo install,
configuration test, and reload on plex.

## Contribution surface

- **Edit links.** Every rendered entry carries a link to its source on
  GitHub: the service page to `services/<slug>/content/index.mdx`, a
  sub-page to its `index.mdx`, and each product row to its
  `products/<product>.yaml`, built by `src/lib/urls.ts` from the entry's
  `filePath` and the repository URL. One-file-per-product exists so those
  links point at something small (D-014).
- **Pull-request checks.** GitHub Actions runs `pnpm check` and `pnpm build`
  on every PR with the pinned Node and pnpm versions (M1). No deploy from
  CI; the human deploys (D-003).
- **Template.** `services/_template/` holds the fictional example from
  content-schema.md for contributors to copy; the `!_*/**` pattern keeps it
  out of the build.
- **CONTRIBUTING.md and a PR template** land in M5, earlier if outside PRs
  arrive.

## Accessibility

Semantic landmarks (`header`, `nav`, `main`, `footer`), a skip link, one
`h1` per page, real `<table>` markup for product and limits tables with
scoped headers, focus styles that pass on both themes, text contrast checked
per theme (neon accents are for emphasis and diagram strokes, never for body
text), diagram nodes focusable with visible focus and `aria-pressed`, captions
in the DOM rather than only in tooltips, reduced motion honored through the
tokens. The M3 identity polish includes an accessibility pass over both
themes; M1 ships the structure that makes the pass tractable.

## Extension points

What a change costs, so future work can tell shell changes from content
changes:

| Change | Touches | Shell change? |
| --- | --- | --- |
| Add a product | one YAML file, maybe one `groups` line | no |
| Add a sub-page | one `index.mdx` under the service | no |
| Add a service | one directory under `services/` | no |
| Add a category | `CATEGORIES` in `src/lib/taxonomy.ts` | yes, one line (D-010) |
| Add a diagram | one `.astro` file in `components/diagrams/` | yes, component only |
| Change a required schema field | `content.config.ts` and every service | yes, load-bearing (workflow.md) |
| Change a URL rule or the deploy script | `astro.config.ts`, `deploy.sh`, the reference vhost | yes, load-bearing |
| Add a UI framework | `package.json`, an island | no: needs a new decision (D-015) |

## Deferred by design

Client-side search (M4, static index, self-hosted), the cross-service
capability index (M4, needs a `capabilityId` on products; content-schema.md
open points), generated OpenGraph images (M3), the diagram primitive library
(M3), and the external link checker (M5) all fit the picture above without
changing it: each is a build-time step or a component, none needs a server.

## Open points for the owner

- **Co-located layout** (`services/<slug>/{AGENTS.md,README.md,docs/,content/}`)
  is treated as settled by the spike; features.md left the owner a veto in
  this draft. Silence is a yes.
- **Deploy-script ergonomics:** confirmation prompt by default with `--yes`
  to skip, refusing a dirty tree by default, and a ledger in the plex home
  directory for retired assets. Alternatives (fresh-directory swap behind a
  symlinked docroot) need write access to `/var/www` and an nginx change, so
  the ledger is proposed.
- **The five vhost changes** listed under "Hosting" are the owner's to
  apply; toolchain.md defines the contract and M1 produces the reference
  file for review.

---

## Evidence: dated checks that the shape above rests on

The three sections below are the records of the M0 checks, kept verbatim
because plan.md, features.md, decisions.md, and rough-edges.md refer to them
by heading. Versions and numbers are as observed on the date given.

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
  (local nginx or a devtools override) before the first deploy. The diagram mechanism spike below replayed each
  build under the real header: the current header breaks both inlined
  scripts and island hydration. For the chosen mechanism, (a) allows the
  processed diagram script, with the theme snippet's hash added to Astro's
  policy (RE-005); (b) requires both the diagram script and the theme snippet
  to be external. Adding a hash only to Astro's meta policy cannot override
  the unchanged nginx header in (b)
  ([multiple-policy enforcement](https://www.w3.org/TR/CSP3/#multiple-policies)).
- **ssh / deploy route.** plex's sshd listens on **10022 only** (port 22 is
  refused). The owner's `~/.ssh/config` maps `Host plex` →
  `plex.meenan.us:10022`, and the dev key is now authorized, so a bare
  `ssh plex` / `rsync … plex:` works. The deploy script may therefore use the
  bare `plex` alias, but its dependency on that `~/.ssh/config` entry (host,
  port 10022, an authorized key) must be documented so a fresh checkout on a
  new machine does not silently fail; have the dry run fail loudly on a
  connection error.

## Diagram mechanism spike (2026-09-08)

Verified with a second throwaway build in the session scratchpad (Astro
7.3.2, `@astrojs/mdx` 8.0.1, `@astrojs/preact` 6.0.5, Preact 10.29.8, all
MIT per their npm metadata; TypeScript pinned to 6.0.3 per RE-001), driven
in headless Chrome 152 over the DevTools protocol, so the numbers and the
click tests are observations, not estimates. The question was whether
richer diagram state justifies an island framework (open question 3). The
same diagram was built twice: a request-flow SVG with hover highlighting of
a node and its edges, click/Enter/Space to pin a node and show its caption,
Escape to clear, keyboard focus on every node, `aria-pressed` state, and a
`prefers-reduced-motion` guard: the interaction level D-007 asks for.

- **Vanilla custom element** (`<ds-diagram>` wrapping the SVG, a `<dl>` of
  captions rendered in the HTML, a `<script>` defining the element in the
  same `.astro` file). Two instances on one page produced 9,941 B of HTML
  (2,846 B gzipped) and **zero JavaScript requests**: Astro bundled the
  script once (1,247 B minified) and inlined it, `connectedCallback` ran per
  instance, and clicking a node in the first instance left the second
  untouched. Per-instance data reached the script through the markup itself
  (`data-*` attributes and the rendered captions), the pattern the
  [Astro scripts guide](https://docs.astro.build/en/guides/client-side-scripts/)
  recommends for reusable components. The same component imported into an
  MDX page via the `@components/*` alias behaved identically.
- **Preact islands** (`client:visible`, the same markup as a `.tsx`
  component). Two instances produced 12,808 B of HTML (4,310 B gzipped; the
  props are serialized into each `<astro-island>`) plus five JavaScript
  files totalling 25.6 kB raw / 11.1 kB gzipped (Preact 4.4 kB, signals
  3.0 kB, hooks 1.2 kB, Astro's client renderer 1.4 kB, the component
  1.0 kB). Interaction was equivalent once hydrated. The SVG is
  server-rendered, so it is readable before hydration.
- **Verdict.** The vanilla path costs nothing per page beyond the diagram's
  own script, and the hover/pin/caption state these diagrams need is a few
  fields on the element. An island framework buys a rendering model, not a
  capability, at about 11 kB gzipped and five requests on every page that
  carries a diagram. D-015 adopts the custom-element path and names the
  condition for adding an island later.
- **Inlining is a switch, not a property of the approach.** With
  `vite.build.assetsInlineLimit: 0` the same component's script became an
  external module
  (`/_astro/Diagram.astro_astro_type_script_index_0_lang.<hash>.js`) and its
  scoped `<style>` an external stylesheet; the page still worked. The
  default limit (4 kB) inlines small scripts, so a page with a couple of
  diagrams ships their behavior inside the HTML.
- **CSP, measured against real headers** (feeds open question 10; RE-004,
  RE-005). With `security: { csp: true }` Astro hashed the processed
  component script and its own island hydration scripts, but **not** the
  `is:inline` theme snippet, which also sits *before* the emitted `<meta>`
  policy and therefore runs unchallenged in every local check. A 15-line
  Node static server then replayed each build under a header:
  - plex's current header (`script-src 'self' 'wasm-unsafe-eval'`) blocked
    the inlined vanilla script *and* the island hydration scripts (the
    islands never hydrated); only the external-script build kept working.
  - Astro's own policy sent as a header let both the inlined vanilla script
    and the islands work; only the theme snippet was blocked.
  - In every case the theme snippet was blocked, and Chrome's violation
    message prints the hash the policy needs.

  So option (a) from the plex server check is confirmed feasible for the
  chosen mechanism, with one addition: the theme snippet's hash goes in
  `security.csp.scriptDirective.hashes`, or the snippet becomes an external
  blocking script. The build also warns that Shiki's inline `style`
  attributes conflict with a hashed `style-src`; the code-snippet
  highlighter choice therefore belongs with the CSP decision in the
  toolchain item.
- **Authoring notes for the M3 component guide.** SVG `<marker>` and
  gradient ids are page-global, so shared definitions must be namespaced or
  hoisted once per page; SVG elements have no `.click()` method, which
  matters for tests; the custom element updates the DOM synchronously on a
  click, whereas a framework island renders asynchronously.

## Architecture question status

Questions 1–10 are answered (features.md). The owner approved the full nginx
CSP with external scripts/CSS and Prism highlighting on 2026-09-08 (D-016).
The dated evidence above preserves the earlier alternatives; toolchain.md is
the implementation contract. The two technical questions from the
content-layer spike (diagrams in MDX without a framework runtime; excluding
working docs) are also answered. M1 still implements and validates the shell
and reference vhost; only the owner changes plex.
