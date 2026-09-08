# Feature matrix

The scope ledger for the M0 planning conversations. Three tiers:

- **Confirmed** — stated project scope. Milestone assignment happens in
  [plan.md](plan.md) as the plan firms up; the milestone in a row's notes records
  the triage-time target; plan.md now supplies the scoped work and exit criteria.
- **Proposed** — candidate additions awaiting a yes/no from the project owner.
- **Open questions** — things that shape architecture and need an answer
  during M0.

The owner walked every `proposed` row and the triage-bound open questions on
2026-09-08. Rows promoted or rejected then say so in their notes; rejected
rows stay in the table so nobody re-proposes them without new information.

Status legend: `confirmed` · `proposed` · `rejected (D-NNN or triage date)`

## Site shell

| Feature                                                               | Status    | Notes                                                                                                                                                               |
| --------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Static site generation, no server process; in-page JS allowed         | confirmed | D-001. Output is plain files served from `/var/www/devstack.fyi/`.                                                                                                  |
| Astro + MDX with a custom layout (no docs theme)                      | confirmed | D-004. Content in Astro content collections.                                                                                                                        |
| Light and dark themes                                                 | confirmed | D-009. Default follows `prefers-color-scheme`; toggle persisted in `localStorage`; no flash of wrong theme.                                                         |
| Modern-tech, lighthearted visual identity with neon accents           | confirmed | D-009. Applies to diagrams, catalog cards, and page chrome. M1.2 iterates representative light/dark views with the owner until an accepted style guide is recorded. |
| Catalog landing page grouped by offering category                     | confirmed | D-008. Categories are a fixed enum (D-010); initial list under answered question 4 below.                                                                           |
| One dedicated path per service (`/cloudflare/` first)                 | confirmed | D-008.                                                                                                                                                              |
| GitHub links on every page (repo home, edit this page)                | confirmed | Stated with the "lean process + github links" contribution model.                                                                                                   |
| 404 page                                                              | confirmed | Triage 2026-09-08, target M1. Static `404.html`; web servers serve it by convention.                                                                                |
| Client-side search (Pagefind or similar static index)                 | confirmed | Triage 2026-09-08, target M4 (after 3+ services). Fully static, no server. Verify the tool's license from its package metadata when adopted (D-002).                |
| Sitemap, robots.txt, canonical URLs, OpenGraph metadata               | confirmed | Triage 2026-09-08, target M1. Astro has first-party sitemap support.                                                                                                |
| Generated OpenGraph images in the neon style                          | confirmed | Triage 2026-09-08, target M3. Built at build time from a template; the image-rendering dependency needs a license check (D-002).                                    |
| Self-host all assets (fonts, scripts); no CDN or third-party requests | confirmed | Triage 2026-09-08, target M1. Keeps D-005 trivially true and removes an availability dependency. Font files must carry a permissive license (D-002).                |
| Respect `prefers-reduced-motion` in diagrams and transitions          | confirmed | Triage 2026-09-08, target M1 (tokens) and M3 (diagram library).                                                                                                     |
| Copy-to-clipboard on config and command snippets                      | confirmed | Triage 2026-09-08, target M1. Small in-page JS, no dependency.                                                                                                      |

## Service content

