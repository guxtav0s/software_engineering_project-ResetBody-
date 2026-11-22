self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  const title = data.title || 'ResetBody';
  const options = {
    body: data.body || 'Seu ciclo Pomodoro foi concluído.',
    icon: '/assets/foto_perfil.png',
    badge: '/assets/estrela.svg',
    tag: data.tag || 'resetbody-pomodoro',
    renotify: true,
    data: { url: data.url || '/pages/pomodoro.html' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/pages/pomodoro.html', self.location.origin).href;
  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientsList) {
      if (client.url === target && 'focus' in client) return client.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow(target);
  })());
});
