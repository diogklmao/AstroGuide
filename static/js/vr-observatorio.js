// ── Observatório VR — Fase 2: WebXR (Meta Quest 3) ─────────────────────────
// Suporte nativo a WebXR (immersive-vr) usando renderer.xr do Three.js r160.
// Continua a funcionar no navegador normal (PC) com arrasto do rato.
// Não depende de addons (examples/jsm) — usa a API WebXR integrada no Three.

let vrIniciado = false;
let vrScene, vrCamera, vrRenderer;
let vrSessaoAtiva = false; // true enquanto uma sessão XR (headset) está aberta

// Garante que o THREE está disponível, independentemente de outros scripts
// o terem carregado ou não. Se já existir globalmente, usa-o; senão, carrega o CDN.
function garantirTHREE(callback) {
    if (typeof THREE !== "undefined") {
        callback();
        return;
    }
    const jaExiste = document.querySelector('script[src*="three@0.160.0"]');
    if (jaExiste) {
        jaExiste.addEventListener("load", callback);
        return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js";
    script.onload = callback;
    document.head.appendChild(script);
}

// Orientação da câmara (radianos) — controlados por arrasto do rato no modo PC
let vrYaw = 0;
let vrPitch = 0;

// Estado do arrasto do rato
let vrArrastando = false;
let vrStartX = 0, vrStartY = 0;
let vrStartYaw = 0, vrStartPitch = 0;

const RAIO_CEU_VR = 500; // distância da "cúpula celeste" ao observador

// ── Iniciar a cena ──────────────────────────────────────────────────────────
function iniciarCenaVR() {
    const canvas = document.getElementById("vr-canvas");
    if (!canvas || typeof THREE === "undefined") return;

    vrScene = new THREE.Scene();

    vrCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    vrCamera.position.set(0, 0, 0);
    vrCamera.rotation.order = "YXZ";

    vrRenderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    vrRenderer.setPixelRatio(window.devicePixelRatio);
    vrRenderer.setClearColor(0x01020a, 1);

    // ── Ativar suporte WebXR para o Meta Quest 3 ──
    vrRenderer.xr.enabled = true;
    vrRenderer.xr.setReferenceSpaceType("local-floor"); // utilizador de pé, no chão

    redimensionarCanvasVR();

    // Fundo panorâmico da Via Láctea (space.jpg já usado no Observatório 2D)
    adicionarFundoViaLactea();

    // Estrelas, constelações e astros reais, vindos do mesmo /api/observatorio
    carregarDadosVR();

    // Controladores das mãos (Meta Quest Touch) com laser pointer
    criarControladoresVR();

    // Controlo por arrasto do rato (modo PC / navegador sem headset)
    canvas.addEventListener("mousedown", vrIniciarArrasto);
    window.addEventListener("mousemove", vrMoverArrasto);
    window.addEventListener("mouseup", vrTerminarArrasto);
    window.addEventListener("resize", () => {
        if (document.body.classList.contains("vr-ativo")) redimensionarCanvasVR();
    });

    // Estado da sessão XR — esconde/mostra a interface e a rotação por rato
    vrRenderer.xr.addEventListener("sessionstart", () => {
        vrSessaoAtiva = true;
        document.body.classList.add("vr-sessao");
    });
    vrRenderer.xr.addEventListener("sessionend", () => {
        vrSessaoAtiva = false;
        document.body.classList.remove("vr-sessao");
    });

    configurarBotaoVR();

    vrIniciado = true;
    vrRenderer.setAnimationLoop(vrAnimar); // funciona em modo normal E em XR
}

// ── Fundo imersivo da Via Láctea ────────────────────────────────────────────
function adicionarFundoViaLactea() {
    const loader = new THREE.TextureLoader();
    loader.load("/static/images/space.jpg", (textura) => {
        const geometria = new THREE.SphereGeometry(RAIO_CEU_VR * 1.7, 48, 32);
        const material = new THREE.MeshBasicMaterial({
            map: textura,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.30,
            depthWrite: false
        });
        vrScene.add(new THREE.Mesh(geometria, material));
    });
}

// ── Ajustar canvas e câmara ao ecrã (apenas no modo PC; no XR o próprio motor gere) ──
function redimensionarCanvasVR() {
    if (!vrRenderer || !vrCamera) return;
    if (vrSessaoAtiva) return;
    const largura = window.innerWidth;
    const altura = window.innerHeight;
    vrRenderer.setSize(largura, altura, false);
    vrCamera.aspect = largura / altura;
    vrCamera.updateProjectionMatrix();
}

// ── Conversão alt/az → coordenadas 3D (mesmo sistema do Observatório 2D) ────
// Norte (az=0°) fica em -Z, que é a direção "em frente" da câmara.
function altAzParaXYZ(altGraus, azGraus, raio) {
    const alt = altGraus * Math.PI / 180;
    const az = azGraus * Math.PI / 180;
    const x = raio * Math.cos(alt) * Math.sin(az);
    const y = raio * Math.sin(alt);
    const z = -raio * Math.cos(alt) * Math.cos(az);
    return new THREE.Vector3(x, y, z);
}

// ── Dados reais do céu ──────────────────────────────────────────────────────
async function carregarDadosVR() {
    try {
        const res = await fetch("/api/observatorio");
        const dados = await res.json();
        desenharEstrelasVR(dados);
        desenharConstelacoesVR(dados);
        desenharAstrosVR(dados);
    } catch (err) {
        console.error("Erro ao carregar dados do Observatório VR:", err);
    }
}

// ── Estrelas ────────────────────────────────────────────────────────────────
function desenharEstrelasVR(dados) {
    const posicoes = [];
    const cores = [];
    for (const id in dados.estrelas) {
        const est = dados.estrelas[id];
        const p = altAzParaXYZ(est.altitude, est.azimute, RAIO_CEU_VR);
        posicoes.push(p.x, p.y, p.z);
        // Estrelas mais brilhantes (mag menor) ligeiramente mais azuladas
        const mag = est.magnitude || 2;
        const brilho = Math.max(0.4, 1 - (mag + 1.5) / 7);
        cores.push(0.75 + 0.25 * brilho, 0.80 + 0.20 * brilho, brilho);
    }

    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute("position", new THREE.Float32BufferAttribute(posicoes, 3));
    geometria.setAttribute("color", new THREE.Float32BufferAttribute(cores, 3));

    const material = new THREE.PointsMaterial({
        vertexColors: true,
        size: 2.5,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0.95
    });

    vrScene.add(new THREE.Points(geometria, material));
}

// ── Constelações ────────────────────────────────────────────────────────────
function desenharConstelacoesVR(dados) {
    const posicoes = [];
    const estrelas = dados.estrelas;

    for (const id in dados.constelacoes) {
        dados.constelacoes[id].linhas.forEach(linha => {
            const a = estrelas[linha[0]];
            const b = estrelas[linha[1]];
            if (!a || !b) return;
            const pa = altAzParaXYZ(a.altitude, a.azimute, RAIO_CEU_VR);
            const pb = altAzParaXYZ(b.altitude, b.azimute, RAIO_CEU_VR);
            posicoes.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z);
        });
    }

    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute("position", new THREE.Float32BufferAttribute(posicoes, 3));

    const material = new THREE.LineBasicMaterial({
        color: 0x6eb8ff,
        transparent: true,
        opacity: 0.45
    });

    vrScene.add(new THREE.LineSegments(geometria, material));
}

