# devstack.fyi

Developer-focused notes for various platforms and services.

devstack.fyi is a static site of practical, developer-to-developer
implementation notes: for each service, what the product names actually give
you, what to use as a local-development equivalent, and the service-wide
configuration details that are easy to get wrong. The landing page is a
catalog grouped by offering category (cloud providers and CDNs, databases,
event buses, ...) and each service has its own path. Cloudflare is the first
service being documented.

- **Static and self-hosted.** Built with Astro, served as plain files, no
  analytics, no cookies, nothing that phones home.
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

**M0 complete; M1 in progress.** The owner approved the plan on 2026-09-08.
M1.1 is complete: the static Astro foundation, a clearly marked Cloudflare
draft, and passing local install/check/build and fixture tests. The first
hosted PR check remains pending an actual PR.
The next step is M1.2: iterate on light/dark prototypes and agree on a style
guide before implementing the full shell. Product research is M2; the deploy
script and reference nginx configuration arrive in M1.4.

## Local development

Install Node **24.18.1** (see `.node-version`). Use pnpm **12.3.4**:

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
production CSP/header policy; full browser/header validation is M1.3/M1.4.
The current pages are a minimal foundation, not the accepted visual design.

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

Deployment remains manual and human-run; no deployment command exists yet.
M1.4 will add `pnpm run deploy` and `pnpm run deploy --dry-run` alongside the tested
deployment script.

## License

[Apache-2.0](LICENSE).

## Start here

- [AGENTS.md](AGENTS.md) — rulebook and doc map for agents (and curious humans)
- [docs/vision.md](docs/vision.md) — why this exists, who it is for, success criteria
- [docs/features.md](docs/features.md) — confirmed scope, proposed additions, open questions
- [docs/plan.md](docs/plan.md) — milestones and what "done" means
- [docs/workflow.md](docs/workflow.md) — how agents and the maintainer collaborate
- [docs/rough-edges.md](docs/rough-edges.md) — findings log
