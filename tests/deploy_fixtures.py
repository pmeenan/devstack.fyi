"""Temporary local fixtures only. Never execute scripts/deploy.sh or contact plex."""

import contextlib
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import deploy
import deploy_remote as remote


class Fixtures(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='devstack-delivery-test-')
        self.base = Path(self.temporary.name)
        self.root = self.base / 'www'
        self.source = self.base / 'dist'
        self.ledger = self.base / 'state/retired-assets.json'
        for root in [self.root, self.source]:
            (root / '_astro/fonts').mkdir(parents=True)
        self.now = 1_800_000_000
        self.put(self.source, 'index.html', 'NEW PAGE')
        self.put(self.source, '404.html', 'NOT FOUND')
        self.put(self.source, '_astro/current.js', 'new')
        self.put(self.root, 'index.html', 'OLD PAGE')
        self.put(self.root, 'obsolete/index.html', 'obsolete')
        self.put(self.root, '_astro/old.js', 'old')
        self.put(self.root, '_astro/fonts/old.woff2', 'font')

    def tearDown(self):
        self.temporary.cleanup()

    def put(self, root, name, content):
        path = root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
        return path

    def manifest(self):
        return {name: info['sha256'] for name, info in remote.inventory(self.source).items()
                if name.startswith('_astro/') and info['kind'] == 'file'}

    def session(self):
        return remote.Session(self.root, self.ledger, self.manifest(), lambda: self.now)

    def transfer(self, dry_run=False):
        commands = deploy.transfer_commands(self.source, str(self.root) + '/', dry_run)
        for i, command in enumerate(commands):
            subprocess.run(command, check=True, capture_output=True)
            if i == 0 and not dry_run:
                self.assertEqual((self.root / 'index.html').read_text(), 'OLD PAGE')
                self.assertEqual((self.root / '_astro/current.js').read_text(), 'new')

    def apply(self):
        with remote.site_lock(self.root):
            session = self.session()
            session.begin(session.preview()['token'])
            self.transfer()
            return session.finish()

    def test_retirement_grace_rollback_and_restart(self):
        result = self.apply()
        self.assertEqual(result['retired']['_astro/old.js'], self.now)
        self.assertFalse((self.root / 'obsolete').exists())
        self.assertTrue((self.root / '_astro/fonts/old.woff2').exists())
        self.now += remote.GRACE - 1
        self.put(self.root, 'index.html', 'OLD PAGE')
        self.apply()
        self.assertTrue((self.root / '_astro/old.js').exists())
        # Reactivation removes retirement, including at the old expiry boundary.
        self.put(self.source, '_astro/old.js', 'old')
        self.now += 1
        self.put(self.root, 'index.html', 'OLD PAGE')
        self.apply()
        self.assertNotIn('_astro/old.js', remote.read_ledger(self.ledger))
        self.assertFalse((self.root / '_astro/fonts/old.woff2').exists())
        (self.source / '_astro/old.js').unlink()
        self.now += 5
        self.put(self.root, 'index.html', 'OLD PAGE')
        self.apply()
        self.assertEqual(remote.read_ledger(self.ledger)['_astro/old.js'], self.now)
        self.now += remote.GRACE
        self.put(self.root, 'index.html', 'OLD PAGE')
        self.apply()
        self.assertFalse((self.root / '_astro/old.js').exists())
        self.assertTrue((self.root / '_astro/current.js').exists())

    def test_missing_and_corrupt_ledger(self):
        self.apply()
        self.ledger.unlink()
        self.now += remote.GRACE * 2
        self.put(self.root, 'index.html', 'OLD PAGE')
        self.apply()
        self.assertEqual(remote.read_ledger(self.ledger)['_astro/old.js'], self.now)
        for content in ['oops', '{"version":1,"retired":{"../x":0}}',
                        '{"version":1,"retired":{"_astro/old.js":false}}',
                        '{"version":1,"retired":{},"retired":{}}']:
            self.ledger.write_text(content)
            before = remote.inventory(self.root)
            with self.assertRaises((ValueError, json.JSONDecodeError)):
                self.session()
            self.assertEqual(before, remote.inventory(self.root))

    def test_dry_run_stale_preview_and_lock(self):
        before = remote.inventory(self.root)
        with remote.site_lock(self.root):
            session = self.session()
            preview = session.preview()
            self.assertEqual(preview['retired']['_astro/old.js'], self.now)
            self.transfer(dry_run=True)
            self.assertEqual(before, remote.inventory(self.root))
            self.assertFalse(self.ledger.parent.exists())
            with self.assertRaises(BlockingIOError):
                with remote.site_lock(self.root):
                    pass
            self.put(self.root, 'index.html', 'changed outside the lock')
            with self.assertRaisesRegex(ValueError, 'Stale preview'):
                session.begin(preview['token'])
        with remote.site_lock(self.root):
            pass  # released on exit
        session = self.session()
        remote.atomic_ledger(self.ledger, {})
        with self.assertRaisesRegex(ValueError, 'Stale preview'):
            session.begin(session.preview()['token'])

    def test_paths_symlinks_and_missing_upload(self):
        for name in ['_astro/../x', '/_astro/a', '_astro//a', '_astro/a/./b',
                     '_astro/a\\b', '_astro/a\nb', 'index.html']:
            with self.assertRaises(ValueError):
                remote.validate_manifest({name: '0' * 64})
        # Legal shell metacharacters stay data; they must never execute.
        self.put(self.source, '_astro/$(touch SHOULD_NOT_EXIST).js', 'literal')
        self.apply()
        self.assertTrue((self.root / '_astro/$(touch SHOULD_NOT_EXIST).js').exists())
        for location in [self.root / '_astro/link', self.base / 'linked-root']:
            location.symlink_to(self.source, target_is_directory=True)
            with self.assertRaises(ValueError):
                remote.inventory(self.root if location.parent.name == '_astro' else location)
            location.unlink()
        self.ledger.unlink()
        self.ledger.parent.rmdir()
        self.ledger.parent.symlink_to(self.source, target_is_directory=True)
        with self.assertRaises(ValueError):
            self.session()
        self.ledger.parent.unlink()
        (self.root / '_astro/current.js').unlink()
        session = self.session()
        session.begin(session.preview()['token'])
        with self.assertRaisesRegex(ValueError, 'Active asset absent'):
            session.finish()
        self.assertFalse(self.ledger.exists())

    def test_cleanup_failure_persists_retryable_ledger(self):
        self.apply()
        self.now += remote.GRACE
        session = self.session()
        session.begin(session.preview()['token'])
        real_unlink = remote.delete_asset
        def fail(root, name):
            if name == '_astro/old.js':
                raise OSError('simulated cleanup failure')
            return real_unlink(root, name)
        with patch.object(remote, 'delete_asset', fail), self.assertRaises(OSError):
            session.finish()
        self.assertIn('_astro/old.js', remote.read_ledger(self.ledger))
        retry = self.session()
        retry.begin(retry.preview()['token'])
        retry.finish()
        self.assertNotIn('_astro/old.js', remote.read_ledger(self.ledger))

    def test_coordinator_failure_dry_run_confirmation_and_flags(self):
        class FakeRemote:
            def __init__(inner):
                inner.calls = []
                inner.session = self.session()
            def request(inner, payload):
                inner.calls.append(payload)
                if 'manifest' in payload:
                    return inner.session.preview()
                if payload['action'] == 'begin':
                    inner.session.begin(payload['token'])
                    return {'ok': True}
                return inner.session.finish()
        for failure in [0, 1]:
            helper = FakeRemote()
            count = 0
            def run(command, **kwargs):
                nonlocal count
                if '--dry-run' in command:
                    return
                if count == failure:
                    raise subprocess.CalledProcessError(1, command)
                count += 1
                subprocess.run(deploy.transfer_commands(self.source, str(self.root) + '/')[0],
                               check=True, capture_output=True)
            with contextlib.redirect_stdout(io.StringIO()), self.assertRaises(subprocess.CalledProcessError):
                deploy.deploy(self.source, helper, yes=True, run=run)
            self.assertFalse(self.ledger.exists())
            self.assertFalse(any(call.get('action') == 'finish' for call in helper.calls))
            self.assertTrue((self.root / '_astro/old.js').exists())
        helper = FakeRemote()
        commands = []
        before = remote.inventory(self.root)
        with contextlib.redirect_stdout(io.StringIO()):
            deploy.deploy(self.source, helper, dry_run=True,
                          run=lambda command, **kwargs: commands.append(command))
        self.assertTrue(all('--dry-run' in command for command in commands))
        self.assertEqual(len(helper.calls), 1)
        self.assertEqual(before, remote.inventory(self.root))
        with contextlib.redirect_stdout(io.StringIO()), self.assertRaisesRegex(RuntimeError, 'cancelled'):
            deploy.deploy(self.source, FakeRemote(), confirm=lambda _: 'no', run=lambda *a, **kw: None)
        self.assertTrue(deploy.parse_args(['--dry-run']).dry_run)
        self.assertTrue(deploy.parse_args(['--yes']).yes)
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            deploy.parse_args(['--target', '/tmp/wrong'])

    def test_existing_dry_run_atomic_failure_and_absent_cleanup(self):
        self.apply()
        self.now += remote.GRACE
        before, ledger_bytes = remote.inventory(self.root), self.ledger.read_bytes()
        session = self.session()
        self.assertEqual(session.preview()['delete'], ['_astro/fonts/old.woff2', '_astro/old.js'])
        self.transfer(dry_run=True)
        self.assertEqual(before, remote.inventory(self.root))
        self.assertEqual(ledger_bytes, self.ledger.read_bytes())
        session.begin(session.preview()['token'])
        with patch.object(remote, 'atomic_ledger', side_effect=OSError('disk full')), self.assertRaises(OSError):
            session.finish()
        self.assertEqual(before, remote.inventory(self.root))
        self.assertEqual(ledger_bytes, self.ledger.read_bytes())
        (self.root / '_astro/old.js').unlink()
        retry = self.session()
        retry.begin(retry.preview()['token'])
        retry.finish()
        self.assertNotIn('_astro/old.js', remote.read_ledger(self.ledger))
        remote.delete_asset(self.root, '_astro/already-absent.js')
        outside = self.base / 'outside'
        outside.mkdir()
        self.put(outside, 'precious.js', 'keep')
        (self.root / '_astro/link').symlink_to(outside, target_is_directory=True)
        with self.assertRaises(OSError):
            remote.delete_asset(self.root, '_astro/link/precious.js')
        self.assertEqual((outside / 'precious.js').read_text(), 'keep')

    def test_real_helper_protocol_and_coordinator_success(self):
        # Same protocol/source as SSH, launched directly against temporary paths.
        program = "import sys; from pathlib import Path; sys.path.insert(0, sys.argv[1]); import deploy_remote; sys.exit(deploy_remote.serve(Path(sys.argv[2]), Path(sys.argv[3])))"
        process = subprocess.Popen([sys.executable, '-B', '-c', program,
                                    str(deploy.ROOT / 'scripts'), str(self.root), str(self.ledger)],
                                   stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
        class LocalRemote:
            def request(inner, payload):
                process.stdin.write(json.dumps(payload) + '\n')
                process.stdin.flush()
                response = json.loads(process.stdout.readline())
                if 'error' in response:
                    raise RuntimeError(response['error'])
                return response
        def run(command, **kwargs):
            self.assertTrue(command[-1].startswith(deploy.TARGET))
            command[-1] = command[-1].replace(deploy.TARGET, str(self.root) + '/', 1)
            return subprocess.run(command, **kwargs, capture_output=True)
        try:
            with contextlib.redirect_stdout(io.StringIO()):
                deploy.deploy(self.source, LocalRemote(), yes=True, run=run)
            self.assertEqual(process.wait(timeout=3), 0)
            self.assertEqual((self.root / 'index.html').read_text(), 'NEW PAGE')
            self.assertEqual(remote.read_ledger(self.ledger)['_astro/old.js'] > 0, True)
        finally:
            process.stdin.close()
            if process.poll() is None:
                process.terminate()
            process.wait(timeout=3)
            process.stdout.close()
        with remote.site_lock(self.root):
            pass

    def test_prepare_and_package_wrapper(self):
        calls = []
        def run(command, **kwargs):
            calls.append(command)
            return subprocess.CompletedProcess(command, 0, stdout='')
        with contextlib.redirect_stdout(io.StringIO()), patch.object(deploy, 'pnpm_command', return_value=['pnpm']):
            deploy.prepare(deploy.parse_args([]), run=run)
        self.assertEqual(calls[-3:], [['pnpm', 'install', '--frozen-lockfile'], ['pnpm', 'check'], ['pnpm', 'build']])
        with self.assertRaisesRegex(RuntimeError, 'dirty'):
            deploy.prepare(deploy.parse_args([]), run=lambda *a, **kw: subprocess.CompletedProcess(a, 0, stdout=' M file'))
        # Exercise pnpm argument forwarding in an isolated package whose deploy
        # script is a harmless argv recorder, never the production entry point.
        fixture = self.base / 'package'
        fixture.mkdir()
        original = json.loads((deploy.ROOT / 'package.json').read_text())
        self.assertEqual(original['scripts']['deploy'], 'bash scripts/deploy.sh')
        original = {'name': 'deploy-argv-fixture', 'private': True,
                    'packageManager': original['packageManager'],
                    'scripts': {'deploy': 'bash scripts/deploy.sh'}}
        (fixture / 'package.json').write_text(json.dumps(original))
        (fixture / 'scripts').mkdir()
        (fixture / 'scripts/deploy.sh').write_text('printf "%s\\n" "$@"\n')
        for flag in ['--yes', '--dry-run']:
            result = subprocess.run(deploy.pnpm_command() + ['run', 'deploy', flag], cwd=fixture,
                                    text=True, capture_output=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn(flag, result.stdout.splitlines())
        entry = (deploy.ROOT / 'scripts/deploy.sh').read_text()
        self.assertIn('exec python3 -B scripts/deploy.py "$@"', entry)


if __name__ == '__main__':
    unittest.main()
