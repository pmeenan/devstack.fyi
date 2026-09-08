# Content schema

> **Status: M0 draft (2026-09-08), verified with a throwaway build but not yet
> in the repo.** The code below becomes `src/content.config.ts` and
> `src/lib/taxonomy.ts` when the Astro project lands in M1; until then this
> file is the contract. Shape decisions are recorded in D-010, D-013, and
> D-014; change the required fields deliberately (see "When to go heavy" in
> [workflow.md](workflow.md)).

The schema is the contract between service content and the site shell
(D-010). It has three collections, all loaded from `services/` with Astro's
`glob()` loader, and one shared taxonomy module.

## Layout on disk

```
services/
  <slug>/                      one directory per service; the name is the URL segment
    AGENTS.md, README.md, docs/    working docs — never rendered (D-008)
    content/
      index.mdx                the service page: typed frontmatter + prose  → /<slug>/
      products/<product>.yaml  one structured record per documented product
      <page>/index.mdx         optional sub-pages                            → /<slug>/<page>/
  _template/                   underscore-prefixed directories are never loaded (RE-003)
```

| Collection | Loader pattern (base `./services`) | Entry id | Rendered as |
| --- | --- | --- | --- |
| `services` | `*/content/index.mdx` | `cloudflare` | `/cloudflare/` |
| `pages` | `*/content/*/**/index.mdx` | `cloudflare/local-dev` | `/cloudflare/local-dev/` |
| `products` | `*/content/products/*.yaml` | `cloudflare/workers` | rows, tables and diagrams on the service page |

Every pattern also carries `!_*/**`. There is no `slug` frontmatter field:
the directory name is the slug and the URL, so the two cannot disagree. A
product belongs to the service whose directory it sits in; the page filters
`products` by id prefix, so no `service` field is needed either.

## Taxonomy module (`src/lib/taxonomy.ts`)

Constants that both the schema and components need, kept free of
`astro:content` so any component can import them.

```ts
/**
 * Catalog categories (D-010). A fixed enum: adding one is a deliberate schema
 * edit here, plus a display name and sort order.
 */
export const CATEGORIES = {
  'cloud-providers': { name: 'Cloud Providers (and CDN)', order: 1 },
  databases: { name: 'Databases', order: 2 },
  'event-buses': { name: 'Event Buses and Queues', order: 3 },
} as const satisfies Record<string, { name: string; order: number }>;

export type CategoryId = keyof typeof CATEGORIES;
export const CATEGORY_IDS = Object.keys(CATEGORIES) as [CategoryId, ...CategoryId[]];

/** Days since `lastVerified` after which an entry is stale (D-011). */
export const STALE_AFTER_DAYS = 180;

export function isStale(lastVerified: Date, now: Date = new Date()): boolean {
  return now.getTime() - lastVerified.getTime() > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}
```

## Collection definitions (`src/content.config.ts`)

