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
- [ ] Spike: confirm against current Astro docs that the content layer can
      load MDX from `services/*/content/` (or whichever layout wins open
      question 2), and note the current Astro major version and MDX
      integration status. Output: a paragraph in architecture.md with dated
      source links.
- [ ] Check on plex: web server type, directory-index and trailing-slash
      behavior, and whether `/var/www/devstack.fyi/` holds anything the build
      does not own (open questions 5 and 9). Output: notes in architecture.md.
- [ ] Draft the content collection schema for the hybrid model (D-010):
      services entry with category enum, status, sources, last-verified;
      structured product entries with capability, local equivalent, sources,
      last-verified, and a per-tier limits sub-record with its own source and
      date (D-013). The model itself is decided (open question 1).
- [ ] Decide the diagram interactivity mechanism (open question 3).
- [ ] First full draft of [architecture.md](architecture.md).
- [ ] Toolchain decisions: Astro version, pnpm, TypeScript strict config,
      formatter/linter, `pnpm check` and `pnpm build` as the standard checks,
      GitHub Actions on PRs, license audit approach, and how the D-012
      `Cache-Control` headers get set on plex (depends on open question 5),
      including the grace duration and safe cleanup of retired hashed assets.
      Record in decisions.md.
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
