const express = require('express');
const webpush = require('web-push');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@resetbody.local';

if (!publicKey || !privateKey) {
  console.error('Configure VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY no arquivo .env.');
  process.exit(1);
}
webpush.setVapidDetails(subject, publicKey, privateKey);
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, 'src')));

// Assinaturas e agendamentos ficam em memória: mantenha o servidor ativo.
const schedules = new Map();
const subscriptions = new Map();

function cancelSchedule(endpoint) {
  const current = schedules.get(endpoint);
  if (current?.timeout) clearTimeout(current.timeout);
  schedules.delete(endpoint);
}

function scheduleNext(endpoint, phase, delayMs, workMinutes, breakMinutes) {
  cancelSchedule(endpoint);
  const timeout = setTimeout(async () => {
    const subscription = subscriptions.get(endpoint);
    if (!subscription) return cancelSchedule(endpoint);
    const isWork = phase === 'work';
    const payload = JSON.stringify({
      title: isWork ? 'Hora de descansar!' : 'Hora de voltar ao foco!',
      body: isWork
        ? 'Seu período de trabalho terminou. A pausa começou.'
        : 'Seu período de descanso terminou. Um novo ciclo de trabalho começou.',
      tag: 'resetbody-pomodoro',
      url: '/pages/pomodoro.html'
    });
    try {
      await webpush.sendNotification(subscription, payload);
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        subscriptions.delete(endpoint);
        return cancelSchedule(endpoint);
      }
      console.error('Falha ao enviar Web Push:', error.message);
    }
    const nextPhase = isWork ? 'break' : 'work';
    const nextMinutes = isWork ? breakMinutes : workMinutes;
    scheduleNext(endpoint, nextPhase, nextMinutes * 60 * 1000, workMinutes, breakMinutes);
  }, Math.max(1000, delayMs));
  schedules.set(endpoint, { timeout, phase, endAt: Date.now() + Math.max(1000, delayMs), workMinutes, breakMinutes });
}

app.get('/api/push/public-key', (_req, res) => res.json({ publicKey }));

app.post('/api/push/subscribe', (req, res) => {
  const subscription = req.body;
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return res.status(400).json({ error: 'Assinatura inválida.' });
  }
  subscriptions.set(subscription.endpoint, subscription);
  res.status(201).json({ message: 'Dispositivo inscrito para receber notificações.' });
});

app.post('/api/push/schedule', (req, res) => {
  const { subscription, phase, endAt, workMinutes, breakMinutes } = req.body || {};
  if (!subscription?.endpoint || !subscriptions.has(subscription.endpoint) ||
      !['work', 'break'].includes(phase) || !Number.isFinite(endAt) ||
      !Number.isInteger(workMinutes) || workMinutes < 1 || workMinutes > 180 ||
      !Number.isInteger(breakMinutes) || breakMinutes < 1 || breakMinutes > 60) {
    return res.status(400).json({ error: 'Dados de agendamento inválidos ou dispositivo não inscrito.' });
  }
  scheduleNext(subscription.endpoint, phase, endAt - Date.now(), workMinutes, breakMinutes);
  res.json({ message: 'Notificação agendada.' });
});

app.post('/api/push/cancel', (req, res) => {
  const endpoint = req.body?.endpoint;
  if (endpoint) cancelSchedule(endpoint);
  res.json({ message: 'Agendamento cancelado.' });
});

app.post('/api/push/unsubscribe', (req, res) => {
  const endpoint = req.body?.endpoint;
  if (endpoint) {
    cancelSchedule(endpoint);
    subscriptions.delete(endpoint);
  }
  res.json({ message: 'Inscrição removida.' });
});

app.get('/', (_req, res) => res.redirect('/pages/index.html'));
app.listen(PORT, () => console.log(`ResetBody disponível em http://localhost:${PORT}`));
