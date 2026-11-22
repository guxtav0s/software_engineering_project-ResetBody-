(() => {
  const STORAGE_KEY = "resetbody_pomodoro_v1";
  const clock = document.getElementById("pomodoroClock");
  const phaseLabel = document.getElementById("phaseLabel");
  const status = document.getElementById("pomodoroStatus");
  const startPauseBtn = document.getElementById("startPauseBtn");
  const resetBtn = document.getElementById("resetBtn");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const workInput = document.getElementById("workMinutes");
  const breakInput = document.getElementById("breakMinutes");
  const enableNotificationsBtn = document.getElementById("enableNotificationsBtn");
  const pushStatus = document.getElementById("pushStatus");
  const PUSH_SUBSCRIPTION_KEY = "resetbody_push_subscription_v1";
  let pushSubscription = null;

  let intervalId = null;
  let state = {
    workMinutes: 25, breakMinutes: 5, phase: "work",
    remainingMs: 25 * 60 * 1000, endAt: null, running: false
  };

  const formatTime = ms => {
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  };
  const phaseDuration = () => (state.phase === "work" ? state.workMinutes : state.breakMinutes) * 60000;
  function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function render() {
    clock.textContent = formatTime(state.remainingMs);
    phaseLabel.textContent = state.phase === "work" ? "Tempo de trabalho" : "Tempo de descanso";
    startPauseBtn.textContent = state.running ? "Pausar" : "Continuar";
    if (!state.running && state.remainingMs === phaseDuration()) startPauseBtn.textContent = "Iniciar";
    status.textContent = state.running
      ? (state.phase === "work" ? "Concentre-se na sua atividade." : "Aproveite para descansar e se alongar.")
      : "Contagem pausada. Você pode continuar quando quiser.";
    document.title = `${formatTime(state.remainingMs)} · ${state.phase === "work" ? "Trabalho" : "Descanso"} | ResetBody`;
  }
  function stopTicker() { if (intervalId !== null) { clearInterval(intervalId); intervalId = null; } }
  function startTicker() {
    stopTicker(); state.running = true; state.endAt = Date.now() + state.remainingMs;
    persist(); render(); intervalId = setInterval(tick, 250);
    schedulePushNotification();
  }
  function switchPhase() {
    state.phase = state.phase === "work" ? "break" : "work";
    state.remainingMs = phaseDuration();
    state.endAt = Date.now() + state.remainingMs;
    status.textContent = state.phase === "break" ? "Trabalho concluído! Seu descanso começou." : "Descanso concluído! Um novo período de trabalho começou.";
    schedulePushNotification();
  }
  function tick() {
    if (!state.running || !state.endAt) return;
    let now = Date.now();
    // Mantém a transição correta mesmo se a aba ficar suspensa por algum tempo.
    while (state.running && state.endAt <= now) {
      const overrun = now - state.endAt;
      switchPhase();
      state.endAt = Date.now() + Math.max(0, state.remainingMs - overrun);
      state.remainingMs = Math.max(0, state.remainingMs - overrun);
      if (state.remainingMs <= 0) { now = Date.now(); continue; }
      break;
    }
    state.remainingMs = Math.max(0, state.endAt - Date.now());
    if (state.remainingMs <= 0) {
      // A próxima fase começa automaticamente, sem exigir interação.
      switchPhase();
    }
    persist(); render();
  }
  function pause() {
    if (!state.running) return;
    state.remainingMs = Math.max(0, state.endAt - Date.now());
    state.running = false; state.endAt = null; stopTicker(); cancelPushSchedule(); persist(); render();
  }
  function reset() {
    stopTicker(); cancelPushSchedule(); state.phase = "work"; state.remainingMs = phaseDuration();
    state.endAt = null; state.running = false; persist(); render();
  }
  function validMinutes(input, min, max) {
    const value = Number(input.value);
    if (!Number.isInteger(value) || value < min || value > max) {
      input.setCustomValidity(`Informe um valor entre ${min} e ${max} minutos.`);
      input.reportValidity(); input.setCustomValidity(""); return null;
    }
    return value;
  }
  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    return Uint8Array.from([...raw].map(char => char.charCodeAt(0)));
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      throw new Error("Este navegador não oferece suporte a Web Push.");
    }
    return navigator.serviceWorker.register("/service-worker.js");
  }

  async function ativarNotificacoes() {
    try {
      if (!("Notification" in window)) throw new Error("Este navegador não oferece suporte a notificações.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Permissão de notificação não concedida.");
      const registration = await registerServiceWorker();
      const keyResponse = await fetch("/api/push/public-key");
      if (!keyResponse.ok) throw new Error("Não foi possível obter a chave do servidor.");
      const { publicKey } = await keyResponse.json();
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
      }
      const response = await fetch("/api/push/subscribe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription)
      });
      if (!response.ok) throw new Error("O servidor não conseguiu registrar este dispositivo.");
      pushSubscription = subscription;
      localStorage.setItem(PUSH_SUBSCRIPTION_KEY, JSON.stringify(subscription));
      pushStatus.textContent = "Notificações ativadas. Você será avisado ao fim de cada etapa.";
      enableNotificationsBtn.textContent = "Notificações ativadas";
      enableNotificationsBtn.disabled = true;
      if (state.running) schedulePushNotification();
    } catch (error) {
      pushStatus.textContent = error.message || "Não foi possível ativar as notificações.";
    }
  }

  async function recuperarInscricaoPush() {
    try {
      const saved = JSON.parse(localStorage.getItem(PUSH_SUBSCRIPTION_KEY));
      if (!saved?.endpoint) return;
      pushSubscription = saved;
      const registration = await registerServiceWorker();
      const current = await registration.pushManager.getSubscription();
      if (current) {
        pushSubscription = current;
        await fetch("/api/push/subscribe", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(current)
        });
        pushStatus.textContent = "Notificações ativadas. Você será avisado ao fim de cada etapa.";
        enableNotificationsBtn.textContent = "Notificações ativadas";
        enableNotificationsBtn.disabled = true;
        if (state.running) schedulePushNotification();
      }
    } catch (error) { console.warn("Não foi possível recuperar a inscrição de notificações.", error); }
  }

  async function schedulePushNotification() {
    if (!pushSubscription || !state.running || !state.endAt) return;
    try {
      await fetch("/api/push/schedule", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: pushSubscription, phase: state.phase, endAt: state.endAt,
          workMinutes: state.workMinutes, breakMinutes: state.breakMinutes
        })
      });
    } catch (error) { console.warn("Não foi possível agendar a notificação Web Push.", error); }
  }

  async function cancelPushSchedule() {
    if (!pushSubscription) return;
    try {
      await fetch("/api/push/cancel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: pushSubscription.endpoint })
      });
    } catch (error) { console.warn("Não foi possível cancelar o aviso agendado.", error); }
  }

  enableNotificationsBtn.addEventListener("click", ativarNotificacoes);
  startPauseBtn.addEventListener("click", () => state.running ? pause() : startTicker());
  resetBtn.addEventListener("click", reset);
  saveSettingsBtn.addEventListener("click", () => {
    const work = validMinutes(workInput, 1, 180);
    if (work === null) return;
    const rest = validMinutes(breakInput, 1, 60);
    if (rest === null) return;
    state.workMinutes = work; state.breakMinutes = rest;
    reset(); status.textContent = "Tempos salvos. O ciclo está pronto para começar.";
    persist();
  });

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Number.isInteger(saved.workMinutes) && saved.workMinutes >= 1 && saved.workMinutes <= 180 &&
        Number.isInteger(saved.breakMinutes) && saved.breakMinutes >= 1 && saved.breakMinutes <= 60 &&
        ["work", "break"].includes(saved.phase)) {
      // Recupera as configurações, mas nunca restaura uma contagem em andamento.
      // O tempo restante é congelado no instante em que a página foi ocultada/fechada.
      state = { ...state, ...saved, running: false, endAt: null };
      if (!Number.isFinite(state.remainingMs) || state.remainingMs < 0) {
        state.remainingMs = phaseDuration();
      }
      workInput.value = state.workMinutes;
      breakInput.value = state.breakMinutes;
      persist();
    }
  } catch (error) { console.warn("Não foi possível recuperar as configurações do Pomodoro.", error); }

  // Ao sair da página, congela o Pomodoro e cancela qualquer aviso agendado.
  // Ao voltar, o usuário precisa pressionar Continuar para retomar.
  window.addEventListener("pagehide", () => {
    if (state.running) {
      state.remainingMs = Math.max(0, state.endAt - Date.now());
      state.running = false;
      state.endAt = null;
      stopTicker();
      persist();
      cancelPushSchedule();
    }
  });

  window.addEventListener("pageshow", () => {
    if (state.running) {
      state.running = false;
      state.endAt = null;
      stopTicker();
      persist();
    }
    render();
  });
  recuperarInscricaoPush();
  render();
})();
