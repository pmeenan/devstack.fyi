# Plan

**This is a living document.** Milestones will be re-scoped, re-ordered, split,
or added as planning conversations and findings come in. That churn is
expected; what is _not_ allowed is silent change. Update the affected docs
when scope changes; only changes to load-bearing choices need a decision-log
entry (see AGENTS.md rule 1). Progress is reflected here by checking boxes
and updating status lines as work lands.

Check a box only when the item is done and verified; partially done items stay
unchecked, optionally with a note.

**Status legend:** `pending` · `in progress` · `done` · `parked`

## M0 — Plan the plan `done`

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
- [x] Toolchain decisions: tested pins, strict config, formatter/checks, PR
      workflow, transitive-license audit and owner-approved build-tool
      exceptions, five-minute HTML TTL, seven-day asset retention and safe
      cleanup are recorded in D-016 and [toolchain.md](toolchain.md)
      (2026-09-08). Frozen install, check, build, formatting, and real-header
      browser script execution passed in a throwaway project. The owner
      approved full nginx CSP with external scripts and CSS on 2026-09-08
      (question 10 answered). M1 implements the contract and reference vhost;
      the owner performs the sudo install, nginx test, and reload on plex.
      No server changes in M0.
- [x] Rewrite the provisional ladder into scoped milestones with exit
      criteria. Done 2026-09-08: M1 has ordered implementation steps and
      a separate owner launch gate; M2 has four bounded Cloudflare passes;
      M3–M5 retain the confirmed polish, breadth, and maintenance scope.

**Exit criteria:** the owner has walked features.md (done 2026-09-08) and
says the plan is good enough to build from; the content model, service layout, and diagram mechanism
are decided (the rest may ride along as open questions); toolchain decided;
M1+ milestones have scopes. M0 is a conversation, not a phase — it exits on the
owner's call, not on a checklist reaching zero.

**Owner exit:** plan approved and M0 completed on 2026-09-08. M1 is authorized.

## Milestone ladder

Rewritten 2026-09-08 against the confirmed [feature matrix](features.md),
[architecture](architecture.md), [content schema](content-schema.md), and
[toolchain contract](toolchain.md). Those documents supply implementation
contracts; the scopes and exit criteria here determine the work order.
No load-bearing choices change in this rewrite.

Work in order, one implementation step or content pass per task unless the
owner asks for a larger unit. M0 is approved and M1.1 is complete; **next is M1.2**. Each
handoff includes the working-tree changes and relevant verification; the
human commits. All implementation steps require `pnpm check` and
`pnpm build` once available. Temporary fixtures and browser output stay
outside the repository. Owner review, server changes, and publication are
explicit exit items; implementation readiness alone does not complete them.

## M1 — Scaffolding and first launch `in progress`

Goal: a working static shell, validated content pipeline, and a tested manual
deploy path. Depends on the owner's M0 exit call. Cloudflare is visibly a
draft until M2 supplies the researched product coverage.

### M1.1 — Toolchain and content foundation `done`

- [x] Scaffold Astro + MDX with the exact pins, pnpm lockfile, strict
      TypeScript, aliases, build-script approvals, and formatting policy in
      toolchain.md. Document local setup, including the pnpm installation
      alternative, and format the existing docs.
- [x] Implement `pnpm check`, `pnpm build`, and `pnpm format`, including the
      dependency-license audit and built-output CSP check. Record package,
      optional-platform, Node distribution, and font license evidence in
      `docs/dependency-licenses.md`; retain redistributed font licenses.
- [x] Implement the three collections, taxonomy, URL helpers, group
      validation, and stale-date helpers/build pass from content-schema.md.
      Create the excluded `services/_template/` authoring example and the
      Cloudflare working-doc skeleton (`AGENTS.md`, `README.md`, `docs/`).
- [x] Add the minimal catalog and collection-driven service/sub-page routes,
      with a clearly marked Cloudflare draft, official sources and an honest
      verification date for any introductory claim. No invented product rows
      or dates standing in for unfinished research.
- [x] Add the PR check/build workflow with pinned, license-verified actions,
      read-only permissions, no secrets, and cancellation of superseded runs.
      Update the root layout table and setup/status docs as files land.

