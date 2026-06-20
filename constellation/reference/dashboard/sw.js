// Constellation PWA service worker — 앱 셸 캐시(오프라인 + 빠른 로드) + 알림 클릭 핸들.
// 라이브 데이터(/api, /ws, /join)는 캐시하지 않음. 앱 셸은 network-first(최신 우선 → 실패 시 캐시).
// 캐시 버전 bump 시 활성화 단계에서 구버전 캐시 정리. (#3a — tier1 알림은 페이지/SW 생존 중 showNotification;
//  tier2 Web Push 는 #3b 에서 push 이벤트 핸들러 추가 예정.)
'use strict';
const CACHE = 'constellation-shell-v1';
const SHELL = ['/', '/index.html', '/app.js', '/style.css', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()).catch(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  // 라이브 데이터 / 동일출처 아님 → SW 패스(브라우저 기본 처리)
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;
  if (u.pathname.startsWith('/api/') || u.pathname.startsWith('/ws') || u.pathname.startsWith('/join/')) return;
  // 앱 셸: network-first (대시보드 갱신이 바로 반영) → 오프라인 시 캐시 fallback
  e.respondWith(
    fetch(e.request).then((r) => {
      if (r && r.ok) { const cl = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cl)); }
      return r;
    }).catch(() => caches.match(e.request).then((m) => m || caches.match('/index.html')))
  );
});
// #3b tier-2 Web Push — push 이벤트(탭/SW 만 살아있으면 탭 닫혀도 도달): tickle 수신 → /api/push/latest 본문 fetch → showNotification.
//  RFC8291 페이로드 암호화 회피(서버 deps-0) 방식이라 push 데이터는 비어있고, 본문은 latest 엔드포인트에서 당겨와요.
self.addEventListener('push', (e) => {
  e.waitUntil(
    fetch('/api/push/latest', { cache: 'no-store' }).then((r) => r.json()).then((d) => {
      const title = (d && d.title) || 'Constellation';
      const body = ((d && d.body) || '').slice(0, 180);
      return self.registration.showNotification(title, { body, icon: '/icon-192.png', badge: '/icon-192.png', tag: 'constellation-push', renotify: true });
    }).catch(() => self.registration.showNotification('Constellation', { body: '새 활동이 있어요', icon: '/icon-192.png', tag: 'constellation-push' }))
  );
});
// 알림 클릭 → 기존 창 포커스(없으면 새 창). tier1/tier2 공통.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cls) => {
    for (const c of cls) { if ('focus' in c) return c.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow('/');
  }));
});
