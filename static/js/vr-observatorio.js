// ── Observatório VR — Fase 2: WebXR (Meta Quest 3) ─────────────────────────
// Suporte nativo a WebXR (immersive-vr) usando renderer.xr do Three.js r160.
// Continua a funcionar no navegador normal (PC) com arrasto do rato.
// Não depende de addons (examples/jsm) — usa a API WebXR integrada no Three.

let vrIniciado = false;
let vrScene, vrCamera, vrRenderer;
let vrSessaoAtiva = false; // true enquanto uma sessão XR (headset) está aberta

// Estado dos astros (Sol/Lua/planetas): dados atuais e grupo de sprites em cena.
let dadosVRAtuais = null;
let vrGrupoAstros = null;

// Grupo do "céu fixo" (estrelas + linhas de constelações + etiquetas).
// É descartado e recriado em cada atualização para não acumular duplicados.
let vrGrupoCeu = null;

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
// Aplica o MESMO tratamento do Observatório 2D ao fundo (filtro de cor +
// escurecimento com globalAlpha 0.45), tudo DENTRO do canvas antes de virar
// textura. O Three.js não tem ctx.filter, por isso pré-processa-se a imagem.
// A esfera fica OPOSTA (sem transparent): se tivesse transparência, como o
// centro dela coincide com a câmara, o Three.js desenhava-a POR CIMA dos
// planetas e eles pareciam estar atrás da foto desbotada.
// O onload é atribuído ANTES do src (padrão já usado nos astros) para não
// perder o evento em imagens vindas da cache.
function adicionarFundoViaLactea() {
    const img = new Image();
    img.onload = () => {
        if (!(img.naturalWidth > 0)) return;

        // Filtro idêntico ao Observatório 2D: equilibra via láctea e constelações
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.filter = "brightness(0.7) contrast(1.6) saturate(1.9)";
        ctx.drawImage(img, 0, 0);
        ctx.filter = "none";

        // Escurecimento igual ao 2D (ctx.globalAlpha = 0.45 + gradSky):
        // mais escuro no topo, mais claro junto ao horizonte.
        const gradSky = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradSky.addColorStop(0, "#01020a");
        gradSky.addColorStop(0.5, "#04081a");
        gradSky.addColorStop(1, "#08122a");
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = gradSky;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;

        const textura = new THREE.CanvasTexture(canvas);
        finalizarTexturaVR(textura);

        const geometria = new THREE.SphereGeometry(RAIO_CEU_VR * 1.7, 48, 32);
        const material = new THREE.MeshBasicMaterial({
            map: textura,
            side: THREE.BackSide,
            depthWrite: false
        });
        vrScene.add(new THREE.Mesh(geometria, material));
    };
    img.onerror = () => console.error("VR: falha ao carregar o fundo da Via Láctea.");
    img.src = "/static/images/space.jpg";
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

// ── Tempo simulado (partilhado com o Observatório 2D) ───────────────────────
// A data/hora escolhida no Observatório 2D vive no index.js (tempoSimuladoObs).
// O VR lê-a por aqui, para mostrar SEMPRE o mesmo céu que o Observatório normal
// — seja em tempo real, seja numa simulação. As guardas "typeof" evitam erros
// se este ficheiro for usado sem o index.js carregado.
function tempoSimuladoVR() {
    return (typeof tempoSimuladoObs !== "undefined") ? tempoSimuladoObs : null;
}

function urlApiObservatorioVR() {
    if (typeof urlApiObservatorio === "function") return urlApiObservatorio();
    return "/api/observatorio";
}

// Linha de estado no menu do VR: diz se o céu é o real ou um simulado.
// (Durante uma sessão de headset o menu está escondido — só o céu é visível.)
function atualizarTempoExibidoVR() {
    const el = document.getElementById("vr-tempo");
    if (!el) return;

    const simulado = tempoSimuladoVR();
    if (simulado) {
        const [ano, mes, dia] = simulado.data.split("-");
        el.textContent = `⏱ Céu simulado: ${dia}/${mes}/${ano} às ${simulado.hora}`;
    } else {
        el.textContent = "🕐 Céu em tempo real";
    }
    el.classList.toggle("simulado", !!simulado);
}

// ── Dados reais do céu ──────────────────────────────────────────────────────
let vrPedidoAtual = 0; // nº do último pedido — descarta respostas que cheguem fora de tempo

async function carregarDadosVR() {
    const pedido = ++vrPedidoAtual;
    try {
        const res = await fetch(urlApiObservatorioVR());
        const dados = await res.json();

        // Se entretanto já foi feito um pedido mais recente (ex: mudaste a hora no
        // Observatório), esta resposta é antiga e é ignorada.
        if (pedido !== vrPedidoAtual) return;

        // Descarta o "céu" anterior (estrelas, linhas e etiquetas) para não
        // acumular duplicados a cada atualização.
        if (vrGrupoCeu) {
            vrScene.remove(vrGrupoCeu);
            vrGrupoCeu.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (obj.material.map) obj.material.map.dispose();
                    obj.material.dispose();
                }
            });
            vrGrupoCeu = null;
        }

        const grupoCeu = new THREE.Group();
        grupoCeu.add(desenharEstrelasVR(dados));
        grupoCeu.add(desenharConstelacoesVR(dados));
        vrGrupoCeu = grupoCeu;
        vrScene.add(grupoCeu);

        desenharAstrosVR(dados);
    } catch (err) {
        console.error("Erro ao carregar dados do Observatório VR:", err);
    }
}