**Step exit:** a frozen install, check, and static build pass. Temporary
fictional records prove root/sub-page routing, product and limits validation,
unknown-group rejection, and exclusion of working docs and `_template` from
published output. The license/output checks reject representative invalid
fixtures. The PR workflow uses the same passing commands locally; record its
first hosted result when an actual PR runs it.

**Verified 2026-09-08:** frozen install, `pnpm check` (0 Astro diagnostics,
formatting, 381-package license inventory, five passing tests), and
`pnpm build` pass in sequence. The real Astro fixture builds cover nested
routes, working-doc/template exclusion, stale warnings and invalid records;
output/license fixtures reject representative failures. Cache isolation is
recorded in RE-008; multi-document lockfile handling is RE-009. Empty product
and sub-page collections emit expected warnings until real content lands.
The first hosted PR workflow run remains pending an actual PR. M1.2 is next.

### M1.2 — Look, feel, and accepted style guide

- [ ] Build a representative visual prototype using the M1.1 scaffold:
      catalog cards, service headings, product/limits tables, code snippets,
      badges, and a sample diagram treatment at narrow and wide sizes in
      both light and dark themes. Fictional sample content is enough to
      judge the design; keep it out of published service claims.
- [ ] Iterate with the owner on typography, spacing, page density, neon
      palette, surfaces, borders, diagram styling, and interaction states.
      Show both themes together in each feedback round and revise until the
      owner is happy with the look and feel; one agent-selected design does
      not complete this step.
- [ ] Capture the accepted direction in `docs/style-guide.md`, with visual
      examples and concrete tokens/rules for colors, typography, spacing,
      responsive layout, components, focus/hover states, and reduced motion.
      Check contrast and legibility in both themes before acceptance; keep
      the prototype's implemented tokens aligned with the guide.
- [ ] **Owner:** accept the style guide and representative light/dark views
      before the full shell is built to that direction.

**Step exit:** the owner is happy with both themes and the style guide records
that accepted direction with enough detail for later agents to implement it
consistently. If feedback is pending, hand off the concrete prototype and
keep this step in progress. M1.3 follows the accepted guide; later design
changes update it alongside the implementation.

### M1.3 — Usable shell in both themes

- [ ] Build the base and service layouts, grouped catalog, draft/reviewed
      badges, product/local-dev/limits rendering, source lists, verification
      dates, and sub-page navigation. Empty categories stay hidden.
- [ ] Apply the accepted style guide to design tokens and responsive styles;
      add self-hosted Inter and JetBrains Mono, favicon, and theme-aware
      Prism code styling. Implement
      the external blocking theme initializer, persistent toggle with storage
      failure fallback, reduced-motion tokens, and snippet copy feedback.
- [ ] Add skip navigation, visible keyboard focus, semantic headings and
      tables, repository/edit links, a custom 404, sitemap, robots.txt,
      canonical URLs, OpenGraph metadata and an initial shared social image.

**Step exit:** the built catalog, Cloudflare draft, 404, and temporary rich
content fixtures work at narrow and wide viewport sizes in both themes.
Under the real CSP header, verify theme reload without a wrong-theme flash,
blocked storage, snippet copying, font loading, keyboard use, reduced motion,
and readable content with JavaScript disabled. Check source/edit links,
canonical/sitemap paths, 404 exclusion from the sitemap, and absence of
third-party asset requests. Stale UI gets its full content acceptance in M2.1.

### M1.4 — Delivery contract and owner launch

- [ ] Implement `scripts/deploy.sh` and its helper, following toolchain.md:
      frozen install/check/build before transfer, fixed target, default dirty
      tree refusal and confirmation (`--yes` to skip confirmation), read-only
      dry-run, remote locking, assets before HTML, protected old assets, and
      seven-day retirement tracked atomically outside the docroot. Confirm
      remote runtime availability with read-only checks before selecting a
      helper dependency.
- [ ] Add `pnpm run deploy` as the package-script wrapper for `scripts/deploy.sh`,
      forwarding arguments so `pnpm run deploy --dry-run` previews the operation
      and `pnpm run deploy --yes` uses the script's confirmation bypass. Document
      these human-run commands in the README and verify argument forwarding
      through the local fixture harness. Add the wrapper with the tested
      script, not as a placeholder before M1.4. Use the explicit `run` form:
      bare `pnpm deploy` is pnpm's built-in workspace packaging command.