```ts
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod'; // not from 'astro:content': deprecated in 7, removed in 8
import { glob } from 'astro/loaders';
import { CATEGORY_IDS } from './lib/taxonomy';

// ---- shared pieces --------------------------------------------------------

/** kebab-case identifier: group ids, tier ids. */
const slugId = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'kebab-case id expected');

/**
 * Calendar date. Frontmatter YAML hands us a Date, data-file YAML a
 * YYYY-MM-DD string; both become a UTC-midnight Date.
 */
const calendarDate = z.union([
  z.date(),
  z.iso.date().transform((s) => new Date(`${s}T00:00:00Z`)),
]);

/** One cited official source (D-006). */
const source = z.strictObject({
  url: z.url(),
  title: z.string().min(1),
  note: z.string().min(1).optional(),
});
const sources = z.array(source).min(1);

// ---- services: one MDX page per service ------------------------------------

const services = defineCollection({
  loader: glob({
    pattern: ['*/content/index.mdx', '!_*/**'],
    base: './services',
    generateId: ({ entry }) => entry.split('/')[0]!,
  }),
  schema: z.strictObject({
    title: z.string().min(1),
    website: z.url(),
    category: z.enum(CATEGORY_IDS),
    summary: z.string().min(1).max(200),
    status: z.enum(['draft', 'reviewed']),
    groups: z
      .array(
        z.strictObject({
          id: slugId,
          name: z.string().min(1),
          summary: z.string().min(1).optional(),
        }),
      )
      .default([]),
    sources,
    lastVerified: calendarDate,
  }),
});

// ---- pages: optional MDX sub-pages under a service -------------------------

const pages = defineCollection({
  loader: glob({
    pattern: ['*/content/*/**/index.mdx', '!_*/**'],
    base: './services',
    generateId: ({ entry }) => entry.replace('/content/', '/').replace(/\/index\.mdx$/, ''),
  }),
  schema: z.strictObject({
    title: z.string().min(1),
    summary: z.string().min(1).max(200),
    order: z.number().int().optional(),
    sources,
    lastVerified: calendarDate,
  }),
});

// ---- products: one YAML record per documented product ----------------------

const localDevOption = z.strictObject({
  kind: z.enum(['vendor', 'open-source', 'mock', 'remote']),
  name: z.string().min(1).optional(),
  summary: z.string().min(1),
  url: z.url().optional(),
});

const limits = z
  .strictObject({
    tiers: z
      .array(
        z.strictObject({
          id: slugId,
          name: z.string().min(1),
          note: z.string().min(1).optional(),
        }),
      )
      .min(1),
    metrics: z.array(
      z.strictObject({
        name: z.string().min(1),
        values: z.record(slugId, z.string().min(1)),
        note: z.string().min(1).optional(),
      }),
    ),
    note: z.string().min(1).optional(),
    sources,
    lastVerified: calendarDate,
  })
  .superRefine((l, ctx) => {
    const tierIds = l.tiers.map((t) => t.id);
    if (new Set(tierIds).size !== tierIds.length) {
      ctx.addIssue({ code: 'custom', path: ['tiers'], message: 'duplicate tier id' });
    }
    if (l.metrics.length === 0 && !l.note) {
      ctx.addIssue({
        code: 'custom',
        path: ['metrics'],
        message: 'no metrics: add a `note` saying the vendor publishes no per-tier limits',
      });
    }
    l.metrics.forEach((m, i) => {
      const keys = Object.keys(m.values);
      for (const k of keys) {
        if (!tierIds.includes(k)) {
          ctx.addIssue({ code: 'custom', path: ['metrics', i, 'values', k], message: `unknown tier "${k}"` });
        }
      }
      for (const t of tierIds) {
        if (!keys.includes(t)) {
          ctx.addIssue({ code: 'custom', path: ['metrics', i, 'values'], message: `missing value for tier "${t}"` });
        }
      }
    });
  });

const products = defineCollection({
  loader: glob({
    pattern: ['*/content/products/*.yaml', '!_*/**'],
    base: './services',
    generateId: ({ entry }) => entry.replace('/content/products/', '/').replace(/\.yaml$/, ''),
  }),
  schema: z.strictObject({
    name: z.string().min(1),
    aliases: z.array(z.string().min(1)).default([]),
    group: slugId.optional(),
    order: z.number().int().optional(),
    docs: z.url(),
    capability: z.string().min(1),
    notes: z.string().min(1).optional(),
    localDev: z.array(localDevOption).min(1),
    limits,
    sources,
    lastVerified: calendarDate,
  }),
});

export const collections = { services, pages, products };
```

## Field reference

All objects are `strictObject`: an unknown key (a typo such as
`lastverified`) fails the build naming the key and file. Every `lastVerified`
is a calendar date; the build never authors "stale", it derives it (D-011).

### `services` (frontmatter of `content/index.mdx`)

