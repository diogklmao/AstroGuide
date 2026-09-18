// ── Variáveis globais ─────────────────────────────────────────────
let calAno = new Date().getFullYear();
let calMes = new Date().getMonth() + 1;

const MESES_PT = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DIAS_PT = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

// ── Curiosidades das Constelações ─────────────────────────────────
const CURIOSIDADES_CONSTELACOES = {
    "UMi": "A Ursa Menor contém a Polaris, a Estrela Polar, que há séculos guia navegadores para o Norte. Curiosamente, Polaris não está exatamente no polo celeste — desvia-se cerca de 0.7°.",
    "UMa": "A Ursa Maior é uma das constelações mais reconhecidas do céu. As suas sete estrelas principais formam o 'Grande Carro'. Na Grécia Antiga, representava Calisto, transformada em ursa por Zeus.",
    "Ori": "Orião, o caçador, contém Betelgeuse — uma supergigante vermelha tão enorme que, se estivesse no lugar do Sol, englobaria a órbita de Marte. Um dia explodirá como supernova!",
    "Cas": "Cassiopeia é facilmente reconhecível pelo seu formato em 'W'. Na mitologia grega, era uma rainha vaidosa que foi castigada por Poseidon e colocada no céu a girar eternamente à volta do polo.",
    "Leo": "O Leão é uma das constelações do zodíaco. A sua estrela principal, Regulus, significa 'pequeno rei' em latim. Todos os anos em novembro, a chuva de meteoros Leónidas parece irradiar desta constelação.",
    "Tau": "O Touro alberga as Plêiades, um aglomerado estelar visível a olho nu com cerca de 1.000 estrelas. Na antiguidade, as Plêiades eram usadas para testar a acuidade visual dos guerreiros.",
    "Gem": "Os Gémeos representam Castor e Pólux da mitologia grega. Curiosamente, apesar de serem 'gémeos', Castor é na verdade um sistema de seis estrelas, enquanto Pólux é uma gigante laranja com um exoplaneta confirmado.",
    "Cyg": "O Cisne 'voa' ao longo da Via Láctea. Deneb, a sua estrela mais brilhante, é uma das estrelas mais luminosas conhecidas — cerca de 200.000 vezes mais luminosa que o Sol, a quase 2.600 anos-luz de distância.",
    "Lyr": "A Lira contém Vega, uma das estrelas mais brilhantes do céu e a primeira estrela (depois do Sol) a ser fotografada. Há 12.000 anos, Vega era a Estrela Polar, e voltará a sê-lo daqui a cerca de 13.700 anos.",
    "Aql": "A Águia contém Altair, que está a apenas 16.7 anos-luz da Terra. Altair roda sobre si mesma a uma velocidade vertiginosa — completa uma rotação em cerca de 9 horas, o que a achata nos polos.",
    "Boo": "O Boieiro contém Arcturus, a estrela mais brilhante do hemisfério norte celeste. Arcturus move-se a grande velocidade em relação ao Sol e daqui a meio milhão de anos já não será visível a olho nu.",
    "Vir": "Virgem é a maior constelação do zodíaco e contém o Aglomerado de Virgem — um enorme grupo de mais de 2.000 galáxias a cerca de 54 milhões de anos-luz. Spica, a sua estrela principal, é na verdade um sistema binário.",
    "Sco": "O Escorpião contém Antares, cujo nome significa 'rival de Marte' devido à sua cor avermelhada. Antares é uma supergigante tão grande que, colocada no centro do sistema solar, a sua superfície chegaria à órbita de Júpiter.",
    "Peg": "Pégaso representa o cavalo alado da mitologia grega. O 'Grande Quadrado de Pégaso' é um asterismo formado por quatro estrelas e é usado pelos astrónomos como referência para estimar a transparência do céu."
};

// ── Imagens das Constelações ────────────────────────────────────────
const IMAGENS_CONSTELACOES = {
    "UMi": "/static/images/constelacoes/umi.png",
    "UMa": "/static/images/constelacoes/uma.png",
    "Ori": "/static/images/constelacoes/ori.png",
    "Cas": "/static/images/constelacoes/cas.png",
    "Leo": "/static/images/constelacoes/leo.png",
    "Tau": "/static/images/constelacoes/tau.png",
    "Gem": "/static/images/constelacoes/gem.png",
    "Cyg": "/static/images/constelacoes/cyg.png",
    "Lyr": "/static/images/constelacoes/lyr.png",
    "Aql": "/static/images/constelacoes/aql.png",
    "Boo": "/static/images/constelacoes/boo.png",
    "Vir": "/static/images/constelacoes/vir.png",
    "Sco": "/static/images/constelacoes/sco.png",
    "Peg": "/static/images/constelacoes/peg.png",
};

// ── Estrelas ──────────────────────────────────────────────────────
function criarEstrelas() {
    const container = document.getElementById("stars");
    if (!container) return;
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

    // Gerir modo ecrã inteiro para o observatório e para o VR
    if (nome === "observatorio") {
        document.body.classList.add("observatorio-ativo");
        document.body.classList.remove("vr-ativo");
        // Se estivermos numa sessão de headset, termina-a ao voltar ao Observatório 2D
        if (typeof sairSessaoVR === "function") sairSessaoVR();
        setTimeout(redimensionarCanvas, 50);
    } else if (nome === "vr") {
        document.body.classList.add("vr-ativo");
        document.body.classList.remove("observatorio-ativo");
        setTimeout(redimensionarCanvasVR, 50);
    } else {
        document.body.classList.remove("observatorio-ativo", "vr-ativo");
        if (typeof sairSessaoVR === "function") sairSessaoVR();
    }

    // Carrega os dados do ecrã que ficou ativo
    if (nome === "calendario") carregarCalendario();
    if (nome === "ceu") carregarCeu();
    if (nome === "observatorio") carregarObservatorio();
    if (nome === "apod") carregarApod();
    if (nome === "vr") carregarVR();
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

// ── NASA - Imagem do Dia (APOD) ─────────────────────────────────────
async function carregarApod() {
    const container = document.getElementById("apod-conteudo");
    try {
        const res = await fetch("/api/apod");
        if (!res.ok) throw new Error("Resposta não OK");
        const data = await res.json();

        // A APOD por vezes é um vídeo em vez de uma imagem (ex: lançamentos, eclipses filmados)
        const mediaHTML = data.tipo_media === "video"
            ? `<div class="apod-video-aviso">🎬 O conteúdo de hoje é um vídeo.
                 <a href="${data.url_imagem}" target="_blank" rel="noopener">Ver vídeo original ↗</a></div>`
            : `<img class="apod-imagem" src="${data.url_imagem}" alt="${data.titulo}">`;

        container.innerHTML = `
            <div class="card glass-panel apod-card">
                ${mediaHTML}
                <div class="apod-titulo">${data.titulo}</div>
                <div class="apod-data">${data.data}${data.autor ? " · © " + data.autor : ""}</div>
                <p class="apod-explicacao">${data.explicacao}</p>
                ${data.url_hd ? `<a class="apod-hd-link" href="${data.url_hd}" target="_blank" rel="noopener">Ver em alta resolução ↗</a>` : ""}
            </div>`;
    } catch (err) {
        container.innerHTML = '<div class="loading glass-panel">❌ Não foi possível carregar a imagem do dia</div>';
    }
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

// ── Tempo simulado, partilhado com o Observatório VR ─────────────────────────
// Guarda a data/hora escolhida no seletor "Simular Data/Hora" do Observatório.
// O VR lê este mesmo estado (pela urlApiObservatorio), por isso mostra SEMPRE o
// mesmo céu que o 2D — e a escolha mantém-se quando se volta do VR para o
// Observatório normal. null = céu em tempo real (sem simulação).
let tempoSimuladoObs = null; // { data: "YYYY-MM-DD", hora: "HH:MM" }

// URL de /api/observatorio com o tempo simulado ativo. Sem simulação, o URL vai
// sem parâmetros e o servidor devolve o céu de agora.
function urlApiObservatorio() {
    // Estado incompleto (sem data ou sem hora) não é simulável — devolve o céu
    // de agora em vez de mandar parâmetros vazios ao servidor.
    if (!tempoSimuladoObs || !tempoSimuladoObs.data || !tempoSimuladoObs.hora) {
        return "/api/observatorio";
    }
    const { data, hora } = tempoSimuladoObs;
    return `/api/observatorio?data=${encodeURIComponent(data)}&hora=${encodeURIComponent(hora)}`;
}

// ── Variáveis da Câmara 360° ──────────────────────────────────────
// A posição de início do Observatório, num sítio só: é onde a vista 360° começa
// e onde o "voltar ao início" repõe a câmara — no reset do modo 2D
// (alterarModoVisao) e na saída do tour guiado (pararTour). Antes disto os
// mesmos dois números estavam escritos à mão em dois ficheiros diferentes.
const CAMERA_AZ_INICIAL = 0;    // 0° = Norte
const CAMERA_ALT_INICIAL = 15;  // 15° acima do horizonte

let cameraAzimuth = CAMERA_AZ_INICIAL;   // 0° = Norte, 90° = Este, 180° = Sul, 270° = Oeste
let cameraAltitude = CAMERA_ALT_INICIAL;  // Altitude em graus (-85° a 85°)
let cameraFOV = 80;       // Campo de visão horizontal em graus

// Imagem de fundo do céu (Via Láctea real) — dá um efeito panorâmico ao rodar a câmara
const imgCeuFundo = new Image();
imgCeuFundo.src = "/static/images/space.jpg";
imgCeuFundo.onload = () => desenharObservatorio(); // redesenha assim que a imagem estiver pronta


// Imagens e tamanhos relativos dos astros no observatório
const IMAGENS_ASTROS = {
    "Sol": { src: "/static/images/sun.png", size: 50 },
    "Lua": { src: "/static/images/moon_render.png", size: 18 },
    "Mercúrio": { src: "/static/images/mercury.png", size: 12 },
    "Vénus": { src: "/static/images/venus.png", size: 20 },
    "Marte": { src: "/static/images/mars.png", size: 15 },
    "Júpiter": { src: "/static/images/jupiter.png", size: 37 },
    "Saturno": { src: "/static/images/saturn.png", size: 34 },
    "Úrano": { src: "/static/images/uranus.png", size: 25 },
    "Neptuno": { src: "/static/images/neptune.png", size: 24 },
};

const imgsAstros = {};
Object.entries(IMAGENS_ASTROS).forEach(([nome, cfg]) => {
    const img = new Image();
    img.src = cfg.src;
    img.onload = () => desenharObservatorio();
    imgsAstros[nome] = img;
});

function imagemAstro(nome) {
    if (!nome) return null;
    const nomeSemAcento = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const img = imgsAstros[nome] || imgsAstros[nomeSemAcento];
    return (img && img.complete && img.naturalWidth > 0) ? img : null;
}

function tamanhoAstro(nome) {
    if (!nome) return 6.5;
    const nomeSemAcento = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return IMAGENS_ASTROS[nome]?.size ?? IMAGENS_ASTROS[nomeSemAcento]?.size ?? 6.5;
}

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

// ── Modo Noturno (Red Velvet) ──────────────────────────────────────────
let modoNightModeAtivo = false;

function toggleNightMode(forcarEstado) {
    if (typeof forcarEstado === "boolean") {
        modoNightModeAtivo = forcarEstado;
    } else {
        modoNightModeAtivo = !modoNightModeAtivo;
    }

    const body = document.body;
    const btnCanvas = document.getElementById("btn-night-mode");
    const chkControlo = document.getElementById("chk-night-mode");

    if (modoNightModeAtivo) {
        body.classList.add("red-velvet-mode");
        if (btnCanvas) {
            btnCanvas.classList.add("ativo");
            btnCanvas.title = "Desativar Modo Noturno (Red Velvet)";
        }
        if (chkControlo) chkControlo.checked = true;
    } else {
        body.classList.remove("red-velvet-mode");
        if (btnCanvas) {
            btnCanvas.classList.remove("ativo");
            btnCanvas.title = "Ativar Modo Noturno (Red Velvet) para preservar a visão noturna";
        }
        if (chkControlo) chkControlo.checked = false;
    }

    desenharObservatorio();
}

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
        // Reset da câmara ao voltar ao modo 2D. Uma viagem a meio é cancelada
        // primeiro, senão continuava a correr contra este reset e a câmara
        // voltava aos 360° já num sítio que ninguém escolheu.
        cancelarAnimacaoCamera();
        cameraAzimuth = CAMERA_AZ_INICIAL;
        cameraAltitude = CAMERA_ALT_INICIAL;
    }
}

