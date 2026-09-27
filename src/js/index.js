// * Modal Intervalo
var intervaloModal = document.getElementById("intervaloModal");
var openBtnInt = document.getElementById("openIntervaloModal");
var cancelBtnInt = document.getElementById("cancelarIntervalo");
var saveBtnInt = document.getElementById("salvarIntervalo");

openBtnInt.addEventListener("click", function () {
  intervaloModal.showModal();
});

cancelBtnInt.addEventListener("click", function () {
  intervaloModal.close();
});

saveBtnInt.addEventListener("click", function () {
  // todo: adicionar lógica para salvar os dados
  intervaloModal.close();
});

// * Modal Preferências
var preferenciasModal = document.getElementById("preferenciasModal");
var openBtnPref = document.getElementById("openPreferenciasModal");
var closeBtnPref = document.getElementById("closePref");

openBtnPref.addEventListener("click", function () {
  preferenciasModal.showModal();
});

closeBtnPref.addEventListener("click", function () {
    preferenciasModal.close();
});

// todo: criar listas de alongamentos para respectivas preferencias
// Escuta mudanças nos rádios para acompanhar cliques e navegação pelo teclado.
document.querySelectorAll('.pref-radio input[type="radio"]').forEach(radio => {
  radio.addEventListener('change', () => {
    // Limpa o destaque antigo antes de atualizar o card da opção escolhida.
    document.querySelectorAll('.pref-radio').forEach(card => {
      card.classList.remove('selecionado');
    });

    // O rádio fica dentro do label; a classe é aplicada ao label visível.
    radio.closest('.pref-radio').classList.add('selecionado');
  });
});