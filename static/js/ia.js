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

  // O que se mostra quando não há nada para mostrar. É também onde se explica
  // o que a IA faz: quem abre isto pela primeira vez não tem como adivinhar
  // que lhe pode perguntar pelo céu de agora e não só por conceitos.
  //
  // É função e não constante porque a saudação leva o nome — e o nome só se
  // sabe depois de o /api/me responder. Sem sessão (que é quando o painel
  // está indisponível) não chega a ser usado: quem não tem conta recebe o
  // aviso com a porta para o /entrar.
  function textoInicial() {
    const saudacao = nomeUtilizador
      ? "Olá, " + nomeUtilizador + " 👋"
      : "Olá 👋";
    return saudacao + "\n\n" +
      "Sou o AstroGuide AI. Posso ajudar-te a explorar o céu, explicar " +
      "eventos astronómicos, encontrar objetos para observar ou esclarecer " +
      "qualquer dúvida sobre o universo.\n\n" +
      "O que gostarias de descobrir hoje?";
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

    p.classList.add("aberto");
    const b = botao();
    if (b) b.setAttribute("aria-expanded", "true");

    // O foco vai para a caixa de escrita: quem abriu o painel é para escrever,
    // e obrigá-lo a clicar outra vez era um passo a mais.
    const campo = entrada();
    if (campo && disponivel) campo.focus();

    // A conversa abre no fim, onde estava: com histórico restaurado, abrir no
    // princípio obrigava a rolar até à última mensagem sempre que se voltava
    // a abrir o painel.
    const l = lista();
    if (l) l.scrollTop = l.scrollHeight;
  };

  window.fecharIA = function fecharIA() {
    const p = painel();
    if (!p) return;
    p.classList.remove("aberto");
    const b = botao();
    if (b) b.setAttribute("aria-expanded", "false");
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

    if (!historico.length) {
      // O estado vazio. Vive todo dentro de um só elemento com a classe
      // ia-boas-vindas, para que a primeira mensagem verdadeira o deite fora
      // de uma vez — a apresentação e os atalhos vão juntos.
      const vazio = document.createElement("div");
      vazio.className = "ia-boas-vindas";

      // A apresentação não é do modelo: é nossa, e por isso vai como texto e
      // não como histórico. Se fosse para o histórico, aparecia ao modelo
      // como algo que ele próprio disse.
      vazio.appendChild(criarLinha("assistant", textoInicial()));
      vazio.appendChild(criarSugestoes());
      l.appendChild(vazio);
      return;
    }

    historico.forEach(function (m) {
      l.appendChild(criarLinha(m.papel, m.texto));
    });

    l.scrollTop = l.scrollHeight;
  }

  // As perguntas de partida. Tocar numa escreve-a na caixa e envia-a: não há
  // caminho nenhum especial, é o mesmo enviarMensagemIA que o botão usa.
  //
  // São quatro, e de quatro maneiras diferentes de usar isto: o que se vê
  // hoje (o que a aplicação tem de seu), o calendário de eventos, a posição
  // de um astro e um conceito. Quem nunca cá veio não tem como saber que
  // estas coisas se podem pedir. A ordem não é ao acaso — a que mostra o que
  // a aplicação tem de seu vai à frente.
  //
  // O ícone é emoji (🔭 ☄️ 🪐 ✨), como os botões de configurações e de
  // conta: são símbolos que já se leem sem legenda. A seta à direita não é
  // conteúdo, é a promessa de que tocar aqui segue para algum lado.
  const SUGESTOES = [
    { icone: "🔭", texto: "O que consigo ver hoje?" },
    { icone: "☄️", texto: "Próximos eventos astronómicos" },
    { icone: "🪐", texto: "Onde está Saturno agora?" },
    { icone: "✨", texto: "Explica-me uma constelação" }
  ];

  function criarSugestoes() {
    const caixa = document.createElement("div");
    caixa.className = "ia-sugestoes";

    SUGESTOES.forEach(function (sugestao) {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "ia-sugestao";

      // Ícone à esquerda, texto ao meio, seta à direita — os três são do
      // card, e o texto é o único que interessa quando se clica.
      const icone = document.createElement("span");
      icone.className = "ia-sugestao-icone";
      icone.setAttribute("aria-hidden", "true");
      icone.appendChild(document.createTextNode(sugestao.icone));

      const texto = document.createElement("span");
      texto.className = "ia-sugestao-texto";
      texto.appendChild(document.createTextNode(sugestao.texto));

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
    // O avatar de quem falou. A estrela é da IA; a pessoa de quem pergunta é
    // desenhada em CSS (ver o ia.css) e por isso não leva carácter nenhum
    // dentro.
    const avatar = document.createElement("span");
    avatar.className = "ia-avatar " + classe;
    // É decoração — de que lado vem a bolha já se sabe pelo sítio onde ela
    // está —, e um leitor de ecrã a ler um símbolo a meio da conversa só
    // atrapalha.
    avatar.setAttribute("aria-hidden", "true");
    if (classe === "ia") {
      avatar.appendChild(document.createTextNode("✦"));
    }
    return avatar;
  }

  function criarLinha(papel, texto) {
    // Uma mensagem é a LINHA — a bolha e o avatar ao lado —, e não a bolha
    // sozinha. É a linha que se encosta a um lado, e é o avatar que diz quem
    // falou sem ser preciso ler; ver o ia.css.
    const classe = CLASSES[papel] || "erro";

    const linha = document.createElement("div");
    linha.className = "ia-linha " + classe;

    // textContent e nunca innerHTML: o texto vem de um modelo, e um modelo que
    // devolvesse "<img onerror=...>" transformava o painel numa porta aberta
    // para a página. Escrito como texto, é texto — o que quer que ele seja.
    const bolha = document.createElement("div");
    bolha.className = "ia-mensagem " + classe;
    bolha.appendChild(document.createTextNode(texto));

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

  function acrescentarBolha(papel, texto) {
    const l = lista();
    if (!l) return null;
    // A primeira mensagem verdadeira deita fora o estado vazio — a
    // apresentação e os atalhos —, que é o que está ali quando não há
    // conversa nenhuma. Procura-se pela classe, e não por "o histórico está
    // vazio": nesta altura a pergunta já foi acrescentada ao histórico.
    const vazio = l.querySelector(".ia-boas-vindas");
    if (vazio) vazio.remove();
    const linha = criarLinha(papel, texto);
    l.appendChild(linha);
    l.scrollTop = l.scrollHeight;
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
    silencioso.appendChild(document.createTextNode("A pensar..."));
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
        "Quem o administra tem de criar uma chave no Google AI Studio e " +
        "guardá-la na variável de ambiente GEMINI_API_KEY ou num ficheiro " +
        ".ai_key na raiz do projeto. Enquanto isso, o resto da aplicação " +
        "funciona como sempre.";

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
    const enviar = btnEnviar();
    if (enviar) enviar.disabled = true;
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
    historico.push({ papel: "user", texto: texto });
    acrescentarBolha("user", texto);
    guardarHistorico();

    ocupado = true;
    definirOcupado(true);
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
      guardarHistorico();
      // O foco volta à caixa: quem fez uma pergunta é para fazer a seguinte.
      campo.focus();
    }
  };

  function definirOcupado(estado) {
    const enviar = btnEnviar();
    const campo  = entrada();
    if (enviar) enviar.disabled = estado;
    if (campo)  campo.disabled = estado;
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

      // O primeiro nome, e só ele — ver o textoInicial.
      if (eu && eu.utilizador && eu.utilizador.nome) {
        nomeUtilizador = String(eu.utilizador.nome).trim().split(" ")[0] || null;
      }

      if (estado && estado.disponivel) {
        disponivel = true;
        desenharConversa();
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