async function carregarObservatorio(animar = false) {
    const canvas = document.getElementById("observatorio-canvas");
    if (!canvas) return;

    // `animar` é "o utilizador mudou a hora": é o que distingue este caminho da
    // atualização automática de 30 em 30 segundos. E é por isso que o tour
    // termina aqui, e não lá em cima no atualizarObservatorioComHora — assim
    // também apanha o botão "↺ Tempo Real", que muda o céu pela mesma razão.
    // Um tour a andar estava a mostrar um céu que deixou de ser o do ecrã, e
    // saltar paragens que já não correspondem ao que se vê é pior do que parar:
    // quem o quiser ver no céu novo carrega em ▶ e ele recomeça já certo.
    if (animar) pararTour();

    // Uma transição a decorrer é cancelada já: vamos substituir o céu
    // inteiro, e ela estaria a escrever em objetos que ninguém vai desenhar.
    // Fica reposta no destino exato que tinha — o ponto de partida da
    // transição seguinte tem de ser um estado verdadeiro, não um meio caminho.
    cancelarTransicaoCeu();

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

    // O céu que está agora no ecrã, copiado ANTES do fetch: é o ponto de
    // partida da transição. Copiar é mesmo copiar — durante a animação as
    // posições dentro de observatorioDados são substituídas frame a frame,
    // por isso guardar uma referência não servia de nada.
    const anterior = animar ? guardarCeu() : null;

    // O URL leva a data/hora simulada, se houver uma escolhida (ver urlApiObservatorio)
    try {
        const res = await fetch(urlApiObservatorio());
        const apiData = await res.json();

        // Os valores exatos do instante de chegada, guardados enquanto ainda
        // estão intactos: a animação escreve por cima deles em observatorioDados
        // e no último frame repõe-nos, para o céu acabar sempre no resultado do
        // servidor e nunca num valor interpolado.
        const exato = anterior ? guardarCeu(apiData) : null;

        observatorioDados = apiData;

        // se o painel da ISS estiver aberto é atualizado aqui, antes do reporCeu() abaixo,
        // que devolve ao céu as posições antigas para a transição ter de onde
        // partir. O `anterior` faz as vezes de "a hora mudou por pedido do
        // utilizador": na atualização automática de 30 em 30 segundos não há
        // nada disto, e sem esse travão o painel reescrevia-se sozinho e
        // perdia a posição de scroll a quem estivesse a ler.
        if (anterior && objetoSelecionado && objetoSelecionado.tipo === "iss") painelISS();

        // Escrever já as posições antigas no céu que acabou de chegar: as duas
        // linhas abaixo redesenham de forma síncrona, e sem isto via-se um
        // frame do destino antes de a transição arrancar — um piscar de um
        // frame, do género que se nota sem se perceber de onde vem.
        if (anterior) reporCeu(anterior);

        // Atualiza a localização no cabeçalho
        document.getElementById("localizacao").textContent = "📍 Vila Nova de Gaia";

        alterarModoVisao();
        redimensionarCanvas();

        // Só no fim de tudo estar montado, e a partir do céu que acabou de ser
        // desenhado.
        if (anterior) animarTransicaoCeu(anterior, exato, apiData);
    } catch (err) {
        console.error("Erro ao carregar observatório:", err);
    }
}

// ── Transição animada ao mudar a hora ────────────────────────────────────────
// Mudar a hora simulada não devia fazer o céu saltar: devia vê-lo viajar até à
// posição nova, cada astro pelo seu arco, durante meio segundo.
//
// A forma de o fazer com exatidão é animar o TEMPO, e não as coordenadas. O
// servidor envia o RA/Dec aparente de cada estrela (na época da data) e o
// tempo sideral do instante; aqui calcula-se a posição para um instante
// intermédio em cada frame. Assim o destino é exato — é o mesmo cálculo do
// servidor, só que para outro momento — e cada estrela segue a sua trajetória
// verdadeira no céu, em vez de uma reta entre o princípio e o fim.

// Estado da transição em curso (ambos null quando não há nenhuma a decorrer):
//   idTransicaoCeu  — o pedido de frame, para a poder cancelar
//   fimTransicaoCeu — o instante de chegada, para a poder repor nele
let idTransicaoCeu = null;
let fimTransicaoCeu = null;

// Cópia de um céu (por omissão, o que está no ecrã): as posições de cada
// objecto — altitude, azimute e visibilidade — e também o RA/Dec aparente, que
// é por onde a transição pega. Leva ainda o tempo sideral e a latitude, de que
// ela precisa. Quem escreve isto de volta num céu é o reporCeu, e esse só
// escreve as posições.
function guardarCeu(ceu = observatorioDados) {
    if (!ceu || !ceu.estrelas) return null;

    const estrelas = {};
    for (const id in ceu.estrelas) {
        const e = ceu.estrelas[id];
        estrelas[id] = {
            altitude: e.altitude, azimute: e.azimute, visivel: e.visivel,
            ra_aparente: e.ra_aparente, dec_aparente: e.dec_aparente
        };
    }

    const astros = {};
    for (const a of ceu.astros || []) {
        astros[a.id] = {
            altitude: a.altitude, azimute: a.azimute, visivel: a.visivel,
            ra_aparente: a.ra_aparente, dec_aparente: a.dec_aparente
        };
    }

    return {
        estrelas: estrelas,
        astros: astros,
        tempo_sideral: ceu.tempo_sideral,
        latitude: ceu.latitude
    };
}

// Escreve uma cópia de volta no céu que está em observatorioDados.
function reporCeu(copia) {
    if (!observatorioDados || !copia) return;

    for (const id in copia.estrelas) {
        const alvo = observatorioDados.estrelas[id];
        if (!alvo) continue;
        const valores = copia.estrelas[id];
        alvo.altitude = valores.altitude;
        alvo.azimute = valores.azimute;
        alvo.visivel = valores.visivel;
    }

    for (const astro of observatorioDados.astros || []) {
        const valores = copia.astros[astro.id];
        if (!valores) continue;
        astro.altitude = valores.altitude;
        astro.azimute = valores.azimute;
        astro.visivel = valores.visivel;
    }
}

// Diferença entre dois ângulos pelo caminho curto: entre −180° e +180°. Sem
// isto, um astro que passasse de 359° para 1° dava uma volta completa ao céu.
function diferencaAngular(de, para) {
    return ((para - de + 540) % 360) - 180;
}

const GRAU = Math.PI / 180;   // graus → radianos

// Ascensão Reta e Declinação → altitude e azimute, para um dado tempo sideral
// local (em graus). É trigonometria esférica simples: o ângulo horário
// H = tempo sideral − RA diz quanto o céu já rodou desde que a estrela passou
// o meridiano, e com H, a declinação e a latitude saem as duas fórmulas abaixo.
// Azimute medido a partir do Norte e a crescer para leste (0° = N, 90° = E) —
// a convenção do Skyfield e a que o obterRosaDosVentos() já assume.
// Devolve os valores por arredondar, de propósito: a comparação de
// verificarAltAz() com os valores do servidor (arredondados a 2 casas) conta
// com isso. Se houvesse arredondamento aqui, a tolerância de 0,01° seria
// metade arredondamento e metade erro verdadeiro, e não provava nada.
function altAzDe(raHoras, decGraus, latitudeGraus, tempoSideralGraus) {
    const H = (tempoSideralGraus - raHoras * 15) * GRAU;
    const dec = decGraus * GRAU;
    const lat = latitudeGraus * GRAU;

    // O max/min protege o asin de um 1.0000000001 vindo do arredondamento.
    const senAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(H);
    const altitude = Math.asin(Math.max(-1, Math.min(1, senAlt))) / GRAU;
    const azimute = Math.atan2(
        -Math.cos(dec) * Math.sin(H),
        Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.sin(lat) * Math.cos(H)
    ) / GRAU;

    return { altitude: altitude, azimute: (azimute + 360) % 360 };
}

// Prepara um objecto do céu para a transição: junta o objecto onde as posições
// vão ser escritas ao RA/Dec de partida e ao quanto ele muda no intervalo. Vale
// tanto para uma estrela como para o Sol, a Lua ou um planeta.
// Devolve null quando falta algum dos dados (uma resposta de uma versão
// anterior do servidor, por exemplo) — nesse caso o objecto fica quieto durante
// a transição e é reposto no destino no último frame.
function montarEntrada(alvo, antes, depois) {
    if (!alvo || !antes || !depois) return null;
    // Sem RA/Dec aparente não há transição para este objeto. É onde cai a ISS,
    // e é de propósito: ela não é um objeto fixo do céu, o que a faz ficar
    // quieta durante a animação e aparecer no lugar certo assim que ela acaba.
    if (antes.ra_aparente == null || depois.ra_aparente == null) return null;

    // A Ascensão Reta dá a volta às 24 h (23,9 h → 0,1 h são 0,2 h de diferença,
    // não 23,8): a diferença tem de ir pelo caminho curto, senão o astro dava
    // uma volta ao céu ao contrário. O ×15 é porque a função trabalha em graus
    // e 1 h = 15°.
    const deltaRa = diferencaAngular(antes.ra_aparente * 15, depois.ra_aparente * 15) / 15;

    return {
        alvo: alvo,
        ra: antes.ra_aparente,
        deltaRa: deltaRa,
        dec: antes.dec_aparente,
        deltaDec: depois.dec_aparente - antes.dec_aparente
    };
}

function cancelarTransicaoCeu() {
    if (idTransicaoCeu === null) return;

    cancelAnimationFrame(idTransicaoCeu);
    idTransicaoCeu = null;

    // O céu fica já no destino exato que a transição tinha, e não a meio: as
    // posições em observatorioDados têm de corresponder sempre ao tempo
    // sideral que lá está guardado, porque é isso que a transição seguinte
    // assume ao calcular o seu próprio ponto de partida.
    reporCeu(fimTransicaoCeu);
    fimTransicaoCeu = null;
}

