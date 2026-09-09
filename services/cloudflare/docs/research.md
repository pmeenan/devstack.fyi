# Research record

## 2026-09-08 — M2.1 developer platform

Read current official product overviews, local-development guides, pricing and
limits pages on 2026-09-08. The eight records in `content/products/` hold
claim-level source lists and separate capability/local-development and limits
dates. Below is the evidence map for future updates; links were read, not
inferred from product names. No vendor accounts or resources were created.

### D1

Managed relational database with SQLite SQL semantics, queried through Workers bindings or an HTTP API.

Usage counts rows read or written, not just SQL statements. Local and deployed data are separate.

Local evidence: Wrangler provides a local D1 database with persistent state. Use explicit --local when running D1 CLI queries or migrations; remote bindings are an opt-in for Workers, unavailable for Pages.

Limits treatment: Paid includes usage allowances and permits metered overages within platform limits. Indexes affect rows scanned and writes.

- [D1 overview](https://developers.cloudflare.com/d1/)
- [D1 local development](https://developers.cloudflare.com/d1/best-practices/local-development/)
- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)

### Durable Objects

Named stateful objects combining compute with private, strongly consistent storage for coordination.

Use SQLite-backed objects for new applications. The legacy key-value backend is restricted to paid accounts that already have a key-value-backed namespace.

Local evidence: Run the companion Worker and object class with Wrangler. Durable Object bindings are simulated locally; remote: true is unsupported.

Limits treatment: This table covers SQLite-backed objects. Evidence gap: the general limits table gives 10 GB per object, while its storage-error section says 1 GB on Free. Confirm with Cloudflare before relying on a Free per-object capacity.

- [Durable Objects overview](https://developers.cloudflare.com/durable-objects/)
- [Durable Objects local development](https://developers.cloudflare.com/workers/local-development/)
- [Durable Objects local setup](https://developers.cloudflare.com/durable-objects/get-started/)
- [Storage backend availability and conflicting Free limits](https://developers.cloudflare.com/durable-objects/platform/limits/)
- [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)

### Workers KV

Distributed key-value storage for read-heavy data that can tolerate eventual consistency.

Updates may take 60 seconds or more to become visible elsewhere. Even the location that wrote a value is not guaranteed an immediately fresh read. Use another model for transactional coordination.

Local evidence: Local KV bindings start with local data, not your deployed namespace. Use a staging namespace with remote: true to exercise the real service.

Limits treatment: Paid included usage is not a hard cap. The per-key write rate still applies.

- [Workers KV overview](https://developers.cloudflare.com/kv/)
- [Workers KV local development](https://developers.cloudflare.com/workers/local-development/)
- [KV consistency model](https://developers.cloudflare.com/kv/concepts/how-kv-works/)
- [Workers KV limits](https://developers.cloudflare.com/kv/platform/limits/)
- [Workers KV pricing](https://developers.cloudflare.com/kv/platform/pricing/)

### Pages

Web application hosting with static asset delivery, build/deployment integration, and optional Pages Functions.

Pages Functions consume Workers quotas; upgrading a zone plan does not replace the Workers plan.

Local evidence: Serves your built asset directory and runs Functions locally. Build the assets first; D1 bindings in Pages local development cannot target a remote database.

Limits treatment: Build and asset limits use Free/Pro/Business; Functions use the separate Workers plan. Paid file limits require PAGES_WRANGLER_MAJOR_VERSION=4. Enterprise arrangements are custom.

- [Pages overview](https://developers.cloudflare.com/pages/)
- [Pages local development](https://developers.cloudflare.com/pages/functions/local-development/)
- [D1 local development with Pages](https://developers.cloudflare.com/d1/best-practices/local-development/)
- [Pages limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Pages Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/)

### Queues

Message queues for buffering and moving background work between producers and consumers.

A typical successful delivery uses write, read, and delete operations. Larger messages and retries increase operation usage.

Local evidence: Wrangler simulates queues locally; run producer and consumer Workers together with multiple -c configuration arguments. wrangler dev --remote is unsupported.

Limits treatment: Operations are counted in 64 KB chunks; an operations allowance is not a message allowance. Consumer Workers incur their own usage.

- [Queues overview](https://developers.cloudflare.com/queues/)
- [Queues local development](https://developers.cloudflare.com/queues/configuration/local-development/)
- [Queues limits](https://developers.cloudflare.com/queues/platform/limits/)
- [Queues pricing](https://developers.cloudflare.com/queues/platform/pricing/)

### R2

Object storage for files and blobs, accessible through Workers bindings and an S3-compatible API.

The local binding simulation exercises the Workers API. Treat testing an S3 client as a separate integration check against a staging R2 bucket.

Local evidence: Wrangler simulates the R2 binding locally; remote: true connects that binding to a real bucket. Use a separate staging bucket for integration checks.

Limits treatment: R2 uses storage classes and usage allowances, not Workers or zone plan tiers. The free allowance applies only to Standard storage; additional usage is metered.

- [R2 overview](https://developers.cloudflare.com/r2/)
- [R2 local development](https://developers.cloudflare.com/workers/local-development/)
- [R2 S3 API compatibility](https://developers.cloudflare.com/r2/api/s3/api/)
- [R2 limits](https://developers.cloudflare.com/r2/platform/limits/)
- [R2 storage classes and allowances](https://developers.cloudflare.com/r2/pricing/)

### Workers

Serverless application code running in Cloudflare’s workerd runtime, with bindings to data and other services.

Workers can also serve static assets. Set explicit CPU limits for paid HTTP handlers; other trigger types have their own limits.

Local evidence: Runs locally through Miniflare/workerd; configured bindings use local simulations by default. Local execution and remote resource access are separate choices.

Limits treatment: Paid allowances are included usage, not a spending cap. This table covers current Workers plans and HTTP handlers, not legacy Bundled/Unbound plans.

- [Workers overview](https://developers.cloudflare.com/workers/)
- [Workers local development](https://developers.cloudflare.com/workers/local-development/)
- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)

### Workflows

Durable multi-step execution with persisted state, retries, sleeps, and waits for external events.

Use steps to resume multi-stage work after failures. Local emulation lets you test control flow; it does not establish production scale or timing.

Local evidence: Wrangler runs an emulated Workflow locally. While dev is running, use wrangler workflows commands with --local (Wrangler 4.79.0+). Remote bindings and wrangler dev --remote are unsupported.

Limits treatment: Execution requests share the Workers allowance. Storage, CPU, and steps also have their own usage accounting; step-count caps differ from included step allowances.

- [Workflows overview](https://developers.cloudflare.com/workflows/)
- [Workflows local development](https://developers.cloudflare.com/workflows/build/local-development/)
- [Workflows limits](https://developers.cloudflare.com/workflows/reference/limits/)
- [Workflows pricing](https://developers.cloudflare.com/workflows/reference/pricing/)

## Evidence gaps and scope boundaries

- **Durable Objects Free per-object capacity is unresolved.** The general
  SQLite limits table says 10 GB per object without a tier qualifier; the
  storage-error section says 10 GB on Paid and 1 GB on Free. The public table
  marks the contradiction rather than choosing a value. The account cap
  (5 GB on Free) is separate and consistent. Revisit the linked limits page
  or seek vendor clarification before recommending a per-object Free capacity.
- Workers development-testing URLs redirect to `/workers/local-development/`.
  Use that canonical source; its Markdown representation is at `index.md`.
- Workers overview/limits and Workflows limits contain different script-size
  presentations. Script packaging is outside this selected quota table; do
  not copy a compressed-size figure without checking the current packaging
  rules and reconciling the product-specific docs.
- Pages remains in the coverage list; it is not mapped to a retirement.
  Its Functions quotas belong to Workers, while build tiers are Free/Pro/Business.
- R2 columns are storage classes, not invented Free/Paid subscription tiers.
  Standard’s free allowance does not apply to Infrequent Access. Object-size
  ceiling and upload ceilings differ; this pass records the usable single-part
  and multipart upload ceilings.
- Local-development descriptions are documented vendor behavior, not a claim
  that this task ran each Cloudflare emulator. Local tests cannot establish
  global propagation, production throughput, or latency. R2 S3-client checks
  are distinct from testing the Workers binding.
- Limits tables are selected practical quotas, not an exhaustive mirror of
  the vendor documentation. Paid inclusions are labeled as allowances and
  source links supply remaining limits and pricing. No prices are published.
- Edge/network and the two required configuration notes remain M2.2;
  security/access is M2.3; media/AI and complete owner review are M2.4.
  The entire service stays draft.

## Diagram evidence

The diagram is an editorial choice aid, not a claim that every service must be
used or that operations happen in sequence. Worker bindings are supported by
the local-development guide. Node detail text is read directly from the dated
product records, so capability/local-development claims share their sources.

## Earlier introduction

M1.1 verified the broad compute/storage/network/security catalog description
against [Cloudflare Developer Docs](https://developers.cloudflare.com/) on
2026-09-08. M2.1 replaces that introduction with the developer-platform draft.

## 2026-09-08 — Visual overview and product architecture pages

Owner requested recognizable capability icons, hover details, product-page
navigation, and deeper diagrams on each product page. The overview is now an
illustrative application map; it does not prescribe every depicted product.
The eight MDX sub-pages cite their diagram sources independently from YAML
product/limits records. Diagram descriptions live in `content/diagrams.ts`.

Current official architecture/API sources read for this iteration:

- [Workers HTTP fetch handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/)
- [Workers resource bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/)
- [Workers local development](https://developers.cloudflare.com/workers/local-development/)
- [Pages Git integration and builds](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Pages Functions bindings](https://developers.cloudflare.com/pages/functions/bindings/)
- [Pages build and Functions limits](https://developers.cloudflare.com/pages/platform/limits/)
- [How KV stores, caches, and reads data](https://developers.cloudflare.com/kv/concepts/how-kv-works/)
- [R2 architecture](https://developers.cloudflare.com/r2/how-r2-works/)
- [R2 S3 API compatibility](https://developers.cloudflare.com/r2/api/s3/api/)
- [R2 Workers binding API](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/)
- [D1 Worker binding API](https://developers.cloudflare.com/d1/worker-api/)
- [D1 overview](https://developers.cloudflare.com/d1/)
- [D1 local development](https://developers.cloudflare.com/d1/best-practices/local-development/)
- [D1 row-based usage accounting](https://developers.cloudflare.com/d1/platform/pricing/)
- [Durable Object identity, compute, and storage](https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/)
- [Durable Objects stubs and SQLite setup](https://developers.cloudflare.com/durable-objects/get-started/)
- [Durable Objects limits](https://developers.cloudflare.com/durable-objects/platform/limits/)
- [Queue producers, consumers, and messages](https://developers.cloudflare.com/queues/reference/how-queues-works/)
- [Queues delivery guarantees](https://developers.cloudflare.com/queues/reference/delivery-guarantees/)
- [Queues batching, acknowledgements, and retries](https://developers.cloudflare.com/queues/configuration/batching-retries/)
- [Queues dead-letter handling](https://developers.cloudflare.com/queues/configuration/dead-letter-queues/)
- [Workflows overview](https://developers.cloudflare.com/workflows/)
- [Workflow sleeps and step retry policies](https://developers.cloudflare.com/workflows/build/sleeping-and-retrying/)
- [Workflow parameters, events, and persisted results](https://developers.cloudflare.com/workflows/build/events-and-parameters/)

The diagrams simplify logical paths: KV collapses upper cache tiers; R2 shows
the vendor-documented gateway/metadata/cache/storage pieces; Queues shows a
push consumer with optional DLQ; Workflows shows one possible step/pause path.
Arrows label calls or control flow, not all response traffic. The DO capacity
contradiction remains on its dedicated limits page. New icon paths are authored
in the repository and introduce no assets or third-party dependencies.

## 2026-09-08 — Workflow relationships and useful Durable Objects examples

Rechecked [Workflow triggers](https://developers.cloudflare.com/workflows/build/trigger-workflows/),
[resource bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/),
[service bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/),
and [Durable Objects design guidance](https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/).
A Worker creates a Workflow instance through its Workflow binding. Workflow
step code runs in the Workflow; access to bindings and Worker service calls
supports an optional step-to-Worker service connection. The map does not imply
that every step needs a separately deployed Worker, or that starting a Workflow
automatically calls the initiating Worker back. Both relationships are labeled.

Durable Objects copy now leads with a named unit of code and its own storage,
using rooms, game sessions, shared documents, and tenant workspaces as examples.
The detailed diagram illustrates one chat room's identity, code, callers,
memory, and persistent data. The source recommends choosing a natural unit of
coordination rather than one global object for the whole application. Product
and page claim dates were reverified independently of unchanged limit dates.

Browser checks under full CSP cover pointer enter, movement into the note,
pointer exit, focus/blur, Escape and navigation in both themes at 390/1280px.
Hover notes now dismiss after leaving the icon/note area; a short grace period
allows moving across the gap into the note. No-JavaScript reading still works.

## 2026-09-08 — Workers runtime mental model

Verified the official Workers runtime, Wasm overview/interop, errors, limits,
context, Node compatibility, fetch/cache APIs and cache behavior pages linked
in `content/workers/index.mdx`; Emscripten documents C/C++ compilation. Added a
separate isolate-boundary diagram and illustrative scheduling timeline ahead
of the request flow. One isolate per origin is not guaranteed; global reuse is
per instance and ephemeral. Distinguish request-owned I/O, plain cached data,
Wasm imports/exports, and env resource bindings. Wasm shares isolate memory and
does not add threads. Memory (JS + Wasm) is per isolate; CPU is per invocation.
Fetch is outbound HTTP (distinct from inbound handler); Cache API entries are
data-center-local, outside the heap, non-durable, and not Tiered Cache. Fetch
cache behavior depends on eligibility/configuration. Node compatibility docs
now describe default enablement for recent dates; avoid an unconditional claim
that every project must enable the flag. No quota values were changed.

## 2026-09-08 — Local runtime versus deployment tooling

Owner clarified that local development means runnable equivalents. Workers now
leads with Apache-2.0 workerd (direct serve command and configuration samples),
then Miniflare for local resource simulation. Verified workerd’s official README,
Workers local-development docs and Wrangler commands. Wrangler has its own
Deployment section, including its optional local dev wrapper. No deployment was
performed. The localDev open-source label includes vendor-maintained runtimes.

## 2026-09-08 — Carry Workers conventions across the remaining pages

Rechecked local-data/Miniflare documentation, the binding-mode support matrix,
Pages local Functions/Direct Upload, KV/R2/D1/Queues setup guides, Durable Object
lifecycle/class configuration, and Workflow local development/setup/rules.
Each affected MDX page records its official sources and the unchanged same-day
verification date. Local entries now identify the runnable runtime/emulator
instead of naming a CLI command as the equivalent. Distinguish local API tests
from distributed freshness, durability, delivery, or S3-interface checks.
Wrangler wrappers and hosted provisioning live in Deployment. DO class lifecycle
docs now describe declarative exports alongside legacy migrations; use the
current guide rather than prescribing a legacy-only array. Product limits were
not changed or represented as newly reverified by this pass.

Architecture treatment: Pages separates builds, static delivery, and Functions;
KV distinguishes namespace data from cached reads; R2 separates object data and
API surfaces; D1 separates statements/results from database state; DO marks
persistent versus temporary state; Queues distinguishes publish from processing;
Workflows distinguishes durable progress from live execution state. Existing
flow diagrams remain, with Workers runtime links where useful. Owner approval
is limited to overview and Workers; other pages are ready for their review.

## 2026-09-08 — Pages Functions authoring API

Verified Pages Functions API reference, file routing/invocation rules, and
advanced mode. Clarified onRequest(context) and context.env versus a standalone
Worker fetch handler, plus _worker.js replacing file routing/middleware and
explicit ASSETS fallback. The diagram labels the default handler API. Static
asset fallback is distinct from bypassing invocation through _routes.json.
Sources are on the Pages page with the same-day verification date.

## 2026-09-08 — Short product introductions

Added one or two sentences above each diagram using the pages’ cited product
models and use cases. Rechecked Pages Functions and the official storage-choice
guide for static/dynamic capabilities and storage examples. The source guide
is included on the four storage/state pages. No limits changed.

## 2026-09-08 — KV latency and consistency mental model

Expanded KV with hot/cold/write paths, advertised hot-read latency (not a bound),
read cache TTL versus stored-key expiration, an illustrative cross-location
update sequence, and conventional Redis/Memcached comparisons. Verified KV read
and write API docs, product page, Redis types/replication/latency docs, and
Memcached model/protocol docs; sources are recorded on the page. KV read docs now
allow cacheTtl >=30 seconds, default60. The write API’s immediate-local-visibility
wording is stronger than the concepts page: preserve the latter’s explicit
not-guaranteed caveat. No cold-read/write latency bound is asserted. Measurement
and workload-selection advice is identified as our guidance. Existing limit
records are unchanged.

## 2026-09-08 — KV scope and shared-state alternative

Owner removed the Redis/Memcached comparison. Removed its section and exclusive
sources, retaining KV latency/freshness guidance. Added a short Durable Object
pointer distinguishing globally addressable state from low-latency access at
every edge location. Verified the DO concepts/location docs and, for the owner's
question, in-memory state and Workers Cache API locality. A custom in-memory DO
cache must tolerate instance resets; the Cache API does not replicate its
contents across data centers.

## 2026-09-09 — Latency coverage across developer-platform products

Added a Latency navigation target to all eight product pages. KV retains its
advertised <5 ms hot-read figure and freshness explanation. New sources and
same-day page dates cover Workers runtime startup, Pages Tiered Cache, R2 request
paths/Local Uploads, D1 replication/timing metadata, DO SQLite/location, Queues
send/batching, and Workflow scheduling/retries. Product limit records were not
reverified or changed.

Numeric evidence: Workers warm-instance routing adds <1 ms TTFB for the internal
proxy hop according to the sharding article, not total request time. R2's February 2026 announcement shows approximately 2 s to
500 ms p50 upload TTLB but omits object-size/workload details; retain that
limitation. DO's September 2024 SQLite article describes microsecond internal
queries, with output gates still waiting for write confirmation. Queues' October
2024 report measures median sends (~60 ms), not completion or consumer delivery;
current batching defaults add up to 5 seconds of intentional wait for sparse
traffic. No general application/request range established for Workers, Pages,
D1, or Workflows, nor R2 GET/HEAD or DO RPC. Do not infer one from marketing,
timeouts, CPU budgets, or throughput. Workflows limits prose and table disagree
on concurrency counts; this pass only uses the scheduling behavior, no count.

Future authoring now requires the same coverage in content-schema.md and the
service template. Record measured conditions and evidence gaps, not invented
universal latency ranges. Owner acceptance of the earlier pages is unchanged;
these additions remain part of the current content iteration.

## 2026-09-09 — Prominent product and API references

All eight products now supply labeled API references beside their existing
product-docs URL in the shared header. Verified Workers runtime, Pages Functions,
KV/D1/DO binding indexes, R2 binding/S3 compatibility, Queues JavaScript, Workflows
Workers API and REST resource indexes. The Workers REST index exceeds the web
reader size limit; retain its canonical resource URL. Distinguish management
REST from application APIs for Workers, Pages, R2 and DO. Product verification
dates updated; limit dates remain unchanged. The optional apiReferences schema
field and authoring template carry this convention to future services.

## 2026-09-09 — Simple application API examples

Added one TypeScript example to every product page: Worker service-binding HTTP,
Pages Function greeting, KV lookup/update call, R2 stream/upload call, D1 bound
query and seed SQL, persistent DO counter via RPC, Queues producer/consumer,
and Workflow creation plus step implementation. Binding names and setup context
are explicit, with official API sources and the same-day verification date.
Examples are illustrative application code, not site runtime code. Typechecked
all eight fenced TypeScript samples in a scratch project against official
@cloudflare/workers-types 5.20260908.1 with strict mode; no site dependency added.
No hosted resource was provisioned and no sample was deployed. D1/DO SQL is
checked separately against local SQLite. API example anchors are part of the
existing output fixture checks and future authoring guidance.

## 2026-09-09 — Simplify introductory API samples

Owner prefers official-style JavaScript samples without Env/type declarations.
Converted the eight examples and replaced the Workers service-binding example
with global fetch to a fixed HTTP endpoint. Keep a brief service-binding pointer
for private Worker calls. Resource APIs retain env bindings because they select
configured namespaces, buckets, databases, queues, or classes. The earlier strict
TypeScript check applies to the original examples; the revised JavaScript is
syntax-checked. Authoring guidance records this preference for sample code;
site TypeScript remains strict.

### D1 query return path (2026-09-09)

Verified the [prepared statement API](https://developers.cloudflare.com/d1/worker-api/prepared-statements/):
awaited query results are available to the calling Worker. Removed the separate
application-data destination and routed the result through the binding API
back to its awaiting Worker handler; result
shape varies by method (first versus all/run). This is a logical call/return
sequence, not separate deployed services for each API step.

### Durable Objects general-purpose framing (2026-09-09)

Replaced the chat-room-specific diagram labels with object identity, singleton
code, private persistent storage, and shared temporary memory. The introduction
and explanation now lead with coherent caches, counters, tenant coordination,
and aggregation; collaboration is one application, not the object type. Based on
the verified [Durable Objects concepts](https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/).
Patterns are application code built on the primitive, not built-in Memcached
compatibility. Cache guidance retains eviction and caller-distance limitations.

Owner wording refinement (2026-09-09): use “A named global singleton” and
explicitly identify the Worker-style code instance specific to each Durable
Object alongside its private durable storage. The concepts source above describes
a Durable Object as a special kind of Worker combining compute and storage.

### Pub/sub pattern (2026-09-09)

Added an event bus / pub/sub broker to the Durable Objects use cases and hover.
An object per topic or partition is an application design built on the documented
[WebSocket coordination and fan-out APIs](https://developers.cloudflare.com/durable-objects/best-practices/websockets/).
Subscriber tracking, persistence, and replay are broker code the developer writes,
not automatic delivery guarantees supplied by Durable Objects.

### Queues work sharing (2026-09-09)

Verified multiple producers and one configured push consumer in
[How Queues works](https://developers.cloudflare.com/queues/reference/how-queues-works/),
[concurrent Worker invocations](https://developers.cloudflare.com/queues/configuration/consumer-concurrency/),
and [multiple pull readers with distinct leased batches](https://developers.cloudflare.com/queues/configuration/pull-consumers/).
The page and push diagram explain work sharing rather than broadcast. Retain
at-least-once delivery: a retry or lease expiry may deliver to another reader;
never describe this as exactly-once processing or a permanent reader assignment.

Queue example wiring (2026-09-09): made the producer binding JOBS versus actual
queue name jobs explicit, showed matching producers/consumers configuration,
and used batch.queue in the handler. The previously verified How Queues Works
source documents one Worker consuming multiple queues through that handler.

### Configuration beside API examples (2026-09-09)

Added relevant Wrangler JSON immediately before JavaScript for KV, R2, D1,
Durable Objects, Queues, and Workflows; moved Queues configuration out of
Deployment. Excerpts explicitly merge into an existing Worker configuration.
Names match the handlers, with placeholders for existing storage resources.
Verified the Wrangler configuration reference for KV/R2/D1, the Workflow guide
for name/binding/class_name, and the Durable Objects getting-started guide for
bindings plus the current exports declaration with SQLite storage. Workers fetch
and the Pages greeting use no resource bindings and need no extra block.

### Workflow trigger coverage (2026-09-09)

Expanded the Workflow page with a Triggers navigation target and configuration
for direct schedules, queue consumers, Worker Cron Triggers, cross-Worker bindings,
and Pages service bindings. Also covers HTTP/webhooks, Durable Object methods,
parent Workflows, REST, Wrangler, dashboard runs, and local Explorer. The trigger
node now includes schedules instead of implying a Worker-only entry point.

Verified trigger-workflows, the get-started guide, Wrangler commands, Cron
Triggers, Pages integration, and the current create-instance REST reference.
REST params is documented as a JSON-encoded string and accepts Workers Scripts
Write permission; binding params remains an object. Direct schedules carry
event.schedule, so the greeting now defaults when no name payload is supplied.
Queue IDs are stable on repeated starts; production callers must reconcile
existing instances on redelivery. No trigger was deployed or called remotely.

Event subscriptions are indirect inputs through a queue consumer. The Workflows
event-subscription reference documents emitted lifecycle events. Configuration
is on the queue via its Subscriptions tab:
https://developers.cloudflare.com/queues/event-subscriptions/manage-event-subscriptions/
Events sent to an existing waiting instance are distinguished from creation.
