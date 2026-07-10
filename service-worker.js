const CACHE_NAME = "gimpo-b-pwa-v3";
const APP_SHELL = ["./", "./index.html", "./style.css?v=3", "./script.js?v=3", "./locations.json", "./manifest.json", "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
    const request = event.request;
    if (request.method !== "GET") return;

    const url = new URL(request.url);
    if (url.hostname === "script.google.com" || url.hostname === "script.googleusercontent.com") {
        event.respondWith(fetch(request));
        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(fetch(request).then(response => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
            return response;
        }).catch(() => caches.match("./index.html")));
        return;
    }

    if (url.origin !== self.location.origin) return;

    if (url.pathname.endsWith("/locations.json")) {
        const canonicalRequest = new Request(new URL("./locations.json", self.location.href));
        event.respondWith(fetch(request).then(response => {
            if (response && response.ok) caches.open(CACHE_NAME).then(cache => cache.put(canonicalRequest, response.clone()));
            return response;
        }).catch(() => caches.match(canonicalRequest)));
        return;
    }

    event.respondWith(fetch(request).then(response => {
        if (response && response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
        return response;
    }).catch(() => caches.match(request)));
});
