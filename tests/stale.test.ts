import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isStale } from '../src/lib/taxonomy.ts';

test('staleness starts after 180 days, not at the boundary', () => {
  const verified = new Date('2026-01-01T00:00:00Z');
  const boundary = verified.getTime() + 180 * 24 * 60 * 60 * 1000;
  assert.equal(isStale(verified, new Date(boundary - 1)), false);
  assert.equal(isStale(verified, new Date(boundary)), false);
  assert.equal(isStale(verified, new Date(boundary + 1)), true);
  assert.equal(isStale(verified, new Date('2025-12-31')), false);
});
