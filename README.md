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
the project documentation, directed and reviewed by a human. Candidate features
still being triaged are listed in [docs/features.md](docs/features.md); nothing
there is product until it is promoted.

## Status

**Pre-code (milestone M0, planning).** The repository currently contains only
the project documentation. The Astro project, deploy script, and first service
content land in M1 and M2.

## License

[Apache-2.0](LICENSE).

## Start here

- [AGENTS.md](AGENTS.md) — rulebook and doc map for agents (and curious humans)
- [docs/vision.md](docs/vision.md) — why this exists, who it is for, success criteria
- [docs/features.md](docs/features.md) — confirmed scope, proposed additions, open questions
- [docs/plan.md](docs/plan.md) — milestones and what "done" means
- [docs/workflow.md](docs/workflow.md) — how agents and the maintainer collaborate
- [docs/rough-edges.md](docs/rough-edges.md) — findings log