// ── Estrelas ────────────────────────────────────────────────────────────────
function desenharEstrelasVR(dados) {
    const grupo = new THREE.Group();
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

    grupo.add(new THREE.Points(geometria, material));
    return grupo;
}

// ── Constelações ────────────────────────────────────────────────────────────
// Replica o Observatório 2D: linhas com efeito "neon" (núcleo brilhante com
// halos aditivos suaves) e o nome da constelação no centroide das estrelas.
// Só usa API do núcleo do Three.js (TubeGeometry, LineCurve3, CanvasTexture),
// sem depender de addons — funciona no Quest 3 e no navegador normal.

// Tubo fino e direito entre dois pontos da cúpula celeste (segmento de reta)
function tuboDeLinha(a, b, raio) {
    return new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 3, raio, 5, false);
}

// Funde várias geometrias de tubos numa só (todas não-indexadas) — assim a
// cena de constelações inteira desenha-se com apenas 3 draw calls em VR.
function fundirPosicoes(listaGeometrias) {
    const vertices = [];
    for (const geometria of listaGeometrias) {
        const semIndice = geometria.toNonIndexed();
        const pos = semIndice.getAttribute("position");
        for (let i = 0; i < pos.count; i++) {
            vertices.push(pos.getX(i), pos.getY(i), pos.getZ(i));
        }
        semIndice.dispose();
        geometria.dispose();
    }
    const fundida = new THREE.BufferGeometry();
    fundida.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    return fundida;
}

// Etiqueta de texto (nome da constelação) num sprite orientado à câmara,
// gerada num canvas — equivalente ao fillText com glow do Observatório 2D.
function criarEtiquetaConstelacao(nome, posicao) {
    const largura = 512, altura = 128;
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    ctx.font = "bold italic 64px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(110, 200, 255, 0.9)";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(nome, largura / 2, altura / 2);
    ctx.shadowBlur = 42;
    ctx.fillText(nome, largura / 2, altura / 2);

    const textura = new THREE.CanvasTexture(canvas);
    textura.minFilter = THREE.LinearFilter;
    textura.anisotropy = vrRenderer.capabilities.getMaxAnisotropy();

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: textura,
        transparent: true,
        depthWrite: false
    }));
    sprite.renderOrder = 1; // por cima das linhas e estrelas, para ser legível

    // Tamanho base fixo + componente proporcional pequena: garante que nomes
    // curtos (Leo, Ara) não ficam muito mais pequenos que nomes longos (Ursa Maior).
    const larguraTexto = ctx.measureText(nome).width;
    const escalaBase = RAIO_CEU_VR * 0.110;                        // mínimo garantido
    const escalaExtra = RAIO_CEU_VR * 0.045 * (larguraTexto / 300); // variação suave
    const escalaX = escalaBase + escalaExtra;
    sprite.scale.set(escalaX, escalaX * (altura / largura), 1);
    sprite.position.copy(posicao);
    return sprite;
}

