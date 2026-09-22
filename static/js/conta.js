// ── AstroGuide — conta do utilizador ─────────────────────────────────────────
// Cria o botão de conta e o painel que ele abre, e fala com a API de contas.
//
// O botão e o painel são criados aqui, em JavaScript, em vez de escritos nos
// dois templates (menu.html e index.html): são iguais nos dois sítios, e
// duplicá-los no HTML obrigaria a manter duas cópias alinhadas à mão — a
// primeira correção feita só num deles passava despercebida no outro.
//
// Segue o estilo do resto do projeto: funções no window, porque o HTML as
// chama pelos atributos onclick.

(function () {
  "use strict";

  // Estado do pedido de localização ao browser. Vive aqui, e não no DOM,
  // porque é o que fica à espera entre o momento em que o browser devolve as
  // coordenadas e o momento em que a pessoa confirma com um nome.
  let coordenadasDetetadas = null;

  // ── Construção da interface ─────────────────────────────────────────
  function montarInterface() {
    const botao = document.createElement("button");
    botao.id = "btn-conta";
    botao.type = "button";
    botao.setAttribute("aria-controls", "painel-conta");
    botao.setAttribute("aria-expanded", "false");
    botao.title = "A tua conta";
    botao.onclick = window.alternarPainelConta;

    botao.innerHTML = '<span aria-hidden="true">👤</span><span class="conta-nome"></span>';
    document.body.appendChild(botao);

    const painel = document.createElement("div");
    painel.id = "painel-conta";
    painel.setAttribute("role", "dialog");
    painel.setAttribute("aria-label", "A tua conta");
    // Esqueleto fixo, sem nada do utilizador lá dentro — os valores que vêm
    // do servidor são escritos com textContent (ver preencher), nunca
    // misturados neste HTML.
    painel.innerHTML = `
      <div class="conta-titulo">👤 A TUA CONTA</div>
      <div class="conta-identidade">
        <div class="conta-quem"></div>
        <div class="conta-email"></div>
      </div>
      <div class="conta-linha">
        <span class="conta-rotulo">📍 Localização</span>
        <span class="conta-valor" id="conta-local"></span>
      </div>
      <div id="conta-acoes-sessao"></div>
      <div id="conta-acoes-local"></div>
      <div id="conta-acoes-admin"></div>
      <div class="conta-aviso" role="status" aria-live="polite"></div>
    `;
    document.body.appendChild(painel);
  }

  // ── Estado ──────────────────────────────────────────────────────────
  let utilizador = null;
  let localizacao = null;

  async function carregar() {
    // Sem tratamento de erro a rebentar o ecrã: se o pedido falhar, a conta
    // aparece como "não sei quem és" e o resto da aplicação continua a
    // funcionar — nenhuma secção do AstroGuide depende disto para abrir.
    try {
      const resposta = await fetch("/api/me");
      const dados = await resposta.json();
      utilizador  = dados.utilizador;
      localizacao = dados.localizacao;
    } catch (erro) {
      utilizador = null;
      localizacao = null;
    }
    preencher();
  }

  function preencher() {
    const botao = document.getElementById("btn-conta");
    const nome = botao.querySelector(".conta-nome");
    nome.textContent = utilizador ? utilizador.nome : "Entrar";

    const acoesSessao = document.getElementById("conta-acoes-sessao");
    const acoesLocal  = document.getElementById("conta-acoes-local");
    const acoesAdmin  = document.getElementById("conta-acoes-admin");
    const identidade  = document.querySelector(".conta-identidade");

    if (utilizador) {
      identidade.style.display = "";
      document.querySelector(".conta-quem").textContent  = utilizador.nome;
      document.querySelector(".conta-email").textContent = utilizador.email;

      acoesSessao.innerHTML =
        '<button type="button" class="conta-btn conta-btn-sair" onclick="sairDaConta()">Terminar sessão</button>';

      acoesLocal.innerHTML = `
        <button type="button" class="conta-btn" id="btn-deteta-local" onclick="usarLocalizacaoDoBrowser()">
          📍 Usar a localização deste dispositivo
        </button>
        <div id="conta-form-local" style="display:none">
          <label for="conta-nome-local" class="conta-rotulo">Nome deste local</label>
          <input type="text" id="conta-nome-local" class="conta-campo" maxlength="80">
          <button type="button" class="conta-btn" id="btn-guarda-local" onclick="guardarLocalizacaoDetetada()">
            Guardar
          </button>
        </div>

        <button type="button" class="conta-btn" id="btn-manual-local" onclick="alternarFormularioManual()">
          ✏️ Escrever as coordenadas
        </button>
        <div id="conta-form-manual" style="display:none">
          <label for="manual-nome" class="conta-rotulo">Nome deste local</label>
          <input type="text" id="manual-nome" class="conta-campo" maxlength="80"
                 placeholder="Ex.: Serra da Estrela">

          <div class="conta-campos-linha">
            <div>
              <label for="manual-lat" class="conta-rotulo">Latitude</label>
              <input type="number" id="manual-lat" class="conta-campo"
                     step="any" min="-90" max="90" placeholder="40.322">
            </div>
            <div>
              <label for="manual-lon" class="conta-rotulo">Longitude</label>
              <input type="number" id="manual-lon" class="conta-campo"
                     step="any" min="-180" max="180" placeholder="-7.613">
            </div>
          </div>

          <label for="manual-elev" class="conta-rotulo">Elevação em metros (opcional)</label>
          <input type="number" id="manual-elev" class="conta-campo"
                 step="any" min="-500" max="9000" placeholder="0">

          <label for="manual-tz" class="conta-rotulo">Fuso horário</label>
          <input type="text" id="manual-tz" class="conta-campo" spellcheck="false">
          <p class="conta-ajuda">Só muda a hora que escreves na simulação do
          Observatório. Se observas do sítio onde estás, deixa o que lá está.</p>

          <button type="button" class="conta-btn" id="btn-guarda-manual" onclick="guardarLocalizacaoManual()">
            Guardar
          </button>
        </div>

        <button type="button" class="conta-btn" onclick="reporLocalizacaoGaia()">
          ↺ Voltar a Vila Nova de Gaia
        </button>
      `;

      // A ligação só aparece a quem tem o papel: para as outras contas seria um
      // botão que leva a uma porta fechada. Isto não é o que protege a página —
      // quem escrever /admin à mão bate na mesma na verificação do servidor, e
      // é lá que a decisão está. Aqui só se evita o caminho inútil.
      acoesAdmin.innerHTML = utilizador.admin
        ? '<a class="conta-ligacao conta-ligacao-admin" href="/admin">🔐 Administração</a>'
        : "";
    } else {
      identidade.style.display = "none";
      acoesLocal.innerHTML = "";
      acoesAdmin.innerHTML = "";
      acoesSessao.innerHTML = `
        <a class="conta-ligacao" href="/entrar">Entrar</a>
        <a class="conta-ligacao" href="/entrar?aba=registar">Criar conta</a>
        <p class="conta-ajuda">Com conta, o céu passa a ser calculado para o
        sítio onde estás e os teus favoritos ficam guardados.</p>
      `;
    }

    const destino = document.getElementById("conta-local");
    if (destino) destino.textContent = localizacao ? localizacao.nome : "—";
  }

  function avisar(mensagem, bom) {
    const caixa = document.querySelector("#painel-conta .conta-aviso");
    if (!caixa) return;
    caixa.textContent = mensagem;
    caixa.classList.toggle("ok", Boolean(bom));
  }

  // ── Abrir e fechar o painel ─────────────────────────────────────────
  window.alternarPainelConta = function alternarPainelConta() {
    const painel = document.getElementById("painel-conta");
    const aberto = painel.classList.toggle("visivel");
    document.getElementById("btn-conta").setAttribute("aria-expanded", aberto ? "true" : "false");
    if (aberto) avisar("");
  };

  // Fechar ao clicar fora. O botão de conta não conta como "fora" — senão o
  // clique que abre o painel era também o que o fechava.
  document.addEventListener("click", function (evento) {
    const painel = document.getElementById("painel-conta");
    if (!painel || !painel.classList.contains("visivel")) return;
    if (painel.contains(evento.target) || evento.target.closest("#btn-conta")) return;
    painel.classList.remove("visivel");
    document.getElementById("btn-conta").setAttribute("aria-expanded", "false");
  });

  // Escape fecha, como em qualquer caixa de diálogo.
  document.addEventListener("keydown", function (evento) {
    if (evento.key !== "Escape") return;
    const painel = document.getElementById("painel-conta");
    if (painel && painel.classList.contains("visivel")) window.alternarPainelConta();
  });

  // ── Ações da sessão ─────────────────────────────────────────────────
  window.sairDaConta = async function sairDaConta() {
    await fetch("/api/sair", { method: "POST" });
    // Recarrega em vez de só atualizar o painel: quem acabou de sair tem o
    // céu calculado para a localização dele no ecrã, e esse céu continua a
    // ser o dele até a página ser pedida outra vez ao servidor.
    window.location.reload();
  };

  // ── Localização ─────────────────────────────────────────────────────

  // O fuso horário do dispositivo. O browser já sabe em que fuso está, por
  // isso não é preciso ir a nenhum serviço externo nem perguntar ao
  // utilizador. O "Europe/Lisbon" é só a rede de segurança: browsers antigos
  // devolvem string vazia, e o servidor rejeita um fuso inválido.
  function fusoDoDispositivo() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Lisbon";
  }

  window.usarLocalizacaoDoBrowser = function usarLocalizacaoDoBrowser() {
    if (!navigator.geolocation) {
      avisar("Este browser não sabe a localização.");
      return;
    }
    avisar("A pedir a localização ao browser…", true);

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        coordenadasDetetadas = {
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          // A altitude vem muitas vezes a null (é a informação que os
          // telemóveis dão com menos fiabilidade). Sem ela, assume-se o
          // nível do mar: para o céu, 0 ou 100 metros é a mesma coisa.
          elevacao:  pos.coords.altitude || 0,
          // O fuso horário do dispositivo, sem precisar de ir a nenhum
          // serviço externo — o browser já sabe em que fuso está.
          timezone:  fusoDoDispositivo(),
        };

        const campo = document.getElementById("conta-nome-local");
        campo.value = "A minha localização";
        document.getElementById("conta-form-local").style.display = "";
        avisar(`Detetado: ${pos.coords.latitude.toFixed(3)}°, ${pos.coords.longitude.toFixed(3)}°. Dá-lhe um nome e guarda.`, true);
        campo.focus();
        campo.select();
      },
      function () {
        avisar("Não conseguimos obter a localização. Confirma que deste permissão ao browser.");
      }
    );
  };

  // ── Gravação da localização ─────────────────────────────────────────
  // Partilhada pelos dois caminhos (a localização detetada pelo browser e a
  // escrita à mão): o que muda entre eles são só os valores. O pedido e o que
  // se faz depois dele são iguais, e é isso que vive aqui.
  async function guardarLocalizacao(dados, botao) {
    botao.disabled = true;

    const resposta = await fetch("/api/localizacao", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    const respostaJson = await resposta.json().catch(function () { return {}; });

    if (!resposta.ok) {
      botao.disabled = false;
      avisar(respostaJson.erro || "Não foi possível guardar a localização.");
      return;
    }

    // Recarrega para o céu, o calendário e o observatório serem recalculados
    // para o local novo. Só atualizar o painel deixaria os painéis já
    // desenhados a mostrar o céu do local anterior, que é pior do que não
    // fazer nada — parecia que a gravação não tinha pegado.
    avisar("Guardado. A recarregar com o céu do novo local…", true);
    window.location.reload();
  }

  window.guardarLocalizacaoDetetada = async function guardarLocalizacaoDetetada() {
    if (!coordenadasDetetadas) return;

    const nome = (document.getElementById("conta-nome-local").value || "").trim() || "A minha localização";
    await guardarLocalizacao(
      Object.assign({ nome: nome }, coordenadasDetetadas),
      document.getElementById("btn-guarda-local")
    );
  };

  // ── Localização escrita à mão ───────────────────────────────────────
  // Para os sítios onde o browser não ajuda: um local que não é onde a pessoa
  // está (um sítio de observação a que vai amanhã), ou um GPS que recusa ou
  // erra. Sem isto, a única localização possível era a que o browser dava.
  window.alternarFormularioManual = function alternarFormularioManual() {
    const manual   = document.getElementById("conta-form-manual");
    const detetado = document.getElementById("conta-form-local");
    const abrir    = manual.style.display === "none";

    manual.style.display = abrir ? "" : "none";

    // Só um formulário aberto de cada vez: os dois gravam no mesmo sítio, e
    // com os dois à vista dava a impressão de ser preciso preencher ambos.
    if (abrir) detetado.style.display = "none";
    if (!abrir) return;

    // O fuso do dispositivo fica pré-preenchido. Para quem observa do sítio
    // onde está — o caso normal — é o valor certo, e assim não precisa de
    // saber o nome de um fuso horário só para guardar umas coordenadas.
    const campoFuso = document.getElementById("manual-tz");
    if (!campoFuso.value) campoFuso.value = fusoDoDispositivo();

    document.getElementById("manual-nome").focus();
  };

  window.guardarLocalizacaoManual = async function guardarLocalizacaoManual() {
    const nome      = (document.getElementById("manual-nome").value || "").trim();
    const textoLat  = (document.getElementById("manual-lat").value || "").trim();
    const textoLon  = (document.getElementById("manual-lon").value || "").trim();
    const textoElev = (document.getElementById("manual-elev").value || "").trim();
    const timezone  = (document.getElementById("manual-tz").value || "").trim();

    if (textoLat === "" || textoLon === "") {
      avisar("Escreve a latitude e a longitude.");
      return;
    }

    // Number("") dá 0, por isso o campo vazio é apanhado acima, antes de
    // chegar aqui; e Number("abc") dá NaN, que o isFinite apanha.
    const latitude  = Number(textoLat);
    const longitude = Number(textoLon);
    const elevacao  = textoElev === "" ? 0 : Number(textoElev);

    // As mesmas regras que o servidor aplica (ver auth.py). Estão repetidas
    // aqui de propósito: sem isto, um erro de escrita obrigava a uma ida e
    // volta à rede só para o utilizador saber o que se passou. O servidor
    // continua a ser quem manda — se as duas discordarem, ganha ele.
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      avisar("A latitude e a longitude têm de ser números.");
      return;
    }
    if (latitude < -90 || latitude > 90) {
      avisar("A latitude tem de estar entre -90 e 90.");
      return;
    }
    if (longitude < -180 || longitude > 180) {
      avisar("A longitude tem de estar entre -180 e 180.");
      return;
    }
    if (!Number.isFinite(elevacao) || elevacao < -500 || elevacao > 9000) {
      avisar("A elevação tem de estar entre -500 e 9000 metros.");
      return;
    }

    await guardarLocalizacao({
      nome:      nome || "A minha localização",
      latitude:  latitude,
      longitude: longitude,
      elevacao:  elevacao,
      timezone:  timezone || fusoDoDispositivo(),
    }, document.getElementById("btn-guarda-manual"));
  };

  window.reporLocalizacaoGaia = async function reporLocalizacaoGaia() {
    const resposta = await fetch("/api/localizacao", { method: "DELETE" });
    if (!resposta.ok) {
      avisar("Não foi possível repor a localização.");
      return;
    }
    avisar("De volta a Vila Nova de Gaia. A recarregar…", true);
    window.location.reload();
  };

  // ── Arranque ────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", function () {
    montarInterface();
    carregar();

    // No Observatório e no VR o botão de conta desaparece (ver conta.css).
    // Se o painel estiver aberto quando se entra num deles, fecha-se aqui
    // também — o CSS esconde-o do ecrã, mas o painel continuaria marcado como
    // aberto por dentro e reaparecia sozinho ao voltar ao Céu ou ao
    // Calendário, sem ninguém lhe ter tocado. Observa-se a classe do body
    // porque é ela que diz em que ecrã a aplicação está (ver mudarEcra, no
    // index.js) — assim isto funciona sem o index.js precisar de saber que
    // existe um painel de conta.
    new MutationObserver(function () {
      const imersivo = document.body.classList.contains("observatorio-ativo")
                    || document.body.classList.contains("vr-ativo");
      if (!imersivo) return;

      const painel = document.getElementById("painel-conta");
      if (painel && painel.classList.contains("visivel")) {
        painel.classList.remove("visivel");
        document.getElementById("btn-conta").setAttribute("aria-expanded", "false");
      }
    }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  });
})();
