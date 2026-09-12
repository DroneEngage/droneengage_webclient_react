// Runtime <link> loader for vendor CSS that's shared by several lazy-loaded
// pages (e.g. leaflet.css needed by home/planning/mobile/accounts).
//
// Why: each page previously did `import 'leaflet/dist/leaflet.css'`, which
// made webpack bundle a copy of that CSS into that page's own chunk. Since
// leaflet.css is byte-identical across pages, this meant the browser
// downloaded the same stylesheet again under a different chunk URL every
// time the user navigated to a different map page - no shared HTTP cache
// entry despite the content being unchanged. Loading it once at runtime via
// a single stable URL (like js_theme_utils.js already does for
// bootstrap.min.css) lets the browser fetch and cache it once for the
// whole session.
//
// A loaded stylesheet is left in the document across page navigations
// (never removed) - it's small, has no theming/race concerns, and toggling
// it on every route change would just reintroduce a duplicate-fetch risk
// with no benefit.

const loadedIds = new Set();
const pendingLoads = new Map();

/**
 * Ensure a vendor stylesheet is present in <head>. Safe to call from every
 * page that needs it - subsequent calls with the same id resolve immediately
 * without touching the DOM again.
 * @param {string} id - stable element id for the <link> (also used for de-dup)
 * @param {string} href - stylesheet URL (served from /public, unprocessed by webpack)
 * @returns {Promise<void>}
 */
export const fn_ensureVendorCSS = (id, href) => {
  if (loadedIds.has(id) || document.getElementById(id)) {
    loadedIds.add(id);
    return Promise.resolve();
  }

  const pending = pendingLoads.get(id);
  if (pending) return pending;

  const promise = new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.id = id;
    link.href = href;
    link.onload = () => {
      loadedIds.add(id);
      pendingLoads.delete(id);
      resolve();
    };
    link.onerror = () => {
      pendingLoads.delete(id);
      link.remove();
      reject(new Error(`Failed to load vendor CSS: ${href}`));
    };
    document.head.appendChild(link);
  });

  pendingLoads.set(id, promise);
  return promise;
};

export const VENDOR_CSS = {
  leaflet: { id: 'vendor-css-leaflet', href: '/css/vendor/leaflet/leaflet.css' },
};