function desenharConstelacoesVR(dados) {
    const grupo = new THREE.Group();
    const estrelas = dados.estrelas;
    const geometriasGlowExterior = [];
    const geometriasGlowInterior = [];
    const geometriasNucleo = [];
    const etiquetas = [];

    for (const id in dados.constelacoes) {
        const constelacao = dados.constelacoes[id];
        const estrelasUnicas = new Set();

        constelacao.linhas.forEach(linha => {
            const a = estrelas[linha[0]];
            const b = estrelas[linha[1]];
            if (!a || !b) return;
            estrelasUnicas.add(linha[0]);
            estrelasUnicas.add(linha[1]);

            // Tal como no Observatório 2D: só desenha a linha se pelo menos uma
            // das estrelas estiver acima do horizonte.
            if (!(a.visivel || b.visivel)) return;

            const pa = altAzParaXYZ(a.altitude, a.azimute, RAIO_CEU_VR);
            const pb = altAzParaXYZ(b.altitude, b.azimute, RAIO_CEU_VR);
            if (pa.distanceTo(pb) < 0.5) return; // evita tubos de comprimento nulo

            // Três camadas do efeito neon: halo exterior largo, halo interior e núcleo
            geometriasGlowExterior.push(tuboDeLinha(pa, pb, 2.6));
            geometriasGlowInterior.push(tuboDeLinha(pa, pb, 1.5));
            geometriasNucleo.push(tuboDeLinha(pa, pb, 0.55));
        });

        // Nome da constelação no centroide das estrelas visíveis (como no 2D).
        // Usa só estrelas acima do horizonte; se nenhuma estiver, omitir o nome.
        const centroide = new THREE.Vector3(0, 0, 0);
        let count = 0;
        estrelasUnicas.forEach(idEstrela => {
            const est = estrelas[idEstrela];
            if (est && est.visivel) {
                centroide.add(altAzParaXYZ(est.altitude, est.azimute, 1));
                count++;
            }
        });
        if (count > 0) {
            centroide.divideScalar(count).normalize().multiplyScalar(RAIO_CEU_VR);
            etiquetas.push(criarEtiquetaConstelacao(constelacao.nome, centroide));
        }
    }

    // Camada "neon": material aditivo com brilho azul suave
    const adicionarCamada = (geometrias, cor, opacidade, aditivo, renderOrder) => {
        if (geometrias.length === 0) return;
        const material = new THREE.MeshBasicMaterial({
            color: cor,
            transparent: true,
            opacity: opacidade,
            depthWrite: false,
            blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending
        });
        const malha = new THREE.Mesh(fundirPosicoes(geometrias), material);
        malha.renderOrder = renderOrder; // negativo: desenha atrás das estrelas/astros
        grupo.add(malha);
    };

    adicionarCamada(geometriasGlowExterior, 0x3f9cff, 0.10, true, -3);
    adicionarCamada(geometriasGlowInterior, 0x6ec8ff, 0.26, true, -2);
    adicionarCamada(geometriasNucleo, 0xaedcff, 0.92, false, -1);

    etiquetas.forEach(e => grupo.add(e));
    return grupo;
}

