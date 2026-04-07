let currentHash = $state(window.location.hash || '#/');

export function getCurrentHash() {
  return currentHash;
}

export function navigate(path) {
  window.location.hash = path;
}

export function initRouter() {
  const handler = () => {
    currentHash = window.location.hash || '#/';
  };
  window.addEventListener('hashchange', handler);
  return () => window.removeEventListener('hashchange', handler);
}

const routes = [
  { pattern: /^#\/$/, name: 'event-list' },
  { pattern: /^#\/events\/new$/, name: 'event-new' },
  { pattern: /^#\/events\/([^/]+)\/edit$/, name: 'event-edit' },
  { pattern: /^#\/events\/([^/]+)$/, name: 'event-detail' },
  { pattern: /^#\/users$/, name: 'user-list' },
];

export function matchRoute(hash) {
  for (const route of routes) {
    const match = hash.match(route.pattern);
    if (match) {
      return { name: route.name, params: match.slice(1) };
    }
  }
  return { name: 'event-list', params: [] };
}
