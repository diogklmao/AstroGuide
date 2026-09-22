// Lógica de controlos de UI partilhada entre páginas (menu.html e index.html).
// Mantém as funções no window para funcionar com onclick="..." inline.
(function () {
  window.musicaAtiva = false;

  // ── Restaurar estado ao carregar a página ────────────────────────
  // Quando o utilizador navega entre páginas, o sessionStorage mantém
  // o estado da música para ela continuar do mesmo sítio.
  document.addEventListener("DOMContentLoaded", function () {
    const audio = document.getElementById("musica");
    const btn   = document.querySelector(".btn-musica");
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

    if (estaAAtiva) {
      // Tenta tocar imediatamente — funciona porque a navegação entre
      // páginas conta como interação do utilizador para o browser.
      audio.play()
        .then(function () {
          window.musicaAtiva = true;
          if (btn) btn.textContent = "⏸ Pausar Música";
        })
        .catch(function () {
          // Se o browser bloquear mesmo assim, aguarda o primeiro clique
          window.musicaAtiva = false;
          document.addEventListener("click", tentarAutoplay);
        });
    } else {
      // Música estava parada — aguarda primeiro clique para autoplay
      document.addEventListener("click", tentarAutoplay);
    }

    // Guarda o estado no sessionStorage antes de sair da página
    window.addEventListener("beforeunload", function () {
      sessionStorage.setItem("musica_ativa", window.musicaAtiva);
      sessionStorage.setItem("musica_volume", audio.volume);
    });
  });

  // ── Autoplay no primeiro clique ──────────────────────────────────
  // Ativado quando a música estava parada ou o browser bloqueou o play.
  function tentarAutoplay() {
    const audio = document.getElementById("musica");
    const btn   = document.querySelector(".btn-musica");
    if (!audio || window.musicaAtiva) return;

    audio.play()
      .then(function () {
        window.musicaAtiva = true;
        if (btn) btn.textContent = "⏸ Pausar Música";
        sessionStorage.setItem("musica_ativa", "true");
      })
      .catch(function () {
        window.musicaAtiva = false;
      });

    // Remove o listener — só precisamos do primeiro clique
    document.removeEventListener("click", tentarAutoplay);
  }

  // ── Campo de estrelas do fundo ───────────────────────────────────
  // Vive aqui, e não no menu.js onde nasceu, porque passou a ser usado por
  // três páginas: o menu, a aplicação e a página de entrada. Cada uma tem o
  // seu <div id="stars"> e chama esta função — antes só o menu as criava e a
  // página de entrada teria de manter uma segunda cópia destas linhas.
  window.criarEstrelas = function criarEstrelas() {
    const container = document.getElementById("stars");
    if (!container) return;   // páginas sem campo de estrelas não fazem nada
    for (let i = 0; i < 180; i++) {
      const star = document.createElement("div");    // cria um div por estrela
      star.className = "star";                       // aplica o estilo .star do CSS
      const size = Math.random() * 2.5 + 0.5;       // tamanho aleatório entre 0.5px e 3px
      star.style.cssText = `
          width:${size}px; height:${size}px;
          left:${Math.random() * 100}%; top:${Math.random() * 100}%;
          --dur:${Math.random() * 4 + 2}s;
          animation-delay:${Math.random() * 4}s;
      `;
      container.appendChild(star);    // adiciona a estrela ao contentor
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

    try {
      await audio.play();
      btn.textContent = "⏸ Pausar Música";
      window.musicaAtiva = true;
      sessionStorage.setItem("musica_ativa", "true");
    } catch (_) {
      btn.textContent = "▶ Ativar Música";
      window.musicaAtiva = false;
    }
  };
})();