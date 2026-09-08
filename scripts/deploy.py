"""Human-run deployment coordinator. No CLI option changes the remote target."""

import argparse
import json
from pathlib import Path
import shlex
import shutil
import subprocess
import sys
import tempfile

from deploy_remote import inventory

ROOT = Path(__file__).resolve().parent.parent
TARGET = 'plex:/var/www/devstack.fyi/'
SSH = ['ssh', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15',
       '-o', 'ServerAliveInterval=15', '-o', 'ServerAliveCountMax=3']


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description='Build and deploy devstack.fyi to plex (human-run).')
    parser.add_argument('--dry-run', action='store_true', help='Build locally; preview without remote writes')
    parser.add_argument('--yes', action='store_true', help='Skip interactive confirmation (not checks)')
    parser.add_argument('--allow-dirty', action='store_true', help='Explicitly permit an uncommitted working tree')
    return parser.parse_args(argv)


def pnpm_command():
    if shutil.which('pnpm'):
        return ['pnpm']
    if shutil.which('corepack'):
        return ['corepack', 'pnpm']
    raise RuntimeError('Install pnpm 12.3.4 or Corepack first')


def prepare(args, run=subprocess.run):
    dirty = run(['git', 'status', '--porcelain', '--untracked-files=all'], cwd=ROOT,
                check=True, capture_output=True, text=True).stdout
    if dirty and not args.allow_dirty:
        raise RuntimeError('Working tree is dirty. Commit first, or explicitly use --allow-dirty.')
    revision = run(['git', 'rev-parse', 'HEAD'], cwd=ROOT, check=True,
                   capture_output=True, text=True).stdout.strip()
    print('Revision:', revision, '(with uncommitted changes)' if dirty else '')
    try:
        run(SSH + ['-G', 'plex'], check=True, capture_output=True)
        run(SSH + ['plex', 'python3 --version && rsync --version >/dev/null && test -d /var/www/devstack.fyi'],
            check=True)
    except subprocess.CalledProcessError as error:
        raise RuntimeError('SSH preflight failed. Check Host plex, port 10022, key access, Python/rsync and docroot.') from error
    package_manager = pnpm_command()
    for command in [['install', '--frozen-lockfile'], ['check'], ['build']]:
        run(package_manager + command, cwd=ROOT, check=True)


def transfer_commands(source, target=TARGET, dry_run=False):
    # Target injection exists only for in-process local fixture tests, never CLI/env.
    common = ['rsync', '-rltpz', '--checksum', '--itemize-changes',
              '--chmod=D755,F644', '--omit-dir-times', '-e', shlex.join(SSH)]
    if dry_run:
        common.append('--dry-run')
    return [
        common + [str(source / '_astro') + '/', target + '_astro/'],
        common + ['--delete', '--filter=P /_astro/***', '--filter=H /_astro/***',
                  str(source) + '/', target],
    ]


class Remote:
    def __init__(self):
        source = (ROOT / 'scripts/deploy_remote.py').read_text()
        # shlex.quote protects code as one remote shell argument. Asset names and
        # the manifest travel exclusively as JSON on stdin, never shell source.
        self.process = subprocess.Popen(SSH + ['plex', 'python3 -u -c ' + shlex.quote(source)],
                                        stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)

    def request(self, payload):
        self.process.stdin.write(json.dumps(payload) + '\n')
        self.process.stdin.flush()
        line = self.process.stdout.readline()
        if not line:
            raise RuntimeError('Remote helper disconnected; deployment stopped')
        reply = json.loads(line)
        if 'error' in reply:
            raise RuntimeError(reply['error'])
        return reply

    def close(self):
        self.process.stdin.close()
        try:
            self.process.wait(timeout=15)
        except subprocess.TimeoutExpired:
            self.process.terminate()
            self.process.wait(timeout=5)
        self.process.stdout.close()


def deploy(source, remote, dry_run=False, yes=False, run=subprocess.run, confirm=input):
    files = inventory(source)
    manifest = {name: info['sha256'] for name, info in files.items()
                if name.startswith('_astro/') and info['kind'] == 'file'}
    if not (source / 'index.html').is_file() or not (source / '404.html').is_file() or not manifest:
        raise RuntimeError('Incomplete build: index.html, 404.html and hashed assets are required')
    preview = remote.request({'manifest': manifest})
    print('Target:', TARGET)
    print('Proposed retirement ledger and exact cleanup paths (remote epoch seconds):')
    print(json.dumps(preview, indent=2, sort_keys=True))
    # Show page/stable-file deletions as well as ledger cleanup before approval.
    for command in transfer_commands(source, dry_run=True):
        run(command, check=True)
    if dry_run:
        return
    if not yes and confirm('Deploy this build to devstack.fyi? Type deploy: ') != 'deploy':
        raise RuntimeError('Deployment cancelled; remote files unchanged')
    remote.request({'action': 'begin', 'token': preview['token']})
    # A raised transfer error skips finish: no ledger changes or cleanup.
    for command in transfer_commands(source):
        run(command, check=True)
    result = remote.request({'action': 'finish'})
    print('Upload and cleanup complete:', json.dumps(result, sort_keys=True))


def main(argv=None):
    args = parse_args(argv)
    prepare(args)
    # Freeze the build used for inventory and both transfers against local edits.
    with tempfile.TemporaryDirectory(prefix='devstack-deploy-') as directory:
        source = Path(directory) / 'dist'
        inventory(ROOT / 'dist')  # Reject symlinks before copying (copytree follows them).
        shutil.copytree(ROOT / 'dist', source)
        remote = Remote()
        try:
            deploy(source, remote, args.dry_run, args.yes)
        finally:
            remote.close()


if __name__ == '__main__':
    try:
        main()
    except (Exception, KeyboardInterrupt) as error:
        print(f'Deployment failed: {error}', file=sys.stderr)
        sys.exit(1)
