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

// ── Estado da exploração (seleção, aproximação e UI dentro do VR) ───────────
// Tudo criado sob procura (o THREE só existe depois do garantirTHREE), por isso
// aqui só há referências a null.
let vrRaycaster = null;          // raycaster único (rato + controladores)
let vrUltimoRatoNDC = null;      // posição do último clique do rato (NDC)
let vrUltimaSelecao = null;      // astro selecionado (objeto vindo da API)
let vrMarcadorSelecao = null;    // anel luminoso à volta do astro escolhido
let vrPainelInfo3D = null;       // sprite com os dados do astro (dentro do VR)
let vrPainelUI3D = null;         // painel de botões 3D («SAIR DO VR», etc.)

// Aproximação suave da câmara — SÓ no modo PC; no headset quem manda é a
// cabeça do utilizador e a câmara nunca se move por código.
let vrZoomAtivo = false;
let vrPosCameraAlvo = null;
let vrOlharAlvo = null;

// Delta de tempo do ciclo de animação (rotação visual das esferas)
let vrUltimoTempoMs = 0;

// Controladores e mãos WebXR partilham o mesmo dono de grabbing: só um input
// pode manipular um astro de cada vez.
let vrControladoresInfo = [];
let vrMaosInfo = [];
const MODO_INTERACAO_VR = Object.freeze({ NENHUM: "nenhum", MAOS: "maos", CONTROLLER: "controller" });
let vrModoInteracao = MODO_INTERACAO_VR.NENHUM;
let vrModoInteracaoCandidato = null;
let vrModoInteracaoCandidatoDesde = 0;
const CONFIRMAR_HAND_TRACKING_VR_MS = 110;
const CONFIRMAR_CONTROLLER_VR_MS = 140;
const TOLERANCIA_PERDA_INPUT_VR_MS = 240;
const LIMIAR_PINCA_FECHAR_VR = 0.025;
const LIMIAR_PINCA_ABRIR_VR = 0.05;
const ESTABILIZAR_PINCA_VR_MS = 100;
const ESTABILIZAR_FECHO_VR_MS = 60;
const ESTABILIZAR_ABERTURA_VR_MS = 120;
const MEMORIA_ALVO_PINCA_VR_MS = 700; // cobre um pinch lento mesmo que o raio desapareça primeiro
// Máquina explícita do gesto. PINCH_START guarda o alvo; PINCHADO nunca volta
// a disparar enquanto os dedos não abrirem o suficiente (LIBERTAR).
const ESTADO_PINCA_VR = Object.freeze({
    ABERTO: "aberto",
    APONTANDO: "apontando",
    PINCH_START: "pinch-start",
    PINCHADO: "pinchado",
    LIBERTAR: "libertar"
});
const SUAVIZAR_SEGUIMENTO_MAO_VR_S = 0.045;
const DURACAO_REGRESSO_GRAB_VR_MS = 3500;
const ALCANCE_RAIO_MAO_VR = 1200;
const SUAVIZAR_RAIO_MAO_VR = 0.018;
const ESCALA_DESTAQUE_MAO_VR = 1.055;
const SUBDIVISOES_DEDO_MAO_VR = 6;
const SEGMENTOS_RADIAIS_DEDO_MAO_VR = 10;
const ANEIS_PALMA_MAO_VR = 22;
const COLUNAS_PALMA_MAO_VR = 28;
// A ponta do dedo termina numa calote arredondada (não num cone): os anéis
// extra continuam a curva do último joint até ao ápice.
const INTERVALOS_CAPA_DEDO_MAO_VR = 5;
const vrDestaquesPinça = new Map();

// ── Apresentação na palma (exclusivo do modo mãos) ──────────────────────────
// A pinça funciona como CLICK (uma seleção por gesto). O astro selecionado
// passa por MOVING_TO_HAND → ON_HAND; um segundo pinch inicia RETURNING e
// devolve-o ao céu. SEM «agarrar»: não é preciso manter a pinça, e nunca fica
// preso ao controlador. Durante as transições não são aceites novas ações.
const ESTADO_APRESENTACAO_VR = Object.freeze({
    NORMAL: "normal",
    MOVING_TO_HAND: "moving-to-hand",
    ON_HAND: "on-hand",
    RETURNING: "returning"
});
let estadoApresentacaoVR = ESTADO_APRESENTACAO_VR.NORMAL;
let vrApresentado = null;                // { info, objeto, posicaoOriginal, rotacaoOriginal, escalaOriginal }
let vrAstroVisualSelecionado = null;
const vrEscalasSelecaoVR = new Map();       // inclui o fade-out do astro anteriormente selecionado
const vrVoosApresentacaoVR = [];         // voos céu → palma em curso
const DURACAO_DESTAQUE_PRE_VOO_VR_MS = 220; // pequena antecipação de scale
const DURACAO_VOAR_PALMA_VR_MS = 1450;      // voo deliberado, fácil de acompanhar
const DURACAO_REGRESSO_PALMA_VR_MS = 1450;  // regresso simétrico ao voo de ida
const MEIA_ESPESSURA_PALMA_VR_M = 0.010;    // superfície convexa da palma (~1 cm)
const SEPARACAO_PALMA_PLANETA_VR_M = 0.032; // intervalo visível entre palma e planeta
const DIAMETRO_APRESENTACAO_VR_M = 0.14;
const FATOR_DESTAQUE_SELECAO_VR = 1.12; // destaque subtil, multiplicativo sobre o scale original
const SUAVIZAR_SEGUIMENTO_PALMA_VR_S = 0.10;

// Estado transitório do grabbing (controladores). A posição astronómica
// continua nos dados da API; só se reparenta temporariamente o objeto visual
// ao controller. As mãos NÃO fazem grabbing — ver o estado de apresentação.
let vrGrabAtivo = null;
let vrObjetosRegressando = [];
let vrAstroRebuildPendente = false;
const ATRASO_GRAB_VR_MS = 280;
// Temporizador do grip: o «SAIR DO VR» por grip só dispara depois de a pressão
// ser mantida ~0,7s (ver criarControladoresVR) — um aperto acidental, ao
// erguer o braço para apontar ao céu, não pode terminar a sessão.
let vrGripTemporizador = null;

// Cache dos alvos de seleção (invalidado quando os grupos mudam) e temporários
// para o raycast do laser SEM alocações no ciclo de renderização.
let vrAlvosCache = null;
let vrTempOrigem = null;
let vrTempDirecao = null;
let vrTempQuat = null;
let vrTempPalmaPos = null;       // temporários da apresentação (sem alocações)
let vrTempPalmaDir = null;
let vrTempPalmaMundo = null;
let vrTempPalmaEscala = null;
let vrTempPalmaScale = null;

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
let vrArrastou = false; // distingue um clique (seleciona) de um arrasto (olha à volta)
let vrStartX = 0, vrStartY = 0;
let vrStartYaw = 0, vrStartPitch = 0;

const RAIO_CEU_VR = 500; // distância da "cúpula celeste" ao observador

// ── Céu sob os pés, sempre ligado ───────────────────────────────────────────
// O céu inteiro continua visível no VR. A opacidade reduzida fica apenas nas
// estrelas e linhas de constelações abaixo do horizonte, nunca nos planetas.
const ALFA_ABAIXO_VR = 0.6;

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

    // Estado de exploração — criado aqui (e não no topo do ficheiro) porque o
    // THREE só existe depois do garantirTHREE ter carregado a biblioteca.
    vrRaycaster = new THREE.Raycaster();
    vrPosCameraAlvo = new THREE.Vector3(0, 0, 0);
    vrOlharAlvo = new THREE.Vector3(0, 0, -1);
    vrTempOrigem = new THREE.Vector3();
    vrTempDirecao = new THREE.Vector3();
    vrTempQuat = new THREE.Quaternion();
    vrTempPalmaPos = new THREE.Vector3();
    vrTempPalmaDir = new THREE.Vector3();
    vrTempPalmaMundo = new THREE.Vector3();
    vrTempPalmaEscala = new THREE.Vector3();
    vrTempPalmaScale = new THREE.Vector3();

    // Iluminação proveniente do Sol + luz ambiente ténue (para as esferas)
    criarIluminacaoVR();

    // Fundo panorâmico da Via Láctea (space.jpg já usado no Observatório 2D)
    adicionarFundoViaLactea();

    // Texturas planetárias reais (locais, em static/images/texturas) para as
    // esferas. Se alguma falhar, o astro fica no sprite antigo (fallback).
    carregarTexturasPlanetasVR();

    // Estrelas, constelações e astros reais, vindos do mesmo /api/observatorio
    carregarDadosVR();

    // Controladores Touch e grupos XRHand para mãos rastreadas. O recurso é
    // opcional: sem suporte, os grupos ficam invisíveis e os comandos funcionam
    // exatamente como antes.
    criarControladoresVR();

    // Controlo por arrasto do rato (modo PC / navegador sem headset)
    canvas.addEventListener("mousedown", vrIniciarArrasto);
    window.addEventListener("mousemove", vrMoverArrasto);
    window.addEventListener("mouseup", vrTerminarArrasto);
    // Clique sem arrastar = selecionar o astro apontado (modo PC)
    canvas.addEventListener("click", vrCliqueRato);
    // Escape = fecha os detalhes e regressa à vista geral
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && document.body.classList.contains("vr-ativo")) {
            limparSelecaoVR();
            vistaGeralVR();
        }
    });
    window.addEventListener("resize", () => {
        if (document.body.classList.contains("vr-ativo")) redimensionarCanvasVR();
    });

    // Estado da sessão XR — esconde/mostra a interface e a rotação por rato.
    // O "sessionend" cobre TODOS os caminhos de saída: botão «SAIR DO VR» da
    // cena 3D, DOM Overlay, terminação pelo sistema do Quest ou erro da sessão.
    vrRenderer.xr.addEventListener("sessionstart", () => {
        vrSessaoAtiva = true;
        document.body.classList.add("vr-sessao");
        // O painel de botões 3D só vive dentro da sessão (no PC há o painel HTML)
        criarPainelUI3D();
    });
    vrRenderer.xr.addEventListener("sessionend", () => {
        vrSessaoAtiva = false;
        vrMaosInfo.forEach(info => {
            ocultarRaioMaoVR(info);
            if (info.modelo) info.modelo.visible = false;
            reiniciarEstadoMaoVR(info);
        });
        restaurarInterfaceAposSessao();
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
function definirPosicaoAltAzVR(destino, altGraus, azGraus, raio) {
    const alt = altGraus * Math.PI / 180;
    const az = azGraus * Math.PI / 180;
    const x = raio * Math.cos(alt) * Math.sin(az);
    const y = raio * Math.sin(alt);
    const z = -raio * Math.cos(alt) * Math.cos(az);
    return destino.set(x, y, z);
}

function altAzParaXYZ(altGraus, azGraus, raio) {
    return definirPosicaoAltAzVR(new THREE.Vector3(), altGraus, azGraus, raio);
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
        // Formato esperado: "YYYY-MM-DD". Se vier outra coisa, mostra o valor
        // tal como está — nunca "undefined/undefined/undefined".
        const dataLegivel = /^\d{4}-\d{2}-\d{2}$/.test(simulado.data)
            ? simulado.data.split("-").reverse().join("/")
            : simulado.data;
        el.textContent = `⏱ Céu simulado: ${dataLegivel} às ${simulado.hora}`;
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
// As estrelas vêm todas na resposta da API, com um "visivel" que diz se estão
// acima do horizonte. Aqui desenham-se as duas metades do céu (ver
// ALFA_ABAIXO_VR), mas em duas nuvens de pontos separadas: o PointsMaterial não
// tem opacidade por ponto, e é a opacidade que distingue as de baixo. Duas
// nuvens custam uma draw call a mais e resolvem-no sem shaders à medida.
function desenharEstrelasVR(dados) {
    const grupo = new THREE.Group();
    const acima = { posicoes: [], cores: [] };
    const abaixo = { posicoes: [], cores: [] };
    for (const id in dados.estrelas) {
        const est = dados.estrelas[id];
        const p = altAzParaXYZ(est.altitude, est.azimute, RAIO_CEU_VR);
        // Estrelas mais brilhantes (mag menor) ligeiramente mais azuladas
        const mag = est.magnitude || 2;
        const brilho = Math.max(0.4, 1 - (mag + 1.5) / 7);
        const destino = est.visivel ? acima : abaixo;
        destino.posicoes.push(p.x, p.y, p.z);
        destino.cores.push(0.75 + 0.25 * brilho, 0.80 + 0.20 * brilho, brilho);
    }

    grupo.add(criarNuvemDeEstrelas(acima, 0.95));
    grupo.add(criarNuvemDeEstrelas(abaixo, ALFA_ABAIXO_VR));
    return grupo;
}

// Uma nuvem de pontos a partir das posições/cores já reunidas. Uma metade sem
// estrelas nenhumas (céu todo de um lado, conforme a latitude) devolve um grupo
// vazio, e não uma malha sem vértices — assim quem chama pode somar os dois sem
// ter de saber se algum deles ficou vazio.
function criarNuvemDeEstrelas(nuvem, opacidade) {
    const grupo = new THREE.Group();
    if (nuvem.posicoes.length === 0) return grupo;

    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute("position", new THREE.Float32BufferAttribute(nuvem.posicoes, 3));
    geometria.setAttribute("color", new THREE.Float32BufferAttribute(nuvem.cores, 3));

    const material = new THREE.PointsMaterial({
        vertexColors: true,
        size: 2.5,
        sizeAttenuation: false,
        transparent: true,
        opacity: opacidade
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
    // As mesmas três camadas, mas para as linhas inteiramente debaixo do
    // horizonte (ver ALFA_ABAIXO_VR).
    const geometriasGlowExteriorAbaixo = [];
    const geometriasGlowInteriorAbaixo = [];
    const geometriasNucleoAbaixo = [];
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

            const pa = altAzParaXYZ(a.altitude, a.azimute, RAIO_CEU_VR);
            const pb = altAzParaXYZ(b.altitude, b.azimute, RAIO_CEU_VR);
            if (pa.distanceTo(pb) < 0.5) return; // evita tubos de comprimento nulo

            // A divisão é a mesma do Observatório 2D (ver o "linhasAbaixo" em
            // desenharObservatorio, no index.js): basta UMA estrela acima do
            // horizonte para a linha inteira ser céu observável e levar o neon
            // todo — mesmo a metade dela que mergulha. Só quando as duas pontas
            // estão debaixo do horizonte é que a linha é "céu sob os pés".
            const camadas = (a.visivel || b.visivel)
                ? [geometriasGlowExterior, geometriasGlowInterior, geometriasNucleo]
                : [geometriasGlowExteriorAbaixo, geometriasGlowInteriorAbaixo, geometriasNucleoAbaixo];

            // Três camadas do efeito neon: halo exterior largo, halo interior e núcleo
            camadas[0].push(tuboDeLinha(pa, pb, 2.6));
            camadas[1].push(tuboDeLinha(pa, pb, 1.5));
            camadas[2].push(tuboDeLinha(pa, pb, 0.55));
        });

        // Nome da constelação no centroide das estrelas (como no 2D, onde o
        // centróide conta as de baixo quando "Ver abaixo do horizonte" está
        // ligado — e aqui está sempre). Sem o filtro do "visivel", uma
        // constelação toda debaixo dos pés continua a ter nome, que é o que
        // permite reconhecê-la quando se olha para baixo.
        const centroide = new THREE.Vector3(0, 0, 0);
        let count = 0;
        estrelasUnicas.forEach(idEstrela => {
            const est = estrelas[idEstrela];
            if (est) {
                centroide.add(altAzParaXYZ(est.altitude, est.azimute, 1));
                count++;
            }
        });
        if (count > 0) {
            centroide.divideScalar(count).normalize().multiplyScalar(RAIO_CEU_VR);
            etiquetas.push(criarEtiquetaConstelacao(constelacao.nome, centroide));
        }
    }

    // Camada "neon": material aditivo com brilho azul suave.
    // O último argumento é o fator de opacidade: 1 para o céu de cima, e
    // ALFA_ABAIXO_VR para as camadas do céu sob os pés — assim as duas usam
    // exatamente a mesma cor e o mesmo traço, só a intensidade difere.
    const adicionarCamada = (geometrias, cor, opacidade, aditivo, renderOrder, fator = 1) => {
        if (geometrias.length === 0) return;
        const material = new THREE.MeshBasicMaterial({
            color: cor,
            transparent: true,
            opacity: opacidade * fator,
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

    // Céu sob os pés: as mesmas três camadas, apagadas.
    adicionarCamada(geometriasGlowExteriorAbaixo, 0x3f9cff, 0.10, true, -3, ALFA_ABAIXO_VR);
    adicionarCamada(geometriasGlowInteriorAbaixo, 0x6ec8ff, 0.26, true, -2, ALFA_ABAIXO_VR);
    adicionarCamada(geometriasNucleoAbaixo, 0xaedcff, 0.92, false, -1, ALFA_ABAIXO_VR);

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
    "Neptuno": { src: "/static/images/neptune.png", size: 24 },
    // A ISS, tal como no 2D: imagem própria e um "size" que NÃO é o raio do
    // disco — ver o ramo dela no desenho, onde é ele que manda na largura.
    "ISS": { src: "/static/images/iss.png", size: 20 }
};

// Resolução dos canvas gerados (px por unidade de "size" do 2D) — só afeta a
// nitidez da textura, não o tamanho final do astro na cúpula.
const RES_IMAGEM_VR = 8;

// Converte os tamanhos do 2D (píxeis) para unidades do mundo VR, mantendo as
// proporções entre astros. Júpiter (size 37) tem um disco de ~72 unidades de
// diâmetro a RAIO_CEU_VR=500 (~8.3° — bem visível). Isto é ~1.3x maior do que
// a versão anterior e ~8x maior do que a v1, em que os astros eram pontos.
const FATOR_ESCALA_VR = 72 / (37 * 2);

// ── Texturas planetárias reais (mapas equiretangulares 2k, locais) ──────────
// Guardadas em static/images/texturas/ (ver ATTRIBUTION.txt — Solar System
// Scope, CC BY 4.0, baseadas em dados NASA/JPL). Mapeadas numa THREE.SphereGeometry:
// a textura acompanha a superfície quando a perspetiva muda, ao contrário dos
// sprites planos. Caminhos locais estáveis — o Observatório não depende de
// servidores externos em execução. Se uma textura falhar, o astro correspondente
// é desenhado com o sprite antigo (fallback) — ver reconstruirAstrosVR.
const TEXTURAS_PLANETAS_VR = {
    "Sol": "/static/images/texturas/2k_sun.jpg",
    "Lua": "/static/images/texturas/2k_moon.jpg",
    "Mercúrio": "/static/images/texturas/2k_mercury.jpg",
    "Vénus": "/static/images/texturas/2k_venus_atmosphere.jpg",
    "Marte": "/static/images/texturas/2k_mars.jpg",
    "Júpiter": "/static/images/texturas/2k_jupiter.jpg",
    "Saturno": "/static/images/texturas/2k_saturn.jpg",
    "Úrano": "/static/images/texturas/2k_uranus.jpg",
    "Neptuno": "/static/images/texturas/2k_neptune.jpg"
};
const TEXTURA_ANEIS_SATURNO = "/static/images/texturas/2k_saturn_ring_alpha.png";

// Texturas já carregadas (nome → THREE.Texture) — carregadas uma vez e
// partilhadas por todos os rebuilds, para não ocupar memória repetida.
const texturasPlanetasVR = {};

// Ângulo de rotação visual acumulado por astro. Os rebuilds do grupo (novos
// dados a cada 30s, texturas a chegar) recriam as esferas — sem este mapa, a
// rotação de cada astro voltava a zero e a superfície "saltava" para trás.
const vrRotacoesVisuais = {};
let texturaAneisSaturnoVR = null;
let vrGeometriaEsfera = null;         // esfera unitária única, reutilizada por todos
let vrGeometriaAneisSaturno = null;   // anéis de Saturno, criados uma vez
let vrLuzSol = null;                  // luz pontual colocada na posição do Sol

function prepararTexturaPlaneta(textura) {
    textura.colorSpace = THREE.SRGBColorSpace;
    textura.minFilter = THREE.LinearMipmapLinearFilter;
    textura.anisotropy = vrRenderer.capabilities.getMaxAnisotropy();
    return textura;
}

function carregarTexturasPlanetasVR() {
    const loader = new THREE.TextureLoader();
    Object.entries(TEXTURAS_PLANETAS_VR).forEach(([nome, url]) => {
        loader.load(url,
            textura => {
                texturasPlanetasVR[nome] = prepararTexturaPlaneta(textura);
                if (dadosVRAtuais) reconstruirAstrosVR();
            },
            undefined,
            err => console.error("VR: falha ao carregar textura do astro:", url, err)
        );
    });
    loader.load(TEXTURA_ANEIS_SATURNO,
        textura => {
            // Faixa radial (2048x125) com alfa (divisão de Cassini incluída)
            textura.wrapS = THREE.ClampToEdgeWrapping;
            texturaAneisSaturnoVR = prepararTexturaPlaneta(textura);
            if (dadosVRAtuais) reconstruirAstrosVR();
        },
        undefined,
        err => console.error("VR: falha ao carregar textura dos anéis de Saturno:", err)
    );
}

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

// ISS: a fotografia é 3:2 e os painéis solares estendem-se para os lados, por
// isso — tal como no 2D — desenha-se inteira num retângulo com a proporção
// dela. O recorte circular dos planetas pressupõe uma imagem quadrada com o
// astro ao centro: aqui espremia-a 33% e cortava as pontas dos painéis.
function texturaAstroISS(img, size2d) {
    const largura = Math.max(32, Math.round(size2d * 3 * RES_IMAGEM_VR));
    const altura = Math.round(largura / 1.5);   // 3:2, igual ao 2D (size*3 x size*2)
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, largura, altura);

    return finalizarTexturaVR(new THREE.CanvasTexture(canvas));
}

function desenharAstrosVR(dados) {
    dadosVRAtuais = dados;         // guarda para reconstruir quando as imagens chegarem
    reconstruirAstrosVR();
}

function reconstruirAstrosVR() {
    if (!vrScene || !dadosVRAtuais) return;

    // Enquanto um astro está agarrado ou a regressar, preserva a instância
    // manipulada (e os seus recursos GPU). Atualiza já as posições dos outros
    // astros com os dados mais recentes; o rebuild completo fica pendente até
    // terminar o regresso, usando sempre a astronomia mais recente como alvo.
    if (vrGrabAtivo || vrObjetosRegressando.length || vrApresentado) {
        vrAstroRebuildPendente = true;
        sincronizarPosicoesAstrosVR();
        return;
    }
    vrAstroRebuildPendente = false;

    // Remove o grupo anterior (se existir) para não acumular objetos duplicados
    // sempre que uma textura ou imagem termina de carregar.
    if (vrGrupoAstros) {
        vrScene.remove(vrGrupoAstros);
        vrGrupoAstros.traverse(obj => {
            // As geometrias de esfera/anéis são partilhadas por todos os astros
            // e ficam vivas; só se descartam as criadas para este grupo.
            if (obj.geometry && !geometriaPartilhadaVR(obj.geometry)) obj.geometry.dispose();
            if (obj.material) {
                // As texturas planetárias ficam em cache e são reutilizadas em
                // cada reconstrução — só se descartam as de canvas geradas aqui.
                if (obj.material.map && obj.material.map.isCanvasTexture) obj.material.map.dispose();
                obj.material.dispose();
            }
        });
        vrGrupoAstros = null;
    }

    // A luz do Sol acompanha a posição astronómica do Sol (vinda da API)
    const sol = dadosVRAtuais.astros.find(a => a.tipo === "sol");
    if (vrLuzSol && sol) {
        vrLuzSol.position.copy(altAzParaXYZ(sol.altitude, sol.azimute, RAIO_CEU_VR));
    }

    const grupo = new THREE.Group();
    vrGrupoAstros = grupo;

    dadosVRAtuais.astros.forEach(astro => {
        // O Sol, a Lua e os planetas debaixo do horizonte também se desenham.
        // Mantêm o mesmo brilho que os objetos acima do horizonte.
        const cfg = astroCfg(astro.nome);
        if (!cfg) return;

        // O brilho/opacidade é independente do horizonte. O Sol mantém o extra
        // de brilho histórico; todos os outros astros usam opacidade total.
        const opacidade = (astro.tipo === "sol") ? 0.95 : 1;

        // ── 1) Esfera real com textura planetária (caso principal) ──────────
        // Volume, iluminação e profundidade reais; a textura acompanha a
        // superfície quando a perspetiva muda.
        const textura = texturaPlanetaVR(astro.nome);
        if (textura && astro.nome !== "ISS") {
            grupo.add(criarEsferaAstroVR(astro, cfg, textura, opacidade));
            return;
        }

        // ── 2) Fallback: sprite plano (comportamento anterior) ──────────────
        // Usado pela ISS (não é um planeta) e por qualquer astro cuja textura
        // ainda não chegou ou falhou — o observatório continua utilizável.
        // Só desenha quando a imagem já está pronta; senão aguarda o onload do
        // pré-carregamento, que voltará a chamar esta função.
        const img = imagemAstroVR(astro.nome);
        if (!img) return;

        const ehSaturno = astroCfg(astro.nome) === IMAGENS_ASTROS_VR["Saturno"];
        const ehISS = astroCfg(astro.nome) === IMAGENS_ASTROS_VR["ISS"];
        const texturaSprite = ehSaturno
            ? texturaAstroCompleta(img, cfg.size)
            : ehISS
                ? texturaAstroISS(img, cfg.size)
                : texturaAstroCircular(img, cfg.size);

        const material = new THREE.SpriteMaterial({
            map: texturaSprite,
            transparent: true,
            depthWrite: false,
            depthTest: true
        });
        material.opacity = opacidade;
        if (astro.tipo === "sol") {
            // Sol com brilho forte — mistura aditiva
            material.blending = THREE.AdditiveBlending;
        }

        const sprite = new THREE.Sprite(material);
        sprite.position.copy(altAzParaXYZ(astro.altitude, astro.azimute, RAIO_CEU_VR));
        sprite.userData.astro = astro;

        // Largura do sprite = diâmetro do disco no mundo. Saturno conta com
        // os anéis (size*2.2, tal como no 2D); a ISS é larga e baixa, 3:2
        // (size*3 x size*2, igual ao 2D), e por isso não é quadrada.
        const largura = ehSaturno
            ? cfg.size * 2.2 * FATOR_ESCALA_VR
            : ehISS
                ? cfg.size * 3 * FATOR_ESCALA_VR
                : cfg.size * 2 * FATOR_ESCALA_VR;
        const altura = ehISS ? largura / 1.5 : largura;
        sprite.scale.set(largura, altura, 1);
        guardarEstadoOriginalAstroVR(sprite);
        grupo.add(sprite);
    });

    vrScene.add(grupo);
    // Os alvos de seleção mudaram (astros novos/removidos): o cache do raio
    // tem de ser reconstruído, senão o gatilho continua a apontar à lista velha.
    vrAlvosCache = null;
}

// Geometrias reutilizadas por todos os astros (nunca descartadas no rebuild)
function geometriaPartilhadaVR(geometria) {
    return !!geometria && (geometria === vrGeometriaEsfera || geometria === vrGeometriaAneisSaturno);
}

function texturaPlanetaVR(nome) {
    if (!nome) return null;
    const semAcento = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return texturasPlanetasVR[nome] || texturasPlanetasVR[semAcento] || null;
}

// ── Iluminação: luz proveniente do Sol + ambiente ténue ─────────────────────
// A luz pontual fica NA posição astronómica do Sol (atualizada em cada
// reconstrução), por isso os planetas são iluminados do lado do Sol — as fases
// da Lua e dos planetas inferiores aparecem naturalmente. Sem atenuação com a
// distância (decay 0): a cúpula vive a ~500 unidades e a intensidade física
// cairia para perto de zero. O ambiente ténue mantém o lado não iluminado
// legível sem matar o efeito de fase.
function criarIluminacaoVR() {
    if (!vrScene) return;
    vrScene.add(new THREE.AmbientLight(0x8899bb, 0.5));
    vrLuzSol = new THREE.PointLight(0xfff2dd, 1.6, 0, 0);
    vrScene.add(vrLuzSol);
}

// Esfera real do astro: a textura equiretangular acompanha a superfície quando
// a perspetiva muda, e o mesh tem volume, luz e profundidade. O raio mantém o
// MESMO tamanho visual que o sprite antigo (metade da sua largura) — a escala
// do Observatório (astros ampliados na cúpula, não à escala real) não foi
// alterada, por decisão: preserva o comportamento existente.
function criarEsferaAstroVR(astro, cfg, textura, opacidade) {
    if (!vrGeometriaEsfera) vrGeometriaEsfera = new THREE.SphereGeometry(1, 48, 32);

    const grupo = new THREE.Group();
    grupo.position.copy(altAzParaXYZ(astro.altitude, astro.azimute, RAIO_CEU_VR));
    grupo.userData.astro = astro;

    const ehSol = astro.tipo === "sol";
    const ehSaturno = astroCfg(astro.nome) === IMAGENS_ASTROS_VR["Saturno"];

    // Raio do disco. Para Saturno, o sprite antigo media size*2.2*FATOR com os
    // anéis: o planeta fica com a proporção real planeta/anéis (raio exterior
    // dos anéis = 2,27 raios do planeta) para o conjunto ter exatamente a mesma
    // largura de antes.
    const raio = ehSaturno
        ? (cfg.size * 1.1 * FATOR_ESCALA_VR) / 2.27
        : cfg.size * FATOR_ESCALA_VR;

    const material = ehSol
        // Sol autoiluminado: não recebe luz da cena, tal como o sprite antigo
        ? new THREE.MeshBasicMaterial({ map: textura, transparent: true, opacity: opacidade })
        : new THREE.MeshPhongMaterial({
            map: textura,
            transparent: true,
            opacity: opacidade,
            shininess: 6,
            specular: 0x11131c
        });

    const esfera = new THREE.Mesh(vrGeometriaEsfera, material);
    esfera.scale.setScalar(raio);
    grupo.add(esfera);

    if (ehSaturno && texturaAneisSaturnoVR) {
        grupo.add(criarAneisSaturnoVR(raio, opacidade));
        // Inclinação axial de Saturno (~26,7°): planeta e anéis inclinam-se juntos
        grupo.rotation.z = 26.7 * Math.PI / 180;
    }

    if (ehSol) grupo.add(criarHaloSolarVR(raio));

    // Rotação VISUAL suave da textura — não toca nas posições astronómicas,
    // que continuam a vir todas do /api/observatorio. A Lua não gira (fica
    // sempre com a mesma face virada para a Terra). O ângulo reinicia no valor
    // acumulado (vrRotacoesVisuais) para a rotação continuar de onde ia.
    grupo.userData.esfera = esfera;
    grupo.userData.rotacaoVel = ehSol ? 0.005 : (astro.tipo === "lua" ? 0 : 0.02);
    esfera.rotation.y = vrRotacoesVisuais[astro.nome] || 0;
    guardarEstadoOriginalAstroVR(grupo);

    return grupo;
}

// Anéis de Saturno: geometria própria (RingGeometry) com uma faixa de UV
// radial, para a textura dos anéis se mapear do interior para o exterior —
// incluindo a divisão de Cassini, que vem no próprio PNG (com alfa).
function criarAneisSaturnoVR(raio, opacidade) {
    if (!vrGeometriaAneisSaturno) {
        const interior = raio * 1.24;
        const exterior = raio * 2.27;
        const geometria = new THREE.RingGeometry(interior, exterior, 96, 1);
        // O RingGeometry mapeia as UVs num quadrado; aqui remapeiam-se para
        // u = posição radial (0 no interior, 1 no exterior) e v fixo.
        const pos = geometria.getAttribute("position");
        const uvs = [];
        const v = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            uvs.push((v.length() - interior) / (exterior - interior), 0.5);
        }
        geometria.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
        vrGeometriaAneisSaturno = geometria;
    }

    const aneis = new THREE.Mesh(vrGeometriaAneisSaturno, new THREE.MeshBasicMaterial({
        map: texturaAneisSaturnoVR,
        transparent: true,
        opacity: opacidade,
        side: THREE.DoubleSide,
        depthWrite: false
    }));
    // Deita o anel no plano do equador do planeta (o eixo local é o Y)
    aneis.rotation.x = Math.PI / 2;
    return aneis;
}

// Halo do Sol: gradiente radial gerado em canvas (sem imagem extra), com
// mistura aditiva — dá o brilho forte que o sprite antigo tinha, sem efeitos
// pesados (sem bloom nem shaders à medida: custo mínimo no Quest 3).
function criarHaloSolarVR(raio) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
    grad.addColorStop(0, "rgba(255, 240, 200, 0.55)");
    grad.addColorStop(0.35, "rgba(255, 200, 120, 0.18)");
    grad.addColorStop(1, "rgba(255, 180, 90, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const textura = new THREE.CanvasTexture(canvas);
    textura.colorSpace = THREE.SRGBColorSpace;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: textura,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    }));
    halo.scale.setScalar(raio * 5);
    // Decorativo — nunca pode roubar o raio de seleção ao disco do Sol
    halo.raycast = () => {};
    return halo;
}

