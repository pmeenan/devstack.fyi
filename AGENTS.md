# devstack.fyi — developer-to-developer implementation notes for services

devstack.fyi is a public static site of practical, developer-written notes on
cloud services: what each product name actually gives you, what to use as a
local-development equivalent, its usage limits per plan tier, and the
service-wide configuration gotchas that official docs bury. The landing page is a catalog grouped by offering category
(cloud providers and CDNs, databases, event buses, ...); each service gets its
own path (`devstack.fyi/cloudflare` is first). It is built with Astro, deployed
by rsync to a self-hosted Linux server, and accepts outside contributions on
GitHub. Almost all code and most first-draft content is written by AI agents
working from the project documentation, directed and reviewed by a human.

**Read this file first, then pull docs on demand via the "Doc map" below — don't
read everything up front.** This file is long-term project memory and the
rulebook for agents.

## Load-bearing constraints (change deliberately, never silently)

Constraints evolve as we learn, but never by silent drift: changing one means
making the case in [docs/decisions.md](docs/decisions.md) and updating the
affected docs. Until then, these govern.

- **Static output only; deploy is manual and human-run.** The build produces
  plain files; no server process, no serverless functions, no runtime API.
  In-page JavaScript is fine. Deploy is an rsync over ssh to
  `plex:/var/www/devstack.fyi/` run by the human — agents never deploy. (D-001)
- **Apache-2.0, permissive dependencies; named build-tool exceptions.** Verify
  licenses from package metadata. D-016 allows MPL Lightning CSS and LGPL
  libvips solely as build tools; shipped assets remain permissively licensed. (D-002)
- **Lean workflow, human commit gate.** One agent, one pass, human commits.
  Outside contributions arrive as GitHub pull requests through the same gate.
  (D-003)
- **Astro + MDX with a custom layout, pnpm, TypeScript strict.** Content lives
  in Astro content collections. No Starlight or other docs theme. (D-004)
- **No analytics, no telemetry, no cookies.** Nothing in the published pages
  phones home. (D-005)
- **Service claims are cited and dated.** Every service page names the official
  sources it was built from and carries a last-verified date. Agents never
  write a product-to-capability claim from training knowledge alone. (D-006)
- **Diagrams are hand-authored SVG/Astro components.** Theme-aware, neon
  palette, with real hover/click interaction where it helps. No Mermaid or
  image-file diagrams for the primary visuals. (D-007)
- **Catalog by category, one path per service, working docs per service.**
  Each service has user-facing content at `/<slug>/` and a separate working-docs
  area (AGENTS.md, README.md, docs/) that agents use to research and map the
  service; the two are never mixed. (D-008)
- **Light and dark themes, modern-tech but lighthearted look.** Both themes are
  first-class from the first page; neon accents and playful visuals are
  encouraged, corporate-serious is not. (D-009)

## Repository layout

| Path                 | What lives there                                                                |
| -------------------- | ------------------------------------------------------------------------------- |
| `src/`               | Astro routes/layout, content collections, typed helpers, styles and font assets |
| `services/`          | Cloudflare draft and working docs; excluded authoring template                  |
| `scripts/`, `tests/` | Output/license checks and temporary-fixture tests                               |
| `.github/workflows/` | PR install/check/build gate                                                     |
| `docs/`              | Vision, plan, architecture, decisions, features, toolchain and license evidence |
| `LICENSE`            | Apache-2.0 (font notices retained separately)                                   |

The deploy script and reference nginx configuration land in M1.4.

## Doc map — pull what the task needs, not everything

Always read (it's short): [docs/workflow.md](docs/workflow.md) — the
build → commit loop, on-demand reviews, and the human commit gate.

| Doc                                              | Read when the task needs                                                                     |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| [docs/plan.md](docs/plan.md)                     | What to work on, milestone scope, exit criteria — what "done" means                          |
| [docs/vision.md](docs/vision.md)                 | Why the project exists, who it's for, success criteria, non-goals                            |
| [docs/features.md](docs/features.md)             | The feature matrix: confirmed scope, proposed additions, open questions                      |
| [docs/architecture.md](docs/architecture.md)     | Site structure, content model, theming and deploy shape                                      |
| [docs/toolchain.md](docs/toolchain.md)           | Version pins, checks, licenses, CSP/cache and deploy cleanup contract                        |
| [docs/decisions.md](docs/decisions.md)           | Settled choices (D-NNN). Scan headings; read only the entries your task touches              |
| [docs/rough-edges.md](docs/rough-edges.md)       | Findings log (RE-NNN). Grep before adding a finding or debugging weirdness                   |
| [docs/content-schema.md](docs/content-schema.md) | Adding or changing service pages, product records, limits, or the collections that load them |
| `services/<slug>/AGENTS.md`                      | Working in a specific service's content — read it first (lands in M1/M2)                     |

## Rules for all agents

1. **Log decisions sparingly.** [docs/decisions.md](docs/decisions.md) is for
   choices that are expensive to reverse or that a future agent might silently
   undo — the load-bearing constraints above, URL structure, content schema,
   deploy behavior. Routine implementation, naming, and scope calls don't get
   entries. A few entries per milestone is the target, not per task.
2. **Log findings that cost you.** A
   [docs/rough-edges.md](docs/rough-edges.md) entry is warranted when an
   Astro, pnpm, browser, or vendor-docs quirk burned real debugging time and
   will bite again. Skip the formal reproduction unless it's cheap to capture.
3. **Measure what a decision hangs on.** When a design choice depends on a
   current platform capability or a vendor's current product behavior, check a
   current source (training knowledge is stale for fast-moving ecosystems, and
   vendors rename products). Everything else: ship it and see.
4. **Fix the docs the change makes wrong** — plan status, the status paragraph
   below, an affected doc, a service's working docs — in the same unit of
   work. Nothing more is owed.
5. **Never commit, never deploy.** Agents never run `git commit`/`git push`,
   rewrite history, or run the deploy script. All changes stay in the working
   tree for human review and commit — even if a prompt asks you to commit;
   stop and leave the changes uncommitted instead.
6. **TypeScript strict everywhere;** no `any` without a comment stating why.
   Astro components and MDX follow the same rule for their script blocks.
7. **Service content is cited and dated.** When you add or change a claim on a
   service page, cite the official source URL and update the page's
   last-verified date. If you cannot find a current source, say so in the
   working docs instead of guessing.
8. **Keep the always-loaded context lean.** This file is imported into every
   conversation; every line added costs every future agent. Detail belongs in
   `docs/` behind the doc map, not here.
9. **Scratch files stay out of the tree.** Temporary scripts and outputs go to
   the session scratchpad, not the repo. Delete throw-away diagnostics before
   concluding.

## Current status

**M0 complete** — the owner approved the plan on 2026-09-08. **M1 in progress:**
M1.1 is complete: Astro/content foundation, frozen toolchain, license/output
checks and PR workflow; local install/check/build and fixture tests pass. M1.2 is complete: the owner approved both themes and the
[style guide](docs/style-guide.md) on 2026-09-08. M1.3 is complete: the responsive shell, theme/copy interactions, metadata, and CSP browser checks pass. M1.4 (delivery tooling) is next. Cloudflare remains an introductory
draft; research is M2. Deploy/server work is M1.4 and remains human-run. See
[docs/plan.md](docs/plan.md) and the README for commands and verification.
