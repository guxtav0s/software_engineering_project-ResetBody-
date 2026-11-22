// ============================================================================
// Contador de intervalo
// O contador começa apenas por ação explícita e é reiniciado ao sair da página.
// ============================================================================
const intervaloModal = document.getElementById("intervaloModal");
const openBtnInt = document.getElementById("openIntervaloModal");
const cancelBtnInt = document.getElementById("cancelarIntervalo");
const saveBtnInt = document.getElementById("salvarIntervalo");
const duracaoInput = document.getElementById("duracaoPausa");
const contador = document.getElementById("contador");
const timerStatus = document.getElementById("timerStatus");
const notificationsButton = document.getElementById("ativarNotificacoesSortear");
const notificationStatus = document.getElementById("notificationStatus");
let sortearNotificationPermission = ("Notification" in window) ? Notification.permission : "unsupported";
const SORTEAR_NOTIFICATIONS_KEY = "resetbody_sortear_notifications_enabled_v2";
// Descarta a flag antiga, que podia marcar a função como ativa indevidamente.
localStorage.removeItem("resetbody_sortear_notifications_enabled_v1");

const DEFAULT_MINUTES = 15;
let timerInterval = null;
let timerState = {
  durationMinutes: DEFAULT_MINUTES,
  remainingMs: DEFAULT_MINUTES * 60 * 1000,
  endAt: null,
  status: "idle" // idle, running, paused ou finished
};

function formatarTempo(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function atualizarInterfaceTimer() {
  contador.textContent = formatarTempo(timerState.remainingMs);

  if (timerState.status === "running") {
    timerStatus.textContent = "Pausa em andamento · clique no contador para pausar.";
    contador.setAttribute("aria-label", "Pausar contador");
    contador.title = "Clique para pausar";
  } else if (timerState.status === "paused") {
    timerStatus.textContent = "Contagem pausada · clique no contador para continuar.";
    contador.setAttribute("aria-label", "Retomar contador");
    contador.title = "Clique para continuar";
  } else if (timerState.status === "finished") {
    timerStatus.textContent = "Intervalo concluído! Clique no contador para iniciar novamente.";
    contador.setAttribute("aria-label", "Iniciar intervalo novamente");
    contador.title = "Clique para reiniciar";
  } else {
    timerStatus.textContent = "Contagem pronta · clique no contador para começar.";
    contador.setAttribute("aria-label", "Iniciar contador");
    contador.title = "Clique para iniciar";
  }
}

function pararAtualizacao() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

async function notificarFimDoIntervalo() {
  const ativadoNoResetBody = localStorage.getItem(SORTEAR_NOTIFICATIONS_KEY) === "true";
  if (!ativadoNoResetBody || !("Notification" in window) || Notification.permission !== "granted") return;

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification("Intervalo concluído!", {
        body: "Sua pausa terminou. Você já pode iniciar um novo intervalo.",
        icon: "/assets/foto_perfil.png", badge: "/assets/estrela.svg",
        tag: "resetbody-sortear-intervalo", renotify: true,
        data: { url: "/pages/index.html" }
      });
    } else {
      new Notification("Intervalo concluído!", {
        body: "Sua pausa terminou. Você já pode iniciar um novo intervalo."
      });
    }
  } catch (error) {
    console.warn("Não foi possível exibir a notificação do intervalo.", error);
    notificationStatus.textContent = "A permissão está concedida, mas o navegador não conseguiu exibir a notificação.";
  }
}

function finalizarTimer() {
  pararAtualizacao();
  timerState.remainingMs = 0;
  timerState.endAt = null;
  timerState.status = "finished";
  atualizarInterfaceTimer();
  notificarFimDoIntervalo();
}

function atualizarContagem() {
  if (timerState.status !== "running" || !timerState.endAt) return;

  timerState.remainingMs = Math.max(0, timerState.endAt - Date.now());
  if (timerState.remainingMs <= 0) {
    finalizarTimer();
    return;
  }

  atualizarInterfaceTimer();
}

function iniciarTimer() {
  pararAtualizacao();
  if (timerState.remainingMs <= 0) {
    timerState.remainingMs = timerState.durationMinutes * 60 * 1000;
  }
  timerState.status = "running";
  timerState.endAt = Date.now() + timerState.remainingMs;
  atualizarInterfaceTimer();
  timerInterval = setInterval(atualizarContagem, 250);
}

function pausarTimer() {
  if (timerState.status !== "running") return;
  timerState.remainingMs = Math.max(0, timerState.endAt - Date.now());
  timerState.endAt = null;
  timerState.status = "paused";
  pararAtualizacao();
  atualizarInterfaceTimer();
}

function carregarEstadoTimer() {
  // Sempre começa com a configuração padrão ao abrir a página.
  // Nenhum contador em execução é restaurado automaticamente.
  timerState = {
    durationMinutes: DEFAULT_MINUTES,
    remainingMs: DEFAULT_MINUTES * 60 * 1000,
    endAt: null,
    status: "idle"
  };
  duracaoInput.value = String(DEFAULT_MINUTES);
  atualizarInterfaceTimer();
}

openBtnInt.addEventListener("click", function () {
  duracaoInput.value = String(timerState.durationMinutes);
  intervaloModal.showModal();
});

cancelBtnInt.addEventListener("click", function () {
  intervaloModal.close();
});