// ── Sol, Lua e Planetas em 3D (mesmas imagens e tamanhos do Observatório 2D) ──
// Tal como no 2D, o "size" define o raio do disco visível de cada astro.
// Os PNGs costumam ter fundo opaco/escuro — por isso o sprite teria uma
// "borda preta" quadrada. Para eliminar isso, replica-se a técnica do 2D:
// recortar a imagem num círculo (ctx.clip) e ampliá-la 2.5x para preencher
// o disco sem sobras. Só Saturno é desenhado inteiro (anéis transparentes).

const IMAGENS_ASTROS_VR = {
    "Sol": { src: "/static/images/sun.png", size: 50 },
    "Lua": { src: "/static/images/moon_render.png", size: 18 },
    "Mercúrio": { src: "/static/images/mercury.png", size: 12 },
    "Vénus": { src: "/static/images/venus.png", size: 20 },
    "Marte": { src: "/static/images/mars.png", size: 15 },
    "Júpiter": { src: "/static/images/jupiter.png", size: 37 },
    "Saturno": { src: "/static/images/saturn.png", size: 34 },
    "Úrano": { src: "/static/images/uranus.png", size: 25 },
    "Neptuno": { src: "/static/images/neptune.png", size: 24 }
};

// Resolução dos canvas gerados (px por unidade de "size" do 2D) — só afeta a
// nitidez da textura, não o tamanho final do astro na cúpula.
const RES_IMAGEM_VR = 8;

// Converte os tamanhos do 2D (píxeis) para unidades do mundo VR, mantendo as
// proporções entre astros. Júpiter (size 37) tem um disco de ~72 unidades de
// diâmetro a RAIO_CEU_VR=500 (~8.3° — bem visível). Isto é ~1.3x maior do que
// a versão anterior e ~8x maior do que a v1, em que os astros eram pontos.
const FATOR_ESCALA_VR = 72 / (37 * 2);

function astroCfg(nome) {
    const semAcento = (nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return IMAGENS_ASTROS_VR[nome] || IMAGENS_ASTROS_VR[semAcento];
}

// ── Pré-carregamento das imagens (igual ao Observatório 2D) ─────────────────
// As imagens são carregadas UMA vez para um mapa. O onload é atribuído ANTES
// do src — se for ao contrário, uma imagem já em cache (por já ter sido usada
// no Observatório 2D) pode terminar antes do handler ficar ligado e o onload
// nunca dispara, deixando os planetas invisíveis. Sempre que uma imagem fica
// pronta, reconstrói o grupo de astros (se já houver dados).
const imgsAstrosVR = {};
Object.entries(IMAGENS_ASTROS_VR).forEach(([nome, cfg]) => {
    const img = new Image();
    img.onload = () => {
        if (!(img.naturalWidth > 0)) return;
        if (dadosVRAtuais) reconstruirAstrosVR();
    };
    img.onerror = () => console.error("VR: falha ao carregar imagem do astro:", cfg.src);
    img.src = cfg.src;
    imgsAstrosVR[nome] = img;
});

function imagemAstroVR(nome) {
    if (!nome) return null;
    const semAcento = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const img = imgsAstrosVR[nome] || imgsAstrosVR[semAcento];
    return (img && img.complete && img.naturalWidth > 0) ? img : null;
}

function finalizarTexturaVR(textura) {
    textura.colorSpace = THREE.SRGBColorSpace;
    textura.minFilter = THREE.LinearFilter;
    textura.anisotropy = vrRenderer.capabilities.getMaxAnisotropy();
    return textura;
}

// Recorte circular — idêntico ao Observatório 2D (arc + clip + zoom 2.5x).
// O resultado tem fundo transparente, sem a "borda preta" do PNG original.
function texturaAstroCircular(img, size2d) {
    const lado = Math.max(32, Math.round(size2d * 2 * RES_IMAGEM_VR));
    const canvas = document.createElement("canvas");
    canvas.width = lado;
    canvas.height = lado;
    const ctx = canvas.getContext("2d");
    const cx = lado / 2, cy = lado / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, lado / 2, 0, 2 * Math.PI);
    ctx.clip();
    const drawLado = lado * 1.25; // igual a size*2.5 do 2D, ampliado para o canvas
    ctx.drawImage(img, cx - drawLado / 2, cy - drawLado / 2, drawLado, drawLado);
    ctx.restore();

    return finalizarTexturaVR(new THREE.CanvasTexture(canvas));
}

