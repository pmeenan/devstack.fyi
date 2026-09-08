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

## D-013: Plan-tier usage limits are core content; prices are not  (2026-09-08, status: accepted)

**Decision.** Every documented product carries its usage limits per plan
tier using the product's actual plan set (Free, Pro, Business where zone
plans apply; product-specific plans otherwise; custom Enterprise limits
are not enumerated) with a link to the vendor's official pricing or limits page.
Limits are quotas and caps — requests, storage, CPU time, object size,
rule counts — not prices. The site still publishes no prices and no
cross-vendor cost comparison; the pricing link is where a reader goes for
dollars.

**Context.** Requested by the owner after the 2026-09-08 triage: limits are
"critical for people to consider when building out the stack". The vision's
non-goal "not a pricing or vendor comparison site" was written to keep
fast-changing prices out; limits change too, but they decide whether a
design works at all on a given tier, which is squarely the site's job.
The non-goal is narrowed to prices, not deleted.

**Consequences.** The product record (D-010) gains a `limits` sub-record:
the tier set the product is priced on, one entry per tier, a source URL
(the pricing or limits page), and its own `lastVerified`, because limits
change on a different cadence than capability descriptions. Tier names are
per product plan set, and a product may be priced on its own plan rather than the
service's zone-level plan, so the schema must let a product name its tier
set rather than hard-coding Free/Pro/Business site-wide. For example,
[Workers uses Free and Paid plans independently of zone plans](https://developers.cloudflare.com/workers/platform/pricing/#fine-print)
(verified 2026-09-08); verify each other product's plan set during research (D-006).
The stale check (D-011) applies to the limits date as well. Research cost per
product goes up: every entry needs a current limits source in addition to
its capability source.

**Reopen if.** Limits churn so fast that they are stale more often than
not, or a vendor stops publishing limits per tier.

## D-012: Cache freshness by TTL, not purge: short HTML TTL, immutable hashed assets, no purge step  (2026-09-08, status: accepted)

**Decision.** After a deploy, freshness comes from cache headers rather than
a purge. The origin on plex sends an explicit `Cache-Control` for everything
it serves: a short `max-age` (minutes) for HTML and for files copied
unchanged from `public/`, and `public, max-age=31536000, immutable` for
Astro's content-hashed assets under `_astro/`. The deploy script does not
call the Cloudflare API and no API token lives on the dev box. Hashed assets
from superseded deploys are protected from `rsync --delete` for a grace
period so HTML cached in browsers or at the edge keeps resolving its assets.

**Context.** Chosen by the owner at the 2026-09-08 triage over an automated
purge-everything step and over deferring the call. Checked the same day
against Cloudflare's
[default cache behavior](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/):
the CDN does not cache HTML by default; it caches by file extension (CSS,
JS, fonts, images, and more); it respects origin `Cache-Control`; and for
eligible responses without `Cache-Control` or `Expires` have default edge
TTLs of 120 minutes for 200/206/301, 20 minutes for 302/303, and 3 minutes
for 404/410.
That last point is why the origin must set headers explicitly: an
un-headed CSS or font file would otherwise be served stale for up to two
hours after a deploy, while an un-headed HTML page would be fine. The owner
confirms the devstack.fyi zone is configured to honor origin cache headers
and uses strict origin TLS, so the site is itself an instance of the
service-wide Cloudflare notes it will publish.

**Consequences.** The web server on plex needs a header rule keyed on
`/_astro/` versus everything else; how that rule is expressed (an
`.htaccess` shipped from `public/` if Apache, a server config block if
nginx) waits on the open-question 5 server check and is a toolchain item.
The deploy script uses an rsync protect filter (or a fresh-directory swap)
so `--delete` retains assets from all deploys still within the grace period.
Cleanup must always preserve assets referenced by the current deploy; the
grace period starts when an asset is last removed from the active deploy,
not at its file modification time. This also covers multiple deploys within
one HTML TTL. Choose the grace duration in the M0 toolchain draft to cover
the HTML cache lifetime and a margin for already-open pages. A
deploy becomes visible within the HTML `max-age`, not instantly. If a Cache
Rule caching HTML at the edge is ever enabled in the Cloudflare dashboard,
the origin `max-age` for HTML still bounds staleness.

**Reopen if.** Instant visibility after deploy becomes a requirement, or the
plex server cannot express per-path cache headers.

## D-011: Stale-content policy: 180 days, warn and badge, never fail the build  (2026-09-08, status: accepted)

**Decision.** A service page or product entry counts as stale when its
`lastVerified` date is more than 180 days old at build time. The build prints
a warning naming the entry, and the site shows a visible stale badge on the
service page and on its catalog card. Staleness never fails the build, so a
lapsed service can never block deploying an unrelated change.

**Context.** Chosen by the owner at the 2026-09-08 triage from 90, 180, and
365-day thresholds and from warn-versus-fail. Vendors rename and re-scope
products on roughly a half-year cadence; 90 days would make re-verification
the dominant maintenance cost, 365 would let a renamed product sit for most
of a year. Follows from D-006 (dated claims).

**Consequences.** The catalog status badge has three states: draft and
reviewed are authored in frontmatter; stale is derived from the date and
overrides the display of the other two. The threshold is one constant in the
build, not per-service configuration. Re-verifying a service means an agent
re-checks each cited source and bumps `lastVerified` per entry, so entries
carry their own dates rather than inheriting the page's.

**Reopen if.** The warning is routinely ignored and stale pages ship for
months (then consider failing the build), or vendors in a category churn
much faster or slower than 180 days.

## D-010: Hybrid content model: structured product entries plus MDX prose; categories are a fixed enum  (2026-09-08, status: accepted)

**Decision.** Each service is a content-collection entry with typed
frontmatter (title, slug, category, summary, status, sources, lastVerified)
and an MDX body for the service-wide notes. Each product the service page
documents is a structured record — product name, underlying capability,
local-development equivalent, sources, lastVerified — held in a typed data
collection (or a typed frontmatter array; the schema draft decides which)
and rendered into tables and diagrams by shared components. Categories are a
fixed enum in the schema, initially Cloud Providers (and CDN), Databases,
and Event Buses and Queues, each with a display name and sort order.

**Context.** Open question 1 (content model) and open question 4 (category
field shape), answered by the owner at the 2026-09-08 triage. Fully
free-form MDX would make the stale check and the cross-service index
impossible per product; fully structured content fits the opinionated
service-wide notes poorly. The hybrid keeps the machine-checkable part
structured and the opinionated part prose. A fixed enum stops contributors
from creating near-duplicate categories.

**Consequences.** Adding a category is a deliberate schema edit. Contributors
add a product by adding a record, not by hand-writing a table row, which is
the authoring constraint the owner accepted. The schema is the contract
between content and the shell; changing its required fields is
load-bearing. Enables D-011 stale flagging per entry and the M4+
cross-service index. The schema draft is an M0 plan item.

**Reopen if.** Contributors consistently fight the record format, or a
service's products resist a single capability field.

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
must stay accurate. No mandatory review passes are installed by default.
The 2026-09-08 triage confirmed a PR build check (M1) and CONTRIBUTING.md
(M5); deployment remains manual. The maintainer is the only person who deploys.

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
clean checkout and preview `--delete` before applying it (confirmed in the
2026-09-08 triage). Whether `/var/www/devstack.fyi/` holds anything else is
open question 9 and must be verified before the first deploy. Cache freshness
and hashed-asset retention follow D-012 (answered question 7).

**Reopen if.** A feature genuinely needs a server (unlikely by design), or the
hosting moves off plex.
