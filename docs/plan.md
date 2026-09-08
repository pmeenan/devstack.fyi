# Plan

**This is a living document.** Milestones will be re-scoped, re-ordered, split,
or added as planning conversations and findings come in. That churn is
expected; what is *not* allowed is silent change. Update the affected docs
when scope changes; only changes to load-bearing choices need a decision-log
entry (see AGENTS.md rule 1). Progress is reflected here by checking boxes
and updating status lines as work lands.

Check a box only when the item is done and verified; partially done items stay
unchecked, optionally with a note.

**Status legend:** `pending` · `in progress` · `done` · `parked`

## M0 — Plan the plan  `in progress`

Goal: turn the initial feature list into a settled vision, feature matrix,
content model, architecture, and milestone ladder — through planning
conversations with the project owner plus targeted checks where a decision
needs evidence.

- [x] Repo scaffolding for the AI-directed workflow (this scaffold).
- [x] Feature triage: walked [features.md](features.md) with the owner on
      2026-09-08; every `proposed` row promoted or rejected; open questions
      1, 4, 6, 7, and 8 answered; recorded as D-010, D-011, D-012.
- [x] Owner supplied the initial category taxonomy and the Cloudflare product
      coverage list for the first pass (open questions 4 and 8; see the
      answered-questions section of features.md).
- [x] Spike: confirmed 2026-09-08 with a throwaway build (Astro 7.3, MDX
      integration 8.0) that the content layer loads MDX from
      `services/*/content/` while excluding the working docs; see the
      "Content-layer spike" section of architecture.md. Answered open
      question 2 (co-located layout) and logged RE-001 to RE-003.
- [x] Check on plex: web server type, directory-index and trailing-slash
      behavior, and whether `/var/www/devstack.fyi/` holds anything the build
      does not own (open questions 5 and 9). Done 2026-09-08 by reading the
      nginx vhost over ssh (host plex.meenan.us:10022). nginx 1.31.5; docroot
      empty and owned by the deploy user (question 9 answered);
      `build.format: 'directory'` + `trailingSlash: 'always'` (question 5
      answered). Reading the vhost surfaced three owner-side follow-ups for
      M1 (server changes wait until M1; the CSP and HTML-cache policy choices
      remain M0 toolchain work): the missing
      `/_astro/` immutable cache rule (D-012), the SPA `try_files` fallback
      that must become `=404;` + `error_page` for a real 404 page, and the
      strict CSP header (open question 10, RE-004).
- [x] Draft the content collection schema for the hybrid model (D-010):
      services entry with category enum, status, sources, last-verified;
      structured product entries with capability, local equivalent, sources,
      last-verified, and a per-tier limits sub-record with its own source and
      date (D-013). Done 2026-09-08: [content-schema.md](content-schema.md)
      (three collections: `services`, `pages`, `products`; one YAML file per
      product, tier-by-metric limits table, directory name as slug; D-014),
      verified with a throwaway build (`astro check` clean, bad records fail
      the build with field messages). Two owner points are listed at the end
      of that doc; the code lands with the M1 scaffold.
- [x] Decide the diagram interactivity mechanism (open question 3). Done
      2026-09-08 with a throwaway build (Astro 7.3.2, `@astrojs/preact`
      6.0.5) driven in headless Chrome: vanilla `<script>` in Astro
      components using custom elements, no island framework (D-015). The
      same two-instance diagram cost zero JavaScript requests as a custom
      element versus five files (11 kB gzipped) as Preact islands; both
      paths work under Astro's `security.csp` policy sent as a header and
      both break under plex's current header, and the `is:inline` theme
      snippet is never hashed (RE-005). See the "Diagram mechanism spike"
      section of architecture.md.
- [x] First full draft of [architecture.md](architecture.md). Done
      2026-09-08: system picture, repository layout, URLs and routing,
      rendering and component inventory, theming, the client-side script
      inventory, metadata and fonts (fonts API, sitemap, and 404 behavior
      checked against current Astro docs), build and checks, hosting, cache
      and deploy-script design (ledger-based retirement of hashed assets),
      security headers, contribution surface, accessibility, extension
      points; the dated spike sections kept as an evidence appendix. Three
      owner points listed at the end of the doc (co-located layout veto,
      deploy-script ergonomics, the five vhost changes). Open question 10
      and the values it leaves (HTML TTL, grace duration, highlighter,
      script inlining) roll into the toolchain item.
- [ ] Toolchain decisions: Astro version, pnpm, TypeScript strict config,
      formatter/linter, `pnpm check` and `pnpm build` as the standard checks,
      GitHub Actions on PRs, license audit approach, the nginx reference
      config the owner applies on plex (D-012 `/_astro/` immutable rule,
      `try_files … =404` + custom 404, apex canonical redirect; all found
      missing/wrong in the 2026-09-08 vhost read), the CSP approach (open
      question 10), and the grace duration and safe cleanup of retired hashed
      assets. Record in decisions.md.
- [ ] Rewrite the provisional ladder below into real milestones with exit
      criteria.

**Exit criteria:** the owner has walked features.md (done 2026-09-08) and
says the plan is good enough to build from; the content model, service layout, and diagram mechanism
are decided (the rest may ride along as open questions); toolchain decided;
M1+ milestones have scopes. M0 is a conversation, not a phase — it exits on the
owner's call, not on a checklist reaching zero.

## Provisional milestone ladder  `pending — to be rewritten in M0`

Ordered by risk: site substrate and one working end-to-end service before
breadth. Sketch only — do not start work from these entries. The 2026-09-08
triage settled the "(if promoted)" items; the milestone targets below now
match the notes column in features.md but still await the ladder rewrite.

- **M1 — Scaffolding & shell.** Astro + MDX project with pnpm and TypeScript
  strict; light/dark theme with no-flash loading; base layout and neon design
  tokens; catalog landing page rendering categories from the content
  collection with a Cloudflare card and status badge; an empty-but-real
  `/cloudflare/` page; 404 page; sitemap, robots.txt, canonical URLs and
  OpenGraph metadata; self-hosted fonts and scripts; reduced-motion tokens;
  copy-to-clipboard on snippets; `scripts/deploy.sh` with dry-run and the
  rsync to plex, protecting old hashed assets per D-012; GitHub Actions build
  check on PRs; repository layout table in AGENTS.md updated. Exit: the
  shell is live at devstack.fyi via the deploy script.
- **M2 — Cloudflare end to end.** `services/cloudflare/` working docs
  (AGENTS.md, README.md, docs/ research notes with dated sources); the
  product-to-capability map for the coverage list in features.md (answered
  question 8: developer platform, edge and network, security and access,
  media and AI — the ladder rewrite may split this into passes);
  local-development equivalents; limits per product's applicable plan tiers
  with pricing links (D-013); service-wide notes (strict origin TLS,
  honoring origin cache headers for standards-compliant caching, and whatever
  else the owner supplies); the first one or two interactive diagram components; citations
  and last-verified date wired into the page template; stale-content warning
  and badge (D-011). Exit: `/cloudflare/` is published and owner-reviewed.
- **M3 — Diagram library & identity polish.** Reusable diagram primitives
  sharing the neon palette; reduced-motion support in diagrams; generated
  OpenGraph images in the neon style; accessibility pass in both themes.
- **M4 — Breadth.** A second and third service in other categories
  (e.g. a database and an event bus) to stress the content model; client-side
  search; the cross-service capability index once 3+ services exist.
- **M5 — Contribution & maintenance.** CONTRIBUTING.md, PR template, external
  link checker script (not build-blocking). Changelog/feed was rejected in
  triage.
