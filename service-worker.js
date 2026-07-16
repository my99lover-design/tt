const CACHE_VERSION = "v40";
const APP_CACHE = `gimpo-b-app-${CACHE_VERSION}`;
const IMAGE_CACHE = `gimpo-b-images-v4`;
const DATA_CACHE = `gimpo-b-data-v5`;
const RUNTIME_CACHE = `gimpo-b-runtime-v3`;
const NAVIGATION_TIMEOUT_MS = 2000;

const APP_SHELL = [
    "./",
    "./index.html",
    "./style.css?v=20260716-15",
    "./script.js?v=20260716-15",
    "./manifest.json",
    "./icons/icon-180.png",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];
const DATA_FILES = ["./locations.json"];
const GATE_IMAGES = [
    "./gate-images/썬앤빌.webp",
    "./gate-images/럭스A.webp",
    "./gate-images/럭스B.webp",
    "./gate-images/루체뷰1.webp"
];
const MANAGED_PREFIXES = ["gimpo-b-app-", "gimpo-b-images-", "gimpo-b-data-", "gimpo-b-runtime-", "gimpo-b-pwa-"];

self.addEventListener("install", event => {
    event.waitUntil((async () => {
        const appCache = await caches.open(APP_CACHE);
        // 핵심 앱 파일은 하나라도 실패하면 새 서비스워커 설치를 중단해 기존 버전을 유지합니다.
        for (const url of APP_SHELL) {
            const response = await fetch(new Request(url, { cache: "reload" }));
            if (!response?.ok) throw new Error(`핵심 파일 캐시 실패: ${url}`);
            await appCache.put(url, response.clone());
        }
        const imageCache = await caches.open(IMAGE_CACHE);
        await Promise.all(GATE_IMAGES.map(url => cacheOptional(imageCache, url)));
        const dataCache = await caches.open(DATA_CACHE);
        await Promise.all(DATA_FILES.map(url => cacheOptional(dataCache, url)));
    })());
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil((async () => {
        const keep = new Set([APP_CACHE, IMAGE_CACHE, DATA_CACHE, RUNTIME_CACHE]);
        const keys = await caches.keys();
        await Promise.all(keys.filter(key => MANAGED_PREFIXES.some(prefix => key.startsWith(prefix)) && !keep.has(key)).map(key => caches.delete(key)));
        await self.clients.claim();
    })());
});

self.addEventListener("message", event => {
    if (event.data?.type === "GET_CACHE_STATUS") {
        event.waitUntil((async () => {
            const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
            const status = await getCacheStatus();
            for (const client of clients) client.postMessage({ type: "CACHE_STATUS", status });
        })());
    }
    if (event.data?.type === "REPAIR_CACHES") {
        event.waitUntil((async () => {
            try {
                const appCache = await caches.open(APP_CACHE);
                for (const url of APP_SHELL) {
                    const response = await fetch(new Request(url, { cache: "reload" }));
                    if (!response?.ok) throw new Error(`핵심 파일 캐시 실패: ${url}`);
                    await appCache.put(url, response.clone());
                }
                const imageCache = await caches.open(IMAGE_CACHE);
                await Promise.all(GATE_IMAGES.map(url => cacheOptional(imageCache, url)));
                const dataCache = await caches.open(DATA_CACHE);
                await Promise.all(DATA_FILES.map(url => cacheOptional(dataCache, url)));
                event.source?.postMessage({ type: "CACHE_REPAIR_RESULT", success: true, status: await getCacheStatus() });
            } catch (error) {
                event.source?.postMessage({ type: "CACHE_REPAIR_RESULT", success: false, message: error?.message || "캐시 복구 실패" });
            }
        })());
    }
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
        event.respondWith(navigationNetworkFirst(request, "./index.html", event));
        return;
    }
    if (url.pathname.endsWith("/locations.json")) {
        event.respondWith(networkFirst(request, DATA_CACHE));
        return;
    }
    if (url.pathname.includes("/gate-images/") || url.pathname.includes("/icons/")) {
        event.respondWith(cacheFirst(request, IMAGE_CACHE));
        return;
    }
    if (url.pathname.endsWith("/script.js") || url.pathname.endsWith("/style.css") || url.pathname.endsWith("/manifest.json")) {
        event.respondWith(cacheFirst(request, APP_CACHE));
        return;
    }
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
});

async function cacheOptional(cache, url) {
    try {
        const response = await fetch(new Request(url, { cache: "reload" }));
        if (response?.ok) await cache.put(url, response.clone());
    } catch (error) {
        console.warn("선택 파일 캐시 생략:", url, error);
    }
}

async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response?.ok) await cache.put(request, response.clone());
        return response;
    } catch (error) {
        return Response.error();
    }
}

async function navigationNetworkFirst(request, fallbackUrl, event) {
    const cache = await caches.open(APP_CACHE);
    const networkPromise = fetch(new Request(request, { cache: "no-cache" })).then(async response => {
        if (response?.ok) await cache.put(request, response.clone());
        return response;
    });
    event.waitUntil(networkPromise.catch(() => {}));
    const fastNetworkResponse = await Promise.race([networkPromise.catch(() => null), new Promise(resolve => setTimeout(() => resolve(null), NAVIGATION_TIMEOUT_MS))]);
    if (fastNetworkResponse) return fastNetworkResponse;
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const fallback = await cache.match(fallbackUrl, { ignoreSearch: true });
    if (fallback) return fallback;
    try { return await networkPromise; } catch (error) { return Response.error(); }
}

async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    try {
        const response = await fetch(new Request(request, { cache: "no-cache" }));
        if (response?.ok) await cache.put(request, response.clone());
        return response;
    } catch (error) {
        const cached = await cache.match(request, { ignoreSearch: true });
        return cached || Response.error();
    }
}

async function getCacheStatus() {
    const result = { version: CACHE_VERSION, caches: {} };
    for (const name of [APP_CACHE, IMAGE_CACHE, DATA_CACHE, RUNTIME_CACHE]) {
        const cache = await caches.open(name);
        result.caches[name] = (await cache.keys()).length;
    }
    return result;
}
