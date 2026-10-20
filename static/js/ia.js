// ── AstroGuide — a AstroGuide AI ─────────────────────────────────────────
// O painel de conversa: o botão, a lista de mensagens e o pedido ao servidor.
//
// Vive num ficheiro próprio, como o conta.js, porque é uma peça da moldura da
// aplicação e não de um dos ecrãs — o botão está por cima de todos eles.
//
// A CHAVE DA IA NÃO ESTÁ AQUI, E NÃO PODE ESTAR. Este ficheiro fala com o
// nosso /api/ia/chat, e é o servidor que fala com o serviço de IA. Se a chave
// viesse para aqui, qualquer pessoa a lia no inspetor do browser e ficava com
// ela — e, como se paga ao pedido, quem a tivesse gastava o dinheiro de quem a
// criou. Tudo o que o browser sabe é se há IA configurada (ver /api/ia/estado).
//
// O histórico desta conversa vive no sessionStorage, como o estado da música
// (ver o shared-ui-controls.js): a sessão do Flask guarda só o id do
// utilizador, e o servidor não guarda conversas nenhumas. Desaparece quando o
// separador fecha, que é o que se espera de uma conversa de sessão.
(function () {

  // ── Configuração ──────────────────────────────────────────────────────

  // O mesmo limite que o ai_engine usa do lado do servidor. Está repetido
  // aqui porque as duas pontas têm de concordar: o que o browser guarda a
  // mais nunca chegaria a ser lido.
  const MAXIMO_MENSAGENS = 20;

  // Quanto tempo se espera pela resposta do servidor antes de desistir.
  //
  // Não é um capricho: o servidor também tem os seus limites (90 s por
  // chamada ao serviço de IA e 3 minutos pela pergunta inteira, ver o
  // py/ia/ai_engine.py), e sem esta ponta o painel ficava a dizer "A
  // pensar..." sem hora marcada — com o botão de enviar bloqueado por causa
  // do `ocupado`, não havia maneira nenhuma de sair dali senão recarregar a
  // página. Ficam 4 minutos, acima do que o servidor pode demorar, para o
  // aviso nosso nunca chegar antes do aviso dele.
  const TEMPO_MAXIMO_PEDIDO_MS = 240000;

  const CHAVE_SESSAO = "astroguide_ia_historico";

  // O primeiro nome de quem tem sessão iniciada, para a saudação do estado
  // inicial. Vem do /api/me — o mesmo pedido que escreve o nome no botão de
  // conta (ver o conta.js) —, e guarda-se só o primeiro: uma saudação não é
  // um cartão de visita, e "Olá, Diogo 👋" lê-se melhor do que o nome todo.
  let nomeUtilizador = null;

  // O fuso da localização escolhida, para a hora do cabeçalho ser a de lá e
  // não a do computador de quem está a ver. Vem do window.LOCALIZACAO (o
  // index.html escreve-o) ou, nas páginas que não o têm, do /api/me — que
  // responde com a localização da conta em todas.
  let fusoHorario = (window.LOCALIZACAO && window.LOCALIZACAO.timezone) || null;

  const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  // A hora e a data da localização: "21:30 - 24 Out 2024", como na
  // referência. O formatToParts é o que permite montar a data à nossa maneira
  // sem depender do formato (mais comprido) do locale.
  function partesDaHora(agora, fuso) {
    const opcoes = {
      day: "2-digit",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    };
    if (fuso) opcoes.timeZone = fuso;

    const partes = new Intl.DateTimeFormat("pt-PT", opcoes).formatToParts(agora);
    const mapa = {};
    partes.forEach(function (parte) { mapa[parte.type] = parte.value; });
    return mapa;
  }

  function atualizarHoraIA() {
    const alvo = document.getElementById("ia-hora");
    if (!alvo) return;

    let p;
    try {
      p = partesDaHora(new Date(), fusoHorario);
    } catch (_) {
      // Um fuso inválido (ou um browser sem Intl a sério) não pode deixar o
      // relógio em branco: cai-se para a hora do computador.
      try {
        p = partesDaHora(new Date(), null);
      } catch (__) {
        return;
      }
    }

    const mes = MESES_CURTOS[Number(p.month) - 1] || p.month;
    alvo.textContent = p.hour + ":" + p.minute + " - " + p.day + " " + mes + " " + p.year;
  }

  // A conversa: uma lista de {papel, texto}. O papel é "user", "assistant" ou
  // "erro". Os de "erro" ficam na lista para a conversa não perder o fio —
  // vê-se que houve uma falha àquela altura —, mas não são enviados ao
  // serviço de IA: uma falha nossa não é uma coisa que a IA tenha dito.
  let historico = [];

  // Se o servidor tem IA configurada. Começa a null — ainda não se sabe —,
  // para não deixar enviar nada antes de a /api/ia/estado responder.
  let disponivel = null;

  // Para não deixar dois pedidos ao mesmo tempo: um clique repetido no enviar
  // criava duas respostas à mesma pergunta, pagas as duas.
  let ocupado = false;


  // ── Os elementos ──────────────────────────────────────────────────────

  const painel    = () => document.getElementById("painel-ia");
  const lista     = () => document.getElementById("ia-mensagens");
  const entrada   = () => document.getElementById("ia-entrada");
  const botao     = () => document.getElementById("btn-ia");
  const btnEnviar = () => document.getElementById("ia-enviar");


  // ── Abrir e fechar ────────────────────────────────────────────────────

  window.toggleIA = function toggleIA() {
    const p = painel();
    if (!p) return;

    if (p.classList.contains("aberto")) {
      window.fecharIA();
      return;
    }

    // Um painel que estava a fechar e é reaberto depressa volta a abrir em
    // vez de ficar com as duas classes a competir.
    p.classList.remove("a-fechar");
    p.classList.add("aberto");
    const b = botao();
    if (b) b.setAttribute("aria-expanded", "true");

    // No Observatório o painel das configurações vive no mesmo canto — é o ⚙️
    // logo ao lado deste botão (ver o ia.css), e o painel dele é maior do que
    // o vão. Com os dois abertos ficavam um em cima do outro, por isso quem
    // abre este fecha aquele. Nas outras abas isto não faz nada: lá o ⚙️ nem
    // existe. O toggleConfig é de outra página (shared-ui-controls.js), daí o
    // typeof — aqui ele existe sempre, mas a guarda documenta a ligação.
    const config = document.getElementById("painel-config");
    if (config && config.classList.contains("visivel") && typeof window.toggleConfig === "function") {
      window.toggleConfig();
    }

    // O foco vai para a caixa de escrita: quem abriu o painel é para escrever,
    // e obrigá-lo a clicar outra vez era um passo a mais.
    const campo = entrada();
    if (campo && disponivel) campo.focus();

    // A conversa abre no fim, onde estava: com histórico restaurado, abrir no
    // princípio obrigava a rolar até à última mensagem sempre que se voltava
    // a abrir o painel.
    const l = lista();
    if (l) l.scrollTop = historico.length ? l.scrollHeight : 0;
  };

  window.fecharIA = function fecharIA() {
    const p = painel();
    if (!p) return;
    const b = botao();
    if (b) b.setAttribute("aria-expanded", "false");

    // Já fechado: não há nada para animar. Sem esta guarda, um Escape
    // repetido voltava a pôr a classe do fecho num painel escondido e deixava-o
    // montado por cima do ecrã.
    if (!p.classList.contains("aberto")) return;

    // O fecho é o contrário da abertura: o painel desvanece e afunda-se uns
    // píxeis antes de sair do ecrã. Tirar só o "aberto" punha display:none e
    // o fecho não se via, por isso fica a classe "a-fechar" (animada no
    // ia.css) e é o fim da animação que o desmonta. O relógio é a rede de
    // segurança para quando a animação não corre (menos movimento, separador
    // em segundo plano).
    p.classList.remove("aberto");
    p.classList.add("a-fechar");

    const desmontar = function () {
      p.classList.remove("a-fechar");
    };
    p.addEventListener("animationend", desmontar, { once: true });
    setTimeout(desmontar, 400);
  };

  // ── Maximizar ────────────────────────────────────────────────────────
  // O ⛶ do cabeçalho: alterna entre o tamanho normal do painel e um quase
  // full-screen, para as conversas que crescem. É só uma classe no painel —
  // o histórico e o scroll não se mexem com a mudança de tamanho, e o botão
  // passa a dizer "Restaurar" para não haver dois estados com o mesmo nome.
  window.maximizarIA = function maximizarIA() {
    const p = painel();
    if (!p) return;

    const maximizado = p.classList.toggle("maximizado");

    const btn = document.querySelector(".ia-btn-maximizar");
    if (btn) {
      btn.setAttribute("aria-pressed", maximizado ? "true" : "false");
      const rotulo = maximizado ? "Restaurar" : "Maximizar";
      btn.title = rotulo;
      btn.setAttribute("aria-label", rotulo + " o painel da AstroGuide AI");
    }

    // O fim da conversa voltava a ficar escondido quando o painel crescia:
    // a lista ficava mais alta e o scroll ficava onde estava.
    const l = lista();
    if (l) l.scrollTop = l.scrollHeight;
  };

  // ── Nova conversa ─────────────────────────────────────────────────────
  // Deita fora o histórico e volta ao princípio. Não apaga nada no servidor
  // porque não há nada no servidor para apagar.
  window.novaConversaIA = function novaConversaIA() {
    if (ocupado) return;
    historico = [];
    sessionStorage.removeItem(CHAVE_SESSAO);
    desenharConversa();
    const campo = entrada();
    if (campo && disponivel) campo.focus();
  };


  // ── Desenhar ──────────────────────────────────────────────────────────

  function desenharConversa() {
    pararContagemQuota();

    const l = lista();
    if (!l) return;

    l.textContent = "";   // limpa sem innerHTML — nada disto é HTML
    atualizarBotaoNova();

    if (!historico.length) {
      // O ecrã inicial. É uma peça só (ver o criarBoasVindas), e é a primeira
      // mensagem verdadeira que o deita fora de uma vez — a apresentação e os
      // atalhos vão juntos.
      //
      // A apresentação não é do modelo: é nossa, e por isso não vai como
      // histórico. Se fosse, aparecia ao modelo como algo que ele próprio
      // disse.
      l.appendChild(criarBoasVindas());
      return;
    }

    historico.forEach(function (m) {
      l.appendChild(criarLinha(m.papel, m.texto));
    });

    l.scrollTop = l.scrollHeight;
  }

  // ── O ecrã inicial ────────────────────────────────────────────────────
  // Sem conversa, o painel mostra o cartão de boas-vindas da referência: a
  // saudação e a apresentação dentro de um cartão com a borda em gradiente,
  // o avatar encostado ao canto de baixo e, por baixo, as quatro perguntas.
  //
  // A saudação leva o primeiro nome, e só ele: uma saudação não é um cartão
  // de visita. O nome só se sabe depois de o /api/me responder, e é por isso
  // que este ecrã só é desenhado no fim das duas perguntas ao servidor.
  function criarBoasVindas() {
    const vazio = document.createElement("div");
    vazio.className = "ia-boas-vindas";

    const linha = document.createElement("div");
    linha.className = "ia-boas-linha";

    // O símbolo da AstroGuide, encostado ao fundo do cartão: quem fala
    // primeiro é o assistente, e é a orbe que assina as respostas a
    // apresentar-se — não a silhueta de quem chegou, que ainda não disse
    // nada. É o mesmo emblema do cabeçalho, maior.
    linha.appendChild(criarAvatar("ia"));

    const cartao = document.createElement("div");
    cartao.className = "ia-boas-cartao";

    const saudacao = document.createElement("p");
    saudacao.className = "ia-boas-saudacao";
    saudacao.appendChild(document.createTextNode(
      (nomeUtilizador ? "Olá, " + nomeUtilizador : "Olá") + " 👋"
    ));

    const corpo = document.createElement("p");
    corpo.className = "ia-boas-texto";
    corpo.appendChild(document.createTextNode(
      "Sou o AstroGuide AI. Posso ajudar-te a explorar o céu, explicar " +
      "eventos astronómicos, encontrar objetos para observar ou esclarecer " +
      "qualquer dúvida sobre o universo."
    ));

    const pergunta = document.createElement("p");
    pergunta.className = "ia-boas-texto ia-boas-pergunta";
    pergunta.appendChild(document.createTextNode("O que gostarias de descobrir hoje?"));

    cartao.appendChild(saudacao);
    cartao.appendChild(corpo);
    cartao.appendChild(pergunta);

    linha.appendChild(cartao);
    vazio.appendChild(linha);
    vazio.appendChild(criarSugestoes());
    return vazio;
  }

  // A constelação da quarta sugestão, em SVG: é o único dos quatro símbolos
  // que não existe como emoji. Traço fino e pontos redondos, da cor do
  // acento. Os SVG são criados com createElementNS — não há innerHTML.
  function criarIconeConstelacao() {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");

    const estrelas = [[3.5, 17.5], [8.5, 9], [14.5, 12.5], [21, 5.5], [18, 19]];
    const ligacoes = [[0, 1], [1, 2], [2, 3], [2, 4]];

    ligacoes.forEach(function (par) {
      const a = estrelas[par[0]];
      const b = estrelas[par[1]];
      const linha = document.createElementNS(NS, "line");
      linha.setAttribute("x1", a[0]);
      linha.setAttribute("y1", a[1]);
      linha.setAttribute("x2", b[0]);
      linha.setAttribute("y2", b[1]);
      linha.setAttribute("stroke", "currentColor");
      linha.setAttribute("stroke-width", "0.9");
      linha.setAttribute("opacity", "0.55");
      svg.appendChild(linha);
    });

    estrelas.forEach(function (ponto) {
      const estrela = document.createElementNS(NS, "circle");
      estrela.setAttribute("cx", ponto[0]);
      estrela.setAttribute("cy", ponto[1]);
      estrela.setAttribute("r", "1.5");
      estrela.setAttribute("fill", "currentColor");
      svg.appendChild(estrela);
    });

    return svg;
  }

  function criarSugestoes() {
    const caixa = document.createElement("div");
    caixa.className = "ia-sugestoes";

    // As quatro perguntas da referência. São quatro maneiras de usar isto que
    // a aplicação tem de seu — o céu de agora, o calendário, um planeta e
    // uma constelação — e é por elas que se percebe que a IA responde com os
    // dados do AstroGuide e não de cor. A localização não vai na pergunta: o
    // servidor já a mete no contexto de todas elas.
    const sugestoes = [
      { icone: "🔭", texto: "O que consigo ver hoje?" },
      { icone: "☄️", texto: "Próximos eventos astronómicos." },
      { icone: "🪐", texto: "Onde está Saturno agora?" },
      { constelacao: true, texto: "Explica-me uma constelação." }
    ];

    sugestoes.forEach(function (sugestao) {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "ia-sugestao";

      // O símbolo à esquerda e a pergunta ao lado — o texto é o que
      // interessa quando se clica, e o símbolo é o que distingue as linhas
      // antes de se ler o texto.
      const icone = document.createElement("span");
      icone.className = "ia-sugestao-icone";
      icone.setAttribute("aria-hidden", "true");
      if (sugestao.constelacao) {
        icone.appendChild(criarIconeConstelacao());
      } else {
        icone.appendChild(document.createTextNode(sugestao.icone));
      }

      const texto = document.createElement("span");
      texto.className = "ia-sugestao-texto";
      texto.appendChild(document.createTextNode(sugestao.texto));

      // O chevron da direita. Não é conteúdo, é a promessa de que tocar aqui
      // segue para algum lado.
      const seta = document.createElement("span");
      seta.className = "ia-sugestao-seta";
      seta.setAttribute("aria-hidden", "true");
      seta.appendChild(document.createTextNode("›"));

      botao.appendChild(icone);
      botao.appendChild(texto);
      botao.appendChild(seta);

      botao.addEventListener("click", function () {
        const campo = entrada();
        // O estado é verificado aqui outra vez, e não só dentro do
        // enviarMensagemIA: um duplo clique apanhava dois envios antes de o
        // primeiro ter marcado a conversa como ocupada.
        if (!campo || ocupado || !disponivel) return;
        campo.value = sugestao.texto;
        ajustarAlturaCampo();
        atualizarBotaoEnviar();
        window.enviarMensagemIA();
      });
      caixa.appendChild(botao);
    });

    return caixa;
  }

  // O papel que anda na conversa é o do histórico — "user", "assistant",
  // "erro", os mesmos nomes que o servidor conhece —, e as classes do ia.css
  // são outras. A tradução é aqui, e é o único sítio onde ela existe: um papel
  // sem tradução não dá erro nenhum, dá uma mensagem sem alinhamento e sem
  // avatar — o que é pior, porque se vê sem se saber porquê.
  const CLASSES = {
    user: "utilizador",
    assistant: "ia",
    erro: "erro"
  };

  function criarAvatar(classe) {
    // O avatar de quem falou, desenhado todo em CSS (ver o ia.css): a orbe com
    // o anel da AstroGuide para as respostas — o mesmo emblema do cabeçalho —
    // e a silhueta da pessoa para as perguntas. Não leva carácter nenhum
    // dentro: é decoração, e um leitor de ecrã a ler um símbolo a meio da
    // conversa só atrapalha.
    const avatar = document.createElement("span");
    avatar.className = "ia-avatar " + classe;
    avatar.setAttribute("aria-hidden", "true");
    return avatar;
  }

  function criarLinha(papel, texto) {
    // Uma mensagem é a LINHA — a bolha e o avatar ao lado —, e não a bolha
    // sozinha. É a linha que se encosta a um lado, e é o avatar que diz quem
    // falou sem ser preciso ler; ver o ia.css.
    const classe = CLASSES[papel] || "erro";

    const linha = document.createElement("div");
    linha.className = "ia-linha " + classe;

    const bolha = document.createElement("div");
    bolha.className = "ia-mensagem " + classe;

    if (classe === "ia") {
      // A resposta vem em Markdown. Passa por um formatador que constrói
      // elementos com nós de texto (ver o formatarMarkdown) — nunca
      // innerHTML: o texto vem de um modelo, e um modelo que devolvesse
      // "<img onerror=...>" transformava o painel numa porta aberta para a
      // página. Escrito como texto, é texto — o que quer que ele seja.
      bolha.appendChild(formatarMarkdown(texto));
    } else {
      bolha.appendChild(document.createTextNode(texto));
    }

    if (classe === "erro") {
      // Uma falha não foi dita por ninguém: fica sem cara nenhuma.
      linha.appendChild(bolha);
    } else if (classe === "utilizador") {
      // O avatar do lado de fora, virado para a conversa — o da pergunta
      // depois da bolha e o da resposta antes dela. É o que põe as duas caras
      // uma em frente da outra em vez de ambas encostadas à parede.
      linha.appendChild(bolha);
      linha.appendChild(criarAvatar(classe));
    } else {
      linha.appendChild(criarAvatar(classe));
      linha.appendChild(bolha);
    }

    return linha;
  }

  // ── O Markdown das respostas ──────────────────────────────────────────
  // O modelo escreve em Markdown — títulos, listas, negritos, blocos de
  // código — e o painel mostrava tudo isso como asteriscos e cardinales no
  // meio do texto, o que fazia uma resposta longa parecer um rascunho. Isto
  // transforma-o em elementos a sério.
  //
  // TUDO É CONSTRUÍDO COM NÓS DE TEXTO. Não há innerHTML em lado nenhum: a
  // resposta é de um modelo, e o que se parece com HTML continua a ser
  // texto. O que não estiver previsto aqui (tabelas, imagens, links) fica
  // como texto — que é o que se lê bem na mesma.

  function noDeTexto(texto) {
    return document.createTextNode(texto);
  }

  // **negrito**, __negrito__, *itálico*, _itálico_ e `código`. O regex é
  // criado em cada chamada para não guardar estado entre mensagens.
  function acrescentarInline(pai, texto) {
    const marcas = /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\*[^*\n]+\*|_[^_\n]+_)/g;
    let ultimo = 0;
    let achado;

    while ((achado = marcas.exec(texto)) !== null) {
      if (achado.index > ultimo) {
        pai.appendChild(noDeTexto(texto.slice(ultimo, achado.index)));
      }
      const bruto = achado[0];
      let elemento;
      if (bruto.slice(0, 2) === "**" || bruto.slice(0, 2) === "__") {
        elemento = document.createElement("strong");
        elemento.appendChild(noDeTexto(bruto.slice(2, -2)));
      } else if (bruto.charAt(0) === "`") {
        elemento = document.createElement("code");
        elemento.appendChild(noDeTexto(bruto.slice(1, -1)));
      } else {
        elemento = document.createElement("em");
        elemento.appendChild(noDeTexto(bruto.slice(1, -1)));
      }
      pai.appendChild(elemento);
      ultimo = achado.index + bruto.length;
    }

    if (ultimo < texto.length) pai.appendChild(noDeTexto(texto.slice(ultimo)));
  }

  function formatarMarkdown(texto) {
    const fragmento = document.createDocumentFragment();
    const linhas = String(texto).replace(/\r\n?/g, "\n").split("\n");

    let paragrafo = null;   // o <p> que está a ser enchido
    let lista = null;       // a <ul>/<ol> que está a ser enchida
    let citacao = null;     // o <blockquote> que está a ser enchido

    function fecharBlocos() {
      paragrafo = null;
      lista = null;
      citacao = null;
    }

    let i = 0;
    while (i < linhas.length) {
      const linha = linhas[i];

      // Bloco de código: o que está entre as duas cercas é literal, e é por
      // isso o único sítio onde não se procura Markdown nenhum.
      const cerca = /^\s*```\s*([\w+-]*)\s*$/.exec(linha);
      if (cerca) {
        fecharBlocos();
        const codigo = [];
        i++;
        while (i < linhas.length && !/^\s*```\s*$/.test(linhas[i])) {
          codigo.push(linhas[i]);
          i++;
        }
        i++;   // a cerca de fecho
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.appendChild(noDeTexto(codigo.join("\n")));
        pre.appendChild(code);
        fragmento.appendChild(pre);
        continue;
      }

      if (!linha.trim()) {
        fecharBlocos();
        i++;
        continue;
      }

      // Títulos (#, ##, ###). Viram um parágrafo com o estilo de título e um
      // <strong> por dentro: dentro de uma conversa, um <h1> não melhora a
      // leitura de um leitor de ecrã, e a hierarquia da página não é a da
      // conversa.
      const titulo = /^\s*#{1,6}\s+(.*)$/.exec(linha);
      if (titulo) {
        fecharBlocos();
        const bloco = document.createElement("p");
        bloco.className = "ia-md-titulo";
        const forte = document.createElement("strong");
        acrescentarInline(forte, titulo[1].trim());
        bloco.appendChild(forte);
        fragmento.appendChild(bloco);
        i++;
        continue;
      }

      // Linha horizontal.
      if (/^\s*([-*_])\s*(?:\1\s*){2,}$/.test(linha)) {
        fecharBlocos();
        fragmento.appendChild(document.createElement("hr"));
        i++;
        continue;
      }

      // Citação.
      const linhaCitada = /^\s*>\s?(.*)$/.exec(linha);
      if (linhaCitada) {
        paragrafo = null;
        lista = null;
        if (!citacao) {
          citacao = document.createElement("blockquote");
          fragmento.appendChild(citacao);
        }
        acrescentarInline(citacao, linhaCitada[1]);
        if (i + 1 < linhas.length && /^\s*>\s?/.test(linhas[i + 1])) {
          citacao.appendChild(document.createElement("br"));
        }
        i++;
        continue;
      }

      // Listas com marcador (-, *, •) e numeradas (1., 1)).
      const marcador = /^\s*([-*•])\s+(.*)$/.exec(linha);
      const numerada = /^\s*\d+[.)]\s+(.*)$/.exec(linha);
      if (marcador || numerada) {
        paragrafo = null;
        citacao = null;
        const tipo = numerada ? "ol" : "ul";
        if (!lista || lista.tagName.toLowerCase() !== tipo) {
          lista = document.createElement(tipo);
          fragmento.appendChild(lista);
        }
        const item = document.createElement("li");
        acrescentarInline(item, numerada ? numerada[1] : marcador[2]);
        lista.appendChild(item);
        i++;
        continue;
      }

      // Texto normal: linhas seguidas são o mesmo parágrafo, e as quebras
      // simples mantêm-se (o CSS usa pre-wrap nelas).
      lista = null;
      citacao = null;
      if (!paragrafo) {
        paragrafo = document.createElement("p");
        fragmento.appendChild(paragrafo);
      } else {
        paragrafo.appendChild(noDeTexto("\n"));
      }
      acrescentarInline(paragrafo, linha.trim());
      i++;
    }

    return fragmento;
  }


  // ── O scroll da conversa ──────────────────────────────────────────────
  // A pergunta nova leva sempre a conversa ao fim. A resposta, não: quem
  // está a reler uma mensagem antiga não pode ser empurrado para baixo no
  // momento em que a resposta chega. Os 96px são a folga de quem já está
  // praticamente no fim — rolar um dedo para cima não é "ler o histórico".

  function estaNoFim() {
    const l = lista();
    if (!l) return true;
    return (l.scrollHeight - l.scrollTop - l.clientHeight) < 96;
  }

  function irAoFim() {
    const l = lista();
    if (l) l.scrollTop = l.scrollHeight;
  }

  function acrescentarBolha(papel, texto, forcarScroll) {
    const l = lista();
    if (!l) return null;
    // A primeira mensagem verdadeira deita fora o estado vazio — a
    // apresentação e os atalhos —, que é o que está ali quando não há
    // conversa nenhuma. Procura-se pela classe, e não por "o histórico está
    // vazio": nesta altura a pergunta já foi acrescentada ao histórico.
    const vazio = l.querySelector(".ia-boas-vindas");
    if (vazio) vazio.remove();

    // Vê-se onde o scroll estava ANTES de a mensagem existir: depois de a
    // acrescentar, o painel já cresceu e "está no fim" seria sempre verdade.
    const seguir = forcarScroll === true || estaNoFim();

    const linha = criarLinha(papel, texto);
    l.appendChild(linha);
    // A partir da primeira mensagem há conversa para recomeçar: é agora que
    // o ↺ aparece no cabeçalho.
    atualizarBotaoNova();
    if (seguir) irAoFim();
    // Devolve a BOLHA, não a linha: é dentro dela que a contagem da quota se
    // pendura (ver o contarQuota).
    return linha.querySelector(".ia-mensagem");
  }

  // ── A contagem da quota ──────────────────────────────────────────────
  // Quando a falha é a quota diária, o servidor manda no próprio resultado o
  // instante em que ela volta (campo "quota_renova_em", ISO com o fuso lá
  // dentro). A frase da bolha já diz quanto falta, mas essa frase envelhece —
  // e quem está à espera quer ver o número a andar. Por isso a bolha ganha
  // uma linha própria, que se atualiza sozinha até ao zero e aí troca por um
  // "já deve ter voltado".
  //
  // Só há um relógio de cada vez: começar uma contagem pára a anterior, e a
  // nova conversa (ou o aviso de indisponível) pára tudo — deixar um intervalo
  // a bater contra um elemento que já saiu do ecrã é memória que ninguém
  // recolhe.
  let relogioQuota = null;

  function pararContagemQuota() {
    if (relogioQuota !== null) {
      clearInterval(relogioQuota);
      relogioQuota = null;
    }
  }

  function textoContagem(restanteMs) {
    if (restanteMs <= 0) {
      return "Já deve ter voltado — tenta a pergunta outra vez.";
    }
    // Arredondado para CIMA: dizer "faltam 3 min" quando faltam dois e meio
    // é optimista, e "faltam 2" quando faltam dois e um segundo é mentira.
    const minutos = Math.ceil(restanteMs / 60000);
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    if (h > 0) {
      return "Faltam " + h + " h " + (m < 10 ? "0" : "") + m +
             " min para a quota diária voltar.";
    }
    if (minutos > 1) return "Faltam " + minutos + " min para a quota diária voltar.";
    return "Falta menos de um minuto para a quota diária voltar.";
  }

  function contarQuota(bolha, iso) {
    const quando = Date.parse(iso);
    if (isNaN(quando) || !bolha) return;

    pararContagemQuota();

    const alvo = document.createElement("span");
    alvo.className = "ia-contagem";
    bolha.appendChild(alvo);

    const bater = function () {
      const restante = quando - Date.now();
      alvo.textContent = textoContagem(restante);
      if (restante <= 0) pararContagemQuota();
    };

    bater();
    relogioQuota = setInterval(bater, 20000);
  }

  function mostrarAPensar() {
    const l = lista();
    if (!l) return;

    // A mesma linha de uma resposta — estrela e bolha —, com o indicador a
    // fazer de texto. É isto que faz a resposta aparecer no sítio onde já
    // estava o "a pensar", em vez de saltar para outro lado do painel.
    const linha = document.createElement("div");
    linha.className = "ia-linha ia";
    // O esconderAPensar procura por este id, e é o único sítio onde ele vive.
    linha.id = "ia-a-pensar";
    linha.appendChild(criarAvatar("ia"));

    const bolha = document.createElement("div");
    bolha.className = "ia-mensagem ia";

    // O indicador: três pontos que se acendem por turnos (ver o .ia-pontos
    // no ia.css). Levam aria-hidden porque são só movimento — e o que
    // anunciam fica numa classe que só os leitores de ecrã leem, para quem
    // não vê pontos a mexer-se saber que a resposta está a chegar.
    const pontos = document.createElement("span");
    pontos.className = "ia-pontos";
    pontos.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 3; i++) {
      pontos.appendChild(document.createElement("span"));
    }
    bolha.appendChild(pontos);

    const silencioso = document.createElement("span");
    silencioso.className = "ia-sr";
    silencioso.appendChild(document.createTextNode("A consultar o céu..."));
    bolha.appendChild(silencioso);
    linha.appendChild(bolha);

    l.appendChild(linha);
    l.scrollTop = l.scrollHeight;
  }

  function esconderAPensar() {
    const caixa = document.getElementById("ia-a-pensar");
    if (caixa) caixa.remove();
  }


  // ── O aviso de que não há IA ──────────────────────────────────────────
  // Duas maneiras de não estar disponível, e a resolução é diferente em cada
  // uma — por isso o aviso diz qual delas é. Dizer só "não está disponível"
  // obrigava quem administra o servidor a adivinhar o que faltava.

  function mostrarIndisponivel(motivo) {
    pararContagemQuota();

    const l = lista();
    if (!l) return;
    l.textContent = "";

    // Três motivos, e o deles todos manda para um sítio diferente: sem conta
    // é uma porta (o /entrar), sem dependência é um comando, e sem chave é
    // uma tarefa de quem gere o servidor. Dizer só "não está disponível"
    // obrigava a adivinhar qual dos três era.
    const texto = motivo === "sem_conta"
      ? "A AstroGuide AI é para contas com sessão iniciada.\n\n" +
        "Entra na tua conta ou cria uma — é gratuito, e dá-te também os " +
        "favoritos, o caderno de observações e a localização guardada. " +
        "Enquanto não entrares, o resto da aplicação funciona como sempre."
      : motivo === "sem_dependencia"
      ? "A AstroGuide AI está configurada, mas falta o pacote que fala com o " +
        "serviço de IA.\n\n" +
        "Instala-se com: py -m pip install -r requirements.txt"
      : "A AstroGuide AI não está configurada neste servidor.\n\n" +
        "Quem o administra tem de criar uma chave no site da Groq e guardá-la " +
        "na variável de ambiente GROQ_API_KEY (ver .env.example). Se o " +
        "servidor usar a alternativa Gemini, a chave é a GEMINI_API_KEY. " +
        "Enquanto isso, o resto da aplicação funciona como sempre.";

    const aviso = document.createElement("div");
    aviso.className = "ia-aviso";
    aviso.appendChild(document.createTextNode(texto));

    if (motivo === "sem_conta") {
      // A porta de saída. O texto acima diz o que falta; este <a> leva lá —
      // sem ele, a pessoa sabia o que tinha de fazer mas tinha de ir procurar
      // o caminho sozinha. É um link e não um botão pelo mesmo motivo do
      // #btn-conta (ver conta.css): funciona com o teclado e antes de o
      // JavaScript responder.
      const porta = document.createElement("a");
      porta.className = "ia-aviso-accao";
      porta.href = "/entrar";
      porta.textContent = "Entrar ou criar conta";
      aviso.appendChild(porta);
    }

    l.appendChild(aviso);

    const campo = entrada();
    if (campo) {
      campo.disabled = true;
      campo.placeholder = "AstroGuide AI indisponível";
    }
    // A linha do cabeçalho passa a dizer a verdade: o ponto verde continuava
    // a prometer alguém do outro lado.
    definirEstado("Indisponível", motivo === "sem_conta"
      ? "Inicia sessão para conversar"
      : "Falta configuração no servidor", "off");
    atualizarBotaoEnviar();
  }


  // ── Enviar ────────────────────────────────────────────────────────────

  // O ecrã onde o painel está aberto, para o servidor o pôr à frente do
  // modelo. Não é decoração: é o que impede a IA de mandar alguém ver uma
  // magnitude no Céu Agora, que é um ecrã sem magnitudes (o mapa dos ecrãs
  // está no py/ia/ai_engine.py, no O_QUE_CADA_ECRA_MOSTRA).
  //
  // Só devolve nomes que o servidor conhece: o que não estiver na lista branca
  // lá do lado é deitado fora antes de chegar às instruções do modelo.
  function telaAtual() {
    const corpo = document.body;
    if (!corpo) return null;

    if (corpo.classList.contains("page-perfil")) return "perfil";
    if (corpo.classList.contains("page-admin")) return "admin";

    // Na aplicação, o ecrã ativo é o .ecra com a classe "ativo" (ver
    // mudarEcra, no index.js) — e distingue o Céu Agora do Calendário sem
    // depender de qual deles está aberto.
    const ativo = document.querySelector(".ecra.ativo");
    if (ativo && ativo.id && ativo.id.indexOf("ecra-") === 0) {
      return ativo.id.slice(5);
    }

    // Sem ecrã nenhum à vista, é o menu (page-menu sem page-perfil nem
    // page-admin é o menu inicial — ver menu.html).
    if (corpo.classList.contains("page-menu")) return "menu";

    return null;
  }

  window.enviarMensagemIA = async function enviarMensagemIA() {
    if (ocupado || !disponivel) return;

    const campo = entrada();
    if (!campo) return;

    const texto = campo.value.trim();
    if (!texto) return;

    // O histórico que segue para o servidor: só o que foi mesmo conversa. As
    // bolhas de erro ficam de fora — não foram ditas por ninguém.
    const paraEnviar = historico
      .filter(function (m) { return m.papel === "user" || m.papel === "assistant"; })
      .slice(-MAXIMO_MENSAGENS)
      .map(function (m) { return { papel: m.papel, texto: m.texto }; });

    // A pergunta aparece já, sem esperar pela resposta. É o que se espera de
    // uma janela de conversa, e se o pedido falhar a bolha de erro fica logo
    // a seguir e vê-se ao que ela responde.
    campo.value = "";
    ajustarAlturaCampo();
    historico.push({ papel: "user", texto: texto });
    // A pergunta acabou de ser escrita por quem está a ver: a conversa vai
    // para o fim, mesmo que estivesse a ler mensagens antigas.
    acrescentarBolha("user", texto, true);
    guardarHistorico();

    ocupado = true;
    definirOcupado(true);
    definirEstado("A consultar o céu…", "Só um instante", "busy");
    mostrarAPensar();

    // O relógio do pedido. Só se cancela quando a resposta chega (ou falha),
    // que é o que o finally lá em baixo faz.
    const controlador = new AbortController();
    const prazo = setTimeout(function () { controlador.abort(); }, TEMPO_MAXIMO_PEDIDO_MS);

    try {
      const resposta = await fetch("/api/ia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: texto, historico: paraEnviar, ecra: telaAtual() }),
        signal: controlador.signal
      });

      const dados = await resposta.json().catch(function () { return null; });

      if (dados && dados.ok) {
        historico.push({ papel: "assistant", texto: dados.resposta });
        acrescentarBolha("assistant", dados.resposta);
      } else {
        // O servidor já escreveu a frase em português; é essa que se mostra.
        // O "||" é só a rede de segurança para uma resposta que não seja JSON
        // nenhum — um proxy pelo caminho, uma página de erro do servidor.
        const mensagem = (dados && dados.erro)
          || "Não consegui obter resposta da AstroGuide AI. Tenta novamente.";
        historico.push({ papel: "erro", texto: mensagem });
        const bolha = acrescentarBolha("erro", mensagem);
        // Só a quota diária traz o prazo (campo "quota_renova_em"); as outras
        // falhas não têm nada a contar.
        if (dados && dados.quota_renova_em) contarQuota(bolha, dados.quota_renova_em);
      }
    } catch (erro) {
      // Aqui ou não houve resposta (o servidor está em baixo, ou a rede caiu),
      // ou fomos nós que mandámos terminar ao relógio. As duas coisas têm
      // frases diferentes — dizer "verifica a ligação à internet" a quem tem
      // a ligação de pé e só esperou tempo demais manda a pessoa à procura do
      // problema errado.
      const cancelado = erro && erro.name === "AbortError";
      const mensagem = cancelado
        ? "A AstroGuide AI demorou demasiado tempo. Tenta a pergunta outra vez."
        : "Não consegui chegar ao servidor da AstroGuide AI. " +
          "Verifica a ligação à internet.";
      historico.push({ papel: "erro", texto: mensagem });
      acrescentarBolha("erro", mensagem);
    } finally {
      clearTimeout(prazo);
      esconderAPensar();
      ocupado = false;
      definirOcupado(false);
      definirEstado("Online", "Explore o cosmos", "on");
      guardarHistorico();
      // O foco volta à caixa: quem fez uma pergunta é para fazer a seguinte.
      campo.focus();
    }
  };

  // O estado do cabeçalho. O ponto, a palavra e a linha de baixo mudam
  // juntos: um ponto verde com "Indisponível" ao lado era pior do que não
  // dizer nada.
  function definirEstado(principal, detalhe, tipo) {
    const caixa = document.getElementById("ia-estado");
    if (!caixa) return;
    const palavra = caixa.querySelector(".ia-estado-texto");
    const sub = caixa.querySelector(".ia-estado-sub");
    if (palavra && principal) palavra.textContent = principal;
    if (sub && detalhe) sub.textContent = detalhe;
    caixa.classList.toggle("is-busy", tipo === "busy");
    caixa.classList.toggle("is-off", tipo === "off");
  }

  // A caixa de escrita cresce com o texto, até ao limite do ia.css (96px); a
  // partir daí rola por dentro. O "auto" antes da medida é o que a faz
  // encolher outra vez quando se apaga uma linha.
  function ajustarAlturaCampo() {
    const campo = entrada();
    if (!campo) return;
    campo.style.height = "auto";
    campo.style.height = Math.max(40, Math.min(campo.scrollHeight, 96)) + "px";
  }

  // O enviar só está ativo quando há algo escrito. O estado é recalculado em
  // cada mudança da caixa, em cada envio e quando a IA fica disponível ou
  // não — num sítio só, para não haver dois botões com opiniões diferentes.
  function atualizarBotaoEnviar() {
    const enviar = btnEnviar();
    const campo = entrada();
    if (!enviar) return;
    const vazio = !campo || !campo.value.trim();
    enviar.disabled = ocupado || !disponivel || vazio;
  }

  // O ↺ da conversa nova só aparece quando há conversa para recomeçar: no
  // ecrã inicial o cabeçalho tem os três controlos da janela, como na
  // referência. A ação continua a ser o window.novaConversaIA.
  function atualizarBotaoNova() {
    const btn = document.querySelector(".ia-btn-nova");
    if (btn) btn.hidden = historico.length === 0;
  }

  function definirOcupado(estado) {
    const campo = entrada();
    if (campo) campo.disabled = estado;
    atualizarBotaoEnviar();
  }

  function guardarHistorico() {
    try {
      sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(historico));
    } catch (_) {
      // O sessionStorage pode recusar (janela privada, cota cheia). Não é
      // motivo para a conversa parar: perde-se é a memória entre páginas.
    }
  }

  function restaurarHistorico() {
    try {
      const guardado = sessionStorage.getItem(CHAVE_SESSAO);
      if (!guardado) return;
      const lido = JSON.parse(guardado);
      if (Array.isArray(lido)) {
        historico = lido
          .filter(function (m) {
            return m && typeof m.texto === "string"
              && (m.papel === "user" || m.papel === "assistant" || m.papel === "erro");
          })
          .slice(-MAXIMO_MENSAGENS);
      }
    } catch (_) {
      historico = [];
    }
  }


  // ── Arranque ──────────────────────────────────────────────────────────

  document.addEventListener("DOMContentLoaded", function () {
    // As páginas que não têm o painel (o menu, a entrada, o perfil, o /admin)
    // não fazem nada — o ia.js só é carregado pelo index.html, mas o teste
    // deixa o ficheiro a poder ser incluído em qualquer lado sem estragar.
    if (!painel()) return;

    restaurarHistorico();

    // O relógio do cabeçalho. Atualiza-se de 30 em 30 segundos — o suficiente
    // para o minuto mudar a horas, e não tanto que ande a repintar o painel.
    atualizarHoraIA();
    setInterval(atualizarHoraIA, 30000);

    const campo = entrada();
    if (campo) {
      // Enter envia, Shift+Enter muda de linha. É a convenção de qualquer
      // caixa de conversa, e numa caixa de duas linhas importa mais do que
      // parece: sem isto, escrever uma pergunta com um parágrafo dentro era
      // impossível.
      campo.addEventListener("keydown", function (evento) {
        if (evento.key === "Enter" && !evento.shiftKey) {
          evento.preventDefault();
          window.enviarMensagemIA();
        }
      });

      // A caixa cresce com o texto e o botão acende quando há o que enviar.
      campo.addEventListener("input", function () {
        ajustarAlturaCampo();
        atualizarBotaoEnviar();
      });

      // Antes de a /api/ia/estado responder não há IA confirmada: o enviar
      // fica apagado até se saber.
      ajustarAlturaCampo();
      atualizarBotaoEnviar();
    }

    // Escape fecha o painel, como fecha o modal das constelações.
    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape") window.fecharIA();
    });

    // Duas perguntas ao servidor, em conjunto: há IA configurada? E quem está
    // com sessão iniciada? A segunda é o nome da saudação do estado inicial,
    // e espera-se por elas as duas antes de desenhar — desenhar a saudação
    // sem nome e trocá-la depois era um piscar de olhos no primeiro ecrã.
    //
    // Se o estado demorar a chegar, o campo fica desativado — mas o botão
    // abre o painel na mesma, para não parecer que a aplicação não respondeu
    // ao clique.
    const pEstado = fetch("/api/ia/estado")
      .then(function (r) { return r.json(); })
      .catch(function () { return null; });

    const pNome = fetch("/api/me")
      .then(function (r) { return r.json(); })
      .catch(function () { return null; });

    Promise.all([pEstado, pNome]).then(function (resultados) {
      const estado = resultados[0];
      const eu = resultados[1];

      // O primeiro nome, e só ele — ver o criarBoasVindas.
      if (eu && eu.utilizador && eu.utilizador.nome) {
        nomeUtilizador = String(eu.utilizador.nome).trim().split(" ")[0] || null;
      }

      // O fuso da conta, para as páginas que não o escrevem no HTML. A hora
      // do cabeçalho passa a ser a do local escolhido, e não a do computador.
      if (eu && eu.localizacao && eu.localizacao.timezone) {
        fusoHorario = String(eu.localizacao.timezone);
        atualizarHoraIA();
      }

      if (estado && estado.disponivel) {
        disponivel = true;
        desenharConversa();
        definirEstado("Online", "Explore o cosmos", "on");
        atualizarBotaoEnviar();
      } else {
        // Sem estado não há IA — ou o /api/ia/estado nem respondeu (o
        // servidor em baixo, a rede caída). Trata-se como indisponível: é
        // melhor dizer que não há IA do que deixar alguém escrever para nada.
        disponivel = false;
        mostrarIndisponivel(estado && estado.motivo);
      }
    });
  });

})();
