import type { loadContent } from './content';
import { isStale } from './taxonomy';

/** Called only by the catalog: one warning per entry/block per build. */
export function warnStale(
  content: Awaited<ReturnType<typeof loadContent>>,
  now = new Date(),
) {
  for (const [kind, entries] of [
    ['service', content.services],
    ['page', content.pages],
    ['product', content.products],
  ] as const) {
    for (const entry of entries) {
      if (isStale(entry.data.lastVerified, now))
        console.warn(`[stale] ${kind} ${entry.id}`);
    }
  }
  for (const product of content.products) {
    if (isStale(product.data.limits.lastVerified, now))
      console.warn(`[stale] limits ${product.id}`);
  }
}
