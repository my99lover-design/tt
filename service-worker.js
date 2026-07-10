const CACHE_NAME = "gimpo-b-pwa-runtime-v2";
const APP_SHELL = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./locations.json",
    "./manifest.json",
    "./icons/icon-180.png",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

const TEXT_ASSETS = new Set([
    "index.html",
    "style.css",
    "script.js",
    "locations.json",
    "manifest.json"
]);

self.addEventListener("install", event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await Promise.all(APP_SHELL.map(async url => {
            try {
                const response = await fetch(new Request(url, { cache: "reload" }));
                if (response && response.ok) await cache.put(url, response.clone());
            } catch (error) {
                console.warn("초기 캐시 저장 실패:", url, error);
            }
        }));
    })());
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys
            .filter(key => key !== CACHE_NAME && key.startsWith("gimpo-b-pwa-"))
            .map(key => caches.delete(key)));
        await self.clients.claim();
    })());
});

self.addEventListener("fetch", event => {
    const request = event.request;
    if (request.method !== "GET") return;

    const url = new URL(request.url);

    if (url.hostname === "script.google.com" || url.hostname === "script.googleusercontent.com") {
        event.respondWith(fetch(request));
        return;
    }

    if (url.origin !== self.location.origin) return;

    const fileName = request.mode === "navigate"
        ? "index.html"
        : url.pathname.split("/").pop() || "";
    const notifyUpdate = TEXT_ASSETS.has(fileName);

    event.respondWith(staleWhileRevalidate(event, request, notifyUpdate));
});

async function staleWhileRevalidate(event, request, notifyUpdate) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: true });

    const refreshPromise = fetch(new Request(request, { cache: "no-store" }))
        .then(async response => {
            if (!response || !response.ok) return cached || response;

            const changed = cached && notifyUpdate
                ? await responsesDiffer(cached, response)
                : false;

            await cache.put(request, response.clone());
            if (changed) await broadcastUpdate(new URL(request.url).pathname);
            return response;
        })
        .catch(error => {
            console.warn("네트워크 갱신 실패:", request.url, error);
            return cached || Response.error();
        });

    if (cached) {
        event.waitUntil(refreshPromise);
        return cached;
    }

    return refreshPromise;
}

async function responsesDiffer(cached, fresh) {
    const cachedEtag = cached.headers.get("etag");
    const freshEtag = fresh.headers.get("etag");
    if (cachedEtag && freshEtag) return cachedEtag !== freshEtag;

    const cachedLastModified = cached.headers.get("last-modified");
    const freshLastModified = fresh.headers.get("last-modified");
    const cachedLength = cached.headers.get("content-length");
    const freshLength = fresh.headers.get("content-length");

    if (cachedLastModified && freshLastModified && cachedLength && freshLength) {
        if (cachedLastModified === freshLastModified && cachedLength === freshLength) return false;
    }

    try {
        return (await cached.clone().text()) !== (await fresh.clone().text());
    } catch (error) {
        return true;
    }
}

async function broadcastUpdate(pathname) {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clients) client.postMessage({ type: "APP_UPDATED", pathname });
}
