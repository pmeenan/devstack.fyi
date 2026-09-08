# Vision

## What this is

Official service documentation tells you what a product is called and what
its knobs are. It rarely tells you what the product _is_ in terms you already
understand, what to run on your laptop to stand in for it, or which
service-wide settings you must flip before the thing behaves the way a
standards-literate developer expects. That knowledge lives in the heads of
people who have shipped on the service and is usually passed along in chat.

devstack.fyi writes it down. It is a static site of developer-to-developer
implementation notes, one section per service, organized so a developer new to
a service can answer four questions fast:

1. **What is each product, really?** A map from the vendor's product and
   feature names to the underlying capability (the thing you would search for
   if you didn't know the brand name).
2. **What do I use locally?** For each capability, the local-development
   equivalent: an emulator, an open-source stand-in, a vendor CLI dev mode, or
   "nothing, mock it".
3. **What must I configure service-wide?** The cross-cutting settings and
   gotchas — for Cloudflare, things like strict origin TLS and the cache rules
   needed for standards-compliant origin caching.
4. **Will it fit my plan?** The usage limits of each product per applicable
   plan tier, with a link to the official pricing
   page, so a stack can be sized before it is built.

The landing page is a catalog grouped by offering category ("Cloud Providers
(and CDN)", "Databases", "Event Buses", ...); each service has its own path.
Cloudflare at `devstack.fyi/cloudflare` is the first service.

The site is deliberately not corporate: modern tech look, light and dark
themes, neon-accented interactive diagrams, and a lighthearted tone.

## Who it's for

1. **Developers integrating a service for the first time** who need the
   product-name-to-capability decoder and a local setup, primary audience.
2. **Experienced developers on that service** looking for the service-wide
   configuration checklist they half-remember.
3. **Contributors** who have shipped on a service and want a low-friction
   place to record what they learned (pull requests on GitHub).
4. **AI coding agents** working on a project that uses the service; the pages
   are written so an agent can read them as reliable, cited context.

## Success criteria

- A developer who has never used Cloudflare can, from `/cloudflare/` alone,
  name the capability behind each documented product, pick a local-development
  stand-in for it, see its limits on each plan tier, and find the
  service-wide settings the notes recommend.
- Every service page states the official sources it was built from and a
  last-verified date, and a reader can tell from the page how stale it may be.
- The published site is entirely static files: it serves correctly from a
  plain web server with no server-side code, and the deploy is a single
  script the maintainer runs from a Linux machine.
- The site renders correctly, including diagrams, in both light and dark
  themes with no flash of the wrong theme on load, and diagrams remain
  readable with JavaScript disabled (interaction is an enhancement).
- Adding a second service in a different category requires no changes to the
  site shell, only new content and, if needed, new diagram components.
- No analytics, cookies, or tracking; only Cloudflare NEL telemetry is allowed (D-005), and no third-party
  asset requests at all: fonts and scripts are self-hosted (triage
  2026-09-08).

## Non-goals

- **Not a mirror of vendor docs.** The site links to official documentation
  for exhaustive reference; it does not reproduce it. Reason: it would rot
  instantly and add nothing.
- **Not a pricing or vendor comparison site.** Prices change too often to
  maintain and invite marketing disputes; the site links to official pricing
  pages instead. Usage _limits_ per plan tier are in scope (D-013) because
  they decide whether a design works at all. Capability equivalence across
  vendors may come later (see the cross-service index, planned for M4 or
  later, in [features.md](features.md)), pricing will not.
- **No server-side runtime, ever.** No comments system, accounts, forms that
  post anywhere, or serverless functions. Reason: the "no running server"
  constraint is the point of the hosting model.
- **No analytics; only NEL telemetry.** The owner permits Cloudflare
  network-error reporting, while other telemetry remains excluded (D-005).
- **Not a general blog.** Content is organized by service; opinion pieces
  without a service home do not belong here.
