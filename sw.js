/* ============================================================
   RECALL — SERVICE WORKER
   Обеспечивает PWA-режим, офлайн-доступ и системные уведомления
   ============================================================ */

const CACHE_NAME = 'recall-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './recall.css',
    './recall.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

/*
    Установка сервис-воркера и предварительное кэширование
*/
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS_TO_CACHE).catch(err => {
                console.warn('Recall: некоторые ресурсы не удалось закэшировать при установке', err);
            });
        }).then(() => self.skipWaiting())
    );
});

/*
    Активация и удаление старых кэшей
*/
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

/*
    Сетевой перехват (Network first с fallback на кэш)
*/
self.addEventListener('fetch', event => {
    // Работаем только с GET-запросами
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => caches.match(event.request))
    );
});

/*
    Обработка системных Push-событий (если настроен сервер)
*/
self.addEventListener('push', event => {
    let data = {
        title: 'Recall: пора повторить! 🧠',
        body: 'У вас есть карточки, готовые к повторению.'
    };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: './icons/icon-192.png',
        badge: './icons/icon-192.png',
        vibrate: [100, 50, 100],
        data: {
            url: './index.html'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

/*
    Обработка сообщений из главного приложения (показ уведомления через SW)
*/
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, options } = event.data;
        self.registration.showNotification(title, {
            icon: './icons/icon-192.png',
            badge: './icons/icon-192.png',
            vibrate: [100, 50, 100],
            ...options
        });
    }
});

/*
    Клик по уведомлению: открывает приложение или фокусирует открытую вкладку
*/
self.addEventListener('notificationclick', event => {
    event.notification.close();

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if (client.url.includes('index.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow('./index.html');
            }
        })
    );
});
