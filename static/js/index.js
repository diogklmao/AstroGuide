// ── Variáveis globais ─────────────────────────────────────────────
let calAno = new Date().getFullYear();
let calMes = new Date().getMonth() + 1;

const MESES_PT = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DIAS_PT = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];



// ── Estrelas ──────────────────────────────────────────────────────
function criarEstrelas() {
    const container = document.getElementById("stars");
    if (!container) return;
    const threeAtivo = document.getElementById("three-bg") &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (threeAtivo) {
        container.classList.add("stars--hidden");
        return;
    }
    for (let i = 0; i < 150; i++) {
        const star = document.createElement("div");
        star.className = "star";
        const size = Math.random() * 2.5 + 0.5;
        star.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;--dur:${Math.random() * 4 + 2}s;animation-delay:${Math.random() * 4}s;`;
        container.appendChild(star);
    }
}

// ── Relógio ───────────────────────────────────────────────────────
function atualizarRelogio() {
    const agora = new Date();
    document.getElementById("relogio").textContent = "🕐 " + agora.toLocaleDateString("pt-PT") + "  " + agora.toLocaleTimeString("pt-PT");
}

// ── Navegação: SPA (Single Page Application) ──────────────────────────────────
function mudarEcra(nome) {
    // Remove a classe "ativo" de todos os ecrãs e botões
    document.querySelectorAll(".ecra").forEach(e => e.classList.remove("ativo"));
    document.querySelectorAll("nav button").forEach(b => b.classList.remove("ativo"));

    // Ativa o ecrã e o botão pedido
    document.getElementById("ecra-" + nome).classList.add("ativo");
    const btn = document.getElementById("btn-" + nome);
    if (btn) btn.classList.add("ativo");

    // Gerir modo ecrã inteiro para o observatório
    if (nome === "observatorio") {
        document.body.classList.add("observatorio-ativo");
        setTimeout(redimensionarCanvas, 50);
    } else {
        document.body.classList.remove("observatorio-ativo");
    }

    // Carrega os dados do ecrã que ficou ativo
    if (nome === "calendario") carregarCalendario();
    if (nome === "ceu") carregarCeu();
    if (nome === "observatorio") carregarObservatorio();
}

// ── Céu Agora ─────────────────────────────────────────────────────
async function carregarCeu() {
    try {
        const res = await fetch("/api/ceu");
        const data = await res.json();
        document.getElementById("localizacao").textContent = "📍 " + data.location;
        document.getElementById("ceu-conteudo").innerHTML = `
            <div class="card glass-panel">
                <div class="card-titulo" style="color:#ff8f00">☀ Sol</div>
                <div class="dados-grelha">
                    ${dadoHTML("Altitude", data.sol.altitude + "°")}
                    ${dadoHTML("Azimute", data.sol.azimute + "°")}
                    ${dadoHTML("Distância", data.sol.distancia)}
                    ${dadoVisivel(data.sol.visivel)}
                </div>
            </div>
            <div class="card glass-panel">
                <div class="card-titulo" style="color:#b0bec5">🌙 Lua</div>
                <div class="dados-grelha">
                    ${dadoHTML("Altitude", data.lua.altitude + "°")}
                    ${dadoHTML("Azimute", data.lua.azimute + "°")}
                    ${dadoHTML("Distância", data.lua.distancia)}
                    ${dadoVisivel(data.lua.visivel)}
                </div>
            </div>
            <div class="card glass-panel">
                <div class="card-titulo" style="color:#ffcc02">🪐 Planetas</div>
                <div class="planetas-grelha">${data.planetas.map(planetaHTML).join("")}</div>
            </div>`;
    } catch (err) {
        document.getElementById("ceu-conteudo").innerHTML = '<div class="loading">❌ Erro ao carregar dados</div>';
    }
}

function dadoHTML(label, valor) {
    return `<div class="dado"><span class="dado-label">${label}</span><span class="dado-valor">${valor}</span></div>`;
}

function dadoVisivel(visivel) {
    return `<div class="dado"><span class="dado-label">Visível</span><span class="dado-valor ${visivel ? "visivel-sim" : "visivel-nao"}">${visivel ? "Sim ✓" : "Não"}</span></div>`;
}

function planetaHTML(p) {
    return `<div class="planeta-card ${p.visivel ? "" : "invisivel"}"><div class="planeta-nome">${p.nome}</div><div class="planeta-info">Alt: ${p.altitude}°<br>Az: ${p.azimute}°<br>${p.visivel ? "✓ Visível" : "× Não visível"}</div></div>`;
}

// ── Calendário Lunar: Geração Dinâmica ────────────────────────────────────────
async function carregarCalendario() {
    document.getElementById("cal-titulo").textContent = MESES_PT[calMes] + "  " + calAno;
    document.getElementById("cal-grelha").innerHTML = '<div class="loading" style="grid-column:span 7"><span class="spinner"></span>A calcular fases da lua...</div>';
    document.getElementById("detalhe-dia").innerHTML = "";
    document.getElementById("detalhe-dia").classList.remove("visivel");

    try {
        const res = await fetch(`/api/calendario/${calAno}/${calMes}`);
        const data = await res.json();

        const fasesPorDia = {};
        const eventosPorDia = {};
        data.fases.forEach(f => fasesPorDia[f.dia] = f);
        data.eventos.forEach(e => eventosPorDia[e.dia] = true);

        const hoje = new Date();
        const hojeAno = hoje.getFullYear();
        const hojesMes = hoje.getMonth() + 1;
        const hojesDia = hoje.getDate();
        const primeiroDia = new Date(calAno, calMes - 1, 1).getDay();
        const offset = (primeiroDia === 0) ? 6 : primeiroDia - 1;
        const totalDias = new Date(calAno, calMes, 0).getDate();

        let html = "";
        for (let i = 0; i < offset; i++) html += '<div class="cal-dia cal-vazio"></div>';

        for (let dia = 1; dia <= totalDias; dia++) {
            const eHoje = (dia === hojesDia && calMes === hojesMes && calAno === hojeAno);
            const temEv = eventosPorDia[dia] || false;
            const fase = fasesPorDia[dia];
            let classes = "cal-dia";
            if (eHoje) classes += " hoje";
            if (temEv) classes += " tem-evento";
            html += `<div class="${classes}" onclick="verDia(${dia}, this)">
                <span class="cal-dia-num">${dia}</span>
                ${fase ? `<span class="cal-dia-emoji">${fase.emoji}</span>` : ""}
                ${temEv ? `<span class="cal-dia-ponto">⚡</span>` : ""}
            </div>`;
        }
        document.getElementById("cal-grelha").innerHTML = html;
        document.querySelectorAll(".cal-dia:not(.cal-vazio)").forEach((el, i) => {
            el.style.animationDelay = `${Math.min(i * 0.012, 0.35)}s`;
        });
    } catch (err) {
        document.getElementById("cal-grelha").innerHTML = '<div class="loading" style="grid-column:span 7">❌ Erro ao carregar</div>';
    }
}

async function verDia(dia, celula) {
    document.querySelectorAll(".cal-dia.selecionado").forEach(d => d.classList.remove("selecionado"));
    if (celula) celula.classList.add("selecionado");

    const painel = document.getElementById("detalhe-dia");
    painel.innerHTML = '<div class="loading"><span class="spinner"></span>A carregar...</div>';
    painel.classList.add("visivel");

    const res = await fetch(`/api/dia/${calAno}/${calMes}/${dia}`);
    const data = await res.json();

    const dataObj = new Date(calAno, calMes - 1, dia);
    const nomeDia = DIAS_PT[dataObj.getDay() === 0 ? 6 : dataObj.getDay() - 1];
    const corFase = data.fase.nome === "Lua Cheia" ? "#ffcc02" : "#ce93d8";

    let eventosHTML = data.eventos.length > 0
        ? data.eventos.map(ev => `
            <div class="evento-card glass-panel">
                <div class="evento-topo">
                    <span class="evento-badge">⚡ EVENTO</span>
                    <span class="evento-nome">${ev.emoji} ${ev.nome}</span>
                </div>
                <div class="evento-desc">${ev.descricao}</div>
                <div class="evento-horario">🕐 ${ev.hora_ini} – ${ev.hora_fim} | Pico: ${ev.hora_pico}</div>
            </div>`).join("")
        : '<p style="color:#334455;font-size:0.85rem;margin-top:12px">Sem eventos astronómicos neste dia.</p>';

    painel.innerHTML = `
        <div class="detalhe-titulo">📅 ${nomeDia}, ${dia} de ${MESES_PT[calMes]} de ${calAno}</div>
        <div class="detalhe-linha"><span class="detalhe-icon">🌅</span><span class="detalhe-label">Nascer do Sol</span><span class="detalhe-valor" style="color:#ffcc80">${data.sol.nascer}</span></div>
        <div class="detalhe-linha"><span class="detalhe-icon">🌇</span><span class="detalhe-label">Pôr do Sol</span><span class="detalhe-valor" style="color:#ff8a65">${data.sol.por}</span></div>
        <div class="detalhe-linha"><span class="detalhe-icon">${data.fase.emoji}</span><span class="detalhe-label">Fase da Lua</span><span class="detalhe-valor" style="color:${corFase}">${data.fase.nome} (${data.fase.iluminacao}%)</span></div>
        ${eventosHTML}`;
}

function mesAnterior() {
    if (calMes === 1) { calMes = 12; calAno--; } else calMes--;
    carregarCalendario();
}

function mesSeguinte() {
    if (calMes === 12) { calMes = 1; calAno++; } else calMes++;
    carregarCalendario();
}

// ── Observatório Astronómico: Canvas Interativo ──────────────────────────────────
let observatorioDados = null;
let objetoSelecionado = null;

// ── Variáveis da Câmara 360° ──────────────────────────────────────
let cameraAzimuth = 0;   // 0° = Norte, 90° = Este, 180° = Sul, 270° = Oeste
let cameraAltitude = 15;  // Altitude em graus (-85° a 85°)
let cameraFOV = 80;       // Campo de visão horizontal em graus

// Estado de Arrastamento para a Câmara 360°
let isDragging = false;
let startX = 0;
let startY = 0;
let startAzimuth = 0;
let startAltitude = 0;
let draggedActive = false; // true se arrastou mais de 4px (para distinguir de clique)

// Redimensionamento dinâmico do canvas para ecrã inteiro
function redimensionarCanvas() {
    const canvas = document.getElementById("observatorio-canvas");
    if (!canvas) return;
    
    if (document.body.classList.contains("observatorio-ativo")) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    } else {
        canvas.width = 800;
        canvas.height = 800;
    }
    desenharObservatorio();
}

// Alternar visibilidade do painel de controlo no observatório
function togglePainelLateral() {
    const painel = document.querySelector(".observatorio-painel-lateral");
    if (painel) {
        painel.classList.toggle("recolhido");
    }
}

// Ouvinte de redimensionamento da janela
window.addEventListener("resize", () => {
    if (document.body.classList.contains("observatorio-ativo")) {
        redimensionarCanvas();
    }
});

function alterarModoVisao() {
    const modoSelect = document.getElementById("sel-modo-visao");
    if (!modoSelect) return;
    
    const modo = modoSelect.value;
    const canvas = document.getElementById("observatorio-canvas");
    if (!canvas) return;
    
    if (modo === "360") {
        canvas.classList.add("drag-mode");
    } else {
        canvas.classList.remove("drag-mode", "dragging");
        // Reset da câmara ao voltar ao modo 2D
        cameraAzimuth = 0;
        cameraAltitude = 15;
    }
}

async function carregarObservatorio() {
    const canvas = document.getElementById("observatorio-canvas");
    if (!canvas) return;
    
    // Configurar interatividade de clique e arrasto no canvas caso ainda não tenha sido configurada
    if (!canvas.dataset.eventsConfigured) {
        canvas.addEventListener("click", tratarCliqueCanvas);
        
        // Eventos de Rato para Arrastamento
        canvas.addEventListener("mousedown", iniciarArrasto);
        window.addEventListener("mousemove", moverArrasto);
        window.addEventListener("mouseup", terminarArrasto);
        
        // Eventos de Toque (Mobile)
        canvas.addEventListener("touchstart", iniciarArrastoToque, { passive: false });
        window.addEventListener("touchmove", moverArrastoToque, { passive: false });
        window.addEventListener("touchend", terminarArrastoToque);
        
        // Zoom via Roda do Rato
        canvas.addEventListener("wheel", tratarScrollZoom, { passive: false });
        
        canvas.dataset.eventsConfigured = "true";
    }
    
    try {
        const res = await fetch("/api/observatorio");
        const data = await res.json();
        observatorioDados = data;
        
        // Atualiza a localização no cabeçalho
        document.getElementById("localizacao").textContent = "📍 Vila Nova de Gaia";
        
        alterarModoVisao();
        redimensionarCanvas();
    } catch (err) {
        console.error("Erro ao carregar observatório:", err);
    }
}

// ── Controlos de Arrastar e Zoom ──────────────────────────────────
function iniciarArrasto(e) {
    const modoSelect = document.getElementById("sel-modo-visao");
    if (!modoSelect || modoSelect.value !== "360") return;
    
    isDragging = true;
    draggedActive = false;
    startX = e.clientX;
    startY = e.clientY;
    startAzimuth = cameraAzimuth;
    startAltitude = cameraAltitude;
    
    const canvas = document.getElementById("observatorio-canvas");
    if (canvas) canvas.classList.add("dragging");
}

function moverArrasto(e) {
    if (!isDragging) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    if (Math.sqrt(dx*dx + dy*dy) > 4) {
        draggedActive = true;
    }
    
    const canvas = document.getElementById("observatorio-canvas");
    if (!canvas) return;
    
    // Sensibilidade baseada no FOV atual
    const sensibilidade = cameraFOV / canvas.width;
    
    // Arrastar para a direita (dx > 0) -> câmara roda para a esquerda (azimute diminui)
    cameraAzimuth = (startAzimuth - dx * sensibilidade + 360) % 360;
    
    // Arrastar para baixo (dy > 0) -> câmara inclina para cima (altitude aumenta)
    cameraAltitude = Math.max(-85, Math.min(85, startAltitude + dy * sensibilidade));
    
    desenharObservatorio();
}

function terminarArrasto(e) {
    if (!isDragging) return;
    isDragging = false;
    
    const canvas = document.getElementById("observatorio-canvas");
    if (canvas) canvas.classList.remove("dragging");
}

// Suporte Mobile para Toque
let touchStartDist = 0;
function iniciarArrastoToque(e) {
    const modoSelect = document.getElementById("sel-modo-visao");
    if (!modoSelect || modoSelect.value !== "360") return;
    
    if (e.touches.length === 1) {
        isDragging = true;
        draggedActive = false;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startAzimuth = cameraAzimuth;
        startAltitude = cameraAltitude;
        
        const canvas = document.getElementById("observatorio-canvas");
        if (canvas) canvas.classList.add("dragging");
        e.preventDefault();
    } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
    }
}

function moverArrastoToque(e) {
    if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        
        if (Math.sqrt(dx*dx + dy*dy) > 4) {
            draggedActive = true;
        }
        
        const canvas = document.getElementById("observatorio-canvas");
        if (!canvas) return;
        
        const sensibilidade = cameraFOV / canvas.width;
        cameraAzimuth = (startAzimuth - dx * sensibilidade + 360) % 360;
        cameraAltitude = Math.max(-85, Math.min(85, startAltitude + dy * sensibilidade));
        
        desenharObservatorio();
        e.preventDefault();
    } else if (e.touches.length === 2) {
        const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        if (touchStartDist > 0) {
            const ratio = touchStartDist / dist;
            cameraFOV = Math.max(30, Math.min(110, cameraFOV * ratio));
            touchStartDist = dist;
            desenharObservatorio();
        }
        e.preventDefault();
    }
}

function terminarArrastoToque(e) {
    isDragging = false;
    touchStartDist = 0;
    const canvas = document.getElementById("observatorio-canvas");
    if (canvas) canvas.classList.remove("dragging");
}

function tratarScrollZoom(e) {
    const modoSelect = document.getElementById("sel-modo-visao");
    if (!modoSelect || modoSelect.value !== "360") return;
    
    e.preventDefault();
    
    const factor = e.deltaY > 0 ? 1.05 : 0.95;
    cameraFOV = Math.max(35, Math.min(110, cameraFOV * factor));
    
    desenharObservatorio();
}

// ── Renderização do Observatório ──────────────────────────────────
function desenharObservatorio() {
    const canvas = document.getElementById("observatorio-canvas");
    if (!canvas || !observatorioDados) return;
    
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const centroX = width / 2;
    const centroY = height / 2;
    const raioMax = Math.min(width, height) / 2 - 40;
    
    const modoSelect = document.getElementById("sel-modo-visao");
    const modoVisao = modoSelect ? modoSelect.value : "360";
    
    // Limpar canvas
    ctx.clearRect(0, 0, width, height);
    
    // Função de Projeção Dinâmica
    function projectar(alt, az) {
        if (modoVisao === "360") {
            // ── Projeção Perspetiva 3D (Vista de Primeira Pessoa) ──
            const altRad = alt * Math.PI / 180;
            const azRad = az * Math.PI / 180;
            const camAltRad = cameraAltitude * Math.PI / 180;
            const camAzRad = cameraAzimuth * Math.PI / 180;
            
            // Coordenadas cartesianas no espaço 3D (esfera unitária)
            const x = Math.cos(altRad) * Math.cos(azRad);
            const y = Math.cos(altRad) * Math.sin(azRad);
            const z = Math.sin(altRad);
            
            // Rotação em torno do eixo Z (Yaw - Azimute da Câmara)
            const x1 = x * Math.cos(camAzRad) + y * Math.sin(camAzRad);
            const y1 = -x * Math.sin(camAzRad) + y * Math.cos(camAzRad);
            
            // Rotação em torno do eixo Y local (Pitch - Altitude da Câmara)
            const x2 = x1 * Math.cos(camAltRad) + z * Math.sin(camAltRad);
            const z2 = -x1 * Math.sin(camAltRad) + z * Math.cos(camAltRad);
            
            // Se o objeto estiver atrás da câmara, não renderizar
            if (x2 <= 0.05) return null;
            
            // Distância focal a partir do FOV horizontal
            const fovRad = cameraFOV * Math.PI / 180;
            const f = width / (2 * Math.tan(fovRad / 2));
            
            // Coordenadas no plano do ecrã
            const px = centroX + f * (y1 / x2);
            const py = centroY - f * (z2 / x2);
            
            return { x: px, y: py };
        } else {
            // ── Projeção Zenital 2D (Planisfério Clássico) ──
            const r = raioMax * (90 - alt) / 90;
            const azRad = az * Math.PI / 180;
            const x = centroX - r * Math.sin(azRad);
            const y = centroY - r * Math.cos(azRad);
            return { x, y };
        }
    }
    
    // 1. Desenhar fundos e grelhas específicas do modo
    if (modoVisao === "360") {

        // ── Fundo: Gradiente de céu noturno ──────────────────────────
        const gradSky = ctx.createLinearGradient(0, 0, 0, height);
        gradSky.addColorStop(0,   "#01020a");
        gradSky.addColorStop(0.5, "#04081a");
        gradSky.addColorStop(1,   "#08122a");
        ctx.fillStyle = gradSky;
        ctx.fillRect(0, 0, width, height);

        // Calcular linha do horizonte
        let horizonPoints = [];
        const step = 2;
        for (let azOffset = -cameraFOV; azOffset <= cameraFOV; azOffset += step) {
            const az = (cameraAzimuth + azOffset + 360) % 360;
            const pos = projectar(0, az);
            if (pos) horizonPoints.push(pos);
        }

        if (horizonPoints.length > 0) {
            const horizY = horizonPoints[Math.floor(horizonPoints.length / 2)].y;

            // ── Solo: preencher com gradiente verde noturno ───────────
            ctx.beginPath();
            ctx.moveTo(horizonPoints[0].x, horizonPoints[0].y);
            for (let i = 1; i < horizonPoints.length; i++) {
                ctx.lineTo(horizonPoints[i].x, horizonPoints[i].y);
            }
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();

            const gradGround = ctx.createLinearGradient(0, horizY, 0, height);
            gradGround.addColorStop(0,    "rgba(10, 48, 14, 0.97)");
            gradGround.addColorStop(0.3,  "rgba(14, 60, 18, 0.98)");
            gradGround.addColorStop(0.65, "rgba( 8, 38, 10, 0.99)");
            gradGround.addColorStop(1,    "rgba( 3, 18,  5, 1.00)");
            ctx.fillStyle = gradGround;
            ctx.fill();

            // ── Relva realista: lâminas com bezier curves ────────────
            // Usar semente determinística baseada na azimute para estabilidade
            const seed = Math.floor(cameraAzimuth * 10);
            // Simple seeded pseudo-random
            function rng(n) {
                const x = Math.sin(n + seed * 0.731) * 43758.5453;
                return x - Math.floor(x);
            }

            ctx.save();
            // Clipar às linhas do horizonte para não sair acima
            ctx.beginPath();
            ctx.moveTo(horizonPoints[0].x, horizonPoints[0].y);
            for (let i = 1; i < horizonPoints.length; i++) ctx.lineTo(horizonPoints[i].x, horizonPoints[i].y);
            ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath();
            ctx.clip();

            // Camada 1: relva de fundo (curta, densa, escura)
            const numBladesBack = Math.ceil(width / 4);
            for (let i = 0; i < numBladesBack; i++) {
                const bx     = rng(i * 7 + 1) * width;
                const bh     = 8  + rng(i * 7 + 2) * 18;
                const lean   = (rng(i * 7 + 3) - 0.5) * 14;
                const g      = Math.floor(55 + rng(i * 7 + 4) * 35);
                const baseY  = horizY + rng(i * 7 + 5) * 12;

                ctx.beginPath();
                ctx.moveTo(bx, baseY);
                ctx.quadraticCurveTo(bx + lean * 0.6, baseY - bh * 0.55,
                                     bx + lean,         baseY - bh);
                ctx.strokeStyle = `rgba(0, ${g}, 8, 0.55)`;
                ctx.lineWidth   = 0.9 + rng(i * 7 + 6) * 0.6;
                ctx.stroke();
            }

            // Camada 2: relva de frente (alta, esparsa, mais clara)
            const numBladesFront = Math.ceil(width / 7);
            for (let i = 0; i < numBladesFront; i++) {
                const bx    = rng(i * 13 + 10) * width;
                const bh    = 20 + rng(i * 13 + 11) * 38;
                const lean  = (rng(i * 13 + 12) - 0.5) * 22;
                const g     = Math.floor(80 + rng(i * 13 + 13) * 55);
                const baseY = horizY + 2 + rng(i * 13 + 14) * 8;
                const w     = 1.0 + rng(i * 13 + 15) * 1.2;

                // Bezier com ponta ligeiramente curvada
                const cpx = bx + lean * 0.5;
                const cpy = baseY - bh * 0.6;
                const tipx = bx + lean;
                const tipy = baseY - bh;

                ctx.beginPath();
                ctx.moveTo(bx, baseY);
                ctx.quadraticCurveTo(cpx, cpy, tipx, tipy);
                ctx.strokeStyle = `rgba(20, ${g}, 15, 0.75)`;
                ctx.lineWidth   = w;
                ctx.stroke();
            }

            // Camada 3: algumas hastes de erva altíssimas com semente de flor
            const numTall = Math.ceil(width / 28);
            for (let i = 0; i < numTall; i++) {
                const bx   = rng(i * 23 + 50) * width;
                const bh   = 45 + rng(i * 23 + 51) * 55;
                const lean = (rng(i * 23 + 52) - 0.5) * 28;
                const g    = Math.floor(90 + rng(i * 23 + 53) * 60);
                const baseY= horizY + rng(i * 23 + 54) * 6;

                ctx.beginPath();
                ctx.moveTo(bx, baseY);
                ctx.bezierCurveTo(
                    bx + lean * 0.3, baseY - bh * 0.4,
                    bx + lean * 0.7, baseY - bh * 0.75,
                    bx + lean,       baseY - bh
                );
                ctx.strokeStyle = `rgba(30, ${g}, 20, 0.55)`;
                ctx.lineWidth   = 0.8 + rng(i * 23 + 55) * 0.7;
            }


            ctx.restore();

            // Névoa suave no horizonte
            const gradFog = ctx.createLinearGradient(0, horizY - 20, 0, horizY + 35);
            gradFog.addColorStop(0,   "rgba(15, 55, 30, 0.0)");
            gradFog.addColorStop(0.45,"rgba(18, 65, 32, 0.22)");
            gradFog.addColorStop(1,   "rgba( 8, 35, 15, 0.0)");
            ctx.fillStyle = gradFog;
            ctx.fillRect(0, horizY - 20, width, 55);

            // Linha do horizonte
            ctx.beginPath();
            ctx.moveTo(horizonPoints[0].x, horizonPoints[0].y);
            for (let i = 1; i < horizonPoints.length; i++) ctx.lineTo(horizonPoints[i].x, horizonPoints[i].y);
            ctx.strokeStyle = "rgba(70, 190, 100, 0.28)";
            ctx.lineWidth   = 1.5;
            ctx.stroke();
            ctx.strokeStyle = "rgba(50, 160, 80, 0.07)";
            ctx.lineWidth   = 10;
            ctx.stroke();
        }

        // Pontos Cardeais na linha do horizonte
        const cardeais = [
            { label: "N", az: 0 },
            { label: "NE", az: 45 },
            { label: "E", az: 90 },
            { label: "SE", az: 135 },
            { label: "S", az: 180 },
            { label: "SO", az: 225 },
            { label: "W", az: 270 },
            { label: "NO", az: 315 }
        ];

        ctx.fillStyle = "#ffcc02";
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        cardeais.forEach(c => {
            const pos = projectar(1.2, c.az);
            if (pos) {
                ctx.shadowColor = "black";
                ctx.shadowBlur = 3;
                ctx.fillText(c.label, pos.x, pos.y);
                ctx.shadowColor = "transparent";
                ctx.shadowBlur = 0;
            }
        });
        
    } else {
        // Círculo exterior do horizonte 2D
        ctx.beginPath();
        ctx.arc(centroX, centroY, raioMax, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(110, 184, 255, 0.25)";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        const gradSky = ctx.createRadialGradient(centroX, centroY, 0, centroX, centroY, raioMax);
        gradSky.addColorStop(0, "rgba(7, 13, 26, 0.45)");
        gradSky.addColorStop(0.7, "rgba(4, 8, 16, 0.8)");
        gradSky.addColorStop(1, "rgba(1, 4, 8, 0.95)");
        ctx.fillStyle = gradSky;
        ctx.fill();
        
        // Linhas de grelha altitude (30° e 60°)
        ctx.strokeStyle = "rgba(110, 184, 255, 0.08)";
        ctx.lineWidth = 1;
        [30, 60].forEach(alt => {
            const r = raioMax * (90 - alt) / 90;
            ctx.beginPath();
            ctx.arc(centroX, centroY, r, 0, 2 * Math.PI);
            ctx.stroke();
            
            ctx.fillStyle = "rgba(110, 184, 255, 0.3)";
            ctx.font = "9px monospace";
            ctx.textAlign = "center";
            ctx.fillText(alt + "°", centroX, centroY - r - 3);
        });
        
        // Linhas de azimute (Cruz N-S, E-W)
        ctx.beginPath();
        ctx.moveTo(centroX, centroY - raioMax);
        ctx.lineTo(centroX, centroY + raioMax);
        ctx.moveTo(centroX - raioMax, centroY);
        ctx.lineTo(centroX + raioMax, centroY);
        ctx.stroke();
        
        // Letras Cardeais no limite do círculo
        ctx.fillStyle = "#6eb8ff";
        ctx.font = "bold 14px 'Cormorant Garamond', serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("N", centroX, centroY - raioMax - 18);
        ctx.fillText("S", centroX, centroY + raioMax + 18);
        ctx.fillText("E", centroX - raioMax - 18, centroY);
        ctx.fillText("W", centroX + raioMax + 18, centroY);
    }
    
    const showConstelacoes = document.getElementById("chk-constelacoes").checked;
    const showNomesEstrelas = document.getElementById("chk-nomes-estrelas").checked;
    const showNomesConstelacoes = document.getElementById("chk-nomes-constelacoes").checked;
    const showAstros = document.getElementById("chk-astros").checked;
    const magLimite = parseFloat(document.getElementById("rng-mag").value);
    
    const elementosNoEcra = [];
    
    // 2. Desenhar as linhas das constelações (se ativo)
    if (showConstelacoes) {
        ctx.strokeStyle = "rgba(110, 184, 255, 0.45)"; // Mais brilhante
        ctx.lineWidth = 1.5;
        
        const constelacoes = observatorioDados.constelacoes;
        const estrelas = observatorioDados.estrelas;
        
        for (const const_id in constelacoes) {
            const constelacao = constelacoes[const_id];
            constelacao.linhas.forEach(linha => {
                const estA = estrelas[linha[0]];
                const estB = estrelas[linha[1]];
                
                if (estA && estB && (estA.visivel || estB.visivel)) {
                    const posA = projectar(estA.altitude, estA.azimute);
                    const posB = projectar(estB.altitude, estB.azimute);
                    
                    if (posA && posB) {
                        ctx.beginPath();
                        ctx.moveTo(posA.x, posA.y);
                        ctx.lineTo(posB.x, posB.y);
                        ctx.stroke();
                    }
                }
            });
            
            // Nomes das constelações
            if (showNomesConstelacoes) {
                let sumX = 0, sumY = 0, count = 0;
                constelacao.linhas.forEach(linha => {
                    const estA = estrelas[linha[0]];
                    if (estA && estA.visivel) {
                        const pos = projectar(estA.altitude, estA.azimute);
                        if (pos) {
                            sumX += pos.x;
                            sumY += pos.y;
                            count++;
                        }
                    }
                });
                if (count > 0) {
                    ctx.fillStyle = "rgba(110, 184, 255, 0.35)";
                    ctx.font = "italic 9.5px sans-serif";
                    ctx.textAlign = "center";
                    ctx.fillText(constelacao.nome, sumX / count, sumY / count);
                }
            }
        }
    }
    
    // 3. Desenhar as Estrelas
    const estrelas = observatorioDados.estrelas;
    for (const est_id in estrelas) {
        const est = estrelas[est_id];
        if (!est.visivel) continue; 
        if (est.mag > magLimite) continue; 
        
        const pos = projectar(est.altitude, est.azimute);
        if (!pos) continue; // ignora se estiver fora da perspetiva 3D
        
        // Tamanho da estrela com base na magnitude
        const maxStarSize = 4.5;
        const minStarSize = 1.0;
        let starSize = maxStarSize - ((est.mag - (-1.5)) / (5.0 - (-1.5))) * (maxStarSize - minStarSize);
        starSize = Math.max(minStarSize, Math.min(maxStarSize, starSize));
        
        // Halo de brilho para as estrelas principais
        if (est.mag < 1.8) {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, starSize * 2.5, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
            ctx.fill();
        }
        
        // Ponto da Estrela
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, starSize, 0, 2 * Math.PI);
        ctx.fillStyle = est.mag < 1.5 ? "#ffffff" : "rgba(220, 235, 255, 0.95)";
        ctx.fill();
        
        // Polaris destaca-se com uma pequena mira
        if (est_id === "polaris") {
            ctx.strokeStyle = "rgba(110, 184, 255, 0.35)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pos.x - 7, pos.y); ctx.lineTo(pos.x + 7, pos.y);
            ctx.moveTo(pos.x, pos.y - 7); ctx.lineTo(pos.x, pos.y + 7);
            ctx.stroke();
        }
        
        // Nomes das estrelas
        if (showNomesEstrelas) {
            ctx.fillStyle = "rgba(200, 220, 255, 0.65)";
            ctx.font = "9px sans-serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(" " + est.nome, pos.x + starSize + 2, pos.y);
        }
        
        // Registar elemento para cliques
        elementosNoEcra.push({
            id: est_id,
            nome: est.nome,
            x: pos.x,
            y: pos.y,
            raio: Math.max(8, starSize * 2.5),
            tipo: "estrela",
            mag: est.mag.toFixed(2),
            altitude: est.altitude,
            azimute: est.azimute
        });
    }
    
    // 4. Desenhar Sol, Lua e Planetas
    if (showAstros) {
        const astros = observatorioDados.astros;
        astros.forEach(astro => {
            if (!astro.visivel) return;
            
            const pos = projectar(astro.altitude, astro.azimute);
            if (!pos) return; // ignora se estiver fora do FOV 3D
            
            const size = 6.5;
            let corHalo = "rgba(255, 255, 255, 0.15)";
            let corAstro = "#ffffff";
            
            if (astro.tipo === "sol") {
                corHalo = "rgba(255, 143, 0, 0.25)";
                corAstro = "#ff8f00";
            } else if (astro.tipo === "lua") {
                corHalo = "rgba(176, 190, 197, 0.2)";
                corAstro = "#cfd8dc";
            } else if (astro.tipo === "planeta") {
                if (astro.nome === "Marte") {
                    corHalo = "rgba(239, 83, 80, 0.25)";
                    corAstro = "#ef5350";
                } else if (astro.nome === "Saturno" || astro.nome === "Júpiter") {
                    corHalo = "rgba(255, 204, 2, 0.2)";
                    corAstro = "#ffe082";
                } else {
                    corHalo = "rgba(110, 184, 255, 0.2)";
                    corAstro = "#4fc3f7";
                }
            }
            
            // Halo
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size * 2.2, 0, 2 * Math.PI);
            ctx.fillStyle = corHalo;
            ctx.fill();
            
            // Astro
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size, 0, 2 * Math.PI);
            ctx.fillStyle = corAstro;
            ctx.fill();
            
            // Rótulo de Nome do Astro
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 9px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillText(astro.nome, pos.x, pos.y - size - 4);
            
            // Fase da Lua em Emoji
            if (astro.tipo === "lua" && astro.emoji) {
                ctx.font = "11px sans-serif";
                ctx.textAlign = "left";
                ctx.textBaseline = "middle";
                ctx.fillText(astro.emoji, pos.x + size + 3, pos.y);
            }
            
            elementosNoEcra.push({
                id: astro.id,
                nome: astro.nome,
                x: pos.x,
                y: pos.y,
                raio: 12,
                tipo: astro.tipo,
                mag: astro.tipo === "sol" ? "-26.7" : (astro.tipo === "lua" ? "-12.5" : "Variável"),
                altitude: astro.altitude,
                azimute: astro.azimute,
                emoji: astro.emoji || null,
                fase_nome: astro.fase_nome || null,
                iluminacao: astro.iluminacao || null
            });
        });
    }
    
    // Guardar posições projetadas para o click handler
    canvas.elementosNoEcra = elementosNoEcra;
    
    // Desenhar destaque circular tracejado sobre o astro selecionado
    if (objetoSelecionado) {
        const itemNoEcra = elementosNoEcra.find(el => el.id === objetoSelecionado.id);
        if (itemNoEcra) {
            ctx.beginPath();
            ctx.arc(itemNoEcra.x, itemNoEcra.y, itemNoEcra.raio + 4, 0, 2 * Math.PI);
            ctx.strokeStyle = "#ce93d8";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

function tratarCliqueCanvas(e) {
    if (draggedActive) {
        draggedActive = false;
        return;
    }
    const canvas = document.getElementById("observatorio-canvas");
    if (!canvas || !canvas.elementosNoEcra) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Deteção de clique
    let encontrado = null;
    for (const el of canvas.elementosNoEcra) {
        const dx = el.x - x;
        const dy = el.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= el.raio) {
            encontrado = el;
            break;
        }
    }
    
    const painel = document.getElementById("observatorio-detalhes");
    if (!painel) return;
    
    if (encontrado) {
        objetoSelecionado = encontrado;
        
        let extrasHTML = "";
        if (encontrado.tipo === "lua" && encontrado.fase_nome) {
            extrasHTML = `
                <div class="detalhe-linha"><span class="detalhe-icon">${encontrado.emoji}</span><span class="detalhe-label">Fase da Lua</span><span class="detalhe-valor" style="color:#ce93d8">${encontrado.fase_nome} (${encontrado.iluminacao}%)</span></div>
            `;
        } else if (encontrado.tipo === "estrela") {
            const constName = encontrarConstelacaoDaEstrela(encontrado.id);
            extrasHTML = `
                <div class="detalhe-linha"><span class="detalhe-icon">✨</span><span class="detalhe-label">Constelação</span><span class="detalhe-valor" style="color:#9ed4ff">${constName}</span></div>
            `;
        }
        
        const corTipo = encontrado.tipo === "sol" ? "#ff8f00" : (encontrado.tipo === "lua" ? "#b0bec5" : (encontrado.tipo === "estrela" ? "#4fc3f7" : "#ffd54f"));
        const labelTipo = encontrado.tipo.toUpperCase();
        
        painel.innerHTML = `
            <div class="detalhe-titulo">🔭 ${encontrado.nome}</div>
            <div class="detalhe-linha"><span class="detalhe-icon">🏷️</span><span class="detalhe-label">Tipo</span><span class="detalhe-valor" style="color:${corTipo}">${labelTipo}</span></div>
            <div class="detalhe-linha"><span class="detalhe-icon">🔆</span><span class="detalhe-label">Magnitude</span><span class="detalhe-valor" style="font-family:monospace">${encontrado.mag}</span></div>
            <div class="detalhe-linha"><span class="detalhe-icon">📈</span><span class="detalhe-label">Altitude</span><span class="detalhe-valor" style="font-family:monospace;color:#ffcc80">${encontrado.altitude}°</span></div>
            <div class="detalhe-linha"><span class="detalhe-icon">🧭</span><span class="detalhe-label">Azimute</span><span class="detalhe-valor" style="font-family:monospace;color:#ff8a65">${encontrado.azimute}° (${obterRosaDosVentos(encontrado.azimute)})</span></div>
            ${extrasHTML}
        `;
        
        desenharObservatorio();
    } else {
        objetoSelecionado = null;
        painel.innerHTML = `
            <div class="detalhe-titulo">ℹ️ Detalhes</div>
            <p style="color:#778899;font-size:0.85rem;margin-top:12px;text-align:center;line-height:1.4;">Clique num astro ou estrela no mapa celeste para ver os seus detalhes astronómicos.</p>
        `;
        desenharObservatorio();
    }
}

function encontrarConstelacaoDaEstrela(est_id) {
    if (!observatorioDados || !observatorioDados.constelacoes) return "Desconhecida";
    const constelacoes = observatorioDados.constelacoes;
    for (const const_id in constelacoes) {
        const constelacao = constelacoes[const_id];
        for (const linha of constelacao.linhas) {
            if (linha[0] === est_id || inline_equals_check(linha[1], est_id)) {
                return constelacao.nome;
            }
        }
    }
    return "Nenhuma";
}

function inline_equals_check(a, b) {
    return a === b;
}

function obterRosaDosVentos(azimute) {
    const direcoes = [
        { label: "N",  min: 337.5, max: 22.5 },
        { label: "NE", min: 22.5,  max: 67.5 },
        { label: "E",  min: 67.5,  max: 112.5 },
        { label: "SE", min: 112.5, max: 157.5 },
        { label: "S",  min: 157.5, max: 202.5 },
        { label: "SO", min: 202.5, max: 247.5 },
        { label: "O",  min: 247.5, max: 292.5 },
        { label: "NO", min: 292.5, max: 337.5 }
    ];
    for (const d of direcoes) {
        if (d.label === "N") {
            if (azimute >= d.min || azimute < d.max) return d.label;
        } else {
            if (azimute >= d.min && azimute < d.max) return d.label;
        }
    }
    return "N";
}

// ── Auto-refresh ──────────────────────────────────────────────────
// Atualiza dados se o ecrã ativo for o Céu Agora ou o Observatório.
function autoRefresh() {
    if (document.getElementById("ecra-ceu").classList.contains("ativo")) {
        carregarCeu();
    } else if (document.getElementById("ecra-observatorio").classList.contains("ativo")) {
        carregarObservatorio();
    }
    setTimeout(autoRefresh, 30000);
}

// ── Inicialização ─────────────────────────────────────────────────
criarEstrelas();
atualizarRelogio();
setInterval(atualizarRelogio, 1000);

const pagina = window.location.pathname;
if (pagina === "/calendario") {
    mudarEcra("calendario");
} else if (pagina === "/observatorio") {
    mudarEcra("observatorio");
} else {
    mudarEcra("ceu");
}

setTimeout(autoRefresh, 30000);
document.getElementById("musica").volume = 0.4;