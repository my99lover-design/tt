const CACHE_NAME = "gimpo-b-pwa-auto";
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

self.addEventListener("install", event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await Promise.all(APP_SHELL.map(async url => {
            try {
                const request = new Request(url, { cache: "reload" });
                const response = await fetch(request);
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

    if (request.mode === "navigate") {
        event.respondWith(networkFirstPage(request));
        return;
    }

    event.respondWith(networkFirstAsset(request));
});

async function networkFirstPage(request) {
    try {
        const response = await fetch(new Request(request, { cache: "no-store" }));
        if (response && response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put("./index.html", response.clone());
        }
        return response;
    } catch (error) {
        return (await caches.match("./index.html")) || (await caches.match("./")) || Response.error();
    }
}

async function networkFirstAsset(request) {
    try {
        const response = await fetch(new Request(request, { cache: "no-store" }));
        if (response && response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return (await caches.match(request, { ignoreSearch: true })) || Response.error();
    }
}
