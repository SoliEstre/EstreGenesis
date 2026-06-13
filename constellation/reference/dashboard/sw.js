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
// 알림 클릭 → 기존 창 포커스(없으면 새 창). tier1/tier2 공통.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cls) => {
    for (const c of cls) { if ('focus' in c) return c.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow('/');
  }));
});