// ── Controladores VR (Meta Quest Touch) com laser pointer ───────────────────
// O Three.js só tem dois slots internos de WebXRController e, com hand
// tracking ativo, as duas mãos podem ocupá-los antes de os comandos
// aparecerem. Nesse caso os comandos ficam sem slot e nunca recebem o
// "connected". Por isso a deteção dos comandos é feita sobre a lista real
// session.inputSources; a pose vem do XRFrame e de inputSource.targetRaySpace.
// Não há posições simuladas: é a mesma pose que o runtime WebXR publica.
// As mãos continuam a usar renderer.xr.getHand(), sem alterações.
function criarControladoresVR() {
    for (let i = 0; i < 2; i++) {
        // Grupo posicionado por frame a partir da pose real do targetRaySpace.
        const controlador = new THREE.Group();
        controlador.name = i === 0 ? "controller-xr-left" : "controller-xr-right";
        controlador.visible = false;

        // Linha de laser — aponta ao longo de -Z (direção do ray) do
        // controlador. É o raio, e só ele, o verdadeiro ponteiro: o astro
        // deteta-se onde o raio intersecta a sua geometria.
        const laser = criarLaser(0x6eb8ff);
        laser.visible = false;
        // O comprimento muda em todos os frames; não deve ser abatido por
        // uma bounding sphere antiga.
        laser.frustumCulled = false;
        controlador.add(laser);

        const maoInfo = criarMaoRastreadaVR(i);
        const info = {
            controlador, laser, maoInfo, inputSource: null,
            lado: i === 0 ? "left" : "right",
            hover: null, holdBotao: null, holdInicio: 0,
            gatilhoPuxado: false, gatilhoInicio: 0,
            astroSelecionavel: null, astroParaAgarrar: null,
            objetoAgarrado: null, rastreioPerdidoDesde: 0,
            rastreioPoseValido: false
        };
        if (maoInfo) maoInfo.infoInput = info;
        vrControladoresInfo.push(info);

        if (maoInfo) maoInfo.mao.visible = false;
        vrScene.add(controlador);
    }
}

// O evento WebXR identifica a fonte que o originou; a correspondência é feita
// por identidade (nunca pela posição na lista de inputSources).
function infoControladorDoEventoVR(evento) {
    const fonte = evento && evento.inputSource;
    if (!fonte || fonte.hand) return null;
    return vrControladoresInfo.find(info => info.inputSource === fonte) || null;
}

function tratarSelectStartControllerVR(info) {
    if (!info || vrModoInteracao !== MODO_INTERACAO_VR.CONTROLLER
        || !controllerTemTrackingValidoVR(info)) return;
    info.laser.material.color.setHex(0xffffff);
    if (!info.gatilhoPuxado) iniciarGatilhoControllerVR(info);
}

function tratarSelectEndControllerVR(info) {
    if (!info) return;
    info.laser.material.color.setHex(0x6eb8ff);
    if (vrModoInteracao !== MODO_INTERACAO_VR.CONTROLLER) return;
    if (!controllerTemTrackingValidoVR(info)) {
        info.gatilhoPuxado = false;
        info.gatilhoInicio = 0;
        info.astroSelecionavel = null;
        info.astroParaAgarrar = null;
        cancelarHoldBotaoVR(info);
        return;
    }
    terminarGatilhoControllerVR(info);
    // Soltar o gatilho antes do tempo cancela a pressão mantida do botão.
    cancelarHoldBotaoVR(info);
}

// Grip (botão de aperto) = SAIR DO VR, mas só com uma pressão DECIDIDA
// (~0,7s mantida). Um aperto acidental — ao erguer o braço para apontar ao
// céu — não pode terminar a sessão. Soltar antes do tempo não faz nada.
function tratarSqueezeStartControllerVR(info) {
    if (!info || vrModoInteracao !== MODO_INTERACAO_VR.CONTROLLER
        || !controllerTemTrackingValidoVR(info)) return;
    if (vrGripTemporizador) clearTimeout(vrGripTemporizador);
    vrGripTemporizador = setTimeout(() => {
        vrGripTemporizador = null;
        if (vrModoInteracao === MODO_INTERACAO_VR.CONTROLLER
            && controllerTemTrackingValidoVR(info)) sairSessaoVR();
    }, 700);
}

function tratarSqueezeEndControllerVR(info) {
    if (!info || vrModoInteracao !== MODO_INTERACAO_VR.CONTROLLER) return;
    if (vrGripTemporizador) {
        clearTimeout(vrGripTemporizador);
        vrGripTemporizador = null;
    }
}

// Os eventos de seleção são da sessão (XRInputSourceEvent), não de um slot
// interno do Three. Filtrar por inputSource garante que a pinça de uma mão
// nunca é interpretada como gatilho do comando.
function configurarEventosControllerSessaoVR(sessao) {
    if (!sessao || typeof sessao.addEventListener !== "function") return;
    sessao.addEventListener("inputsourceschange", () => {
        sincronizarFontesEntradaVR(sessao);
        atualizarVisibilidadeInteracaoVR();
    });
    sessao.addEventListener("selectstart", evento => {
        tratarSelectStartControllerVR(infoControladorDoEventoVR(evento));
    });
    sessao.addEventListener("selectend", evento => {
        tratarSelectEndControllerVR(infoControladorDoEventoVR(evento));
    });
    sessao.addEventListener("squeezestart", evento => {
        tratarSqueezeStartControllerVR(infoControladorDoEventoVR(evento));
    });
    sessao.addEventListener("squeezeend", evento => {
        tratarSqueezeEndControllerVR(infoControladorDoEventoVR(evento));
    });
}

function criarMaoRastreadaVR(indice) {
    if (!vrRenderer.xr.getHand) return null;
    let mao;
    try {
        mao = vrRenderer.xr.getHand(indice);
    } catch (erro) {
        // Alguns runtimes expõem a API no renderer, mas não implementam mãos.
        // A sessão continua utilizável com os controladores.
        console.warn("VR: hand tracking indisponível neste runtime:", erro && erro.message);
        return null;
    }
    if (!mao) return null;

    // O r160 constrói a lista em getHand() (sincronamente se a fonte já ligou)
    // e cria as juntas em connect(). Ligamos sempre o modelo aos XRJointSpace
    // que o renderer atualizará por frame; se conectarem mais tarde, o listener
    // connected atualiza o mapa quando o Three.js já tiver criado as juntas.
    const modelo = new THREE.Group();
    modelo.visible = false;
    modelo.userData.juntas = new Map();
    if (mao.joints && Object.keys(mao.joints).length) {
        const modeloInicial = criarModeloArticuladoMaoVR(mao);
        modelo.userData = modeloInicial.userData;
        modelo.add(...modeloInicial.children);
    }
    mao.add(modelo);
    vrScene.add(mao);
    const info = {
        mao, modelo, indice, habilitada: false, rastreada: false,
        estadoPinca: ESTADO_PINCA_VR.ABERTO,
        pincaFecharDesde: 0, pincaFechadoDesde: 0, pincaAbrirDesde: 0,
        objetoAgarrado: null, ancora: null, inputSourceTemMao: false, ladoHand: "right",
        inputSource: null, rastreioPerdidoDesde: 0,
        alvoRaio: null, interseçãoRaio: null, distanciaRaio: ALCANCE_RAIO_MAO_VR,
        alvoPinch: null, alvoHover: null, alvoHoverTempo: 0,
        origemRaio: new THREE.Vector3(), direcaoRaioSuave: new THREE.Vector3(),
        raioInicializado: false, raioPinçaTrancado: false, raioMao: null, indicadorPinça: null,
        fimRaioMundo: new THREE.Vector3(), baseIndicador: new THREE.Vector3(),
        segmentoIndicadorTmp: new THREE.Vector3(), juntaIndicadorTmp: new THREE.Vector3(),
        pontaPolegar: new THREE.Vector3(), pontaIndicador: new THREE.Vector3(),
        palmaMundo: new THREE.Vector3(),
        palmaLocal: new THREE.Vector3(), direcaoRaio: new THREE.Vector3(),
        rotacaoAlvo: new THREE.Quaternion(), escalaAlvo: new THREE.Vector3()
    };
    mao.addEventListener("pinchstart", () => {
        // O evento WebXR antecede a flexão final do indicador. Congela JÁ o
        // alvo que estava sob o raio — mesmo que o raio fique oculto nesta
        // frame por o indicador começar a fletir. O gesto não pode escolher
        // um alvo novo a meio da pinça.
        if (vrModoInteracao !== MODO_INTERACAO_VR.MAOS
            || !info.habilitada || !maoEstaRastreadaVR(info)) return;
        iniciarPincaVR(info, performance.now());
    });
    mao.addEventListener("connected", evento => {
        associarInputSourceMaoVR(info, evento.data);
    });
    mao.addEventListener("disconnected", () => {
        info.inputSource = null;
        info.inputSourceTemMao = false;
        if (info.modelo) info.modelo.visible = false;
        reiniciarEstadoMaoVR(info);
        atualizarVisibilidadeMaoVR(info);
    });
    modelo.userData.sentidoPalma = 1;
    vrMaosInfo.push(info);
    return info;
}

function associarInputSourceMaoVR(info, inputSource) {
    info.inputSource = inputSource || null;
    info.inputSourceTemMao = !!(info.inputSource && info.inputSource.hand);
    info.habilitada = !!(vrSessaoAtiva && info.inputSourceTemMao);
    // As juntas dão o plano e a orientação; handedness escolhe qual face do
    // plano corresponde à palma em ambas as mãos.
    info.ladoHand = (info.inputSource?.handedness === "left") ? "left" : "right";
    if (info.inputSourceTemMao && (!info.modelo.userData.juntas
        || info.modelo.userData.juntas.size === 0)
        && Object.keys(info.mao.joints || {}).length > 0) {
        const modeloArticulado = criarModeloArticuladoMaoVR(info.mao);
        info.modelo.clear();
        info.modelo.userData = modeloArticulado.userData;
        info.modelo.add(...modeloArticulado.children);
    }
    if (info.modelo && info.modelo.userData) {
        info.modelo.userData.sentidoPalma = info.ladoHand === "left" ? -1 : 1;
    }
    atualizarVisibilidadeMaoVR(info);
}

