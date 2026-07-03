// NOMBRE DEL CACHE Y ARCHIVOS A CACHEAR
const CACHE_NAME = 'my-places-v2';
const ARCHIVOS_CACHE = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/api.js',
    '/js/app.js',
    '/js/storage.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/font/CabinetGrotesk-Variable.ttf',
    'https://unpkg.com/vue@3/dist/vue.global.js',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    // iconos de navegación
    'assets/iconos-nav/inicio.svg',
    'assets/iconos-nav/mas.svg',
    'assets/iconos-nav/mapa.svg',
    // iconos otros
    'assets/iconos-otros/atras.svg',
    'assets/iconos-otros/editar.svg',
    'assets/iconos-otros/eliminar.svg',
    'assets/iconos-otros/estado.svg',
    'assets/iconos-otros/fecha.svg',
    'assets/iconos-otros/maps.svg',
    'assets/iconos-otros/offline.svg',
    'assets/iconos-otros/ubi.svg',
    'assets/iconos-otros/ubi-negro.svg',
    'assets/iconos-otros/vacio.svg',
    'assets/iconos-otros/buscar.svg',
    // iconos categorías
    'assets/iconos-c/cafeterias.svg',
    'assets/iconos-c/restaurantes.svg',
    'assets/iconos-c/librerias.svg',
    'assets/iconos-c/parques.svg',
    'assets/iconos-c/gym.svg',
    'assets/iconos-c/tiendas.svg',
];

// EVENTO DE INSTALACIÓN DEL SERVICE WORKER
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // cacheamos cada archivo por separado: si uno falla (ej. unpkg caído
            // un segundo), no se cae toda la instalación del service worker
            return Promise.all(
                ARCHIVOS_CACHE.map((url) =>
                    cache.add(url).catch((error) => {
                        console.warn('No se pudo cachear:', url, error);
                    })
                )
            );
        })
    );
});

// EVENTO DE ACTIVACIÓN DEL SERVICE WORKER
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((nombresCache) => {
        return Promise.all(
            nombresCache.map((nombre) => {
            if (nombre !== CACHE_NAME) {
                return caches.delete(nombre);
            }
            })
        );
        })
    );
});

// EVENTO DE FETCH PARA SERVIR LOS ARCHIVOS CACHEADOS
self.addEventListener('fetch', (event) => {
    const esTileDeMapa = event.request.url.includes('tile.openstreetmap.org');

    if (esTileDeMapa) {
        // ESTRATEGIA PARA LOS TILES DEL MAPA: cache primero, y si no está,
        // lo pedimos a la red y lo guardamos para la próxima vez que se use offline
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) =>
                cache.match(event.request).then((respuestaCache) => {
                    if (respuestaCache) return respuestaCache;
                    return fetch(event.request).then((respuestaRed) => {
                        cache.put(event.request, respuestaRed.clone());
                        return respuestaRed;
                    });
                })
            )
        );
        return;
    }

    // ESTRATEGIA PARA TODO LO DEMÁS: cache primero, con fallback a red
    event.respondWith(
        caches.match(event.request).then((respuestaCache) => {
        return respuestaCache || fetch(event.request);
        })
    );
});