saveBtnInt.addEventListener("click", function (event) {
  event.preventDefault();
  const minutos = Number(duracaoInput.value);

  if (!Number.isInteger(minutos) || minutos < 1 || minutos > 60) {
    duracaoInput.setCustomValidity("Informe um intervalo entre 1 e 60 minutos.");
    duracaoInput.reportValidity();
    duracaoInput.setCustomValidity("");
    return;
  }

  timerState = {
    durationMinutes: minutos,
    remainingMs: minutos * 60 * 1000,
    endAt: null,
    status: "idle"
  };
  intervaloModal.close();
  atualizarInterfaceTimer();
});

contador.addEventListener("click", function () {
  if (timerState.status === "running") {
    pausarTimer();
  } else {
    iniciarTimer();
  }
});

function atualizarEstadoBotaoNotificacoes() {
  if (!notificationsButton || !notificationStatus) return;

  const ativadoNoResetBody = localStorage.getItem(SORTEAR_NOTIFICATIONS_KEY) === "true";
  const permissaoConcedida = "Notification" in window && Notification.permission === "granted";
  const ativado = ativadoNoResetBody && permissaoConcedida;

  notificationsButton.textContent = ativado ? "Notificações ativadas" : "Ativar notificações";
  notificationsButton.disabled = ativado;

  if (ativado) {
    notificationStatus.textContent = "Você receberá um aviso quando o intervalo terminar.";
  } else if (!("Notification" in window)) {
    notificationStatus.textContent = "Este navegador não oferece suporte a notificações.";
    notificationsButton.disabled = true;
  } else if (Notification.permission === "denied") {
    notificationStatus.textContent = "As notificações estão bloqueadas nas permissões do navegador. Libere-as nas configurações do site para ativar.";
  } else if (Notification.permission === "granted") {
    notificationStatus.textContent = "O navegador permite notificações, mas você ainda precisa ativá-las neste projeto.";
  } else {
    notificationStatus.textContent = "As notificações ainda não foram ativadas neste projeto.";
  }
}

if (notificationsButton) {
  notificationsButton.addEventListener("click", async () => {
    if (!("Notification" in window)) {
      atualizarEstadoBotaoNotificacoes();
      return;
    }

    try {
      if (!("serviceWorker" in navigator) && !("Notification" in window)) {
        atualizarEstadoBotaoNotificacoes();
        return;
      }

      // O registro e a permissão são solicitados somente após o clique explícito.
      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("/service-worker.js", { scope: "/" });
      }
      sortearNotificationPermission = Notification.permission === "default"
        ? await Notification.requestPermission()
        : Notification.permission;

      if (sortearNotificationPermission !== "granted") {
        localStorage.removeItem(SORTEAR_NOTIFICATIONS_KEY);
        notificationStatus.textContent = sortearNotificationPermission === "denied"
          ? "Permissão negada. Libere as notificações nas configurações do navegador e tente novamente."
          : "A permissão para notificações não foi concedida.";
        atualizarEstadoBotaoNotificacoes();
        return;
      }

      // Confirma que o navegador consegue exibir uma notificação antes de salvar
      // a ativação do ResetBody.
      let exibiuConfirmacao = false;
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
          await registration.showNotification("Notificações ativadas", {
            body: "O ResetBody avisará quando seu intervalo terminar.",
            icon: "/assets/foto_perfil.png",
            tag: "resetbody-sortear-ativado",
            data: { url: "/pages/index.html" }
          });
          exibiuConfirmacao = true;
        }
      }
      if (!exibiuConfirmacao) {
        new Notification("Notificações ativadas", {
          body: "O ResetBody avisará quando seu intervalo terminar."
        });
      }
      // A permissão global não ativa o recurso sozinha: só este clique grava a flag.
      localStorage.setItem(SORTEAR_NOTIFICATIONS_KEY, "true");
      notificationStatus.textContent = "Notificações ativadas. Você receberá um aviso quando o intervalo terminar.";
      atualizarEstadoBotaoNotificacoes();
    } catch (error) {
      localStorage.removeItem(SORTEAR_NOTIFICATIONS_KEY);
      atualizarEstadoBotaoNotificacoes();
      notificationStatus.textContent = "Não foi possível ativar. Acesse o ResetBody pelo servidor Node.js em localhost.";
      console.warn("Falha ao ativar notificações na página Sortear.", error);
    }
  });

  atualizarEstadoBotaoNotificacoes();
}

carregarEstadoTimer();

function restaurarContadorPadraoAoSair() {
  pararAtualizacao();
  timerState = {
    durationMinutes: DEFAULT_MINUTES,
    remainingMs: DEFAULT_MINUTES * 60 * 1000,
    endAt: null,
    status: "idle"
  };
  atualizarInterfaceTimer();
}

// Ao navegar para outra página, fechar ou recarregar, o contador é interrompido
// e a próxima visita começa novamente com 15 minutos, aguardando clique.
window.addEventListener("pagehide", restaurarContadorPadraoAoSair);

// ============================================================================
// Modal Preferências
// ============================================================================
const preferenciasModal = document.getElementById("preferenciasModal");
const openBtnPref = document.getElementById("openPreferenciasModal");
const closeBtnPref = document.getElementById("closePref");

openBtnPref.addEventListener("click", function () {
  preferenciasModal.showModal();
});

closeBtnPref.addEventListener("click", function () {
  preferenciasModal.close();
});

// Atualiza o destaque visual da preferência selecionada.
document.querySelectorAll('.pref-radio input[type="radio"]').forEach(radio => {
  radio.addEventListener("change", () => {
    document.querySelectorAll(".pref-radio").forEach(card => {
      card.classList.remove("selecionado");
    });
    radio.closest(".pref-radio").classList.add("selecionado");
  });
});