| Feature                                                                                                    | Status                       | Notes                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product/feature name → capability map per service                                                          | confirmed                    | The core of each service page.                                                                                                                                                                          |
| Local-development equivalent per capability                                                                | confirmed                    | Emulator, open-source stand-in, vendor dev mode, or "mock it".                                                                                                                                          |
| Service-wide notes (e.g. Cloudflare strict origin TLS, cache rules for standards-compliant origin caching) | confirmed                    | Human-reviewed, opinionated guidance. Free MDX prose (D-010).                                                                                                                                           |
| Cloudflare as the first documented service                                                                 | confirmed                    | Product coverage list under answered question 8 below.                                                                                                                                                  |
| Every service page cites official sources and carries a last-verified date                                 | confirmed                    | D-006. Agents research from current vendor docs; owner reviews.                                                                                                                                         |
| Interactive diagrams as hand-authored SVG/Astro components                                                 | confirmed                    | D-007. Theme-aware; hover/click interaction as enhancement. Mechanism settled 2026-09-08 (D-015): vanilla custom-element scripts, no island framework.                                                  |
| Per-service working docs separate from user-facing content (AGENTS.md, README.md, docs/)                   | confirmed                    | D-008. Used by agents to research and map the service; never rendered.                                                                                                                                  |
| Structured product entries (capability, local equivalent, sources, verified date) rendered into tables     | confirmed                    | D-010, the hybrid content model. Schema drafted 2026-09-08 (D-014, [content-schema.md](content-schema.md)): one YAML record per product.                                                                |
| Usage limits per product's applicable plan tiers with a link to the official pricing/limits page           | confirmed                    | D-013, added by the owner after triage on 2026-09-08. Limits, not prices; each limits block carries its own source and last-verified date. Target M2 with the first product entries.                    |
| Coverage/status badge per service on the catalog card                                                      | confirmed                    | Triage 2026-09-08, target M1 (schema field and badge) with the stale state added in the same milestone as stale flagging. Signals "draft" vs "reviewed" vs "stale".                                     |
| Stale-content flagging (build warning and visible badge when last-verified exceeds a threshold)            | confirmed                    | D-011: 180 days, warn and badge, never fails the build. Target M2 alongside the first dated content.                                                                                                    |
| Cross-service capability index (compare local equivalents and product names across providers)              | confirmed                    | Triage 2026-09-08, target M4 or later, once 3+ services exist. Needs a shared capability taxonomy; the structured entries (D-010) make it possible.                                                     |
| Per-service changelog and site-wide Atom feed                                                              | rejected (triage 2026-09-08) | Needs a change-entry authoring habit that the lean process does not want to impose; git history and GitHub serve the "what changed" need. Re-propose if readers or agents ask for change notifications. |
| Bounded set of services                                                                                    | confirmed                    | Selection criteria: services the owner or a contributor has actually shipped on and can write opinionated notes for. The list closes per milestone in plan.md, not open-endedly.                        |

## Delivery and maintenance

| Feature                                                                    | Status           | Notes                                                                                                                                |
| -------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Deploy script: build, then rsync to `plex:/var/www/devstack.fyi/` over ssh | confirmed        | D-001. Linux-only. Run by the human. Installation and build must succeed before rsync runs.                                          |
| Deploy dry-run mode                                                        | confirmed        | Triage 2026-09-08, target M1. `rsync --delete` against the live site gets a preview step.                                            |
| Cloudflare cache purge step after deploy                                   | rejected (D-012) | Freshness comes from a short HTML TTL and immutable content-hashed assets instead; no API token on the dev box.                      |
| GitHub Actions: build and check on pull requests (no deploy)               | confirmed        | Triage 2026-09-08, target M1 (lands with the toolchain so contributors get it from the first PR). Deploy stays manual.               |
| Link checker for external vendor links (build-time or scheduled)           | confirmed        | Triage 2026-09-08, target M5. A script run manually or on a schedule; never part of `pnpm build`, so link rot cannot block a deploy. |
| CONTRIBUTING.md and a pull-request template                                | confirmed        | Triage 2026-09-08, target M5 (a minimal CONTRIBUTING.md may land earlier if outside PRs arrive).                                     |
| pnpm as the package manager                                                | confirmed        | D-004.                                                                                                                               |
| No analytics, telemetry, or cookies                                        | confirmed        | D-005.                                                                                                                               |

## Open questions

Numbering is stable because plan.md and architecture.md refer to it.

### Still open (answer during M0)

None; questions 1–10 are answered and the milestone ladder was rewritten
2026-09-08. The owner approved the plan and completed M0 the same day; M1
is in progress.

### Answered (2026-09-08)