- [ ] Verify deployment and cleanup using temporary local fixtures covering
      first retirement, unexpired/expired assets, rollback/reactivation and
      second retirement, transfer failure, missing/corrupt state, unsafe paths
      and symlinks, lock contention, and stale previews. Verify a dry-run
      changes neither files nor ledger. Agents never run the deploy script;
      exercise the transfer/cleanup implementation through a local fixture
      harness, as required by toolchain.md.
- [ ] Prepare `deploy/nginx/devstack.fyi.conf` preserving TLS/certbot and
      unrelated headers, with real 404 routing, immutable assets, five-minute
      default TTL, apex redirects, and the approved CSP. Validate it with
      local nginx for successful pages/assets, slash and host redirects,
      missing pages/assets, security-header inheritance, and `no-store` errors.
      Supply exact owner installation, `nginx -t`, reload, and deployment
      instructions in the README.
- [ ] **Owner:** review and commit the shell, install/test/reload the vhost on
      plex, inspect the deploy dry-run, and deploy. Check the public routes,
      redirects, headers, theme and copy interactions; record the outcome.

**M1 exit:** the M1.2 style guide is owner-accepted, M1.1–M1.4
implementation checks pass and the owner has launched and checked the shell at `https://devstack.fyi/`. Until the owner performs
that last item, report “implementation ready; owner launch pending.”

## M2 — Cloudflare end to end `pending`

Goal: the first service answers all four reader questions in vision.md.
Depends on M1. The four passes below preserve the entire owner-selected
coverage list; names are research scope labels, to be re-verified against
current official docs before authoring claims.

**For every pass:** extend the Cloudflare working docs with dated official
research, then author the product-to-capability map, local-development
options and their limitations, and applicable plan-tier usage limits with
pricing/limits links. Capability/local-dev claims and limits each retain
their own sources and dates. Do not substitute zone plans for product-specific
plans, add prices, or guess unpublished limits. Record unresolved evidence
in the working docs and mark the coverage gap visibly when relevant.

### M2.1 — Developer platform and content acceptance

- [ ] Research and document Workers, Pages, KV, R2, D1, Durable Objects,
      Queues, and Workflows.
- [ ] Exercise the complete product/local-dev/limits/source rendering with
      real records; implement visible stale badges on entries and catalog
      cards using the shared stale logic. Verify service, sub-page, product,
      and limits dates independently, the 180-day boundary, and warnings
      that never fail the build.
- [ ] Add the first useful interactive SVG/Astro diagram using a vanilla
      custom element, with a readable static rendering, keyboard/touch
      interaction, accessible labels, and reduced-motion behavior.

**Pass exit:** all eight scope items have sourced records (or a documented,
source-backed rename/retirement mapping), tables are readable on mobile in
both themes, and the diagram works under the full CSP with two instances
and with JavaScript disabled. The page remains `draft` pending owner review.

### M2.2 — Edge, network, and service-wide configuration

- [ ] Research and document CDN cache and Cache Rules, DNS, TLS and origin
      TLS modes, Rules, and Load Balancing; explain overlapping scope without
      duplicating product records needlessly.
- [ ] Write the owner's required service-wide notes on strict origin TLS
      and honoring origin cache headers, backed by current official sources.
      Add a second diagram if it helps explain the request/configuration path;
      one effective diagram is enough for the M2 total.

**Pass exit:** every scope item and both required service-wide notes are
covered, cited and dated; any diagrams meet the M2.1 interaction checks.

### M2.3 — Security and access

- [ ] Research and document WAF, Bot Management, Zero Trust Access, Tunnel,
      and Turnstile, including plan-dependent availability and realistic
      local-development options where current official sources support them.

**Pass exit:** all five scope items meet the common sourcing, local-dev,
limits and rendering requirements, with unresolved research recorded.

### M2.4 — Media, AI, and complete-service review

- [ ] Research and document Images, Stream, Workers AI, Vectorize, AI Gateway,
      and Hyperdrive. Keep the owner's grouping unless current research
      warrants a documented presentation adjustment.
