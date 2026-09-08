import { defineCollection } from 'astro:content';
import { z } from 'astro/zod'; // not from 'astro:content': deprecated in 7, removed in 8
import { glob } from 'astro/loaders';
import { CATEGORY_IDS } from './lib/taxonomy';

// ---- shared pieces --------------------------------------------------------

/** kebab-case identifier: group ids, tier ids. */
const slugId = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'kebab-case id expected');

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
    generateId: ({ entry }) =>
      entry.replace('/content/', '/').replace(/\/index\.mdx$/, ''),
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
      ctx.addIssue({
        code: 'custom',
        path: ['tiers'],
        message: 'duplicate tier id',
      });
    }
    if (l.metrics.length === 0 && !l.note) {
      ctx.addIssue({
        code: 'custom',
        path: ['metrics'],
        message:
          'no metrics: add a `note` saying the vendor publishes no per-tier limits',
      });
    }
    l.metrics.forEach((m, i) => {
      const keys = Object.keys(m.values);
      for (const k of keys) {
        if (!tierIds.includes(k)) {
          ctx.addIssue({
            code: 'custom',
            path: ['metrics', i, 'values', k],
            message: `unknown tier "${k}"`,
          });
        }
      }
      for (const t of tierIds) {
        if (!keys.includes(t)) {
          ctx.addIssue({
            code: 'custom',
            path: ['metrics', i, 'values'],
            message: `missing value for tier "${t}"`,
          });
        }
      }
    });
  });

const products = defineCollection({
  loader: glob({
    pattern: ['*/content/products/*.yaml', '!_*/**'],
    base: './services',
    generateId: ({ entry }) =>
      entry.replace('/content/products/', '/').replace(/\.yaml$/, ''),
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