function inputSourceControllerValidaVR(info) {
    const fonte = info && info.inputSource;
    return !!(fonte && !fonte.hand && fonte.targetRayMode === "tracked-pointer");
}

function controllerTemTrackingValidoVR(info) {
    return !!(vrSessaoAtiva && inputSourceControllerValidaVR(info)
        && info.controlador && info.controlador.visible && info.rastreioPoseValido);
}

function atualizarRastreioControllersVR() {
    if (!vrSessaoAtiva || !vrRenderer || !vrRenderer.xr) return;
    const xr = vrRenderer.xr;
    const frame = xr.getFrame && xr.getFrame();
    const espacoReferencia = xr.getReferenceSpace && xr.getReferenceSpace();
    for (const info of vrControladoresInfo) {
        const fonte = info.inputSource;
        let pose = null;
        if (frame && espacoReferencia && fonte && fonte.targetRaySpace
            && typeof frame.getPose === "function") {
            try {
                pose = frame.getPose(fonte.targetRaySpace, espacoReferencia);
            } catch (_) {
                pose = null;
            }
        }
        info.rastreioPoseValido = !!pose;
        if (!info.controlador) continue;
        if (pose && pose.transform) {
            // Aplica a pose real do targetRaySpace (o mesmo espaço que o
            // runtime usa para o raio do comando).
            const t = pose.transform;
            info.controlador.position.set(t.position.x, t.position.y, t.position.z);
            info.controlador.quaternion.set(t.orientation.x, t.orientation.y,
                t.orientation.z, t.orientation.w);
            info.controlador.scale.set(1, 1, 1);
            info.controlador.visible = true;
            info.controlador.updateMatrixWorld(true);
        } else {
            info.controlador.visible = false;
        }
    }
}

function fontesMaosRastreadaVR() {
    return vrMaosInfo.some(info => maoEstaRastreadaVR(info));
}

function fontesControllersRastreadasVR() {
    return vrControladoresInfo.some(info => controllerTemTrackingValidoVR(info));
}

function definirFonteControllerVR(info, fonte) {
    if (!info || info.inputSource === fonte) return false;
    // Um comando que desaparece não pode deixar um gesto ou um objeto preso.
    if (info.objetoAgarrado) soltarAstroVR(info);
    info.gatilhoPuxado = false;
    info.gatilhoInicio = 0;
    info.astroSelecionavel = null;
    info.astroParaAgarrar = null;
    info.rastreioPerdidoDesde = 0;
    cancelarHoldBotaoVR(info);
    if (info.laser) {
        info.laser.visible = false;
        info.laser.material.color.setHex(0x6eb8ff);
    }
    if (info.controlador) info.controlador.visible = false;
    info.inputSource = fonte || null;
    info.rastreioPoseValido = false;
    return true;
}

function sincronizarFontesEntradaVR(sessao) {
    if (!sessao || !sessao.inputSources) return;
    const fontes = Array.from(sessao.inputSources);
    // Só comandos físicos. As mãos têm o seu próprio fluxo (XRHand) e não
    // entram nesta lista.
    const disponiveis = fontes.filter(fonte => fonte && !fonte.hand
        && fonte.targetRayMode === "tracked-pointer");
    const usadas = new Set();
    const atribuicoes = new Map();
    // A handedness é o identificador estável do comando; a ordem de
    // session.inputSources não é (o runtime pode intercalar mãos e comandos).
    for (const info of vrControladoresInfo) {
        const fonte = disponiveis.find(f => !usadas.has(f) && f.handedness === info.lado);
        if (fonte) {
            usadas.add(fonte);
            atribuicoes.set(info, fonte);
        }
    }
    // Runtimes que reportam handedness "none": usa o primeiro comando livre.
    for (const info of vrControladoresInfo) {
        if (atribuicoes.has(info)) continue;
        const fonte = disponiveis.find(f => !usadas.has(f));
        if (fonte) {
            usadas.add(fonte);
            atribuicoes.set(info, fonte);
        }
    }
    let alteradas = false;
    for (const info of vrControladoresInfo) {
        if (definirFonteControllerVR(info, atribuicoes.get(info) || null)) alteradas = true;
    }
    if (alteradas) atualizarVisibilidadeInteracaoVR();
}

function atualizarArbitragemInteracaoVR(agora = performance.now()) {
    if (!vrSessaoAtiva) return;
    const controllers = fontesControllersRastreadasVR();
    const maos = fontesMaosRastreadaVR();
    // O controller tem prioridade quando está realmente a fornecer pose. Se
    // desaparecer, a mão só reassume depois da janela de perda confirmada.
    const desejado = controllers ? MODO_INTERACAO_VR.CONTROLLER
        : maos ? MODO_INTERACAO_VR.MAOS : MODO_INTERACAO_VR.NENHUM;
    if (desejado === vrModoInteracao) {
        vrModoInteracaoCandidato = null;
        vrModoInteracaoCandidatoDesde = 0;
        return;
    }
    if (vrModoInteracao !== MODO_INTERACAO_VR.NENHUM
        && desejado === MODO_INTERACAO_VR.NENHUM) {
        if (desejado !== vrModoInteracaoCandidato) {
            vrModoInteracaoCandidato = desejado;
            vrModoInteracaoCandidatoDesde = agora;
        }
        const metodoAtualDisponivel = vrModoInteracao === MODO_INTERACAO_VR.CONTROLLER
            ? controllers : maos;
        if (metodoAtualDisponivel) {
            vrModoInteracaoCandidato = null;
            vrModoInteracaoCandidatoDesde = 0;
            return;
        }
        if (agora - vrModoInteracaoCandidatoDesde < TOLERANCIA_PERDA_INPUT_VR_MS) return;
        definirModoInteracaoVR(MODO_INTERACAO_VR.NENHUM);
        return;
    }
    if (vrModoInteracao === MODO_INTERACAO_VR.CONTROLLER
        && desejado === MODO_INTERACAO_VR.MAOS) {
        if (desejado !== vrModoInteracaoCandidato) {
            vrModoInteracaoCandidato = desejado;
            vrModoInteracaoCandidatoDesde = agora;
            return;
        }
        if (controllers || agora - vrModoInteracaoCandidatoDesde < TOLERANCIA_PERDA_INPUT_VR_MS) return;
        definirModoInteracaoVR(MODO_INTERACAO_VR.MAOS);
        return;
    }
    if (desejado !== vrModoInteracaoCandidato) {
        vrModoInteracaoCandidato = desejado;
        vrModoInteracaoCandidatoDesde = agora;
        return;
    }
    const metodoAtualDisponivel = vrModoInteracao === MODO_INTERACAO_VR.CONTROLLER
        ? controllers : vrModoInteracao === MODO_INTERACAO_VR.MAOS ? maos : false;
    const confirmaMs = desejado === MODO_INTERACAO_VR.CONTROLLER
        ? CONFIRMAR_CONTROLLER_VR_MS : CONFIRMAR_HAND_TRACKING_VR_MS;
    const janela = Math.max(confirmaMs,
        vrModoInteracao !== MODO_INTERACAO_VR.NENHUM && !metodoAtualDisponivel
            ? TOLERANCIA_PERDA_INPUT_VR_MS : 0);
    if (agora - vrModoInteracaoCandidatoDesde < janela) return;
    definirModoInteracaoVR(desejado);
}

function definirModoInteracaoVR(modo) {
    if (modo === vrModoInteracao) return;
    const anterior = vrModoInteracao;
    vrModoInteracao = modo;
    vrModoInteracaoCandidato = null;
    vrModoInteracaoCandidatoDesde = 0;

    if (anterior === MODO_INTERACAO_VR.MAOS) {
        for (const info of vrMaosInfo) {
            ocultarRaioMaoVR(info);
            reiniciarEstadoMaoVR(info, false);
            if (info.modelo) info.modelo.visible = false;
        }
        // Uma apresentação já iniciada continua a seguir os joints da palma,
        // mas a mão deixa de emitir ray/pinch enquanto o controller é primário.
    }
    if (anterior === MODO_INTERACAO_VR.CONTROLLER
        && modo === MODO_INTERACAO_VR.MAOS) {
        for (const info of vrMaosInfo) {
            info.rastreada = true;
            info.rastreioPerdidoDesde = 0;
            cancelarPincaVR(info);
            info.raioInicializado = false;
        }
    }
    if (anterior === MODO_INTERACAO_VR.CONTROLLER) {
        for (const info of vrControladoresInfo) {
            if (info.objetoAgarrado) soltarAstroVR(info);
            info.gatilhoPuxado = false;
            info.gatilhoInicio = 0;
            if (info.laser) info.laser.material.color.setHex(0x6eb8ff);
            info.astroSelecionavel = null;
            info.astroParaAgarrar = null;
            cancelarHoldBotaoVR(info);
            if (info.hover && !info.hover.userData.vrEscalaOriginal) info.hover.scale.setScalar(1);
            info.hover = null;
        }
        if (vrGripTemporizador) {
            clearTimeout(vrGripTemporizador);
            vrGripTemporizador = null;
        }
    }
    atualizarVisibilidadeInteracaoVR();
}

function atualizarVisibilidadeInteracaoVR() {
    for (const info of vrControladoresInfo) {
        if (info.laser) {
            info.laser.visible = vrModoInteracao === MODO_INTERACAO_VR.CONTROLLER
                && controllerTemTrackingValidoVR(info);
        }
    }
    for (const info of vrMaosInfo) {
        const apresentar = !!(vrApresentado && vrApresentado.info === info);
        const rastreada = maoEstaRastreadaVR(info);
        const ativa = vrModoInteracao === MODO_INTERACAO_VR.MAOS && rastreada;
        if (info.modelo) info.modelo.visible = rastreada && (ativa || apresentar);
        if (info.modelo) mostrarModeloDaMaoVR(info);
        if (!ativa && info.raioMao) info.raioMao.visible = false;
    }
}

// ── Geometria da palma (topologia fixa, vértices atualizados por mão) ──────
// A palma em superelipse é articulada pelas juntas do pulso, bases dos dedos
// e metacarpo do polegar, recalculadas no referencial local da mão.
function criarGeometriaPalmaVR() {
    const aneis = ANEIS_PALMA_MAO_VR; // secções do pulso às bases dos dedos
    const colunas = COLUNAS_PALMA_MAO_VR; // contorno arredondado da secção
    const vertices = aneis * colunas + 2;
    const posicoes = new Float32Array(vertices * 3);
    const indices = [];
    const expoente = 2 / 3.0; // superelipse arredondada, não um plano/elipsoide
    const superelipse = v => Math.sign(v) * Math.pow(Math.abs(v), expoente);

    for (let anel = 0; anel < aneis; anel++) {
        const t = anel / (aneis - 1);
        const meiaLargura = 0.32 + 0.18 * Math.pow(t, 0.8); // pulso estreito → nós largos
        const meiaEspessura = 0.15 + 0.10 * Math.sin(Math.PI * (0.08 + 0.82 * t));
        for (let col = 0; col < colunas; col++) {
            const angulo = col / colunas * Math.PI * 2;
            const xNorm = superelipse(Math.cos(angulo));
            const zNorm = superelipse(Math.sin(angulo));
            const x = meiaLargura * xNorm;
            let z = meiaEspessura * zNorm;
            // Copo anatómico discreto na face palmar, entre o pulso e os nós.
            if (z > 0) {
                const concavidade = Math.max(0, 1 - xNorm * xNorm)
                    * Math.sin(Math.PI * Math.max(0, Math.min(1, (t - 0.12) / 0.76)));
                z -= 0.075 * concavidade;
            }
            const indice = (anel * colunas + col) * 3;
            posicoes[indice] = x;
            posicoes[indice + 1] = t - 0.5;
            posicoes[indice + 2] = z;
        }
    }
    const indicesPulso = aneis * colunas;
    const indicesNos = indicesPulso + 1;
    for (let col = 0; col < colunas; col++) {
        const seguinte = (col + 1) % colunas;
        // Tampa pulso (-Y) e nós (+Y), com normais voltadas para fora.
        indices.push(indicesPulso, col, seguinte);
        const baseNos = (aneis - 1) * colunas;
        indices.push(indicesNos, baseNos + seguinte, baseNos + col);
        for (let anel = 0; anel < aneis - 1; anel++) {
            const atual = anel * colunas + col;
            const prox = anel * colunas + seguinte;
            const cima = (anel + 1) * colunas + col;
            const cimaProx = (anel + 1) * colunas + seguinte;
            indices.push(atual, cima, prox, prox, cima, cimaProx);
        }
    }
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute("position",
        new THREE.BufferAttribute(posicoes, 3).setUsage(THREE.DynamicDrawUsage));
    geometria.setIndex(indices);
    geometria.computeVertexNormals();
    return geometria;
}

