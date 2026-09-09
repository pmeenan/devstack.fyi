# Hosting and deployment (owner only)

**Launched and verified on 2026-09-08.** Agents never run the deploy
entry point, change plex, commit or push. Review and commit the working tree
before each deployment. The owner launch check is complete; see [the plan](plan.md) for current work.

Run the commands below from the repository root.

Local prerequisites: the pinned Node/pnpm in [the README](../README.md#local-development), Git, Bash, Python 3.10+,
rsync, and OpenSSH. The local deployment fixtures in `pnpm check` require
Python and rsync, but never contact a server. `pnpm run test:nginx` additionally
requires local nginx and OpenSSL and a completed `pnpm build`; it runs an
isolated server on ephemeral loopback ports with a temporary certificate.
`NGINX_BIN=/absolute/path/to/nginx pnpm run test:nginx` supports an extracted
binary without a system install. It is separate from the normal check gate.

Plex already has Python 3.12.3 and rsync 3.2.7 (read-only check 2026-09-08).
No Node, package installation, daemon, or persistent helper is needed there.
Your `~/.ssh/config` must define `Host plex` for `plex.meenan.us`, port `10022`,
user `pmeenan`, with an authorized SSH key and trusted host key. The fixed
target is `plex:/var/www/devstack.fyi/`; no flag or environment setting changes
it. The docroot must already exist, be owned/writable by the deploy user, and
contain only site files. Do not replace the docroot directory: its inode is
the site-specific lock shared by all deploys.

### Install the nginx reference

From this checkout, as the human owner, back up the current vhost, upload the
reviewed reference and install it. These commands preserve the existing
sites-enabled symlink and Certbot certificate paths:

```sh
ssh plex 'if ! sudo test -e /etc/nginx/sites-available/devstack.fyi.pre-m14; then sudo cp -a /etc/nginx/sites-available/devstack.fyi /etc/nginx/sites-available/devstack.fyi.pre-m14; fi'
scp deploy/nginx/devstack.fyi.conf plex:~/devstack.fyi.conf.new
ssh plex 'sudo install -m 644 ~/devstack.fyi.conf.new /etc/nginx/sites-available/devstack.fyi'
ssh plex 'sudo nginx -t && sudo systemctl reload nginx'
```

The first command saves the old config only if the backup does not already
exist. `scp` uploads the repository's new config; `install` makes it active;
`nginx -t` validates it before reload. **Stop here if those commands succeed.**

<details>
<summary>Recovery only: restore the old config if validation or reload fails</summary>

The following command intentionally undoes installation. Do not run it after
a successful install:

```sh
ssh plex 'sudo cp -a /etc/nginx/sites-available/devstack.fyi.pre-m14 /etc/nginx/sites-available/devstack.fyi && sudo nginx -t && sudo systemctl reload nginx'
```

</details>

The reference replaces the SPA fallback with real 404s, redirects both HTTP
hosts and HTTPS www to the apex, sends the approved CSP on success and errors,
and sets one cache policy: five minutes for pages/stable files, one year for
hashed assets, and `no-store` for 403/404/405 responses. The current vhost has
no other security headers to preserve. Existing global server configuration
and TLS/Certbot files are not changed. On a new empty docroot, nginx may serve an error until the first build is deployed.

### Disable Cloudflare analytics injection; keep NEL

The owner disabled Cloudflare analytics injection before the successful
2026-09-08 launch check. Keep it disabled to meet D-005.

In Cloudflare Web Analytics, select this site's **Manage site → Disable** to
stop automatic snippet injection ([official instructions](https://developers.cloudflare.com/web-analytics/get-started/)).
Recheck public HTML for the absence of `static.cloudflareinsights.com`.
Keep the strict CSP.

Cloudflare **Network Error Logging (NEL) is allowed** by the owner's D-005
amendment on 2026-09-08. Leave NEL enabled; its `NEL`/`Report-To` headers and
network-error reports are not launch blockers. This exception does not permit
Web Analytics/RUM beacons or other telemetry.

### Preview, deploy, and verify

```sh
pnpm run deploy --dry-run
pnpm run deploy
# For a deliberate noninteractive run, retaining all checks:
pnpm run deploy --yes
```

Use `pnpm run deploy`, since bare `pnpm deploy` is pnpm's workspace packaging
command. With no pnpm shim, prefix these commands with `corepack`.

Every invocation refuses a dirty tree by default, prints the revision, checks
SSH/runtime access with read-only commands, then performs a frozen install, `pnpm check`, and `pnpm build` locally. `--allow-dirty` is the explicit
exception for a deliberate deployment of uncommitted work; `--yes` only skips
the prompt. The default prompt requires typing `deploy` after the rsync and retirement
plans are printed. The target cannot be overridden.

A dry run still builds locally, then uses rsync's read-only preview while
holding the same remote lock as a deploy. It creates no remote lock file or
state directory and changes no remote content or ledger. Output includes
rsync's transfer/deletion preview, proposed retirement timestamps and exact
expired-asset paths. A later real run takes a fresh snapshot; it never applies
a saved dry-run plan. An interactive run rechecks its snapshot after the
prompt and refuses to continue if files or ledger changed.

Uploads use a frozen temporary copy of `dist/`. Hashed assets arrive first;
then rsync replaces pages/stable files and deletes obsolete ones while
protecting the entire old `_astro/` tree. Only after both transfers succeed
is the ledger at `~/.local/state/devstack.fyi/retired-assets.json` on plex
atomically updated and eligible assets removed. Retired assets survive seven
full days from their first absence after a successful deploy. Reactivation
clears that date; a second retirement starts a new seven-day clock.

If a transfer fails, cleanup does not run. If cleanup fails, the command fails
and the persisted ledger supports retry. A missing ledger conservatively
restarts retention; corrupt state or symlinks stop the operation without
cleanup. Inspect a malformed ledger before repairing/restoring it. Removing a
corrupt ledger deliberately restarts the full grace period on the next
successful run. Never hand-delete old assets based on mtimes.

Deployment is not atomic: interrupted page transfer can leave mixed pages,
but both old and new assets are retained. Re-run the intended build after
resolving a failure. For rollback, use a separate clean checkout of the desired
revision with this deployment tooling and run the same checked flow; do not
rewrite history. Tabs open longer than the retention period may need a reload.

After deployment, check the catalog, Cloudflare draft, theme toggle/reload,
and a missing page in a browser. Inspect public headers:

```sh
curl -I https://devstack.fyi/
curl -I https://devstack.fyi/cloudflare
curl -I https://devstack.fyi/cloudflare/
curl -I https://devstack.fyi/does-not-exist/
curl -I https://devstack.fyi/_astro/does-not-exist.js
curl -I http://www.devstack.fyi/cloudflare/
curl -I https://www.devstack.fyi/cloudflare/
```

Check an actual `/_astro/` URL from page source for the immutable policy.
Expected results: real content is 200, slash/www/HTTP redirects are 301 to the
canonical URL, missing pages/assets are 404 with `no-store`, and CSP is present.

### Owner launch evidence (2026-09-08)

After the owner installed the nginx reference, disabled analytics injection,
and flushed Cloudflare caches, final public checks passed: all 14 checked page,
redirect, error, and asset responses carried the approved CSP. Pages and stable
files had five-minute caching; hashed assets were immutable; missing paths
returned the custom 404 with no-store. HTTP/www/slash redirects were correct.
Chrome checks at 390px and 1280px in both themes covered fonts, anchors,
canonical URLs, theme persistence, and no-JavaScript reading, with no analytics
beacon, third-party asset requests, or browser errors. NEL remained allowed.
The initial live draft had no snippets; copy behavior had local fixture coverage.
This is launch evidence, not a claim that later working-tree content is deployed.
