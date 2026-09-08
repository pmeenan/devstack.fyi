"""Remote, standard-library-only inventory/retirement protocol (Linux).

The caller holds this process open across both rsync transfers. No helper is
installed on plex: the reviewed source is sent as Python's -c argument.
"""

import contextlib
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import sys
import tempfile
import time

GRACE = 604800
DOCROOT = Path('/var/www/devstack.fyi')
LEDGER = Path.home() / '.local/state/devstack.fyi/retired-assets.json'


def regular_path(path, missing=False):
    """Reject symlinks at every existing component, not just the leaf."""
    path = Path(os.path.abspath(path))
    for item in [*reversed(path.parents), path]:
        try:
            mode = item.lstat().st_mode
        except FileNotFoundError:
            if missing:
                return
            raise
        if stat.S_ISLNK(mode):
            raise ValueError(f'Symlink refused: {item}')
        if item != path and not stat.S_ISDIR(mode):
            raise ValueError(f'Non-directory parent: {item}')
    if not (stat.S_ISREG(mode) or stat.S_ISDIR(mode)):
        raise ValueError(f'Non-regular path: {path}')


def asset_path(name):
    if (not isinstance(name, str) or not name.startswith('_astro/')
            or any(part in ('', '.', '..') for part in name.split('/'))
            or '\\' in name or any(ord(c) < 32 or ord(c) == 127 for c in name)):
        raise ValueError(f'Unsafe asset path: {name!r}')
    return name


def inventory(root):
    regular_path(root)
    result = {}
    for directory, dirs, files in os.walk(root, followlinks=False):
        for name in sorted(dirs + files):
            path = Path(directory) / name
            regular_path(path)
            info = path.stat()
            key = path.relative_to(root).as_posix()
            result[key] = {
                'kind': 'dir' if path.is_dir() else 'file',
                'size': info.st_size if path.is_file() else 0,
                'mtime': info.st_mtime_ns,
                'sha256': hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None,
            }
    return result


def read_ledger(path):
    regular_path(path, missing=True)
    if not path.exists():
        return {}
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f'Duplicate ledger key: {key}')
            result[key] = value
        return result
    value = json.loads(path.read_text(), object_pairs_hook=unique)
    if not isinstance(value, dict) or set(value) != {'version', 'retired'} or type(value['version']) is not int or value['version'] != 1:
        raise ValueError('Invalid retirement ledger version/shape; cleanup refused')
    retired = value['retired']
    if not isinstance(retired, dict):
        raise ValueError('Invalid retirement ledger entries')
    for name, timestamp in retired.items():
        asset_path(name)
        if type(timestamp) is not int or timestamp < 0:
            raise ValueError(f'Invalid retirement timestamp: {name}')
    return retired


def atomic_ledger(path, retired):
    regular_path(path, missing=True)
    path.parent.mkdir(parents=True, exist_ok=True)
    regular_path(path.parent)
    fd, temporary = tempfile.mkstemp(prefix='.retired-', dir=path.parent)
    try:
        with os.fdopen(fd, 'w') as stream:
            json.dump({'version': 1, 'retired': retired}, stream, sort_keys=True)
            stream.write('\n')
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
        directory = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def delete_asset(root, name):
    """Unlink through directory descriptors; swapped/symlinked parents cannot escape."""
    parts = asset_path(name).split('/')
    regular_path(root)
    fd = os.open(root, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        for part in parts[:-1]:
            try:
                child = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=fd)
            except FileNotFoundError:
                return
            os.close(fd)
            fd = child
        try:
            mode = os.stat(parts[-1], dir_fd=fd, follow_symlinks=False).st_mode
        except FileNotFoundError:
            return
        if not stat.S_ISREG(mode):
            raise ValueError(f'Cleanup target is not a regular file: {name}')
        os.unlink(parts[-1], dir_fd=fd)
        os.fsync(fd)
    finally:
        os.close(fd)


@contextlib.contextmanager
def site_lock(root):
    # flock on the existing docroot inode needs no lock file or mkdir, including
    # first-deploy dry runs. Never replace the docroot directory during deployment.
    regular_path(root)
    fd = os.open(root, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield
    finally:
        os.close(fd)


def validate_manifest(manifest):
    if not isinstance(manifest, dict):
        raise ValueError('Manifest must be an object')
    for name, digest in manifest.items():
        asset_path(name)
        if not isinstance(digest, str) or not re.fullmatch('[a-f0-9]{64}', digest):
            raise ValueError(f'Invalid asset digest: {name}')


def reconcile(manifest, files, retired, now):
    next_retired = {}
    for name, info in files.items():
        if name.startswith('_astro/') and info['kind'] == 'file' and name not in manifest:
            asset_path(name)
            next_retired[name] = retired.get(name, now)
    return {
        'retired': next_retired,
        'delete': sorted(name for name, timestamp in next_retired.items() if now - timestamp >= GRACE),
        'reactivated': sorted(set(retired) & set(manifest)),
    }


class Session:
    """Used under site_lock; fixture tests supply temporary paths and a clock."""
    def __init__(self, root, ledger, manifest, clock=time.time):
        validate_manifest(manifest)
        self.root, self.ledger, self.manifest, self.clock = root, ledger, manifest, clock
        self.started = False
        self.snapshot = self.state()

    def state(self):
        files = inventory(self.root)
        retired = read_ledger(self.ledger)
        # Include raw ledger bytes so even formatting/state replacement invalidates a preview.
        raw = self.ledger.read_text() if self.ledger.exists() else None
        token = hashlib.sha256(json.dumps([files, raw], sort_keys=True).encode()).hexdigest()
        return files, retired, token

    def preview(self):
        files, retired, token = self.snapshot
        return {'token': token, **reconcile(self.manifest, files, retired, int(self.clock()))}

    def begin(self, token):
        if self.started or token != self.snapshot[2] or self.state()[2] != token:
            raise ValueError('Stale preview: inventory/ledger changed; rerun deployment')
        self.started = True

    def finish(self):
        if not self.started:
            raise ValueError('Transfers were not authorized by a current preview')
        files, retired, _ = self.state()
        for name, digest in self.manifest.items():
            if files.get(name, {}).get('sha256') != digest:
                raise ValueError(f'Active asset absent or changed after transfer: {name}')
        plan = reconcile(self.manifest, files, retired, int(self.clock()))
        # Persist first. An interruption can only extend retention, never shorten it.
        atomic_ledger(self.ledger, plan['retired'])
        for name in plan['delete']:
            delete_asset(self.root, name)
            del plan['retired'][name]
            atomic_ledger(self.ledger, plan['retired'])
        self.started = False
        return plan


def serve(root=DOCROOT, ledger=LEDGER):
    def reply(value):
        print(json.dumps(value), flush=True)
    try:
        with site_lock(root):
            request = json.loads(sys.stdin.readline())
            if set(request) != {'manifest'}:
                raise ValueError('Expected asset manifest')
            session = Session(root, ledger, request['manifest'])
            reply(session.preview())
            for line in sys.stdin:
                request = json.loads(line)
                if request.get('action') == 'begin':
                    session.begin(request.get('token'))
                    reply({'ok': True})
                elif request == {'action': 'finish'}:
                    reply(session.finish())
                    return
                elif request == {'action': 'abort'}:
                    return
                else:
                    raise ValueError('Unexpected protocol request')
    except Exception as error:
        reply({'error': str(error)})
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(serve())
