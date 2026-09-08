# Architecture

> **Status: skeleton.** The first full draft is an M0 exit criterion; what is
> written here now is the load-bearing shape already settled, so drafting can
> build on it rather than re-derive it.

## Fixed points (from decisions)

- **Build output is static files.** Astro builds to `dist/`; nothing in
  `dist/` requires a server process, serverless function, or runtime API.
  In-page JavaScript is allowed for interaction. (D-001)
- **Deploy is rsync over ssh** from a Linux dev machine to
  `plex:/var/www/devstack.fyi/`, run by the human via a script in the repo.
  The site is fronted by Cloudflare. (D-001)
- **Astro + MDX, custom layout, pnpm, TypeScript strict.** Content lives in
  Astro content collections; no docs theme. (D-004)
- **No third-party runtime behavior.** No analytics, telemetry, or cookies.
  (D-005)
- **Every service page carries source citations and a last-verified date**
  as first-class fields, not prose. (D-006)
- **Diagrams are SVG/Astro components,** theme-aware, with interaction as an
  enhancement over a readable static rendering. (D-007)
- **Two content planes per service:** user-facing pages at `/<slug>/` and
  working docs (AGENTS.md, README.md, docs/) that are never rendered. The
  catalog groups services by an offering category. (D-008)
- **Light and dark themes** are both first-class. (D-009)

## Expected shape (to be validated in the M0 draft)

The 2026-09-08 feature triage settled the scope these bullets lean on
(D-010 content model, D-011 stale policy, D-012 cache policy); what remains
to validate is the mechanism, not the intent.

- **Repository layout (candidate):**

  | Path | Purpose |
  | --- | --- |
  | `src/pages/` | Landing catalog, `[service]/` routes, 404 |
  | `src/layouts/` | Site shell (header, theme toggle, footer with GitHub links) |
  | `src/components/` | UI pieces; `diagrams/` for the SVG component library |
  | `src/styles/` | Design tokens (colors per theme, neon accents), base styles |
  | `src/content.config.ts` | Collection definitions and schemas |
  | `services/<slug>/` | Per-service working docs (`AGENTS.md`, `README.md`, `docs/`) beside the service's rendered MDX in `content/` (open question 2, answered by the spike below) |
  | `scripts/deploy.sh` | Build + rsync to plex |
  | `public/` | Static assets copied verbatim (favicons, robots.txt) |

- **Content model (D-010, hybrid).** A `services` collection where each
  entry has frontmatter at least: `title`, `slug`, `category`, `summary`,
  `status` (draft/reviewed; "stale" is derived, never authored), `sources[]`
  (URL + optional title), `lastVerified` (date). Products are structured
  records — name, capability, local-development equivalent, sources,
  lastVerified, and a `limits` sub-record (tier set, one entry per tier,
  pricing/limits URL, its own lastVerified; D-013) — kept in a data collection (or a typed frontmatter array;
  the schema draft decides) and rendered into tables and diagrams. The
  service-wide notes are free MDX prose. Stale flagging (D-011) compares
  every `lastVerified` against a 180-day threshold at build time, warns, and
  drives the badge.
- **Categories.** A fixed enum in the schema (D-010) with a display name and
  sort order per value. Initial values: Cloud Providers (and CDN), Databases,
  Event Buses and Queues.
- **Theming.** CSS custom properties for every color; `data-theme` on
  `<html>` set by a tiny inline script before first paint from
  `localStorage` falling back to `prefers-color-scheme`; a toggle in the
  header. Diagram components consume the same tokens so they invert cleanly.
- **Diagrams.** Astro components emitting inline SVG with a shared neon
  palette; hover/click behavior via a small vanilla `<script>` unless open
  question 3 lands on an island framework. Static rendering must be readable
  without JavaScript.