// `inicio` e `fim` são cópias feitas com guardarCeu(); `destino` é o céu que
// está em observatorioDados — os próprios objectos onde as posições vão ser
// escritas, para o desenho os ler no frame seguinte.
function animarTransicaoCeu(inicio, fim, destino) {
    // Sem os dados de que a transição precisa não há transição possível — é o
    // caso de uma resposta de uma versão anterior do servidor que tenha ficado
    // em cache. O céu novo já está carregado e desenhado, por isso saltar é
    // apenas o comportamento de antes, que é melhor do que um céu avariado.
    if (inicio.tempo_sideral == null || fim.tempo_sideral == null) return;
    if (destino.latitude == null) return;

    cancelarTransicaoCeu();

    // Quanto o céu roda, em tempo sideral, pelo caminho curto. É daqui que sai
    // a duração: um salto de 8 h roda ~120° (uma viagem que se vê), meia hora
    // roda ~7,5° (quase nada). O tecto evita que um salto de meses fique a
    // animar durante uma eternidade.
    const deltaLst = diferencaAngular(inicio.tempo_sideral, fim.tempo_sideral);
    const horasSiderais = Math.abs(deltaLst) / 15.041067;   // 1 h sideral = 15,041067°
    const duracaoMs = Math.min(1100, 400 + 60 * horasSiderais);

    const latitude = destino.latitude;

    // Todos os objectos do céu — estrelas, Sol, Lua e planetas — vão pelo mesmo
    // caminho: em cada frame a posição sai do RA/Dec e do tempo sideral desse
    // instante. Nas estrelas o RA/Dec é sempre o mesmo (o que muda é o tempo
    // sideral); nos astros vai variando devagar, e por isso vai interpolado
    // entre os dois extremos.
    //
    // É esta a diferença que se vê. Quem manda no movimento é a rotação do céu,
    // que num salto de 8 h ronda os 120°, e essa é calculada a rigor. O
    // movimento próprio de cada astro nesse intervalo — a Lua, a mais rápida,
    // anda uns 4° — é pequeno ao pé disso. Uma lista e um cálculo só, em vez de
    // um método para as estrelas e outro para os astros, evita que o mesmo
    // desenho tenha dois comportamentos diferentes.
    const objetos = [];

    for (const id in destino.estrelas) {
        const entrada = montarEntrada(destino.estrelas[id], inicio.estrelas[id], fim.estrelas[id]);
        if (entrada) objetos.push(entrada);
    }

    for (const astro of destino.astros) {
        const entrada = montarEntrada(astro, inicio.astros[astro.id], fim.astros[astro.id]);
        if (entrada) objetos.push(entrada);
    }

    const inicioMs = performance.now();
    fimTransicaoCeu = fim;

    function frame(agoraMs) {
        // O max/min é para o primeiro frame poder chegar com um instante
        // anterior ao arranque (a marca do requestAnimationFrame é a do início
        // do frame, não a do momento em que o pedimos) e para o último não
        // passar de 1.
        const f = Math.min(1, Math.max(0, (agoraMs - inicioMs) / duracaoMs));

        // easeInOutCubic: arranca devagar, acelera, trava no fim. É a diferença
        // entre "a rodar" e "a chegar ao sítio".
        const suave = f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;

        // O tempo sideral avança a ritmo constante, por isso interpolá-lo é o
        // mesmo que interpolar o tempo — e é daí que vem a exatidão: em cada
        // frame a posição é calculada para um instante que existiu mesmo.
        const lst = inicio.tempo_sideral + deltaLst * suave;

        for (const objeto of objetos) {
            const posicao = altAzDe(objeto.ra + objeto.deltaRa * suave,
                                    objeto.dec + objeto.deltaDec * suave,
                                    latitude, lst);

            // Arredondado a 2 casas como o servidor, para os números do painel
            // de detalhes não aparecerem com catorze casas decimais a quem
            // clique a meio da transição. O cálculo em si é que não é
            // arredondado — é o que o verificarAltAz() compara.
            objeto.alvo.altitude = Math.round(posicao.altitude * 100) / 100;
            objeto.alvo.azimute = Math.round(posicao.azimute * 100) / 100;
            // Recalculado em cada frame: sem isto, o que nasça a meio da
            // transição só apareceria no fim, de repente.
            objeto.alvo.visivel = posicao.altitude > 0;
        }

        const terminou = f >= 1;

        // Último frame: os valores exatos do servidor, a partir da cópia. A
        // transição nunca é a última palavra — mesmo que houvesse um erro na
        // matemática, o céu acaba sempre no resultado do cálculo astronómico.
        if (terminou) {
            reporCeu(fim);
            idTransicaoCeu = null;
            fimTransicaoCeu = null;
        }

        agendarDesenhoObservatorio();

        if (!terminou) idTransicaoCeu = requestAnimationFrame(frame);
    }

    idTransicaoCeu = requestAnimationFrame(frame);
}

// Verificação da conversão RA/Dec → Alt/Az. Não corre sozinha, só quando
// chamada na consola do browser, com o Observatório aberto e em repouso.
// Compara, para tudo o que tem RA/Dec — estrelas, Sol, Lua e planetas —, a
// posição que este cálculo dá com a que veio do servidor para o mesmo instante.
// Coincidirem é a prova de que a conversão está certa — e a animação é exata
// por construção, porque usa exatamente este cálculo em cada frame.
window.verificarAltAz = function () {
    if (!observatorioDados || observatorioDados.tempo_sideral == null) {
        console.warn("Ainda não há dados do observatório — abre o ecrã do Observatório primeiro.");
        return;
    }
    if (idTransicaoCeu !== null) {
        console.warn("Há uma transição a decorrer — espera que acabe e repete.");
        return;
    }

    let piorAltitude = 0;
    let piorAzimute = 0;
    let quantas = 0;

    // Estrelas e astros, os dois: o cálculo em que a animação se apoia é o
    // mesmo para todos, e uma verificação que só cobrisse metade deles podia
    // passar com a outra metade avariada. Nos astros é até mais útil — têm
    // paralaxe (a Lua, sobretudo), que é onde uma conversão mal feita se
    // notaria primeiro.
    const objetos = [];
    for (const id in observatorioDados.estrelas) objetos.push(observatorioDados.estrelas[id]);
    for (const astro of observatorioDados.astros || []) objetos.push(astro);

    for (const objeto of objetos) {
        if (objeto.ra_aparente == null) continue;

        const posicao = altAzDe(objeto.ra_aparente, objeto.dec_aparente,
                                observatorioDados.latitude, observatorioDados.tempo_sideral);

        // Azimute pelo caminho curto: 359,9° e 0,1° distam 0,2°, não 359,8°.
        piorAltitude = Math.max(piorAltitude, Math.abs(posicao.altitude - objeto.altitude));
        piorAzimute = Math.max(piorAzimute, Math.abs(diferencaAngular(objeto.azimute, posicao.azimute)));
        quantas++;
    }

    console.log(`${quantas} objectos comparados (estrelas e astros). Pior diferença: ` +
                `altitude ${piorAltitude.toFixed(4)}°, azimute ${piorAzimute.toFixed(4)}°.`);
    console.log(piorAltitude < 0.01 && piorAzimute < 0.01
        ? "✅ Dentro do esperado (< 0,01°) — a conversão está certa e a animação é exata."
        : "❌ Fora do esperado — alguma coisa não bate certo.");

    return { piorAltitude: piorAltitude, piorAzimute: piorAzimute, quantas: quantas };
};

// ── Seletor de Hora do Observatório ──────────────────────────────────────────
// Preenche os campos do seletor. Se já houver uma simulação ativa, mantém a
// data/hora escolhida (é o que faz a hora sobreviver a uma ida ao VR); caso
// contrário, começa na data/hora reais.
function inicializarSeletorHora() {
    const inputData = document.getElementById("obs-data");
    const inputHora = document.getElementById("obs-hora");
    if (!inputData || !inputHora) return;

    if (tempoSimuladoObs) {
        inputData.value = tempoSimuladoObs.data;
        inputHora.value = tempoSimuladoObs.hora;
    } else {
        const agora = new Date();
        inputData.value = agora.toLocaleDateString("sv-SE");   // formato YYYY-MM-DD
        const hh = String(agora.getHours()).padStart(2, "0");
        const mm = String(agora.getMinutes()).padStart(2, "0");
        inputHora.value = `${hh}:${mm}`;
    }

    atualizarLabelTempoSimulado();
}

// Rótulo por baixo do seletor: "⏱ dd/mm/ano às hh:mm". Fica vazio quando
// estamos em tempo real, por isso serve também de aviso visual de simulação.
function atualizarLabelTempoSimulado() {
    const label = document.getElementById("obs-hora-label");
    if (!label) return;

    if (!tempoSimuladoObs) {
        label.textContent = "";
        label.classList.remove("ativa");
        return;
    }

    // Formato esperado: "YYYY-MM-DD". Se vier outra coisa, mostra o valor tal
    // como está — nunca "undefined/undefined/undefined".
    const dataLegivel = /^\d{4}-\d{2}-\d{2}$/.test(tempoSimuladoObs.data)
        ? tempoSimuladoObs.data.split("-").reverse().join("/")
        : tempoSimuladoObs.data;

    label.textContent = `⏱ ${dataLegivel} às ${tempoSimuladoObs.hora}`;
    label.classList.add("ativa");
}

function atualizarObservatorioComHora() {
    const inputData = document.getElementById("obs-data");
    const inputHora = document.getElementById("obs-hora");
    if (!inputData || !inputHora) return;

    const data = inputData.value;
    const hora = inputHora.value;

    // Campo apagado: não há instante para simular. Sinónimo de "↺ Tempo Real" —
    // repõe os campos e volta ao céu de agora, para o ecrã e o servidor não
    // ficarem a dizer coisas diferentes.
    if (!data || !hora) {
        repoeHoraAtual();
        return;
    }

    const agora = new Date();
    const dataAtual = agora.toLocaleDateString("sv-SE");
    const horaAtual = String(agora.getHours()).padStart(2, "0") + ":" + String(agora.getMinutes()).padStart(2, "0");

    // Escolher exatamente a data/hora atuais quer dizer "voltar ao tempo real";
    // qualquer outro valor passa a ser o tempo simulado partilhado com o VR.
    tempoSimuladoObs = (data === dataAtual && hora === horaAtual) ? null : { data, hora };

    atualizarLabelTempoSimulado();

    // Com transição: é uma mudança de hora pedida pelo utilizador, e é isso
    // que se quer ver acontecer. A actualização automática de 30 em 30
    // segundos (autoRefresh) e a entrada no ecrã ficam sem transição — movem o
    // céu 0,125° e animar isso seria só ruído.
    carregarObservatorio(true);
}

function repoeHoraAtual() {
    tempoSimuladoObs = null;      // céu em tempo real, no 2D e no VR
    inicializarSeletorHora();     // repõe os campos e limpa o rótulo
    carregarObservatorio(true);   // voltar ao tempo real também é uma viagem
}

