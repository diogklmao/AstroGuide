// ── AstroGuide — página de entrada / registo ─────────────────────────────────
// Alterna entre os dois formulários e envia-os para a API.
// Segue o estilo do resto do projeto: funções no window, porque os
// formulários do HTML as chamam pelos atributos onsubmit/onclick.

(function () {
  "use strict";

  // Para onde ir depois de entrar, quando o endereço não pede nada em
  // contrário. É o perfil: quem acabou de entrar quer ver o que a conta tem —
  // a localização, os favoritos, o caderno — e é de lá que se segue para o
  // céu. O menu continua à distância do botão "◀ Menu", que o perfil tem como
  // todas as outras páginas.
  const DESTINO_POR_OMISSAO = "/perfil";

  // ── Destino depois de entrar ────────────────────────────────────────
  // Aceita ?seguinte=/observatorio, para quem foi mandado para aqui a meio de
  // outra página voltar ao que estava a fazer.
  //
  // O valor vem do endereço, por isso é do utilizador e não é de confiança:
  // sem esta verificação, um link como
  //   /entrar?seguinte=https://sitio-falso.example
  // levava a pessoa a entrar no AstroGuide e a aterrar num site alheio logo a
  // seguir — com a confiança de quem acabou de escrever a password aqui. Só
  // passam caminhos internos ("/algo"), e nunca "//algo", que o browser lê
  // como um endereço externo (//sitio-falso.example).
  function destinoDepoisDeEntrar() {
    const pedido = new URLSearchParams(window.location.search).get("seguinte") || "";
    const caminhoInterno = pedido.startsWith("/") && !pedido.startsWith("//") && !pedido.includes("\\");
    return caminhoInterno ? pedido : DESTINO_POR_OMISSAO;
  }

  // ── Abas ────────────────────────────────────────────────────────────
  window.mostrarAba = function mostrarAba(qual) {
    const entrar   = qual === "entrar";
    const formEntrar   = document.getElementById("form-entrar");
    const formRegistar = document.getElementById("form-registar");
    if (!formEntrar || !formRegistar) return;

    formEntrar.classList.toggle("escondido", !entrar);
    formRegistar.classList.toggle("escondido", entrar);

    document.getElementById("aba-entrar").classList.toggle("ativa", entrar);
    document.getElementById("aba-registar").classList.toggle("ativa", !entrar);

    limparErro();

    // Põe o cursor no primeiro campo da aba que apareceu — quem acabou de
    // clicar em "Criar conta" quer escrever, não quer clicar outra vez.
    const primeiro = (entrar ? formEntrar : formRegistar).querySelector("input");
    if (primeiro) primeiro.focus();
  };

  // ── Mensagens de erro ───────────────────────────────────────────────
  function mostrarErro(mensagem) {
    const caixa = document.getElementById("auth-erro");
    if (caixa) caixa.textContent = mensagem;
  }

  function limparErro() {
    const caixa = document.getElementById("auth-erro");
    if (caixa) caixa.textContent = "";
  }

  // ── Envio ───────────────────────────────────────────────────────────
  // Devolve o corpo da resposta se correr bem, ou null se houver erro (já
  // mostrado no ecrã). As duas rotas usam o mesmo caminho, para o
  // comportamento de erro ser igual nos dois formulários.
  async function enviar(endereco, corpo, botao) {
    limparErro();

    // Impede o segundo clique enquanto o primeiro pedido ainda vai a caminho.
    // Sem isto, carregar duas vezes em "Criar conta" tentava criar a mesma
    // conta duas vezes e a segunda resposta era um erro que assustava sem
    // razão — a conta tinha ficado criada à primeira.
    const textoOriginal = botao.textContent;
    botao.disabled = true;
    botao.textContent = "Aguarda…";

    try {
      const resposta = await fetch(endereco, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });

      // Uma resposta de erro pode não ser JSON (um 500 do Flask devolve HTML).
      // Nesse caso fica um objeto vazio e usa-se a mensagem genérica, em vez
      // de rebentar com um erro de leitura do JSON.
      const dados = await resposta.json().catch(function () { return {}; });

      if (!resposta.ok) {
        mostrarErro(dados.erro || "Não foi possível completar o pedido. Tenta outra vez.");
        return null;
      }
      return dados;
    } catch (erro) {
      // Chegar aqui significa que o pedido nem saiu — normalmente o servidor
      // está desligado. Vale a pena dizê-lo, porque é a causa mais provável.
      mostrarErro("Não foi possível contactar o servidor. Confirma que o AstroGuide está a correr.");
      return null;
    } finally {
      botao.disabled = false;
      botao.textContent = textoOriginal;
    }
  }

  // Os formulários não levam o atributo "required" no HTML de propósito: a
  // validação que conta é a do servidor, e tê-la também no browser só criava
  // duas mensagens diferentes para o mesmo problema. O servidor responde com
  // uma explicação concreta ("A password tem de ter pelo menos 8 caracteres"),
  // que é mais útil do que a bolha do browser.
  window.submeterEntrar = async function submeterEntrar(evento) {
    evento.preventDefault();

    const botao = document.querySelector("#form-entrar .auth-btn");
    const dados = await enviar("/api/entrar", {
      identificador: document.getElementById("entrar-identificador").value,
      password:      document.getElementById("entrar-password").value,
    }, botao);

    if (dados) window.location.href = destinoDepoisDeEntrar();
  };

  window.submeterRegistar = async function submeterRegistar(evento) {
    evento.preventDefault();

    const botao = document.querySelector("#form-registar .auth-btn");
    const dados = await enviar("/api/registar", {
      nome:     document.getElementById("registar-nome").value,
      email:    document.getElementById("registar-email").value,
      password: document.getElementById("registar-password").value,
    }, botao);

    if (dados) window.location.href = destinoDepoisDeEntrar();
  };

  // ── Ecrã inicial ────────────────────────────────────────────────────
  window.criarEstrelas();   // o mesmo campo de estrelas do menu

  // Se o endereço pediu a aba de registo (?aba=registar), abre-a já. Serve
  // para o menu poder mandar diretamente para "criar conta" em vez de deixar
  // a pessoa a procurar a aba.
  if (new URLSearchParams(window.location.search).get("aba") === "registar") {
    window.mostrarAba("registar");
  }
})();
