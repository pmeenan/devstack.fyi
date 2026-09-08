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

Where a bullet below leans on a `proposed` features.md row, it is a design
assumption to confirm during feature triage, not settled scope.

- **Repository layout (candidate):**

  | Path | Purpose |
  | --- | --- |
  | `src/pages/` | Landing catalog, `[service]/` routes, 404 |
  | `src/layouts/` | Site shell (header, theme toggle, footer with GitHub links) |
  | `src/components/` | UI pieces; `diagrams/` for the SVG component library |
  | `src/styles/` | Design tokens (colors per theme, neon accents), base styles |
  | `src/content.config.ts` | Collection definitions and schemas |
  | `services/<slug>/` | Per-service working docs and, pending open question 2, the service's MDX content |
  | `scripts/deploy.sh` | Build + rsync to plex |
  | `public/` | Static assets copied verbatim (favicons, robots.txt) |

- **Content model.** A `services` collection where each entry has frontmatter
  at least: `title`, `slug`, `category`, `summary`, `status`
  (draft/reviewed), `sources[]` (URL + optional title), `lastVerified`
  (date). Whether products are structured records inside the entry or
  free-form MDX sections is open question 1; the structured-entries row is
  `proposed`.
- **Categories.** Either a fixed enum in the schema (safer: typos fail the
  build) or a separate `categories` collection with display order and blurb.
  The initial list comes from the owner (open question 4).
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
  first (proposed) and an optional Cloudflare purge (proposed, open
  question 7). Stop before rsync if installation or the build fails; never
  publish stale or partial output from a failed build. Long cache TTLs apply
  only to content-hashed asset URLs. Files in `public/` are copied unchanged,
  so HTML and unversioned assets need revalidation or an explicit cache policy.
  Verified 2026-09-08 against the official
  [Astro project structure docs](https://docs.astro.build/en/basics/project-structure/#public).
- **URLs.** One directory per service (`/cloudflare/index.html`), with
  sub-pages allowed under it (`/cloudflare/local-dev/`). Trailing-slash policy
  is open question 5.
- **Contribution surface.** "Edit this page" links point at the MDX source
  on GitHub; a build check on pull requests is `proposed`.

## Open architecture questions

See the numbered list in [features.md](features.md#open-questions-answer-during-m0);
questions 1, 2, 3, and 5 are the architecture-blocking ones. Purely technical
additions:

- Does Astro's MDX pipeline let a diagram component be used inside service
  MDX without shipping a framework runtime, and what is the authoring
  ergonomics for contributors? (Answer alongside the open question 2 spike.)
- How are per-service working docs kept out of the build while living beside
  the content? (Loader glob patterns versus a separate top-level directory.)
