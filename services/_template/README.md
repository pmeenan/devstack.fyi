# Service authoring template

This fictional example is excluded from every collection. Replace its service,
product, sources and dates when copying it; see the root docs/content-schema.md.
Record research and remaining coverage in `docs/research.md`.

For a topic directory, replace `areas: []` with ordered declarations, for example:

```yaml
areas:
  - id: build
    name: Build applications
    summary: Application guides.
    status: available
  - id: connect
    name: Connect networks
    summary: Connectivity guides are planned.
    status: planned
```

Create `content/build/index.mdx` with page frontmatter (`title`, `summary`,
`area: build`, `sources`, `lastVerified`) and its focused overview. Put
`area: build` in every existing product YAML and sub-page, including the overview.
Optional page `sections: [{ id: introduction, name: Introduction }]` adds native
section links; author matching anchors. Product pages retain their canonical
`content/<product>/index.mdx` location and matching product-record membership.
Do not create routes for planned areas. With `areas: []`, omit page/product area
fields and keep the original service-wide navigation. Map the complete agreed
scope in working docs before moving existing content into areas.
