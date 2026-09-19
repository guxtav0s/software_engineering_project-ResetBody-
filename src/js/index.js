var modal = document.getElementById("intervaloModal");
var openBtn = document.getElementById("openIntervaloModal");
var cancelBtn = document.getElementById("cancelar");
var saveBtn = document.getElementById("salvar");

openBtn.addEventListener("click", function() {
    modal.showModal();
});

cancelBtn.addEventListener("click", function() {
    modal.close();
});

saveBtn.addEventListener("click", function() {
    // todo: adicionar lógica para salvar os dados
    modal.close();
});