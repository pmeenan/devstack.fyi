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
