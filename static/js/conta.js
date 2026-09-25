// ── AstroGuide — o botão de conta ────────────────────────────────────────────
// Cria o botão do canto superior direito e escreve-lhe o rótulo.
//
// É tudo o que resta deste ficheiro. Antes, o botão abria um painel flutuante
// com a conta lá dentro; o painel foi substituído por uma página própria, o
// /perfil, e o que ele fazia — a localização, a saída da conta, a ligação à
// administração — passou para lá (ver perfil.html e perfil.js).
//
// O botão é criado aqui, em JavaScript, em vez de escrito em cada template
// (menu.html, index.html e perfil.html): é igual nos três, e duplicá-lo no
// HTML obrigaria a manter três cópias alinhadas à mão — a primeira correção
// feita só num deles passava despercebida nos outros.

(function () {
  "use strict";

  // ── O botão ─────────────────────────────────────────────────────────
  function montarBotao() {
    // Um <a>, e não um <button>: é uma porta para outra página, e como
    // ligação funciona com o teclado, com o clique do meio, com "abrir em
    // novo separador" e antes de este JavaScript responder. O href é sempre o
    // mesmo, com sessão ou sem ela: quem não tem conta é a página de entrada
    // que o recebe, e volta ao perfil depois de entrar (ver pagina_perfil e
    // pagina_entrar, no auth.py). Assim há um só caminho em vez de dois que
    // têm de concordar.
    const botao = document.createElement("a");
    botao.id = "btn-conta";
    botao.href = "/perfil";
    botao.title = "A tua conta";
    botao.innerHTML = '<span aria-hidden="true">👤</span><span class="conta-nome"></span>';
    document.body.appendChild(botao);
  }

  // ── O rótulo ────────────────────────────────────────────────────────
  // "Entrar" enquanto não se sabe quem é, e o nome de quem tem sessão. O
  // estado não é adivinhado a partir do URL nem de nada na página: pergunta-se
  // ao servidor, que é quem sabe.
  async function carregarRotulo() {
    let utilizador = null;

    // Sem tratamento de erro a rebentar o ecrã: se o pedido falhar, o botão
    // fica a dizer "Entrar" e o resto da aplicação continua a funcionar —
    // nenhuma secção do AstroGuide depende disto para abrir.
    try {
      const resposta = await fetch("/api/me");
      utilizador = (await resposta.json()).utilizador;
    } catch (erro) {
      utilizador = null;
    }

    const nome = document.querySelector("#btn-conta .conta-nome");
    if (nome) nome.textContent = utilizador ? utilizador.nome : "Entrar";
  }

  // ── Arranque ────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", function () {
    montarBotao();
    carregarRotulo();
  });
})();