function criarModeloArticuladoMaoVR(mao) {
    const modelo = new THREE.Group();
    modelo.name = "modelo-articulado-mao-vr";
    const juntasModelo = new Map();

    const materialMao = new THREE.MeshStandardMaterial({
        color: 0x3a5c85, roughness: 0.40, metalness: 0.14,
        emissive: 0x0a1a30, emissiveIntensity: 0.36,
        // O mesmo acabamento em palma e dedos evita que pareçam peças distintas.
        side: THREE.DoubleSide
    });
    // Contorno holográfico discreto: um Fresnel calculado no shader standard
    // realça a silhueta da mão sem duplicar malhas nem usar transparência (que
    // no VR cria ordenação imprevisível entre dedos). É só um termo emissivo,
    // por isso mantém o custo de um único MeshStandardMaterial por malha.
    materialMao.onBeforeCompile = shader => {
        shader.fragmentShader = shader.fragmentShader.replace(
            "#include <normal_fragment_maps>",
            `#include <normal_fragment_maps>
            float fresnelMaoVR = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.4);
            totalEmissiveRadiance += vec3(0.06, 0.26, 0.55) * fresnelMaoVR * 0.90;`
        );
    };
    materialMao.customProgramCacheKey = () => "astroguide-mao-vr-fresnel";
    const direcaoLocal = new THREE.Vector3();
    const eixoReferenciaLocal = new THREE.Vector3(0, 0, 1);
    const eixoAlternativoLocal = new THREE.Vector3(1, 0, 0);
    const vetorLateral = new THREE.Vector3();
    const vetorNormal = new THREE.Vector3();
    const centroAmostra = new THREE.Vector3();
    const centroAntes = new THREE.Vector3();
    const centroDepois = new THREE.Vector3();
    const pulsoLocal = new THREE.Vector3();
    const inicioPulsoPalma = new THREE.Vector3();
    const raizesPalma = ["index-finger-metacarpal", "middle-finger-metacarpal",
        "ring-finger-metacarpal", "pinky-finger-metacarpal"].map(nome => mao.joints[nome] || null);
    const pontosRaizesPalma = raizesPalma.map(() => new THREE.Vector3());
    const centroNosPalma = new THREE.Vector3();
    const centroPalmaLocal = new THREE.Vector3();
    const basePolegarLocal = new THREE.Vector3();
    const deltaPolegarLocal = new THREE.Vector3();
    const normalPalmaLocal = new THREE.Vector3();
    const longitudinalPalmaLocal = new THREE.Vector3();
    const lateralPalma = new THREE.Vector3();
    const longitudinalPalma = new THREE.Vector3();
    const normalPalma = new THREE.Vector3();
    const secaoPalma = new THREE.Vector3();
    // Geometria da palma exclusiva desta mão para que as bases reais dos
    // cinco dedos possam esculpir o contorno sem partilhar vértices mutáveis.
    const geometriaPalma = criarGeometriaPalmaVR();
    const posicoesPalma = geometriaPalma.attributes.position;
    const aneisPalma = ANEIS_PALMA_MAO_VR;
    const colunasPalma = COLUNAS_PALMA_MAO_VR;
    const centroPulsoPalma = aneisPalma * colunasPalma;
    const centroNosPalmaIndice = centroPulsoPalma + 1;
    modelo.userData.sentidoPalma = 1;
    modelo.userData.palmaCentro = centroPalmaLocal;
    modelo.userData.palmaNormal = normalPalmaLocal;
    modelo.userData.palmaDirecaoLongitudinal = longitudinalPalmaLocal;
    const malhaPalma = new THREE.Mesh(geometriaPalma, materialMao);
    malhaPalma.frustumCulled = false;
    // Decorativa: a palma nunca pode interferir com raycasting/colisões —
    // os alvos de seleção são sempre os astros e os botões do painel.
    malhaPalma.raycast = () => {};
    modelo.add(malhaPalma);
    modelo.userData.malhaPalma = malhaPalma;
    const matrizMaoInversa = new THREE.Matrix4();
    const nomes = ["wrist", "thumb-metacarpal", "thumb-phalanx-proximal", "thumb-phalanx-distal", "thumb-tip"];
    for (const dedo of ["index", "middle", "ring", "pinky"]) {
        nomes.push(`${dedo}-finger-metacarpal`, `${dedo}-finger-phalanx-proximal`,
            `${dedo}-finger-phalanx-intermediate`, `${dedo}-finger-phalanx-distal`, `${dedo}-finger-tip`);
    }
    for (const nome of nomes) {
        if (mao.joints[nome]) juntasModelo.set(nome, { articulacao: mao.joints[nome] });
    }

    // Espessuras próprias de cada dedo: o indicador e o médio são os mais
    // fortes, o anelar desce ligeiramente e o mindinho é claramente mais fino.
    // O polegar tem uma base mais cheia, como o então real. As pontas são mais
    // estreitas, mas não até um ponto: a calote final é construída abaixo.
    const raiosDedos = {
        index: [0.0102, 0.0094, 0.0084, 0.0069, 0.0044],
        middle: [0.0106, 0.0098, 0.0088, 0.0072, 0.0046],
        ring: [0.0098, 0.0090, 0.0080, 0.0065, 0.0041],
        pinky: [0.0086, 0.0079, 0.0069, 0.0056, 0.0037]
    };
    const dedos = [
        { nomes: ["thumb-metacarpal", "thumb-phalanx-proximal", "thumb-phalanx-distal", "thumb-tip"],
            raios: [0.0118, 0.0094, 0.0074, 0.0052], extensaoBase: 0.012,
            fluxoBase: 1.14, material: materialMao },
        ...["index", "middle", "ring", "pinky"].map(nome => ({
            nomes: [`${nome}-finger-metacarpal`, `${nome}-finger-phalanx-proximal`,
                `${nome}-finger-phalanx-intermediate`, `${nome}-finger-phalanx-distal`, `${nome}-finger-tip`],
            raios: raiosDedos[nome], extensaoBase: 0.020, fluxoBase: 1.18, material: materialMao
        }))
    ];
    const malhasDedos = [];
    for (const dedo of dedos) {
        const articulacoes = dedo.nomes.map(nome => mao.joints[nome]);
        if (articulacoes.some(articulacao => !articulacao)) continue;
        const subdivisions = SUBDIVISOES_DEDO_MAO_VR;
        // Um anel adicional começa alguns milímetros dentro da palma. As
        // malhas continuam a ser guiadas pelos joints reais, mas a base deixa
        // de terminar exatamente na superfície e parecer um dedo separado.
        // Os últimos anéis pertencem à calote arredondada da ponta.
        const anéis = articulacoes.length * subdivisions + 1
            + (INTERVALOS_CAPA_DEDO_MAO_VR - 1);
        const lados = SEGMENTOS_RADIAIS_DEDO_MAO_VR;
        const geometria = new THREE.BufferGeometry();
        const indicePonta = anéis * lados;
        const indiceBase = indicePonta + 1;
        const posicoes = new Float32Array((anéis * lados + 2) * 3);
        const indice = [];
        for (let anel = 0; anel < anéis - 1; anel++) {
            for (let lado = 0; lado < lados; lado++) {
                const atual = anel * lados + lado;
                const seguinte = anel * lados + (lado + 1) % lados;
                const abaixo = (anel + 1) * lados + lado;
                const abaixoSeguinte = (anel + 1) * lados + (lado + 1) % lados;
                // Angular-then-axial winding keeps tube normals pointing out.
                indice.push(atual, seguinte, abaixo, seguinte, abaixoSeguinte, abaixo);
            }
        }
        const anelFinal = (anéis - 1) * lados;
        for (let lado = 0; lado < lados; lado++) {
            const seguinte = (lado + 1) % lados;
            indice.push(indiceBase, seguinte, lado);
            indice.push(indicePonta, anelFinal + lado, anelFinal + seguinte);
        }
        geometria.setAttribute("position", new THREE.BufferAttribute(posicoes, 3).setUsage(THREE.DynamicDrawUsage));
        geometria.setIndex(indice);
        const malha = new THREE.Mesh(geometria, dedo.material);
        malha.frustumCulled = false;
        modelo.add(malha);
        malhasDedos.push({ articulacoes, centros: articulacoes.map(() => new THREE.Vector3()),
            centroBase: new THREE.Vector3(), direcaoPonta: new THREE.Vector3(),
            pontaCap: new THREE.Vector3(),
            raios: [dedo.raios[0] * dedo.fluxoBase, ...dedo.raios],
            extensaoBase: dedo.extensaoBase,
            raioPonta: dedo.raios[dedo.raios.length - 1],
            geometria, posicoes, malha, subdivisions, anéis, lados, indicePonta, indiceBase });
    }

    function centroCurvaDedo(dedo, segmento, t, destino) {
        const p1 = dedo.centros[segmento];
        const p2 = dedo.centros[segmento + 1];
        const p0 = dedo.centros[Math.max(0, segmento - 1)];
        const p3 = dedo.centros[Math.min(dedo.centros.length - 1, segmento + 2)];
        const t2 = t * t, t3 = t2 * t;
        destino.set(
            0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
            0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
            0.5 * ((2 * p1.z) + (-p0.z + p2.z) * t + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3)
        );
        return destino;
    }

    function curvaSuave(a, b, x) {
        const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
        return u * u * (3 - 2 * u);
    }

    modelo.userData.atualizar = () => {
        mao.updateMatrixWorld(true);
        matrizMaoInversa.copy(mao.matrixWorld).invert();
        for (const dedo of malhasDedos) {
            let visivel = true;
            for (let i = 0; i < dedo.articulacoes.length; i++) {
                const articulacao = dedo.articulacoes[i];
                if (!articulacao.visible || !articulacao.parent) {
                    visivel = false;
                    break;
                }
                articulacao.getWorldPosition(dedo.centros[i]);
                dedo.centros[i].applyMatrix4(matrizMaoInversa);
            }
            dedo.malha.visible = visivel;
            if (!visivel) continue;

            const raiz = dedo.centros[0];
            const seguinte = dedo.centros[1];
            const direcaoRaiz = centroDepois.subVectors(seguinte, raiz).normalize();
            dedo.centroBase.copy(raiz).addScaledVector(direcaoRaiz, -dedo.extensaoBase);

            // A ponta arredondada continua a curva do último joint numa calote
            // curta. O eixo é o da falange distal; os anéis encolhem como um
            // hemisfério, em vez de fecharem num cone.
            const ponta = dedo.centros[dedo.centros.length - 1];
            const anteriorPonta = dedo.centros[dedo.centros.length - 2];
            dedo.direcaoPonta.subVectors(ponta, anteriorPonta).normalize();
            const valorPonta = dedo.articulacoes.length;

            for (let anel = 0; anel < dedo.anéis; anel++) {
                const valor = anel / dedo.subdivisions;
                let raioSegmento;
                if (valor < 1) {
                    const t = valor;
                    centroAmostra.copy(dedo.centroBase).lerp(raiz, t);
                    raioSegmento = dedo.raios[0]
                        + (dedo.raios[1] - dedo.raios[0]) * t;
                    direcaoLocal.copy(direcaoRaiz);
                } else if (valor <= valorPonta) {
                    const valorDedo = valor - 1;
                    const segmento = Math.min(dedo.articulacoes.length - 2,
                        Math.floor(valorDedo));
                    const t = Math.min(1, valorDedo - segmento);
                    centroCurvaDedo(dedo, segmento, t, centroAmostra);
                    raioSegmento = dedo.raios[segmento + 1]
                        + (dedo.raios[segmento + 2] - dedo.raios[segmento + 1]) * t;
                    centroCurvaDedo(dedo, segmento, Math.max(0, t - 0.04), centroAntes);
                    centroCurvaDedo(dedo, segmento, Math.min(1, t + 0.04), centroDepois);
                    direcaoLocal.subVectors(centroDepois, centroAntes).normalize();
                } else {
                    const u = Math.min(1, (valor - valorPonta) * dedo.subdivisions
                        / INTERVALOS_CAPA_DEDO_MAO_VR);
                    const anguloCapa = u * Math.PI / 2;
                    centroAmostra.copy(ponta).addScaledVector(dedo.direcaoPonta,
                        dedo.raioPonta * Math.sin(anguloCapa));
                    raioSegmento = dedo.raioPonta * Math.cos(anguloCapa);
                    direcaoLocal.copy(dedo.direcaoPonta);
                }
                vetorLateral.crossVectors(direcaoLocal, eixoReferenciaLocal);
                if (vetorLateral.lengthSq() < 0.0001) vetorLateral.crossVectors(direcaoLocal, eixoAlternativoLocal);
                vetorLateral.normalize();
                vetorNormal.crossVectors(vetorLateral, direcaoLocal).normalize();
                for (let lado = 0; lado < dedo.lados; lado++) {
                    const angulo = lado / dedo.lados * Math.PI * 2;
                    const offsetLateral = Math.cos(angulo) * raioSegmento;
                    const offsetNormal = Math.sin(angulo) * raioSegmento * 0.88;
                    const indiceVertice = (anel * dedo.lados + lado) * 3;
                    dedo.posicoes[indiceVertice] = centroAmostra.x + vetorLateral.x * offsetLateral + vetorNormal.x * offsetNormal;
                    dedo.posicoes[indiceVertice + 1] = centroAmostra.y + vetorLateral.y * offsetLateral + vetorNormal.y * offsetNormal;
                    dedo.posicoes[indiceVertice + 2] = centroAmostra.z + vetorLateral.z * offsetLateral + vetorNormal.z * offsetNormal;
                }
            }
            dedo.pontaCap.copy(ponta).addScaledVector(dedo.direcaoPonta, dedo.raioPonta);
            const indicePonta = dedo.indicePonta * 3;
            dedo.posicoes[indicePonta] = dedo.pontaCap.x;
            dedo.posicoes[indicePonta + 1] = dedo.pontaCap.y;
            dedo.posicoes[indicePonta + 2] = dedo.pontaCap.z;
            const indiceBase = dedo.indiceBase * 3;
            dedo.posicoes[indiceBase] = dedo.centroBase.x;
            dedo.posicoes[indiceBase + 1] = dedo.centroBase.y;
            dedo.posicoes[indiceBase + 2] = dedo.centroBase.z;
            dedo.geometria.attributes.position.needsUpdate = true;
            dedo.geometria.computeVertexNormals();
        }

        // Palma orgânica em coordenadas locais da mão. Pulso e quatro bases
        // metacarpianas definem o contorno; a base do polegar cria a eminência
        // tenar e o mindinho a hipotenar. A topologia é fixa e atualiza 618
        // vértices por mão/frame (22 anéis × 28 colunas + 2 centros).
        const pulsoPalma = mao.joints.wrist;
        const polegarPalma = mao.joints["thumb-metacarpal"];
        const juntasRaizesValidas = raizesPalma.every(j => j && j.visible)
            && polegarPalma && polegarPalma.visible;
        if (pulsoPalma && pulsoPalma.visible && juntasRaizesValidas) {
            pulsoPalma.getWorldPosition(pulsoLocal).applyMatrix4(matrizMaoInversa);
            for (let i = 0; i < raizesPalma.length; i++) {
                raizesPalma[i].getWorldPosition(pontosRaizesPalma[i]).applyMatrix4(matrizMaoInversa);
            }
            centroNosPalma.set(0, 0, 0);
            for (const ponto of pontosRaizesPalma) centroNosPalma.add(ponto);
            centroNosPalma.multiplyScalar(1 / pontosRaizesPalma.length);
            lateralPalma.subVectors(pontosRaizesPalma[3], pontosRaizesPalma[0]).normalize();
            longitudinalPalma.subVectors(centroNosPalma, pulsoLocal);
            const comprimento = longitudinalPalma.length();
            if (comprimento > 0.001 && lateralPalma.lengthSq() > 0.001) {
                longitudinalPalma.addScaledVector(lateralPalma,
                    -longitudinalPalma.dot(lateralPalma)).normalize();
                // Continua a palma alguns centímetros pelo pulso, formando um
                // antebraço curto e afunilado ligado à mesma superfície.
                inicioPulsoPalma.copy(pulsoLocal)
                    .addScaledVector(longitudinalPalma, -0.038);
                polegarPalma.getWorldPosition(basePolegarLocal).applyMatrix4(matrizMaoInversa);
                const projecaoPolegar = deltaPolegarLocal
                    .subVectors(basePolegarLocal, centroNosPalma).dot(lateralPalma);
                const ladoTenar = Math.sign(projecaoPolegar) || 1;
                centroPalmaLocal.copy(pulsoLocal).lerp(centroNosPalma, 0.52);
                // Usa a ordem real das juntas e escolhe a face palmar pela mão.
                normalPalma.crossVectors(longitudinalPalma, lateralPalma).normalize()
                    .multiplyScalar(modelo.userData.sentidoPalma || 1);
                normalPalmaLocal.copy(normalPalma);
                longitudinalPalmaLocal.copy(longitudinalPalma);
                const largura = Math.max(0.085,
                    pontosRaizesPalma[3].distanceTo(pontosRaizesPalma[0]) * 1.20);
                const meiaEspessura = Math.max(0.010, Math.min(0.016, largura * 0.082));
                const forcaTenar = Math.max(0,
                    Math.abs(projecaoPolegar) - largura * 0.18);
                for (let anel = 0; anel < aneisPalma; anel++) {
                    const t = anel / (aneisPalma - 1);
                    // Perfil longitudinal: pulso redondo e estreito, palma a
                    // alargar e a espessar, nós ligeiramente mais largos.
                    const formaLargura = 0.56 + 0.30 * curvaSuave(0, 0.36, t)
                        + 0.16 * curvaSuave(0.36, 1, t);
                    const formaEspessura = 0.66 + 0.34 * curvaSuave(0, 0.36, t)
                        - 0.06 * curvaSuave(0.36, 1, t);
                    const expoente = 0.72 - 0.07 * t;
                    const perfilTenar = curvaSuave(0.02, 0.28, t)
                        * (1 - curvaSuave(0.72, 0.98, t));
                    const perfilHipo = curvaSuave(0, 0.22, t)
                        * (1 - curvaSuave(0.55, 0.88, t));
                    for (let col = 0; col < colunasPalma; col++) {
                        const a = col / colunasPalma * Math.PI * 2;
                        const c = Math.cos(a), s = Math.sin(a);
                        const xNorm = Math.sign(c) * Math.pow(Math.abs(c), expoente);
                        const zNorm = Math.sign(s) * Math.pow(Math.abs(s), expoente);
                        const palmar = zNorm > 0;
                        const xBase = xNorm * largura * 0.5 * formaLargura;
                        // Eminência tenar (polegar) e hipotenar (mindinho):
                        // volumes suaves, não esferas coladas à palma.
                        const pesoLadoTenar = Math.max(0, (1 + ladoTenar * xNorm) * 0.5);
                        const tenar = ladoTenar * forcaTenar * 0.62 * perfilTenar
                            * pesoLadoTenar * pesoLadoTenar;
                        const pesoLadoHipo = Math.max(0, (1 - ladoTenar * xNorm) * 0.5);
                        const hipo = -ladoTenar * 0.0022 * perfilHipo
                            * pesoLadoHipo * pesoLadoHipo;
                        const x = xBase + tenar + hipo;
                        let z = zNorm * meiaEspessura * formaEspessura
                            * (palmar ? 0.86 : 1.08);
                        if (palmar) {
                            // Copo palmar discreto + cheio tenar.
                            const concavidade = 0.0038 * Math.max(0, 1 - xNorm * xNorm)
                                * Math.sin(Math.PI * Math.max(0, Math.min(1, (t - 0.08) / 0.80)));
                            z -= concavidade;
                            z += 0.0028 * perfilTenar * pesoLadoTenar * pesoLadoTenar;
                        } else {
                            // Dorso ligeiramente mais cheio, sem relevos extra.
                            z -= 0.0008 * Math.max(0, 1 - xNorm * xNorm)
                                * Math.sin(Math.PI * t);
                        }
                        secaoPalma.copy(inicioPulsoPalma).lerp(centroNosPalma, t)
                            .addScaledVector(lateralPalma, x)
                            .addScaledVector(normalPalma, z);
                        posicoesPalma.setXYZ(anel * colunasPalma + col, secaoPalma.x, secaoPalma.y, secaoPalma.z);
                    }
                }
                // Fecha o pulso com uma calote curta, não com um disco plano.
                secaoPalma.copy(inicioPulsoPalma)
                    .addScaledVector(longitudinalPalma, -0.012);
                posicoesPalma.setXYZ(centroPulsoPalma,
                    secaoPalma.x, secaoPalma.y, secaoPalma.z);
                posicoesPalma.setXYZ(centroNosPalmaIndice, centroNosPalma.x, centroNosPalma.y, centroNosPalma.z);
                posicoesPalma.needsUpdate = true;
                geometriaPalma.computeVertexNormals();
                malhaPalma.position.set(0, 0, 0);
                malhaPalma.quaternion.identity();
                malhaPalma.scale.setScalar(1);
                malhaPalma.visible = true;
            } else {
                malhaPalma.visible = false;
            }
        } else {
            malhaPalma.visible = false;
        }
    };
    modelo.userData.juntas = juntasModelo;
    modelo.userData.malhasDedos = malhasDedos.map(dedo => dedo.malha);
    return modelo;
}

function criarRaioMaoVR(info) {
    const geometria = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(), new THREE.Vector3(0, 0, -ALCANCE_RAIO_MAO_VR)
    ]);
    const material = new THREE.LineBasicMaterial({
        color: 0x51dcff, transparent: true, opacity: 0.78,
        depthWrite: false, blending: THREE.AdditiveBlending
    });
    const linha = new THREE.Line(geometria, material);
    linha.frustumCulled = false;
    linha.renderOrder = 5;
    linha.visible = false;
    const ponto = new THREE.Mesh(
        new THREE.SphereGeometry(1, 12, 10),
        new THREE.MeshBasicMaterial({ color: 0x83f2ff, transparent: true, opacity: 0.9,
            depthWrite: false, blending: THREE.AdditiveBlending })
    );
    ponto.scale.setScalar(0.035);
    ponto.renderOrder = 6;
    ponto.visible = false;
    info.raioMao = linha;
    info.indicadorPinça = ponto;
    vrScene.add(linha, ponto);
    return linha;
}

function definirDestaquePinçaVR(info, objeto, interseção) {
    if (info.indicadorPinça) {
        const mostrarPonto = !!(objeto && portadorDeDadosVR(objeto, "astro") && interseção);
        info.indicadorPinça.visible = mostrarPonto;
        if (mostrarPonto) info.indicadorPinça.position.copy(interseção.point);
    }
    const alvoAstronómico = objeto && portadorDeDadosVR(objeto, "astro");
    const alvoAnterior = info.destaquePinça;
    if (alvoAnterior && alvoAnterior !== alvoAstronómico) {
        const estadoAnterior = vrDestaquesPinça.get(alvoAnterior);
        if (estadoAnterior) estadoAnterior.ativo = false;
    }
    if (alvoAnterior === alvoAstronómico) {
        const estado = alvoAstronómico && vrDestaquesPinça.get(alvoAstronómico);
        if (estado) {
            estado.ativo = true;
            return;
        }
        if (!alvoAstronómico || alvoAstronómico.userData.vrAgarrado) return;
    }
    info.destaquePinça = alvoAstronómico;
    if (!info.destaquePinça || info.destaquePinça.userData.vrAgarrado
        || vrEscalasSelecaoVR.has(info.destaquePinça)
        || vrAstroVisualSelecionado === info.destaquePinça) return;
    let estado = vrDestaquesPinça.get(info.destaquePinça);
    if (!estado) {
        estado = { escalaBase: info.destaquePinça.scale.clone(), intensidade: 0, ativo: true };
        vrDestaquesPinça.set(info.destaquePinça, estado);
    } else {
        estado.ativo = true;
    }
}

function atualizarDestaquesPinçaVR(deltaTime) {
    // Um pequeno Map só contém astros atualmente a aumentar/diminuir; os que
    // já chegaram ao fator-alvo deixam de precisar de actualização por frame.
    for (const [objeto, estado] of vrEscalasSelecaoVR) {
        if (!objeto || !objeto.parent) {
            vrEscalasSelecaoVR.delete(objeto);
            if (vrAstroVisualSelecionado === objeto) vrAstroVisualSelecionado = null;
            continue;
        }
        if (vrApresentado && vrApresentado.objeto === objeto) continue;
        estado.tempoMs = Math.min(estado.duracaoMs, estado.tempoMs + Math.max(0, deltaTime) * 1000);
        const t = estado.duracaoMs > 0 ? Math.min(1, estado.tempoMs / estado.duracaoMs) : 1;
        const suave = t * t * (3 - 2 * t);
        const fator = estado.inicio + (estado.alvo - estado.inicio) * suave;
        estado.scaleAtual = fator;
        objeto.scale.copy(estado.scaleOriginal).multiplyScalar(fator);
        if (t >= 1) {
            objeto.scale.copy(estado.scaleOriginal).multiplyScalar(estado.alvo);
            vrEscalasSelecaoVR.delete(objeto);
            if (estado.alvo !== FATOR_DESTAQUE_SELECAO_VR) {
                objeto.userData.vrDestaqueSelecionado = 1;
                if (vrAstroVisualSelecionado === objeto) vrAstroVisualSelecionado = null;
            }
        }
    }
    const alpha = 1 - Math.exp(-Math.max(0, Math.min(deltaTime, 0.1)) / 0.09);
    for (const [objeto, estado] of vrDestaquesPinça) {
        if (objeto.userData.vrAgarrado) {
            // Não repor a escala astronómica: agarrar acabou de dimensionar
            // o objeto para caber na mão.
            vrDestaquesPinça.delete(objeto);
            continue;
        }
        const alvo = estado.ativo ? 1 : 0;
        estado.intensidade += (alvo - estado.intensidade) * alpha;
        const fator = 1 + (ESCALA_DESTAQUE_MAO_VR - 1) * estado.intensidade;
        objeto.scale.set(
            estado.escalaBase.x * fator,
            estado.escalaBase.y * fator,
            estado.escalaBase.z * fator
        );
        if (!estado.ativo && estado.intensidade < 0.002) {
            objeto.scale.copy(estado.escalaBase);
            vrDestaquesPinça.delete(objeto);
        }
    }
}

function ocultarRaioMaoVR(info) {
    if (info.raioMao) info.raioMao.visible = false;
    info.alvoRaio = null;
    info.interseçãoRaio = null;
    definirDestaquePinçaVR(info, null, null);
}

// ── Máquina do pinch (CLICK, não GRAB) ─────────────────────────────────────
// O alvo é capturado no início do gesto e nunca é recalculado durante a
// pinça. Uma pinça no vazio entra na mesma máquina, mas termina sem seleção.
function alvoHoverPincaVR(info, agora) {
    const alvo = info && info.alvoHover;
    if (!alvo || !alvo.userData || !alvo.userData.astro) return null;
    if (alvo.parent !== vrGrupoAstros) return null;
    if (!info.alvoHoverTempo
        || agora - info.alvoHoverTempo > MEMORIA_ALVO_PINCA_VR_MS) return null;
    return alvo;
}

function iniciarPincaVR(info, agora = performance.now()) {
    if (!info) return;
    if (info.estadoPinca !== ESTADO_PINCA_VR.ABERTO
        && info.estadoPinca !== ESTADO_PINCA_VR.APONTANDO) return;
    info.estadoPinca = ESTADO_PINCA_VR.PINCH_START;
    info.pincaFecharDesde = agora;
    info.pincaFechadoDesde = 0;
    info.pincaAbrirDesde = 0;
    // Guarda o astro do último frame de pointing. O raio fica congelado e o
    // movimento natural do indicador durante o gesto não muda este alvo.
    info.alvoPinch = alvoHoverPincaVR(info, agora);
    info.raioPinçaTrancado = true;
}

function cancelarPincaVR(info) {
    if (!info) return;
    info.estadoPinca = ESTADO_PINCA_VR.ABERTO;
    info.pincaFecharDesde = 0;
    info.pincaFechadoDesde = 0;
    info.pincaAbrirDesde = 0;
    info.alvoPinch = null;
    info.alvoHover = null;
    info.alvoHoverTempo = 0;
    info.raioPinçaTrancado = false;
}

function finalizarPincaVR(info) {
    cancelarPincaVR(info);
}

function atualizarMaquinaPincaVR(info, distanciaPinca, agora) {
    if (!info) return;
    const estado = info.estadoPinca;
    if (estado === ESTADO_PINCA_VR.ABERTO || estado === ESTADO_PINCA_VR.APONTANDO) {
        // O evento pinchstart é a via principal. Este fallback só entra com a
        // pinça realmente fechada — uma mão relaxada com o polegar perto do
        // indicador (3–4 cm) não pode congelar o raio sem intenção de click.
        if (distanciaPinca <= LIMIAR_PINCA_FECHAR_VR) iniciarPincaVR(info, agora);
        return;
    }
    if (estado === ESTADO_PINCA_VR.PINCH_START) {
        // Abriu antes de fechar: o gesto não é um click. Exige abertura
        // estável para não cancelar com o ruído natural da pré-pinça.
        if (distanciaPinca >= LIMIAR_PINCA_ABRIR_VR) {
            if (info.pincaAbrirDesde === 0) info.pincaAbrirDesde = agora;
            if (agora - info.pincaAbrirDesde >= ESTABILIZAR_ABERTURA_VR_MS) {
                cancelarPincaVR(info);
            }
            return;
        }
        info.pincaAbrirDesde = 0;
        if (distanciaPinca <= LIMIAR_PINCA_FECHAR_VR) {
            if (info.pincaFechadoDesde === 0) info.pincaFechadoDesde = agora;
        } else {
            info.pincaFechadoDesde = 0;
        }
        if (info.pincaFechadoDesde === 0) return;
        if (agora - info.pincaFecharDesde < ESTABILIZAR_PINCA_VR_MS) return;
        if (agora - info.pincaFechadoDesde < ESTABILIZAR_FECHO_VR_MS) return;
        info.estadoPinca = ESTADO_PINCA_VR.PINCHADO;
        info.pincaAbrirDesde = 0;
        disparaCliquePincaVR(info);
        return;
    }
    if (estado === ESTADO_PINCA_VR.PINCHADO || estado === ESTADO_PINCA_VR.LIBERTAR) {
        if (distanciaPinca >= LIMIAR_PINCA_ABRIR_VR) {
            if (info.pincaAbrirDesde === 0) info.pincaAbrirDesde = agora;
            info.estadoPinca = ESTADO_PINCA_VR.LIBERTAR;
            if (agora - info.pincaAbrirDesde >= ESTABILIZAR_ABERTURA_VR_MS) {
                finalizarPincaVR(info);
            }
        } else {
            // Fechou de novo antes da libertação confirmada: continua o mesmo
            // gesto, sem emitir um segundo click.
            info.pincaAbrirDesde = 0;
            if (estado === ESTADO_PINCA_VR.LIBERTAR) {
                info.estadoPinca = ESTADO_PINCA_VR.PINCHADO;
            }
        }
    }
}

