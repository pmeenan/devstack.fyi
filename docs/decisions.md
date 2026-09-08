# Decision log

Newest first. Every entry: what was decided, why, and what would reopen it.
Entries are for choices that are expensive to reverse or that a future agent
might silently undo — not routine implementation calls; a few per milestone is
the target. Existing entries are never edited into a different decision —
reversing or amending one gets a *new* entry that supersedes it (a status-line
annotation on the old entry is fine). When an entry hangs on a claim about
current technology state, check a current source or run a local experiment —
training knowledge is stale.

**Reading:** scan the D-NNN headings (or grep) and read only the entries your
task touches. Full read is for structural or cross-cutting work.

**Culling:** the log may be periodically pruned — superseded or moot entries
whose context no longer informs anything current are deleted outright; git
history is the archive. D-numbers are never reused.

Format:

```
## D-NNN: Title  (YYYY-MM-DD, status: accepted | proposed | superseded by D-MMM)
Decision / Context / Consequences / Reopen if
```

---

## D-009: Light and dark themes with a lighthearted, neon-accented tech look  (2026-09-08, status: accepted)

**Decision.** The site supports light and dark themes as equals from the
first page. The visual identity is modern-tech but deliberately not serious:
neon accent colors in diagrams, playful visuals, informal tone.

**Context.** Stated by the project owner at kickoff.

**Consequences.** All colors go through theme tokens; no hard-coded colors in
components or diagrams. Every visual, including diagrams, is checked in both
themes before it ships. Copy and visuals may be playful; accuracy of service
claims (D-006) is not relaxed by the tone.

**Reopen if.** The owner wants a single theme, or the audience turns out to
find the tone undermines trust in the content.

## D-008: Catalog by category, one path per service, working docs separate from content  (2026-09-08, status: accepted)