// ── Sol, Lua e Planetas em 3D (sprites com as mesmas imagens do Observatório 2D) ──
// Escalas em unidades do mundo, com o céu a RAIO_CEU_VR=500 do observador.
const IMAGENS_ASTROS_VR = {
    "Sol":      { src: "/static/images/sun.png",         escala: 12 },
    "Lua":      { src: "/static/images/moon_render.png", escala: 5 },
    "Mercúrio": { src: "/static/images/mercury.png",     escala: 2.2 },
    "Vénus":    { src: "/static/images/venus.png",       escala: 3.4 },
    "Marte":    { src: "/static/images/mars.png",        escala: 2.6 },
    "Júpiter":  { src: "/static/images/jupiter.png",     escala: 6.5 },
    "Saturno":  { src: "/static/images/saturn.png",      escala: 6.0 },
    "Úrano":    { src: "/static/images/uranus.png",      escala: 4.4 },
    "Neptuno":  { src: "/static/images/neptune.png",     escala: 4.2 }
};

function desenharAstrosVR(dados) {
    const grupo = new THREE.Group();
    const loader = new THREE.TextureLoader();

    dados.astros.forEach(astro => {
        if (!astro.visivel) return; // astros abaixo do horizonte não aparecem

        const cfg = IMAGENS_ASTROS_VR[astro.nome] ||
            IMAGENS_ASTROS_VR[astro.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "")];
        if (!cfg) return;

        loader.load(cfg.src, (textura) => {
            const material = new THREE.SpriteMaterial({
                map: textura,
                transparent: true,
                depthWrite: false,
                depthTest: true
            });
            if (astro.tipo === "sol") {
                // Sol com brilho forte — mistura aditiva
                material.blending = THREE.AdditiveBlending;
                material.opacity = 0.95;
            }

            const sprite = new THREE.Sprite(material);
            const p = altAzParaXYZ(astro.altitude, astro.azimute, RAIO_CEU_VR);
            sprite.position.copy(p);
            const s = cfg.escala;
            sprite.scale.set(s, s, 1);
            grupo.add(sprite);
        });
    });

    vrScene.add(grupo);
}

