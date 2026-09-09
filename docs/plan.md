# Plan

**Next: owner review of the M2.2a navigation preview, then M2.2b delivery content.**
Topic restructuring is implemented and verified (2026-09-09). The accepted
overview and eight product pages are preserved; the service remains a draft.

This plan holds active and future work, not completed execution history. Work
one implementation step or content pass per task unless the owner asks for a
larger unit. Follow [workflow.md](workflow.md) for verification and human handoff.
Only check an item when it is done and verified; record scope changes explicitly.

## Completed milestones

| Milestone                 | Completed state                                                                              | Durable references                                                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0 — Planning             | Accepted 2026-09-08: scope, static architecture, content model, and toolchain settled.       | [Features](features.md), [decisions](decisions.md), [architecture](architecture.md), [content schema](content-schema.md), [toolchain](toolchain.md)                           |
| M1 — Shell and launch     | Owner launched and accepted the shell on 2026-09-08; local and public checks passed.         | [Style guide](style-guide.md), [hosting and launch evidence](hosting.md), [toolchain checks](toolchain.md)                                                                    |
| M2.1 — Developer platform | Implemented 2026-09-08; overview and all eight product pages accepted for now by 2026-09-09. | [Cloudflare working area](../services/cloudflare/README.md), [research and verification](../services/cloudflare/docs/research.md), [page/diagram conventions](style-guide.md) |

Completed checklists and superseded review notes were pruned on 2026-09-09.
Use git history for execution history; preserve new durable rules in their
owning docs rather than accumulating them here or in AGENTS.md.

## M2 — Cloudflare end to end `in progress`

Goal: cover the owner-selected scope in [features.md](features.md), answered
questions 8 and 9. M2.1 is complete; M2.2a awaits owner preview review, and
M2.2b through M2.4 remain.

For each content pass, research current official sources in the Cloudflare
working docs, then document capability, local development and fidelity limits,
latency, API references/examples, applicable plan-tier limits, and service-wide
notes. Capability and limits records keep independent dates and sources.
Follow [content-schema.md](content-schema.md) and [style-guide.md](style-guide.md).
Do not substitute zone plans for product-specific plans, add prices, or guess
unpublished limits. Keep unresolved evidence visible where relevant.

### M2.2 — Topic structure, then edge/network and service-wide configuration

**Owner-approved sequencing, 2026-09-09:** restructure navigation before adding
more products. The accepted application-services diagram should stay focused;
it must not grow into a diagram of everything Cloudflare offers. See D-018.

#### M2.2a — Cloudflare topic landing page and navigation

- [x] Turn `/cloudflare/` into a topic directory with these initial areas:
      **Build applications**, **Deliver HTTP traffic**, **Protect applications**,
      and **Connect users and networks**.
- [x] Move the accepted overview to `/cloudflare/build/`; retain all eight
      existing product URLs, their accepted content, and storage tab ordering.
      Preserve existing root `#product-<slug>` links with useful destinations.
- [x] Keep two connected navigation rows within each area: product/topic
      destinations, then the current page's section links. Add a breadcrumb
      such as Cloudflare / Build applications / Workers and an accessible
      area switcher on the area name. Do not add a third tab row.
- [x] Keep the accepted focused overview in Build applications and clearly
      mark unwritten areas as planned without links to missing pages. The scope
      map records where later focused overviews and intersection cross-links
      belong; those land with their respective content passes.
- [x] Define explicit area membership for pages/products and separate it from
      the catalog's service-category enum. Update the content schema, route
      handling, authoring template, and working docs with the implementation.
      Map every existing M2 scope item before moving content.
- [x] Verify root/area/product navigation, old links, breadcrumbs, keyboard and
      no-JavaScript access, phone widths, and both themes. Run checks/build and
      present the restructured preview for owner review before expanding content.

Verified 2026-09-09: checks/build pass; browser checks cover all ten Cloudflare
routes at 1280px and 390px in both themes under the production CSP, native
keyboard/JavaScript-disabled area switching, all eight old product fragments,
and 144 internal links. Preview: `/cloudflare/` and `/cloudflare/build/`.

- [ ] **Owner:** review the restructured preview before M2.2b content expansion.

**Structure exit:** the root explains the available topic areas; the accepted
application overview is reachable in its own area; product URLs and content
remain intact; navigation uses two rows plus breadcrumbs/area switching.

#### M2.2b — Delivery content

- [ ] Research and document CDN cache and Cache Rules, DNS, TLS and origin
      TLS modes, Rules, and Load Balancing; explain overlapping scope without
      duplicating product records needlessly.
- [ ] Write the owner's required service-wide notes on strict origin TLS
      and honoring origin cache headers, backed by current official sources.
      Add a focused Deliver HTTP traffic overview for the request/configuration
      path; link relevant application and security pages at the intersections.

**Pass exit:** M2.2a structure is reviewed; every delivery scope item and both required service-wide notes are
covered, cited and dated; any diagrams meet the [style guide](style-guide.md) interaction checks.

### M2.3 — Security and access

Present this pass across **Protect applications** (WAF, bots, rate limiting,
DDoS protection, Turnstile) and **Connect users and networks** (WARP, Access,
Tunnel). WARP, rate limiting, and DDoS coverage were added with the owner's
topic-structure approval; research their practical scope and product boundaries.
Each area gets its own focused introduction/overview using M2.2a navigation.

- [ ] Research and document WAF, Bot Management, rate limiting, DDoS protection,
      Zero Trust Access, Tunnel, WARP, and Turnstile, including plan-dependent availability and realistic
      local-development options where current official sources support them.

**Pass exit:** all security/access scope items meet the common sourcing, local-dev,
limits and rendering requirements, with unresolved research recorded.

### M2.4 — Media, AI, and complete-service review

- [ ] Research and document Images, Stream, Workers AI, Vectorize, AI Gateway,
      and Hyperdrive. Keep the owner's grouping unless current research
      warrants a documented presentation adjustment. Place these initially
      under Build applications; review its tab density before adding all six,
      and propose a focused additional area if needed rather than dropping scope.
- [ ] Reconcile every scope item in features.md answered questions 8 and 9 against
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
