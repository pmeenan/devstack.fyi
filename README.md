# devstack.fyi

Read the notes at **[devstack.fyi](https://devstack.fyi/)**.

devstack.fyi is a static site of practical, developer-to-developer
implementation notes: for each service, what the product names actually give
you, what to use as a local-development equivalent, and the service-wide
configuration details that are easy to get wrong. The landing page is a
catalog grouped by offering category (cloud providers and CDNs, databases,
event buses, ...) and each service has its own path. Cloudflare is the first
service being documented.

- **Static and self-hosted.** Built with Astro, served as plain files, no
  analytics or cookies; Cloudflare NEL network-error reporting is allowed.
- **Cited and dated.** Every service page names its official sources and shows
  when it was last verified.
- **Light and dark themes,** with hand-built interactive diagrams and a
  deliberately lighthearted, neon-tinged look.
- **Contributions welcome** via pull requests on
  [GitHub](https://github.com/pmeenan/devstack.fyi); the maintainer reviews,
  commits, and deploys.

Almost all code and first-draft content is written by AI agents working from
the project documentation, directed and reviewed by a human. The confirmed
scope and rejected proposals are recorded in
[docs/features.md](docs/features.md); implementation steps and exit criteria
are in [docs/plan.md](docs/plan.md).

## Status

The site is live. Cloudflare is the first service and is currently an
introductory draft; researched product coverage is next. See the
[plan](docs/plan.md) for scope and progress.

## Contributing

Corrections, practical experience, and source-backed additions are welcome
through [GitHub pull requests](https://github.com/pmeenan/devstack.fyi/pulls).
Service content lives in `services/<slug>/content/`; the adjacent working docs
hold research and authoring guidance. Read that service's `AGENTS.md` before
editing, cite official sources for service claims, and update the relevant
verification dates. The [content schema](docs/content-schema.md) describes
page and product records; `services/_template/` supplies an authoring example.

Preview your changes locally and run `pnpm check` and `pnpm build` before
opening a pull request. The maintainer reviews and publishes accepted changes.

## Local development

Local checks require Git, Bash, Python 3.10+, and rsync, alongside Node
**24.18.1** (see `.node-version`) and pnpm **12.3.4**. Python and rsync run
local deployment fixtures; contributors need no server access.

Set up pnpm:

- With Corepack available: `corepack enable pnpm`, or prefix commands below
  with `corepack` if the shim is not enabled.
- Without Corepack: `npm install --global pnpm@12.3.4` after installing Node.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm build
```

`pnpm dev` starts the local development server and prints its URL.
`pnpm preview` serves the static `dist/` build locally. It does not send the
production CSP/header policy.
The catalog and service pages use the accepted Field notes design. For the
original M1.2 visual specimens, run `pnpm dev` and open `/design/compare/` (both themes),
`/design/light/`, or `/design/dark/`. Narrow comparison views stack the themes;
use the individual views for full-width review. These fictional specimens
are development-only: `pnpm build` emits no design routes or sitemap entries.
The accepted design is documented in [docs/style-guide.md](docs/style-guide.md).

`pnpm check` runs Astro/TypeScript diagnostics, formatting, the installed and
all-platform lockfile license audit, and fixture tests. `pnpm build` generates
static routes, validates content relationships, warns about stale dates, and
checks output for inline scripts/styles and non-self/missing assets.
`pnpm format` applies formatting; `pnpm test` runs the checks' regression tests
and real Astro builds in temporary directories outside the checkout.

The empty `products` and `pages` collections currently produce Astro warnings:
no Cloudflare product research or sub-pages have landed yet. The excluded
fictional `_template` exercises those shapes in temporary build tests.

Dependencies use exact pins and the lockfile. On an upgrade, review package
metadata and reconcile [license evidence](docs/dependency-licenses.md), including
optional packages absent from your platform. The three exact release-age
exceptions in `pnpm-workspace.yaml` match the approved M0 spike; do not disable
the age or build-script approval policies globally. Astro telemetry is disabled
in all project scripts and CI.

## License

[Apache-2.0](LICENSE).

## Start here

- [AGENTS.md](AGENTS.md) — rulebook and doc map for agents (and curious humans)
- [docs/vision.md](docs/vision.md) — why this exists, who it is for, success criteria
- [docs/features.md](docs/features.md) — confirmed scope, proposed additions, open questions
- [docs/plan.md](docs/plan.md) — milestones and what "done" means
- [docs/workflow.md](docs/workflow.md) — how agents and the maintainer collaborate
- [docs/rough-edges.md](docs/rough-edges.md) — findings log
- [docs/hosting.md](docs/hosting.md) — maintainer-only hosting and deployment instructions
