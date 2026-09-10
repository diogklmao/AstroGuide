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

    // ── Referências temporárias, só para confirmar que a cena roda bem ──
    // (isto desaparece quando ligarmos as estrelas reais na próxima etapa)
    const esferaRef = new THREE.Mesh(
        new THREE.SphereGeometry(80, 16, 12),
        new THREE.MeshBasicMaterial({ color: 0x1a3a5a, wireframe: true, transparent: true, opacity: 0.25 })
    );
    vrScene.add(esferaRef);

    // Cubo marcador no ponto Norte (az=0°, alt=0°) — confirma a orientação inicial
    const marcadorNorte = new THREE.Mesh(
        new THREE.BoxGeometry(3, 3, 3),
        new THREE.MeshBasicMaterial({ color: 0xff8f00 })
    );
    marcadorNorte.position.set(0, 0, -60); // Norte = -Z, ver função altAzParaPosicao() (próxima etapa)
    vrScene.add(marcadorNorte);

    redimensionarCanvasVR();

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