- **Deploy script.** `pnpm install --frozen-lockfile`, `pnpm build`, then
  `rsync -az --delete dist/ plex:/var/www/devstack.fyi/`, with a dry-run
  first. No Cloudflare purge step (D-012). Stop before rsync if installation
  or the build fails; never publish stale or partial output from a failed
  build. Cache policy per D-012: long immutable TTLs only for content-hashed
  asset URLs; short TTL for HTML and for files copied unchanged from
  `public/`; previous deploys' hashed assets are protected from `--delete`
  for a grace period so cached HTML keeps resolving. Where the
  `Cache-Control` headers are set depends on the plex server type (open
  question 5). The devstack.fyi Cloudflare zone honors origin cache headers
  and uses strict origin TLS (owner, 2026-09-08), so origin headers are the
  whole cache policy. `public/` copy behavior verified 2026-09-08 against the
  official
  [Astro project structure docs](https://docs.astro.build/en/basics/project-structure/#public).
- **URLs.** One directory per service (`/cloudflare/index.html`), with
  sub-pages allowed under it (`/cloudflare/local-dev/`). Trailing-slash policy
  is open question 5.
- **Contribution surface.** "Edit this page" links point at the MDX source
  on GitHub; GitHub Actions runs `pnpm check` and `pnpm build` on pull
  requests (no deploy).

## Content-layer spike (2026-09-08)

Verified by building a throwaway project in the session scratchpad, not from
training knowledge. Versions: the spike ran Astro 7.3.1 and `@astrojs/mdx`
8.0.0; the npm registry showed Astro 7.3.2 and `@astrojs/mdx` 8.0.1 as
latest the same day (both MIT). Astro requires Node 22.12 or newer (package
`engines`; confirmed by the
[v6 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v6/), which
dropped Node 18 and 20). Astro 6.0 (2026-03-10) removed the legacy
`src/content/` collections: every collection now needs a `loader`, config
lives in `src/content.config.ts`, and MDX is rendered with `render(entry)`
imported from `astro:content`
([content collections guide](https://docs.astro.build/en/guides/content-collections/)).
Astro 7.0 (2026-06-22) switched the default Markdown processor for `.md`
*and* `.mdx` to Sätteri; the remark/rehype pipeline is opt-in via
`@astrojs/markdown-remark` (an optional peer dependency) and
`markdown.processor: unified()`
([v7 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v7/),
[Markdown guide](https://docs.astro.build/en/guides/markdown-content/)).
The spike used the default and needed no remark plugins; revisit only if a
diagram or table feature demands a rehype plugin.

**Co-located layout works.** A `services` collection defined as
`glob({ pattern: ['*/content/**/*.mdx', '!_*/**'], base: './services' })`
loaded `services/cloudflare/content/index.mdx` and
`services/cloudflare/content/local-dev/index.mdx` with `base` pointing at a
top-level directory outside `src/`, and the build produced
`/cloudflare/index.html` and `/cloudflare/local-dev/index.html`. The working
docs (`services/cloudflare/AGENTS.md`, `services/cloudflare/docs/*.md`) never
reached `dist/` because the pattern only matches under `content/`. Two
details the docs do not spell out
([loader reference](https://docs.astro.build/en/reference/content-loader-reference/)):
the default entry id includes the `content/` segment (`cloudflare/content`),
so the collection needs a `generateId` that maps
`<slug>/content/<path>/index.mdx` to `<slug>/<path>`; and an
underscore-prefixed directory such as `services/_template/` is **not**
skipped automatically (the spike rendered `/_template/` until the `!_*/**`
negative pattern was added; the loader passes negative patterns through as
ignores).

**Diagram components in MDX ship no framework.** The MDX body imported an
Astro component (`import Diagram from '../../../src/components/Diagram.astro'`)
that emits inline SVG plus a vanilla `<script>`; the output was three HTML
files and zero `.js` files, with the script inlined as a `<script
type="module">` in the page. This answers the "framework runtime" half of
open question 3: the vanilla-script path adds no framework runtime, but the
interaction script still contributes HTML bytes and browser execution work.
Zero external `.js` files is a result of this small spike, not a guarantee:
[Astro automatically inlines sufficiently small scripts](https://docs.astro.build/en/guides/client-side-scripts/#script-processing),
and larger scripts can produce separate assets. The
relative import path is the authoring wart; a tsconfig `paths` alias
(`@components/*` → `src/components/*`) was verified to work inside MDX with
both `astro build` and `astro check`, so contributors write
`import Diagram from '@components/Diagram.astro'`.

**Toolchain findings that will bite in M1** (details in
[rough-edges.md](rough-edges.md)): `typescript@latest` now resolves to
7.0.2, whose native compiler lacks the API `astro check` needs, so
TypeScript must be pinned to 6.x (6.0.3 passed `astro check` with 0 errors;
5.9.3 also works). pnpm 12.3.4 (via corepack 0.35.0) refuses to install
esbuild's postinstall script unless `allowBuilds` in `pnpm-workspace.yaml`
approves it; `strictDepBuilds` defaults to true, and the old
`onlyBuiltDependencies` key was removed in pnpm 11
([pnpm build settings](https://pnpm.io/settings/build)).

## Open architecture questions

See the question list in [features.md](features.md#open-questions);
questions 3 and 5 are the architecture-blocking ones still open (question 1
was answered by D-010, question 2 by the content-layer spike above). The two
purely technical questions that rode along with the spike (diagram components
in MDX without a framework runtime; keeping working docs out of the build)
are answered in that section.
