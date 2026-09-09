import { getCollection } from 'astro:content';

/** Validate relationships once before routes render, including orphan records. */
export async function loadContent() {
  const [services, pages, products] = await Promise.all([
    getCollection('services'),
    getCollection('pages'),
    getCollection('products'),
  ]);
  const byId = new Map(services.map((service) => [service.id, service]));
  for (const entry of [...pages, ...products]) {
    const serviceId = entry.id.split('/')[0]!;
    if (!byId.has(serviceId))
      throw new Error(`${entry.id}: missing parent service ${serviceId}`);
  }
  for (const service of services) {
    const groups = service.data.groups.map((group) => group.id);
    if (new Set(groups).size !== groups.length)
      throw new Error(`${service.id}: duplicate group id`);
  }
  for (const service of services) {
    const areas = service.data.areas;
    if (new Set(areas.map((area) => area.id)).size !== areas.length)
      throw new Error(`${service.id}: duplicate area id`);
    for (const area of areas) {
      const overview = pages.find(
        (page) => page.id === `${service.id}/${area.id}`,
      );
      if (area.status === 'available' && overview?.data.area !== area.id)
        throw new Error(
          `${service.id}/${area.id}: available area needs a matching overview`,
        );
      if (area.status === 'planned' && overview)
        throw new Error(
          `${overview.id}: planned area must not have an overview`,
        );
      if (products.some((product) => product.id === `${service.id}/${area.id}`))
        throw new Error(
          `${service.id}/${area.id}: area route collides with a product`,
        );
    }
    for (const entry of [...pages, ...products].filter((entry) =>
      entry.id.startsWith(`${service.id}/`),
    )) {
      const area = areas.find((area) => area.id === entry.data.area);
      if ((areas.length || entry.data.area) && !area)
        throw new Error(`${entry.id}: missing or undeclared area`);
      if (area?.status === 'planned')
        throw new Error(`${entry.id}: content belongs to a planned area`);
    }
  }
  for (const page of pages) {
    const product = products.find((product) => product.id === page.id);
    if (product && product.data.area !== page.data.area)
      throw new Error(`${page.id}: page and product area must match`);
  }
  for (const product of products) {
    const service = byId.get(product.id.split('/')[0]!)!;
    if (
      product.data.group &&
      !service.data.groups.some((group) => group.id === product.data.group)
    ) {
      throw new Error(
        `${product.id}: undeclared group "${product.data.group}"`,
      );
    }
  }
  services.sort((a, b) => a.data.title.localeCompare(b.data.title));
  pages.sort(
    (a, b) =>
      (a.data.order ?? Infinity) - (b.data.order ?? Infinity) ||
      a.data.title.localeCompare(b.data.title),
  );
  products.sort(
    (a, b) =>
      (a.data.order ?? Infinity) - (b.data.order ?? Infinity) ||
      a.data.name.localeCompare(b.data.name),
  );
  return { services, pages, products };
}
