# Feature matrix

The scope ledger for the M0 planning conversations. Three tiers:

- **Confirmed** — stated project scope. Milestone assignment happens in
  [plan.md](plan.md) as the plan firms up.
- **Proposed** — candidate additions awaiting a yes/no from the project owner.
- **Open questions** — things that shape architecture and need an answer
  during M0.

Status legend: `confirmed` · `proposed` · `rejected (D-NNN)`

## Site shell

| Feature | Status | Notes |
| --- | --- | --- |
| Static site generation, no server process; in-page JS allowed | confirmed | D-001. Output is plain files served from `/var/www/devstack.fyi/`. |
| Astro + MDX with a custom layout (no docs theme) | confirmed | D-004. Content in Astro content collections. |
| Light and dark themes | confirmed | D-009. Default follows `prefers-color-scheme`; toggle persisted in `localStorage`; no flash of wrong theme. |
| Modern-tech, lighthearted visual identity with neon accents | confirmed | D-009. Applies to diagrams, catalog cards, and page chrome. |
| Catalog landing page grouped by offering category | confirmed | D-008. Categories such as "Cloud Providers (and CDN)", "Databases", "Event Buses". Initial list is open question 4. |
| One dedicated path per service (`/cloudflare/` first) | confirmed | D-008. |
| GitHub links on every page (repo home, edit this page) | confirmed | Stated with the "lean process + github links" contribution model. |
| 404 page | proposed | Static hosts serve `404.html` by convention; cheap and avoids a bare server error. |
| Client-side search (Pagefind or similar static index) | proposed | Becomes valuable once more than a few services exist; fully static, no server. |
| Sitemap, robots.txt, canonical URLs, OpenGraph metadata | proposed | Discoverability for a public reference site; Astro has first-party sitemap support. |
| Generated OpenGraph images in the neon style | proposed | Makes shared links look like the site; can be built at build time from a template. |
| Self-host all assets (fonts, scripts); no CDN or third-party requests | proposed | Keeps the "nothing phones home" claim (D-005) trivially true and removes an availability dependency. |
| Respect `prefers-reduced-motion` in diagrams and transitions | proposed | Accessibility baseline for animated neon visuals. |
| Copy-to-clipboard on config and command snippets | proposed | Service-wide notes are mostly config; small in-page JS. |

## Service content

| Feature | Status | Notes |
| --- | --- | --- |
| Product/feature name → capability map per service | confirmed | The core of each service page. |
| Local-development equivalent per capability | confirmed | Emulator, open-source stand-in, vendor dev mode, or "mock it". |
| Service-wide notes (e.g. Cloudflare strict origin TLS, cache rules for standards-compliant origin caching) | confirmed | Human-reviewed, opinionated guidance. |
| Cloudflare as the first documented service | confirmed | Product coverage list is open question 8. |
| Every service page cites official sources and carries a last-verified date | confirmed | D-006. Agents research from current vendor docs; owner reviews. |
| Interactive diagrams as hand-authored SVG/Astro components | confirmed | D-007. Theme-aware; hover/click interaction as enhancement. |
| Per-service working docs separate from user-facing content (AGENTS.md, README.md, docs/) | confirmed | D-008. Used by agents to research and map the service; never rendered. |
| Structured product entries (capability, local equivalent, sources, verified date) rendered into tables | proposed | Makes the map machine-checkable and enables the cross-service index and stale-content checks. Open question 1. |
| Coverage/status badge per service on the catalog card | proposed | Signals "draft" vs "reviewed" vs "stale" so readers calibrate trust. |
| Stale-content flagging (build warning and visible badge when last-verified exceeds a threshold) | proposed | Vendors rename products; this keeps the dated-claims promise honest. Threshold is open question 6. |
| Cross-service capability index (compare local equivalents and product names across providers) | proposed | Needs a shared capability taxonomy; only worth it after 3+ services. Depends on the structured-entries row. |
| Per-service changelog and site-wide Atom feed | proposed | Lets readers and agents notice when notes change; cheap with content collections. |
| Bounded set of services | confirmed | Selection criteria: services the owner or a contributor has actually shipped on and can write opinionated notes for. The list closes per milestone in plan.md, not open-endedly. |

