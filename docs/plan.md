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
- [ ] Feature triage: walk [features.md](features.md) with the owner; promote
      or reject every `proposed` row; answer the open questions; record
      significant calls in [decisions.md](decisions.md).
- [ ] Owner supplies the initial category taxonomy and the Cloudflare product
      coverage list for the first pass (open questions 4 and 8).
- [ ] Spike: confirm against current Astro docs that the content layer can
      load MDX from `services/*/content/` (or whichever layout wins open
      question 2), and note the current Astro major version and MDX
      integration status. Output: a paragraph in architecture.md with dated
      source links.
- [ ] Check on plex: web server type, directory-index and trailing-slash
      behavior, and whether `/var/www/devstack.fyi/` holds anything the build
      does not own (open questions 5 and 9). Output: notes in architecture.md.
- [ ] Decide the content model (open question 1) and draft the content
      collection schema, including source citations and last-verified fields.
- [ ] Decide the diagram interactivity mechanism (open question 3).
- [ ] First full draft of [architecture.md](architecture.md).
- [ ] Toolchain decisions: Astro version, pnpm, TypeScript strict config,
      formatter/linter, `pnpm check` and `pnpm build` as the standard checks,
      GitHub Actions on PRs (if promoted), license audit approach. Record in
      decisions.md.
- [ ] Rewrite the provisional ladder below into real milestones with exit
      criteria.

**Exit criteria:** the owner has walked features.md and says the plan is good
enough to build from; the content model, service layout, and diagram mechanism
are decided (the rest may ride along as open questions); toolchain decided;
M1+ milestones have scopes. M0 is a conversation, not a phase — it exits on the
owner's call, not on a checklist reaching zero.

## Provisional milestone ladder  `pending — to be rewritten in M0`

Ordered by risk: site substrate and one working end-to-end service before
breadth. Sketch only — do not start work from these entries, and note that
they freely reference `proposed` features.md rows; nothing here pre-empts the
M0 triage.

- **M1 — Scaffolding & shell.** Astro + MDX project with pnpm and TypeScript
  strict; light/dark theme with no-flash loading; base layout and neon design
  tokens; catalog landing page rendering categories from the content
  collection with a Cloudflare card; an empty-but-real `/cloudflare/` page;
  404 page (if promoted); `scripts/deploy.sh` with dry-run (if promoted) and
  the rsync to plex; repository layout table in AGENTS.md updated. Exit: the
  shell is live at devstack.fyi via the deploy script.
- **M2 — Cloudflare end to end.** `services/cloudflare/` working docs
  (AGENTS.md, README.md, docs/ research notes with dated sources); the
  product-to-capability map for the agreed coverage list; local-development
  equivalents; service-wide notes (strict origin TLS, standards-compliant
  origin caching rules, and whatever else the owner supplies); the first one or
  two interactive diagram components; citations and last-verified date wired
  into the page template. Exit: `/cloudflare/` is published and owner-reviewed.
- **M3 — Diagram library & identity polish.** Reusable diagram primitives
  sharing the neon palette; reduced-motion support; OpenGraph images and
  metadata (if promoted); accessibility pass in both themes.
- **M4 — Breadth.** A second and third service in other categories
  (e.g. a database and an event bus) to stress the content model; client-side
  search and the cross-service capability index if promoted.
- **M5 — Contribution & maintenance.** CONTRIBUTING.md, PR template, GitHub
  Actions build check, link checker, stale-content flagging, changelog/feed
  (each only if promoted).
