// ── AstroGuide — a página do perfil ──────────────────────────────────────────
// As ações da página: a localização de observação, os favoritos e o caderno de
// observações. A identidade e as listas são escritas pelo servidor (ver
// pagina_perfil, no auth.py); aqui só vive o que precisa de falar com a API.
//
// Este código era o painel flutuante de conta, que foi substituído por esta
// página. O que ele fazia — a localização, a saída da conta — vive agora aqui,
// e o que era só do painel (abrir, fechar, o clique fora, o Escape) morreu com
// ele: numa página não há nada para abrir nem para fechar.
//
// Todas as gravações recarregam a página a seguir. Não é preguiça: a data de
// um favorito, a contagem no topo, o céu do observatório e o calendário saem
// todos do mesmo estado, e atualizar só um pedaço deixaria os outros a mostrar
// o que já não é verdade — que é pior do que não fazer nada, porque parece que
// a gravação não pegou. É o que o painel antigo já fazia ao guardar a
// localização.
//
// Segue o estilo do resto do projeto: funções no window, porque o HTML as
// chama pelos atributos onclick/onsubmit.

(function () {
  "use strict";

  // Estado do pedido de localização ao browser. Vive aqui, e não no DOM,
  // porque é o que fica à espera entre o momento em que o browser devolve as
  // coordenadas e o momento em que a pessoa confirma com um nome.
  let coordenadasDetetadas = null;

  // ── Avisos ──────────────────────────────────────────────────────────
  // Duas caixas na página (a da localização e a do caderno), e cada aviso vai
  // para a que lhe pertence — um erro a escrever no caderno não deve aparecer
  // debaixo do botão da localização. O id vem de fora porque quem chama sabe
  // a que secção o aviso pertence; o "perfil-aviso" é o da localização, que é
  // o caso mais comum.
  function avisar(mensagem, bom, caixaId) {
    const caixa = document.getElementById(caixaId || "perfil-aviso");
    if (!caixa) return;
    caixa.textContent = mensagem;
    caixa.classList.toggle("ok", Boolean(bom));
  }

  // ── Sair ────────────────────────────────────────────────────────────
  // Vai para o menu, e não recarrega esta página: quem acabou de sair deixou de
  // ter perfil, e o /perfil devolvia-o à página de entrada — um pedido de
  // password imediatamente a seguir a ter carregado em "Terminar sessão".
  window.sairDaConta = async function sairDaConta() {
    await fetch("/api/sair", { method: "POST" });
    window.location.href = "/";
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

        const campo = document.getElementById("perfil-nome-local");
        campo.value = "A minha localização";
        document.getElementById("perfil-form-local").style.display = "";
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
    // para o local novo. Só atualizar a página por dentro deixaria os painéis
    // já desenhados a mostrar o céu do local anterior, que é pior do que não
    // fazer nada — parecia que a gravação não tinha pegado.
    avisar("Guardado. A recarregar com o céu do novo local…", true);
    window.location.reload();
  }

  window.guardarLocalizacaoDetetada = async function guardarLocalizacaoDetetada() {
    if (!coordenadasDetetadas) return;

    const nome = (document.getElementById("perfil-nome-local").value || "").trim() || "A minha localização";
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
    const manual   = document.getElementById("perfil-form-manual");
    const detetado = document.getElementById("perfil-form-local");
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

  // ── Favoritos ───────────────────────────────────────────────────────
  // O tipo e o id vêm dos data-* do próprio botão (ver perfil.html): o que
  // está guardado na base de dados nunca chega a ser interpretado como código.
  window.removerFavorito = async function removerFavorito(botao) {
    botao.disabled = true;

    const resposta = await fetch("/api/favoritos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo:      botao.dataset.tipo,
        objeto_id: botao.dataset.objeto,
      }),
    });

    if (!resposta.ok) {
      botao.disabled = false;
      avisar("Não foi possível remover o favorito. Tenta outra vez.");
      return;
    }
    window.location.reload();
  };

  // ── Caderno de observações ──────────────────────────────────────────
  window.adicionarObservacao = async function adicionarObservacao(evento) {
    evento.preventDefault();

    const nome = (document.getElementById("obs-nome").value || "").trim();
    const data = (document.getElementById("obs-data").value || "").trim();
    const nota = (document.getElementById("obs-nota").value || "").trim();

    // O servidor tem a mesma regra (ver auth.py). Repetida aqui para o erro
    // aparecer sem uma ida e volta à rede — e sem gravar nada.
    if (!nome) {
      avisar("Escreve o que observaste.", false, "perfil-aviso-obs");
      return;
    }

    const botao = document.querySelector("#form-observacao button[type='submit']");
    botao.disabled = true;

    const resposta = await fetch("/api/observacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // A data vazia vai como está: o servidor assume hoje, e é a mesma regra
      // nos dois lados. Um campo em branco não pode virar 1970-01-01.
      body: JSON.stringify({ objeto_nome: nome, data: data, nota: nota }),
    });
    const respostaJson = await resposta.json().catch(function () { return {}; });

    if (!resposta.ok) {
      botao.disabled = false;
      avisar(respostaJson.erro || "Não foi possível guardar a observação.", false, "perfil-aviso-obs");
      return;
    }

    window.location.reload();
  };

  window.removerObservacao = async function removerObservacao(botao) {
    botao.disabled = true;

    // O id vai no endereço, e é o servidor que verifica de quem é a observação
    // (ver api_remover_observacao, no auth.py): um id de outra conta
    // simplesmente não corresponde a nada.
    const resposta = await fetch("/api/observacoes/" + encodeURIComponent(botao.dataset.id), {
      method: "DELETE",
    });

    if (!resposta.ok) {
      botao.disabled = false;
      avisar("Não foi possível apagar a observação. Tenta outra vez.", false, "perfil-aviso-obs");
      return;
    }
    window.location.reload();
  };

  // ── Ecrã inicial ────────────────────────────────────────────────────
  window.criarEstrelas();   // o mesmo campo de estrelas do menu
})();
