// ── AstroGuide — página de administração ─────────────────────────────
// A página é renderizada no servidor: o HTML chega pronto, com os dados já
// lá dentro, e não há nada para pedir nem para desenhar. O único trabalho
// aqui é o campo de estrelas do fundo, que é partilhado com o menu e com a
// página de entrada (ver criarEstrelas, no shared-ui-controls.js).
//
// Se um dia a página passar a mexer em dados, é aqui que esse JavaScript
// vive — mas então terá de haver também um endpoint, e esse endpoint terá de
// repetir a verificação de admin que a rota faz. A página não é a fronteira;
// o servidor é.

document.addEventListener("DOMContentLoaded", function () {
  window.criarEstrelas();
});