function atualizarRaioMaoVR(info, deltaTime) {
    if (!info || !info.habilitada || !maoEstaRastreadaVR(info)) {
        if (info) {
            ocultarRaioMaoVR(info);
            info.raioInicializado = false;
        }
        return null;
    }
    // Enquanto a pinça está em curso (PINCH_START/PINCHADO/LIBERTAR), o raio
    // fica CONGELADO: origem, direção, linha desenhada e alvo mantêm-se
    // exatamente como estavam. A ligeira flexão do indicador para juntar-se
    // ao polegar nunca desloca o apontamento nem perde o alvo de seleção.
    if (info.raioPinçaTrancado) return info.interseçãoRaio;
    const juntas = info.mao.joints;
    const nomes = [
        "index-finger-metacarpal", "index-finger-phalanx-proximal",
        "index-finger-phalanx-intermediate", "index-finger-phalanx-distal", "index-finger-tip"
    ];
    const dedo = nomes.map(nome => juntas[nome]);
    if (dedo.some(junta => !junta || !junta.visible)) {
        ocultarRaioMaoVR(info);
        info.raioInicializado = false;
        return null;
    }

    const metacarpo = juntas["index-finger-metacarpal"];
    const proximal = juntas["index-finger-phalanx-proximal"];
    const media = juntas["index-finger-phalanx-intermediate"];
    const distal = juntas["index-finger-phalanx-distal"];
    const ponta = juntas["index-finger-tip"];
    metacarpo.getWorldPosition(info.baseIndicador);
    proximal.getWorldPosition(info.juntaIndicadorTmp);
    media.getWorldPosition(info.segmentoIndicadorTmp);
    distal.getWorldPosition(info.pontaIndicador);
    ponta.getWorldPosition(info.origemRaio);
    const comprimentoCaminho = info.baseIndicador.distanceTo(info.juntaIndicadorTmp)
        + info.juntaIndicadorTmp.distanceTo(info.segmentoIndicadorTmp)
        + info.segmentoIndicadorTmp.distanceTo(info.pontaIndicador)
        + info.pontaIndicador.distanceTo(info.origemRaio);
    const comprimentoDireto = info.baseIndicador.distanceTo(info.origemRaio);
    const extensaoIndicador = comprimentoCaminho > 0 ? comprimentoDireto / comprimentoCaminho : 0;
    const comprimentoDistal = info.pontaIndicador.distanceTo(info.origemRaio);
    if (comprimentoDireto < 0.055 || extensaoIndicador < 0.76 || comprimentoDistal < 0.008) {
        ocultarRaioMaoVR(info);
        info.raioInicializado = false;
        return null;
    }

    info.direcaoRaioSuave.subVectors(info.origemRaio, info.pontaIndicador).normalize();
    if (!info.raioInicializado) {
        info.direcaoRaio.copy(info.direcaoRaioSuave);
        info.raioInicializado = true;
    } else {
        const alpha = 1 - Math.exp(-Math.max(0, deltaTime) / SUAVIZAR_RAIO_MAO_VR);
        info.direcaoRaio.lerp(info.direcaoRaioSuave, alpha).normalize();
    }

    info.raioMao = info.raioMao || criarRaioMaoVR(info);
    info.raioMao.visible = true;
    vrRaycaster.camera = vrCamera;
    const nearAnterior = vrRaycaster.near;
    const farAnterior = vrRaycaster.far;
    vrRaycaster.near = 0;
    vrRaycaster.far = ALCANCE_RAIO_MAO_VR;
    vrRaycaster.ray.set(info.origemRaio, info.direcaoRaio);
    const intersecoes = vrRaycaster.intersectObjects(alvosDeSelecaoVR(), true);
    // Não altera o alcance dos controladores, que reutilizam este Raycaster.
    vrRaycaster.near = nearAnterior;
    vrRaycaster.far = farAnterior;
    const escolhido = alvoSobRaioVR(intersecoes);
    // As mãos só interagem com ASTROS: os botões de ação do painel 3D
    // («SAIR DO VR», «Vista geral»,…) continuam exclusivos do comando —
    // uma pinça destinada a um planeta, ou qualquer passagem fugaz pelo
    // painel, nunca pode acionar UI externa nem terminar a sessão.
    info.alvoRaio = escolhido ? portadorDeDadosVR(escolhido.object, "astro") : null;
    info.interseçãoRaio = escolhido;
    info.distanciaRaio = escolhido ? escolhido.distance : ALCANCE_RAIO_MAO_VR;
    // Memória curta do alvo de pointing. Se o indicador fletir e o raio
    // desaparecer antes de o evento pinchstart chegar, este é o alvo que o
    // gesto captura. Apontar para o vazio limpa-a imediatamente.
    if (info.alvoRaio) {
        info.alvoHover = info.alvoRaio;
        info.alvoHoverTempo = performance.now();
        if (info.estadoPinca === ESTADO_PINCA_VR.ABERTO
            || info.estadoPinca === ESTADO_PINCA_VR.APONTANDO) {
            info.estadoPinca = ESTADO_PINCA_VR.APONTANDO;
        }
    } else {
        info.alvoHover = null;
        info.alvoHoverTempo = 0;
        if (info.estadoPinca === ESTADO_PINCA_VR.ABERTO
            || info.estadoPinca === ESTADO_PINCA_VR.APONTANDO) {
            info.estadoPinca = ESTADO_PINCA_VR.ABERTO;
        }
    }
    const alcance = escolhido ? Math.max(0, escolhido.distance - 0.01) : ALCANCE_RAIO_MAO_VR;
    const fim = info.fimRaioMundo.copy(info.direcaoRaio).multiplyScalar(alcance).add(info.origemRaio);
    const vertices = info.raioMao.geometry.attributes.position;
    vertices.setXYZ(0, info.origemRaio.x, info.origemRaio.y, info.origemRaio.z);
    vertices.setXYZ(1, fim.x, fim.y, fim.z);
    vertices.needsUpdate = true;
    info.raioMao.geometry.computeBoundingSphere();
    definirDestaquePinçaVR(info, info.alvoRaio, escolhido);
    return escolhido;
}

function paiJuntaMaoVR(nome) {
    if (nome === "thumb-metacarpal") return "wrist";
    if (nome === "thumb-phalanx-proximal") return "thumb-metacarpal";
    if (nome === "thumb-phalanx-distal") return "thumb-phalanx-proximal";
    if (nome === "thumb-tip") return "thumb-phalanx-distal";
    const correspondencia = nome.match(/^(index|middle|ring|pinky)-finger-(metacarpal|phalanx-proximal|phalanx-intermediate|phalanx-distal|tip)$/);
    if (!correspondencia) return null;
    const [, dedo, parte] = correspondencia;
    if (parte === "metacarpal") return "wrist";
    if (parte === "phalanx-proximal") return `${dedo}-finger-metacarpal`;
    if (parte === "phalanx-intermediate") return `${dedo}-finger-phalanx-proximal`;
    if (parte === "phalanx-distal") return `${dedo}-finger-phalanx-intermediate`;
    return `${dedo}-finger-phalanx-distal`;
}

function atualizarVisibilidadeMaoVR(info) {
    if (!info || !info.mao) return;
    const fonteComMao = !!(info.inputSourceTemMao || (info.inputSource && info.inputSource.hand));
    const ativa = !!(vrSessaoAtiva && info.habilitada && fonteComMao);
    info.mao.visible = ativa;
    const apresentar = !!(vrApresentado && vrApresentado.info === info);
    if (info.modelo) {
        info.modelo.visible = ativa && (vrModoInteracao === MODO_INTERACAO_VR.MAOS || apresentar)
            && info.modelo.userData.juntas instanceof Map
            && info.modelo.userData.juntas.size > 0;
        mostrarModeloDaMaoVR(info);
    }
    if (info.infoInput && info.infoInput.laser) {
        info.infoInput.laser.visible = vrModoInteracao === MODO_INTERACAO_VR.CONTROLLER
            && controllerTemTrackingValidoVR(info.infoInput);
    }
}

function mostrarModeloDaMaoVR(info) {
    if (!info || !info.modelo) return;
    const visivel = vrModoInteracao === MODO_INTERACAO_VR.MAOS && info.rastreada;
    if (info.modelo.userData.malhaPalma) {
        info.modelo.userData.malhaPalma.visible = visivel;
    }
    if (info.modelo.userData.malhasDedos) {
        for (const malha of info.modelo.userData.malhasDedos) malha.visible = visivel;
    }
}

function articularJuntasMaoVR(info) {
    if (!info || !info.modelo) return;
    const rastreioValido = maoEstaRastreadaVR(info);
    const apresentar = !!(vrApresentado && vrApresentado.info === info);
    info.modelo.visible = rastreioValido
        && (vrModoInteracao === MODO_INTERACAO_VR.MAOS || apresentar);
    if (rastreioValido && info.modelo.userData.atualizar) {
        info.modelo.userData.atualizar();
        mostrarModeloDaMaoVR(info);
    }
}

function articulacaoMaoVR(info, nomes) {
    const articulacoes = info.mao && info.mao.joints;
    if (!articulacoes) return null;
    for (const nome of nomes) {
        if (articulacoes[nome]) return articulacoes[nome];
    }
    return null;
}

function maoEstaRastreadaVR(info) {
    if (!info || !info.habilitada || !info.mao || !info.mao.visible) return false;
    const pulso = articulacaoMaoVR(info, ["wrist"]);
    const polegar = articulacaoMaoVR(info, ["thumb-tip"]);
    const indicador = articulacaoMaoVR(info, ["index-finger-tip"]);
    if (!pulso || !polegar || !indicador) return false;
    return pulso.visible && polegar.visible && indicador.visible;
}

function reiniciarEstadoMaoVR(info, libertar = true) {
    if (!info) return;
    if (libertar) {
        if (info.objetoAgarrado) soltarAstroVR(info);
        // Mãos nunca fazem grabbing, mas podem ter o planeta apresentado na
        // palma: perda de tracking/disconexão devolve-o suavemente ao céu.
        if (vrApresentado && vrApresentado.info === info) libertarApresentacaoVR();
    }
    if (info.infoInput) {
        info.infoInput.gatilhoPuxado = false;
        info.infoInput.astroSelecionavel = null;
        info.infoInput.astroParaAgarrar = null;
        cancelarHoldBotaoVR(info.infoInput);
    }
    info.rastreada = false;
    info.rastreioPerdidoDesde = 0;
    info.raioInicializado = false;
    cancelarPincaVR(info);
}

function raycastMaoVR(info) {
    // O raio contínuo do indicador já consultou o Raycaster neste frame;
    // reaproveita o alvo exato para que seleção e feedback coincidam.
    return info && info.raioMao && info.raioMao.visible ? info.alvoRaio : null;
}

function posicaoPalmaLocalVR(info) {
    if (info.mao && info.mao.updateMatrixWorld) info.mao.updateMatrixWorld(true);
    const ancora = articulacaoMaoVR(info, ["wrist"]);
    const baseIndicador = articulacaoMaoVR(info, ["index-finger-metacarpal", "index-finger-phalanx-proximal"]);
    const baseMindinho = articulacaoMaoVR(info, ["pinky-finger-metacarpal", "pinky-finger-phalanx-proximal"]);
    if (!ancora || !ancora.visible) return null;

    ancora.getWorldPosition(info.palmaMundo);
    if (baseIndicador && baseIndicador.visible) {
        baseIndicador.getWorldPosition(info.baseIndicador);
        if (baseMindinho && baseMindinho.visible) {
            baseMindinho.getWorldPosition(info.pontaIndicador);
            info.baseIndicador.add(info.pontaIndicador).multiplyScalar(0.5);
        }
        info.palmaMundo.lerp(info.baseIndicador, 0.55);
    }
    ancora.worldToLocal(info.palmaMundo);
    return info.palmaMundo;
}

function atualizarMaosVR(deltaTime) {
    for (const estado of vrDestaquesPinça.values()) estado.ativo = false;
    const agora = performance.now();
    for (const info of vrMaosInfo) {
        if (vrModoInteracao !== MODO_INTERACAO_VR.MAOS || !info.habilitada) {
            if (info.raioMao) info.raioMao.visible = false;
            if (vrApresentado && vrApresentado.info === info && maoEstaRastreadaVR(info)) {
                // Atualiza só a transformação da palma para o objeto já
                // apresentado continuar a acompanhá-la; sem raycast/pinch.
                articularJuntasMaoVR(info);
            } else if (info.modelo) {
                info.modelo.visible = false;
            }
            continue;
        }
        if (!maoEstaRastreadaVR(info)) {
            // Esconde imediatamente a pose e o ray stale, mas tolera uma breve
            // perda de joints sem cancelar pinch/apresentação por oscilação.
            if (info.modelo) {
                info.modelo.visible = !!(vrApresentado && vrApresentado.info === info);
                mostrarModeloDaMaoVR(info);
            }
            ocultarRaioMaoVR(info);
            if (!info.rastreioPerdidoDesde) info.rastreioPerdidoDesde = agora;
            if (agora - info.rastreioPerdidoDesde >= TOLERANCIA_PERDA_INPUT_VR_MS
                && (info.rastreada || info.objetoAgarrado
                    || (vrApresentado && vrApresentado.info === info))) {
                reiniciarEstadoMaoVR(info);
            }
            continue;
        }
        info.rastreioPerdidoDesde = 0;
        info.rastreada = true;
        if (info.mao.updateMatrixWorld) info.mao.updateMatrixWorld(true);
        articularJuntasMaoVR(info);
        atualizarRaioMaoVR(info, deltaTime);
        const polegar = articulacaoMaoVR(info, ["thumb-tip"]);
        const indicador = articulacaoMaoVR(info, ["index-finger-tip"]);
        polegar.getWorldPosition(info.pontaPolegar);
        indicador.getWorldPosition(info.pontaIndicador);
        const distanciaPinça = info.pontaPolegar.distanceTo(info.pontaIndicador);
        if (vrGrabAtivo && vrGrabAtivo.info !== info) {
            // O controlador controla já um objeto: a mão fica em pausa —
            // sem pinças pendentes que pudessem disparar cliques depois.
            cancelarPincaVR(info);
            continue;
        }

        // A máquina trata o gesto como CLICK: o alvo é congelado no
        // PINCH_START e não muda com o movimento natural do indicador.
        atualizarMaquinaPincaVR(info, distanciaPinça, agora);
    }

    // O astro apresentado na palma é atualizado fora do loop de mãos —
    // disparaCliquePincaVR/atualizarApresentacaoVR cuidam do tracking
    // perdido e da adaptação fina à orientação da palma.
    atualizarApresentacaoVR(deltaTime);
}

// ── CLICK da pinça ─────────────────────────────────────────────────────────
// Dispara UMA vez por gesto, no instante em que a pinça estabiliza fechada.
// Sem planeta na palma, seleciona o astro guardado no PINCH_START. Com um
// planeta ON_HAND, o mesmo gesto devolve-o (RETURNING). Espaço vazio / botão
// de ação: simplesmente IGNORA — sem seleção, sem mover, sem sair do
// Observatório, sem tocar na UI externa.
function disparaCliquePincaVR(info) {
    if (vrModoInteracao !== MODO_INTERACAO_VR.MAOS
        || info.estadoPinca !== ESTADO_PINCA_VR.PINCHADO
        || !maoEstaRastreadaVR(info)) return;
    // MOVING_TO_HAND e RETURNING estão bloqueados: o planeta está a caminho
    // ou a voltar, e um pinch acidental não pode trocar/substituir o alvo.
    if (estadoApresentacaoVR === ESTADO_APRESENTACAO_VR.MOVING_TO_HAND
        || estadoApresentacaoVR === ESTADO_APRESENTACAO_VR.RETURNING) return;
    // Com o planeta já na palma, um NOVO pinch (não o que o selecionou) é o
    // gesto de devolver. Vale mesmo que o raio não esteja sobre um astro: o
    // planeta apresentado está fora dos alvos de raycast.
    if (estadoApresentacaoVR === ESTADO_APRESENTACAO_VR.ON_HAND) {
        if (vrApresentado) {
            limparSelecaoVR();
            // Defensivo: limparSelecaoVR pode não chegar ao astro apresentado
            // se houver uma seleção de comando concorrente; o segundo pinch
            // tem sempre de o devolver.
            if (vrApresentado) libertarApresentacaoVR();
        } else {
            estadoApresentacaoVR = ESTADO_APRESENTACAO_VR.NORMAL;
        }
        return;
    }
    // Só o alvo congelado no PINCH_START pode ser selecionado. Não há
    // fallback para o raio atual: uma pinça no vazio nunca escolhe nada.
    const alvo = info.alvoPinch;
    if (!alvo || !alvo.userData || !alvo.userData.astro) return;
    if (alvo.parent !== vrGrupoAstros) return;
    if (alvo.userData.vrRegressando) interromperRegressoAstroVR(alvo);
    selecionarAstroVR(alvo.userData.astro, { apresentarEmMao: true, infoMao: info });
}

function criarLaser(cor) {
    const pontos = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -120)];
    const geometria = new THREE.BufferGeometry().setFromPoints(pontos);
    geometria.computeBoundingSphere();
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

    // Proteção contra sessões duplicadas: se já existe uma ativa (nossa ou do
    // próprio renderer), não se pede outra.
    const sessaoExistente = vrSessaoXR || (vrRenderer.xr.getSession && vrRenderer.xr.getSession());
    if (sessaoExistente) {
        console.warn("VR: já existe uma sessão ativa — não é possível abrir outra.");
        return;
    }

    const botao = document.getElementById("btn-iniciar-vr");
    if (botao) botao.disabled = true;

    // DOM Overlay: se o navegador o suportar (o Quest Browser suporta), o botão
    // HTML «SAIR DO VR» também aparece dentro dos óculos. É uma funcionalidade
    // OPCIONAL: se não for suportada, é ignorada e a saída faz-se pelo botão 3D
    // da cena ou pelos controlos do sistema do headset.
    const overlay = document.getElementById("vr-overlay");
    const opcoes = {
        optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking", "dom-overlay"]
    };
    if (overlay) opcoes.domOverlay = { root: overlay };

    try {
        const sessao = await navigator.xr.requestSession("immersive-vr", opcoes);
        try {
            await vrRenderer.xr.setSession(sessao);
        } catch (errLigacao) {
            // A sessão foi pedida mas não pôde ser ligada ao renderer — termina-
            // se já, para não deixar uma sessão "órfã" aberta no headset.
            sessao.end().catch(() => {});
            throw errLigacao;
        }
        vrSessaoXR = sessao;
        const funcionalidadesAtivas = sessao.enabledFeatures;
        // enabledFeatures apenas declara capacidade; a fonte XRInputSource
        // com hand e as juntas visíveis é que provam tracking efetivo.
        // Os comandos escutam os eventos da própria sessão e reconstroem a
        // correspondência a partir de session.inputSources.
        configurarEventosControllerSessaoVR(sessao);
        for (const info of vrControladoresInfo) {
            info.rastreioPoseValido = false;
            if (info.controlador) info.controlador.visible = false;
        }
        // As mãos podem ter recebido o "connected" antes de vrSessaoAtiva
        // ficar true; reavalia-se a fonte já associada agora que a sessão
        // existe. Não se inventa nem se remapeia por índice.
        for (const info of vrMaosInfo) {
            if (info.inputSource) associarInputSourceMaoVR(info, info.inputSource);
        }
        vrModoInteracao = MODO_INTERACAO_VR.NENHUM;
        vrModoInteracaoCandidato = null;
        vrModoInteracaoCandidatoDesde = 0;
        sincronizarFontesEntradaVR(sessao);
        atualizarVisibilidadeInteracaoVR();

        // Qualquer que seja o caminho de saída (botão 3D, DOM Overlay, sistema
        // do Quest), o evento "end" da sessão garante a recuperação da interface.
        sessao.addEventListener("end", () => {
            if (vrSessaoXR === sessao) vrSessaoXR = null;
            restaurarInterfaceAposSessao();
        }, { once: true });
    } catch (err) {
        console.error("Falha ao iniciar sessão VR:", err);
        if (botao) {
            botao.disabled = false;
            const ajuda = document.getElementById("vr-ajuda");
            if (ajuda) ajuda.textContent = "Não foi possível entrar em VR: " + err.message;
        }
    }
}

// Termina a sessão XR, se houver uma ativa (chamado pelo «SAIR DO VR» e ao
// sair do ecrã VR). Se não há sessão nenhuma (clique duplo, ou saída já feita
// pelo sistema), não faz nada — nunca lança erro por terminar algo inexistente.
function sairSessaoVR() {
    const sessao = vrSessaoXR
        || (vrRenderer && vrRenderer.xr.getSession && vrRenderer.xr.getSession());
    if (!sessao) {
        restaurarInterfaceAposSessao();
        return;
    }
    vrSessaoXR = null;
    sessao.end().catch(err => {
        // InvalidStateError = a sessão já tinha terminado; não é falha nossa.
        console.warn("VR: ao terminar a sessão (pode já ter terminado):", err && err.message);
        restaurarInterfaceAposSessao();
    });
}

// O botão HTML «SAIR DO VR» do DOM Overlay (dentro dos óculos). Durante a
// sessão imersiva este botão NUNCA é acionado pelo gatilho: o navegador
// sintetiza um clique DOM quando o raio o cruza a meio de um pulso, e esse
// clique terminava a sessão — clicar num planeta baixo ou no espaço vazio saía
// do VR por aqui, e a janela de tempo do clique sintetizado nem sempre é
// previsível. Dentro dos óculos a saída faz-se pelo botão 3D «SAIR DO VR»,
// pelo grip (pressão mantida) ou pelos controlos do sistema do Quest; fora de
// sessão o clique normal (rato/toque, testes no PC) continua a valer.
function sairSessaoVRDoOverlay(evento) {
    if (vrSessaoAtiva) {
        evento.preventDefault();
        evento.stopPropagation();
        return;
    }
    sairSessaoVR();
}

