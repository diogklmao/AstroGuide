// ── Estrelas ──────────────────────────────────────────────────────────────────
// Cria estrelas aleatórias no fundo da página (elemento #stars no HTML)
function criarEstrelas() {
    const container = document.getElementById("stars");
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
}

// ── Localização ───────────────────────────────────────────────────────────────
// Tenta detetar a localização real do utilizador para mostrar no label do menu
function detetarLocalizacao() {
    if (navigator.geolocation) {
        // o browser suporta geolocalização — pede permissão ao utilizador
        navigator.geolocation.getCurrentPosition(
            pos => {
                // sucesso — mostra as coordenadas no label
                const lat = pos.coords.latitude.toFixed(2);
                const lon = pos.coords.longitude.toFixed(2);
                document.getElementById("lbl-localizacao").textContent = `📍 ${lat}°N, ${Math.abs(lon)}°W`;
            },
            () => {
                // utilizador recusou a permissão — mostra localização padrão
                document.getElementById("lbl-localizacao").textContent = "📍 Vila Nova de Gaia, Portugal";
            }
        );
    } else {
        // browser não suporta geolocalização — mostra localização padrão
        document.getElementById("lbl-localizacao").textContent = "📍 Vila Nova de Gaia, Portugal";
    }
}

// ── Inicialização ─────────────────────────────────────────────────────────────
criarEstrelas();       // gera as estrelas animadas no fundo
detetarLocalizacao();  // tenta obter e mostrar a localização do utilizador

document.getElementById("musica").volume = 0.4;    // volume inicial da música ambiente