// ── Controlos de Arrastar e Zoom ──────────────────────────────────
function iniciarArrasto(e) {
    const modoSelect = document.getElementById("sel-modo-visao");
    if (!modoSelect || modoSelect.value !== "360") return;

    // Quem pega no rato manda: uma viagem do "ir para" a meio desistia aqui, e
    // sem isto o arrasto e a animação ficavam os dois a escrever em
    // cameraAzimuth no mesmo frame — o céu treme e volta para trás.
    cancelarAnimacaoCamera();

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

    if (Math.sqrt(dx * dx + dy * dy) > 4) {
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

    // Agendado (e não desenhado já): vários mousemove podem chegar antes de o
    // browser pintar o frame seguinte — só o último interessa.
    agendarDesenhoObservatorio();
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
        // Ver o comentário no iniciarArrasto: quem toca no ecrã manda.
        cancelarAnimacaoCamera();

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

        if (Math.sqrt(dx * dx + dy * dy) > 4) {
            draggedActive = true;
        }

        const canvas = document.getElementById("observatorio-canvas");
        if (!canvas) return;

        const sensibilidade = cameraFOV / canvas.width;
        cameraAzimuth = (startAzimuth - dx * sensibilidade + 360) % 360;
        cameraAltitude = Math.max(-85, Math.min(85, startAltitude + dy * sensibilidade));

        agendarDesenhoObservatorio();
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
            agendarDesenhoObservatorio();
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

    agendarDesenhoObservatorio();
}

// ── Viagem da câmara ("ir para") ──────────────────────────────────
// Apontar a câmara a um objeto é escrever em cameraAzimuth e cameraAltitude —
// mas escrevê-las de repente faz o céu saltar, e o salto não diz a quem olha de
// onde é que o objeto veio. Esta animação leva-a lá pelo caminho, em 0,8 s.
//
// Não tem tratamento de prefers-reduced-motion, e é de propósito: a regra do
// projeto (ver glass.css) desliga as animações contínuas e decorativas, e
// mantém as curtas que apresentam conteúdo. Esta é das segundas — sem ela, o
// "ir para" ou não se percebe, ou não se vê de todo.
let idAnimacaoCamera = null;

function cancelarAnimacaoCamera() {
    // Só se cancela o pedido de frame; a câmara fica onde está. Ao contrário da
    // transição do céu, não há aqui um "destino exato" a repor: a posição a que
    // a viagem ia a meio é uma posição verdadeira, e é a que está no ecrã.
    if (idAnimacaoCamera === null) return;
    cancelAnimationFrame(idAnimacaoCamera);
    idAnimacaoCamera = null;
}

function animarCameraPara(azAlvo, altAlvo) {
    cancelarAnimacaoCamera();

    // Em modo 2D não há câmara nenhuma para apontar: o planisfério desenha o
    // hemisfério inteiro de uma só vez e as coordenadas no ecrã não dependem
    // dela (ver projectar()). Isto é o travão, para o modo 2D não ficar com uma
    // câmara mexida que só se notaria ao voltar aos 360°.
    const modoSelect = document.getElementById("sel-modo-visao");
    if (!modoSelect || modoSelect.value !== "360") return;

    // O azimute vai pelo caminho curto: sem isto, um objeto a 350° visto de
    // 10° levava o céu a rodar 340° pelo lado errado em vez dos 20° que faltam.
    const deltaAz = diferencaAngular(cameraAzimuth, azAlvo);
    const azInicial = cameraAzimuth;
    const altInicial = cameraAltitude;
    const altFinal = Math.max(-85, Math.min(85, altAlvo));

    const duracaoMs = 800;
    const inicioMs = performance.now();

    function frame(agoraMs) {
        // O max/min é para o primeiro frame poder chegar com um instante
        // anterior ao arranque, e para o último não passar de 1.
        const f = Math.min(1, Math.max(0, (agoraMs - inicioMs) / duracaoMs));

        // O mesmo easeInOutCubic da transição do céu: arranca devagar, acelera,
        // trava no fim. É a diferença entre "a rodar" e "a chegar ao sítio".
        const suave = f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;

        cameraAzimuth = (azInicial + deltaAz * suave + 360) % 360;
        cameraAltitude = altInicial + (altFinal - altInicial) * suave;

        const terminou = f >= 1;

        if (terminou) {
            // Os valores exatos no fim, e não o resultado da interpolação: o
            // objeto tem de ficar mesmo ao centro do ecrã, sem um resto de meio
            // grau que se nota no instante em que a viagem para.
            cameraAzimuth = (azAlvo + 360) % 360;
            cameraAltitude = altFinal;
            idAnimacaoCamera = null;
        }

        agendarDesenhoObservatorio();

        if (!terminou) idAnimacaoCamera = requestAnimationFrame(frame);
    }

    idAnimacaoCamera = requestAnimationFrame(frame);
}

// ── Renderização do Observatório ──────────────────────────────────
// ── Agenda de desenho ─────────────────────────────────────────────
// O arrasto gera muitos mais eventos do que o ecrã consegue mostrar: um rato
// de 1000 Hz dispara dezenas de mousemove por cada frame pintado, e desenhar
// a cada um deles é trabalho deitado fora — só o último estado chega a ser
// visto. Agrupar os pedidos num único requestAnimationFrame desenha uma vez
// por frame, com o estado final. O resultado visual é igual.
let desenhoAgendado = false;
function agendarDesenhoObservatorio() {
    if (desenhoAgendado) return;
    desenhoAgendado = true;
    requestAnimationFrame(() => {
        desenhoAgendado = false;
        desenharObservatorio();
    });
}

// ── Cache do fundo do céu (fotografia da Via Láctea) ───────────────
// Escalar a fotografia para o tamanho do canvas E passar-lhe o filtro de cor
// são, de longe, as operações mais caras de cada frame — e eram feitas duas
// vezes (a 2ª cópia tapa a costura). O resultado só depende da altura do
// canvas, por isso prepara-se uma vez numa imagem à parte; depois cada frame
// limita-se a copiá-la, que é praticamente só memória.
let fundoCeuCache = null; // { chave, imagem }

function obterFundoCeuPreparado(alturaAlvo) {
    // A chave inclui as dimensões da fotografia (muda quando ela carrega) e a
    // altura do canvas (muda quando a janela é redimensionada).
    const chave = `${imgCeuFundo.naturalWidth}x${imgCeuFundo.naturalHeight}@${alturaAlvo}`;
    if (fundoCeuCache && fundoCeuCache.chave === chave) return fundoCeuCache.imagem;

    // Escala a imagem para cobrir a altura do canvas, com alguma folga extra
    // (1.4x) para haver imagem suficiente quando o utilizador olha para cima/baixo.
    const escala = (alturaAlvo / imgCeuFundo.naturalHeight) * 1.4;
    const largura = Math.round(imgCeuFundo.naturalWidth * escala);
    const altura = Math.round(imgCeuFundo.naturalHeight * escala);

    const tela = document.createElement("canvas");
    tela.width = largura;
    tela.height = altura;
    const tctx = tela.getContext("2d");

    // Filtro ajustado para equilibrar a via láctea e as constelações
    tctx.filter = "brightness(1.1) contrast(1.5) saturate(1.2)";
    tctx.drawImage(imgCeuFundo, 0, 0, largura, altura);

    fundoCeuCache = { chave, imagem: tela };
    return tela;
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

    // A mesma estrela é projetada várias vezes por frame: uma vez por cada linha
    // de constelação em que entra, outra para o centróide da constelação e outra
    // ainda como ponto. A posição só depende da estrela, por isso guarda-se o
    // resultado do primeiro cálculo e reutiliza-se.
    const posicoesEstrelas = new Map();
    function projectarEstrela(est_id) {
        if (posicoesEstrelas.has(est_id)) return posicoesEstrelas.get(est_id);
        const est = observatorioDados.estrelas[est_id];
        const pos = est ? projectar(est.altitude, est.azimute) : null;
        posicoesEstrelas.set(est_id, pos);
        return pos;
    }

    // 1. Desenhar fundos e grelhas específicas do modo
    if (modoVisao === "360") {

        // ── Fundo: imagem panorâmica real da Via Láctea, com parallax ao rodar a câmara ──
        const gradSky = ctx.createLinearGradient(0, 0, 0, height);
        gradSky.addColorStop(0, "#01020a");
        gradSky.addColorStop(0.5, "#04081a");
        gradSky.addColorStop(1, "#08122a");

        if (imgCeuFundo.complete && imgCeuFundo.naturalWidth > 0) {
            // Imagem já escalada e com o filtro aplicado (ver obterFundoCeuPreparado)
            // — aqui é só uma cópia, sem reamostragem nem filtros de cor.
            const fundo = obterFundoCeuPreparado(height);
            const imgW = fundo.width;
            const imgH = fundo.height;

            // Desloca a imagem horizontalmente conforme o azimute da câmara — dá a
            // sensação de estar a rodar sobre uma cúpula panorâmica, como um céu real.
            // Os deslocamentos vão arredondados a pixels inteiros: uma cópia alinhada
            // à grelha de pixels é uma operação de memória, ao passo que um
            // deslocamento fraccionário obriga o browser a reamostrar os milhões de
            // pixels da imagem, duas vezes por frame. O erro máximo é meio pixel,
            // invisível a arrastar.
            let offsetX = -((cameraAzimuth / 360) * imgW) % imgW;
            if (offsetX > 0) offsetX -= imgW;
            offsetX = Math.round(offsetX);
            const offsetY = Math.round((height - imgH) / 2 - (cameraAltitude / 90) * (imgH * 0.15));

            ctx.drawImage(fundo, offsetX, offsetY);
            ctx.drawImage(fundo, offsetX + imgW, offsetY); // 2ª cópia: evita "buraco" ao dar a volta

            // Dissolve a "costura" onde as duas cópias se encontram — a foto não é
            // um panorama 360° verdadeiro, por isso há um corte visível ali sem isto.
            const seamX = offsetX + imgW;
            if (seamX > -140 && seamX < width + 140) {
                const gradCostura = ctx.createLinearGradient(seamX - 120, 0, seamX + 120, 0);
                gradCostura.addColorStop(0, "rgba(4, 8, 16, 0)");
                gradCostura.addColorStop(0.5, "rgba(4, 8, 16, 0.6)");
                gradCostura.addColorStop(1, "rgba(4, 8, 16, 0)");
                ctx.fillStyle = gradCostura;
                ctx.fillRect(seamX - 120, 0, 240, height);
            }

            ctx.globalAlpha = 0.45; // Aumentado um pouco para escurecer o fundo e realçar as constelações
            ctx.fillStyle = gradSky;
            ctx.fillRect(0, 0, width, height);
            ctx.globalAlpha = 1;
        } else {
            // Enquanto a imagem ainda não carregou (ou falhou), usa só o gradiente —
            // assim que carregar, o onload chama desenharObservatorio() outra vez.
            ctx.fillStyle = gradSky;
            ctx.fillRect(0, 0, width, height);
        }

        // Calcular a linha do horizonte nessa faixa
        let horizonPoints = [];
        const step = 2;
        for (let azOffset = -cameraFOV; azOffset <= cameraFOV; azOffset += step) {
            const az = (cameraAzimuth + azOffset + 360) % 360;
            const pos = projectar(0, az);
            if (pos) horizonPoints.push(pos);
        }

        if (horizonPoints.length > 0) {
            const horizY = horizonPoints[Math.floor(horizonPoints.length / 2)].y;

            // ── Solo: gradiente escuro e limpo ───────────────────
            ctx.beginPath();
            ctx.moveTo(horizonPoints[0].x, horizonPoints[0].y);
            for (let i = 1; i < horizonPoints.length; i++) {
                ctx.lineTo(horizonPoints[i].x, horizonPoints[i].y);
            }
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();

            const gradGround = ctx.createLinearGradient(0, horizY, 0, height);
            gradGround.addColorStop(0, "rgba(9, 11, 17, 0.97)");
            gradGround.addColorStop(0.3, "rgba(7, 9, 14, 0.98)");
            gradGround.addColorStop(0.65, "rgba(5, 6, 10, 0.99)");
            gradGround.addColorStop(1, "rgba(2, 2, 4, 1.00)");
            ctx.fillStyle = gradGround;
            ctx.fill();

            // Nota: não há silhueta de montanhas no horizonte — foi removida
            // a pedido do utilizador. Não voltar a adicionar sem perguntar.

            // Névoa suave no horizonte — tom frio
            const gradFog = ctx.createLinearGradient(0, horizY - 20, 0, horizY + 35);
            gradFog.addColorStop(0, "rgba(40, 55, 80, 0.0)");
            gradFog.addColorStop(0.45, "rgba(50, 65, 95, 0.16)");
            gradFog.addColorStop(1, "rgba(20, 25, 40, 0.0)");
            ctx.fillStyle = gradFog;
            ctx.fillRect(0, horizY - 20, width, 55);

            // Linha do horizonte
            ctx.beginPath();
            ctx.moveTo(horizonPoints[0].x, horizonPoints[0].y);
            for (let i = 1; i < horizonPoints.length; i++) ctx.lineTo(horizonPoints[i].x, horizonPoints[i].y);
            ctx.strokeStyle = "rgba(110, 140, 185, 0.2)";
            ctx.lineWidth = 1.5;
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
        ctx.strokeStyle = "rgba(110, 200, 255, 0.8)"; // Azul claro opaco para a linha
        ctx.lineWidth = 2.0;
        ctx.shadowBlur = 12; // Efeito neon
        ctx.shadowColor = "rgba(110, 200, 255, 1)"; // Cor do brilho neon

        const constelacoes = observatorioDados.constelacoes;
        const estrelas = observatorioDados.estrelas;

        for (const const_id in constelacoes) {
            const constelacao = constelacoes[const_id];

            // Todas as linhas da constelação num único caminho, traçado de uma só
            // vez. Cada stroke() com brilho neon obriga o browser a criar uma
            // camada, desfocá-la e compô-la; com 73 linhas eram 73 dessas camadas
            // por frame, agora são 15 (uma por constelação). O traço fica igual.
            ctx.beginPath();
            constelacao.linhas.forEach(linha => {
                const estA = estrelas[linha[0]];
                const estB = estrelas[linha[1]];

                if (estA && estB && (estA.visivel || estB.visivel)) {
                    const posA = projectarEstrela(linha[0]);
                    const posB = projectarEstrela(linha[1]);

                    if (posA && posB) {
                        ctx.moveTo(posA.x, posA.y);
                        ctx.lineTo(posB.x, posB.y);
                    }
                }
            });
            ctx.stroke();

            // Calcular centróide da constelação (usado para nomes e cliques)
            let sumX = 0, sumY = 0, count = 0;
            const estrelasUnicas = new Set();
            constelacao.linhas.forEach(linha => {
                estrelasUnicas.add(linha[0]);
                estrelasUnicas.add(linha[1]);
                const estA = estrelas[linha[0]];
                if (estA && estA.visivel) {
                    const pos = projectarEstrela(linha[0]);
                    if (pos) {
                        sumX += pos.x;
                        sumY += pos.y;
                        count++;
                    }
                }
            });

            // Nomes das constelações
            if (showNomesConstelacoes && count > 0) {
                ctx.shadowBlur = 6;
                ctx.shadowColor = "rgba(110, 200, 255, 1)"; // Efeito glow para o texto
                ctx.fillStyle = "rgba(255, 255, 255, 0.95)"; // Texto quase branco e opaco
                ctx.font = "bold italic 11px sans-serif"; // Fonte maior e a negrito
                ctx.textAlign = "center";
                ctx.fillText(constelacao.nome, sumX / count, sumY / count);

                // Repor o shadowBlur para as linhas na próxima iteração do ciclo
                ctx.shadowBlur = 12;
            }

            // Registar constelação como elemento clicável
            if (count > 0) {
                elementosNoEcra.push({
                    id: "const_" + const_id,
                    nome: constelacao.nome,
                    x: sumX / count,
                    y: sumY / count,
                    raio: 18,
                    tipo: "constelacao",
                    const_id: const_id,
                    numEstrelas: estrelasUnicas.size
                });
            }
        }

        ctx.shadowBlur = 0; // Limpar o efeito neon para não afetar as estrelas e outros elementos
    }

    // 3. Desenhar as Estrelas
    const estrelas = observatorioDados.estrelas;

    // A fonte e o alinhamento são iguais para todos os nomes, por isso definem-se
    // uma vez em vez de uma vez por estrela — ctx.font obriga o browser a analisar
    // a string outra vez de cada vez que lhe é atribuída.
    if (showNomesEstrelas) {
        ctx.font = "9px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
    }

    for (const est_id in estrelas) {
        const est = estrelas[est_id];
        if (!est.visivel) continue;
        if (est.mag > magLimite) continue;

        // Já pode estar calculada, se a estrela pertencer a uma constelação
        const pos = projectarEstrela(est_id);
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

        // Nomes das estrelas — a cor é reposta em cada estrela porque o ponto
        // desenhado acima já alterou o fillStyle; a fonte e o alinhamento já vêm
        // definidos de fora do ciclo.
        if (showNomesEstrelas) {
            ctx.fillStyle = "rgba(200, 220, 255, 0.65)";
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

            const imgAstro = imagemAstro(astro.nome);
            const size = tamanhoAstro(astro.nome);

            if (imgAstro) {
                if (astro.nome === "Saturno") {
                    // Saturno possui anéis transparentes em PNG — desenhar diretamente sem recorte circular
                    const drawW = size * 2.2;
                    const drawH = size * 2.2;
                    ctx.drawImage(imgAstro, pos.x - drawW / 2, pos.y - drawH / 2, drawW, drawH);
                } else {
                    // Recorta a imagem em círculo e aplica zoom para eliminar quaisquer bordas
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, size, 0, 2 * Math.PI);
                    ctx.clip();
                    const drawSize = size * 2.5;
                    ctx.drawImage(imgAstro, pos.x - drawSize / 2, pos.y - drawSize / 2, drawSize, drawSize);
                    ctx.restore();
                }
            } else {
                let corHalo = "rgba(255, 255, 255, 0.15)";
                let corAstro = "#ffffff";
                let fatorHalo = 2.2;

                if (astro.tipo === "planeta") {
                    if (astro.nome === "Saturno") {
                        corHalo = "rgba(255, 204, 2, 0.2)";
                        corAstro = "#ffe082";
                    } else {
                        corHalo = "rgba(110, 184, 255, 0.2)";
                        corAstro = "#4fc3f7";
                    }
                } else if (astro.tipo === "iss") {
                    // A ISS: um ponto quase branco com um halo azulado mais largo
                    // do que o dos planetas. É o objeto que se anda à procura no
                    // céu, por isso convém dar nas vistas — e, ao contrário do Sol
                    // e da Lua, não precisa de imagem nenhuma para se reconhecer.
                    corHalo = "rgba(158, 212, 255, 0.3)";
                    corAstro = "#eaf6ff";
                    fatorHalo = 3.0;
                }

                ctx.beginPath();
                ctx.arc(pos.x, pos.y, size * fatorHalo, 0, 2 * Math.PI);
                ctx.fillStyle = corHalo;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(pos.x, pos.y, size, 0, 2 * Math.PI);
                ctx.fillStyle = corAstro;
                ctx.fill();
            }

            // Rótulo de Nome do Astro
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 9px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillText(astro.nome, pos.x, pos.y - size - 4);

            // Fase da Lua em Emoji (só no painel de detalhes, não no canvas)

            elementosNoEcra.push({
                id: astro.id,
                nome: astro.nome,
                x: pos.x,
                y: pos.y,
                raio: imgAstro ? size + 4 : 12,
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
        mostrarDetalhesDe(encontrado);
        desenharObservatorio();
    } else {
        objetoSelecionado = null;
        painel.innerHTML = `
            <div class="detalhe-titulo">ℹ️ Detalhes</div>
            <p style="color:#778899;font-size:0.85rem;margin-top:12px;text-align:center;line-height:1.4;">Clique num astro, estrela ou constelação no mapa celeste para ver os seus detalhes astronómicos.</p>
        `;
        desenharObservatorio();
    }
}

// Escreve o painel de detalhes para um objeto do céu. O `item` tem a forma de
// uma entrada de canvas.elementosNoEcra — é a mesma coisa que o clique lhe
// passa —, o que quer dizer que um objeto que não esteja a ser desenhado (a
// pesquisa encontra objetos que os filtros escondem) pode ser mostrado à mesma,
// desde que traga os campos de que o painel precisa.
//
// `aviso` é a razão por que a câmara não foi a lado nenhum, quando há uma (ver
// irPara). Vai LOGO ABAIXO DO TÍTULO, e não no fim: o painel tem altura máxima
// com scroll, e com a imagem de uma constelação à frente uma nota no fim ficava
// fora de vista — que é o mesmo que não existir.
//
// Quem chama já pôs objetoSelecionado; este painel só escreve.
function mostrarDetalhesDe(item, aviso) {
    const painel = document.getElementById("observatorio-detalhes");
    if (!painel || !item) return;

    const avisoHTML = aviso ? `<p class="obs-aviso-ir">⚠️ ${aviso}</p>` : "";

    if (item.tipo === "constelacao") {
        // ── Detalhes de Constelação ──
        const curiosidade = CURIOSIDADES_CONSTELACOES[item.const_id] || "Uma constelação fascinante do céu noturno.";
        const imagemConst = IMAGENS_CONSTELACOES[item.const_id];
        const imagemHTML = imagemConst
            ? `<img class="constelacao-img" src="${imagemConst}" alt="${item.nome}" onerror="this.style.display='none'">`
            : "";
        painel.innerHTML = `
            <div class="detalhe-titulo">⭐ ${item.nome}</div>
            ${avisoHTML}
            ${imagemHTML}
            <div class="detalhe-linha"><span class="detalhe-icon">🏷️</span><span class="detalhe-label">Tipo</span><span class="detalhe-valor" style="color:#6eb8ff">CONSTELAÇÃO</span></div>
            <div class="detalhe-linha"><span class="detalhe-icon">🔤</span><span class="detalhe-label">Abreviatura</span><span class="detalhe-valor" style="font-family:monospace;color:#ce93d8">${item.const_id}</span></div>
            <div class="detalhe-linha"><span class="detalhe-icon">✨</span><span class="detalhe-label">Estrelas</span><span class="detalhe-valor" style="font-family:monospace">${item.numEstrelas}</span></div>
            <div style="margin-top:14px;padding:10px 12px;background:rgba(110,184,255,0.07);border-left:3px solid rgba(110,184,255,0.4);border-radius:6px;">
                <div style="font-size:0.75rem;color:#6eb8ff;margin-bottom:6px;font-weight:600;">💡 Curiosidade</div>
                <p style="color:rgba(220,227,240,0.85);font-size:0.82rem;line-height:1.5;margin:0;">${curiosidade}</p>
            </div>
        `;
    } else if (item.tipo === "iss") {
        // ── Detalhes da Estação Espacial ──
        // Quem desenha o painel vai buscar a posição ao céu em
        // observatorioDados, não à cópia que aqui chegou, que fica
        // desatualizada mal a hora mude.
        mostrarDetalhesISS();
    } else {
        // ── Detalhes de Estrela / Astro ──
        let extrasHTML = "";
        if (item.tipo === "lua" && item.fase_nome) {
            extrasHTML = `
                <div class="detalhe-linha"><span class="detalhe-icon">${item.emoji}</span><span class="detalhe-label">Fase da Lua</span><span class="detalhe-valor" style="color:#ce93d8">${item.fase_nome} (${item.iluminacao}%)</span></div>
            `;
        } else if (item.tipo === "estrela") {
            const constName = encontrarConstelacaoDaEstrela(item.id);
            extrasHTML = `
                <div class="detalhe-linha"><span class="detalhe-icon">✨</span><span class="detalhe-label">Constelação</span><span class="detalhe-valor" style="color:#9ed4ff">${constName}</span></div>
            `;
        }

        const corTipo = item.tipo === "sol" ? "#ff8f00" : (item.tipo === "lua" ? "#b0bec5" : (item.tipo === "estrela" ? "#4fc3f7" : "#ffd54f"));
        const labelTipo = item.tipo.toUpperCase();

        painel.innerHTML = `
            <div class="detalhe-titulo">🔭 ${item.nome}</div>
            ${avisoHTML}
            <div class="detalhe-linha"><span class="detalhe-icon">🏷️</span><span class="detalhe-label">Tipo</span><span class="detalhe-valor" style="color:${corTipo}">${labelTipo}</span></div>
            <div class="detalhe-linha"><span class="detalhe-icon">🔆</span><span class="detalhe-label">Magnitude</span><span class="detalhe-valor" style="font-family:monospace">${item.mag}</span></div>
            <div class="detalhe-linha"><span class="detalhe-icon">📈</span><span class="detalhe-label">Altitude</span><span class="detalhe-valor" style="font-family:monospace;color:#ffcc80">${item.altitude}°</span></div>
            <div class="detalhe-linha"><span class="detalhe-icon">🧭</span><span class="detalhe-label">Azimute</span><span class="detalhe-valor" style="font-family:monospace;color:#ff8a65">${item.azimute}° (${obterRosaDosVentos(item.azimute)})</span></div>
            ${extrasHTML}
        `;
    }
}

// ── Estação Espacial Internacional (ISS) ─────────────────────────────────────
// A ISS chega do servidor dentro de observatorioDados.astros, com tipo "iss", e
// é desenhada e clicada como o Sol e os planetas. Tudo o que este painel mostra
// vem do céu que já está no ecrã — não pede nada a ninguém.
// Chega-se a ela de duas maneiras: clicando na ISS quando ela está no céu, ou
// pelo botão "🛰 ISS" no canto do mapa — que existe porque ela só está acima do
// horizonte cerca de 10% do tempo, e sem ele o painel ficaria quase sempre fora
// de alcance.
// (Chegou a haver aqui uma lista das passagens visíveis dos próximos 7 dias,
//  calculada no servidor. Foi retirada: nunca chegou a dar resultados.)

function astroISS() {
    // A ISS tal como está no céu de agora. A posição mostrada no painel sai
    // daqui e não da cópia que o clique guardou: essa fica desatualizada mal a
    // hora mude, e este painel é precisamente atualizado quando ela muda.
    if (!observatorioDados || !observatorioDados.astros) return null;
    return observatorioDados.astros.find(a => a.tipo === "iss") || null;
}

// Abre (ou reabre) o painel da ISS. É o que o botão "🛰 ISS" do mapa e o clique
// na própria ISS chamam — sem argumentos de propósito: a posição vem do céu
// atual, para o painel nunca mostrar um instante que já não é o do mapa.
function mostrarDetalhesISS() {
    objetoSelecionado = { id: "iss", tipo: "iss", nome: "ISS" };
    painelISS();
    agendarDesenhoObservatorio();   // desenhar o destaque à volta da ISS
}

function painelISS() {
    const painel = document.getElementById("observatorio-detalhes");
    if (!painel) return;

    // A posição é lida do céu que está no ecrã — a mesma lista de astros que o
    // mapa desenhou — e não de uma cópia guardada no clique, que fica velha mal
    // a hora mude (e este painel é precisamente atualizado quando ela muda).
    const issAgora = astroISS();

    painel.innerHTML = `
        <div class="detalhe-titulo">🛰 Estação Espacial (ISS)</div>
        ${blocoPosicaoISS(issAgora)}`;
}

function blocoPosicaoISS(iss) {
    if (!iss) {
        // Sem elementos orbitais não há posição nenhuma — é o caso de não haver
        // internet. Dizer isto é melhor do que mostrar números inventados.
        return `<p class="iss-aviso">Sem elementos orbitais da ISS: o servidor não os conseguiu
                obter. Verifica a ligação à internet e tenta outra vez.</p>`;
    }

    // Abaixo do horizonte um azimute não quer dizer nada de útil a quem olha
    // para o céu, por isso o que aparece é a razão, não o número.
    const direcao = iss.visivel
        ? `${iss.azimute}° (${obterRosaDosVentos(iss.azimute)})`
        : "abaixo do horizonte";

    return `
        <div class="detalhe-linha"><span class="detalhe-icon">📈</span><span class="detalhe-label">Altitude</span><span class="detalhe-valor" style="font-family:monospace;color:#ffcc80">${iss.altitude}°</span></div>
        <div class="detalhe-linha"><span class="detalhe-icon">🧭</span><span class="detalhe-label">Direção</span><span class="detalhe-valor" style="font-family:monospace;color:#ff8a65">${direcao}</span></div>
        <div class="detalhe-linha"><span class="detalhe-icon">📏</span><span class="detalhe-label">Distância</span><span class="detalhe-valor" style="font-family:monospace">${iss.distancia}</span></div>
        ${iss.visivel ? "" : `<p class="iss-aviso">Neste instante a ISS está abaixo do horizonte.</p>`}`;
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
        { label: "N", min: 337.5, max: 22.5 },
        { label: "NE", min: 22.5, max: 67.5 },
        { label: "E", min: 67.5, max: 112.5 },
        { label: "SE", min: 112.5, max: 157.5 },
        { label: "S", min: 157.5, max: 202.5 },
        { label: "SO", min: 202.5, max: 247.5 },
        { label: "O", min: 247.5, max: 292.5 },
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

// ── Pesquisa com "ir para" ────────────────────────────────────────
// O céu tem ~98 objetos e chegar a qualquer deles obrigava a encontrá-lo à
// vista no mapa e a clicar-lhe. Num céu cheio de pontos isso deixa de fora
// tudo o que está perto do horizonte, ou simplesmente fora do campo de visão.
// Aqui escreve-se o nome, escolhe-se, e a câmara vai lá ter.
//
// A pesquisa abre SEMPRE o painel de detalhes, mesmo quando a câmara não pode
// ir a lado nenhum (objeto abaixo do horizonte, escondido por um filtro): metade
// da utilidade é chegar aos dados, e isso não depende de ele estar no céu. O que
// não se faz é apontar em silêncio — quando não dá, o painel diz porquê.

function normalizarTexto(texto) {
    // Sem acentos e em minúsculas: quem procura "pleiades" tem de encontrar
    // "Plêiades", e quem procura "Betelgeuse" tem de encontrar a mesma coisa
    // que "betelgeuse". Mesma técnica do imagemAstro().
    return (texto || "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .trim();
}

// Um objeto do céu com a forma de uma entrada de canvas.elementosNoEcra — é o
// que o painel de detalhes sabe ler (ver mostrarDetalhesDe). Os campos x/y/raio
// não entram: só servem para o desenho e para o clique no mapa, e nada disto é
// desenhado por ser encontrado na pesquisa.
function itemEstrela(est_id, est) {
    return {
        id: est_id,
        nome: est.nome,
        tipo: "estrela",
        mag: est.mag.toFixed(2),
        altitude: est.altitude,
        azimute: est.azimute
    };
}

function itemAstro(astro) {
    return {
        id: astro.id,
        nome: astro.nome,
        tipo: astro.tipo,
        // A mesma regra do desenho: um planeta varia de brilho ao longo do ano e
        // um número fixo para ele seria inventado. A Lua e a ISS também não têm
        // magnitude no painel do desenho.
        mag: astro.tipo === "sol" ? "-26.7" : (astro.tipo === "lua" ? "-12.5" : "Variável"),
        altitude: astro.altitude,
        azimute: astro.azimute,
        emoji: astro.emoji || null,
        fase_nome: astro.fase_nome || null,
        iluminacao: astro.iluminacao || null
    };
}

function itemConstelacao(const_id, constelacao) {
    // As estrelas que a constelação toca — as mesmas que o desenho conta para o
    // "Estrelas: N" do painel (lá é um Set sobre os dois elementos de cada linha).
    const estrelasUnicas = new Set();
    constelacao.linhas.forEach(linha => {
        estrelasUnicas.add(linha[0]);
        estrelasUnicas.add(linha[1]);
    });

    return {
        id: "const_" + const_id,
        nome: constelacao.nome,
        tipo: "constelacao",
        const_id: const_id,
        numEstrelas: estrelasUnicas.size
    };
}

// O catálogo a que a pesquisa vai buscar, montado de fresco a cada tecla. Não
// custa nada (são ~98 entradas) e evita o único erro que aqui importava: uma
// lista guardada a apontar para posições de há meia hora, depois de a
// atualização automática de 30 em 30 segundos ter trocado o céu.
function indicePesquisa() {
    if (!observatorioDados) return [];

    const indice = [];

    const estrelas = observatorioDados.estrelas || {};
    for (const est_id in estrelas) {
        const est = estrelas[est_id];
        indice.push({
            item: itemEstrela(est_id, est),
            nome: normalizarTexto(est.nome),
            id: normalizarTexto(est_id)
        });
    }

    const constelacoes = observatorioDados.constelacoes || {};
    for (const const_id in constelacoes) {
        const constelacao = constelacoes[const_id];
        indice.push({
            item: itemConstelacao(const_id, constelacao),
            nome: normalizarTexto(constelacao.nome),
            id: normalizarTexto(const_id)
        });
    }

    // O Sol, a Lua, os planetas e a ISS, todos na mesma lista — é a lista
    // "astros" que o servidor envia, e a ISS vem lá dentro como os outros.
    (observatorioDados.astros || []).forEach(astro => {
        indice.push({
            item: itemAstro(astro),
            nome: normalizarTexto(astro.nome),
            id: normalizarTexto(astro.id)
        });
    });

    return indice;
}

function procurarObjetos(termo) {
    const t = normalizarTexto(termo);

    // Com uma letra só, "a" traria meio catálogo e não ajudaria ninguém a
    // escolher. Duas letras já separam Vega de Vénus.
    if (t.length < 2) return [];

    const encontrados = [];

    for (const entrada of indicePesquisa()) {
        // Procura-se pelo nome E pelo id: "gam_cas" e "Tsih" são a mesma
        // estrela, e quem vem do Skyfield conhece-a pelo primeiro.
        const posNome = entrada.nome.indexOf(t);
        const pos = posNome >= 0 ? posNome : entrada.id.indexOf(t);
        if (pos < 0) continue;

        encontrados.push({
            entrada: entrada,
            // Começa-por ganha a contém em qualquer posição: quem escreve "veg"
            // quer Vega à frente de tudo o que tenha "veg" a meio.
            comecaPor: pos === 0 ? 0 : 1,
            comprimento: entrada.nome.length
        });
    }

    encontrados.sort((a, b) =>
        a.comecaPor - b.comecaPor ||
        a.comprimento - b.comprimento ||
        a.entrada.nome.localeCompare(b.entrada.nome, "pt"));

    return encontrados.slice(0, 8).map(e => e.entrada);
}

// ── Onde apontar a câmara ─────────────────────────────────────────

// O ponto do céu de uma constelação. Devolve null quando nenhuma das suas
// estrelas está acima do horizonte.
function alvoDaConstelacao(const_id) {
    if (!observatorioDados || !observatorioDados.constelacoes || !observatorioDados.estrelas) return null;
    const constelacao = observatorioDados.constelacoes[const_id];
    if (!constelacao) return null;

    const estrelas = observatorioDados.estrelas;
    let x = 0, y = 0, z = 0, n = 0;

    // Só as estrelas que o desenho usa para o centróide: o primeiro elemento de
    // cada linha (ver desenharObservatorio). É de propósito que se copie essa
    // escolha em vez de se inventar outra — é ali que o nome da constelação é
    // escrito no ecrã, e é isso que a câmara tem de centrar.
    constelacao.linhas.forEach(linha => {
        const est = estrelas[linha[0]];
        if (!est || !est.visivel) return;

        // Média de VETORES UNITÁRIOS, não de coordenadas. Altitude e azimute são
        // ângulos, e a média deles não é o meio de nada: entre 359° e 1° daria
        // 180°, do lado oposto do céu. Somados como vetores, o resultado cai
        // sempre no sítio certo. A convenção é a do projectar().
        const altRad = est.altitude * GRAU;
        const azRad = est.azimute * GRAU;
        x += Math.cos(altRad) * Math.cos(azRad);
        y += Math.cos(altRad) * Math.sin(azRad);
        z += Math.sin(altRad);
        n++;
    });

    if (n === 0) return null;
    const comprimento = Math.hypot(x, y, z);
    if (comprimento === 0) return null;

    return {
        altitude: Math.asin(z / comprimento) / GRAU,
        azimute: (Math.atan2(y, x) / GRAU + 360) % 360
    };
}

// A posição atual de um objeto que se aponta (estrela, Sol, Lua, planeta ou
// ISS), lida do céu que está no ecrã — e não da cópia que a pesquisa guardou,
// que pode ser de antes da última atualização automática.
function posicaoAtualDe(item) {
    if (!observatorioDados) return null;

    if (item.tipo === "estrela") {
        const est = observatorioDados.estrelas ? observatorioDados.estrelas[item.id] : null;
        if (!est) return null;
        return { altitude: est.altitude, azimute: est.azimute, visivel: est.visivel, mag: est.mag };
    }

    const astro = (observatorioDados.astros || []).find(a => a.id === item.id);
    if (!astro) return null;
    return { altitude: astro.altitude, azimute: astro.azimute, visivel: astro.visivel, mag: null };
}

// A frase que explica a única impossibilidade que não depende do ecrã: a Terra
// está no meio. "Abaixo do horizonte" sozinho ainda deixa a dúvida de se é uma
// avaria ou uma impossibilidade — e é uma impossibilidade. Diz-se o que se passa
// e o que isso quer dizer para quem está a olhar para o céu.
//
// Está aqui, e não escrita à mão em cada sítio, porque é usada em dois: na
// pesquisa (alvoDeApontar) e no tour (irParaParagem, quando uma paragem desce
// entretanto). Duas cópias era garantia de ficarem diferentes.
const AVISO_CONSTELACAO_ABAIXO =
    "Esta constelação está abaixo do horizonte — não é possível observá-la neste instante.";
const AVISO_OBJETO_ABAIXO =
    "Está abaixo do horizonte — não é possível observá-lo neste instante.";

// Para onde apontar, ou porque é que não dá. Devolve:
//   { altitude, azimute }  — há para onde apontar
//   { motivo, curto }      — não há, e o motivo é para dizer no painel (a
//                            versão curta é a que cabe na lista da pesquisa)
//   { motivo: null }       — não há nada a dizer (a ISS abaixo do horizonte já
//                            o diz no seu próprio painel; repeti-lo era ruído)
//
// A ordem dos motivos é a ordem em que eles se aplicam de fora para dentro: um
// objeto abaixo do horizonte está fora do céu, e é isso que interessa saber
// primeiro; só depois é que faz sentido falar dos filtros do ecrã.
function alvoDeApontar(item) {
    if (!observatorioDados) return { motivo: null };

    if (item.tipo === "constelacao") {
        const alvo = alvoDaConstelacao(item.const_id);
        if (!alvo) {
            return { motivo: AVISO_CONSTELACAO_ABAIXO, curto: "abaixo do horizonte" };
        }
        const caixa = document.getElementById("chk-constelacoes");
        if (caixa && !caixa.checked) {
            return {
                motivo: "As linhas das constelações estão escondidas em Controlos → Linhas de Constelações.",
                curto: "escondida pelos filtros"
            };
        }
        return alvo;
    }

    const posicao = posicaoAtualDe(item);
    if (!posicao) return { motivo: null };

    if (!posicao.visivel) {
        // A ISS já escreve isto no seu painel; nos outros objetos é aqui que
        // se fica a saber.
        return item.tipo === "iss"
            ? { motivo: null }
            : { motivo: AVISO_OBJETO_ABAIXO, curto: "abaixo do horizonte" };
    }

    if (item.tipo === "estrela") {
        const limite = parseFloat(document.getElementById("rng-mag").value);
        if (posicao.mag > limite) {
            return {
                motivo: `Está abaixo do filtro de brilho (Mag ≤ ${limite.toFixed(1)}) e por isso não aparece no mapa.`,
                curto: "escondida pelos filtros"
            };
        }
    } else {
        const caixa = document.getElementById("chk-astros");
        if (caixa && !caixa.checked) {
            return {
                motivo: "O Sol, a Lua e os planetas estão escondidos em Controlos → Sol, Lua e Planetas.",
                curto: "escondido pelos filtros"
            };
        }
    }

    return { altitude: posicao.altitude, azimute: posicao.azimute };
}

function rotuloTipo(item) {
    switch (item.tipo) {
        case "estrela": return "Estrela";
        case "constelacao": return "Constelação";
        case "sol": return "Sol";
        case "lua": return "Lua";
        case "planeta": return "Planeta";
        case "iss": return "ISS";
        default: return item.tipo;
    }
}

// ── Ir para ───────────────────────────────────────────────────────

function irParaResultado(i) {
    const entrada = resultadosPesquisa[i];
    if (entrada) irPara(entrada);
}

function irPara(entrada) {
    if (!entrada) return;

    // O alvo é resolvido ANTES de o painel ser escrito, porque é ele que traz o
    // motivo de não haver para onde apontar — e esse motivo entra dentro do
    // painel, debaixo do título. (Antes era acrescentado ao fim do painel já
    // escrito, e com a imagem de uma constelação à frente ficava fora da área
    // visível: um aviso que não se vê é o mesmo que um aviso que não existe.)
    const alvo = alvoDeApontar(entrada.item);

    // O painel abre sempre, mesmo quando não há para onde apontar.
    objetoSelecionado = entrada.item;
    mostrarDetalhesDe(entrada.item, alvo.motivo || null);

    if (alvo.altitude !== undefined) {
        animarCameraPara(alvo.azimute, alvo.altitude);
    }

    agendarDesenhoObservatorio();
    fecharResultados();

    // O texto fica no campo (apagá-lo obrigaria a reescrevê-lo para procurar
    // outra coisa parecida), mas o foco sai: no telemóvel é isto que fecha o
    // teclado e deixa ver o céu.
    const campo = document.getElementById("obs-pesquisa");
    if (campo) campo.blur();
}

// ── A lista de resultados ─────────────────────────────────────────

let resultadosPesquisa = [];
let resultadoAtivo = -1;

function aoEscreverPesquisa() {
    const campo = document.getElementById("obs-pesquisa");
    if (!campo) return;

    resultadosPesquisa = procurarObjetos(campo.value);
    resultadoAtivo = resultadosPesquisa.length > 0 ? 0 : -1;
    mostrarResultados();
}

function mostrarResultados() {
    const caixa = document.getElementById("obs-pesquisa-resultados");
    const campo = document.getElementById("obs-pesquisa");
    if (!caixa || !campo) return;

    if (normalizarTexto(campo.value).length < 2) {
        // Com menos de duas letras não há lista que sirva. O aviso só aparece
        // quando já se escreveu alguma coisa: em branco não há nada a explicar.
        caixa.innerHTML = campo.value.trim()
            ? `<p class="obs-resultado-vazio">Escreve mais uma letra…</p>`
            : "";
        return;
    }

    if (resultadosPesquisa.length === 0) {
        caixa.innerHTML = `<p class="obs-resultado-vazio">Nada encontrado com esse nome.</p>`;
        return;
    }

    caixa.innerHTML = resultadosPesquisa.map((entrada, i) => {
        const alvo = alvoDeApontar(entrada.item);
        // Dizer na lista que um resultado está abaixo do horizonte evita o
        // clique que não faz nada e parece avaria.
        const nota = alvo.curto ? ` · ${alvo.curto}` : "";
        return `<button type="button" class="obs-resultado${i === resultadoAtivo ? " ativo" : ""}"
            onclick="irParaResultado(${i})">
            <span class="obs-resultado-nome">${entrada.item.nome}</span>
            <span class="obs-resultado-tipo">${rotuloTipo(entrada.item)}${nota}</span>
        </button>`;
    }).join("");
}

function fecharResultados() {
    const caixa = document.getElementById("obs-pesquisa-resultados");
    if (caixa) caixa.innerHTML = "";
    resultadosPesquisa = [];
    resultadoAtivo = -1;
}

function tratarTeclaPesquisa(e) {
    if (e.key === "Escape") {
        fecharResultados();
        e.target.blur();
        return;
    }

    if (resultadosPesquisa.length === 0) return;

    if (e.key === "ArrowDown") {
        e.preventDefault();
        resultadoAtivo = (resultadoAtivo + 1) % resultadosPesquisa.length;
        mostrarResultados();
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        resultadoAtivo = (resultadoAtivo - 1 + resultadosPesquisa.length) % resultadosPesquisa.length;
        mostrarResultados();
    } else if (e.key === "Enter") {
        e.preventDefault();
        if (resultadoAtivo >= 0) irParaResultado(resultadoAtivo);
    }
}

// ── Tour guiado ───────────────────────────────────────────────────
// Uma visita às constelações que estão acima do horizonte, uma a uma. O texto
// de cada paragem é a curiosidade que já existe em CURIOSIDADES_CONSTELACOES —
// não há aqui conteúdo novo, só uma maneira de o percorrer.

const DURACAO_PARAGEM_TOUR = 12000;   // ms em cada constelação

// Estado do tour, ou null quando não há nenhum a decorrer. Ser um objeto só, e
// nunca duas variáveis soltas, é o que torna impossível haver dois tours ao
// mesmo tempo: quem começa um manda parar o anterior primeiro.
//   paragens — abreviaturas das constelações, pela ordem da visita
//   indice   — a paragem atual
//   pausado  — true quando o tempo está parado
//   idTimer  — o setTimeout que faz avançar a paragem
let tourObs = null;

function nomeDaConstelacao(const_id) {
    const constelacoes = observatorioDados && observatorioDados.constelacoes;
    return (constelacoes && constelacoes[const_id]) ? constelacoes[const_id].nome : const_id;
}

function mostrarBarraTour() {
    const barra = document.getElementById("tour-barra");
    if (barra) barra.classList.add("visivel");
}

function esconderBarraTour() {
    const barra = document.getElementById("tour-barra");
    if (barra) barra.classList.remove("visivel");
}

function atualizarBarraTour() {
    if (!tourObs) return;

    const estado = document.getElementById("tour-estado");
    if (estado) {
        estado.textContent = `${tourObs.indice + 1} de ${tourObs.paragens.length} · ` +
            nomeDaConstelacao(tourObs.paragens[tourObs.indice]);
    }

    const pausa = document.getElementById("btn-tour-pausa");
    if (pausa) {
        pausa.textContent = tourObs.pausado ? "▶" : "⏸";
        pausa.title = tourObs.pausado ? "Retomar" : "Pausar";
    }
}

function iniciarTour() {
    // Um tour de cada vez. Carregar em ▶ outra vez é o que se espera que
    // recomece — e sem esta linha ficavam dois temporizadores a avançar
    // paragens, cada um por seu lado.
    pararTour();

    const constelacoes = (observatorioDados && observatorioDados.constelacoes) || {};
    const paragens = [];

    for (const const_id in constelacoes) {
        // Só entram as que têm, agora, pelo menos uma estrela acima do
        // horizonte: uma paragem a apontar para o chão não é uma paragem.
        //
        // O que NÃO se testa aqui é o "Linhas de Constelações" dos Controlos.
        // É de propósito: o tour é para ler as curiosidades, e uma visita que
        // se recusasse a arrancar porque o utilizador escondeu as linhas seria
        // uma recusa incompreensível — o painel escreve o nome da constelação e
        // a câmara aponta ao sítio certo à mesma. (No "ir para", aí sim, o
        // filtro conta: lá o que se pede é ir ter com uma coisa que se está a
        // ver, e vale mais dizer que ela está escondida do que fingir que não.)
        const alvo = alvoDaConstelacao(const_id);
        if (alvo) paragens.push({ const_id: const_id, altitude: alvo.altitude });
    }

    if (paragens.length === 0) {
        mostrarAvisoSemTour();
        return;
    }

    // Da mais alta para a mais baixa: começa-se pelo que está melhor colocado
    // no céu e o que anda a raspar o horizonte fica para o fim.
    paragens.sort((a, b) => b.altitude - a.altitude);

    tourObs = {
        // Só as abreviaturas. As posições são recalculadas no início de cada
        // paragem: a atualização automática de 30 em 30 segundos troca o céu
        // inteiro, e uma lista de posições guardadas depressa estaria a apontar
        // para onde as coisas estavam quando o tour começou.
        paragens: paragens.map(p => p.const_id),
        indice: 0,
        pausado: false,
        idTimer: null
    };

    mostrarBarraTour();
    irParaParagem(0);
}

// Termina o tour, se houver um a andar. É feito para poder ser chamado às
// cegas: o ✕, o fim da lista de paragens, o ▶ outra vez, a mudança de hora
// simulada e a saída do ecrã chamam todos isto sem saber se há tour nenhum.
function pararTour() {
    // Tem de se saber se havia tour ANTES de o apagar: é esta linha que separa
    // "o tour acabou" de "alguém chamou isto sem tour nenhum a andar". Sem ela,
    // a mudança da hora simulada — que também passa por aqui — atirava a câmara
    // para o Norte de cada vez que se mexia no relógio.
    const haviaTour = tourObs !== null;

    if (haviaTour && tourObs.idTimer !== null) clearTimeout(tourObs.idTimer);
    tourObs = null;
    esconderBarraTour();

    if (haviaTour) {
        // O tour acabou: a vista volta ao ponto de partida do Observatório — o
        // Norte a 15° de altitude, os mesmos CAMERA_AZ_INICIAL/CAMERA_ALT_INICIAL
        // com que o céu abre. Acaba-se onde se começou, em vez de se deixar a
        // câmara parada na última constelação da lista, que foi onde o sorteio
        // das paragens a deixou e não uma escolha de quem estava a ver.
        //
        // Isto também corre ao sair do ecrã (mudarEcra passa por aqui) e é de
        // propósito: a viagem não se vê, mas quem voltar ao Observatório
        // encontra-o no princípio, em vez de apontado a um sítio que já esqueceu.
        //
        // O ▶ que interrompe um tour a andar também passa por aqui; a viagem que
        // ele arranca logo a seguir cancela esta antes do primeiro fotograma, por
        // isso o desvio é invisível.
        animarCameraPara(CAMERA_AZ_INICIAL, CAMERA_ALT_INICIAL);
    } else {
        // Sem tour, mas pode estar uma viagem do "ir para" a meio. Aqui não há
        // viagem nenhuma para começar, por isso cancela-se e pronto: é isto que
        // impede a câmara de continuar a andar num ecrã que já ninguém vê.
        cancelarAnimacaoCamera();
    }
}

function irParaParagem(i) {
    if (!tourObs) return;

    // Passar da última paragem termina o tour, em vez de voltar ao princípio.
    // Um tour que recomeça sozinho nunca acaba — quem o quiser repetir carrega
    // em ▶ outra vez.
    if (i >= tourObs.paragens.length) {
        pararTour();
        return;
    }

    // O temporizador da paragem anterior é sempre cancelado antes de armar o
    // novo. É isto que garante que existe um só, venha-se aqui pelo tempo, pelo
    // › ou pelo ‹.
    if (tourObs.idTimer !== null) clearTimeout(tourObs.idTimer);
    tourObs.idTimer = null;
    tourObs.indice = i;

    const const_id = tourObs.paragens[i];
    const constelacoes = observatorioDados && observatorioDados.constelacoes;
    const constelacao = constelacoes ? constelacoes[const_id] : null;

    if (constelacao) {
        const item = itemConstelacao(const_id, constelacao);
        const alvo = alvoDaConstelacao(const_id);

        // Sem alvo (as estrelas desceram entretanto — a atualização automática
        // pode ter trocado o céu a meio do tour): a curiosidade fica à vista, o
        // aviso diz por que é que a câmara não se mexeu, e a lista de paragens
        // não é refeita debaixo dos pés de quem está a ver o tour.
        //
        // Aqui não se pergunta pelos filtros do ecrã (ao contrário do
        // alvoDeApontar): o tour não depende deles — mostra as constelações
        // mesmo com as linhas escondidas —, e por isso não pode recusar-se a
        // apontar por causa de uma caixa que ele próprio ignora.
        objetoSelecionado = item;
        mostrarDetalhesDe(item, alvo ? null : AVISO_CONSTELACAO_ABAIXO);

        if (alvo) animarCameraPara(alvo.azimute, alvo.altitude);

        agendarDesenhoObservatorio();
    }

    atualizarBarraTour();

    if (!tourObs.pausado) {
        tourObs.idTimer = setTimeout(paragemSeguinte, DURACAO_PARAGEM_TOUR);
    }
}

function paragemSeguinte() {
    if (!tourObs) return;
    irParaParagem(tourObs.indice + 1);
}

function paragemAnterior() {
    if (!tourObs) return;
    irParaParagem(Math.max(0, tourObs.indice - 1));
}

function alternarPausaTour() {
    if (!tourObs) return;

    tourObs.pausado = !tourObs.pausado;

    if (tourObs.pausado) {
        // O tempo já decorrido nesta paragem não conta: ao retomar, a contagem
        // começa do zero. Guardá-lo obrigaria a registar o instante de arranque
        // e a descontar a pausa, para nada — quem carrega em ⏸ quer tempo para
        // ler o que está no painel.
        if (tourObs.idTimer !== null) clearTimeout(tourObs.idTimer);
        tourObs.idTimer = null;
    } else {
        tourObs.idTimer = setTimeout(paragemSeguinte, DURACAO_PARAGEM_TOUR);
    }

    atualizarBarraTour();
}

function mostrarAvisoSemTour() {
    const painel = document.getElementById("observatorio-detalhes");
    if (!painel) return;

    objetoSelecionado = null;
    painel.innerHTML = `
        <div class="detalhe-titulo">🧭 Tour guiado</div>
        <p class="obs-aviso-ir">Não há nenhuma constelação acima do horizonte neste instante, por isso não há por onde passear. Experimenta outra hora em Controlos → Simular Data/Hora.</p>
    `;

    agendarDesenhoObservatorio();
}

// ── Auto-refresh ──────────────────────────────────────────────────
// Atualiza dados se o ecrã ativo for o Céu Agora ou o Observatório.
// No observatório, só atualiza se estiver em tempo real (sem simulação).
function autoRefresh() {
    if (document.getElementById("ecra-ceu").classList.contains("ativo")) {
        carregarCeu();
    } else if (document.getElementById("ecra-observatorio").classList.contains("ativo")) {
        // Só auto-atualiza em tempo real — numa simulação o céu é fixo,
        // e esse mesmo céu simulado é o que o VR está a mostrar.
        if (!tempoSimuladoObs) carregarObservatorio();
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
    inicializarSeletorHora();
    mudarEcra("observatorio");
} else if (pagina === "/apod") {
    mudarEcra("apod");
} else {
    mudarEcra("ceu");
}

// Inicializa o seletor quando o utilizador navega para o observatório
const _mudarEcraOriginal = mudarEcra;
window.mudarEcra = function (nome) {
    // O tour vive do céu do Observatório e da barra que lhe pertence: sair do
    // ecrã tem de o terminar. Sem isto continuava a correr às escondidas, a
    // escrever no painel e a mexer na câmara de um ecrã que já não está à vista.
    if (nome !== "observatorio") pararTour();

    _mudarEcraOriginal(nome);
    if (nome === "observatorio") inicializarSeletorHora();
};

setTimeout(autoRefresh, 30000);
document.getElementById("musica").volume = 0.4;