// Restaura a interface normal quando a sessão termina — por QUALQUER caminho
// (botão «SAIR DO VR», DOM Overlay, sistema do Quest, erro). Idempotente:
// pode ser chamada várias vezes sem efeitos laterais.
function restaurarInterfaceAposSessao() {
    vrModoInteracao = MODO_INTERACAO_VR.NENHUM;
    vrModoInteracaoCandidato = null;
    vrModoInteracaoCandidatoDesde = 0;
    if (vrGripTemporizador) {
        clearTimeout(vrGripTemporizador);
        vrGripTemporizador = null;
    }
    // Liberta primeiro a apresentação na palma (se existir): o astro regressa
    // ao céu em vez de ficar preso a uma pose congelada da mão fora de VR.
    if (vrApresentado) libertarApresentacaoVR();
    estadoApresentacaoVR = ESTADO_APRESENTACAO_VR.NORMAL;
    if (vrGrabAtivo) soltarAstroVR(vrGrabAtivo.info);
    vrMaosInfo.forEach(info => {
        reiniciarEstadoMaoVR(info, false);
        info.habilitada = false;
        info.inputSource = null;
        info.inputSourceTemMao = false;
        if (info.mao) info.mao.visible = false;
        if (info.modelo) info.modelo.visible = false;
    });
    vrControladoresInfo.forEach(info => {
        if (info.objetoAgarrado) soltarAstroVR(info);
        if (info.maoInfo) {
            info.maoInfo.inputSource = null;
            info.maoInfo.inputSourceTemMao = false;
            info.maoInfo.habilitada = false;
            info.maoInfo.mao.visible = false;
            if (info.maoInfo.modelo) info.maoInfo.modelo.visible = false;
        }
        if (info.laser) info.laser.visible = false;
        if (info.laser) info.laser.material.color.setHex(0x6eb8ff);
        if (info.controlador) info.controlador.visible = false;
        info.inputSource = null;
        info.rastreioPoseValido = false;
        info.gatilhoPuxado = false;
        info.gatilhoInicio = 0;
        info.astroSelecionavel = null;
        info.astroParaAgarrar = null;
        cancelarHoldBotaoVR(info);
    });
    vrSessaoAtiva = false;
    vrSessaoXR = null;
    document.body.classList.remove("vr-sessao");
    removerPainelUI3D();

    const botao = document.getElementById("btn-iniciar-vr");
    if (botao && !botao.classList.contains("indisponivel")) botao.disabled = false;
}

// ── Arrasto do rato (modo PC) ───────────────────────────────────────────────
function vrIniciarArrasto(e) {
    if (vrSessaoAtiva) return;
    vrArrastando = true;
    vrArrastou = false;
    vrStartX = e.clientX;
    vrStartY = e.clientY;
    vrStartYaw = vrYaw;
    vrStartPitch = vrPitch;
}

function vrMoverArrasto(e) {
    if (!vrArrastando || vrSessaoAtiva) return;
    const dx = e.clientX - vrStartX;
    const dy = e.clientY - vrStartY;
    if (Math.abs(dx) + Math.abs(dy) > 4) vrArrastou = true;

    // Durante uma aproximação suave a orientação é da câmara; o arrasto espera.
    if (vrZoomAtivo) return;

    const sensibilidade = 0.005;

    vrYaw = vrStartYaw - dx * sensibilidade;
    vrPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, vrStartPitch - dy * sensibilidade));
}

function vrTerminarArrasto() {
    vrArrastando = false;
}

// Clique do rato sem arrastar = selecionar o astro apontado (modo PC)
function vrCliqueRato(e) {
    if (vrSessaoAtiva || vrArrastou) return;
    const alvo = e.target;
    if (!alvo || !alvo.getBoundingClientRect || !vrCamera) return;
    const rect = alvo.getBoundingClientRect();
    if (!vrUltimoRatoNDC) vrUltimoRatoNDC = new THREE.Vector2();
    vrUltimoRatoNDC.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    selecionarComRaycastVR(vrCamera);
}