| Field | Required | Meaning |
| --- | --- | --- |
| `title` | yes | Display name ("Cloudflare"). |
| `website` | yes | The vendor's home for the service; linked from the catalog card. |
| `category` | yes | One of `CATEGORY_IDS` (D-010). Exactly one per service (D-008). |
| `summary` | yes | One sentence, at most 200 characters, for the catalog card and OpenGraph description. |
| `status` | yes | `draft` or `reviewed`, authored; `stale` is derived and overrides the display of both (D-011). |
| `groups` | no | Ordered list of `{ id, name, summary? }` that products may name in `group`; the page renders products in this order. Cloudflare's four groups from answered question 8 go here. Default empty. |
| `sources` | yes | At least one `{ url, title, note? }` for the service-wide notes (D-006). |
| `lastVerified` | yes | Date the service-wide notes were last checked against the sources. |

The MDX body is the service-wide notes: free prose, diagram components
imported via the `@components/*` alias, and the shared components that render
the product tables (the page template inserts those, so the body does not
have to).

### `pages` (frontmatter of `content/<page>/index.mdx`)

`title`, `summary`, `sources`, `lastVerified` as above, plus optional
`order` for the sub-page list. Sub-pages exist so a service can split off a
long topic (`/cloudflare/local-dev/`); nothing in M1 or M2 requires one.

### `products` (`content/products/<product>.yaml`)

| Field | Required | Meaning |
| --- | --- | --- |
| `name` | yes | The vendor's current product name, as the vendor writes it. |
| `aliases` | no | Former or alternative names. Vendors rename products (D-006 context) and the decoder should still find them. Default empty. |
| `group` | no | Id of one of the service's `groups`. An id the service did not declare fails the build. Ungrouped products render after the groups. |
| `order` | no | Sort key inside its group; ties and unset values sort by `name`. |
| `docs` | yes | The product's official documentation landing page; the product name links here. |
| `capability` | yes | One line saying what the product *is* in generic terms — the phrase someone would search for without knowing the brand (D-010, single field). |
| `notes` | no | A short plain-text gotcha or scope note for the row. Anything longer belongs in the service's MDX prose. |
| `localDev` | yes | At least one option, first is the recommendation. `kind` is `vendor` (a vendor CLI dev mode or emulator), `open-source` (a third-party stand-in), `mock` (stub it yourself), or `remote` (no local equivalent; use a dev account). `name` and `url` optional, `summary` required. |
| `limits` | yes | The per-tier usage limits sub-record (D-013), below. |
| `sources` | yes | Sources for the capability and local-dev claims. |
| `lastVerified` | yes | Date those claims were last checked. |

### `limits` sub-record

| Field | Required | Meaning |
| --- | --- | --- |
| `tiers` | yes | The plan set the product is priced on, in display order: `{ id, name, note? }`. Zone plans (`free`, `pro`, `business`) only where they apply; a product-specific set (Workers: `free`, `paid`) otherwise. Enterprise is not a tier; say "custom" in `note`. |
| `metrics` | yes | One row per limit: `name`, `values` keyed by tier id (every tier present, extra keys rejected), optional `note`. Values are strings as the vendor states them ("100,000 / day", "Unlimited", "n/a"). |
| `note` | no | Free text under the table, for example the Enterprise disclaimer. Required when `metrics` is empty, to say the vendor publishes no per-tier limits. |
| `sources` | yes | The official pricing or limits page (D-013). |
| `lastVerified` | yes | Own date, because limits churn on a different cadence than capability text; the stale check applies to it separately (D-011). |

Values are strings, not numbers, on purpose: limits mix units, "unlimited",
and footnotes, and the site never computes on them. No prices, ever (D-013).

## Authoring example

A fictional vendor, so nothing here is a service claim. The `_template`
service directory carries this example in the repo (M1) for contributors to
copy; it is excluded from the build by the `!_*/**` pattern.

`services/example/content/index.mdx`:

```mdx
---
title: Example Cloud
website: https://example.com/
category: cloud-providers
summary: A fictional provider used to exercise the content schema.
status: draft
groups:
  - id: compute
    name: Compute
  - id: storage
    name: Storage
sources:
  - url: https://example.com/docs/
    title: Example Cloud docs
lastVerified: 2026-09-08
---

import Diagram from '@components/Diagram.astro';

## Service-wide notes

Free MDX prose lives here.
```

`services/example/content/products/widgets.yaml`:

```yaml
name: Widgets
aliases: [Widget Functions]
group: compute
order: 1
docs: https://example.com/docs/widgets/
capability: Serverless functions that run at the edge.
localDev:
  - kind: vendor
    name: example dev
    summary: The vendor CLI runs Widgets locally.
    url: https://example.com/docs/widgets/local/
  - kind: mock
    summary: Stub the handler in tests.
limits:
  tiers:
    - id: free
      name: Free
    - id: paid
      name: Paid
  metrics:
    - name: Requests
      values: { free: "100,000 / day", paid: "Unlimited" }
    - name: CPU time per request
      values: { free: "10 ms", paid: "30 s" }
      note: Configurable up to the cap.
  note: Enterprise limits are custom.
  sources:
    - url: https://example.com/pricing/widgets/
      title: Widgets pricing
  lastVerified: 2026-09-08
sources:
  - url: https://example.com/docs/widgets/
    title: Widgets docs
lastVerified: 2026-09-08
```

## What the build derives

- **URLs** from entry ids: `/<service>/` and `/<service>/<page>/`, with
  `trailingSlash: 'always'` (answered question 5).
- **Products per service** by id prefix; **grouping** from the service's
  `groups`, with an undeclared `group` id thrown as a build error from the
  page template (a correctness error, unlike staleness).
- **Stale** per service, per sub-page, per product, and per product `limits`
  block: `isStale(lastVerified)` against `STALE_AFTER_DAYS`. The catalog page
  runs one pass over every entry at build time and prints one warning per
  stale entry naming its id; badges read the same function. Never fails the
  build (D-011).
- **Catalog order**: categories by `CATEGORIES[*].order`, services by
  `title` within a category.

## Verified 2026-09-08

Run in a throwaway project in the session scratchpad on the same toolchain
as the content-layer spike (Astro 7.3.1, `@astrojs/mdx` 8.0.0, TypeScript
6.0.3; see [architecture.md](architecture.md)), not from training knowledge:

- Astro 7 ships zod 4.5.4. `import { z } from 'astro:content'` still works
  but `astro check` reports it deprecated ("will be removed in Astro 8. Use
  `import { z } from 'astro/zod'` instead"). The draft uses `astro/zod` and
  zod 4 idioms (`z.url()`, `z.iso.date()`, `z.strictObject()`, two-argument
  `z.record()`).
- The `glob()` loader reads `.yaml` data entries with a custom `generateId`;
  `*/content/*/**/index.mdx` matches sub-pages without matching the root
  `index.mdx`; `!_*/**` excludes `_template` from all three collections.
- `astro check` passes with 0 errors, 0 warnings, 0 hints under
  `astro/tsconfigs/strict`, including a page that groups products, renders
  the limits table by tier id, and throws on an unknown group.
- `astro build` produces `/example/`, `/example/local-dev/`, and the catalog,
  and prints `[stale] product example/buckets` and `[stale] limits
  example/buckets` for a record dated 2026-02-01.
- Each of these fails the build with the file path and a field message: an
  unrecognized key, an unknown tier id in `values`, a missing tier value, a
  non-ISO date (`2026-9-8`), a bare-domain `docs` URL, and an undeclared
  `group`.

## Open points for the owner

- **Per-product `status`.** Not included: the service-level `draft` /
  `reviewed` covers review state, and a product added mid-research can stay
  in a pull request. Add a product-level field if partially-reviewed pages
  turn out to need row-level badges.
- **Capability taxonomy for the M4 cross-service index.** `capability` is a
  free sentence today. The index will need a shared key (for example
  `edge-functions`) per product; add it as an optional `capabilityId` enum
  when the third service is planned, not before.
