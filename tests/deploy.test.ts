import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

test('local deployment fixtures exercise transfer, locking and retirement without SSH', () => {
  const result = spawnSync('python3', ['-B', 'tests/deploy_fixtures.py'], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
    timeout: 30_000,
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
