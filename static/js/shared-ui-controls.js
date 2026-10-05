// Lógica de controlos de UI partilhada entre páginas (o menu, a aplicação, a
// entrada, o perfil e a administração).
// Mantém as funções no window para funcionar com onclick="..." inline.
//
// A música é a única parte que não é de todas: o <audio> só existe no
// index.html e, mesmo lá, só toca no Observatório e no VR — as duas vistas do
// céu, onde uma música ambiente acompanha quem está a olhar. No menu, no céu
// de hoje, no calendário, na imagem do dia e na conta não há música nenhuma, e
// as páginas onde o elemento não existe passam pelo "if (!audio) return" mais
// abaixo sem fazer nada.
(function () {
  // O pedido: se a música deve estar a tocar. É isto que atravessa a
  // navegação, guardado no sessionStorage.
  window.musicaAtiva = false;

  // A permissão: se o ecrã onde se está a deixa tocar. Quem sabe onde a música
  // faz sentido é a página que conhece os ecrãs, e é ela que o diz a cada
  // mudança de ecrã (ver o mudarEcra, no index.js). Começa a "não", para que
  // incluir este ficheiro numa página não chegue para lá haver música.
  let musicaPermitida = false;

  // ── O ecrã onde a música toca ────────────────────────────────────
  // Ao sair para um ecrã sem música ela pausa mas não se desliga: o pedido
  // fica de pé, e é ele que a traz de volta ao regressar ao Observatório ou ao
  // entrar no VR. Sem esta distinção, ir do Observatório ao VR e voltar
  // obrigava a ligá-la outra vez de cada vez.
  window.definirEcraDaMusica = function definirEcraDaMusica(permitida) {
    musicaPermitida = permitida;
    const audio = document.getElementById("musica");
    if (!audio) return;
    if (!permitida) {
      audio.pause();
    } else if (window.musicaAtiva) {
      tocar().catch(function () {});
    }
  };

  // Toca e põe o botão a dizê-lo. Não decide nada: quem a manda tocar já sabe
  // que a música deve estar a tocar, e o que o browser responde é outra
  // conversa — se ele recusar, o clique seguinte volta a tentar (ver o
  // tentarAutoplay). Daí o catch vazio de quem chama.
  function tocar() {
    const audio = document.getElementById("musica");
    const btn   = document.querySelector(".btn-musica");
    if (!audio) return Promise.resolve();
    return audio.play().then(function () {
      window.musicaAtiva = true;
      sessionStorage.setItem("musica_ativa", "true");
      if (btn) btn.textContent = "⏸ Pausar Música";
    });
  }

  // ── Restaurar estado ao carregar a página ────────────────────────
  // Quando o utilizador navega entre páginas, o sessionStorage mantém
  // o estado da música para ela continuar do mesmo sítio.
  document.addEventListener("DOMContentLoaded", function () {
    const audio = document.getElementById("musica");
    if (!audio) return;

    // Lê o estado guardado antes da navegação
    const estaAAtiva = sessionStorage.getItem("musica_ativa") === "true";
    const volumeGuardado = sessionStorage.getItem("musica_volume");

    // Restaura o volume (ou usa 30% por defeito)
    const volume = volumeGuardado !== null ? Number(volumeGuardado) : 0.3;
    audio.volume = volume;

    // Atualiza o slider de volume no painel de configurações
    const slider = document.getElementById("volume");
    const lbl    = document.getElementById("lbl-volume");
    if (slider) slider.value = Math.round(volume * 100);
    if (lbl)    lbl.textContent = `${Math.round(volume * 100)}%`;

    // O pedido da visita anterior fica de pé mesmo que o ecrã onde se aterrou
    // agora não deixe já tocar: é ele que traz a música de volta quando se
    // chegar ao Observatório.
    if (estaAAtiva) {
      window.musicaAtiva = true;
      // Tenta tocar imediatamente — funciona porque a navegação entre páginas
      // conta como interação do utilizador para o browser. Se ele recusar, o
      // primeiro clique trata disso (ver o tentarAutoplay).
      if (musicaPermitida) tocar().catch(function () {});
    }

    // Nos ecrãs sem música isto não faz nada; fica à espera deles.
    document.addEventListener("click", tentarAutoplay);

    // Guarda o estado no sessionStorage antes de sair da página
    window.addEventListener("beforeunload", function () {
      sessionStorage.setItem("musica_ativa", window.musicaAtiva);
      sessionStorage.setItem("musica_volume", audio.volume);
    });
  });

  // ── Autoplay no primeiro clique ──────────────────────────────────
  // O browser só deixa tocar som depois de uma interação, e o primeiro clique
  // é essa interação. O ouvinte fica armado até a música estar mesmo a tocar,
  // e não só até ao primeiro clique: num ecrã sem música (o céu de hoje, o
  // calendário) pode ser preciso clicar primeiro no "🔭 Observatório".
  function tentarAutoplay() {
    const audio = document.getElementById("musica");
    if (!audio) return;

    // Já toca: não há nada a tentar, e o ouvinte já não faz falta.
    if (!audio.paused) {
      document.removeEventListener("click", tentarAutoplay);
      return;
    }

    // Este ecrã não a deixa tocar. Fica à espera do clique que leve a um que
    // deixe.
    if (!musicaPermitida) return;

    tocar().catch(function () {});
  }

  // ── Campo de estrelas do fundo ───────────────────────────────────
  // Vive aqui, e não no menu.js onde nasceu, porque passou a ser usado por
  // três páginas: o menu, a aplicação e a página de entrada. Cada uma tem o
  // seu <div id="stars"> e chama esta função — antes só o menu as criava e a
  // página de entrada teria de manter uma segunda cópia destas linhas.
  window.criarEstrelas = function criarEstrelas() {
    const container = document.getElementById("stars");
    if (!container) return;   // páginas sem campo de estrelas não fazem nada
    // 130 estrelas, e não 180: um céu real tem muito preto entre elas, e
    // encher o ecrã de pontos punha o fundo a competir com o conteúdo.
    for (let i = 0; i < 130; i++) {
      const star = document.createElement("div");    // cria um div por estrela
      // Uma em cada onze é de destaque: um pouco maior, com halo e
      // cintilação mais lenta. É o que dá alturas e baixas ao céu — um campo
      // em que todas as estrelas têm o mesmo brilho parece papel de parede.
      const destaque = i % 11 === 0;
      star.className = destaque ? "star star-destaque" : "star";
      const size = destaque
        ? Math.random() * 1 + 1.6                  // de 1.6px a 2.6px
        : Math.random() * 1.5 + 0.5;               // de 0.5px a 2px
      star.style.cssText = `
          width:${size}px; height:${size}px;
          left:${Math.random() * 100}%; top:${Math.random() * 100}%;
          --dur:${destaque ? Math.random() * 5 + 6 : Math.random() * 4 + 3}s;
          animation-delay:${Math.random() * 4}s;
      `;
      container.appendChild(star);    // adiciona a estrela ao contentor
    }

    // A estrela grande com cruz — a que a referência tem à direita do título.
    // Só no menu, porque é a composição daquela página que a pede num sítio
    // concreto, e uma só: um céu com meia dúzia de cruzes acesas é um céu de
    // festa, e não o que esta aplicação é. Os raios são do CSS (.star-flare).
    if (document.body.className === "page-menu") {
      const cruz = document.createElement("div");
      cruz.className = "star star-flare";
      cruz.style.cssText = "left:76.5%; top:28%; --dur:7s; animation-delay:1.5s;";
      container.appendChild(cruz);
    }
  };

  // ── Painel de configurações ──────────────────────────────────────
  window.toggleConfig = function toggleConfig() {
    const painel = document.getElementById("painel-config");
    if (!painel) return;
    const aberto = painel.classList.toggle("visivel");

    // Anuncia o novo estado a leitores de ecrã — o botão controla o painel.
    const botao = document.getElementById("btn-config");
    if (botao) botao.setAttribute("aria-expanded", aberto ? "true" : "false");
  };

  // ── Controlo de volume ───────────────────────────────────────────
  window.mudarVolume = function mudarVolume(val) {
    const audio = document.getElementById("musica");
    const lbl   = document.getElementById("lbl-volume");
    if (!audio) return;
    const volume = Number(val) / 100;
    audio.volume = volume;
    if (lbl) lbl.textContent = `${val}%`;
    // Guarda o volume imediatamente ao mudar
    sessionStorage.setItem("musica_volume", volume);
  };

  // ── Botão de ligar/pausar música ─────────────────────────────────
  // Só é alcançável no Observatório e no VR: o painel das configurações, que é
  // onde ele vive, não aparece fora desses ecrãs (ver o index.css).
  window.toggleMusica = async function toggleMusica() {
    const audio = document.getElementById("musica");
    const btn   = document.querySelector(".btn-musica");
    if (!audio || !btn) return;

    if (window.musicaAtiva) {
      audio.pause();
      btn.textContent = "▶ Ativar Música";
      window.musicaAtiva = false;
      sessionStorage.setItem("musica_ativa", "false");
      return;
    }

    // O resto é o tocar(), que também guarda o pedido no sessionStorage.
    try {
      await tocar();
    } catch (_) {
      btn.textContent = "▶ Ativar Música";
      window.musicaAtiva = false;
    }
  };
})();