- **10. Content-Security-Policy on plex.** The owner approved a full nginx
  header with external hashed scripts/CSS, a blocking external theme
  initializer, and Prism token classes, replacing the earlier meta-policy
  recommendation. [toolchain.md](toolchain.md) contains the exact contract
  and browser evidence (D-016). M1 prepares the reference vhost; the owner
  performs its sudo installation, nginx configuration test, and reload.

- **5. URL and trailing-slash policy** → `/cloudflare/` with the trailing
  slash: default `build.format: 'directory'` plus `trailingSlash: 'always'`.
  plex runs nginx 1.31.5 serving `index.html` per directory; the current
  vhost uses an SPA `try_files … /index.html` fallback that must become
  `try_files $uri $uri/ =404;` + `error_page 404 /404.html;` for a static
  site. Existing directories already receive nginx’s trailing-slash 301. The D-012 cache headers
  are `location` blocks in that vhost, applied by the owner (no `.htaccess`).
  Verified 2026-09-08 by reading the vhost over ssh (plex server check
  section of architecture.md).
- **9. Does `/var/www/devstack.fyi/` contain anything the build does not
  own?** → No. Verified 2026-09-08 over ssh: the docroot is empty and owned
  by the deploy user (`pmeenan:pmeenan`, mode 775), so `rsync --delete`
  fully owns it. (Plex server check section of architecture.md.)
- **2. Where do per-service working docs and content live?** → co-located:
  `services/<slug>/{AGENTS.md,README.md,docs/,content/}`, with the content
  layer's `glob()` loader reading `services/*/content/**/*.mdx` and
  excluding `_`-prefixed directories explicitly. Verified by the M0 spike on
  2026-09-08 (content-layer spike section of architecture.md). The
  architecture draft (2026-09-08) treats it as settled and lists it as an
  owner point; silence is a yes.
- **3. Diagram interactivity mechanism** → vanilla `<script>` in Astro
  components, each diagram a custom element; no island framework. See
  D-015. Measured 2026-09-08 against a Preact-island build of the same
  diagram (diagram mechanism spike section of architecture.md): zero
  JavaScript requests versus five files and about 11 kB gzipped, equivalent
  interaction.
- **1. Content model** → hybrid: structured product entries plus MDX prose.
  See D-010. The collection schema was drafted 2026-09-08
  ([content-schema.md](content-schema.md), D-014).
- **4. Initial category taxonomy** → a fixed enum in the schema (D-010)
  starting with three values: **Cloud Providers (and CDN)** (Cloudflare's
  home), **Databases**, and **Event Buses and Queues**. "Auth and Identity"
  was considered and left out until a service in that category is planned.
  Adding a category is a schema edit plus display name and sort order.
- **6. Stale-content policy** → 180 days since `lastVerified`; the build
  warns and the page and catalog card show a stale badge; the build never
  fails on staleness. See D-011.
- **7. Cache behavior behind Cloudflare** → short TTL for HTML and unversioned
  `public/` files, long immutable TTL for Astro's content-hashed assets, no
  purge step, and old hashed assets protected from `rsync --delete` for a
  grace period. See D-012.
- **8. Cloudflare coverage for the first service pass** → the owner chose all
  four product groups for M2:
  - Developer platform: Workers, Pages, KV, R2, D1, Durable Objects, Queues,
    Workflows.
  - Edge and network: CDN cache and Cache Rules, DNS, TLS and origin TLS
    modes, Rules, Load Balancing.
  - Security and access: WAF, Bot Management, Zero Trust Access, Tunnel,
    Turnstile.
  - Media and AI: Images, Stream, Workers AI, Vectorize, AI Gateway,
    Hyperdrive.
    Every product also gets limits for its applicable plan set with a pricing
    link (D-013); use Free, Pro, and Business only where zone plans apply.
    Service-wide notes to include, from the owner's own zone
    setup: honoring origin cache headers and strict origin TLS.
    The milestone ladder splits M2 into four passes: developer platform,
    edge/network and service-wide notes, security/access, then media/AI and
    complete-service review. The total scope is unchanged. Product names are to be
    re-verified against current Cloudflare docs when the research starts
    (D-006); this list is the owner's scope statement, not a claim about
    current product naming.
