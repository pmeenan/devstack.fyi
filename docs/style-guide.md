# Style guide — Field notes

**Accepted, round 1 · 2026-09-08.** The owner approved both light and dark
themes and this style guide ("Both approved"). M1.2 is complete. M1.3 has applied
this direction to the real shell; later design changes update the guide and
implementation together.

## Visual examples and review

Run `pnpm dev` and open these paths on the local URL printed by Astro:

- `/design/compare/`: matching light/dark specimens side by side above 850px,
  stacked below. Always review both themes in each round.
- `/design/light/` and `/design/dark/`: the same specimen at full viewport width.
- Each specimen contains a catalog card, service heading, section navigation,
  product and limits tables, a code snippet, a callout, status badges, source
  treatment, and a linked SVG request diagram.

The review source is `src/pages/design/[view].astro`, the shared specimen is
`src/components/prototype/Specimen.astro`, and the implemented tokens and rules
are in `src/styles/prototype.css`. The route returns paths only in development;
no specimen HTML or sitemap URLs enter the production build. Fictional Nimbus
content is separate from the content collections. Dates and quotas are explicitly
illustrative. The catalog and Cloudflare shell now use the same accepted direction.

Review the overall density, typography, neon balance, tables, and diagram in
both themes when revising the accepted direction. Use the navigation links to inspect
the lower components, and resize an individual theme to phone width.

## Direction

Practical developer field notes: strong compact headings, a quiet reading
surface, and ruled sections. The bracketed `[ ds ]` wordmark and lime underline
provide identity without images. Use neon sparingly to mark the request path
and identity; keep long-form text neutral. Separate a service from its catalog
with a prominent rule. Tables and code belong close to the explanations.

## Color tokens

All values below match the scoped `.specimen` tokens and production
`src/styles/tokens.css`; production rules live in `src/styles/base.css`.
The review toolbar is separate chrome.

| Token           | Light     | Dark      | Use                                |
| --------------- | --------- | --------- | ---------------------------------- |
| `--bg`          | `#f7f9fc` | `#10141e` | Page                               |
| `--surface`     | `#ffffff` | `#191f2c` | Cards, tables, code, diagram       |
| `--soft`        | `#edf1f7` | `#212a3b` | Table headers, code labels, nodes  |
| `--text`        | `#172033` | `#eef2fa` | Primary text                       |
| `--muted`       | `#526079` | `#a7b4cb` | Secondary text                     |
| `--border`      | `#bdc8d8` | `#53627a` | Decorative separators and surfaces |
| `--accent`      | `#1855cc` | `#96baff` | Links, focus, selected notes       |
| `--accent-soft` | `#e6efff` | `#243451` | Callouts and targeted notes        |
| `--neon`        | `#b5f542` | `#b5f542` | Decorative headline underline      |
| `--green`       | `#17633d` | `#b5f542` | Reviewed badge, flow, strings      |
| `--green-soft`  | `#e3f5e9` | `#283719` | Reviewed badge, compute node       |
| `--amber`       | `#754600` | `#ffd080` | Draft badge                        |
| `--amber-soft`  | `#fff0ce` | `#3e2e16` | Draft background                   |
| `--purple`      | `#743bb5` | `#d4b0ff` | Recheck badge, code keywords       |
| `--purple-soft` | `#f1e8ff` | `#352747` | Recheck background                 |

Lime is decorative on the light page, never small light-theme text. Status
always has a text label; color alone conveys no state. Surface borders are
decorative and must not be used alone to communicate interactive state.

## Typography and spacing

- Self-hosted Inter for prose and headings; JetBrains Mono for code, the
  bracket mark, section labels, and small indices. Use existing licensed fonts.
- Base: 16px at default browser settings, line height 1.6. Intro: 18px. Tables,
  navigation, code, and supporting copy: 14px. Badges and secondary metadata:
  12px. Use rem units so browser font preferences scale the page.
- Catalog heading: 36–64px, line height 1.1, tracking −0.055em. Service heading:
  32–48px. Section headings: 18px. Scale headings with specimen container width.