- [ ] Reconcile every scope item in features.md answered question 8 against
      the page and working docs; resolve remaining gaps before calling the
      promised first pass complete. Check the complete page's navigation,
      mobile tables, source links, dates, and diagrams in both themes.
- [ ] **Owner:** review the complete service's advice and coverage, approve
      `reviewed` status, and publish through the manual deploy workflow.

**M2 exit:** all four passes pass checks, all selected coverage is accounted
for with current sources, and the owner-reviewed `/cloudflare/` is published.
A partial draft may be published earlier by the owner; it does not complete M2.

## M3 — Diagram library and identity polish `pending`

Goal: turn the proven Cloudflare visuals into reusable components and polish
sharing/accessibility, extending the accepted M1 style guide. Depends on M2;
keep the initial diagrams accessible
from their introduction rather than deferring fixes to this milestone.

- [ ] Extract shared SVG/Astro primitives from the real diagrams, preserving
      theme tokens, instance-unique SVG ids, static readability, keyboard and
      touch interaction, and reduced motion. Document component authoring and
      usage; refactor the existing diagrams onto the shared pieces.
- [ ] Generate per-service OpenGraph images at build time in the neon style;
      verify generator and font licenses before adoption and include them in
      the dependency inventory/audit. Wire correct absolute image metadata.
- [ ] Run an accessibility and responsive-layout pass over the catalog,
      service page, 404, code, tables, and diagrams in both themes, including
      contrast, focus order, zoom, reduced motion, and screen-reader labels.

**Exit:** existing diagrams use the documented primitives without losing
interaction or static meaning; generated social images exist and match page
metadata; the accessibility pass has no unresolved blocking defects, and
check/build plus browser interaction checks under the CSP pass.

## M4 — Three services, search, and capability index `pending`

Goal: prove the model across categories and make the growing catalog easy to
navigate. Depends on M3. Service selection is the remaining scope input;
do not invent the owner's experience or pick providers from brand familiarity.

- [ ] **Owner, before content research:** choose one database and one event
      bus/queue service that the owner or a contributor has shipped on, and
      bound the product coverage and service-wide notes for each. Record the
      two names and coverage here before implementation.
- [ ] Add the second service, then the third, each with working docs, sourced
      and dated product/local-dev/limits records, and service-wide notes.
      Reuse the shell and template; address demonstrated model defects only.
- [ ] With the third service planned, define a shared capability taxonomy and
      add the optional `capabilityId` field described in content-schema.md.
      Record this shared-schema choice in decisions.md and update the schema
      documentation; map the three services' comparable products explicitly.
- [ ] Once three services exist, add self-hosted static-index search after
      verifying the chosen dependency's license and CSP compatibility. Index
      published content only; support keyboard use, empty queries, and no
      results without a runtime API or third-party requests.
- [ ] Build a cross-service capability index showing product names and local
      equivalents with links back to the cited records. Describe material
      differences so a shared key does not promise interchangeability.
- [ ] **Owner:** review the two new services and publish the expanded site.

**Exit:** three reviewed services span the three initial categories; adding
services required content and optional diagrams, not service-specific shell
code. Search finds representative product names, aliases, and capabilities;
the index maps comparable records accurately; both work in both themes under
the CSP, all checks pass, and the owner has published the result.

## M5 — Contribution and maintenance `pending`

Goal: make outside updates and periodic source checks repeatable. Depends on
M4; minimal contribution instructions may land earlier if outside PRs arrive.

- [ ] Write CONTRIBUTING.md and a PR template covering setup/checks, working
      docs versus published content, the authoring template, official sources
      and dates, limits updates, and the human review/commit/deploy workflow.
- [ ] Add a standalone external-link checker with a documented manual command
      and useful source-file/URL diagnostics. It remains outside `pnpm build`
      and the deploy gate; distinguish broken links from rate limits or
      inaccessible vendor endpoints. Scheduling is optional and adds no
      runtime component to the site.
- [ ] Document the maintenance path from a stale warning or link-check result
      to source re-verification, updated claims/dates, local checks, and a PR.
      Keep git/GitHub as the change history; no changelog/feed is added.

**Exit:** a contributor can follow the instructions from a clean checkout,
copy the template and validate an update; the link checker reports known
success/failure fixtures without blocking a site build; the PR template and
maintenance instructions agree with the actual commands and human gate.