**Decision.** The landing page is a catalog of services grouped by offering
category (for example "Cloud Providers (and CDN)", "Databases", "Event
Buses"). Each service has a dedicated path (`/cloudflare/` first). Each
service also has a working-docs area (AGENTS.md, README.md, a docs/ folder)
that agents use to research and map the service; it is never rendered into
the site.

**Context.** Stated by the project owner at kickoff; the owner clarified that
"grouped by offering" means offering *category*, not provider.

**Consequences.** The content schema needs a category field (enum or
collection) and a slug that doubles as the URL segment. The build must
exclude working docs. A service belongs to exactly one category unless the
M0 triage decides otherwise. The exact directory layout (co-located versus
split) is open question 2 in features.md.

**Reopen if.** Services routinely span categories (a cloud provider that is
also a database vendor) and readers cannot find them, or a capability-first
navigation proves more useful than category-first.

## D-007: Diagrams are hand-authored SVG/Astro components  (2026-09-08, status: accepted)

**Decision.** Primary diagrams are built as Astro components emitting SVG,
theme-aware via the shared tokens, with hover and click interaction where it
aids understanding. Mermaid and static image files are not used for primary
diagrams.

**Context.** Chosen by the project owner at kickoff over Mermaid-at-build-time
and a mixed approach, for full control of the neon look and real
interactivity.

**Consequences.** Diagrams cost more per instance and the project should grow
a reusable component library (planned for M3 in the provisional ladder).
Static rendering must remain readable with JavaScript disabled; interaction is
an enhancement. Contributors need a short guide to the diagram components.

**Reopen if.** Per-diagram authoring cost blocks content work, or contributors
consistently need quick sketches that a text-to-diagram tool would serve.

## D-006: Service claims are researched from official sources, cited, and dated  (2026-09-08, status: accepted)

**Decision.** Agents research and draft service content from current official
vendor documentation. Every service page names its sources (URLs) and carries
a last-verified date. The owner reviews all service content before it is
committed. Training knowledge alone is never an acceptable source for a
product-to-capability claim.

**Context.** Chosen by the project owner at kickoff. Vendors rename and
re-scope products often, and the site's value rests on being right about what
a product name means today.

**Consequences.** The content schema has `sources` and `lastVerified` as
required fields. Agents working on a service must fetch current docs, not
recall them, and must say "no current source found" rather than guess. A
stale-content mechanism (proposed in features.md) follows naturally from the
dated field.

**Reopen if.** The owner decides to hand-write content directly, or a vendor's
documentation becomes unavailable to fetch.

## D-005: No analytics, telemetry, or cookies  (2026-09-08, status: accepted)

**Decision.** The published site includes no analytics beacon, no telemetry,
no cookies, and no tracking of any kind.

**Context.** Chosen by the project owner at kickoff from the options of none,
Cloudflare Web Analytics, and server-logs-only.

**Consequences.** Readership is unknown except through whatever the web server
on plex logs; that is acceptable. `localStorage` for the theme preference is
fine (it is not a cookie and never leaves the browser). Self-hosting all
assets so that no third-party request happens at all is a related
`proposed` row in features.md, not part of this decision.

**Reopen if.** The owner wants readership data to prioritize which services
to document.

## D-004: Astro + MDX with a custom layout, pnpm, TypeScript strict  (2026-09-08, status: accepted)

**Decision.** The site is built with Astro, using content collections and MDX
for pages, with a custom layout rather than the Starlight docs theme or
another theme. pnpm is the package manager. TypeScript strict mode is on
everywhere.

**Context.** The owner proposed Astro and asked for alternatives; the agent
recommended plain Astro + MDX over Starlight because a generic docs theme
fights the catalog landing page and the neon identity (D-009). The owner
chose Astro + MDX with a custom layout and pnpm. Astro's current major version
and content-layer capabilities are to be confirmed against current docs in the
M0 spike (plan.md), not assumed.

**Consequences.** Sidebar, search, and theming are built in-repo rather than
inherited. The check commands are `pnpm check` and `pnpm build` once M1 lands.
Diagram components are Astro components (D-007). pnpm must be available on
every machine that builds; deploy builds locally, so plex does not need it.

**Reopen if.** Astro drops MDX or content collections support in a way that
blocks the content model, or the custom shell proves too costly to maintain
relative to a theme.

## D-003: AI-developed, human-gated lean workflow with GitHub contributions  (2026-09-08, status: accepted)

**Decision.** AI agents implement from the project documentation; the human
maintainer directs, reviews, commits, and deploys. The process is lean: one
agent, one pass, one human scan; reviews on demand. The project is public at
https://github.com/pmeenan/devstack.fyi and accepts outside contributions as
pull requests through the same human gate. Agents never commit and never
deploy.

**Context.** Stated by the project owner at kickoff: public, accepting
contributions, "without a lot of process overhead — deploys are still manual
which is the main gate".

**Consequences.** The docs in `docs/` are the project's long-term memory and
must stay accurate. No mandatory review passes or CI gates are installed by
default; a PR build check and CONTRIBUTING.md are `proposed` rows. The
maintainer is the only person who deploys.

**Reopen if.** Contribution volume or a second maintainer makes the
single-human gate a bottleneck, or a bad deploy shows the manual gate is not
enough.

## D-002: Apache-2.0 license; permissive dependencies only  (2026-09-08, status: accepted)

**Decision.** The repository is licensed under Apache-2.0 (the LICENSE file
was committed by the owner before scaffolding). Dependencies must carry a
permissive license compatible with redistribution under Apache-2.0: MIT, BSD
(2/3-clause), Apache-2.0, ISC, 0BSD, Unlicense, CC0, or similar. Copyleft
(GPL, AGPL, SSPL) and source-available licenses are excluded.

**Context.** LICENSE present in the initial commit by the owner.

**Consequences.** Every new dependency's license is checked from the package's
own metadata (`package.json` `license` field or the package's LICENSE file),
not from memory. Site content is also under Apache-2.0 unless the owner
decides otherwise; vendor documentation is cited and linked, never copied at
length.

**Reopen if.** The owner wants a different license for content versus code, or
a needed dependency has no permissive alternative.

## D-001: Static site, rsync-deployed to plex, behind Cloudflare  (2026-09-08, status: accepted)

**Decision.** devstack.fyi is a statically generated site with no running
server component; in-page JavaScript is allowed. It is deployed by a script
that builds the site and rsyncs the output over ssh to
`plex:/var/www/devstack.fyi/`, where an existing web server serves it. The
domain is fronted by Cloudflare. All development and deployment happens on
Linux. The deploy is run manually by the human maintainer.

**Context.** Stated by the project owner at kickoff.

**Consequences.** No feature may require a server process, serverless
function, form handler, or database at runtime; search, feeds, and indexes
must be built at build time. The deploy script must be safe to run from a
clean checkout and should preview `--delete` before applying it (a `proposed`
row). Whether `/var/www/devstack.fyi/` holds anything else is open question 9
and must be verified before the first deploy. Cloudflare's cache means HTML
may be served stale after a deploy unless TTLs or a purge step handle it
(open question 7).

**Reopen if.** A feature genuinely needs a server (unlikely by design), or the
hosting moves off plex.
