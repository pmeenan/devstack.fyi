# Topic areas

M2.2a scope map, 2026-09-09, recorded before moving the accepted overview.
These are editorial assignments of the owner's scope (features.md questions
8–9), not new claims about vendor capabilities or current product names.

| Area                                   | Existing coverage                                              | Planned coverage                                                                                                                                        |
| -------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build applications (`build`)           | Workers, Pages, D1, Durable Objects, KV, R2, Queues, Workflows | Images, Stream, Workers AI, Vectorize, AI Gateway, Hyperdrive                                                                                           |
| Deliver HTTP traffic (`deliver`)       | None                                                           | CDN cache and Cache Rules, DNS, TLS and origin TLS modes, Rules, Load Balancing; service-wide strict-origin-TLS and honoring-origin-cache-headers notes |
| Protect applications (`protect`)       | None                                                           | WAF, Bot Management, rate limiting, DDoS protection, Turnstile                                                                                          |
| Connect users and networks (`connect`) | None                                                           | Zero Trust Access, Tunnel, WARP                                                                                                                         |

The root declares ordered areas; each page and product declares one `area`.
An available area's overview uses its area id as the page directory. Product
URLs stay at `/cloudflare/<product>/`; membership does not change routing.
The root retains `#product-<slug>` as visible links to canonical product pages.
Build's storage order stays R2, D1, KV, Durable Objects.

Planned areas appear in the root directory and area switcher with a Planned
label and no link to an unwritten page. Add their focused overview and change
status to `available` together when coverage lands. Cross-link intersections
(for example Workers/cache behavior and CDN caching) from the relevant prose
once both destinations exist; do not duplicate product records. Review Build's
tab density before adding the six media/AI products in M2.4.
