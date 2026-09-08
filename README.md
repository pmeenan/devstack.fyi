# devstack.fyi

Developer-focused notes for various platforms and services.

devstack.fyi is a static site of practical, developer-to-developer
implementation notes: for each service, what the product names actually give
you, what to use as a local-development equivalent, and the service-wide
configuration details that are easy to get wrong. The landing page is a
catalog grouped by offering category (cloud providers and CDNs, databases,
event buses, ...) and each service has its own path. Cloudflare is the first
service being documented.

- **Static and self-hosted.** Built with Astro, served as plain files, no
  analytics or cookies; Cloudflare NEL network-error reporting is allowed.
- **Cited and dated.** Every service page names its official sources and shows
  when it was last verified.
- **Light and dark themes,** with hand-built interactive diagrams and a
  deliberately lighthearted, neon-tinged look.
- **Contributions welcome** via pull requests on
  [GitHub](https://github.com/pmeenan/devstack.fyi); the maintainer reviews,
  commits, and deploys.

Almost all code and first-draft content is written by AI agents working from
the project documentation, directed and reviewed by a human. The confirmed
scope and rejected proposals are recorded in
[docs/features.md](docs/features.md); implementation steps and exit criteria
are in [docs/plan.md](docs/plan.md).

## Status

**M0 and M1 complete.** The owner approved the plan on 2026-09-08.
M1.1 is complete: the static Astro foundation, a clearly marked Cloudflare
draft, and passing local install/check/build and fixture tests. The first
hosted PR check remains pending an actual PR.
M1.2 is complete: the owner approved both themes and the
[style guide](docs/style-guide.md) on 2026-09-08. M1.3 is complete: the responsive catalog/service shell, product/limits rendering, theme and copy interactions, accessibility, and metadata pass local checks. M1.4 is complete: the owner deployed and final live checks pass. M2.1 is next. Product research is M2; the tested deploy
script and reference nginx configuration are ready for owner use.

## Local development

Install Node **24.18.1** (see `.node-version`). Use pnpm **12.3.4**:

- With Corepack available: `corepack enable pnpm`, or prefix commands below
  with `corepack` if the shim is not enabled.
- Without Corepack: `npm install --global pnpm@12.3.4` after installing Node.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm build
```

`pnpm dev` starts the local development server and prints its URL.
`pnpm preview` serves the static `dist/` build locally. It does not send the
production CSP/header policy. M1.3 browser checks passed under the approved
header on a temporary local server; the M1.4 reference also passes local nginx header/routing tests.
The catalog and service pages use the accepted Field notes design. For the
original M1.2 visual specimens, run `pnpm dev` and open `/design/compare/` (both themes),
`/design/light/`, or `/design/dark/`. Narrow comparison views stack the themes;
use the individual views for full-width review. These fictional specimens
are development-only: `pnpm build` emits no design routes or sitemap entries.
The accepted design is documented in [docs/style-guide.md](docs/style-guide.md).

`pnpm check` runs Astro/TypeScript diagnostics, formatting, the installed and
all-platform lockfile license audit, and fixture tests. `pnpm build` generates
static routes, validates content relationships, warns about stale dates, and
checks output for inline scripts/styles and non-self/missing assets.
`pnpm format` applies formatting; `pnpm test` runs the checks' regression tests
and real Astro builds in temporary directories outside the checkout.

The empty `products` and `pages` collections currently produce Astro warnings:
no Cloudflare product research or sub-pages have landed yet. The excluded
fictional `_template` exercises those shapes in temporary build tests.

Dependencies use exact pins and the lockfile. On an upgrade, review package
metadata and reconcile [license evidence](docs/dependency-licenses.md), including
optional packages absent from your platform. The three exact release-age
exceptions in `pnpm-workspace.yaml` match the approved M0 spike; do not disable
the age or build-script approval policies globally. Astro telemetry is disabled
in all project scripts and CI.

## Deployment and first launch (owner only)

**Launched and verified on 2026-09-08.** Agents never run the deploy
entry point, change plex, commit or push. Review and commit the working tree
before each deployment. The owner launch check is complete; M2.1 is next.

Local prerequisites: the pinned Node/pnpm above, Git, Bash, Python 3.10+,
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

The 2026-09-08 live check found an injected Cloudflare analytics beacon,
currently blocked by CSP. Disable that beacon to meet D-005.

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
Cloudflare currently has no code snippets; copy behavior was checked with
local fictional content in M1.3 and will receive real-content acceptance in M2.
The successful owner launch check is recorded in `docs/plan.md`; M1 is complete.

## License

[Apache-2.0](LICENSE).

## Start here

- [AGENTS.md](AGENTS.md) — rulebook and doc map for agents (and curious humans)
- [docs/vision.md](docs/vision.md) — why this exists, who it is for, success criteria
- [docs/features.md](docs/features.md) — confirmed scope, proposed additions, open questions
- [docs/plan.md](docs/plan.md) — milestones and what "done" means
- [docs/workflow.md](docs/workflow.md) — how agents and the maintainer collaborate
- [docs/rough-edges.md](docs/rough-edges.md) — findings log
