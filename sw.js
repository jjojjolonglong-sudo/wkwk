// wkwk 서비스 워커: 네트워크 우선 → 실패하면 캐시 (옛 버전이 남는 문제 방지)
// 앱 파일(같은 도메인)만 다루고, Supabase / Worker / CDN 요청은 건드리지 않아요.
const V = 'wkwk-v1';
const SHELL = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r)
      .then((res) => {
        if (res.ok) { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); }
        return res;
      })
      .catch(() => caches.match(r).then((m) => m || caches.match('index.html')))
  );
});
