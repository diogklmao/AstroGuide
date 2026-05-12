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

// ── Ícones Canvas dos Cards ───────────────────────────────────────────────────
// Substitui os emojis por símbolos desenhados com a Canvas API
// Cada função desenha o ícone no <canvas> correspondente do menu.html

// Utilitário: desenha uma linha com cor e efeito de brilho (glow)
function tracoGlow(ctx, x1, y1, x2, y2, cor, brilho, espessura) {
    ctx.shadowColor = cor;       // cor do brilho à volta da linha
    ctx.shadowBlur  = brilho;    // intensidade do brilho (em píxeis)
    ctx.strokeStyle = cor;       // cor da própria linha
    ctx.lineWidth   = espessura; // espessura da linha
    ctx.lineCap     = 'round';   // pontas arredondadas
    ctx.lineJoin    = 'round';   // junções arredondadas
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

// ── Ícone: Céu Agora — estrela de 4 pontas ───────────────────────────────────
function desenharIconeCeu() {
    const canvas = document.getElementById('ic-ceu');
    if (!canvas) return;             // sai sem erro se o canvas não existir na página atual
    const c  = canvas.getContext('2d');
    const cx = 18, cy = 18;         // centro do canvas de 36x36
    const COR = '#88bbff';          // azul celeste

    // 4 braços da estrela: vertical, horizontal e 2 diagonais
    const bracos = [
        [cx, cy-13, cx, cy+13],          // cima → baixo
        [cx-13, cy, cx+13, cy],          // esquerda → direita
        [cx-8, cy-8, cx+8, cy+8],        // diagonal ↘
        [cx+8, cy-8, cx-8, cy+8],        // diagonal ↙
    ];
    bracos.forEach(([x1,y1,x2,y2]) => tracoGlow(c, x1, y1, x2, y2, COR, 10, 1.2));

    // núcleo brilhante no cruzamento dos braços
    c.shadowColor = '#ffffff';
    c.shadowBlur  = 14;
    c.fillStyle   = '#ddeeff';
    c.beginPath();
    c.arc(cx, cy, 2.5, 0, Math.PI * 2);
    c.fill();

    // 2 estrelas pequenas de fundo para dar profundidade
    [{x:7, y:8}, {x:27, y:10}].forEach(s => {
        c.shadowColor = COR;
        c.shadowBlur  = 6;
        c.fillStyle   = 'rgba(180,210,255,0.8)';
        c.beginPath();
        c.arc(s.x, s.y, 1, 0, Math.PI * 2);
        c.fill();
    });
}

// ── Ícone: Calendário Lunar — lua crescente ───────────────────────────────────
// Técnica: desenha um círculo cheio e depois apaga uma parte com destination-out
// O que sobra é uma forma de crescente limpa, sem dois arcos soltos
function desenharIconeCalendario() {
    const canvas = document.getElementById('ic-cal');
    if (!canvas) return;
    const c = canvas.getContext('2d');
    const COR = '#ffcc55';    // dourado lunar

    // 1. Círculo cheio da lua com glow
    c.shadowColor = COR;
    c.shadowBlur  = 14;
    c.fillStyle   = COR;
    c.beginPath();
    c.arc(17, 18, 12, 0, Math.PI * 2);
    c.fill();

    // 2. Apaga a zona que representa a sombra da lua (cria o crescente)
    // destination-out: os píxeis desenhados agora apagam o que estava antes
    c.globalCompositeOperation = 'destination-out';
    c.fillStyle = 'rgba(0,0,0,1)';
    c.beginPath();
    c.arc(22, 15, 11, 0, Math.PI * 2);    // círculo deslocado para a direita e cima
    c.fill();

    // 3. Repõe o modo de composição normal
    c.globalCompositeOperation = 'source-over';

    // 4. Estrelinhas ao lado direito do crescente
    [{x:27, y:8}, {x:30, y:18}, {x:27, y:28}].forEach(s => {
        c.shadowColor = COR;
        c.shadowBlur  = 8;
        c.fillStyle   = 'rgba(255,220,100,0.85)';
        c.beginPath();
        c.arc(s.x, s.y, 1.2, 0, Math.PI * 2);
        c.fill();
    });
}

// ── Ícone: Observatório — telescópio horizontal com tripé ─────────────────────
// Deitado para ser imediatamente reconhecível como tubo óptico (não microfone)
// Tripé com 3 pernas = suporte astronómico clássico
function desenharIconeObservatorio() {
    const canvas = document.getElementById('ic-obs');
    if (!canvas) return;
    const c = canvas.getContext('2d');
    const COR = '#aaddff';    // azul claro metálico

    // tubo principal — linha horizontal grossa
    tracoGlow(c, 8, 17, 28, 17, COR, 14, 4);

    // tampa da lente — linha vertical na ponta direita do tubo
    tracoGlow(c, 28, 12, 28, 22, COR, 10, 2.5);

    // ocular — linha curta na ponta esquerda do tubo
    tracoGlow(c, 8, 14, 8, 20, COR, 8, 2);

    // tripé: 3 pernas a partir do centro inferior do tubo
    const bx = 18, by = 17;
    tracoGlow(c, bx, by, bx-8, 32, 'rgba(150,200,255,0.6)', 5, 1.2);  // perna esquerda
    tracoGlow(c, bx, by, bx,   32, 'rgba(150,200,255,0.6)', 5, 1.2);  // perna central
    tracoGlow(c, bx, by, bx+8, 32, 'rgba(150,200,255,0.6)', 5, 1.2);  // perna direita

    // estrela alvo — onde o telescópio está apontado
    c.shadowColor = '#ffffff';
    c.shadowBlur  = 12;
    c.fillStyle   = '#e8f4ff';
    c.beginPath();
    c.arc(5, 6, 2, 0, Math.PI * 2);
    c.fill();

    // cruz de difração na estrela (efeito óptico realista)
    c.shadowBlur  = 6;
    c.strokeStyle = 'rgba(220,240,255,0.7)';
    c.lineWidth   = 0.8;
    [[5,2,5,10],[1,6,9,6]].forEach(([x1,y1,x2,y2]) => {
        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.stroke();
    });
}

// ── Inicialização ─────────────────────────────────────────────────────────────
criarEstrelas();        // gera as estrelas animadas no fundo
detetarLocalizacao();   // tenta obter e mostrar a localização do utilizador

// desenha os ícones canvas nos cards do menu
// o if (!canvas) dentro de cada função protege contra erros em páginas sem esses elementos
desenharIconeCeu();
desenharIconeCalendario();
desenharIconeObservatorio();

document.getElementById("musica").volume = 0.4;    // volume inicial da música ambiente