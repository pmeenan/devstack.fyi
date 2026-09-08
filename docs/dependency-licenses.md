# Dependency licenses

Verified 2026-09-08 for M1.1 (D-002, D-016).

## Package evidence and automated gate

[dependency-licenses.json](dependency-licenses.json) records the exact name,
version, license expression, and official registry metadata URL for every
package in both pnpm lockfile documents: the pnpm executable graph and the
project graph, including optional platform packages not installed on Linux.
All 381 records were fetched from those URLs for this audit. The installed
Linux tree was also checked with `pnpm licenses list --json`, including build,
development, and optional dependencies.

`pnpm check` compares the installed licenses to this inventory and requires
an inventory entry for every locked version. Missing metadata, changed
expressions, unreviewed packages and obsolete inventory records fail. This
is an offline gate after installation; it does not fetch registry metadata
on every build. On a lockfile change, retrieve each new package/version's
registry metadata, read LICENSE/README when ambiguous, update the evidence,
and run the check. Do not populate the inventory with guessed licenses.

The ordinary allowlist is MIT, ISC, Apache-2.0, BSD-2-Clause, BSD-3-Clause,
0BSD, CC0-1.0, BlueOak-1.0.0, and Python-2.0 (argparse). No general expression
parser silently accepts an OR branch. New expressions need explicit review;
for AND, every license must be permitted for that package's actual use.

The direct implementation helpers added in M1.1 are parse5 8.0.1 (MIT),
PostCSS 8.5.28 (MIT), postcss-value-parser 4.2.0 (MIT), YAML 2.9.0 (ISC), and
@types/node 24.13.3 (MIT). The first four parse built HTML/CSS or the lockfile
for the check scripts; Node types cover strict TypeScript in those scripts.
They are build/check dependencies, not browser dependencies. The main Astro,
MDX, sitemap, checker, formatter and TypeScript pins remain those in
[toolchain.md](toolchain.md).

## Named build-tool exceptions

D-016 permits unmodified Lightning CSS and Sharp's libvips distributions
solely as local/CI build tools. The following exact records require that
exception; the source URLs and expressions are in the JSON inventory.

| Package/version                            | Registry license                         |
| ------------------------------------------ | ---------------------------------------- |
| `@img/sharp-libvips-darwin-arm64@1.3.3`    | LGPL-3.0-or-later                        |
| `@img/sharp-libvips-darwin-x64@1.3.3`      | LGPL-3.0-or-later                        |
| `@img/sharp-libvips-linux-arm64@1.3.3`     | LGPL-3.0-or-later                        |
| `@img/sharp-libvips-linux-arm@1.3.3`       | LGPL-3.0-or-later                        |
| `@img/sharp-libvips-linux-ppc64@1.3.3`     | LGPL-3.0-or-later                        |
| `@img/sharp-libvips-linux-riscv64@1.3.3`   | LGPL-3.0-or-later                        |
| `@img/sharp-libvips-linux-s390x@1.3.3`     | LGPL-3.0-or-later                        |
| `@img/sharp-libvips-linux-x64@1.3.3`       | LGPL-3.0-or-later                        |
| `@img/sharp-libvips-linuxmusl-arm64@1.3.3` | LGPL-3.0-or-later                        |
| `@img/sharp-libvips-linuxmusl-x64@1.3.3`   | LGPL-3.0-or-later                        |
| `@img/sharp-wasm32@0.35.4`                 | Apache-2.0 AND LGPL-3.0-or-later AND MIT |
| `@img/sharp-win32-arm64@0.35.4`            | Apache-2.0 AND LGPL-3.0-or-later         |
| `@img/sharp-win32-ia32@0.35.4`             | Apache-2.0 AND LGPL-3.0-or-later         |
| `@img/sharp-win32-x64@0.35.4`              | Apache-2.0 AND LGPL-3.0-or-later         |
| `lightningcss-android-arm64@1.33.0`        | MPL-2.0                                  |
| `lightningcss-darwin-arm64@1.33.0`         | MPL-2.0                                  |
| `lightningcss-darwin-x64@1.33.0`           | MPL-2.0                                  |
| `lightningcss-freebsd-x64@1.33.0`          | MPL-2.0                                  |
| `lightningcss-linux-arm-gnueabihf@1.33.0`  | MPL-2.0                                  |
| `lightningcss-linux-arm64-gnu@1.33.0`      | MPL-2.0                                  |
| `lightningcss-linux-arm64-musl@1.33.0`     | MPL-2.0                                  |
| `lightningcss-linux-x64-gnu@1.33.0`        | MPL-2.0                                  |
| `lightningcss-linux-x64-musl@1.33.0`       | MPL-2.0                                  |
| `lightningcss-win32-arm64-msvc@1.33.0`     | MPL-2.0                                  |
| `lightningcss-win32-x64-msvc@1.33.0`       | MPL-2.0                                  |
| `lightningcss@1.33.0`                      | MPL-2.0                                  |

