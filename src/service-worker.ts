/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { build, files, version } from '$service-worker';

const CACHE = `cache-${version}`;

const ASSETS = [
  ...build, // 应用构建出的所有页面和端点
  ...files  // `static` 文件夹下的所有文件
];

// 1. 明确告诉 TypeScript，'install' 事件的 event 是 ExtendableEvent
self.addEventListener('install', (event) => {
  async function addFilesToCache() {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
  }
  (event as ExtendableEvent).waitUntil(addFilesToCache());
});

// 2. 明确告诉 TypeScript，'activate' 事件的 event 也是 ExtendableEvent
self.addEventListener('activate', (event) => {
  async function deleteOldCaches() {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);
    }
  }
  (event as ExtendableEvent).waitUntil(deleteOldCaches());
});

// 3. 明确告诉 TypeScript，'fetch' 事件的 event 是 FetchEvent
self.addEventListener('fetch', (event) => {
  const fetchEvent = event as FetchEvent;
  const request = fetchEvent.request;

  if (request.method !== 'GET') return;

  async function respond() {
    const url = new URL(request.url);
    const cache = await caches.open(CACHE);

    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return fetch(request);
  }

  fetchEvent.respondWith(respond());
});