// ── Ciclo de animação (normal e XR) ─────────────────────────────────────────
function vrAnimar() {
    if (!vrRenderer) return;

    // Delta de tempo limitado: mantém a rotação visual estável mesmo quando o
    // browser faz pausas (troca de separador, carregamento de recursos, etc.)
    const agoraMs = (typeof performance !== "undefined") ? performance.now() : Date.now();
    const dt = Math.max(0, Math.min((agoraMs - (vrUltimoTempoMs || agoraMs)) / 1000, 0.1));
    vrUltimoTempoMs = agoraMs;

    // Rotação VISUAL suave das esferas — só a textura gira à volta do próprio
    // eixo. Não confundir com cálculo astronómico: as posições vêm todas do
    // /api/observatorio e não são tocadas. O ângulo acumula-se por astro (ver
    // vrRotacoesVisuais) para sobreviver aos rebuilds do grupo.
    if (vrGrupoAstros) {
        for (const obj of vrGrupoAstros.children) {
            if (obj.userData.esfera && obj.userData.rotacaoVel && obj.userData.astro
                && !obj.userData.vrAgarrado && !obj.userData.vrRegressando) {
                const nome = obj.userData.astro.nome;
                const angulo = (vrRotacoesVisuais[nome] || 0) + obj.userData.rotacaoVel * dt;
                vrRotacoesVisuais[nome] = angulo;
                obj.userData.esfera.rotation.y = angulo;
            }
        }
    }

    // Fora de uma sessão XR, a câmara é controlada pelo rato — ou pela
    // aproximação suave, enquanto esta estiver ativa
    if (!vrSessaoAtiva) {
        if (vrZoomAtivo && vrPosCameraAlvo) {
            vrCamera.position.lerp(vrPosCameraAlvo, 0.08);
            vrCamera.lookAt(vrOlharAlvo);
            // Mantém o yaw/pitch do rato alinhados com a câmara, para quando a
            // aproximação terminar a orientação não saltar.
            vrYaw = vrCamera.rotation.y;
            vrPitch = vrCamera.rotation.x;
            if (vrCamera.position.distanceTo(vrPosCameraAlvo) < 0.6
                && vrPosCameraAlvo.lengthSq() < 1) {
                vrZoomAtivo = false; // chegou à vista geral
            }
        } else {
            vrCamera.rotation.y = vrYaw;
            vrCamera.rotation.x = vrPitch;
        }
    }

    // O painel de detalhes acompanha a câmara no PC (aproximação): fica sempre
    // por cima do planeta, à mesma distância aparente. Numa sessão XR não se
    // mexe — o utilizador é que anda, e uma legenda colada à cabeça não é céu.
    if (!vrSessaoAtiva) posicionarPainelInfoVR();

    // Input de mãos, controladores e transições usam o loop XR existente; os
    // grupos/articulações e listeners são preparados uma única vez.
    if (vrSessaoAtiva) {
        sincronizarFontesEntradaVR(vrSessaoXR || vrRenderer.xr.getSession());
        atualizarRastreioControllersVR();
        atualizarArbitragemInteracaoVR(agoraMs);
        atualizarMaosVR(dt);
        atualizarMiradoresVR();
    }
    // Continua a concluir o fade de destaques iniciado no fim do tracking,
    // mesmo depois de a sessão XR terminar.
    atualizarDestaquesPinçaVR(dt);
    atualizarRegressosAstrosVR(dt);

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

// ── Seleção de astros e botões (raycasting) ─────────────────────────────────
// Um só raio, reutilizado: cliques do rato (modo PC) e gatilho dos
// controladores. Só age sobre alvos da lista — nunca interfere com a
// navegação quando não há nada apontado.
function alvosDeSelecaoVR() {
    // Cache: reconstruído só quando os grupos mudam (astros novos, painel
    // criado/removido) — o raycast do laser corre todos os frames em sessão e
    // não deve andar a construir listas novas a cada tique.
    if (!vrAlvosCache) {
        const alvos = [];
        if (vrGrupoAstros) {
            for (const objeto of vrGrupoAstros.children) {
                // Durante o regresso o astro continua selecionável para que um
                // novo aperto possa interromper a animação e agarrá-lo de novo.
                if (!objeto.userData.vrAgarrado) alvos.push(objeto);
            }
        }
        if (vrPainelUI3D) alvos.push(vrPainelUI3D);
        vrAlvosCache = alvos;
    }
    return vrAlvosCache;
}

function raycastVR(origem) {
    if (!vrRaycaster || !origem) return [];
    // O Raycaster.camera é obrigatório para o raycast de SPRITES (etiquetas,
    // ISS, marcador) — sem ele, o three ignora-os todos e regista erros.
    vrRaycaster.camera = vrCamera;
    if (origem === vrCamera) {
        if (!vrUltimoRatoNDC) return [];
        vrRaycaster.setFromCamera(vrUltimoRatoNDC, origem);
    } else {
        // Controlador XR: o raio vai ao longo do seu -Z (como o laser desenhado)
        const inicio = vrTempOrigem || new THREE.Vector3();
        const direcao = vrTempDirecao || new THREE.Vector3();
        const quat = vrTempQuat || new THREE.Quaternion();
        inicio.setFromMatrixPosition(origem.matrixWorld);
        origem.getWorldQuaternion(quat);
        direcao.set(0, 0, -1).applyQuaternion(quat);
        vrRaycaster.ray.set(inicio, direcao);
    }
    return vrRaycaster.intersectObjects(alvosDeSelecaoVR(), true);
}

// Sobe na hierarquia até encontrar o objeto que carrega a propriedade pedida
// (o mesh do botão tem "acao"; o grupo do astro tem "astro").
function portadorDeDadosVR(objeto, chave) {
    let atual = objeto;
    while (atual) {
        if (atual.userData && atual.userData[chave] !== undefined) return atual;
        atual = atual.parent;
    }
    return null;
}

// Escolhe, de entre as interseções do raio, o alvo que vale para a ação.
// A ordem NÃO é simplesmente a da distância: um ASTRO ganha sempre a um botão
// do painel 3D. O painel é filho da câmara (vive 2,1m à frente da cabeça) e,
// sem esta prioridade, um planeta por trás do painel nunca era selecionável —
// o primeiro hit era sempre o botão mais próximo, e o gatilho disparava-o:
// clicar num planeta podia mesmo terminar a sessão (o «SAIR DO VR»).
// Os botões continuam a responder: só perdem quando o raio cruza mesmo um
// astro, e como o painel segue a cabeça, basta desviar a cabeça para o afastar
// do planeta — o astro é que é fixo no mundo.
function alvoSobRaioVR(intersecoes) {
    for (const intersecao of intersecoes) {
        if (portadorDeDadosVR(intersecao.object, "astro")) return intersecao;
    }
    for (const intersecao of intersecoes) {
        if (portadorDeDadosVR(intersecao.object, "acao")) return intersecao;
    }
    return null;
}

// Quanto tempo o gatilho tem de ficar PUZADO sobre um botão do painel para o
// acionar. É a diferença entre "clicar" (que nunca faz nada, mesmo em cima do
// botão) e "pressionar com intenção" (que o aciona).
const HOLD_BOTAO_MS = 700;

// Cancela uma pressão mantida num botão do painel (sem a executar) e repõe a
// escala visual do botão.
function cancelarHoldBotaoVR(info) {
    if (!info || !info.holdBotao) return;
    info.holdBotao.scale.setScalar(info.hover === info.holdBotao ? 1.08 : 1);
    info.holdBotao = null;
    info.holdInicio = 0;
}

function selecionarComRaycastVR(origem, adiarSelecaoAstro = false) {
    if (vrSessaoAtiva && origem !== vrCamera) {
        const infoController = vrControladoresInfo.find(info => info.controlador === origem);
        if (vrModoInteracao !== MODO_INTERACAO_VR.CONTROLLER
            || !controllerTemTrackingValidoVR(infoController)) return null;
    }
    const intersecoes = raycastVR(origem);
    const escolhido = alvoSobRaioVR(intersecoes);
    // Espaço vazio: não faz NADA — em particular não termina a sessão WebXR
    // nem navega para lado nenhum. O gatilho só age sobre o que o raio
    // acertou mesmo (a geometria do astro ou o botão visível).
    if (!escolhido) return;

    const botao = portadorDeDadosVR(escolhido.object, "acao");
    if (botao) {
        // No headset, um clique simples num botão do painel NÃO faz nada. O
        // painel é fixo à cabeça e a sua banda de clique vive logo abaixo do
        // centro da visão: quando se olha para o céu, "clicar onde não há
        // planeta" era clicar neste botão — e o «SAIR DO VR» terminava a
        // sessão apontando a qualquer sítio. Os botões só acionam com pressão
        // MANTIDA (~0,7s com o raio no botão, que cresce enquanto se mantém —
        // ver o atualizarMiradoresVR). No PC, com rato, o clique continua
        // imediato como sempre.
        const info = vrControladoresInfo.find(i => i.controlador === origem);
        if (info && vrSessaoAtiva) {
            if (info.holdBotao !== botao) {
                cancelarHoldBotaoVR(info);
                info.holdBotao = botao;
                info.holdInicio = performance.now();
            }
            return;
        }
        executarAcaoVR(botao.userData.acao);
        return;
    }
    const portador = portadorDeDadosVR(escolhido.object, "astro");
    if (portador) {
        if (adiarSelecaoAstro) return portador;
        selecionarAstroVR(portador.userData.astro);
    }
    return null;
}

function iniciarGatilhoControllerVR(info) {
    if (vrModoInteracao !== MODO_INTERACAO_VR.CONTROLLER
        || !controllerTemTrackingValidoVR(info) || vrGrabAtivo) return;
    info.gatilhoPuxado = true;
    info.gatilhoInicio = performance.now();
    info.astroSelecionavel = null;
    info.astroParaAgarrar = null;

    const alvo = selecionarComRaycastVR(info.controlador, true);
    if (!alvo || alvo.parent !== vrGrupoAstros) return;
    info.astroSelecionavel = alvo;
    info.astroParaAgarrar = alvo;
}

function terminarGatilhoControllerVR(info) {
    if (!info.gatilhoPuxado) return;
    const duracao = performance.now() - info.gatilhoInicio;
    if (info.objetoAgarrado) {
        soltarAstroVR(info);
    } else if (info.astroSelecionavel && duracao < ATRASO_GRAB_VR_MS) {
        // Toque curto: selecionar é independente do gesto de agarrar.
        selecionarAstroVR(info.astroSelecionavel.userData.astro);
    }
    info.gatilhoPuxado = false;
    info.astroSelecionavel = null;
    info.astroParaAgarrar = null;
}

function guardarEstadoOriginalAstroVR(objeto) {
    // Posição astronómica atualizada a partir dos dados API; nunca é lida da
    // transformação visual temporária. Rotação/escala são a forma visual base.
    objeto.userData.vrPosicaoAstronomica = objeto.position.clone();
    objeto.userData.vrRotacaoOriginal = objeto.quaternion.clone();
    objeto.userData.vrEscalaOriginal = objeto.scale.clone();
    if (!Number.isFinite(objeto.userData.vrDestaqueSelecionado)) {
        objeto.userData.vrDestaqueSelecionado = 1;
    }
}

function astroAtualVR(astro) {
    if (!astro || !dadosVRAtuais || !Array.isArray(dadosVRAtuais.astros)) return astro;
    return dadosVRAtuais.astros.find(a => a.nome === astro.nome && a.tipo === astro.tipo) || astro;
}

// Diâmetro visual de um astro redimensionado para «tamanhoSegurado».
// Compartilhado pelo grabbing do comando e pela apresentação na palma.
function fatorEscalaParaTamanhoVR(astro, tamanhoSegurado) {
    const cfg = astroCfg(astro && astro.nome);
    const diametroBase = !cfg ? 30
        : astro.nome === "ISS" ? cfg.size * 3 * FATOR_ESCALA_VR
            : astro.nome === "Saturno" ? cfg.size * 2.2 * FATOR_ESCALA_VR
                : cfg.size * 2 * FATOR_ESCALA_VR;
    return tamanhoSegurado / Math.max(diametroBase, 0.001);
}

function fatorEscalaComumApresentacaoVR() {
    // Tamanho-base próximo de Júpiter; o mesmo fator mantém as diferenças
    // relativas entre planetas ao apresentá-los junto à palma.
    return DIAMETRO_APRESENTACAO_VR_M / (37 * 2 * FATOR_ESCALA_VR);
}

function diametroAstroApresentacaoVR(objeto, escalaVisual = objeto.scale, pai = objeto.parent) {
    const astro = objeto.userData.astro;
    const cfg = astroCfg(astro && astro.nome);
    if (!cfg) return DIAMETRO_APRESENTACAO_VR_M * FATOR_DESTAQUE_SELECAO_VR;
    // Os anéis de Saturno definem o diâmetro exterior (size*2.2); a ISS é 3:2.
    const fatorForma = astro.nome === "ISS" ? 1.5
        : astro.nome === "Saturno" ? 1.1 : 1;
    const escalaOriginal = objeto.userData.vrEscalaOriginal;
    let fatorPai = 1;
    if (pai) {
        pai.updateWorldMatrix(true, false);
        pai.getWorldScale(vrTempPalmaEscala);
        fatorPai = pai === vrGrupoAstros
            ? 1 : vrTempPalmaEscala.length() / Math.sqrt(3);
    }
    const fatorAtual = Math.abs(escalaVisual.x * fatorPai
        / Math.max(Math.abs(escalaOriginal.x), 0.000001));
    return cfg.size * 2 * FATOR_ESCALA_VR * fatorForma * fatorAtual;
}

function sincronizarPosicoesAstrosVR() {
    if (!dadosVRAtuais || !Array.isArray(dadosVRAtuais.astros)) return;
    const sincronizar = objeto => {
        if (!objeto || !objeto.userData || !objeto.userData.astro) return;
        const atualizado = astroAtualVR(objeto.userData.astro);
        objeto.userData.astro = atualizado;
        definirPosicaoAltAzVR(objeto.userData.vrPosicaoAstronomica, atualizado.altitude, atualizado.azimute, RAIO_CEU_VR);
        if (!objeto.userData.vrAgarrado && !objeto.userData.vrRegressando) {
            objeto.position.copy(objeto.userData.vrPosicaoAstronomica);
        }
    };
    if (vrGrupoAstros) vrGrupoAstros.children.forEach(sincronizar);
    if (vrGrabAtivo) sincronizar(vrGrabAtivo.objeto);
    if (vrApresentado) sincronizar(vrApresentado.objeto);
    vrObjetosRegressando.forEach(item => sincronizar(item.objeto));
    const sol = dadosVRAtuais.astros.find(a => a.tipo === "sol");
    if (vrLuzSol && sol) definirPosicaoAltAzVR(vrLuzSol.position, sol.altitude, sol.azimute, RAIO_CEU_VR);
}

function agarrarAstroVR(info, objeto) {
    if (vrGrabAtivo || !objeto || objeto.parent !== vrGrupoAstros) return;
    const seguradoComMao = !!info.mao;
    const palmaInicial = seguradoComMao ? posicaoPalmaLocalVR(info) : null;
    if (seguradoComMao && !palmaInicial) return;
    vrEscalasSelecaoVR.delete(objeto);
    vrDestaquesPinça.delete(objeto);
    if (vrAstroVisualSelecionado === objeto) vrAstroVisualSelecionado = null;
    objeto.userData.vrDestaqueSelecionado = 1;
    if (objeto.userData.vrRegressando) interromperRegressoAstroVR(objeto);
    objeto.updateWorldMatrix(true, true);
    const ancora = info.ancora || info.controlador;
    ancora.updateWorldMatrix(true, false);
    ancora.attach(objeto); // transfere temporariamente para o espaço do input
    info.ancora = ancora;
    // Os astros vivem a ~500 unidades astronómicas da origem, demasiado longe
    // para uma exploração física à mão. Traz-se o objeto para 80cm à frente do
    // controller e reduz-se só a sua escala VISUAL; os valores base guardados
    // continuam intactos e serão restaurados suavemente ao largar.
    const astro = objeto.userData.astro;
    const tamanhoSegurado = seguradoComMao ? 0.1 : 0.28;
    const fatorVisual = fatorEscalaParaTamanhoVR(astro, tamanhoSegurado)
        * FATOR_DESTAQUE_SELECAO_VR;
    if (seguradoComMao) {
        // Começa diretamente na palma (sem salto desde a origem astronómica),
        // com orientação local alinhada à mão; a continuação é filtrada no loop.
        objeto.position.copy(palmaInicial);
        info.rotacaoAlvo.identity();
        objeto.quaternion.identity();
        objeto.scale.copy(objeto.userData.vrEscalaOriginal).multiplyScalar(fatorVisual);
    } else {
        objeto.position.set(0, 0, -0.8);
        // Mantém a orientação mundial que o attach acabou de preservar; a
        // rotação do controller passa então a rodar o objeto naturalmente.
        objeto.scale.copy(objeto.userData.vrEscalaOriginal).multiplyScalar(fatorVisual);
    }
    objeto.userData.vrAgarrado = true;
    info.objetoAgarrado = objeto;
    info.astroParaAgarrar = null;
    vrGrabAtivo = { info, objeto };
    if (info.mao) info.maoObjetoAgarrado = objeto;
    vrAlvosCache = null;
}

function soltarAstroVR(info) {
    const objeto = info && info.objetoAgarrado;
    if (!objeto || !vrGrupoAstros) return;

    // Reparenting preserva a pose em que o utilizador largou o objeto. A seguir
    // interpola-se para o alt/az mais recente e para a orientação/escala base.
    vrGrupoAstros.attach(objeto);
    objeto.userData.vrAgarrado = false;
    objeto.userData.vrRegressando = true;
    objeto.userData.vrDestaqueSelecionado = 1;
    const astro = astroAtualVR(objeto.userData.astro);
    objeto.userData.astro = astro;
    const posicao = objeto.userData.vrPosicaoAstronomica.clone();
    vrObjetosRegressando.push({
        objeto,
        inicio: performance.now(),
        tempoDecorrido: 0,
        posicaoInicio: objeto.position.clone(),
        rotacaoInicio: objeto.quaternion.clone(),
        escalaInicio: objeto.scale.clone(),
        posicaoAlvo: posicao,
        rotacaoAlvo: objeto.userData.vrRotacaoOriginal.clone(),
        escalaAlvo: objeto.userData.vrEscalaOriginal.clone()
    });
    info.objetoAgarrado = null;
    info.maoObjetoAgarrado = null;
    info.ancora = null;
    vrGrabAtivo = null;
    vrAlvosCache = null;
}

// ── Apresentação na palma (exclusivo do modo mãos) ─────────────────────────
// O planeta selecionado por pinça voa suavemente até ficar alguns centímetros
// acima da palma (NUNCA colado à mão e NUNCA preso ao dedo), e passa a seguir a
// transformação da palma: a mão vira-se e o planeta acompanha. Não há grab:
// não é preciso manter a pinça fechada, o objeto não fica «agarrado» ao
// controller, e a pose segue a orientação real da mão (juntas do pulso,
// base do indicador e base do mindinho).

// Referencial da palma: centro e normal do lado da palma, em espaço local do
// modelo da mão (o mesmo em que a malhaPalma é posicionada por frame).
function vrObjetoEscalaApresentacaoLocalVR(info, escalaMundo) {
    // Compensa a escala uniforme do modelo/pai para preservar o tamanho em
    // mundo quando o planeta passa do grupo astronómico para a mão rastreada.
    info.modelo.updateWorldMatrix(true, false);
    const escalaPai = info.modelo.getWorldScale(vrTempPalmaEscala);
    const fatorPai = Math.sqrt((escalaPai.x * escalaPai.x
        + escalaPai.y * escalaPai.y + escalaPai.z * escalaPai.z) / 3);
    const dividirComSinal = valor => Math.abs(valor) < 0.0001
        ? (valor < 0 ? -0.0001 : 0.0001) : valor;
    vrTempPalmaScale.set(
        escalaMundo.x / dividirComSinal(fatorPai),
        escalaMundo.y / dividirComSinal(fatorPai),
        escalaMundo.z / dividirComSinal(fatorPai)
    );
    return vrTempPalmaScale;
}

function pontoApresentacaoLocalVR(info, objeto, destino, escalaVisual = objeto.scale) {
    const malhaPalma = info.modelo && info.modelo.userData.malhaPalma;
    const centroPalma = info.modelo && info.modelo.userData.palmaCentro;
    const normalPalma = info.modelo && info.modelo.userData.palmaNormal;
    if (!malhaPalma || !malhaPalma.visible || !centroPalma || !normalPalma
        || normalPalma.lengthSq() < 0.5) return null;
    info.modelo.updateMatrixWorld(true);
    destino.copy(centroPalma);
    vrTempPalmaDir.copy(normalPalma);
    const escalaPai = info.modelo.getWorldScale(vrTempPalmaEscala);
    const fatorPai = Math.max(0.0001, Math.sqrt((escalaPai.x * escalaPai.x
        + escalaPai.y * escalaPai.y + escalaPai.z * escalaPai.z) / 3));
    // A posição é do CENTRO do astro; compensa o raio visual real, deixando
    // alguns centímetros livres entre a esfera/anéis e a superfície palmar.
    const raioVisualMundo = diametroAstroApresentacaoVR(
        objeto, escalaVisual, info.modelo) * 0.5;
    destino.addScaledVector(vrTempPalmaDir,
        (MEIA_ESPESSURA_PALMA_VR_M + SEPARACAO_PALMA_PLANETA_VR_M) / fatorPai
            + raioVisualMundo / fatorPai);
    if (info.modelo.userData.palmaDirecaoLongitudinal) {
        vrTempPalmaDir.copy(info.modelo.userData.palmaDirecaoLongitudinal);
        destino.addScaledVector(vrTempPalmaDir, 0.012 / fatorPai);
    }
    return destino;
}

// O mesmo ponto, mas em coordenadas de mundo (durante o voo céu → palma).
function pontoApresentacaoMundoVR(info, objeto, destino, escalaVisual = objeto.scale) {
    const malhaPalma = info.modelo && info.modelo.userData.malhaPalma;
    const centroPalma = info.modelo && info.modelo.userData.palmaCentro;
    const normalPalma = info.modelo && info.modelo.userData.palmaNormal;
    if (!malhaPalma || !centroPalma || !normalPalma || !malhaPalma.visible) return null;
    info.modelo.updateMatrixWorld(true);
    destino.copy(centroPalma).applyMatrix4(info.modelo.matrixWorld);
    vrTempPalmaDir.copy(normalPalma).transformDirection(info.modelo.matrixWorld);
    const raioVisual = diametroAstroApresentacaoVR(
        objeto, escalaVisual, vrGrupoAstros) * 0.5;
    const escalaPalma = info.modelo.getWorldScale(vrTempPalmaEscala);
    const fatorPalma = Math.sqrt((escalaPalma.x * escalaPalma.x
        + escalaPalma.y * escalaPalma.y + escalaPalma.z * escalaPalma.z) / 3);
    destino.addScaledVector(vrTempPalmaDir,
        (MEIA_ESPESSURA_PALMA_VR_M + SEPARACAO_PALMA_PLANETA_VR_M) * fatorPalma
            + raioVisual);
    if (info.modelo.userData.palmaDirecaoLongitudinal) {
        vrTempPalmaDir.copy(info.modelo.userData.palmaDirecaoLongitudinal)
            .transformDirection(info.modelo.matrixWorld);
        destino.addScaledVector(vrTempPalmaDir, 0.012 * fatorPalma);
    }
    return destino;
}

// Astro visual (grupo em vrGrupoAstros) das dados astronómicos de um astro.
function objetoDeAstroVR(astro) {
    if (!vrGrupoAstros || !astro) return null;
    return vrGrupoAstros.children.find(o => o.userData && o.userData.astro === astro) || null;
}

// Destaca qualquer astro selecionado (pinça/controller/rato) sem substituir o
// scale original. Se o mesmo astro volta a ser selecionado, parte do fator
// visual atual e faz uma pequena antecipação antes do movimento para a palma.
function animarRegressoDestaqueAstroVR(objeto, duracaoMs = 280) {
    if (!objeto || !objeto.userData.vrEscalaOriginal || objeto.userData.vrAgarrado) return;
    const escalaOriginal = objeto.userData.vrEscalaOriginal;
    const destaqueMao = vrDestaquesPinça.get(objeto);
    if (destaqueMao) {
        objeto.scale.copy(destaqueMao.escalaBase);
        vrDestaquesPinça.delete(objeto);
    }
    let estado = vrEscalasSelecaoVR.get(objeto);
    const fatorAtual = estado ? estado.scaleAtual
        : objeto.scale.x / (escalaOriginal.x || 0.000001);
    if (!estado) {
        estado = { objeto, scaleOriginal: escalaOriginal.clone(), scaleAtual: fatorAtual };
        vrEscalasSelecaoVR.set(objeto, estado);
    }
    estado.inicio = fatorAtual;
    estado.scaleAtual = fatorAtual;
    estado.alvo = 1;
    estado.tempoMs = 0;
    estado.duracaoMs = duracaoMs;
    objeto.userData.vrDestaqueSelecionado = 1;
    if (vrAstroVisualSelecionado === objeto) vrAstroVisualSelecionado = null;
}

function definirDestaqueSelecaoVR(objeto) {
    if (!objeto || !objeto.userData.vrEscalaOriginal) return;
    if (vrAstroVisualSelecionado && vrAstroVisualSelecionado !== objeto) {
        animarRegressoDestaqueAstroVR(vrAstroVisualSelecionado);
    }
    if (vrDestaquesPinça.has(objeto)) {
        const hover = vrDestaquesPinça.get(objeto);
        objeto.scale.copy(hover.escalaBase);
        vrDestaquesPinça.delete(objeto);
    }
    const escalaOriginal = objeto.userData.vrEscalaOriginal;
    const estadoExistente = vrEscalasSelecaoVR.get(objeto);
    const fatorAtual = estadoExistente ? estadoExistente.scaleAtual
        : objeto.scale.x / Math.max(Math.abs(escalaOriginal.x), 0.000001);
    let estado = estadoExistente;
    if (!estado) {
        estado = { objeto, scaleOriginal: escalaOriginal.clone(), scaleAtual: fatorAtual };
        vrEscalasSelecaoVR.set(objeto, estado);
    }
    estado.inicio = Math.max(0, fatorAtual);
    estado.scaleAtual = estado.inicio;
    estado.alvo = FATOR_DESTAQUE_SELECAO_VR;
    estado.tempoMs = 0;
    estado.duracaoMs = DURACAO_DESTAQUE_PRE_VOO_VR_MS;
    vrAstroVisualSelecionado = objeto;
    objeto.userData.vrDestaqueSelecionado = FATOR_DESTAQUE_SELECAO_VR;
}

// Inicia a apresentação do astro na palma da mão (chamada pelo clique).
function apresentarAstroVR(info, objeto) {
    if (estadoApresentacaoVR !== ESTADO_APRESENTACAO_VR.NORMAL) return;
    if (!vrSessaoAtiva || !info || !maoEstaRastreadaVR(info)) return;
    const malhaPalma = info.modelo && info.modelo.userData.malhaPalma;
    if (!malhaPalma || !malhaPalma.visible) return;
    if (!objeto || objeto.parent !== vrGrupoAstros || objeto.userData.vrAgarrado) return;
    if (vrApresentado || vrVoosApresentacaoVR.length) return;
    if (vrAstroVisualSelecionado && vrAstroVisualSelecionado !== objeto) {
        animarRegressoDestaqueAstroVR(vrAstroVisualSelecionado);
    }
    // O voo assume o destaque iniciado na seleção para evitar concorrência
    // entre dois animadores de scale. Remove também o hover da mão antes de
    // guardar a escala inicial do voo.
    const destaqueMao = vrDestaquesPinça.get(objeto);
    if (destaqueMao) {
        objeto.scale.copy(destaqueMao.escalaBase);
        vrDestaquesPinça.delete(objeto);
    }
    vrEscalasSelecaoVR.delete(objeto);
    if (vrAstroVisualSelecionado === objeto) vrAstroVisualSelecionado = null;
    if (objeto.userData.vrRegressando && !interromperRegressoAstroVR(objeto)) return;
    // Snapshot tirado no primeiro pinch. O regresso usa ESTES valores, não a
    // pose atual da mão nem uma posição fixa no mundo.
    const posicaoOriginal = (objeto.userData.vrPosicaoAstronomica || objeto.position).clone();
    const rotacaoOriginal = (objeto.userData.vrRotacaoOriginal || objeto.quaternion).clone();
    const escalaOriginal = (objeto.userData.vrEscalaOriginal || objeto.scale).clone();
    vrApresentado = { info, objeto, posicaoOriginal, rotacaoOriginal, escalaOriginal };
    estadoApresentacaoVR = ESTADO_APRESENTACAO_VR.MOVING_TO_HAND;
    // Exclui o astro dos alvos de raio e do rebuild — como no grabbing, sem
    // violar o estado do controlador.
    objeto.userData.vrAgarrado = true;
    vrAlvosCache = null;
    const escalaAlvo = escalaOriginal.clone()
        .multiplyScalar(fatorEscalaComumApresentacaoVR() * FATOR_DESTAQUE_SELECAO_VR);
    const escalaBase = objeto.scale.clone();
    const escalaInicio = escalaBase.clone().multiplyScalar(FATOR_DESTAQUE_SELECAO_VR);
    vrVoosApresentacaoVR.push({
        info, objeto, tempoDecorrido: -DURACAO_DESTAQUE_PRE_VOO_VR_MS,
        posicaoInicio: objeto.position.clone(),
        escalaBase, escalaInicio, escalaAlvo
    });
}

// Termina a apresentação: reparent ao grupo dos astros mantendo a pose atual
// e interpola (EaseInOutCubic, como o regresso do grabbing) até à posição,
// rotação e escala ORIGINAIS guardadas no primeiro pinch.
function libertarApresentacaoVR() {
    if (!vrApresentado) return;
    const { objeto, posicaoOriginal, rotacaoOriginal, escalaOriginal } = vrApresentado;
    vrApresentado = null;
    estadoApresentacaoVR = ESTADO_APRESENTACAO_VR.RETURNING;
    // Remove qualquer voo em curso do mesmo objeto.
    const indiceVoo = vrVoosApresentacaoVR.findIndex(v => v.objeto === objeto);
    if (indiceVoo >= 0) vrVoosApresentacaoVR.splice(indiceVoo, 1);
    if (objeto.parent && objeto.parent !== vrGrupoAstros) vrGrupoAstros.attach(objeto);
    objeto.userData.vrAgarrado = false;
    objeto.userData.vrRegressando = true;
    objeto.userData.astro = astroAtualVR(objeto.userData.astro);
    objeto.userData.vrDestaqueSelecionado = 1;
    if (vrEscalasSelecaoVR.has(objeto)) vrEscalasSelecaoVR.delete(objeto);
    if (vrAstroVisualSelecionado === objeto) vrAstroVisualSelecionado = null;
    vrObjetosRegressando.push({
        objeto,
        deApresentacao: true,
        duracaoMs: DURACAO_REGRESSO_PALMA_VR_MS,
        inicio: performance.now(),
        tempoDecorrido: 0,
        posicaoInicio: objeto.position.clone(),
        rotacaoInicio: objeto.quaternion.clone(),
        escalaInicio: objeto.scale.clone(),
        posicaoAlvo: posicaoOriginal.clone(),
        rotacaoAlvo: rotacaoOriginal.clone(),
        escalaAlvo: escalaOriginal.clone()
    });
    vrAlvosCache = null;
}

// Voo céu → palma + seguimento fino da palma. Corre no ciclo de animação;
// sem alocações por frame (temporários partilhados, alpha exponencial).
function atualizarApresentacaoVR(deltaTime) {
    for (let i = vrVoosApresentacaoVR.length - 1; i >= 0; i--) {
        const voo = vrVoosApresentacaoVR[i];
        if (!vrApresentado || vrApresentado.objeto !== voo.objeto
            || !vrSessaoAtiva || (!maoEstaRastreadaVR(voo.info)
                && (!voo.info.rastreioPerdidoDesde
                    || performance.now() - voo.info.rastreioPerdidoDesde >= TOLERANCIA_PERDA_INPUT_VR_MS))) {
            // Substituído, sessão terminou ou tracking perdeu-se: a libertação
            // devolve o astro ao céu a partir da pose em que estava.
            libertarApresentacaoVR();
            continue;
        }
        voo.tempoDecorrido += deltaTime * 1000;
        if (voo.tempoDecorrido < 0) {
            const progressoDestaque = Math.max(0, Math.min(1,
                (voo.tempoDecorrido + DURACAO_DESTAQUE_PRE_VOO_VR_MS)
                    / DURACAO_DESTAQUE_PRE_VOO_VR_MS));
            const antecipacao = 1 + (FATOR_DESTAQUE_SELECAO_VR - 1) * progressoDestaque;
            voo.objeto.scale.copy(voo.escalaBase).multiplyScalar(antecipacao);
            continue;
        }
        const t = Math.min(1, voo.tempoDecorrido / DURACAO_VOAR_PALMA_VR_MS);
        const suave = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const alvoMundo = pontoApresentacaoMundoVR(
            voo.info, voo.objeto, vrTempPalmaMundo, voo.escalaAlvo);
        if (!alvoMundo) {
            libertarApresentacaoVR();
            continue;
        }
        voo.objeto.position.lerpVectors(voo.posicaoInicio, alvoMundo, suave);
        voo.objeto.scale.lerpVectors(voo.escalaInicio, voo.escalaAlvo, suave);
        if (t >= 1) {
            // Chegada: passa a seguir a transformação da palma. O attach
            // preserva a pose mundial; a seguir, a posição local só é
            // refinada suavemente (sem jitter nem teleportes).
            voo.info.modelo.attach(voo.objeto);
            voo.objeto.scale.copy(vrObjetoEscalaApresentacaoLocalVR(voo.info, voo.escalaAlvo));
            const alvoLocal = pontoApresentacaoLocalVR(voo.info, voo.objeto, vrTempPalmaPos);
            if (!alvoLocal) {
                libertarApresentacaoVR();
                continue;
            }
            voo.objeto.position.copy(alvoLocal);
            vrVoosApresentacaoVR.splice(i, 1);
            estadoApresentacaoVR = ESTADO_APRESENTACAO_VR.ON_HAND;
        }
    }

    if (!vrApresentado) return;
    const { info, objeto } = vrApresentado;
    if (objeto.parent !== info.modelo) return;
    if (!vrSessaoAtiva || (!maoEstaRastreadaVR(info)
        && (!info.rastreioPerdidoDesde
            || performance.now() - info.rastreioPerdidoDesde >= TOLERANCIA_PERDA_INPUT_VR_MS))) {
        libertarApresentacaoVR();
        return;
    }
    const alvoLocal = pontoApresentacaoLocalVR(info, objeto, vrTempPalmaPos);
    if (!alvoLocal) {
        libertarApresentacaoVR();
        return;
    }
    const alpha = 1 - Math.exp(-Math.min(deltaTime, 0.1) / SUAVIZAR_SEGUIMENTO_PALMA_VR_S);
    objeto.position.lerp(alvoLocal, alpha);
}

function interromperRegressoAstroVR(objeto) {
    const indice = vrObjetosRegressando.findIndex(item => item.objeto === objeto);
    if (indice < 0) return false;
    const item = vrObjetosRegressando[indice];
    vrObjetosRegressando.splice(indice, 1);
    objeto.userData.vrRegressando = false;
    if (item.deApresentacao
        && estadoApresentacaoVR === ESTADO_APRESENTACAO_VR.RETURNING) {
        estadoApresentacaoVR = ESTADO_APRESENTACAO_VR.NORMAL;
    }
    vrAlvosCache = null;
    return true;
}

function atualizarRegressosAstrosVR(deltaTime) {
    for (let i = vrObjetosRegressando.length - 1; i >= 0; i--) {
        const item = vrObjetosRegressando[i];
        const astro = astroAtualVR(item.objeto.userData.astro);
        item.objeto.userData.astro = astro;
        // O regresso da palma usa a posição ORIGINAL guardada no primeiro
        // pinch. Só os regressos do grabbing seguem a posição astronómica
        // mais recente (o objeto foi largado no espaço, não apresentado).
        if (!item.deApresentacao) {
            definirPosicaoAltAzVR(item.posicaoAlvo, astro.altitude, astro.azimute, RAIO_CEU_VR);
        }

        // Usa deltaTime limitado do render loop, para a transição manter a
        // mesma duração independentemente da taxa de frames. EaseInOutCubic
        // abranda naturalmente no início e no fim da transição.
        item.tempoDecorrido += deltaTime * 1000;
        const duracao = item.duracaoMs || DURACAO_REGRESSO_GRAB_VR_MS;
        const t = Math.min(1, item.tempoDecorrido / duracao);
        const suave = t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
        item.objeto.position.lerpVectors(item.posicaoInicio, item.posicaoAlvo, suave);
        item.objeto.quaternion.slerpQuaternions(item.rotacaoInicio, item.rotacaoAlvo, suave);
        item.objeto.scale.lerpVectors(item.escalaInicio, item.escalaAlvo, suave);

        if (t >= 1) {
            item.objeto.position.copy(item.posicaoAlvo);
            item.objeto.quaternion.copy(item.rotacaoAlvo);
            item.objeto.scale.copy(item.escalaAlvo);
            item.objeto.userData.vrRegressando = false;
            vrObjetosRegressando.splice(i, 1);
            if (item.deApresentacao
                && estadoApresentacaoVR === ESTADO_APRESENTACAO_VR.RETURNING) {
                estadoApresentacaoVR = ESTADO_APRESENTACAO_VR.NORMAL;
            }
            vrAlvosCache = null;
        }
    }
    if (!vrGrabAtivo && !vrObjetosRegressando.length && !vrApresentado
        && vrAstroRebuildPendente) {
        reconstruirAstrosVR();
    }
}

function executarAcaoVR(acao) {
    if (acao === "sair-vr") {
        sairSessaoVR(); // termina a sessão imersiva e restaura a interface
    } else if (acao === "vista-geral") {
        limparSelecaoVR();
        vistaGeralVR();
    } else if (acao === "fechar-info") {
        limparSelecaoVR();
    }
}

// ── Seleção de um astro ────────────────────────────────────────────────────
function selecionarAstroVR(astro, opcoes = null) {
    if (!astro || !vrScene) return;
    // A seleção por mão não pode abrir um segundo alvo a meio de MOVING_TO_HAND
    // ou RETURNING; nesses estados o planeta atual é o único dono do gesto.
    if (opcoes && opcoes.apresentarEmMao
        && (estadoApresentacaoVR !== ESTADO_APRESENTACAO_VR.NORMAL || vrApresentado)) {
        return;
    }
    const objetoSelecionado = objetoDeAstroVR(astro);
    limparSelecaoVR();
    if (objetoSelecionado && objetoSelecionado.userData.vrRegressando) {
        interromperRegressoAstroVR(objetoSelecionado);
    }
    if (objetoSelecionado && objetoSelecionado !== vrApresentado?.objeto) {
        definirDestaqueSelecaoVR(objetoSelecionado);
    }
    vrUltimaSelecao = astro;

    const posicao = altAzParaXYZ(astro.altitude, astro.azimute, RAIO_CEU_VR);
    const cfg = astroCfg(astro.nome);
    const raio = cfg ? cfg.size * FATOR_ESCALA_VR : 20;

    // No modo mãos o astro é apresentado NA PALMA — o anel deixaria apenas um
    // «buraco» luminoso no lugar em que ele estava. No resto (comando/rato)
    // o anel marca o astro no céu como sempre.
    if (!opcoes || !opcoes.apresentarEmMao) {
        vrMarcadorSelecao = criarMarcadorSelecaoVR(posicao, raio);
        vrScene.add(vrMarcadorSelecao);
    }

    vrPainelInfo3D = criarPainelInfo3DVR(astro);
    vrScene.add(vrPainelInfo3D);
    posicionarPainelInfoVR();

    mostrarInfoAstroVR(astro); // painel HTML (espelho no PC)

    // Apresentação na palma (apenas no modo mãos; o comando/rato nunca a
    // usam — ver disparaCliquePincaVR).
    if (opcoes && opcoes.apresentarEmMao) {
        const objeto = objetoDeAstroVR(astro);
        if (objeto) apresentarAstroVR(opcoes.infoMao, objeto);
    }

    // No headset a câmara é do utilizador — não se mexe nela. No modo PC a
    // aproximação é suave e o regresso faz-se pelo botão «Vista geral».
    if (!vrSessaoAtiva) aproximarCameraVR(astro);
}

function limparSelecaoVR() {
    // O scale regressa sempre ao original ao limpar uma seleção normal.
    if (vrAstroVisualSelecionado
        && !(vrApresentado && vrApresentado.objeto === vrAstroVisualSelecionado)) {
        animarRegressoDestaqueAstroVR(vrAstroVisualSelecionado);
    }
    const alvoApresentado = vrApresentado && vrApresentado.objeto;
    if (alvoApresentado && (vrUltimaSelecao === alvoApresentado.userData.astro
        || !vrMarcadorSelecao)) {
        if (vrAstroVisualSelecionado === alvoApresentado) vrAstroVisualSelecionado = null;
        libertarApresentacaoVR();
    }
    vrUltimaSelecao = null;
    [vrMarcadorSelecao, vrPainelInfo3D].forEach(obj => {
        if (!obj) return;
        if (obj.parent) obj.parent.remove(obj);
        obj.traverse(o => {
            if (o.material) {
                if (o.material.map && o.material.map.isCanvasTexture) o.material.map.dispose();
                o.material.dispose();
            }
        });
    });
    vrMarcadorSelecao = null;
    vrPainelInfo3D = null;
    const painel = document.getElementById("vr-info");
    if (painel) painel.classList.remove("visivel");
}

// Anel luminoso à volta do astro escolhido (sprite com canvas, sempre de
// frente para a câmara — funciona no PC e no headset).
function criarMarcadorSelecaoVR(posicao, raio) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(128, 128, 96, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(170, 220, 255, 0.95)";
    ctx.lineWidth = 10;
    ctx.shadowColor = "rgba(110, 200, 255, 0.9)";
    ctx.shadowBlur = 24;
    ctx.stroke();

    const textura = new THREE.CanvasTexture(canvas);
    textura.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: textura, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    sprite.position.copy(posicao);
    sprite.scale.setScalar(Math.max(raio * 3.2, 20));
    // Decorativo — o alvo de seleção é o astro, não o marcador
    sprite.raycast = () => {};
    return sprite;
}

function formatarGrausVR(valor) {
    return (typeof valor === "number" && isFinite(valor)) ? valor.toFixed(1) + "°" : "—";
}

// Painel de detalhes dentro da cena VR (sprite com canvas): nome do astro,
// posição e visibilidade — a mesma informação do painel HTML do modo PC.
function criarPainelInfo3DVR(astro) {
    const largura = 1024, altura = 512;
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");

    // Fundo "vidro" escuro com borda suave (identidade visual do AstroGuide)
    ctx.fillStyle = "rgba(6, 10, 26, 0.82)";
    ctx.strokeStyle = "rgba(110, 180, 255, 0.45)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(12, 12, largura - 24, altura - 24, 36);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.fillRect(12, 12, largura - 24, altura - 24);
        ctx.strokeRect(12, 12, largura - 24, altura - 24);
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 84px sans-serif";
    ctx.fillText(astro.nome, largura / 2, 150);

    ctx.font = "48px sans-serif";
    ctx.fillStyle = astro.visivel ? "#9fe8b0" : "#8aa0c8";
    ctx.fillText(astro.visivel ? "Acima do horizonte" : "Abaixo do horizonte", largura / 2, 235);

    ctx.fillStyle = "#bcd7ff";
    ctx.fillText(`Altitude: ${formatarGrausVR(astro.altitude)}   Azimute: ${formatarGrausVR(astro.azimute)}`,
        largura / 2, 330);
    if (astro.tipo === "lua" && astro.fase_nome) {
        ctx.fillText(`${astro.emoji || "🌙"} ${astro.fase_nome}`, largura / 2, 425);
    }

    const textura = new THREE.CanvasTexture(canvas);
    textura.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: textura, transparent: true, depthWrite: false
    }));
    sprite.renderOrder = 6;
    // Decorativo — não deve roubar o raio ao planeta selecionado
    sprite.raycast = () => {};

    // A posição não é decidida aqui: o painel fica ACIMA do astro e a conta
    // depende de onde está a câmara nesse instante (ver o
    // posicionarPainelInfoVR, chamado logo a seguir a este sprite entrar na
    // cena e, no PC, a cada fotograma).
    sprite.scale.set(PAINEL_INFO_LARGURA, PAINEL_INFO_ALTURA, 1);
    return sprite;
}

