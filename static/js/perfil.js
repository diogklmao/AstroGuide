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
  // A localização escolhe-se pelo NOME. Quem procura escreve "Lisboa" ou
  // "Madrid" e o servidor devolve as terras que conhece com esse nome, cada
  // uma com as coordenadas e o fuso horário já resolvidos (ver
  // /api/localidades, no auth.py). Escrever latitude e longitude à mão saiu
  // daqui: ninguém sabe esses números de cor, e um algarismo trocado punha o
  // céu inteiro no sítio errado sem nada a avisar.

  // O que está escolhido mas ainda não foi gravado. Vive aqui, e não no DOM,
  // porque é o que fica à espera entre o momento em que a pessoa escolhe (na
  // lista ou pelo dispositivo) e o momento em que confirma com o Guardar.
  let localEscolhida = null;

  // A procura é escrita tecla a tecla, e não se pode pedir ao servidor uma
  // lista por cada letra: escrever "Madrid" eram seis pedidos, cinco deles
  // para procuras a meio ("M", "Ma", "Mad"...) que ninguém quis. Espera-se que
  // a pessoa pare de escrever, e só então se pergunta.
  let temporizadorProcura = null;
  const ESPERA_DA_PROCURA = 250;

  // Cada pedido leva um número, e só se aceita a resposta do último pedido
  // feito. Sem isto, duas procuras seguidas podiam chegar trocadas — a
  // resposta de "Mad" a chegar depois da de "Madrid" — e a lista mostrava
  // resultados que já não correspondiam ao que está escrito no campo.
  let pedidoAtual = 0;

  // A partir de quantas letras se procura. É uma só: quem escreve "S" quer ver
  // as terras que começam por S, para escolher de uma lista em vez de ter de
  // adivinhar o nome todo — e a lista local responde a isso sem custo nenhum,
  // porque é uma comparação de texto sobre ~150 linhas. (A procura online é
  // outra história: essa só entra a partir de três letras, ver o
  // _MINIMO_PARA_A_REDE no py/localizacao/__init__.py. Uma letra não é uma
  // pergunta que se faça a um serviço externo — é uma navegação pela lista.)
  const MINIMO_DA_PROCURA = 1;

  // A partir de quantas letras se pergunta também ao serviço de geocoding. É o
  // mesmo número do _MINIMO_PARA_A_REDE, no py/localizacao/__init__.py: abaixo
  // disto o servidor recusa-se a ir à rede, e pedir-lhe que fosse era um
  // pedido para receber uma lista vazia de volta.
  const MINIMO_PARA_A_REDE = 3;

  // O fuso horário do dispositivo. O browser já sabe em que fuso está, por
  // isso não é preciso ir a nenhum serviço externo nem perguntar ao
  // utilizador. O "Europe/Lisbon" é só a rede de segurança: browsers antigos
  // devolvem string vazia, e o servidor rejeita um fuso inválido.
  function fusoDoDispositivo() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Lisbon";
  }

  // As coordenadas escritas como se lêem: "41.12° N, 8.61° O". O hemisfério sai
  // do sinal da coordenada, e não de um N e um O fixos no texto — num app de
  // astronomia isso não é cosmético, porque é o hemisfério que decide o que se
  // vê no céu. O O é a convenção portuguesa para oeste (o W é a inglesa).
  //
  // Isto é o mesmo que o _coordenadas_legiveis faz no auth.py, pela mesma
  // razão que a validação está nos dois lados: as coordenadas que aparecem
  // nesta página vêm de duas terras diferentes (o servidor, para a localização
  // que está a valer, e a resposta da procura), e obrigar a uma ida à rede só
  // para escrever um número era pior do que o repetir.
  function coordenadasLegiveis(latitude, longitude) {
    const ns = latitude >= 0 ? "N" : "S";
    const eo = longitude >= 0 ? "E" : "O";
    return `${Math.abs(latitude).toFixed(2)}° ${ns}, ${Math.abs(longitude).toFixed(2)}° ${eo}`;
  }

  // ── A hora local ────────────────────────────────────────────────────
  // O relógio do perfil anda no fuso da localização escolhida, e não no do
  // computador. É a demonstração mais direta de que o fuso ficou bem guardado:
  // quem escolher Sydney vê ali as horas de Sydney, no mesmo instante em que o
  // computador diz outra coisa.
  function atualizarHoraLocal() {
    const alvo = document.getElementById("perfil-hora-local");
    if (!alvo) return;

    const fuso = alvo.dataset.fuso;
    const opcoes = {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    };

    try {
      alvo.textContent = new Intl.DateTimeFormat("pt-PT", Object.assign({ timeZone: fuso }, opcoes))
        .format(new Date());
    } catch (erro) {
      // Um fuso que o browser não conhece (o servidor valida-o, mas quem
      // editasse a base de dados à mão podia lá pôr outro) cai aqui. Mostra-se
      // a hora do computador em vez de deixar o campo em branco para sempre.
      alvo.textContent = new Date().toLocaleString("pt-PT");
    }
  }

  function esconderResultados() {
    const lista = document.getElementById("local-resultados");
    if (lista) {
      lista.hidden = true;
      lista.innerHTML = "";
    }
    const campo = document.getElementById("local-procura");
    if (campo) campo.setAttribute("aria-expanded", "false");
  }

  // Uma linha da lista. Vive à parte porque as duas fontes a usam: o que vem
  // da lista local e o que vem do serviço de geocoding mostram-se da mesma
  // maneira, e o que muda é só onde ficam.
  function itemResultado(cidade) {
    const item = document.createElement("li");

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "perfil-resultado";

    // O que vem do servidor fica em data-*, e não dentro do onclick: assim o
    // JavaScript lê-o do próprio elemento e nada do que veio da rede chega a
    // ser interpretado como código. (É o mesmo cuidado dos favoritos, no
    // perfil.html.)
    botao.dataset.cidade    = cidade.cidade;
    botao.dataset.pais      = cidade.pais;
    botao.dataset.regiao    = cidade.regiao || "";
    botao.dataset.latitude  = cidade.latitude;
    botao.dataset.longitude = cidade.longitude;
    botao.dataset.elevacao  = cidade.elevacao;
    botao.dataset.timezone  = cidade.timezone;
    botao.onclick = function () { escolherLocalidade(botao); };

    // A região vai no texto porque é o que distingue as terras com o mesmo
    // nome — há mais do que uma "Vila Nova", e sem ela a lista dava duas
    // linhas iguais e a pessoa escolhia ao calhas.
    const nome = document.createElement("span");
    nome.className = "perfil-resultado-nome";
    nome.textContent = cidade.pais ? `${cidade.cidade}, ${cidade.pais}` : cidade.cidade;

    const detalhe = document.createElement("span");
    detalhe.className = "perfil-resultado-detalhe";
    detalhe.textContent = [
      cidade.regiao,
      coordenadasLegiveis(cidade.latitude, cidade.longitude),
    ].filter(Boolean).join(" · ");

    botao.appendChild(nome);
    botao.appendChild(detalhe);
    item.appendChild(botao);
    return item;
  }

  // Mostra a lista, substituindo o que lá estiver.
  //
  // "mostrarVazio" diz o que significa uma lista vazia: uma resposta ("não
  // encontrámos essa terra") ou apenas uma pergunta que ainda não acabou. A
  // primeira fase devolve vazio sempre que a lista local não conhece o nome —
  // e nesse instante ainda se está à espera do serviço de geocoding, que pode
  // conhecê-lo. Anunciar "não existe" aí era uma mensagem a aparecer e a
  // desaparecer sozinha meio segundo depois.
  function mostrarResultados(cidades, mostrarVazio = true) {
    const lista = document.getElementById("local-resultados");
    const campo = document.getElementById("local-procura");
    if (!lista || !campo) return;

    lista.innerHTML = "";

    if (!cidades.length) {
      if (mostrarVazio) {
        lista.innerHTML =
          '<li class="perfil-resultado-vazio">Não encontrámos essa terra. ' +
          'Tenta escrever de outra maneira, ou usa a localização deste dispositivo.</li>';
        lista.hidden = false;
        campo.setAttribute("aria-expanded", "true");
      } else {
        lista.hidden = true;
        campo.setAttribute("aria-expanded", "false");
      }
      return;
    }

    cidades.forEach(function (cidade) {
      lista.appendChild(itemResultado(cidade));
    });

    lista.hidden = false;
    campo.setAttribute("aria-expanded", "true");
  }

  // Junta o que veio do serviço de geocoding POR BAIXO do que já está
  // desenhado. Não substitui nem reordena nada — as terras da lista local
  // continuam onde estavam — e não leva uma linha a separar as duas
  // proveniências: o que chega da rede são sítios como os outros, e uma lista
  // encabeçada por "Outros sítios com este nome" dizia o contrário.
  function acrescentarResultados(cidades) {
    const lista = document.getElementById("local-resultados");
    const campo = document.getElementById("local-procura");
    if (!lista || !campo || !cidades.length) return;

    cidades.forEach(function (cidade) {
      lista.appendChild(itemResultado(cidade));
    });

    lista.hidden = false;
    campo.setAttribute("aria-expanded", "true");
  }

  // Pede uma das duas fontes. Devolve a lista, ou null quando o pedido falhou
  // (rede em baixo, sessão caída) — que é diferente de uma lista vazia, e é o
  // que deixa quem chama distinguir "não há" de "não se conseguiu perguntar".
  async function pedirFonte(termo, fonte) {
    const url = "/api/localidades?q=" + encodeURIComponent(termo) +
                (fonte ? "&fonte=" + fonte : "");
    try {
      const resposta = await fetch(url);
      if (!resposta.ok) return null;
      const dados = await resposta.json().catch(function () { return {}; });
      return dados.resultados || [];
    } catch (erro) {
      return null;
    }
  }

  async function pedirCidades(termo) {
    const meuPedido = ++pedidoAtual;

    // Fase 1 — a lista local. Não sai do computador, por isso é quase sempre
    // ela que chega primeiro, e é ela que faz a lista aparecer no instante em
    // que se para de escrever.
    const locais = await pedirFonte(termo, "");
    // Chegou tarde: entretanto já se pediu outra coisa, e o que está escrito
    // no campo não é o que esta resposta responde. Deita-se fora.
    if (meuPedido !== pedidoAtual) return;

    const pedirRede = termo.trim().length >= MINIMO_PARA_A_REDE;

    // Uma lista local vazia só é "não encontrámos" quando não há uma segunda
    // resposta a caminho.
    mostrarResultados(locais || [], !pedirRede);
    if (!pedirRede) return;

    // Fase 2 — o resto do mundo: as terras com este nome que a lista local não
    // tem. É isto que faz "Granada" mostrar as outras quatro, e não só a
    // espanhola.
    const outros = await pedirFonte(termo, "rede");
    if (meuPedido !== pedidoAtual) return;

    // Se a lista local não tinha nada, o que veio da rede não é um complemento
    // — é a resposta toda, e é só agora que se sabe se existe alguma.
    if (!locais || !locais.length) {
      mostrarResultados(outros || []);
      return;
    }

    if (outros && outros.length) acrescentarResultados(outros);
  }

  window.procurarCidade = function procurarCidade() {
    const campo = document.getElementById("local-procura");
    if (!campo) return;

    const termo = campo.value.trim();
    clearTimeout(temporizadorProcura);

    // O campo mudou, e o que ainda esteja em voo (a segunda fase da procura
    // anterior) deixou de responder ao que está escrito. Sem isto, essa resposta
    // tardia chegava depois de a lista ter sido fechada — por a pessoa ter
    // limpado o campo, ou por ter escolhido uma terra — e reabria-a por cima.
    pedidoAtual++;

    // Escolher outra cidade tira a que estava à espera de confirmação: deixá-la
    // lá era guardar uma terra e estar a ver outra.
    localEscolhida = null;
    document.getElementById("local-escolhida").hidden = true;

    if (termo.length < MINIMO_DA_PROCURA) {
      esconderResultados();
      return;
    }

    temporizadorProcura = setTimeout(function () { pedirCidades(termo); }, ESPERA_DA_PROCURA);
  };

  // Fecha a lista com o Escape sem apagar o que está escrito. É o gesto que se
  // espera de uma lista de sugestões, e sem ele a única maneira de a fechar era
  // apagar o campo — que é o contrário do que se quer.
  function fecharResultadosComEscape(evento) {
    if (evento.key === "Escape") esconderResultados();
  }

  // ── A escolha ───────────────────────────────────────────────────────
  // Partilhada pelos dois caminhos (a lista e o dispositivo): o que muda entre
  // eles é só de onde vêm os valores. Mostrar a escolha, deixá-la confirmar e
  // gravá-la é igual nos dois, e é isso que vive aqui.
  function mostrarEscolha(local) {
    localEscolhida = local;

    // A escolha está feita: a segunda fase da procura, se ainda estiver a
    // caminho, já não pode reabrir a lista por cima do cartão da escolha.
    pedidoAtual++;

    document.getElementById("escolha-nome").textContent =
      local.pais ? `${local.cidade}, ${local.pais}` : local.cidade;
    document.getElementById("escolha-regiao").textContent = local.regiao || "";
    document.getElementById("escolha-dados").textContent =
      `${coordenadasLegiveis(local.latitude, local.longitude)} · ${local.timezone}`;

    document.getElementById("local-escolhida").hidden = false;
    esconderResultados();

    const campo = document.getElementById("local-procura");
    if (campo) campo.value = "";
  }

  function escolherLocalidade(botao) {
    mostrarEscolha({
      cidade:    botao.dataset.cidade,
      pais:      botao.dataset.pais,
      regiao:    botao.dataset.regiao,
      // Os data-* são sempre texto: sem estas conversões, "38.7169" ia para o
      // servidor como texto, e o servidor recusa-o (ver o _validar_coordenadas,
      // no auth.py) — que é o comportamento certo, mas obrigava a uma ida e
      // volta à rede para nada.
      latitude:  Number(botao.dataset.latitude),
      longitude: Number(botao.dataset.longitude),
      elevacao:  Number(botao.dataset.elevacao) || 0,
      timezone:  botao.dataset.timezone,
    });
  }

  window.usarLocalizacaoDoBrowser = async function usarLocalizacaoDoBrowser() {
    const botao = document.getElementById("btn-local-dispositivo");

    if (!navigator.geolocation) {
      avisar("Este browser não sabe a localização.");
      return;
    }
    botao.disabled = true;
    avisar("A pedir a localização ao browser…", true);

    navigator.geolocation.getCurrentPosition(
      async function (pos) {
        // As coordenadas vêm do dispositivo e ficam exatamente como vêm — é o
        // ponto mais preciso que se consegue sem escrever nada. O que falta é
        // o NOME da terra onde elas caem, e é isso que se vai perguntar (ver
        // /api/localidades/reversa, no auth.py).
        const coordenadas = {
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          // A altitude vem muitas vezes a null (é a informação que os
          // telemóveis dão com menos fiabilidade). Sem ela, assume-se o
          // nível do mar: para o céu, 0 ou 100 metros é a mesma coisa.
          elevacao:  pos.coords.altitude || 0,
        };

        let localidade = null;
        try {
          const resposta = await fetch("/api/localidades/reversa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(coordenadas),
          });
          if (resposta.ok) {
            const dados = await resposta.json();
            localidade = dados.localidade;
          }
        } catch (erro) {
          localidade = null;
        }

        botao.disabled = false;

        if (!localidade) {
          // Sem o nome não se inventa uma terra: as coordenadas ficavam certas
          // e o nome errado, que é o pior dos dois mundos — quem visse
          // "Lisboa" no cabeçalho a observar do Porto não voltava a confiar no
          // resto. Diz-se o que se passou e deixa-se a escolha pela lista.
          avisar("Encontrámos a tua posição, mas não conseguimos saber que terra é. " +
                 "Procura pelo nome.");
          return;
        }

        mostrarEscolha(Object.assign({
          cidade:   localidade.cidade,
          pais:     localidade.pais,
          regiao:   localidade.regiao || "",
          // O fuso do dispositivo: o browser sabe em que fuso está o
          // computador, e estas coordenadas são as dele.
          timezone: fusoDoDispositivo(),
        }, coordenadas));

        avisar("Detetado. Confirma em baixo para guardar.", true);
      },
      function () {
        botao.disabled = false;
        avisar("Não conseguimos obter a localização. Confirma que deste permissão ao browser.");
      }
    );
  };

  // ── Gravação da localização ─────────────────────────────────────────
  // A única gravação que existe, seja qual for o caminho por onde a
  // localização chegou. O que muda entre eles são só os valores: o pedido e o
  // que se faz depois dele são iguais, e é isso que vive aqui.
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
    // para o local novo — e para a hora local do cartão passar a ser a de lá.
    // Só atualizar a página por dentro deixaria os painéis já desenhados a
    // mostrar o céu do local anterior, que é pior do que não fazer nada —
    // parecia que a gravação não tinha pegado.
    avisar("Guardado. A recarregar com o céu do novo local…", true);
    window.location.reload();
  }

  window.guardarLocalizacaoEscolhida = async function guardarLocalizacaoEscolhida() {
    if (!localEscolhida) return;
    await guardarLocalizacao(localEscolhida, document.getElementById("btn-guarda-local"));
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
    const hora = (document.getElementById("obs-hora").value || "").trim();
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
      body: JSON.stringify({ objeto_nome: nome, data: data, hora: hora, nota: nota }),
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
  // ── O seletor de horas do caderno ──────────────────────────────────
  // A mesma peça do seletor de horas do Observatório (ver o
  // construirSeletorHora, no index.js, e o .obs-hora-picker, no index.css):
  // duas colunas, das horas e dos minutos, no mesmo desenho. Está aqui
  // replicada em vez de num ficheiro comum de propósito: as duas páginas não
  // partilham mais nada, e mover o que está a funcionar no Observatório era
  // mexer em código que ninguém pediu para tocar.
  //
  // O campo é um botão e o painel é nosso: a lista branca que o browser abre
  // para um <input type="time"> não se veste com CSS — quem a desenha é o
  // browser. O valor vive no #obs-hora, escondido, e VAZIO quer dizer "hora
  // não indicada" (o botão mostra "--:--") — que é diferente de meia-noite, e
  // é por isso que o campo começa vazio.

  const HORAS_DO_DIA = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const MINUTOS_DA_HORA = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  // O painel é construído à primeira abertura e fica para as seguintes; as duas
  // listas ficam guardadas porque é por elas que se marca a escolha, se anda
  // com as setas e se traz a opção à vista.
  let painelHora = null;
  // O desligar dos fechos (clique fora, Esc, scroll, resize) enquanto o painel
  // está aberto — ver o ligarFechosDoPopup. Fora disso é null.
  let desligarFechosHora = null;
  const listasHora = { hora: null, minuto: null };

  // A opção debaixo do cursor de teclado, por coluna. É coisa diferente da
  // escolhida: andar com as setas move esta sem mexer na hora, e é o Enter (ou
  // o clique) que muda a hora.
  const ativoHora = { hora: null, minuto: null };

  // O valor que está no campo, partido ao meio: "14:35" -> hora "14", minuto
  // "35". Um campo vazio lê-se como "00:00": é só para as colunas terem onde
  // pousar a escolha quando se abre o seletor sem nada indicado.
  function valorDaParteHora(parte) {
    const input = document.getElementById("obs-hora");
    const [hora, minuto] = (input && input.value ? input.value : "00:00").split(":");
    return parte === "hora" ? hora : minuto;
  }

  // Leva o valor do input escondido até ao texto do botão. Vazio mostra "--:--":
  // é a diferença entre "não indiquei hora" e "meia-noite".
  function sincronizarCampoHora() {
    const texto = document.getElementById("obs-hora-texto");
    const input = document.getElementById("obs-hora");
    if (!texto) return;
    texto.textContent = input && input.value
      ? valorDaParteHora("hora") + ":" + valorDaParteHora("minuto")
      : "--:--";
  }

  function construirSeletorHora() {
    const painel = document.createElement("div");
    painel.className = "perfil-hora-picker";
    painel.id = "obs-hora-picker";
    painel.setAttribute("role", "group");
    painel.setAttribute("aria-label", "Escolher a hora");

    painel.appendChild(criarColunaHora("hora", "Hora", HORAS_DO_DIA));
    painel.appendChild(criarColunaHora("minuto", "Minutos", MINUTOS_DA_HORA));

    // No <body>, e não dentro do cartão: o painel é "fixed" e não anda com a
    // página, e um painel preso dentro de um contentor com overflow próprio
    // ficava cortado a meio. É a mesma razão do Observatório e do painel da IA.
    document.body.appendChild(painel);
    return painel;
  }

  // Uma coluna (Hora ou Minutos) com as suas opções. A coluna é uma listbox: só
  // ela leva foco (tabindex 0), e é por ela que se anda com as setas — as 84
  // opções todas no caminho do Tab seriam 84 paragens para sair do seletor.
  function criarColunaHora(parte, titulo, valores) {
    const coluna = document.createElement("div");
    coluna.className = "perfil-hora-coluna";

    const cabecalho = document.createElement("div");
    cabecalho.className = "perfil-hora-coluna-titulo";
    cabecalho.id = "obs-hora-titulo-" + parte;
    cabecalho.textContent = titulo;

    const lista = document.createElement("div");
    lista.className = "perfil-hora-lista";
    lista.id = "obs-hora-lista-" + parte;
    lista.tabIndex = 0;
    lista.setAttribute("role", "listbox");
    lista.setAttribute("aria-labelledby", cabecalho.id);
    lista.addEventListener("keydown", function (e) {
      tratarTeclaListaHora(e, parte, lista);
    });

    valores.forEach(function (valor) {
      const opcao = document.createElement("button");
      opcao.type = "button";
      opcao.id = "obs-hora-" + parte + "-" + valor;
      opcao.className = "perfil-hora-opcao";
      opcao.dataset.valor = valor;
      opcao.tabIndex = -1;
      opcao.setAttribute("role", "option");
      opcao.setAttribute("aria-selected", "false");
      opcao.textContent = valor;
      // Sem isto o clique punha o foco na opção e tirava-o à listbox, e as
      // setas deixavam de andar. O clique continua a valer — o que se trava é
      // só o foco a mudar de sítio.
      opcao.addEventListener("mousedown", function (e) { e.preventDefault(); });
      opcao.addEventListener("click", function () {
        escolherParteHora(parte, valor);
      });
      lista.appendChild(opcao);
    });

    coluna.appendChild(cabecalho);
    coluna.appendChild(lista);
    listasHora[parte] = lista;
    return coluna;
  }

  // Pinta uma coluna: a opção escolhida (a que está no campo) e a ativa (a que
  // está debaixo do cursor de teclado). São dois estados, e é por isso que são
  // duas marcas: o aria-selected e a classe .ativo.
  function marcarColunaHora(parte) {
    const lista = listasHora[parte];
    if (!lista) return;

    const escolhido = valorDaParteHora(parte);
    const ativo = ativoHora[parte] || escolhido;
    Array.from(lista.children).forEach(function (opcao) {
      opcao.setAttribute("aria-selected", opcao.dataset.valor === escolhido ? "true" : "false");
      opcao.classList.toggle("ativo", opcao.dataset.valor === ativo);
    });
    // É por este id que o leitor de ecrã sabe qual das opções está debaixo do
    // cursor, já que o foco não anda de opção em opção.
    lista.setAttribute("aria-activedescendant", "obs-hora-" + parte + "-" + ativo);
  }

  // Traz a opção à vista, ao centro da lista. O offsetTop conta a partir da
  // lista (o .perfil-hora-lista é position: relative), e não da página.
  function trazerParaVista(parte, valor) {
    const lista = listasHora[parte];
    if (!lista) return;
    const opcao = lista.querySelector('[data-valor="' + valor + '"]');
    if (!opcao) return;
    lista.scrollTop = opcao.offsetTop - (lista.clientHeight - opcao.offsetHeight) / 2;
  }

  function tratarTeclaListaHora(e, parte, lista) {
    const opcoes = Array.from(lista.children);
    const atual = ativoHora[parte] || valorDaParteHora(parte);
    const i = opcoes.findIndex(function (o) { return o.dataset.valor === atual; });
    let novo = null;

    if (e.key === "ArrowDown") novo = opcoes[Math.min(i + 1, opcoes.length - 1)];
    else if (e.key === "ArrowUp") novo = opcoes[Math.max(i - 1, 0)];
    else if (e.key === "PageDown") novo = opcoes[Math.min(i + 10, opcoes.length - 1)];
    else if (e.key === "PageUp") novo = opcoes[Math.max(i - 10, 0)];
    else if (e.key === "Home") novo = opcoes[0];
    else if (e.key === "End") novo = opcoes[opcoes.length - 1];
    else if (e.key === "Enter" || e.key === " ") {
      // Escolhe o que está debaixo do cursor. É o Enter que muda a hora —
      // andar com as setas só anda.
      e.preventDefault();
      escolherParteHora(parte, atual);
      return;
    } else {
      return;
    }

    e.preventDefault();
    if (!novo) return;
    ativoHora[parte] = novo.dataset.valor;
    marcarColunaHora(parte);
    trazerParaVista(parte, novo.dataset.valor);
  }

  function escolherParteHora(parte, valor) {
    const input = document.getElementById("obs-hora");
    if (!input || !valor) return;

    const [hora, minuto] = (input.value || "00:00").split(":");
    input.value = parte === "hora" ? valor + ":" + minuto : hora + ":" + valor;

    ativoHora[parte] = valor;
    sincronizarCampoHora();
    marcarColunaHora("hora");
    marcarColunaHora("minuto");

    // Escolhidos os minutos, o gesto está completo: fecha-se e devolve-se o
    // foco ao campo. Escolhida a hora, fica aberto — quem escolhe a hora
    // escolhe os minutos a seguir.
    if (parte === "minuto") fecharSeletorHora(true);
  }

  window.alternarSeletorHora = function alternarSeletorHora() {
    if (painelHora && painelHora.classList.contains("aberto")) {
      fecharSeletorHora(true);
      return;
    }
    abrirSeletorHora();
  };

  function abrirSeletorHora() {
    const campo = document.getElementById("obs-hora-campo");
    if (!campo) return;

    if (!painelHora) painelHora = construirSeletorHora();

    // Abre sempre na escolha: as setas partem do valor que está no campo.
    ativoHora.hora = valorDaParteHora("hora");
    ativoHora.minuto = valorDaParteHora("minuto");
    marcarColunaHora("hora");
    marcarColunaHora("minuto");

    // Visível primeiro: é preciso medir para o pôr no sítio certo. Como não se
    // desenha nada entre isto e o posicionar, não se vê o salto.
    painelHora.classList.add("aberto");
    posicionarPopup(painelHora, campo);
    trazerParaVista("hora", ativoHora.hora);
    trazerParaVista("minuto", ativoHora.minuto);
    campo.setAttribute("aria-expanded", "true");
    desligarFechosHora = ligarFechosDoPopup(painelHora, campo, fecharSeletorHora);

    if (listasHora.hora) listasHora.hora.focus();
  }

  // Idempotente: quem a chama não precisa de saber se ele estava aberto. O
  // devolverFoco distingue as duas saídas — o Esc e a escolha dos minutos devem
  // pôr o foco de volta no campo; um clique fora não, senão tirava-se o foco a
  // quem o pôs noutro sítio.
  function fecharSeletorHora(devolverFoco) {
    const estavaAberto = painelHora && painelHora.classList.contains("aberto");

    if (painelHora) painelHora.classList.remove("aberto");
    const campo = document.getElementById("obs-hora-campo");
    if (campo) campo.setAttribute("aria-expanded", "false");

    if (desligarFechosHora) {
      desligarFechosHora();
      desligarFechosHora = null;
    }

    if (estavaAberto && devolverFoco && campo) campo.focus();
  }

  // Onde o painel fica, e quando ele fecha sozinho. São os mesmos dois
  // ajudantes do Observatório (ver o posicionarPopup e o ligarFechosDoPopup,
  // no index.js), copiados com o seletor: sem eles, o painel abria por cima do
  // que está a baixo no ecrã e ficava aberto para sempre.
  function posicionarPopup(painel, campo) {
    if (!painel || !campo || !painel.classList.contains("aberto")) return;

    const caixa = campo.getBoundingClientRect();
    const largura = painel.offsetWidth;
    const altura = painel.offsetHeight;
    const folga = 10;
    let esquerda = caixa.right + folga;
    let topo = caixa.top;

    if (esquerda + largura > window.innerWidth - 8) {
      esquerda = caixa.left;
      topo = caixa.bottom + folga;
      if (topo + altura > window.innerHeight - 8) topo = caixa.top - folga - altura;
    }

    esquerda = Math.max(8, Math.min(esquerda, window.innerWidth - largura - 8));
    topo = Math.max(8, Math.min(topo, window.innerHeight - altura - 8));

    painel.style.left = Math.round(esquerda) + "px";
    painel.style.top = Math.round(topo) + "px";
  }

  // Arma os fechos comuns: um clique fora ou o Esc fecham o painel, e o que faz
  // o campo andar (a página a rolar, a janela a mudar de tamanho) obriga a
  // apontar outra vez para ele — o painel é "fixed" e não anda com o campo. O
  // scroll ouve-se na captura: os eventos de scroll não sobem do elemento para
  // a janela, mas na captura passam por lá.
  //
  // Devolve a função que desliga tudo. Quem abre guarda-a e chama-a ao fechar:
  // sem isso, cada abertura deixava mais um par de ouvintes agarrado ao
  // documento.
  function ligarFechosDoPopup(painel, campo, fechar) {
    function tratarCliqueFora(e) {
      if (painel.contains(e.target) || campo.contains(e.target)) return;
      fechar(false);
    }

    function tratarTecla(e) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      fechar(true);
    }

    function reposicionar() {
      posicionarPopup(painel, campo);
    }

    document.addEventListener("pointerdown", tratarCliqueFora, true);
    document.addEventListener("keydown", tratarTecla, true);
    window.addEventListener("scroll", reposicionar, true);
    window.addEventListener("resize", reposicionar);

    return function desligar() {
      document.removeEventListener("pointerdown", tratarCliqueFora, true);
      document.removeEventListener("keydown", tratarTecla, true);
      window.removeEventListener("scroll", reposicionar, true);
      window.removeEventListener("resize", reposicionar);
    };
  }

  // ── O seletor de data do caderno ────────────────────────────────────
  // A mesma peça do calendário do Observatório (ver o construirSeletorData,
  // no index.js, e o .obs-data-picker, no index.css), aqui para o campo da
  // data da observação — e pela mesma razão do seletor de horas: o calendário
  // branco que o browser abre para um <input type="date"> não se veste com
  // CSS, quem o desenha é o browser. Ao contrário da hora, aqui as casas dos
  // dias são botões independentes e é o foco que diz onde se está: a grelha
  // entra no Tab por uma só casa (a escolhida) e são as setas que andam de
  // dia em dia.
  //
  // O valor vive no #obs-data, escondido, e continua em "AAAA-MM-DD" — o
  // mesmo formato do input nativo que substituiu, e por isso o envio ao
  // servidor e a validação não mudaram nada.

  const MESES_PT = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const DIAS_PT = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

  let painelData = null;
  let desligarFechosData = null;
  // O mês que o calendário tem à vista. Não é o mesmo que o valor do campo:
  // quem folheia até Dezembro sem escolher nada mexe nisto e não na data.
  const mesDoSeletorData = { ano: 0, mes: 0 };

  // A data do campo em "AAAA-MM-DD", ou "" se ainda não houver nenhuma.
  function valorCampoData() {
    const input = document.getElementById("obs-data");
    return input && input.value ? input.value : "";
  }

  // Escreve a data no botão à portuguesa (05/10/2026). O valor guardado
  // continua a ser o "AAAA-MM-DD", que é o que o resto espera; isto é só o
  // que se lê.
  function sincronizarCampoData() {
    const texto = document.getElementById("obs-data-texto");
    if (!texto) return;
    const valor = valorCampoData();
    texto.textContent = /^\d{4}-\d{2}-\d{2}$/.test(valor)
      ? valor.split("-").reverse().join("/")
      : valor;
  }

  // "AAAA-MM-DD" a partir de um Date local, feito à mão. O toISOString não
  // serve aqui: passa por UTC, e à noite em Portugal o dia que ele dava já
  // era o seguinte.
  function dataParaISO(d) {
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  // O "hoje" do calendário — na hora da terra escolhida para observar, e não
  // na do computador: quem escolheu observar de Sydney tem o dia de Sydney.
  // É o mesmo fuso do relógio do cartão (o data-fuso do #perfil-hora-local),
  // e não uma segunda cópia dele. O formato do Intl "en-CA" já sai em
  // "AAAA-MM-DD", que é o que o resto usa.
  function hojeNoLocal() {
    const alvo = document.getElementById("perfil-hora-local");
    const fuso = alvo ? alvo.dataset.fuso : null;
    try {
      return new Intl.DateTimeFormat("en-CA", { timeZone: fuso }).format(new Date());
    } catch (erro) {
      // Um fuso que o browser não conhece: melhor o dia do computador do que
      // um calendário sem dia de hoje nenhum.
      return dataParaISO(new Date());
    }
  }

  function construirSeletorData() {
    const painel = document.createElement("div");
    painel.className = "perfil-data-picker";
    painel.id = "obs-data-picker";
    painel.setAttribute("role", "group");
    painel.setAttribute("aria-label", "Escolher a data");

    // O cabeçalho: ‹ Outubro 2026 ›
    const cabecalho = document.createElement("div");
    cabecalho.className = "perfil-data-cabecalho";

    const anterior = document.createElement("button");
    anterior.type = "button";
    anterior.className = "perfil-data-nav";
    anterior.textContent = "‹";
    anterior.title = "Mês anterior";
    anterior.setAttribute("aria-label", "Mês anterior");
    anterior.addEventListener("click", function () { mudarMesSeletorData(-1); });

    const titulo = document.createElement("div");
    titulo.className = "perfil-data-titulo";
    titulo.id = "obs-data-titulo";
    // Muda com as setas: quem não vê a grelha ouve o mês novo.
    titulo.setAttribute("aria-live", "polite");

    const seguinte = document.createElement("button");
    seguinte.type = "button";
    seguinte.className = "perfil-data-nav";
    seguinte.textContent = "›";
    seguinte.title = "Mês seguinte";
    seguinte.setAttribute("aria-label", "Mês seguinte");
    seguinte.addEventListener("click", function () { mudarMesSeletorData(1); });

    cabecalho.appendChild(anterior);
    cabecalho.appendChild(titulo);
    cabecalho.appendChild(seguinte);

    // A semana, a começar na segunda — a mesma ordem do calendário da
    // aplicação. As abreviaturas saem do DIAS_PT.
    const semana = document.createElement("div");
    semana.className = "perfil-data-semana";
    semana.setAttribute("aria-hidden", "true");
    DIAS_PT.forEach(function (nome) {
      const abreviado = document.createElement("span");
      abreviado.textContent = nome.slice(0, 3);
      semana.appendChild(abreviado);
    });

    // As casas dos dias. A grelha é sempre de 42 (seis semanas), mesmo nos
    // meses que só precisam de cinco: assim o painel não cresce e encolhe de
    // mês para mês, e a caixa fica sempre do mesmo tamanho. As setas
    // ouvem-se aqui, no contentor, e não em cada casa.
    const grelha = document.createElement("div");
    grelha.className = "perfil-data-grelha";
    grelha.id = "obs-data-grelha";
    grelha.addEventListener("keydown", tratarTeclaGrelhaData);

    painel.appendChild(cabecalho);
    painel.appendChild(semana);
    painel.appendChild(grelha);

    // No <body>, como o da hora: o painel é "fixed" e leva o left/top do
    // posicionarPopup.
    document.body.appendChild(painel);
    return painel;
  }

  // Desenha o mês que está em mesDoSeletorData, com o dia escolhido e o de
  // hoje marcados.
  function desenharMesSeletorData() {
    const grelha = document.getElementById("obs-data-grelha");
    const titulo = document.getElementById("obs-data-titulo");
    if (!grelha || !titulo) return;

    const ano = mesDoSeletorData.ano;
    const mes = mesDoSeletorData.mes;
    titulo.textContent = MESES_PT[mes] + " " + ano;

    // Em que dia da semana cai o dia 1, contado a partir da segunda — o
    // getDay devolve 0 no domingo.
    const primeiroDia = new Date(ano, mes - 1, 1).getDay();
    const deslocamento = primeiroDia === 0 ? 6 : primeiroDia - 1;
    const diasDoMes = new Date(ano, mes, 0).getDate();

    const hoje = hojeNoLocal();
    const escolhido = valorCampoData();

    grelha.innerHTML = "";

    for (let i = 0; i < 42; i++) {
      const dia = i - deslocamento + 1;

      // Antes do dia 1 e depois do último as casas ficam vazias: são a margem
      // da grelha, e não dias de outro mês.
      if (dia < 1 || dia > diasDoMes) {
        const vazio = document.createElement("span");
        vazio.className = "perfil-data-vazio";
        grelha.appendChild(vazio);
        continue;
      }

      const data = ano + "-" + String(mes).padStart(2, "0") + "-" + String(dia).padStart(2, "0");

      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "perfil-data-dia";
      botao.dataset.data = data;
      botao.textContent = dia;
      // Fora do alcance do Tab: a grelha tem uma só porta de entrada, que é
      // a casa marcada no fim desta função.
      botao.tabIndex = -1;
      botao.setAttribute("aria-label", dia + " de " + MESES_PT[mes] + " de " + ano);

      // Escolhido e hoje são estados diferentes e podem calhar no mesmo dia.
      // O aria-pressed é o que um leitor de ecrã anuncia ("premido") para uma
      // casa escolhida; o aria-current marca o dia de hoje.
      if (data === escolhido) {
        botao.classList.add("escolhido");
        botao.setAttribute("aria-pressed", "true");
      }
      if (data === hoje) {
        botao.classList.add("hoje");
        botao.setAttribute("aria-current", "date");
      }

      botao.addEventListener("click", function () { escolherData(data); });
      grelha.appendChild(botao);
    }

    // A casa por onde se entra na grelha: a escolhida, se estiver à vista;
    // senão a primeira do mês.
    const entrada = grelha.querySelector(".escolhido") || grelha.querySelector(".perfil-data-dia");
    if (entrada) entrada.tabIndex = 0;
  }

  // Vira a página do calendário. O Date normaliza sozinho o que sai do
  // intervalo: o mês 13 vira o Janeiro do ano seguinte, e o mês 0 o Dezembro
  // do anterior.
  function mudarMesSeletorData(delta) {
    const d = new Date(mesDoSeletorData.ano, mesDoSeletorData.mes - 1 + delta, 1);
    mesDoSeletorData.ano = d.getFullYear();
    mesDoSeletorData.mes = d.getMonth() + 1;
    desenharMesSeletorData();
    // A grelha é sempre da mesma altura, mas depois de virar o mês o painel
    // pode ter de se mexer para não sair do ecrã.
    posicionarPopup(painelData, document.getElementById("obs-data-campo"));
  }

  // Leva o foco ao dia do Date que chega, virando o mês se ele cair fora do
  // que está à vista.
  function irParaDiaSeletorData(destino) {
    const iso = dataParaISO(destino);

    if (destino.getFullYear() !== mesDoSeletorData.ano || destino.getMonth() + 1 !== mesDoSeletorData.mes) {
      mesDoSeletorData.ano = destino.getFullYear();
      mesDoSeletorData.mes = destino.getMonth() + 1;
      desenharMesSeletorData();
      posicionarPopup(painelData, document.getElementById("obs-data-campo"));
    }

    const novo = document.getElementById("obs-data-grelha").querySelector('[data-data="' + iso + '"]');
    if (!novo) return;

    // Fica só uma casa alcançável pelo Tab. O desenhar já pôs uma; esta é a
    // que passou a ter o foco.
    Array.from(document.querySelectorAll(".perfil-data-dia")).forEach(function (b) { b.tabIndex = -1; });
    novo.tabIndex = 0;
    novo.focus();
  }

  // As setas andam de dia (esquerda/direita) e de semana (cima/baixo), o Home
  // e o End vão às pontas da semana, e o PageUp/PageDown mudam de mês.
  function tratarTeclaGrelhaData(e) {
    const alvo = e.target && e.target.classList && e.target.classList.contains("perfil-data-dia") ? e.target : null;
    if (!alvo) return;

    const ano = Number(alvo.dataset.data.slice(0, 4));
    const mes = Number(alvo.dataset.data.slice(5, 7));
    const dia = Number(alvo.dataset.data.slice(8, 10));
    let destino = null;

    if (e.key === "ArrowLeft") destino = new Date(ano, mes - 1, dia - 1);
    else if (e.key === "ArrowRight") destino = new Date(ano, mes - 1, dia + 1);
    else if (e.key === "ArrowUp") destino = new Date(ano, mes - 1, dia - 7);
    else if (e.key === "ArrowDown") destino = new Date(ano, mes - 1, dia + 7);
    else if (e.key === "PageUp" || e.key === "PageDown") {
      // Um mês à frente ou atrás, mas no mesmo dia — e com o dia preso ao fim
      // do mês de destino quando ele não chega lá (31 de Março recua para 28
      // ou 29 de Fevereiro, e não para 3 de Março).
      const indice = (mes - 1) + (e.key === "PageUp" ? -1 : 1);
      const ultimoDia = new Date(ano, indice + 1, 0).getDate();
      destino = new Date(ano, indice, Math.min(dia, ultimoDia));
    } else if (e.key === "Home" || e.key === "End") {
      // Às pontas da semana: a segunda e o domingo.
      const diaDaSemana = new Date(ano, mes - 1, dia).getDay();   // 0 = domingo
      const ateSegunda = diaDaSemana === 0 ? 6 : diaDaSemana - 1;
      destino = new Date(ano, mes - 1, dia + (e.key === "Home" ? -ateSegunda : 6 - ateSegunda));
    }

    if (!destino) return;
    e.preventDefault();
    irParaDiaSeletorData(destino);
  }

  function escolherData(data) {
    const input = document.getElementById("obs-data");
    if (!input || !data) return;

    input.value = data;
    sincronizarCampoData();

    // Um clique escolhe o dia e o gesto está completo: não há aqui uma
    // segunda parte como os minutos da hora, por isso fecha-se logo e
    // devolve-se o foco ao campo.
    fecharSeletorData(true);
  }

  window.alternarSeletorData = function alternarSeletorData() {
    if (painelData && painelData.classList.contains("aberto")) {
      fecharSeletorData(true);
      return;
    }
    abrirSeletorData();
  };

  function abrirSeletorData() {
    const campo = document.getElementById("obs-data-campo");
    if (!campo) return;

    if (!painelData) painelData = construirSeletorData();

    // Abre no mês da data escolhida. Com o campo vazio, no mês de hoje — e o
    // hoje que interessa é o do local escolhido para observar (ver o
    // hojeNoLocal), e não o do computador.
    const escolhido = valorCampoData();
    const referencia = /^\d{4}-\d{2}-\d{2}$/.test(escolhido) ? escolhido : hojeNoLocal();
    mesDoSeletorData.ano = Number(referencia.slice(0, 4));
    mesDoSeletorData.mes = Number(referencia.slice(5, 7));

    desenharMesSeletorData();

    // Visível primeiro: é preciso medir para o pôr no sítio certo.
    painelData.classList.add("aberto");
    posicionarPopup(painelData, campo);
    campo.setAttribute("aria-expanded", "true");
    desligarFechosData = ligarFechosDoPopup(painelData, campo, fecharSeletorData);

    const entrada = painelData.querySelector('.perfil-data-dia[tabindex="0"]');
    if (entrada) entrada.focus();
  }

  // Idempotente, e pelas mesmas razões do seletor da hora: o devolverFoco
  // separa o Esc e a escolha de um dia (que põem o foco de volta no campo) de
  // um clique fora (que não o deve tirar a quem o pôs noutro sítio).
  function fecharSeletorData(devolverFoco) {
    const estavaAberto = painelData && painelData.classList.contains("aberto");

    if (painelData) painelData.classList.remove("aberto");
    const campo = document.getElementById("obs-data-campo");
    if (campo) campo.setAttribute("aria-expanded", "false");

    if (desligarFechosData) {
      desligarFechosData();
      desligarFechosData = null;
    }

    if (estavaAberto && devolverFoco && campo) campo.focus();
  }

  window.criarEstrelas();   // o mesmo campo de estrelas do menu

  // O botão da data diz a data à portuguesa; o valor continua em "AAAA-MM-DD",
  // no campo escondido (ver o sincronizarCampoData).
  sincronizarCampoData();

  // A hora local da localização escolhida, a andar segundo a segundo.
  atualizarHoraLocal();
  setInterval(atualizarHoraLocal, 1000);

  // O campo da procura: quem o escreve é que sabe quando lhe estão a escrever
  // dentro, por isso é ele que avisa. Fica aqui, e não num oninput/onkeydown do
  // HTML, por ser o único sítio que os usa — e porque assim os dois gestos
  // (escrever procura, Escape fecha) nascem lado a lado, onde se lê que são o
  // mesmo campo. Foi esta ligação que faltou: a lista de resultados existia,
  // a rota existia, o procurarCidade existia, e escrever no campo não fazia
  // nada, porque ninguém o chamava.
  const campoProcura = document.getElementById("local-procura");
  if (campoProcura) {
    campoProcura.addEventListener("input", procurarCidade);
    campoProcura.addEventListener("keydown", fecharResultadosComEscape);
  }
})();