- Spacing rhythm: 4, 8, 12, 16, 20, 24, 32, 40, 48px. Content max width: 68rem.
  Default content padding: 48px vertically and 32px horizontally; at container
  widths up to 600px use 32px and 20px. Service sections have 40px separation.
- Corners: 4px badges, 6px small surfaces, 8px tables/code/diagrams, 10px cards.
  Use 1px borders; the catalog/service divider is 2px. No resting shadows.

## Components and interaction

- Catalog cards are one semantic link with a heading, description, and text
  status. Hover changes the border and adds a 3px accent shadow without moving
  the content. The decorative service mark disappears in narrow containers.
- Service navigation wraps naturally and links to real section anchors.
  Inline links stay underlined; navigation and card links gain visible hover
  feedback. Do not substitute inert buttons for navigation.
- Tables use captions and scoped headers. Preserve columns in a labeled,
  keyboard-focusable horizontal scroll region below 480px of available space.
  Numbers use tabular figures; unknown limits say “Not published.”
- Code uses a surface-colored block, separate filename header, horizontal
  scrolling, and green strings/purple keywords/blue functions. The specimen
  uses authored spans to review colors; production Prism uses these token colors. Copy controls show success or
  selection instructions on failure; code stays scrollable without JavaScript.
- Callouts use an accent left rule, tinted surface, concise heading and prose.
- Diagrams use hand-authored SVG, surface nodes, 1.5px borders, 2px connectors,
  and real text. Hover/focus emphasizes node outlines; each node links to its
  visible note, and `:target` highlights that note. IDs include the theme so
  paired instances do not interfere. At very narrow widths keep a 448px SVG
  in a focusable scrolling figure to preserve labels. These are native links;
  no client JavaScript is needed. Rich custom-element behavior remains M2.
- Keyboard focus uses a 3px accent outline with 4px offset. Never remove it.
  Native links support keyboard/touch and work with JavaScript disabled.
- Color/shadow transitions are 140ms. Reduced motion sets them to zero and
  disables smooth anchor scrolling. No looping animation or decorative glow.

## Round 1 verification

Checked in headless Chrome on 2026-09-08 at 1440px paired width and individual
1280px / 390px widths in both themes. No document-wide horizontal overflow;
self-hosted Inter and JetBrains Mono load; all internal anchors resolve and
diagram node links select their corresponding note. Reviewed desktop and
phone captures. Contrast measured from rendered CSS values:

| Text / background           | Light ratio | Dark ratio |
| --------------------------- | ----------- | ---------- |
| Primary / page              | 15.42       | 16.41      |
| Muted / page                | 6.02        | 8.80       |
| Muted / soft surface        | 5.60        | 6.88       |
| Link / surface              | 6.54        | 8.45       |
| Reviewed / badge background | 6.41        | 9.76       |
| Draft / badge background    | 7.07        | 9.08       |
| Recheck / badge background  | 5.84        | 7.47       |

`pnpm check` and `pnpm build` pass: zero Astro diagnostics, formatting clean,
381-package license audit, and all five fixture tests. The production build
contains only `/` and `/cloudflare/`; no Nimbus content or design URLs occur
in emitted HTML or sitemaps.

These measured pairs exceed 4.5:1. This is a prototype legibility check, not
full shell accessibility acceptance. Persistent theme switching, real-header
CSP tests, copy feedback, metadata, and comprehensive keyboard/storage checks
belong to M1.3. The owner accepted both themes on 2026-09-08.

## M1.3 shell verification

The real shell uses these tokens with CSS system-theme fallback and a saved
light/dark preference. The 2026-09-08 browser pass covered narrow/wide catalog,
service, 404 and rich temporary fixtures in both themes under the approved
CSP. Product tables preserve readable columns with a 46rem minimum; their
labeled regions scroll independently on phones. Theme/copy controls, keyboard
focus, blocked storage, reduced motion and JavaScript-disabled reading passed.
The shared 1200×630 social card uses the approved typography, colors and
wordmark; its PNG is a browser-rendered typographic asset using the existing
licensed Inter font. Per-service generated cards remain M3.
