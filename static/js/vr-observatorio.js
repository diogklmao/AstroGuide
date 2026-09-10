// ── Observatório VR — Fase 1: esqueleto da cena 3D (sem WebXR ainda) ──────
// Reutiliza o THREE já carregado globalmente (mesmo usado em three-bg.js).
// Não toca em nada do Observatório 2D existente (index.js / desenharObservatorio).

let vrIniciado = false;
let vrScene, vrCamera, vrRenderer;

// Garante que o THREE está disponível, independentemente de other scripts (ex: three-bg.js)
// o terem carregado ou não. Se já existir globalmente, usa-o; senão, carrega o CDN sozinho.
function garantirTHREE(callback) {
    if (typeof THREE !== "undefined") {
        callback();
        return;
    }
    const jaExiste = document.querySelector('script[src*="three@0.160.0"]');
    if (jaExiste) {
        // Já está a ser carregado por outro sítio — espera que termine
        jaExiste.addEventListener("load", callback);
        return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js";
    script.onload = callback;
    document.head.appendChild(script);
}

// Orientação da câmara (ângulos, em radianos) — controlados por arrasto do rato
let vrYaw = 0;   // rotação horizontal (olhar para a esquerda/direita)
let vrPitch = 0; // rotação vertical (olhar para cima/baixo)

// Estado do arrasto do rato
let vrArrastando = false;
let vrStartX = 0, vrStartY = 0;
let vrStartYaw = 0, vrStartPitch = 0;

function iniciarCenaVR() {
    const canvas = document.getElementById("vr-canvas");
    if (!canvas || typeof THREE === "undefined") return;

    vrScene = new THREE.Scene();

    // Câmara no centro da "cúpula celeste" — é o observador
    vrCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    vrCamera.position.set(0, 0, 0);
    vrCamera.rotation.order = "YXZ"; // yaw (Y) aplicado antes de pitch (X), evita "roll" indesejado

    vrRenderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    vrRenderer.setPixelRatio(window.devicePixelRatio);
    vrRenderer.setClearColor(0x01020a, 1); // mesmo tom escuro do céu do Observatório 2D

    redimensionarCanvasVR();

    // Estrelas e constelações reais, vindas do mesmo /api/observatorio que o Observatório 2D usa
    carregarDadosVR();

    // Controlo por arrasto do rato — mesma ideia do drag do Observatório 2D
    canvas.addEventListener("mousedown", vrIniciarArrasto);
    window.addEventListener("mousemove", vrMoverArrasto);
    window.addEventListener("mouseup", vrTerminarArrasto);
    window.addEventListener("resize", () => {
        if (document.body.classList.contains("vr-ativo")) redimensionarCanvasVR();
    });

    vrIniciado = true;
    vrAnimar();
}

// Ajusta o canvas e a câmara ao tamanho do ecrã inteiro — chamado ao entrar no
// ecrã VR e sempre que a janela muda de tamanho enquanto lá estamos.
function redimensionarCanvasVR() {
    if (!vrRenderer || !vrCamera) return;
    const largura = window.innerWidth;
    const altura = window.innerHeight;

    vrRenderer.setSize(largura, altura, false);
    vrCamera.aspect = largura / altura;
    vrCamera.updateProjectionMatrix();
}

const RAIO_CEU_VR = 500; // distância fixa da "cúpula celeste" à volta do observador

// Converte altitude/azimute (graus) — o mesmo sistema de coordenadas que o
// Observatório 2D já usa — numa posição 3D real do Three.js.
// Norte (az=0°) fica em -Z, que é a direção "em frente" por defeito da câmara.
function altAzParaXYZ(altGraus, azGraus, raio) {
    const alt = altGraus * Math.PI / 180;
    const az = azGraus * Math.PI / 180;
    const x = raio * Math.cos(alt) * Math.sin(az);
    const y = raio * Math.sin(alt);
    const z = -raio * Math.cos(alt) * Math.cos(az);
    return new THREE.Vector3(x, y, z);
}

// Busca os dados reais ao mesmo endpoint que o Observatório 2D já usa —
// zero duplicação da lógica astronómica do sky_engine.py.
async function carregarDadosVR() {
    try {
        const res = await fetch("/api/observatorio");
        const dados = await res.json();
        desenharEstrelasVR(dados);
        desenharConstelacoesVR(dados);
    } catch (err) {
        console.error("Erro ao carregar dados do Observatório VR:", err);
    }
}

function desenharEstrelasVR(dados) {
    const posicoes = [];
    for (const id in dados.estrelas) {
        const est = dados.estrelas[id];
        const p = altAzParaXYZ(est.altitude, est.azimute, RAIO_CEU_VR);
        posicoes.push(p.x, p.y, p.z);
    }

    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute("position", new THREE.Float32BufferAttribute(posicoes, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2.5,
        sizeAttenuation: false // mantém o tamanho constante, como estrelas "no infinito"
    });

    vrScene.add(new THREE.Points(geometria, material));
}

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

function vrIniciarArrasto(e) {
    vrArrastando = true;
    vrStartX = e.clientX;
    vrStartY = e.clientY;
    vrStartYaw = vrYaw;
    vrStartPitch = vrPitch;
}

function vrMoverArrasto(e) {
    if (!vrArrastando) return;
    const dx = e.clientX - vrStartX;
    const dy = e.clientY - vrStartY;
    const sensibilidade = 0.005;

    vrYaw = vrStartYaw - dx * sensibilidade;
    vrPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, vrStartPitch - dy * sensibilidade));
}

function vrTerminarArrasto() {
    vrArrastando = false;
}

function vrAnimar() {
    if (!vrRenderer) return; // segurança: para se a cena ainda não foi criada

    vrCamera.rotation.y = vrYaw;
    vrCamera.rotation.x = vrPitch;

    vrRenderer.render(vrScene, vrCamera);
    requestAnimationFrame(vrAnimar);
}

// Chamado pelo mudarEcra() do index.js quando o utilizador abre a aba VR
function carregarVR() {
    if (!vrIniciado) {
        garantirTHREE(iniciarCenaVR);
    }
}