// ── Onde é que o painel de detalhes fica ────────────────────────────────────
// ACIMA do astro selecionado — nunca à frente dele. Antes o painel ficava
// entre o observador e o planeta, e o que se ganhava em proximidade perdia-se
// em vista: tapava o planeta e o céu em volta.
//
// Três coisas que esta conta tem de respeitar:
//  1. o painel vai a 80% do caminho entre a câmara e o astro, por isso está
//     sempre à frente do céu (até no zénite) e atrás da superfície do planeta;
//  2. o tamanho acompanha essa distância, para o painel ter sempre o mesmo
//     tamanho aparente — na vista geral e com a câmara colada ao planeta;
//  3. o desvio é feito no "para cima" da câmara e não no +Y do mundo: com um
//     astro perto do zénite, o +Y do mundo aponta para o observador e o painel
//     ia parar atrás do planeta em vez de por cima dele.
const PAINEL_INFO_LARGURA = 132;   // no mundo, à distância da cúpula (500)
const PAINEL_INFO_ALTURA = 66;
const PAINEL_INFO_CAMINHO = 0.8;   // fração da distância câmara → astro

function posicionarPainelInfoVR() {
    if (!vrPainelInfo3D || !vrUltimaSelecao || !vrCamera) return;

    const alvo = altAzParaXYZ(vrUltimaSelecao.altitude, vrUltimaSelecao.azimute, RAIO_CEU_VR);
    const cfg = astroCfg(vrUltimaSelecao.nome);
    const raio = cfg ? cfg.size * FATOR_ESCALA_VR : 20;

    const paraAstro = alvo.clone().sub(vrCamera.position);
    const distancia = Math.max(paraAstro.length(), 1);
    const escala = distancia / RAIO_CEU_VR;   // 1 à distância da cúpula
    const altura = PAINEL_INFO_ALTURA * escala;

    vrPainelInfo3D.scale.set(PAINEL_INFO_LARGURA * escala, altura, 1);

    const cima = new THREE.Vector3(0, 1, 0).applyQuaternion(vrCamera.quaternion);

    // Acima do planeta e do seu anel de seleção, com uma folga que também
    // acompanha a distância para não desaparecer de perto.
    vrPainelInfo3D.position
        .copy(vrCamera.position)
        .addScaledVector(paraAstro, PAINEL_INFO_CAMINHO)
        .addScaledVector(cima, raio * 1.15 + altura / 2 + 20 * escala);
}

// ── Painel de detalhes HTML (espelho do PC) ─────────────────────────────────
function linhaInfoVR(rotulo, valor) {
    return `<div class="vr-info-linha"><span>${rotulo}</span><b>${valor}</b></div>`;
}

function mostrarInfoAstroVR(astro) {
    const painel = document.getElementById("vr-info");
    if (!painel) return;

    const linhas = [];
    linhas.push(linhaInfoVR("Altitude", formatarGrausVR(astro.altitude)));
    linhas.push(linhaInfoVR("Azimute", formatarGrausVR(astro.azimute)));
    if (typeof astro.ra_aparente === "number") {
        linhas.push(linhaInfoVR("RA (aparente)", astro.ra_aparente.toFixed(3) + " h"));
    }
    if (typeof astro.dec_aparente === "number") {
        linhas.push(linhaInfoVR("Dec (aparente)", formatarGrausVR(astro.dec_aparente)));
    }
    if (astro.tipo === "lua" && astro.fase_nome) {
        const iluminacao = (typeof astro.iluminacao === "number") ? ` (${astro.iluminacao}%)` : "";
        linhas.push(linhaInfoVR("Fase", `${astro.emoji || "🌙"} ${astro.fase_nome}${iluminacao}`));
    }

    painel.innerHTML = `
        <div class="vr-info-titulo">✦ ${astro.nome}</div>
        <div class="vr-info-estado">${astro.visivel ? "✅ Acima do horizonte — observável" : "🌙 Abaixo do horizonte"}</div>
        ${linhas.join("")}
        <div class="vr-info-botoes">
            <button type="button" onclick="aproximarCameraSelecionadaVR()" title="Aproximar a câmara do astro">🔍 Aproximar</button>
            <button type="button" onclick="vistaGeralVR()" title="Voltar à vista geral">◀ Vista geral</button>
            <button type="button" onclick="limparSelecaoVR()" title="Fechar detalhes">✕</button>
        </div>`;
    painel.classList.add("visivel");
}

// Chamado pelo botão do painel HTML (modo PC) — aproxima o astro selecionado.
function aproximarCameraSelecionadaVR() {
    if (vrUltimaSelecao) aproximarCameraVR(vrUltimaSelecao);
}

// ── Aproximação suave da câmara (modo PC) ───────────────────────────────────
// No headset a câmara segue a cabeça do utilizador e NUNCA se move por código —
// a aproximação faz-se fisicamente, andando.
function aproximarCameraVR(astro) {
    if (!vrCamera || vrSessaoAtiva || vrPosCameraAlvo === null || !astro) return;
    const alvo = altAzParaXYZ(astro.altitude, astro.azimute, RAIO_CEU_VR);
    const cfg = astroCfg(astro.nome);
    const raio = cfg ? cfg.size * FATOR_ESCALA_VR : 20;
    const distancia = Math.max(raio * 4, 45); // nunca "entra" dentro do astro
    vrPosCameraAlvo.copy(alvo).normalize().multiplyScalar(RAIO_CEU_VR - distancia);
    vrOlharAlvo.copy(alvo);
    vrZoomAtivo = true;
}

function vistaGeralVR() {
    if (!vrCamera || vrPosCameraAlvo === null) return;
    vrPosCameraAlvo.set(0, 0, 0);
    vrZoomAtivo = true;
}

// ── Painel de botões 3D dentro da cena VR ───────────────────────────────────
// Vive no mundo, à frente do ponto de partida (referência local-floor), e é
// acionado com o laser + gatilho dos controladores. O botão «SAIR DO VR» é a
// saída principal dentro do headset; o DOM Overlay (botão HTML) e os controlos
// do sistema do Quest são as redundâncias — ver iniciarSessaoVR.
function criarBotao3DVR(texto, corFundo, corTexto, acao) {
    const larguraCv = 512, alturaCv = 160;
    const canvas = document.createElement("canvas");
    canvas.width = larguraCv;
    canvas.height = alturaCv;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = corFundo;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(10, 10, larguraCv - 20, alturaCv - 20, 36);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.fillRect(10, 10, larguraCv - 20, alturaCv - 20);
        ctx.strokeRect(10, 10, larguraCv - 20, alturaCv - 20);
    }

    ctx.fillStyle = corTexto;
    ctx.font = "bold 58px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, larguraCv / 2, alturaCv / 2);

    const textura = new THREE.CanvasTexture(canvas);
    textura.colorSpace = THREE.SRGBColorSpace;

    // Grupo = botão VISUAL + área de clique invisível com uma folga PEQUENA.
    // A área de antes (1,95 × 0,52 a 2,1m da cabeça — cerca de 50° × 14° de
    // céu aparente) era uma parede invisível à frente do utilizador: ficava
    // sempre mais perto do que os planetas (2,1m vs 500m) e interceptava os
    // raios dos controladores antes deles — era ela que fazia o gatilho
    // disparar o «SAIR DO VR» ao apontar a um planeta baixo ou ao espaço
    // vazio, e que condicionava a seleção a uma "zona específica" dos
    // planetas. Agora a área de clique segue de perto o botão visível (que já
    // é enorme àquela distância: ~36° de largura), e o que o raio atravessa
    // sem ser botão ou astro deixa simplesmente de fazer nada.
    const grupo = new THREE.Group();
    grupo.userData.acao = acao;

    const visual = new THREE.Mesh(
        new THREE.PlaneGeometry(1.35, 0.42),
        new THREE.MeshBasicMaterial({ map: textura, transparent: true, side: THREE.DoubleSide })
    );
    grupo.add(visual);

    const areaClique = new THREE.Mesh(
        new THREE.PlaneGeometry(1.45, 0.48),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    grupo.add(areaClique);

    return grupo;
}

function criarEtiquetaBotaoVR(texto) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(200, 225, 255, 0.9)";
    ctx.font = "40px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, 256, 48);

    const textura = new THREE.CanvasTexture(canvas);
    textura.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: textura, transparent: true, depthWrite: false
    }));
    sprite.scale.set(1.4, 0.26, 1);
    // Decorativa — não pode roubar cliques aos botões por cima dos quais está
    sprite.raycast = () => {};
    return sprite;
}

function criarPainelUI3D() {
    if (!vrScene || vrPainelUI3D) return; // idempotente — nunca duplicado
    vrPainelUI3D = new THREE.Group();

    // O painel é filho da CÂMARA (a cabeça, em XR): fica sempre à frente e
    // ao alcance das mãos, quer onde quer que o utilizador esteja ou olhe.
    // Antes ficava fixo no mundo e podia ficar atrás do utilizador ou fora
    // de alcance depois de andar — e os botões de saída não podem falhar.
    // Posição baixa (y -0.60 a 2,1m): fora da linha de visão principal.
    vrPainelUI3D.position.set(0, -0.60, -2.1);

    const botaoSair = criarBotao3DVR("⛔ SAIR DO VR", "rgba(150, 30, 50, 0.92)", "#ffe0e6", "sair-vr");
    botaoSair.position.set(0, 0.34, 0);
    vrPainelUI3D.add(botaoSair);

    const botaoVista = criarBotao3DVR("◀ VISTA GERAL", "rgba(20, 40, 80, 0.92)", "#cfe4ff", "vista-geral");
    botaoVista.position.set(0, -0.24, 0);
    vrPainelUI3D.add(botaoVista);

    const legenda = criarEtiquetaBotaoVR("Gatilho: selecionar • Grip: sair do VR");
    legenda.position.set(0, -0.80, 0);
    vrPainelUI3D.add(legenda);

    vrCamera.add(vrPainelUI3D);
    vrAlvosCache = null; // os alvos de seleção mudaram
}

function removerPainelUI3D() {
    if (!vrPainelUI3D) return;
    // Limpa destaques de hover e pressões mantidas que possam apontar para
    // botões já removidos
    vrControladoresInfo.forEach(info => {
        cancelarHoldBotaoVR(info);
        if (info.hover) {
            info.hover.scale.setScalar(1);
            info.hover = null;
        }
    });
    if (vrPainelUI3D.parent) vrPainelUI3D.parent.remove(vrPainelUI3D);
    vrPainelUI3D.traverse(o => {
        if (o.material) {
            if (o.material.map && o.material.map.isCanvasTexture) o.material.map.dispose();
            o.material.dispose();
        }
        // Geometrias dos botões — não são partilhadas, descartam-se já
        if (o.geometry && !geometriaPartilhadaVR(o.geometry)) o.geometry.dispose();
    });
    vrPainelUI3D = null;
    vrAlvosCache = null;
}

// ── Mira dos controladores: destaque do botão e pressão mantida ───────────
// Corre em sessão, dentro do ciclo de animação, SEM alocações (temporários
// partilhados e cache de alvos). O raio (o laser) é o verdadeiro ponteiro — a
// "bola" da ponta foi removida. Aqui fazem-se duas coisas: o destaque do botão
// sob o raio e a progressão da pressão mantida (que é o que, por fim, aciona
// o botão — ver o selecionarComRaycastVR).
function atualizarMiradoresVR() {
    if (!vrRaycaster || !vrTempOrigem
        || vrModoInteracao !== MODO_INTERACAO_VR.CONTROLLER) return;

    const agora = performance.now();
    for (const info of vrControladoresInfo) {
        if (!controllerTemTrackingValidoVR(info)) {
            if (info.laser) info.laser.visible = false;
            if (!info.rastreioPerdidoDesde) info.rastreioPerdidoDesde = agora;
            // Perda de pose cancela o gesto incompleto, mas preserva um astro
            // já agarrado durante a breve janela de tolerância do tracking.
            info.gatilhoPuxado = false;
            info.gatilhoInicio = 0;
            info.astroSelecionavel = null;
            info.astroParaAgarrar = null;
            cancelarHoldBotaoVR(info);
            if (agora - info.rastreioPerdidoDesde >= TOLERANCIA_PERDA_INPUT_VR_MS) {
                if (info.objetoAgarrado) soltarAstroVR(info);
                info.rastreioPerdidoDesde = 0;
            }
            continue;
        }
        info.rastreioPerdidoDesde = 0;
        if (info.laser) info.laser.visible = true;
        if (info.objetoAgarrado) continue;
        vrRaycaster.camera = vrCamera;
        vrTempOrigem.setFromMatrixPosition(info.controlador.matrixWorld);
        info.controlador.getWorldQuaternion(vrTempQuat);
        vrTempDirecao.set(0, 0, -1).applyQuaternion(vrTempQuat);
        vrRaycaster.ray.set(vrTempOrigem, vrTempDirecao);

        // Este raycast é exclusivamente do controller. A distância do alvo
        // escolhido (astro ou botão) termina o laser no hit, sem limitar nem
        // alterar o raycast usado pelo gatilho para selecionar.
        const intersecoes = vrRaycaster.intersectObjects(alvosDeSelecaoVR(), true);
        const escolhido = alvoSobRaioVR(intersecoes);
        const astroEscolhido = escolhido && portadorDeDadosVR(escolhido.object, "astro");
        const hitVisual = astroEscolhido ? escolhido
            : (intersecoes.length ? intersecoes[0] : null);
        const verticesLaser = info.laser.geometry.attributes.position;
        // O primeiro vértice fica fixo na origem local do comando (0,0,0).
        // Só o segundo se move; reescrever o primeiro com setXYZ(0, 0, 0)
        // deixava o z a undefined (NaN) e podia cortar o laser/culling.
        const comprimentoLaser = hitVisual
            ? Math.max(0, Math.min(120, vrTempOrigem.distanceTo(hitVisual.point)))
            : 120;
        verticesLaser.setXYZ(1, 0, 0, -comprimentoLaser);
        verticesLaser.needsUpdate = true;
        info.laser.geometry.computeBoundingSphere();

        // Destaque do botão apontado (feedback de que está "em cima" dele).
        // Usa o mesmo alvo do gatilho: um astro por trás do botão deixa o
        // botão sem destaque, em vez de o destaque a piscar a cada frame.
        const alvo = escolhido ? portadorDeDadosVR(escolhido.object, "acao") : null;
        const astroAlvo = escolhido ? portadorDeDadosVR(escolhido.object, "astro") : null;
        if (info.hover !== alvo) {
            if (info.hover && !info.hover.userData.vrEscalaOriginal) info.hover.scale.setScalar(1);
            if (alvo && !alvo.userData.vrEscalaOriginal) alvo.scale.setScalar(1.08);
            info.hover = alvo;
        }

        // O grabbing só começa se o gatilho estiver mantido e o mesmo astro
        // continuar sob o raio durante o atraso de distinção toque/agarre.
        if (info.gatilhoPuxado && info.astroParaAgarrar) {
            if (astroAlvo !== info.astroParaAgarrar) {
                info.astroParaAgarrar = null;
            } else if (agora - info.gatilhoInicio >= ATRASO_GRAB_VR_MS) {
                agarrarAstroVR(info, info.astroParaAgarrar);
                continue;
            }
        }

        // Pressão mantida num botão do painel: o gatilho tem de ficar puxado
        // ~0,7s COM o raio no mesmo botão. O botão cresce durante a espera (é
        // o feedback de que a pressão está a ser registada); soltar o gatilho,
        // sair do botão ou mudar de alvo cancela. É isto que impede um clique
        // simples — mesmo em cima do botão — de alguma vez terminar a sessão.
        if (info.holdBotao) {
            if (info.hover !== info.holdBotao) {
                cancelarHoldBotaoVR(info);
            } else {
                const mantido = agora - info.holdInicio;
                if (mantido >= HOLD_BOTAO_MS) {
                    const acionado = info.holdBotao;
                    cancelarHoldBotaoVR(info);
                    executarAcaoVR(acionado.userData.acao);
                } else {
                    info.holdBotao.scale.setScalar(1.08 + 0.22 * (mantido / HOLD_BOTAO_MS));
                }
            }
        }
    }
}