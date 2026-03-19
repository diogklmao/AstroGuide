// Lógica de controlos de UI partilhada entre páginas (`menu.html` e `index.html`).
// Mantém as funções no `window` para funcionar com `onclick="..."` inline.
(function () {
  window.musicaAtiva = false;

  window.toggleConfig = function toggleConfig() {
    const painel = document.getElementById("painel-config");
    if (!painel) return;
    painel.classList.toggle("visivel");
  };

  window.mudarVolume = function mudarVolume(val) {
    const audio = document.getElementById("musica");
    const lbl = document.getElementById("lbl-volume");
    if (!audio) return;
    const volume = Number(val) / 100;
    audio.volume = volume;
    if (lbl) lbl.textContent = `${val}%`;
  };

  window.toggleMusica = async function toggleMusica() {
    const audio = document.getElementById("musica");
    const btn = document.querySelector(".btn-musica");
    if (!audio || !btn) return;

    if (window.musicaAtiva) {
      audio.pause();
      btn.textContent = "▶ Ativar Música";
      window.musicaAtiva = false;
      return;
    }

    try {
      // `play()` pode falhar por políticas de autoplay.
      await audio.play();
      btn.textContent = "⏸ Pausar Música";
      window.musicaAtiva = true;
    } catch (_) {
      // Se falhar, mantemos o botão no estado "desativado".
      btn.textContent = "▶ Ativar Música";
      window.musicaAtiva = false;
    }
  };
})();