// Saturno: anéis transparentes no PNG, desenha-se a imagem inteira sem recorte.
function texturaAstroCompleta(img, size2d) {
    const lado = Math.max(32, Math.round(size2d * 2.2 * RES_IMAGEM_VR));
    const canvas = document.createElement("canvas");
    canvas.width = lado;
    canvas.height = lado;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, lado, lado);

    return finalizarTexturaVR(new THREE.CanvasTexture(canvas));
}

function desenharAstrosVR(dados) {
    dadosVRAtuais = dados;         // guarda para reconstruir quando as imagens chegarem
    reconstruirAstrosVR();
}

function reconstruirAstrosVR() {
    // Remove o grupo anterior (se existir) para não acumular sprites duplicados
    // sempre que uma imagem termina de carregar.
    if (vrGrupoAstros) {
        vrScene.remove(vrGrupoAstros);
        vrGrupoAstros.traverse(obj => {
            if (obj.material) {
                if (obj.material.map) obj.material.map.dispose();
                obj.material.dispose();
            }
        });
    }

    const grupo = new THREE.Group();
    vrGrupoAstros = grupo;

    dadosVRAtuais.astros.forEach(astro => {
        if (!astro.visivel) return; // astros abaixo do horizonte não aparecem

        const cfg = astroCfg(astro.nome);
        if (!cfg) return;

        // Só desenha quando a imagem já está pronta; senão aguarda o onload do
        // pré-carregamento, que voltará a chamar esta função.
        const img = imagemAstroVR(astro.nome);
        if (!img) return;

        const ehSaturno = astroCfg(astro.nome) === IMAGENS_ASTROS_VR["Saturno"];
        const textura = ehSaturno
            ? texturaAstroCompleta(img, cfg.size)
            : texturaAstroCircular(img, cfg.size);

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
        sprite.position.copy(altAzParaXYZ(astro.altitude, astro.azimute, RAIO_CEU_VR));

        // Largura do sprite = diâmetro do disco no mundo. Saturno conta com
        // os anéis (size*2.2, tal como no 2D).
        const largura = ehSaturno
            ? cfg.size * 2.2 * FATOR_ESCALA_VR
            : cfg.size * 2 * FATOR_ESCALA_VR;
        sprite.scale.set(largura, largura, 1);
        grupo.add(sprite);
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

let vrAIniciar = false; // true enquanto a cena está a ser criada (evita inícios duplicados)

// Chamado pelo mudarEcra() do index.js quando o utilizador abre a aba VR
function carregarVR() {
    atualizarTempoExibidoVR();

    if (!vrIniciado) {
        // A cena ainda não existe. O garantirTHREE pode demorar (CDN), por isso
        // marca-se o início em curso para não a criar duas vezes.
        if (vrAIniciar) return;
        vrAIniciar = true;
        garantirTHREE(() => {
            vrAIniciar = false;
            iniciarCenaVR(); // já traz os dados do céu
        });
        return;
    }

    // Cena já criada: recarrega os dados, porque a hora simulada pode ter sido
    // mudada no Observatório 2D desde a última vez que estivemos no VR.
    carregarDadosVR();
}

// Atualização ao vivo, como o Observatório 2D (re-fetch a cada 30s), mas só
// quando o separador VR está ativo. O 2D usa index.js:autoRefresh(); aqui o
// ciclo é interno ao VR para não depender do ecrã "observatorio" clássico.
function vrAutoRefresh() {
    setTimeout(() => {
        const ecraVR = document.getElementById("ecra-vr");
        if (ecraVR && ecraVR.classList.contains("ativo")) {
            carregarDadosVR();
        }
        vrAutoRefresh();
    }, 30000);
}
vrAutoRefresh();