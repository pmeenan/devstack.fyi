# Service template

Read the root AGENTS.md, docs/workflow.md, and docs/content-schema.md. Copy
this directory to the chosen service slug, then replace all fictional content
with dated, official-source research before publishing. Keep the new service
in draft until the owner reviews it. Working docs stay outside `content/`.

Every product needs latency coverage following docs/content-schema.md: sourced
rough figures with operation/conditions, or an explicit evidence gap and latency
drivers. Separate measurements from guarantees and latency from consistency.

Provide official product `docs` and labeled `apiReferences` for each API surface;
the shared product header exposes them prominently.

Include a small, sourced API usage example with binding/setup prerequisites and
handler context; prefer plain JavaScript for introductory samples. Follow
docs/content-schema.md and check sample syntax/API usage.

For samples requiring bindings/config changes, put a labeled configuration block
immediately before application code, with matching names and explicit placeholders.