// ── Controladores VR (Meta Quest Touch) com laser pointer ───────────────────
function criarControladoresVR() {
    for (let i = 0; i < 2; i++) {
        const controlador = vrRenderer.xr.getController(i);

        // Linha de laser — aponta ao longo de -Z (direção do ray) do controlador
        const laser = criarLaser(0x6eb8ff);
        controlador.add(laser);

        // Ponta da mira no fim do laser
        const ponta = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x9ed4ff, transparent: true, opacity: 0.9 })
        );
        ponta.position.z = -120;
        controlador.add(ponta);

        // "Clique" (gatilho) acende o laser a branco — feedback de interação
        controlador.addEventListener("selectstart", () => {
            laser.material.color.setHex(0xffffff);
            ponta.material.color.setHex(0xffcc02);
        });
        controlador.addEventListener("selectend", () => {
            laser.material.color.setHex(0x6eb8ff);
            ponta.material.color.setHex(0x9ed4ff);
        });

        vrScene.add(controlador);
    }
}

function criarLaser(cor) {
    const pontos = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -120)];
    const geometria = new THREE.BufferGeometry().setFromPoints(pontos);
    const material = new THREE.LineBasicMaterial({
        color: cor,
        transparent: true,
        opacity: 0.55
    });
    return new THREE.Line(geometria, material);
}

// ── Botão "Entrar no VR" ────────────────────────────────────────────────────
function configurarBotaoVR() {
    const botao = document.getElementById("btn-iniciar-vr");
    const ajuda = document.getElementById("vr-ajuda");
    if (!botao) return;

    if (!navigator.xr) {
        mostrarVRIndisponivel(botao, ajuda, "Este navegador não suporta WebXR.");
        return;
    }

    navigator.xr.isSessionSupported("immersive-vr")
        .then(suportado => {
            if (suportado) {
                botao.disabled = false;
                botao.classList.remove("indisponivel");
                ajuda.textContent = "Compatível com Meta Quest 3 — entra no Observatório em realidade virtual.";
            } else {
                mostrarVRIndisponivel(botao, ajuda,
                    "O modo de imersão VR (immersive-vr) não está disponível neste dispositivo. Usa o rato para olhar à volta.");
            }
        })
        .catch(() => mostrarVRIndisponivel(botao, ajuda, "Erro ao verificar o suporte WebXR."));
}

function mostrarVRIndisponivel(botao, ajuda, mensagem) {
    botao.disabled = true;
    botao.classList.add("indisponivel");
    ajuda.textContent = mensagem;
}

// Inicia a sessão VR no headset (chamado pelo botão "Entrar no VR")
let vrSessaoXR = null; // referência da sessão XR ativa (para a poder terminar)
async function iniciarSessaoVR() {
    if (!vrRenderer || !navigator.xr) return;
    const botao = document.getElementById("btn-iniciar-vr");
    if (botao) botao.disabled = true;

    try {
        const sessao = await navigator.xr.requestSession("immersive-vr", {
            optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"]
        });
        await vrRenderer.xr.setSession(sessao);
        vrSessaoXR = sessao;
    } catch (err) {
        console.error("Falha ao iniciar sessão VR:", err);
        if (botao) {
            botao.disabled = false;
            const ajuda = document.getElementById("vr-ajuda");
            if (ajuda) ajuda.textContent = "Não foi possível entrar em VR: " + err.message;
        }
    }
}

// Termina a sessão XR, se houver uma ativa (chamado ao sair do ecrã VR)
function sairSessaoVR() {
    if (vrSessaoXR) {
        const sessao = vrSessaoXR;
        vrSessaoXR = null;
        sessao.end().catch(err => console.error("Erro ao terminar sessão VR:", err));
    }
}

// ── Arrasto do rato (modo PC) ───────────────────────────────────────────────
function vrIniciarArrasto(e) {
    if (vrSessaoAtiva) return;
    vrArrastando = true;
    vrStartX = e.clientX;
    vrStartY = e.clientY;
    vrStartYaw = vrYaw;
    vrStartPitch = vrPitch;
}

function vrMoverArrasto(e) {
    if (!vrArrastando || vrSessaoAtiva) return;
    const dx = e.clientX - vrStartX;
    const dy = e.clientY - vrStartY;
    const sensibilidade = 0.005;

    vrYaw = vrStartYaw - dx * sensibilidade;
    vrPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, vrStartPitch - dy * sensibilidade));
}

function vrTerminarArrasto() {
    vrArrastando = false;
}

// ── Ciclo de animação (normal e XR) ─────────────────────────────────────────
function vrAnimar() {
    if (!vrRenderer) return;

    // Fora de uma sessão XR, a câmara é controlada pelo rato
    if (!vrSessaoAtiva) {
        vrCamera.rotation.y = vrYaw;
        vrCamera.rotation.x = vrPitch;
    }

    vrRenderer.render(vrScene, vrCamera);
}

// Chamado pelo mudarEcra() do index.js quando o utilizador abre a aba VR
function carregarVR() {
    if (!vrIniciado) {
        garantirTHREE(iniciarCenaVR);
    }
}