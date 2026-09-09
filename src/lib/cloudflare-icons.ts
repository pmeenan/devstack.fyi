import type { IconKind } from './diagram';

export const cloudflareIcons = {
  workers: 'compute',
  pages: 'browser',
  kv: 'keys',
  r2: 'bucket',
  d1: 'database',
  'durable-objects': 'object',
  queues: 'queue',
  workflows: 'workflow',
} satisfies Record<string, IconKind>;
