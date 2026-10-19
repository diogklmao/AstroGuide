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

// Controladores ativos (laser + ponta) e estado do gatilho — um pulso do
// gatilho dispara UMA ação (ao puxar, não à soltar: mais responsivo e não
// se desvia do alvo se a mão se mexer durante o clique).
let vrControladoresInfo = [];
let vrGatilhoPuxado = false;

// Cache dos alvos de seleção (invalidado quando os grupos mudam) e temporários
// para o raycast do laser SEM alocações no ciclo de renderização.
let vrAlvosCache = null;
let vrTempOrigem = null;
let vrTempDirecao = null;
let vrTempQuat = null;

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
// No Observatório 2D o céu debaixo do horizonte só aparece com a caixa "Ver
// abaixo do horizonte" ligada (ver verAbaixoDoHorizonte, no index.js) — sem
// ela, cada camada salta os objetos de baixo com um "if (!visivel)".
// Aqui não há caixa nenhuma: no VR o observador está DENTRO da cúpula, sem
// chão a tapar nada, e metade da graça do modo imersivo é poder baixar os olhos
// e ver o céu todo à volta. Por isso a opção está sempre ligada.
// O que se copia do 2D é a OPACIDADE: o que está debaixo do horizonte desenha-
// se apagado, para continuar a ler-se como "não observável neste instante" e
// não se confundir com o que está acima. O valor é o mesmo ALFA_ABAIXO do
// index.js (0,6) — o nome leva sufixo _VR só para não colidir com o de lá,
// já que as duas constantes vivem no mesmo âmbito global.
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

    // Iluminação proveniente do Sol + luz ambiente ténue (para as esferas)
    criarIluminacaoVR();

    // Fundo panorâmico da Via Láctea (space.jpg já usado no Observatório 2D)
    adicionarFundoViaLactea();

    // Texturas planetárias reais (locais, em static/images/texturas) para as
    // esferas. Se alguma falhar, o astro fica no sprite antigo (fallback).
    carregarTexturasPlanetasVR();

    // Estrelas, constelações e astros reais, vindos do mesmo /api/observatorio
    carregarDadosVR();

    // Controladores das mãos (Meta Quest Touch) com laser pointer
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
        // O Sol, a Lua e os planetas debaixo do horizonte TAMBÉM se desenham
        // (céu sob os pés, sempre ligado — ver ALFA_ABAIXO_VR). Como no 2D com
        // a caixa ligada, ficam apagados: vê-se que estão lá sem se confundirem
        // com os que estão observáveis.
        const cfg = astroCfg(astro.nome);
        if (!cfg) return;

        // Opacidade do astro: cheia acima do horizonte, ALFA_ABAIXO_VR abaixo.
        // O Sol leva um extra de brilho (0,95), sobre o qual o fator se aplica.
        const opacidadeBase = (astro.tipo === "sol") ? 0.95 : 1;
        const opacidade = astro.visivel ? opacidadeBase : opacidadeBase * ALFA_ABAIXO_VR;

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
function criarControladoresVR() {
    for (let i = 0; i < 2; i++) {
        const controlador = vrRenderer.xr.getController(i);

        // Linha de laser — aponta ao longo de -Z (direção do ray) do controlador
        const laser = criarLaser(0x6eb8ff);
        controlador.add(laser);

        // Ponta da mira. A posição em Z é atualizada todos os frames para a
        // DISTÂNCIA real do alvo (ver atualizarMiradoresVR) — sem isto, a
        // ponta ficava a 120m e não havia referência nenhuma para acertar nos
        // botões do painel, que estão a ~2m.
        const ponta = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0x9ed4ff, transparent: true, opacity: 0.9 })
        );
        ponta.position.z = -2.1;
        controlador.add(ponta);

        vrControladoresInfo.push({ controlador, laser, ponta, hover: null });

        // Puxar o gatilho acende o laser E dispara a ação IMEDIATAMENTE sobre
        // o alvo apontado: astro (abre os detalhes) ou botão 3D do painel
        // («SAIR DO VR», «VISTA GERAL»). Um pulso = uma ação (debounce).
        // Fora de alvo nenhum, nada acontece — a navegação nunca é bloqueada.
        controlador.addEventListener("selectstart", () => {
            laser.material.color.setHex(0xffffff);
            ponta.material.color.setHex(0xffcc02);
            if (!vrGatilhoPuxado) {
                vrGatilhoPuxado = true;
                selecionarComRaycastVR(controlador);
            }
        });
        controlador.addEventListener("selectend", () => {
            laser.material.color.setHex(0x6eb8ff);
            ponta.material.color.setHex(0x9ed4ff);
            vrGatilhoPuxado = false;
        });

        // Grip (botão de aperto) em qualquer controlador = SAIR DO VR na hora,
        // sem mirar em nada — redundância de segurança que garante que o
        // utilizador nunca fica preso na sessão imersiva.
        controlador.addEventListener("squeezestart", () => {
            sairSessaoVR();
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

// Restaura a interface normal quando a sessão termina — por QUALQUER caminho
// (botão «SAIR DO VR», DOM Overlay, sistema do Quest, erro). Idempotente:
// pode ser chamada várias vezes sem efeitos laterais.
function restaurarInterfaceAposSessao() {
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
    const dt = Math.min((agoraMs - (vrUltimoTempoMs || agoraMs)) / 1000, 0.1);
    vrUltimoTempoMs = agoraMs;

    // Rotação VISUAL suave das esferas — só a textura gira à volta do próprio
    // eixo. Não confundir com cálculo astronómico: as posições vêm todas do
    // /api/observatorio e não são tocadas. O ângulo acumula-se por astro (ver
    // vrRotacoesVisuais) para sobreviver aos rebuilds do grupo.
    if (vrGrupoAstros) {
        for (const obj of vrGrupoAstros.children) {
            if (obj.userData.esfera && obj.userData.rotacaoVel && obj.userData.astro) {
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

    // Em sessão: ponta do laser à distância do alvo + destaque do botão
    if (vrSessaoAtiva) atualizarMiradoresVR();

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
        if (vrGrupoAstros) alvos.push(...vrGrupoAstros.children);
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

function selecionarComRaycastVR(origem) {
    const intersecoes = raycastVR(origem);
    if (!intersecoes.length) return;
    const alvo = intersecoes[0].object;

    const botao = portadorDeDadosVR(alvo, "acao");
    if (botao) {
        executarAcaoVR(botao.userData.acao);
        return;
    }
    const portador = portadorDeDadosVR(alvo, "astro");
    if (portador) selecionarAstroVR(portador.userData.astro);
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
function selecionarAstroVR(astro) {
    if (!astro || !vrScene) return;
    limparSelecaoVR();
    vrUltimaSelecao = astro;

    const posicao = altAzParaXYZ(astro.altitude, astro.azimute, RAIO_CEU_VR);
    const cfg = astroCfg(astro.nome);
    const raio = cfg ? cfg.size * FATOR_ESCALA_VR : 20;

    vrMarcadorSelecao = criarMarcadorSelecaoVR(posicao, raio);
    vrScene.add(vrMarcadorSelecao);

    vrPainelInfo3D = criarPainelInfo3DVR(astro);
    vrScene.add(vrPainelInfo3D);

    mostrarInfoAstroVR(astro); // painel HTML (espelho no PC)

    // No headset a câmara é do utilizador — não se mexe nela. No modo PC a
    // aproximação é suave e o regresso faz-se pelo botão «Vista geral».
    if (!vrSessaoAtiva) aproximarCameraVR(astro);
}

function limparSelecaoVR() {
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

    // Fica entre o observador e o astro, ligeiramente abaixo, para não tapar
    // o planeta selecionado.
    const pos = altAzParaXYZ(astro.altitude, astro.azimute, RAIO_CEU_VR);
    sprite.position.copy(pos).multiplyScalar(0.88);
    sprite.position.y -= 30;
    sprite.scale.set(150, 75, 1);
    return sprite;
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

    // Grupo = botão VISUAL + área de clique invisível MUITO maior. A mira de
    // um controlador não tem a precisão de um rato; sem uma hitbox generosa,
    // acertar num botão pequeno a 2m era uma lotaria.
    const grupo = new THREE.Group();
    grupo.userData.acao = acao;

    const visual = new THREE.Mesh(
        new THREE.PlaneGeometry(1.35, 0.42),
        new THREE.MeshBasicMaterial({ map: textura, transparent: true, side: THREE.DoubleSide })
    );
    grupo.add(visual);

    const areaClique = new THREE.Mesh(
        new THREE.PlaneGeometry(1.95, 0.52),
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
    // Limpa destaques de hover que possam apontar para botões já removidos
    vrControladoresInfo.forEach(info => {
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

// ── Mira dos controladores: ponta à distância do alvo + destaque do botão ──
// Corre em sessão, dentro do ciclo de animação, SEM alocações (temporários
// partilhados e cache de alvos). Sem a ponta à distância certa, não há
// referência visual para acertar num botão a 2m — era este o principal
// motivo de o gatilho "não reconhecer" os botões.
function atualizarMiradoresVR() {
    if (!vrRaycaster || !vrTempOrigem) return;

    for (const info of vrControladoresInfo) {
        vrRaycaster.camera = vrCamera;
        vrTempOrigem.setFromMatrixPosition(info.controlador.matrixWorld);
        info.controlador.getWorldQuaternion(vrTempQuat);
        vrTempDirecao.set(0, 0, -1).applyQuaternion(vrTempQuat);
        vrRaycaster.ray.set(vrTempOrigem, vrTempDirecao);

        const intersecoes = vrRaycaster.intersectObjects(alvosDeSelecaoVR(), true);

        // Ponta do laser à distância REAL do primeiro alvo (limitada para não
        // saltar para o infinito); sem alvo, fica a 3m — confortável de seguir.
        const distancia = intersecoes.length
            ? Math.min(Math.max(intersecoes[0].distance, 0.6), 120)
            : 3;
        info.ponta.position.z = -distancia;

        // Destaque do botão apontado (feedback de que está "em cima" dele)
        const alvo = intersecoes.length ? portadorDeDadosVR(intersecoes[0].object, "acao") : null;
        if (info.hover !== alvo) {
            if (info.hover) info.hover.scale.setScalar(1);
            if (alvo) alvo.scale.setScalar(1.08);
            info.hover = alvo;
        }
    }
}