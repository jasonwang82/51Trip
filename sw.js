/**
 * Service Worker for Travel App Performance Optimization
 * Implements caching strategies for better load times and offline support
 */

const CACHE_VERSION = 'travel-app-v1.2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Static resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/首页.html',
  '/目的地.html',
  '/AI旅行规划.html',
  '/旅行助手.html',
  '/个人中心.html',
  '/optimized-common.css',
  '/performance-utils.js',
  'https://cdn.tailwindcss.com?plugins=forms'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => {
        console.error('Failed to cache static assets:', err);
        // Don't fail installation if some assets can't be cached
        return Promise.resolve();
      })
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => !cacheName.startsWith(CACHE_VERSION))
            .map(cacheName => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Claim all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') return;
  
  event.respondWith(handleRequest(request, url));
});

async function handleRequest(request, url) {
  // Strategy 1: Cache First for static assets
  if (isStaticAsset(url)) {
    return cacheFirst(request, STATIC_CACHE);
  }
  
  // Strategy 2: Stale While Revalidate for images
  if (isImage(url)) {
    return staleWhileRevalidate(request, IMAGE_CACHE);
  }
  
  // Strategy 3: Network First for HTML pages
  if (isHTMLPage(url)) {
    return networkFirst(request, DYNAMIC_CACHE);
  }
  
  // Strategy 4: Cache First for CDN resources
  if (isCDNResource(url)) {
    return cacheFirst(request, STATIC_CACHE);
  }
  
  // Default: Network only
  return fetch(request);
}

// Cache strategies
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    return fetch(request);
  }
}

async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>离线 - 旅行助手</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; }
            .offline { color: #666; }
          </style>
        </head>
        <body>
          <div class="offline">
            <h1>🔌 您当前处于离线状态</h1>
            <p>请检查网络连接后重试</p>
            <button onclick="location.reload()">重新加载</button>
          </div>
        </body>
        </html>
      `, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Silently fail background update
    return null;
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    // Update cache in background
    fetchPromise;
    return cachedResponse;
  }
  
  // Wait for network if no cache
  return fetchPromise || fetch(request);
}

// Helper functions
function isStaticAsset(url) {
  return url.pathname.endsWith('.css') || 
         url.pathname.endsWith('.js') ||
         url.pathname.includes('tailwindcss');
}

function isImage(url) {
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ||
         url.hostname.includes('cos.ap-guangzhou.myqcloud.com');
}

function isHTMLPage(url) {
  return url.pathname.endsWith('.html') || 
         url.pathname === '/' ||
         !url.pathname.includes('.');
}

function isCDNResource(url) {
  return url.hostname.includes('cdn.') ||
         url.hostname.includes('unpkg.com') ||
         url.hostname.includes('jsdelivr.net');
}

// Background sync for analytics
self.addEventListener('sync', event => {
  if (event.tag === 'performance-metrics') {
    event.waitUntil(syncPerformanceMetrics());
  }
});

async function syncPerformanceMetrics() {
  // Send cached performance metrics when online
  try {
    const cache = await caches.open('analytics');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        await fetch(request);
        await cache.delete(request);
      } catch (error) {
        console.log('Failed to sync metrics:', error);
      }
    }
  } catch (error) {
    console.log('Sync failed:', error);
  }
}

// Push notifications (for future use)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'travel-notification',
      renotify: true,
      actions: [
        {
          action: 'view',
          title: '查看详情'
        },
        {
          action: 'dismiss',
          title: '关闭'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});