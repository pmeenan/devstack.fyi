const repository = 'https://github.com/pmeenan/devstack.fyi';

export function entryPath(id: string): string {
  return `/${id.split('/').map(encodeURIComponent).join('/')}/`;
}

export function contentPath(id: string): string {
  const [service, ...page] = id.split('/');
  return ['services', service, 'content', ...page, 'index.mdx'].join('/');
}

export function editUrl(path: string): string {
  return `${repository}/edit/main/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export { repository };
