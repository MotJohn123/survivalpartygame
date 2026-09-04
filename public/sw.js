const CACHE_NAME = "survival-party-shell-v1";
const APP_SHELL = ["/", "/game", "/leaderboard", "/dashboard", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "Survival Party", body: "Novinky z tábora." };
  event.waitUntil(self.registration.showNotification(data.title ?? "Survival Party", { body: data.body ?? "Novinky z tábora.", icon: "/icon.svg", badge: "/icon.svg" }));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      return cached || caches.match("/");
    }),
  );
});
