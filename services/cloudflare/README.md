# Cloudflare working area

M2.1 is complete (2026-09-08): eight developer-platform product records,
local-development options, usage limits, a visual overview and dedicated product
pages with focused diagrams. The owner approved the overview and all eight
pages for now by 2026-09-09. The service stays draft.

[M2.2a](../../docs/plan.md#m22a--cloudflare-topic-landing-page-and-navigation)
is implemented and verified (2026-09-09): `/cloudflare/` is the topic directory,
and `/cloudflare/build/` holds the accepted overview. The eight product URLs,
content, and storage order are preserved. See [areas.md](docs/areas.md) for the
complete scope map and authoring rules. Checks/build and browser navigation
checks pass on all ten routes in both themes at desktop/phone widths, including
keyboard/no-JavaScript switching, old fragments, and internal links under CSP.

Next is owner review of the restructured local preview, then M2.2b delivery
content and the strict-origin-TLS/origin-cache-header notes.

See [research.md](docs/research.md) for dated official sources, plan distinctions,
local-development caveats and the unresolved Durable Objects Free per-object
storage contradiction. `pnpm check` / `pnpm build` and full-CSP browser checks
pass; no vendor resources were provisioned and no deployment was performed.

Published content lives in `content/`; these working files never become pages.
