"""Test the actual vhost locally; only paths, ports and TLS fixtures are replaced.

NGINX_BIN may point to a locally extracted nginx binary. Never contacts plex.
"""

from contextlib import closing
import http.client
import os
from pathlib import Path
import shutil
import socket
import ssl
import subprocess
import tempfile
import time
import unittest

ROOT = Path(__file__).resolve().parents[1]
CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"


def port():
    with closing(socket.socket()) as listener:
        listener.bind(('127.0.0.1', 0))
        return listener.getsockname()[1]


class NginxFixture(unittest.TestCase):
    def test_reference_vhost(self):
        binary = os.environ.get('NGINX_BIN') or shutil.which('nginx')
        self.assertTrue(binary, 'Install nginx locally or set NGINX_BIN to an extracted nginx executable')
        with tempfile.TemporaryDirectory(prefix='devstack-nginx-') as temporary:
            base = Path(temporary)
            www = base / 'www'
            shutil.copytree(ROOT / 'dist', www)
            self.assertTrue((www / '404.html').is_file(), 'Run pnpm build first')
            (www / 'empty-directory').mkdir()
            cert, key = base / 'cert.pem', base / 'key.pem'
            subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
                            '-keyout', str(key), '-out', str(cert), '-days', '1',
                            '-subj', '/CN=devstack.fyi'], check=True, capture_output=True)
            http_port, https_port = port(), port()
            self.assertNotEqual(http_port, https_port)
            reference = (ROOT / 'deploy/nginx/devstack.fyi.conf').read_text()
            config = reference.replace('/var/www/devstack.fyi/', str(www) + '/')
            config = config.replace('listen 443 ssl;', f'listen 127.0.0.1:{https_port} ssl;')
            config = config.replace('listen 80;', f'listen 127.0.0.1:{http_port};')
            config = config.replace('/etc/letsencrypt/live/devstack.fyi/fullchain.pem', str(cert))
            config = config.replace('/etc/letsencrypt/live/devstack.fyi/privkey.pem', str(key))
            # Production includes are preserved in the reference; no local Certbot needed.
            config = config.replace('include /etc/letsencrypt/options-ssl-nginx.conf;', 'ssl_protocols TLSv1.2 TLSv1.3;')
            config = config.replace('ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;', '')
            config_file = base / 'nginx.conf'
            config_file.write_text(f'''daemon off;
master_process off;
pid {base}/nginx.pid;
error_log {base}/error.log;
events {{ worker_connections 128; }}
http {{
    access_log off;
    client_body_temp_path {base}/body;
    proxy_temp_path {base}/proxy;
    fastcgi_temp_path {base}/fastcgi;
    uwsgi_temp_path {base}/uwsgi;
    scgi_temp_path {base}/scgi;
    types {{ text/html html; text/css css; application/javascript js; image/png png; font/woff2 woff2; }}
{config}
}}
''')
            args = [binary, '-p', str(base) + '/', '-c', str(config_file)]
            subprocess.run(args + ['-t'], check=True, capture_output=True)
            process = subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
            try:
                for _ in range(100):
                    if process.poll() is not None:
                        self.fail(process.stderr.read().decode())
                    try:
                        with socket.create_connection(('127.0.0.1', http_port), timeout=.1):
                            break
                    except OSError:
                        time.sleep(.025)
                def request(path, host='devstack.fyi', tls=True, headers=None, method='GET'):
                    if tls:
                        connection = http.client.HTTPSConnection('127.0.0.1', https_port,
                            context=ssl._create_unverified_context(), timeout=3)
                    else:
                        connection = http.client.HTTPConnection('127.0.0.1', http_port, timeout=3)
                    connection.request(method, path, headers={'Host': host, **(headers or {})})
                    response = connection.getresponse()
                    result = response.status, response.getheaders(), response.read()
                    connection.close()
                    return result
                def verify(path, code=200, cache='public, max-age=300, must-revalidate', **kw):
                    status, pairs, body = request(path, **kw)
                    headers = {name.lower(): value for name, value in pairs}
                    self.assertEqual(status, code, (path, headers, body))
                    self.assertEqual(headers.get('content-security-policy'), CSP, path)
                    self.assertEqual([value for name, value in pairs if name.lower() == 'cache-control'],
                                     [] if cache is None else [cache], path)
                    self.assertNotIn('expires', headers)
                    if code == 404:
                        self.assertIn(b"That page isn't here.", body)
                    return headers
                verify('/')
                page = verify('/cloudflare/')
                verify('/cloudflare/', code=304, headers={'If-None-Match': page['etag']})
                verify('/robots.txt')
                verify('/empty-directory/', code=403, cache='no-store')
                verify('/cloudflare/', method='POST', code=405, cache='no-store')
                redirect = verify('/cloudflare', code=301)
                self.assertTrue(redirect['location'].endswith('/cloudflare/'))
                assets = [p for p in (www / '_astro').rglob('*') if p.is_file()]
                self.assertTrue(assets)
                for asset in assets:
                    verify('/' + asset.relative_to(www).as_posix(), cache='public, max-age=31536000, immutable')
                for missing in ['/not-found/', '/not-found.html', '/_astro/missing.js', '/_astro/fonts/missing.woff2', '/404.html']:
                    verify(missing, code=404, cache='no-store')
                for host, tls in [('devstack.fyi', False), ('www.devstack.fyi', False), ('www.devstack.fyi', True)]:
                    headers = verify('/cloudflare/?example=1', host=host, tls=tls, code=301, cache=None)
                    self.assertEqual(headers['location'], 'https://devstack.fyi/cloudflare/?example=1')
            finally:
                process.terminate()
                process.communicate(timeout=5)


if __name__ == '__main__':
    unittest.main()
