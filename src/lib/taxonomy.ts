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
export const CATEGORY_IDS = Object.keys(CATEGORIES) as [
  CategoryId,
  ...CategoryId[],
];

/** Days since `lastVerified` after which an entry is stale (D-011). */
export const STALE_AFTER_DAYS = 180;

export function isStale(lastVerified: Date, now: Date = new Date()): boolean {
  return (
    now.getTime() - lastVerified.getTime() >
    STALE_AFTER_DAYS * 24 * 60 * 60 * 1000
  );
}
