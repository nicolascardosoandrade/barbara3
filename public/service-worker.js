// Nome do cache
const CACHE_NAME = "sistemaaer-v2";

// Lista de arquivos que devem ser armazenados no cache
const urlsToCache = [
  "/",
  "/index.html",
  "/agenda.html",
  "/agendamentos.html",
  "/aniversariante_do_dia.html",
  "/convenios.html",
  "/filtrar_idades.html",
  "/financeiro.html",
  "/pacientes.html",
  "/servicos.html",
  "/manifest.json",
  "/css/style.css",
  "/js/script.js",
  "/assets/img/Logo-barbara.png"
];

// Instala o service worker e adiciona os arquivos ao cache
self.addEventListener("install", event => {
  console.log("[ServiceWorker] Instalando...");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("[ServiceWorker] Adicionando arquivos ao cache");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Intercepta requisições e serve arquivos do cache quando offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Retorna o cache, se disponível, ou faz o fetch normalmente
      return (
        response ||
        fetch(event.request).then(fetchResponse => {
          // Armazena no cache dinamicamente (cache dinâmico)
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        })
      );
    }).catch(() => {
      // Opcional: retornar página offline customizada
      if (event.request.mode === "navigate") {
        return caches.match("/index.html");
      }
    })
  );
});

// Atualiza o cache quando nova versão do Service Worker é ativada
self.addEventListener("activate", event => {
  console.log("[ServiceWorker] Ativando nova versão...");
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log("[ServiceWorker] Removendo cache antigo:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});