## Delivery and maintenance

| Feature | Status | Notes |
| --- | --- | --- |
| Deploy script: build, then rsync to `plex:/var/www/devstack.fyi/` over ssh | confirmed | D-001. Linux-only. Run by the human. Installation and build must succeed before rsync runs. |
| Deploy dry-run mode | proposed | `rsync --delete` against the live site deserves a preview step. |
| Cloudflare cache purge step after deploy | proposed | Site is behind Cloudflare; content-hashed assets can use long TTLs, while HTML and unversioned assets need a separate cache policy. Open question 7. |
| GitHub Actions: build and check on pull requests (no deploy) | proposed | Cheap safety net for outside contributions; deploy stays manual. |
| Link checker for external vendor links (build-time or scheduled) | proposed | Vendor docs URLs rot; the site's value depends on its citations resolving. |
| CONTRIBUTING.md and a pull-request template | proposed | The project accepts outside contributions; one page of expectations keeps the lean process lean. |
| pnpm as the package manager | confirmed | D-004. |
| No analytics, telemetry, or cookies | confirmed | D-005. |

## Open questions (answer during M0)

1. **Content model: structured entries or free-form MDX?** Should each
   product be a structured record (name, capability, local equivalent,
   sources, last-verified) rendered into tables and diagrams, with prose MDX
   around it, or is each service page free-form MDX with a frontmatter
   schema only? Structured entries enable the cross-service index and stale
   checks but constrain authoring. Decides the collection schema before any
   content is written. → M0 architecture draft.
2. **Where do per-service working docs and content live?** Candidate:
   `services/<slug>/{AGENTS.md,README.md,docs/,content/}` co-located, with
   Astro's content layer loading `services/*/content/`; alternative: content
   under `src/content/services/` and working docs under `services/`. Needs a
   check against current Astro content-layer capabilities. → M0 spike.
3. **Diagram interactivity mechanism.** Vanilla `<script>` in Astro
   components (lightest, no framework) versus an island framework (Preact,
   Solid, Svelte) for richer state. Decides whether the site ships a
   framework runtime at all. → M0 architecture draft.
4. **Initial category taxonomy.** The owner supplies the starting list of
   offering categories and which one Cloudflare sits in ("Cloud Providers
   (and CDN)" is the working assumption). Fixed enum in the schema or
   free-form string? → owner, feature triage.
5. **URL and trailing-slash policy.** `/cloudflare/` versus `/cloudflare`,
   and how the web server on plex resolves directory indexes. Decides Astro's
   `build.format` and `trailingSlash` settings and affects every published
   link. → M0 toolchain decisions; verify against the plex server config.
6. **Stale-content policy.** What counts as stale (90 days? 180?), whether it
   fails the build or only warns, and how it is shown to readers. → feature
   triage.
7. **Cache behavior behind Cloudflare.** Decide TTLs or revalidation for HTML
   and unversioned assets (including files copied from `public/`), separately
   from content-hashed assets. Determine whether a purge is needed and how
   long old hashed assets must remain available for cached pages; rsync
   `--delete` would otherwise remove them on the next deploy. If an automated
   purge is chosen, the deploy script needs an API token on the dev box.
   → M0 toolchain decisions.
8. **Cloudflare coverage for the first service pass.** Which products are in
   scope for M2 (Workers, Pages, R2, KV, D1, Durable Objects, Queues, cache,
   DNS, TLS, Zero Trust, ...) and which wait. Bounds the research task. →
   owner, feature triage.
9. **Does `/var/www/devstack.fyi/` contain anything the build does not own?**
   `rsync --delete` assumes the build fully owns the directory. → verify on
   plex before the first deploy (M1).