The Windows and WebAssembly Sharp packages bundle libvips instead of depending
on a separate `sharp-libvips-*` package. Their package metadata, LICENSE and
README licensing tables were read from the official 0.35.4 tarballs. Windows
combines Apache-2.0 (Sharp) with LGPL-3.0-or-later (libvips distribution);
WebAssembly adds MIT (Emscripten). All conjuncts are accounted for: Apache and
MIT are ordinarily allowed, and the libvips distribution is within D-016.
The checker names these four bundled packages explicitly; this does not
extend the exception to arbitrary LGPL development dependencies.

The distribution READMEs also list bundled library notices (including Cairo,
GLib and image codecs where present); the permission is for the unmodified
libvips distributions as build tools, not for shipping their contents. Do not
copy native binaries, WASM runtimes, node_modules or build images into dist.

## Fonts retained for M1.2/M1.3

The following unmodified Latin variable WOFF2 files were extracted from the
official Fontsource 5.3.0 package tarballs. Both package metadata and the actual
font LICENSE files say OFL-1.1. Each font's original LICENSE is retained beside
it in `src/assets/fonts/`. The foundation has not wired fonts into the site
yet; when wiring them, include their notices in the published distribution.
Keep the font license distinct from the site's Apache-2.0 license. OFL permits
bundling/embedding and redistribution with its notice and license; it forbids
selling the fonts by themselves and constrains reserved names on modified
versions. These files are unmodified.

| Font           | Source                                                                                   | SHA-256 of retained WOFF2                                          |
| -------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| inter          | [Package metadata](https://registry.npmjs.org/@fontsource-variable/inter/5.3.0)          | `3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62` |
| jetbrains-mono | [Package metadata](https://registry.npmjs.org/@fontsource-variable/jetbrains-mono/5.3.0) | `18be452724bfdc236c074ca94a249a7f41a86752c7d04ab258ce9ed5651f6a7e` |

## Node and PR actions

Read the [Node 24.18.1 distribution license](https://github.com/nodejs/node/blob/v24.18.1/LICENSE):
Node's own code is MIT, followed by its bundled third-party notices (including
V8, ICU, OpenSSL and libuv). Node is the unmodified local/CI build runtime;
its distribution is not shipped in the static output. Retain the upstream
notices if redistributing that runtime separately.

The PR workflow pins the following release commits. Their action definitions
and actual LICENSE files were read at these exact commits; all three use the
Node 24 action runtime. The pnpm action reads `packageManager`; setup-node
reads `.node-version` and caches pnpm after pnpm is installed.

| Action             | Release / commit                                    | License source                                                                                       |
| ------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| actions/checkout   | v7.0.1 / `3d3c42e5aac5ba805825da76410c181273ba90b1` | [MIT](https://github.com/actions/checkout/blob/3d3c42e5aac5ba805825da76410c181273ba90b1/LICENSE)     |
| pnpm/action-setup  | v6.1.0 / `ea17c68df8912ef543352723c149a84f56e3d413` | [MIT](https://github.com/pnpm/action-setup/blob/ea17c68df8912ef543352723c149a84f56e3d413/LICENSE.md) |
| actions/setup-node | v7.0.0 / `820762786026740c76f36085b0efc47a31fe5020` | [MIT](https://github.com/actions/setup-node/blob/820762786026740c76f36085b0efc47a31fe5020/LICENSE)   |

The workflow has read-only repository permissions, disables persisted checkout
credentials, uses no project secrets, and never deploys. Its first hosted
result remains pending an actual PR; local validation uses the same frozen
install, check, and build commands.
