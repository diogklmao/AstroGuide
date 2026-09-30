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
  // desenhado, debaixo de um separador. Não substitui nem reordena nada: as
  // terras da lista local continuam onde estavam e continuam a ser as
  // primeiras, porque são as que a aplicação conhece melhor.
  function acrescentarResultados(cidades) {
    const lista = document.getElementById("local-resultados");
    const campo = document.getElementById("local-procura");
    if (!lista || !campo || !cidades.length) return;

    const separador = document.createElement("li");
    separador.className = "perfil-resultados-separador";
    separador.setAttribute("role", "presentation");
    separador.textContent = "Outros sítios com este nome";
    lista.appendChild(separador);

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
