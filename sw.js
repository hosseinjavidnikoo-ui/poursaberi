const CACHE_NAME = 'porsaberi-cache-v1.1.0';
const urlsToCache = [
  './',
  './index.html',
  './login.html',
  './manifest.json',
  './version.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
];

// ۱. نصب سرویس‌ورکر و کش کردن فایل‌های اصلی
self.addEventListener('install', event => {
  self.skipWaiting(); // اجبار به فعال شدن نسخه جدید
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// ۲. پاک کردن کش‌های قدیمی موقع آپدیت
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // کنترل فوری همه تب‌ها
});

// ۳. استراتژی دریافت فایل‌ها (اول از کش، بعد از اینترنت)
self.addEventListener('fetch', event => {
  // درخواست‌های POST (مثل ارسال به Google Apps Script) رو کش نکن
  if (event.request.method !== 'GET') return;
  
  // درخواست‌های به دامنه‌های دیگه (مثل API گوگل) رو کش نکن
  const url = new URL(event.request.url);
  if (url.origin !== location.origin && !url.href.includes('jsdelivr.net')) return;

  event.respondWith(
    caches.match(event.request).then(response => {
      // اگه توی کش بود، همون رو بده
      if (response) {
        return response;
      }
      // اگه نبود، از اینترنت بگیر
      return fetch(event.request).then(fetchRes => {
        // اگه فایل جدیدی بود و از نوع عکس یا استایل بود، کشش کن
        if (fetchRes && fetchRes.status === 200 && fetchRes.type === 'basic') {
          const responseClone = fetchRes.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return fetchRes;
      });
    }).catch(() => {
      // اگه آفلاین بود و فایل هم نبود، فایل اصلی (index) رو بده
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});