const CACHE_NAME = "geforce-pwa-v1";
const ASSETS_TO_CACHE = [
  "./index.html",
  "./login.html",
  "./register.html",
  "./dashboard.html",
  "./projects.html",
  "./project-details.html",
  "./tasks.html",
  "./profile.html",
  "./users.html",
  "./css/style.css",
  "./js/api.js",
  "./js/auth.js",
  "./js/common.js",
  "./js/dashboard.js",
  "./js/projects.js",
  "./js/project-details.js",
  "./js/tasks.js",
  "./js/profile.js",
  "./js/users.js",
  "./manifest.json"
];

// Install Event - Caches the assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event - Cleans up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Deleting old cache", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch Event - Serves from cache if available, otherwise fetches from network
self.addEventListener("fetch", (event) => {
  // Only cache GET requests, ignore API calls to backend (assuming they have /api/ in URL)
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found, else fetch from network
      return response || // Using the native fetch API to make a network request to our Java backend
fetch(event.request).catch(() => {
        // Fallback for offline (optional: return a specific offline HTML page)
      });
    })
  );
});
