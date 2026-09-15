/* Offline shell for repeat visits. It deliberately caches only same-origin
   public assets, never API/admin responses or visitor-entered data. */
const CACHE_NAME = "anirudh-portfolio-shell-v1";
const APP_SHELL = ["./", "./index.html", "./favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

async function navigationResponse(request) {
  try {
    // HTML is the deployment manifest for Vite's hashed JS/CSS files. It
    // must be refreshed online; serving an old cached index after a deploy
    // can point visitors at assets that no longer exist and leave a blank
    // page. The cache remains the offline fallback.
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) || (await caches.match("./index.html")) || (await caches.match("./"));
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(navigationResponse(request));
    return;
  }

  if (["script", "style", "font", "image"].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
  }
});
