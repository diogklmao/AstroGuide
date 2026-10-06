// ── Variáveis globais ─────────────────────────────────────────────
// O calendário abre no mês em que se está — no fuso da localização escolhida,
// e não no do computador. Pelas 00:30 de 1 de outubro em Sydney, o computador
// em Lisboa ainda está em setembro; abrir o calendário em setembro era mostrar
// um mês que já passou.
let calAno = horaEDataNoLocal().ano;
let calMes = horaEDataNoLocal().mes;

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

// ── A hora do local escolhido ─────────────────────────────────────
// A localização escolhida no perfil traz um fuso horário, e é ele que decide
// que horas são na aplicação — não o relógio do computador de quem está a ver.
//
// Isto não é arrumação: o céu é o do instante, e o instante é um só no mundo
// inteiro. Quem está em Lisboa a ver o céu de Sydney precisa de saber que horas
// são LÁ para perceber o que está a olhar. O servidor escreve a localização no
// HTML (ver o index.html), e é daqui que ela se lê.

function fusoDoLocal() {
    // Sem localização no HTML cai-se em undefined, e o Intl trata isso como
    // "usa o fuso do computador" — que é o que a aplicação fazia antes de isto
    // existir. Nunca devia acontecer (o servidor escreve-a sempre), mas um
    // relógio parado é um erro pior do que um relógio no fuso errado.
    return (window.LOCALIZACAO && window.LOCALIZACAO.timezone) || undefined;
}

function horaEDataNoLocal() {
    // A data e a hora de agora no fuso da localização escolhida.
    //
    // Devolve as peças já separadas — "data" para os campos <input type="date">
    // (que só aceitam AAAA-MM-DD) e os números à parte para o calendário, que
    // precisa de comparar ano, mês e dia com o que está a desenhar. Devolver
    // uma string obrigava cada sítio a voltar a parti-la.
    const pecas = {};
    try {
        new Intl.DateTimeFormat("en-GB", {
            timeZone: fusoDoLocal(),
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
            // h23 em vez de h12: com h12 vinha "12:30" da meia-noite e não
            // havia maneira de saber se era meia-noite ou meio-dia.
            hourCycle: "h23",
        }).formatToParts(new Date()).forEach(p => { pecas[p.type] = p.value; });
    } catch (erro) {
        // Um fuso que o browser não conhece (o servidor valida-o, mas quem
        // mexesse na base de dados à mão podia lá pôr outro) cai aqui. É o
        // mesmo caminho de quando não há localização nenhuma: a hora do
        // computador, que é o que se fazia antes disto.
        const agora = new Date();
        return {
            data: agora.toLocaleDateString("sv-SE"),
            hora: `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`,
            segundo: String(agora.getSeconds()).padStart(2, "0"),
            ano: agora.getFullYear(), mes: agora.getMonth() + 1, dia: agora.getDate(),
        };
    }

    return {
        data: `${pecas.year}-${pecas.month}-${pecas.day}`,
        // Alguns motores devolvem "24" à meia-noite mesmo com h23. É a mesma
        // hora que "00", e é assim que os campos <input type="time"> a lêem.
        hora: `${pecas.hour === "24" ? "00" : pecas.hour}:${pecas.minute}`,
        segundo: pecas.second,
        ano: Number(pecas.year), mes: Number(pecas.month), dia: Number(pecas.day),
    };
}

// ── Relógio ───────────────────────────────────────────────────────
function atualizarRelogio() {
    const alvo = document.getElementById("relogio");
    if (!alvo) return;

    const agora = horaEDataNoLocal();
    const [ano, mes, dia] = agora.data.split("-");   // AAAA-MM-DD -> partes
    alvo.textContent = `🕐 ${dia}/${mes}/${ano}  ${agora.hora}:${agora.segundo}`;
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

    // Os seletores da data e da hora são painéis "fixed" presos aos campos que
    // os abriram: fora do Observatório esses campos não estão à vista, e os
    // painéis ficavam a flutuar sozinhos por cima do ecrã novo.
    fecharSeletoresTempo();

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
        if (typeof esconderImagemConstelacao === "function") esconderImagemConstelacao();
        if (typeof sairSessaoVR === "function") sairSessaoVR();
    }

    // A música ambiente acompanha só quem está a olhar para o céu — o
    // Observatório (o 2D) e o VR. Nas outras abas (o céu de hoje, o
    // calendário, a imagem do dia) são dados para ler, e uma música por cima
    // não ajuda a ler nada. Sair daqui pausa-a e voltar traz-lhe o som de
    // volta, sem se perder o estar ligada (ver o definirEcraDaMusica).
    if (typeof definirEcraDaMusica === "function") {
        definirEcraDaMusica(nome === "observatorio" || nome === "vr");
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

        // "Hoje" é hoje no fuso da localização escolhida: é a mesma razão do
        // mês com que o calendário abre (ver o topo do ficheiro). O resto do
        // calendário não muda com isto — os dias e as fases vêm do servidor,
        // já calculados para a localização da conta.
        const hoje = horaEDataNoLocal();
        const hojeAno = hoje.ano;
        const hojesMes = hoje.mes;
        const hojesDia = hoje.dia;
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
    // Escolher o dia que já está escolhido é desescolhê-lo: é o mesmo gesto
    // que fez a escolha, e é assim que se fecha o painel sem ter de achar
    // outro sítio para clicar. O mesmo faz um clique fora (ver o
    // limparDiaSelecionado, mais abaixo).
    if (celula && celula.classList.contains("selecionado")) {
        limparDiaSelecionado();
        return;
    }

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

// Desfaz a escolha do dia: tira a marca à casa e fecha o painel de detalhes.
// Não faz nada quando não há dia escolhido — quem chama (o clique fora, o
// segundo clique no mesmo dia) não precisa de saber se havia.
function limparDiaSelecionado() {
    const escolhido = document.querySelector(".cal-dia.selecionado");
    if (!escolhido) return;

    escolhido.classList.remove("selecionado");
    const painel = document.getElementById("detalhe-dia");
    painel.innerHTML = "";
    painel.classList.remove("visivel");
}

// O clique fora do calendário e do painel de detalhes também desfaz a escolha:
// quem está a clicar noutra coisa da página deixou de olhar para o dia. O que
// fica de fora do alvo são as próprias casas dos dias (é o verDia que trata
// delas, e uma casa escolhida é desescolhida ali) e o painel, onde se lê o que
// a escolha mostra — apagá-lo a um clique de rolagem dentro dele era o
// contrário de útil.
document.addEventListener("click", function (e) {
    const alvo = e.target && e.target.closest ? e.target : null;
    if (alvo && alvo.closest(".cal-dia:not(.cal-vazio), #detalhe-dia")) return;
    limparDiaSelecionado();
});

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

// O mínimo que o "Céu sob os pés" desce, em graus (ver
// altitudeDoCeuEscondido). Existe por causa do equador, onde a conta dá zero.
const MERGULHO_MINIMO = 40;

// Abaixo desta altitude a câmara conta como estando a olhar para o céu de
// baixo, e é isso que decide se o botão diz "Céu sob os pés" ou "Voltar ao céu
// de cima". Não é o 0: no horizonte exato o rótulo ficava a piscar a cada
// arrasto que passasse por ali, e uns graus abaixo já se vê o suficiente para
// o botão fazer sentido.
const ALT_DE_ESTAR_ABAIXO = -5;

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
    // A ISS tem imagem própria porque é o objeto que se anda à procura no céu
    // e um ponto branco, por muito que brilhe, não diz o que ali está. O
    // "size" dela não quer dizer o mesmo que nos planetas: ver o ramo dela no
    // desenho dos astros, mais abaixo, onde é ele que manda no tamanho.
    "ISS": { src: "/static/images/iss.png", size: 20 },
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
    // Os seletores da data e da hora estão presos aos campos que os abriram, e
    // esses campos vão deslizar para fora do ecrã com o painel: sem isto
    // ficavam a flutuar sozinhos, sem nada a que pertencer.
    fecharSeletoresTempo();
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
    const chkControlo = document.getElementById("chk-night-mode");

    // A caixa dos Controlos é o único interruptor que existe (o botão que
    // havia no mapa saiu): quem a carrega passa o estado novo, e é ele que
    // manda. Isto escreve-lhe o mesmo estado de volta para o caso de a função
    // ser chamada sem argumento — é o que a deixa continuar a servir sozinha.
    if (modoNightModeAtivo) {
        body.classList.add("red-velvet-mode");
        if (chkControlo) chkControlo.checked = true;
    } else {
        body.classList.remove("red-velvet-mode");
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

    // O "Céu sob os pés" só existe no Planisfério, não: ali não há céu de baixo
    // para onde descer (ver alternarCeusSobOsPes). Desativado em vez de
    // escondido — um botão que aparece e desaparece faz saltar o que vem
    // abaixo no painel, e assim continua lá a explicar porque é que não dá.
    const botaoSobOsPes = document.getElementById("btn-ceu-sob-pes");
    if (botaoSobOsPes) {
        const podeDescer = modo === "360";
        botaoSobOsPes.disabled = !podeDescer;
        botaoSobOsPes.title = podeDescer
            ? "Descer a câmara até ao céu que não se vê daqui — o polo celeste escondido"
            : "Só na Vista 360°: no Planisfério o céu de baixo cai fora do círculo";
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

        // Atualiza a localização no cabeçalho. O nome vem do próprio céu que
        // acabou de chegar (o /api/observatorio calcula-o para a localização da
        // conta), e só se não vier é que se usa o que o servidor escreveu no
        // HTML — para o cabeçalho não ficar a dizer "Vila Nova de Gaia" a quem
        // escolheu Madrid.
        document.getElementById("localizacao").textContent =
            "📍 " + (apiData.localizacao_nome || (window.LOCALIZACAO && window.LOCALIZACAO.nome) || "");

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

    // Os objetos de céu profundo são objectos fixos do céu como as estrelas, e
    // por isso viajam com elas na transição da mudança de hora. Sem esta cópia
    // eles ficavam parados no lugar novo enquanto o céu inteiro lhes rodava à
    // volta — e uma nebulosa 120° ao lado das suas estrelas vê-se bem.
    const ceuProfundo = {};
    for (const id in ceu.ceu_profundo || {}) {
        const d = ceu.ceu_profundo[id];
        ceuProfundo[id] = {
            altitude: d.altitude, azimute: d.azimute, visivel: d.visivel,
            ra_aparente: d.ra_aparente, dec_aparente: d.dec_aparente
        };
    }

    return {
        estrelas: estrelas,
        astros: astros,
        ceu_profundo: ceuProfundo,
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

    for (const id in observatorioDados.ceu_profundo || {}) {
        const valores = copia.ceu_profundo[id];
        if (!valores) continue;
        const alvo = observatorioDados.ceu_profundo[id];
        alvo.altitude = valores.altitude;
        alvo.azimute = valores.azimute;
        alvo.visivel = valores.visivel;
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

    // Todos os objectos do céu — estrelas, céu profundo, Sol, Lua e planetas —
    // vão pelo mesmo caminho: em cada frame a posição sai do RA/Dec e do tempo
    // sideral desse instante. Nas estrelas e nos objetos de céu profundo o
    // RA/Dec é sempre o mesmo (o que muda é o tempo sideral); nos astros vai
    // variando devagar, e por isso vai interpolado entre os dois extremos.
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

    for (const id in destino.ceu_profundo || {}) {
        const entrada = montarEntrada(destino.ceu_profundo[id],
                                      inicio.ceu_profundo[id], fim.ceu_profundo[id]);
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
// Compara, para tudo o que tem RA/Dec — estrelas, objetos de céu profundo, Sol,
// Lua e planetas —, a posição que este cálculo dá com a que veio do servidor
// para o mesmo instante.
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

    // Estrelas, céu profundo e astros, todos: o cálculo em que a animação se
    // apoia é o mesmo para todos, e uma verificação que só cobrisse metade
    // deles podia passar com a outra metade avariada. Nos astros é até mais
    // útil — têm paralaxe (a Lua, sobretudo), que é onde uma conversão mal
    // feita se notaria primeiro.
    const objetos = [];
    for (const id in observatorioDados.estrelas) objetos.push(observatorioDados.estrelas[id]);
    for (const astro of observatorioDados.astros || []) objetos.push(astro);
    for (const id in observatorioDados.ceu_profundo || {}) objetos.push(observatorioDados.ceu_profundo[id]);

    for (const objeto of objetos) {
        if (objeto.ra_aparente == null) continue;

        const posicao = altAzDe(objeto.ra_aparente, objeto.dec_aparente,
                                observatorioDados.latitude, observatorioDados.tempo_sideral);

        // Azimute pelo caminho curto: 359,9° e 0,1° distam 0,2°, não 359,8°.
        piorAltitude = Math.max(piorAltitude, Math.abs(posicao.altitude - objeto.altitude));
        piorAzimute = Math.max(piorAzimute, Math.abs(diferencaAngular(objeto.azimute, posicao.azimute)));
        quantas++;
    }

    console.log(`${quantas} objectos comparados (estrelas, céu profundo e astros). Pior diferença: ` +
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
        // A hora real, no fuso da localização escolhida: é a hora que o
        // servidor vai usar para calcular o céu de agora (ver o
        // /api/observatorio, no server.py), e os campos têm de dizer o mesmo
        // que o céu mostra.
        const agora = horaEDataNoLocal();
        inputData.value = agora.data;
        inputHora.value = agora.hora;
    }

    // Os campos da data e da hora são botões, e os valores acabaram de ser
    // escritos nos inputs escondidos: é isto que os leva até ao texto que se
    // lê.
    sincronizarCampoHora();
    sincronizarCampoData();
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

    // Escolher exatamente a data/hora atuais quer dizer "voltar ao tempo real";
    // qualquer outro valor passa a ser o tempo simulado partilhado com o VR.
    // As duas têm de ser lidas no mesmo fuso dos campos — o do local escolhido.
    const agora = horaEDataNoLocal();
    tempoSimuladoObs = (data === agora.data && hora === agora.hora) ? null : { data, hora };

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

// ── Painéis presos a um campo ───────────────────────────────────────────────
// O seletor da hora e o da data são a mesma peça por baixo: um painel que
// abre ao lado do campo que o abriu e se fecha com um clique fora ou com o
// Esc. O que muda entre eles é só o que vai lá dentro.
//
// Os dois vivem no <body> e são "fixed", e não dentro do painel lateral: o
// .observatorio-controlos tem overflow próprio e o .glass-panel tem
// backdrop-filter, que prende os filhos "fixed" ao painel — lá dentro ficavam
// presos e cortados a meio. É a mesma razão por que o painel da IA vive fora
// do .app.

// Põe o painel ao lado do campo. No Observatório o painel lateral está
// encostado à esquerda, e é à direita dele que há espaço — mas num telefone
// não há, e o painel desce para baixo do campo (ou sobe, se também não
// couber). Em qualquer dos casos acaba encaixado dentro do ecrã.
function posicionarPopup(painel, campo) {
    if (!painel || !campo || !painel.classList.contains("aberto")) return;

    const caixa = campo.getBoundingClientRect();
    const largura = painel.offsetWidth;
    const altura = painel.offsetHeight;
    const folga = 10;
    let esquerda = caixa.right + folga;
    let topo = caixa.top;

    if (esquerda + largura > window.innerWidth - 8) {
        esquerda = caixa.left;
        topo = caixa.bottom + folga;
        if (topo + altura > window.innerHeight - 8) topo = caixa.top - folga - altura;
    }

    esquerda = Math.max(8, Math.min(esquerda, window.innerWidth - largura - 8));
    topo = Math.max(8, Math.min(topo, window.innerHeight - altura - 8));

    painel.style.left = Math.round(esquerda) + "px";
    painel.style.top = Math.round(topo) + "px";
}

// Arma os fechos comuns: um clique fora ou o Esc fecham o painel, e o que faz
// o campo andar (a roda do rato no painel lateral, a janela a mudar de
// tamanho) obriga a apontar outra vez para ele — o painel é "fixed" e não anda
// com o campo. O scroll ouve-se na captura: os eventos de scroll não sobem do
// elemento para a janela, mas na captura passam por lá.
//
// O `fechar` que chega de fora decide o resto — e recebe o mesmo booleano que
// os dois caminhos abaixo lhe passam: true quando quem fechou foi o próprio
// utilizador (Esc), e é aí que faz sentido devolver-lhe o foco ao campo; false
// quando foi um clique noutro sítio, que não deve tirar o foco a quem o pôs lá.
//
// Devolve a função que desliga tudo. Quem abre guarda-a e chama-a ao fechar:
// sem isso, cada abertura deixava mais um par de ouvintes agarrado ao
// documento.
function ligarFechosDoPopup(painel, campo, fechar) {
    function tratarCliqueFora(e) {
        if (painel.contains(e.target) || campo.contains(e.target)) return;
        fechar(false);
    }

    function tratarTecla(e) {
        if (e.key !== "Escape") return;
        e.preventDefault();
        fechar(true);
    }

    function reposicionar() {
        posicionarPopup(painel, campo);
    }

    document.addEventListener("pointerdown", tratarCliqueFora, true);
    document.addEventListener("keydown", tratarTecla, true);
    window.addEventListener("scroll", reposicionar, true);
    window.addEventListener("resize", reposicionar);

    return function desligar() {
        document.removeEventListener("pointerdown", tratarCliqueFora, true);
        document.removeEventListener("keydown", tratarTecla, true);
        window.removeEventListener("scroll", reposicionar, true);
        window.removeEventListener("resize", reposicionar);
    };
}

// ── O seletor de hora (Horas + Minutos) ─────────────────────────────────────
// O campo da hora era um <input type="time">, e o browser abria-lhe uma lista
// branca que não se consegue vestir: quem a desenha é o próprio browser, e não
// lhe chega CSS nenhum. Aqui o campo é um botão e o painel é nosso — duas
// colunas, das horas e dos minutos, no lilás do bloco "Simular Data/Hora".
//
// O valor continua a viver no #obs-hora, agora escondido: é ele que o
// inicializarSeletorHora e o atualizarObservatorioComHora lêem e escrevem, tal
// como faziam antes, e nenhum deles precisou de saber que o campo mudou de
// desenho. O que é novo é o sincronizarCampoHora, que leva o valor do input
// escondido até ao texto do botão.

const HORAS_DO_DIA = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTOS_DA_HORA = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

// O painel é construído à primeira abertura e fica para as seguintes; as duas
// listas ficam guardadas porque é por elas que se marca a escolha, se anda com
// as setas e se traz a opção à vista.
let painelHora = null;
// O desligar dos fechos (clique fora, Esc, scroll, resize) enquanto o painel
// está aberto — ver o ligarFechosDoPopup. Fora disso é null.
let desligarFechosHora = null;
const listasHora = { hora: null, minuto: null };

// A opção debaixo do cursor de teclado, por coluna. É coisa diferente da
// escolhida: andar com as setas move esta sem mexer na hora, e é o Enter (ou o
// clique) que muda a hora.
const ativoHora = { hora: null, minuto: null };

// O valor que está no campo, partido ao meio: "14:35" -> {hora:"14", minuto:"35"}.
function valorDaParteHora(parte) {
    const input = document.getElementById("obs-hora");
    const [hora, minuto] = (input && input.value ? input.value : "00:00").split(":");
    return parte === "hora" ? hora : minuto;
}

// Leva o valor do input escondido até ao texto do botão. Nos sítios onde o
// valor é escrito por fora deste ficheiro — o inicializarSeletorHora, quando
// repõe a hora real ou a simulada — é isto que põe o botão a dizer o mesmo.
function sincronizarCampoHora() {
    const texto = document.getElementById("obs-hora-texto");
    if (!texto) return;
    const valor = valorDaParteHora("hora") + ":" + valorDaParteHora("minuto");
    texto.textContent = valor;
}

function construirSeletorHora() {
    const painel = document.createElement("div");
    painel.className = "obs-hora-picker";
    painel.id = "obs-hora-picker";
    painel.setAttribute("role", "group");
    painel.setAttribute("aria-label", "Escolher a hora");

    painel.appendChild(criarColunaHora("hora", "Hora", HORAS_DO_DIA));
    painel.appendChild(criarColunaHora("minuto", "Minutos", MINUTOS_DA_HORA));

    // No <body>, e não dentro do painel lateral: o .observatorio-controlos tem
    // overflow próprio e o .glass-panel tem backdrop-filter, que prende os
    // filhos "fixed" ao painel — e um painel preso ali dentro, com 186px de
    // lista, ficava cortado a meio. É a mesma razão por que o painel da IA
    // vive fora do .app.
    document.body.appendChild(painel);
    return painel;
}

// Uma coluna (Hora ou Minutos) com as suas opções. A coluna é uma listbox: só
// ela leva foco (tabindex 0), e é por ela que se anda com as setas — as 84
// opções todas no caminho do Tab seriam 84 paragens para sair do seletor.
function criarColunaHora(parte, titulo, valores) {
    const coluna = document.createElement("div");
    coluna.className = "obs-hora-coluna";

    const cabecalho = document.createElement("div");
    cabecalho.className = "obs-hora-coluna-titulo";
    cabecalho.id = "obs-hora-titulo-" + parte;
    cabecalho.textContent = titulo;

    const lista = document.createElement("div");
    lista.className = "obs-hora-lista";
    lista.id = "obs-hora-lista-" + parte;
    lista.tabIndex = 0;
    lista.setAttribute("role", "listbox");
    lista.setAttribute("aria-labelledby", cabecalho.id);
    lista.addEventListener("keydown", function (e) {
        tratarTeclaListaHora(e, parte, lista);
    });

    valores.forEach(function (valor) {
        const opcao = document.createElement("button");
        opcao.type = "button";
        opcao.id = "obs-hora-" + parte + "-" + valor;
        opcao.className = "obs-hora-opcao";
        opcao.dataset.valor = valor;
        opcao.tabIndex = -1;
        opcao.setAttribute("role", "option");
        opcao.setAttribute("aria-selected", "false");
        opcao.textContent = valor;
        // Sem isto o clique punha o foco na opção e tirava-o à listbox, e as
        // setas deixavam de andar. O clique continua a valer — o que se trava
        // é só o foco a mudar de sítio.
        opcao.addEventListener("mousedown", function (e) { e.preventDefault(); });
        opcao.addEventListener("click", function () {
            escolherParteHora(parte, valor);
        });
        lista.appendChild(opcao);
    });

    coluna.appendChild(cabecalho);
    coluna.appendChild(lista);
    listasHora[parte] = lista;
    return coluna;
}

// Pinta uma coluna: a opção escolhida (a que está no campo) e a ativa (a que
// está debaixo do cursor de teclado). São dois estados, e é por isso que são
// duas marcas: o aria-selected e a classe .ativo.
function marcarColunaHora(parte) {
    const lista = listasHora[parte];
    if (!lista) return;

    const escolhido = valorDaParteHora(parte);
    const ativo = ativoHora[parte] || escolhido;
    Array.from(lista.children).forEach(function (opcao) {
        opcao.setAttribute("aria-selected", opcao.dataset.valor === escolhido ? "true" : "false");
        opcao.classList.toggle("ativo", opcao.dataset.valor === ativo);
    });
    // É por este id que o leitor de ecrã sabe qual das opções está debaixo do
    // cursor, já que o foco não anda de opção em opção.
    lista.setAttribute("aria-activedescendant", "obs-hora-" + parte + "-" + ativo);
}

// Traz a opção à vista, ao centro da lista. O offsetTop conta a partir da
// lista (o .obs-hora-lista é position: relative), e não da página.
function trazerParaVista(parte, valor) {
    const lista = listasHora[parte];
    if (!lista) return;
    const opcao = lista.querySelector('[data-valor="' + valor + '"]');
    if (!opcao) return;
    lista.scrollTop = opcao.offsetTop - (lista.clientHeight - opcao.offsetHeight) / 2;
}

function tratarTeclaListaHora(e, parte, lista) {
    const opcoes = Array.from(lista.children);
    const atual = ativoHora[parte] || valorDaParteHora(parte);
    const i = opcoes.findIndex(function (o) { return o.dataset.valor === atual; });
    let novo = null;

    if (e.key === "ArrowDown") novo = opcoes[Math.min(i + 1, opcoes.length - 1)];
    else if (e.key === "ArrowUp") novo = opcoes[Math.max(i - 1, 0)];
    else if (e.key === "PageDown") novo = opcoes[Math.min(i + 10, opcoes.length - 1)];
    else if (e.key === "PageUp") novo = opcoes[Math.max(i - 10, 0)];
    else if (e.key === "Home") novo = opcoes[0];
    else if (e.key === "End") novo = opcoes[opcoes.length - 1];
    else if (e.key === "Enter" || e.key === " ") {
        // Escolhe o que está debaixo do cursor. É o Enter que muda a hora —
        // andar com as setas só anda.
        e.preventDefault();
        escolherParteHora(parte, atual);
        return;
    } else {
        return;
    }

    // A lista também rola sozinha com as setas; quem manda aqui é o cursor.
    e.preventDefault();
    if (!novo) return;
    ativoHora[parte] = novo.dataset.valor;
    marcarColunaHora(parte);
    trazerParaVista(parte, novo.dataset.valor);
}

function escolherParteHora(parte, valor) {
    const input = document.getElementById("obs-hora");
    if (!input || !valor) return;

    const [hora, minuto] = (input.value || "00:00").split(":");
    input.value = parte === "hora" ? valor + ":" + minuto : hora + ":" + valor;

    ativoHora[parte] = valor;
    sincronizarCampoHora();
    marcarColunaHora("hora");
    marcarColunaHora("minuto");

    // É daqui que o céu viaja até à hora nova — o mesmo caminho do campo
    // nativo, que só tinha um onchange a chamar isto.
    atualizarObservatorioComHora();

    // Escolhidos os minutos, o gesto está completo: fecha-se e devolve-se o
    // foco ao campo. Escolhida a hora, fica aberto — quem escolhe a hora
    // escolhe os minutos a seguir.
    if (parte === "minuto") fecharSeletorHora(true);
}

function alternarSeletorHora() {
    if (painelHora && painelHora.classList.contains("aberto")) {
        fecharSeletorHora(true);
        return;
    }
    abrirSeletorHora();
}

function abrirSeletorHora() {
    const campo = document.getElementById("obs-hora-campo");
    if (!campo) return;

    if (!painelHora) painelHora = construirSeletorHora();

    // Abre sempre na escolha: as setas partem do valor que está no campo.
    ativoHora.hora = valorDaParteHora("hora");
    ativoHora.minuto = valorDaParteHora("minuto");
    marcarColunaHora("hora");
    marcarColunaHora("minuto");

    // Visível primeiro: é preciso medir para o pôr no sítio certo. Como não se
    // desenha nada entre isto e o posicionar, não se vê o salto.
    painelHora.classList.add("aberto");
    posicionarPopup(painelHora, campo);
    trazerParaVista("hora", ativoHora.hora);
    trazerParaVista("minuto", ativoHora.minuto);
    campo.setAttribute("aria-expanded", "true");
    desligarFechosHora = ligarFechosDoPopup(painelHora, campo, fecharSeletorHora);

    if (listasHora.hora) listasHora.hora.focus();
}

// Idempotente: quem a chama não precisa de saber se ele estava aberto. O
// devolverFoco distingue as duas saídas — o Esc e a escolha dos minutos devem
// pôr o foco de volta no campo; um clique fora não, senão tirava-se o foco a
// quem o pôs noutro sítio.
function fecharSeletorHora(devolverFoco) {
    const estavaAberto = painelHora && painelHora.classList.contains("aberto");

    if (painelHora) painelHora.classList.remove("aberto");
    const campo = document.getElementById("obs-hora-campo");
    if (campo) campo.setAttribute("aria-expanded", "false");

    if (desligarFechosHora) {
        desligarFechosHora();
        desligarFechosHora = null;
    }

    if (estavaAberto && devolverFoco && campo) campo.focus();
}

// ── O seletor da data (o calendário) ────────────────────────────────────────
// O campo da data também não é um <input type="date">: o calendário que o
// browser abre por cima dele é branco e não se consegue vestir — quem o
// desenha é o browser, e não lhe chega CSS nenhum. É a mesma história do campo
// da hora: um botão no lugar do campo, e o calendário é nosso. O valor
// continua no #obs-data, agora escondido, para o inicializarSeletorHora e o
// atualizarObservatorioComHora o lerem e escreverem como faziam.
//
// Ao contrário do seletor da hora, que tem duas listas, aqui as casas dos dias
// são botões independentes e é o foco que diz onde se está: a grelha entra no
// Tab por uma só casa (a escolhida) e são as setas que andam de dia em dia.

let painelData = null;
let desligarFechosData = null;
// O mês que o calendário tem à vista. Não é o mesmo que o valor do campo:
// quem folheia até Dezembro sem escolher nada mexe nisto e não na data.
const mesDoSeletorData = { ano: 0, mes: 0 };

// A data do campo em "AAAA-MM-DD", ou "" se ainda não houver nenhuma. É o
// formato do <input type="date"> e o que o horaEDataNoLocal devolve.
function valorCampoData() {
    const input = document.getElementById("obs-data");
    return input && input.value ? input.value : "";
}

// Escreve a data no botão à portuguesa (05/10/2026). O valor guardado continua
// a ser o "AAAA-MM-DD", que é o que o resto do ficheiro espera; isto é só o
// que se lê.
function sincronizarCampoData() {
    const texto = document.getElementById("obs-data-texto");
    if (!texto) return;
    const valor = valorCampoData();
    texto.textContent = /^\d{4}-\d{2}-\d{2}$/.test(valor)
        ? valor.split("-").reverse().join("/")
        : valor;
}

// "AAAA-MM-DD" a partir de um Date local, feito à mão. O toISOString não serve
// aqui: passa por UTC, e à noite em Portugal o dia que ele dava já era o
// seguinte.
function dataParaISO(d) {
    return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
}

function construirSeletorData() {
    const painel = document.createElement("div");
    painel.className = "obs-data-picker";
    painel.id = "obs-data-picker";
    painel.setAttribute("role", "group");
    painel.setAttribute("aria-label", "Escolher a data");

    // O cabeçalho: ‹ Outubro 2026 ›
    const cabecalho = document.createElement("div");
    cabecalho.className = "obs-data-cabecalho";

    const anterior = document.createElement("button");
    anterior.type = "button";
    anterior.className = "obs-data-nav";
    anterior.textContent = "‹";
    anterior.title = "Mês anterior";
    anterior.setAttribute("aria-label", "Mês anterior");
    anterior.addEventListener("click", function () { mudarMesSeletorData(-1); });

    const titulo = document.createElement("div");
    titulo.className = "obs-data-titulo";
    titulo.id = "obs-data-titulo";
    // Muda com as setas: quem não vê a grelha ouve o mês novo.
    titulo.setAttribute("aria-live", "polite");

    const seguinte = document.createElement("button");
    seguinte.type = "button";
    seguinte.className = "obs-data-nav";
    seguinte.textContent = "›";
    seguinte.title = "Mês seguinte";
    seguinte.setAttribute("aria-label", "Mês seguinte");
    seguinte.addEventListener("click", function () { mudarMesSeletorData(1); });

    cabecalho.appendChild(anterior);
    cabecalho.appendChild(titulo);
    cabecalho.appendChild(seguinte);

    // A semana, na mesma ordem do calendário da aplicação: a começar na
    // segunda. As abreviaturas saem do DIAS_PT, que já é essa lista e está
    // nessa ordem — não vale a pena manter uma segunda lista só para isto.
    const semana = document.createElement("div");
    semana.className = "obs-data-semana";
    semana.setAttribute("aria-hidden", "true");
    DIAS_PT.forEach(function (nome) {
        const abreviado = document.createElement("span");
        abreviado.textContent = nome.slice(0, 3);
        semana.appendChild(abreviado);
    });

    // As casas dos dias. A grelha é sempre de 42 (seis semanas), mesmo nos
    // meses que só precisam de cinco: assim o painel não cresce e encolhe de
    // mês para mês, e a caixa fica sempre do mesmo tamanho. As setas ouvem-se
    // aqui, no contentor, e não em cada casa.
    const grelha = document.createElement("div");
    grelha.className = "obs-data-grelha";
    grelha.id = "obs-data-grelha";
    grelha.addEventListener("keydown", tratarTeclaGrelhaData);

    painel.appendChild(cabecalho);
    painel.appendChild(semana);
    painel.appendChild(grelha);

    // Fora do painel lateral, como o da hora: lá dentro ficava preso e cortado
    // a meio (ver a nota no posicionarPopup).
    document.body.appendChild(painel);
    return painel;
}

// Desenha o mês que está em mesDoSeletorData, com o dia escolhido e o de hoje
// marcados.
function desenharMesSeletorData() {
    const grelha = document.getElementById("obs-data-grelha");
    const titulo = document.getElementById("obs-data-titulo");
    if (!grelha || !titulo) return;

    const ano = mesDoSeletorData.ano;
    const mes = mesDoSeletorData.mes;
    titulo.textContent = MESES_PT[mes] + " " + ano;

    // Em que dia da semana cai o dia 1, contado a partir da segunda — o mesmo
    // cálculo do calendário da aplicação (o getDay devolve 0 no domingo).
    const primeiroDia = new Date(ano, mes - 1, 1).getDay();
    const deslocamento = primeiroDia === 0 ? 6 : primeiroDia - 1;
    const diasDoMes = new Date(ano, mes, 0).getDate();

    const hoje = horaEDataNoLocal().data;
    const escolhido = valorCampoData();

    grelha.innerHTML = "";

    for (let i = 0; i < 42; i++) {
        const dia = i - deslocamento + 1;

        // Antes do dia 1 e depois do último as casas ficam vazias: são a
        // margem da grelha, e não dias de outro mês. É o que o calendário da
        // aplicação já faz.
        if (dia < 1 || dia > diasDoMes) {
            const vazio = document.createElement("span");
            vazio.className = "obs-data-vazio";
            grelha.appendChild(vazio);
            continue;
        }

        const data = ano + "-" + String(mes).padStart(2, "0") + "-" + String(dia).padStart(2, "0");

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "obs-data-dia";
        botao.dataset.data = data;
        botao.textContent = dia;
        // Fora do alcance do Tab: a grelha tem uma só porta de entrada, que é
        // a casa marcada no fim desta função.
        botao.tabIndex = -1;
        botao.setAttribute("aria-label", dia + " de " + MESES_PT[mes] + " de " + ano);

        // Escolhido e hoje são estados diferentes e podem calhar no mesmo dia.
        // O aria-pressed é o que um leitor de ecrã anuncia ("premido") para
        // uma casa escolhida; o aria-current marca o dia de hoje.
        if (data === escolhido) {
            botao.classList.add("escolhido");
            botao.setAttribute("aria-pressed", "true");
        }
        if (data === hoje) {
            botao.classList.add("hoje");
            botao.setAttribute("aria-current", "date");
        }

        botao.addEventListener("click", function () { escolherData(data); });
        grelha.appendChild(botao);
    }

    // A casa por onde se entra na grelha: a escolhida, se estiver à vista;
    // senão a primeira do mês.
    const entrada = grelha.querySelector(".escolhido") || grelha.querySelector(".obs-data-dia");
    if (entrada) entrada.tabIndex = 0;
}

// Vira a página do calendário. O Date normaliza sozinho o que sai do
// intervalo: o mês 13 vira o Janeiro do ano seguinte, e o mês 0 o Dezembro do
// anterior.
function mudarMesSeletorData(delta) {
    const d = new Date(mesDoSeletorData.ano, mesDoSeletorData.mes - 1 + delta, 1);
    mesDoSeletorData.ano = d.getFullYear();
    mesDoSeletorData.mes = d.getMonth() + 1;
    desenharMesSeletorData();
    // A grelha é sempre da mesma altura, mas depois de virar o mês o painel
    // pode ter de se mexer para não sair do ecrã.
    posicionarPopup(painelData, document.getElementById("obs-data-campo"));
}

// Leva o foco ao dia do Date que chega, virando o mês se ele cair fora do que
// está à vista.
function irParaDiaSeletorData(destino) {
    const iso = dataParaISO(destino);

    if (destino.getFullYear() !== mesDoSeletorData.ano || destino.getMonth() + 1 !== mesDoSeletorData.mes) {
        mesDoSeletorData.ano = destino.getFullYear();
        mesDoSeletorData.mes = destino.getMonth() + 1;
        desenharMesSeletorData();
        posicionarPopup(painelData, document.getElementById("obs-data-campo"));
    }

    const novo = document.getElementById("obs-data-grelha").querySelector('[data-data="' + iso + '"]');
    if (!novo) return;

    // Fica só uma casa alcançável pelo Tab. O desenhar já pôs uma; esta é a
    // que passou a ter o foco.
    Array.from(document.querySelectorAll(".obs-data-dia")).forEach(function (b) { b.tabIndex = -1; });
    novo.tabIndex = 0;
    novo.focus();
}

// As setas andam de dia (esquerda/direita) e de semana (cima/baixo), o Home e
// o End vão às pontas da semana, e o PageUp/PageDown mudam de mês.
function tratarTeclaGrelhaData(e) {
    const alvo = e.target && e.target.classList && e.target.classList.contains("obs-data-dia") ? e.target : null;
    if (!alvo) return;

    const ano = Number(alvo.dataset.data.slice(0, 4));
    const mes = Number(alvo.dataset.data.slice(5, 7));
    const dia = Number(alvo.dataset.data.slice(8, 10));
    let destino = null;

    if (e.key === "ArrowLeft") destino = new Date(ano, mes - 1, dia - 1);
    else if (e.key === "ArrowRight") destino = new Date(ano, mes - 1, dia + 1);
    else if (e.key === "ArrowUp") destino = new Date(ano, mes - 1, dia - 7);
    else if (e.key === "ArrowDown") destino = new Date(ano, mes - 1, dia + 7);
    else if (e.key === "PageUp" || e.key === "PageDown") {
        // Um mês à frente ou atrás, mas no mesmo dia — e com o dia preso ao
        // fim do mês de destino quando ele não chega lá (31 de Março recua
        // para 28 ou 29 de Fevereiro, e não para 3 de Março).
        const indice = (mes - 1) + (e.key === "PageUp" ? -1 : 1);
        const ultimoDia = new Date(ano, indice + 1, 0).getDate();
        destino = new Date(ano, indice, Math.min(dia, ultimoDia));
    } else if (e.key === "Home" || e.key === "End") {
        // Às pontas da semana: a segunda e o domingo.
        const diaDaSemana = new Date(ano, mes - 1, dia).getDay();   // 0 = domingo
        const ateSegunda = diaDaSemana === 0 ? 6 : diaDaSemana - 1;
        destino = new Date(ano, mes - 1, dia + (e.key === "Home" ? -ateSegunda : 6 - ateSegunda));
    }

    if (!destino) return;
    e.preventDefault();
    irParaDiaSeletorData(destino);
}

function escolherData(data) {
    const input = document.getElementById("obs-data");
    if (!input || !data) return;

    input.value = data;
    sincronizarCampoData();

    // É daqui que o céu viaja até ao dia novo — o mesmo caminho do campo
    // nativo, que só tinha um onchange a chamar isto.
    atualizarObservatorioComHora();

    // Um clique escolhe o dia e o gesto está completo: não há aqui uma segunda
    // parte como os minutos da hora, por isso fecha-se logo e devolve-se o
    // foco ao campo.
    fecharSeletorData(true);
}

function alternarSeletorData() {
    if (painelData && painelData.classList.contains("aberto")) {
        fecharSeletorData(true);
        return;
    }
    abrirSeletorData();
}

function abrirSeletorData() {
    const campo = document.getElementById("obs-data-campo");
    if (!campo) return;

    if (!painelData) painelData = construirSeletorData();

    // Abre no mês da data escolhida. Com o campo vazio, no mês de hoje — e o
    // hoje que interessa é o do local escolhido na aplicação, que é o que o
    // horaEDataNoLocal dá, e não o do computador.
    const escolhido = valorCampoData();
    const referencia = /^\d{4}-\d{2}-\d{2}$/.test(escolhido) ? escolhido : horaEDataNoLocal().data;
    mesDoSeletorData.ano = Number(referencia.slice(0, 4));
    mesDoSeletorData.mes = Number(referencia.slice(5, 7));

    desenharMesSeletorData();

    // Visível primeiro: é preciso medir para o pôr no sítio certo.
    painelData.classList.add("aberto");
    posicionarPopup(painelData, campo);
    campo.setAttribute("aria-expanded", "true");
    desligarFechosData = ligarFechosDoPopup(painelData, campo, fecharSeletorData);

    const entrada = painelData.querySelector('.obs-data-dia[tabindex="0"]');
    if (entrada) entrada.focus();
}

// Idempotente, e pelas mesmas razões do seletor da hora: o devolverFoco separa
// o Esc e a escolha de um dia (que põem o foco de volta no campo) de um clique
// fora (que não o deve tirar a quem o pôs noutro sítio).
function fecharSeletorData(devolverFoco) {
    const estavaAberto = painelData && painelData.classList.contains("aberto");

    if (painelData) painelData.classList.remove("aberto");
    const campo = document.getElementById("obs-data-campo");
    if (campo) campo.setAttribute("aria-expanded", "false");

    if (desligarFechosData) {
        desligarFechosData();
        desligarFechosData = null;
    }

    if (estavaAberto && devolverFoco && campo) campo.focus();
}

// Fecha os dois seletores do bloco "Simular Data/Hora" de uma vez. Quem sai do
// Observatório ou fecha o painel lateral não tem de saber quais estavam
// abertos: os dois fechar são idempotentes, e o que já estava fechado não faz
// nada.
function fecharSeletoresTempo() {
    fecharSeletorHora(false);
    fecharSeletorData(false);
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

// ── Objetos de céu profundo: apresentação ─────────────────────────
// Tudo o que diz respeito a como um objeto de céu profundo se mostra no mapa
// vive aqui, junto: o limite de brilho da camada, o nome de cada tipo e o
// símbolo que lhe corresponde. O que vem do servidor é o tipo em cru
// ("nebulosa_planetaria") e o tamanho em minutos de arco; a decisão de os
// transformar num rótulo e numa forma é do browser.

// Limite de brilho da camada. É SEPARADO do slider "Brilho (Mag ≤)" das
// estrelas, e não é um capricho: a magnitude de uma galáxia está espalhada por
// uma área enorme e a de uma estrela está concentrada num ponto, por isso os
// dois números não são comparáveis e um limite só não serve para os dois.
//
// O 9 é o que os binóculos de 10×50 alcançam nestes objetos. Com 8 — que era a
// ideia inicial — ficavam de fora a Nebulosa do Anel (8,8) e a Nebulosa do
// Caranguejo (8,4), dois dos objetos mais conhecidos do céu, e um "ir para"
// a eles dizia que estavam abaixo do filtro de brilho, o que seria falso:
// estão acima do horizonte, são é fracos. Com este valor, nada do catálogo é
// alguma vez escondido por ele — fica como guarda para o dia em que cresça.
const MAG_LIMITE_CEU_PROFUNDO = 9;

// O tipo que vem do catálogo → o que se lê no painel e na lista da pesquisa.
// Cada tipo do ceu_profundo.py tem de ter a sua linha aqui; o fallback existe
// para um tipo novo no catálogo não sair como um retângulo vazio no painel.
const TIPOS_CEU_PROFUNDO = {
    "galaxia": "Galáxia",
    "nebulosa": "Nebulosa",
    "nebulosa_planetaria": "Nebulosa planetária",
    "resto_supernova": "Resto de supernova",
    "enxame_aberto": "Enxame aberto",
    "enxame_globular": "Enxame globular",
    "estrela_dupla": "Estrela dupla",
};

// O tamanho do símbolo a partir do tamanho real do objeto (o eixo maior, em
// minutos de arco). Dá uma NOÇÃO de escala, não é escala: na projeção 360° um
// grau são uns 5 a 10 px, conforme o zoom, e M31 tem quase 3° — o símbolo dela
// anda perto disso, mas os objetos pequenos são desenhados muito maiores do
// que são, senão a Nebulosa do Anel (1,4′) não passava de um pixel e não havia
// como lhe acertar com o rato. O tecto é para M31 e M45 não taparem Orion.
//
// Os números subiram uma vez, a pedido: com o mínimo em 4 o símbolo lia-se mal
// no mapa, sobretudo no planisfério, e confundia-se com uma estrela. Como o
// objectivo destes símbolos é exactamente o contrário — ver à primeira vista
// que ali há uma nebulosa e não um ponto —, vale mais pecar por grandes. O
// mínimo de 7 fica acima do maior ponto de estrela desenhado (4,5), e é isso
// que os separa à vista.
function raioSimboloCeuProfundo(dimensao) {
    return Math.max(7, Math.min(18, 7 + (dimensao || 0) / 16));
}

// O símbolo de um objeto de céu profundo, todo a traço — não há uma única
// imagem no projeto para nenhum deles, e não é preciso haver: cada tipo tem
// uma forma que se reconhece sem legenda.
// O contexto vem de fora já com a cor, a espessura e o brilho definidos; aqui
// só se escolhe a forma, e ele fica como estava.
function desenharSimboloCeuProfundo(ctx, x, y, raio, tipo) {
    ctx.save();

    switch (tipo) {
        case "galaxia":
            // Elipse muito achatada, como quase todas as galáxias se vêem.
            ctx.beginPath();
            ctx.ellipse(x, y, raio, raio * 0.55, -0.5, 0, 2 * Math.PI);
            ctx.stroke();
            break;

        case "enxame_globular":
            // Círculo com uma cruz lá dentro: uma bola de estrelas comprimida
            // no meio, que é o que distingue um globular de um enxame aberto.
            ctx.beginPath();
            ctx.arc(x, y, raio, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x - raio, y); ctx.lineTo(x + raio, y);
            ctx.moveTo(x, y - raio); ctx.lineTo(x, y + raio);
            ctx.stroke();
            break;

        case "nebulosa":
            // Quadrado tracejado: uma nuvem, que não tem forma que se lhe pegue.
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.rect(x - raio, y - raio, raio * 2, raio * 2);
            ctx.stroke();
            break;

        case "nebulosa_planetaria":
            // Anel de gás com a estrela que o expulsou ainda no centro — que é
            // literalmente o que uma nebulosa planetária é.
            ctx.beginPath();
            ctx.arc(x, y, raio, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, Math.max(1.2, raio * 0.2), 0, 2 * Math.PI);
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fill();
            break;

        default:
            // Enxames abertos, e também os restos de supernova e as estrelas
            // duplas: um círculo tracejado, que é o desenho de um punhado de
            // estrelas espalhadas sem forma própria. Qualquer tipo novo que
            // apareça no catálogo cai aqui em vez de não desenhar nada.
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(x, y, raio, 0, 2 * Math.PI);
            ctx.stroke();
            break;
    }

    ctx.restore();
}

// ── Ver abaixo do horizonte ───────────────────────────────────────
// O que escondia o céu debaixo dos pés NÃO era o chão. É o "if (!visivel)"
// que existe em cada camada, e que salta o objeto antes sequer de o tentar
// desenhar (estrelas, céu profundo, astros, linhas de constelações). O chão
// só tapava o sítio onde ele havia de aparecer — por isso torná-lo
// transparente, sem mexer nesses testes, mostrava um céu vazio.
//
// Com a opção ligada: o chão deixa de ser PINTADO (a linha do horizonte fica,
// para não se perder a orientação) e os objetos de baixo são desenhados, mais
// apagados do que os de cima — para continuar a ver-se que não estão
// observáveis neste instante.
//
// Lê-se a caixa a cada pergunta, em vez de guardar o estado numa variável:
// assim não há dois estados a poderem divergir (a caixa e a variável). A
// regra de só valer na vista 360° vive aqui, e não em cada sítio que
// pergunta, senão o desenho e a pesquisa podiam discordar um do outro.
function verAbaixoDoHorizonte() {
    const caixa = document.getElementById("chk-ver-abaixo");
    if (!caixa || !caixa.checked) return false;

    // No Planisfério (2D) a opção não se aplica: ali a projeção é
    // r = raioMax × (90 − altitude) / 90, por isso logo abaixo do horizonte o
    // raio passa do raioMax e os objetos caem FORA do círculo, no rebordo do
    // canvas. Não é uma escolha de desenho, é a geometria do planisfério —
    // não há lá sítio para eles. O chão, esse, só existe na vista 360°.
    const modoSelect = document.getElementById("sel-modo-visao");
    return !modoSelect || modoSelect.value === "360";
}

// ── Céu sob os pés ────────────────────────────────────────────────
// Isto é a CÂMARA, não o desenho: a caixa lá em cima decide o que existe para
// ser desenhado, este botão decide para onde se está a olhar. São duas coisas
// diferentes, e é por isso que são dois controlos — mas andam juntos, porque
// nenhum deles serve de nada sem o outro.
//
// Ele existe porque a caixa sozinha não chegava. A sensibilidade do arrasto
// sai da largura do ecrã (ver moverArrasto), por isso descer dos +15° do
// início até ao céu escondido são mais de mil pixels de rato arrastado para
// baixo — um ecrã inteiro, e outro tanto para voltar a subir. Com um botão,
// vai-se e volta-se num clique.
function alternarCeusSobOsPes() {
    // No Planisfério não há céu de baixo nenhum: ali a projeção é
    // r = raioMax × (90 − altitude) / 90 e o que está abaixo do horizonte cai
    // fora do círculo. O botão nasce desativado nesse modo (ver
    // alterarModoVisao) e este teste é a segunda rede — um botão desativado
    // ainda pode ser chamado a partir da consola.
    const modoSelect = document.getElementById("sel-modo-visao");
    if (!modoSelect || modoSelect.value !== "360") return;

    // Já se está lá em baixo: o que falta é voltar.
    if (cameraAltitude < ALT_DE_ESTAR_ABAIXO) {
        animarCameraPara(cameraAzimuth, CAMERA_ALT_INICIAL);
        return;
    }

    // A caixa é ligada aqui, e não se espera que o utilizador a tenha ligado
    // antes: descer a câmara com a caixa desligada era mergulhar dentro de um
    // chão opaco. O botão parecia avariado e não estava.
    const caixa = document.getElementById("chk-ver-abaixo");
    if (caixa) caixa.checked = true;

    animarCameraPara(cameraAzimuth, altitudeDoCeuEscondido());
}

// Para onde a câmara desce no "Céu sob os pés": o polo celeste que está
// escondido. Quem está a norte nunca chega a ver o polo sul, e a latitude é
// exatamente o quanto esse polo fica abaixo do horizonte (os -41,1° de Gaia);
// a sul é a mesma coisa com o polo norte ao contrário. Nos dois casos o polo
// escondido está a -|latitude|, e é ele o meio da metade do céu que não se vê
// — é para lá que apontam as constelações que a caixa destapa.
//
// Não é o nadir (os -90°, o ponto mesmo debaixo dos pés). O nadir é só o
// ponto geométrico oposto ao zénite, e apontar-lhe deixa quase todo o céu
// escondido de fora, por cima do ecrã. O polo escondido é que é o meio da
// metade do céu que não se vê, e é lá que se quer estar.
function altitudeDoCeuEscondido() {
    const latitude = observatorioDados ? observatorioDados.latitude : null;

    // Sem latitude — céu ainda por carregar — não se sabe onde é que o céu
    // esconde mais. Desce-se o mínimo, que é o que se pode prometer sem saber
    // onde se está.
    if (typeof latitude !== "number") return -MERGULHO_MINIMO;

    // No equador os dois polos estão em cima do horizonte e a conta dá zero: o
    // botão não descia nada. O mínimo garante que há sempre céu escondido no
    // ecrã, que é o serviço que ele promete.
    return Math.min(-Math.abs(latitude), -MERGULHO_MINIMO);
}

// O rótulo diz o que o botão vai fazer AGORA, e não o que faz sempre: quem já
// está lá em baixo não quer descer outra vez, quer voltar. É chamado a cada
// desenho — e não só no fim da viagem — porque a câmara também se pode pôr lá
// em baixo à mão, a arrastar, sem passar pelo botão. A comparação antes de
// escrever é o que torna isto barato: sem ela seria uma escrita no DOM por
// cada frame de arrasto.
function atualizarBotaoCeusSobOsPes() {
    const botao = document.getElementById("btn-ceu-sob-pes");
    if (!botao) return;

    const abaixo = cameraAltitude < ALT_DE_ESTAR_ABAIXO;
    const rotulo = abaixo ? "↥ Voltar ao céu de cima" : "⤓ Céu sob os pés";
    if (botao.textContent !== rotulo) botao.textContent = rotulo;
}

// A opacidade com que se desenha o que está debaixo do horizonte. Não é 0
// (não se veria nada, e é para ver que a opção existe) nem 1 (não se
// distinguiria do que está acima, que é a informação que se perde ao tirar o
// chão). Com o céu de baixo a ser visto de propósito — e não só de esguelha,
// como era antes de haver o "Céu sob os pés" — o 0,45 deixava as estrelas a
// perder-se no fundo escuro: a 0,6 ainda se lê como "não está observável" e
// já se vê aquilo para que se desceu.
const ALFA_ABAIXO = 0.6;

// ── Renderização do Observatório ──────────────────────────────────
function desenharObservatorio() {
    // Antes do teste do canvas: o rótulo do botão depende só de onde a câmara
    // está, e não de haver céu para desenhar. Assim fica certo mesmo que o
    // desenho saia já a seguir.
    atualizarBotaoCeusSobOsPes();

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

    // Lido uma vez por desenho, e não a cada objeto: são ~98 estrelas, 36
    // objetos de céu profundo e 73 linhas de constelação, e cada pergunta
    // à caixa é um getElementById. O valor não muda a meio de um frame.
    const verAbaixo = verAbaixoDoHorizonte();

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

    // Onde é que o segmento entre duas estrelas cruza o horizonte, já projetado.
    // Serve para acabar a linha no horizonte em vez de a deixar seguir por cima
    // do chão: a metade que continua para debaixo do horizonte é céu que já não
    // se vê. O cruzamento sai exato porque o seno da altitude varia linearmente
    // ao longo da corda que une as duas estrelas na esfera, e normalizar essa
    // corda não muda onde o seno se anula — o t que o anula é a altitude 0.
    // Devolve null quando as duas pontas estão do mesmo lado do horizonte (não
    // há nada para cortar) ou quando o cruzamento cai atrás da câmara.
    function cruzarHorizonte(estA, estB) {
        const rad = Math.PI / 180;
        const sinA = Math.sin(estA.altitude * rad);
        const sinB = Math.sin(estB.altitude * rad);
        // Mesmo teste do "visivel" do backend (altitude > 0): se as duas
        // concordam, a linha não atravessa o horizonte.
        if ((sinA > 0) === (sinB > 0)) return null;

        const t = sinA / (sinA - sinB);
        const altA = estA.altitude * rad, azA = estA.azimute * rad;
        const altB = estB.altitude * rad, azB = estB.azimute * rad;
        const x = (1 - t) * Math.cos(altA) * Math.cos(azA) + t * Math.cos(altB) * Math.cos(azB);
        const y = (1 - t) * Math.cos(altA) * Math.sin(azA) + t * Math.cos(altB) * Math.sin(azB);
        const az = ((Math.atan2(y, x) / rad) + 360) % 360;
        return projectar(0, az);
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
            // Com "Ver abaixo do horizonte" ligado, este preenchimento não é
            // pintado: é ele que tapa precisamente a metade do céu que se quer
            // ver. A linha do horizonte e a névoa, mais abaixo, ficam as duas —
            // sem elas perder-se-ia a noção de onde o céu acaba, que é a única
            // coisa que o chão dizia e que continua a fazer falta.
            if (!verAbaixo) {
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
            }

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

    // A caixa dos objetos de céu profundo pode ainda não existir: o HTML é um
    // template Jinja e o Flask guarda-o em cache, por isso uma página servida
    // antes de o servidor ser reiniciado não a tem. Nesse caso a camada fica
    // ligada, que é como ela nasce — e o céu sai inteiro em vez de rebentar
    // com um getElementById a devolver null.
    const caixaCeuProfundo = document.getElementById("chk-ceu-profundo");
    const showCeuProfundo = caixaCeuProfundo ? caixaCeuProfundo.checked : true;

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
            // As linhas que ficam inteiramente abaixo do horizonte são
            // guardadas para um segundo traço, mais apagado, no fim — e só
            // quando a opção está ligada. Guardá-las em vez de as traçar já é
            // o que permite manter UM traço por constelação no caso normal:
            // cada stroke() com brilho neon obriga o browser a criar uma
            // camada e a compô-la, e foi por isso que as 73 linhas passaram a
            // 15. Com a opção ligada são 15, mais as constelações que tiverem
            // linhas debaixo do chão.
            const linhasAbaixo = [];
            constelacao.linhas.forEach(linha => {
                const estA = estrelas[linha[0]];
                const estB = estrelas[linha[1]];
                if (!estA || !estB) return;

                // Basta uma das pontas estar acima: uma linha entre uma estrela
                // que se vê e outra que já se pôs continua a ser uma linha do
                // céu que se vê, e é a metade de cima que interessa.
                const algumaAcima = estA.visivel || estB.visivel;
                if (!algumaAcima && !verAbaixo) return;

                const posA = projectarEstrela(linha[0]);
                const posB = projectarEstrela(linha[1]);
                if (!posA || !posB) return;

                if (algumaAcima) {
                    // Com o chão pintado (isto é, sem "Ver abaixo do horizonte")
                    // a linha acaba onde cruza o horizonte: a ponta que já se
                    // pôs é substituída por esse cruzamento, em vez de a linha
                    // seguir por cima do chão. Com a opção ligada, o que está
                    // debaixo do horizonte é para ver e a linha fica inteira.
                    const corte = verAbaixo ? null : cruzarHorizonte(estA, estB);
                    const inicio = (corte && !estA.visivel) ? corte : posA;
                    const fim = (corte && !estB.visivel) ? corte : posB;
                    ctx.moveTo(inicio.x, inicio.y);
                    ctx.lineTo(fim.x, fim.y);
                } else {
                    linhasAbaixo.push([posA, posB]);
                }
            });
            ctx.stroke();

            if (linhasAbaixo.length > 0) {
                ctx.globalAlpha = ALFA_ABAIXO;
                ctx.beginPath();
                linhasAbaixo.forEach(([a, b]) => {
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                });
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // Calcular centróide da constelação (usado para nomes e cliques)
            let sumX = 0, sumY = 0, count = 0;
            const estrelasUnicas = new Set();
            constelacao.linhas.forEach(linha => {
                estrelasUnicas.add(linha[0]);
                estrelasUnicas.add(linha[1]);
                const estA = estrelas[linha[0]];
                if (estA && (estA.visivel || verAbaixo)) {
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

    // 2.5 Desenhar os objetos de céu profundo
    // Esta passagem vem DEPOIS das constelações e ANTES das estrelas, e a
    // ordem não é decorativa: o teste de clique percorre os elementos no ecrã
    // pela ordem em que foram registados e fica com o primeiro que apanha, por
    // isso uma estrela ganha o clique a um objeto de céu profundo que lhe
    // esteja por cima. É o que se quer em M45, onde o símbolo do enxame envolve
    // as Plêiades mas quem manda clicar ali é a estrela — exatamente a mesma
    // razão por que uma constelação já perde para uma estrela.
    const ceuProfundo = observatorioDados.ceu_profundo;

    if (showCeuProfundo && ceuProfundo) {
        // A cor, a espessura e o brilho são iguais para todos os símbolos,
        // por isso definem-se uma vez em vez de uma vez por objeto. O dourado
        // distingue-os das linhas azuis das constelações e dos pontos brancos
        // das estrelas: ao olhar para o mapa, é a cor que diz "isto não é uma
        // estrela". O brilho neon é o mesmo das constelações, mas mais curto —
        // são uns 20 símbolos por frame, e não 15 linhas.
        ctx.strokeStyle = "rgba(255, 214, 140, 0.85)";
        ctx.lineWidth = 1.6;
        ctx.setLineDash([]);
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(255, 200, 110, 0.9)";

        // A fonte e o alinhamento dos rótulos são iguais para todos, por isso
        // ficam aqui fora: ctx.font obriga o browser a analisar a string outra
        // vez de cada vez que lhe é atribuída (o mesmo motivo do ciclo das
        // estrelas). A cor do texto, essa, tem de ser reposta dentro do ciclo —
        // o ponto ao centro da nebulosa planetária pinta-se com o fillStyle.
        ctx.font = "9px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        for (const dso_id in ceuProfundo) {
            const dso = ceuProfundo[dso_id];
            if (!dso.visivel && !verAbaixo) continue;
            if (dso.mag > MAG_LIMITE_CEU_PROFUNDO) continue;

            const pos = projectar(dso.altitude, dso.azimute);
            if (!pos) continue; // fora do campo de visão, na projeção 360°

            const raio = raioSimboloCeuProfundo(dso.dimensao);

            // Debaixo do horizonte desenha-se apagado (ver ALFA_ABAIXO). O
            // desenharSimboloCeuProfundo faz o seu próprio save/restore e não
            // lhe toca, por isso a opacidade atravessa-o e é preciso repô-la
            // depois — este ctx é o mesmo para o resto do desenho.
            ctx.globalAlpha = dso.visivel ? 1 : ALFA_ABAIXO;

            desenharSimboloCeuProfundo(ctx, pos.x, pos.y, raio, dso.tipo);

            // O rótulo é a parte curta do nome — "M42" em vez de "M42
            // (Nebulosa de Orion)". O nome completo não caberia no mapa sem o
            // encher de texto, e quem o quiser clica e lê-o no painel.
            ctx.fillStyle = "rgba(255, 224, 170, 0.55)";
            ctx.fillText(" " + dso.nome.split(" (")[0], pos.x + raio + 2, pos.y);

            ctx.globalAlpha = 1;

            // Registar elemento para cliques. O raio é maior do que o símbolo:
            // o desenho é a traço e com um buraco no meio, e quem clica acerta
            // com o que vê — o alvo tem de ser a forma toda, não a risca.
            elementosNoEcra.push({
                id: dso_id,
                nome: dso.nome,
                x: pos.x,
                y: pos.y,
                raio: Math.max(10, raio + 3),
                tipo: "ceu_profundo",
                dso_tipo: dso.tipo,
                constelacao: dso.constelacao,
                dimensao: dso.dimensao,
                nota: dso.nota,
                mag: dso.mag.toFixed(1),
                altitude: dso.altitude,
                azimute: dso.azimute
            });
        }

        ctx.shadowBlur = 0;
        ctx.setLineDash([]);
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
        if (!est.visivel && !verAbaixo) continue;
        if (est.mag > magLimite) continue;

        // Já pode estar calculada, se a estrela pertencer a uma constelação
        const pos = projectarEstrela(est_id);
        if (!pos) continue; // ignora se estiver fora da perspetiva 3D

        // As estrelas debaixo do chão desenham-se apagadas (ver ALFA_ABAIXO).
        // Numa estrela o campo "visivel" vem sempre preenchido, por isso aqui
        // o teste é direto e não precisa de olhar para o modo.
        ctx.globalAlpha = est.visivel ? 1 : ALFA_ABAIXO;

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

        ctx.globalAlpha = 1;   // repor antes de passar à estrela seguinte

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
            if (!astro.visivel && !verAbaixo) return;

            const pos = projectar(astro.altitude, astro.azimute);
            if (!pos) return; // ignora se estiver fora do FOV 3D

            const imgAstro = imagemAstro(astro.nome);
            const size = tamanhoAstro(astro.nome);

            // Debaixo do horizonte o astro desenha-se apagado (ver ALFA_ABAIXO).
            // Fica posto antes dos ramos das imagens: o ramo do recorte circular
            // faz save/restore, e o restore devolve este mesmo valor — o save
            // guarda-o e o restore repõe-no, não o deita fora.
            ctx.globalAlpha = astro.visivel ? 1 : ALFA_ABAIXO;

            if (imgAstro) {
                if (astro.nome === "Saturno") {
                    // Saturno possui anéis transparentes em PNG — desenhar diretamente sem recorte circular
                    const drawW = size * 2.2;
                    const drawH = size * 2.2;
                    ctx.drawImage(imgAstro, pos.x - drawW / 2, pos.y - drawH / 2, drawW, drawH);
                } else if (astro.nome === "ISS") {
                    // A ISS leva o mesmo tratamento do Saturno, e pela mesma razão:
                    // é um objeto LARGO. O recorte circular dos planetas pressupõe uma
                    // imagem quadrada com o astro ao centro, e este não é o caso — a
                    // fotografia da estação é 3:2, com os painéis solares a estenderem-se
                    // para os lados. Ao desenhá-la no quadrado do recorte, ela saía
                    // espremida 33% na horizontal; e o círculo, que mostra só os 80%
                    // centrais da imagem, cortava as pontas dos painéis. Aqui a imagem
                    // é desenhada inteira, num retângulo com a proporção dela — 3 de
                    // largura por 2 de altura. Mexer no "size" da lista lá em cima é o
                    // que a faz maior ou mais pequena.
                    const drawW = size * 3;
                    const drawH = drawW / 1.5;
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

            ctx.globalAlpha = 1;   // repor antes de passar ao astro seguinte

            // Fase da Lua em Emoji (só no painel de detalhes, não no canvas)

            elementosNoEcra.push({
                id: astro.id,
                nome: astro.nome,
                x: pos.x,
                y: pos.y,
                // O raio é a área onde o clique apanha o objeto — e é também o
                // que o destaque tracejado usa (raio + 4, mais abaixo). Nos astros
                // de imagem redonda é o raio do disco desenhado; na ISS, que é
                // desenhada larga e baixa, tem de cobrir a LARGURA toda. Com o
                // size + 4 dos planetas, clicar nas pontas dos painéis solares
                // não pegava — e são elas que ocupam quase toda a imagem.
                raio: imgAstro ? (astro.nome === "ISS" ? size * 1.5 : size + 4) : 12,
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
        esconderImagemConstelacao();
        painel.innerHTML = `
            <div class="detalhe-titulo">ℹ️ Detalhes</div>
            <p style="color:#778899;font-size:0.85rem;margin-top:12px;text-align:center;line-height:1.4;">Clique num astro, estrela, constelação ou objeto de céu profundo no mapa celeste para ver os seus detalhes astronómicos.</p>
        `;
        desenharObservatorio();
    }
}

// ── Favoritos — o ★ do painel de detalhes ────────────────────────────────────
// O único sítio da aplicação onde se marca um favorito é aqui, no painel de
// detalhes do Observatório. É de propósito: os favoritos são do catálogo (as
// constelações, as estrelas, os objetos de céu profundo) e é no céu que se
// escolhe o que interessa. A página do perfil lê-os a seguir, e é lá que se
// tiram.
//
// O estado destes favoritos vive num Set de chaves "tipo:id" — o mesmo par que
// a base de dados usa como chave (UNIQUE (utilizador_id, tipo, objeto_id)) — e
// é lido uma só vez, quando o Observatório se abre. O painel redesenha-se a
// cada objeto escolhido, e é do Set que sai o estado de cada ★: perguntar ao
// servidor a cada clique punha uma ida e volta à rede entre o clique e o botão.

const favoritosGuardados = new Set();
let favoritosPedidos = false;   // o pedido ao servidor já foi feito?

function chaveFavorito(tipo, objetoId) {
    return tipo + ":" + objetoId;
}

// Que objetos podem ser favoritos, e com que id. Os ids são os do catálogo
// (o "Ori" de Orion, o "m42" da nebulosa) e são os mesmos que o servidor
// guarda; os astros — Sol, Lua, planetas, ISS — não entram: não estão no
// catálogo e mudam de sítio, e um favorito é uma coisa que se volta a ver.
function idsFavoritaveis(item) {
    if (item.tipo === "constelacao") return { tipo: "constelacao", id: item.const_id };
    if (item.tipo === "ceu_profundo") return { tipo: "ceu_profundo", id: item.id };
    if (item.tipo === "estrela") return { tipo: "estrela", id: item.id };
    return null;
}

// O que o botão diz, conforme o objeto esteja ou não guardado. Vive numa
// função porque é dito em dois sítios: no HTML do painel (blocoFavorito) e no
// botão já desenhado, quando o estado muda sem o painel ser refeito.
function textoBotaoFavorito(guardado) {
    return guardado ? "★ Na tua conta" : "☆ Guardar nos favoritos";
}

// O bloco do ★, para o HTML do painel. Devolve "" para tudo o que não pode ser
// favorito — é o que deixa o Sol, a Lua e os planetas sem botão.
function blocoFavorito(item) {
    const alvo = idsFavoritaveis(item);
    if (!alvo || !alvo.id) return "";

    const guardado = favoritosGuardados.has(chaveFavorito(alvo.tipo, alvo.id));
    // O tipo e o id vão em data-*, e não dentro do onclick: assim o JavaScript
    // lê-os do próprio botão, e nada do que vem do catálogo chega a ser lido
    // como código.
    return `
        <div class="obs-favorito">
            <button type="button" class="obs-btn-favorito${guardado ? " guardado" : ""}"
                    data-tipo="${alvo.tipo}" data-objeto="${alvo.id}"
                    onclick="alternarFavorito(this)"
                    title="${guardado ? "Tirar da tua conta" : "Guardar na tua conta"}">${textoBotaoFavorito(guardado)}</button>
            <div class="obs-favorito-aviso" role="status" aria-live="polite"></div>
        </div>
    `;
}

// Escreve o estado no botão que já está no painel.
function desenharBotaoFavorito(botao) {
    const guardado = favoritosGuardados.has(chaveFavorito(botao.dataset.tipo, botao.dataset.objeto));
    botao.classList.toggle("guardado", guardado);
    botao.textContent = textoBotaoFavorito(guardado);
    botao.title = guardado ? "Tirar da tua conta" : "Guardar na tua conta";
}

function avisarFavorito(mensagem) {
    const caixa = document.querySelector("#observatorio-detalhes .obs-favorito-aviso");
    if (caixa) caixa.textContent = mensagem;
}

// Marca ou desmarca. O mesmo clique serve para as duas coisas porque é isso
// que o ★ quer dizer: o botão mostra o estado, e carregar nele inverte-o.
window.alternarFavorito = async function alternarFavorito(botao) {
    const tipo     = botao.dataset.tipo;
    const objetoId = botao.dataset.objeto;
    const chave    = chaveFavorito(tipo, objetoId);
    const jaEstava = favoritosGuardados.has(chave);

    botao.disabled = true;
    avisarFavorito("");

    const resposta = await fetch("/api/favoritos", {
        method: jaEstava ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: tipo, objeto_id: objetoId }),
    }).catch(function () { return null; });
    botao.disabled = false;

    if (!resposta) {
        avisarFavorito("Não foi possível contactar o servidor.");
        return;
    }

    // Sem sessão não há favoritos para ninguém. Em vez de uma mensagem de
    // erro, manda-se a pessoa entrar e volta-se ao Observatório: o ?seguinte=
    // é o que a página de entrada usa para a trazer de volta (ver auth.js), e
    // é fixo, "/observatorio", porque é essa a página que abre já neste ecrã
    // (o index.js vê o endereço para saber em que aba começar) — voltar ao
    // /app deixava a pessoa no Céu Agora, a olhar para outro sítio.
    if (resposta.status === 401) {
        window.location.href = "/entrar?seguinte=/observatorio";
        return;
    }
    if (!resposta.ok) {
        avisarFavorito("Não foi possível guardar. Tenta outra vez.");
        return;
    }

    // O servidor respondeu: o estado local passa a ser este. Vale a pena mexer
    // no Set em vez de voltar a pedir a lista toda — a resposta já diz o que
    // ficou, e a lista é a mesma com uma linha a mais ou a menos.
    if (jaEstava) favoritosGuardados.delete(chave);
    else favoritosGuardados.add(chave);
    desenharBotaoFavorito(botao);
};

// Lê a lista uma vez. Chamada quando o Observatório se abre (ver o fim deste
// ficheiro), e não no arranque da página: fora do Observatório não há nenhum ★
// para preencher, e não vale a pena pedir a lista a quem está no Calendário.
async function carregarFavoritos() {
    if (favoritosPedidos) return;   // já se perguntou uma vez
    favoritosPedidos = true;

    let resposta;
    try {
        resposta = await fetch("/api/favoritos");
    } catch (erro) {
        // Sem resposta ficam todos com "☆", e não se insiste: um clique
        // continua a funcionar (o servidor responde com o estado certo e o
        // botão corrige-se), e a próxima vez que a página abrir volta a
        // perguntar. A lista de favoritos não é coisa para rebentar o ecrã.
        return;
    }

    const dados = await resposta.json().catch(function () { return {}; });
    favoritosGuardados.clear();
    (dados.favoritos || []).forEach(function (f) {
        favoritosGuardados.add(chaveFavorito(f.tipo, f.objeto_id));
    });

    // O painel pode já estar aberto num objeto: foi escrito antes de a
    // resposta chegar e o ★ dele estaria a dizer o que ainda não se sabia.
    const botao = document.querySelector("#observatorio-detalhes .obs-btn-favorito");
    if (botao) desenharBotaoFavorito(botao);
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
        painel.innerHTML = `
            <div class="detalhe-titulo">⭐ ${item.nome}</div>
            ${avisoHTML}
            ${blocoFavorito(item)}
            <div class="detalhe-linha"><span class="detalhe-icon">🏷️</span><span class="detalhe-label">Tipo</span><span class="detalhe-valor" style="color:#6eb8ff">CONSTELAÇÃO</span></div>
            <div class="detalhe-linha"><span class="detalhe-icon">🔤</span><span class="detalhe-label">Abreviatura</span><span class="detalhe-valor" style="font-family:monospace;color:#ce93d8">${item.const_id}</span></div>
            <div class="detalhe-linha"><span class="detalhe-icon">✨</span><span class="detalhe-label">Estrelas</span><span class="detalhe-valor" style="font-family:monospace">${item.numEstrelas}</span></div>
            <div style="margin-top:14px;padding:10px 12px;background:rgba(110,184,255,0.07);border-left:3px solid rgba(110,184,255,0.4);border-radius:6px;">
                <div style="font-size:0.75rem;color:#6eb8ff;margin-bottom:6px;font-weight:600;">💡 Curiosidade</div>
                <p style="color:rgba(220,227,240,0.85);font-size:0.82rem;line-height:1.5;margin:0;">${curiosidade}</p>
            </div>
        `;
        // Mostrar imagem ao lado do canvas (painel flutuante)
        mostrarImagemConstelacao(item.const_id, item.nome);
    } else if (item.tipo === "iss") {
        // ── Detalhes da Estação Espacial ──
        // Quem desenha o painel vai buscar a posição ao céu em
        // observatorioDados, não à cópia que aqui chegou, que fica
        // desatualizada mal a hora mude.
        mostrarDetalhesISS();
    } else if (item.tipo === "ceu_profundo") {
        // ── Detalhes de um Objeto de Céu Profundo ──
        const tipo = TIPOS_CEU_PROFUNDO[item.dso_tipo] || "Objeto de céu profundo";

        // O tamanho vem em minutos de arco, que é como os catálogos o dão.
        // Acima de um grau passa a graus, senão M31 lia-se "178′", que não diz
        // nada a quem não trabalhe com minutos de arco — e é o maior objeto
        // desta lista, logo o que mais se olha.
        const tamanho = item.dimensao >= 60
            ? `${(item.dimensao / 60).toFixed(1)}°`
            : `${item.dimensao}′`;

        esconderImagemConstelacao();
        painel.innerHTML = `
            <div class="detalhe-titulo">🌌 ${item.nome}</div>
            ${avisoHTML}
            ${blocoFavorito(item)}
            <div class="detalhe-linha"><span class="detalhe-icon">🏷️</span><span class="detalhe-label">Tipo</span><span class="detalhe-valor" style="color:#ffd54f">${tipo.toUpperCase()}</span></div>
            <div class="detalhe-linha"><span class="detalhe-icon">🔆</span><span class="detalhe-label">Magnitude</span><span class="detalhe-valor" style="font-family:monospace">${item.mag} <span style="color:#778899;font-size:0.75rem;">integrada</span></span></div>
            <div class="detalhe-linha"><span class="detalhe-icon">📐</span><span class="detalhe-label">Tamanho</span><span class="detalhe-valor" style="font-family:monospace">${tamanho}</span></div>
            <div class="detalhe-linha"><span class="detalhe-icon">✨</span><span class="detalhe-label">Constelação</span><span class="detalhe-valor" style="color:#9ed4ff">${item.constelacao}</span></div>
            <div class="detalhe-linha"><span class="detalhe-icon">📈</span><span class="detalhe-label">Altitude</span><span class="detalhe-valor" style="font-family:monospace;color:#ffcc80">${item.altitude}°</span></div>
            <div class="detalhe-linha"><span class="detalhe-icon">🧭</span><span class="detalhe-label">Azimute</span><span class="detalhe-valor" style="font-family:monospace;color:#ff8a65">${item.azimute}° (${obterRosaDosVentos(item.azimute)})</span></div>
            <div class="dso-nota" style="margin-top:14px;padding:10px 12px;background:rgba(255,213,79,0.07);border-left:3px solid rgba(255,213,79,0.4);border-radius:6px;">
                <div style="font-size:0.75rem;color:#ffd54f;margin-bottom:6px;font-weight:600;">💡 Sobre este objeto</div>
                <p style="color:rgba(220,227,240,0.85);font-size:0.82rem;line-height:1.5;margin:0;">${item.nota}</p>
            </div>
        `;
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

        if (item.tipo === "planeta" || item.tipo === "sol" || item.tipo === "lua") {
            mostrarImagemAstro(item);
        } else {
            esconderImagemConstelacao();
        }
        const corTipo = item.tipo === "sol" ? "#ff8f00" : (item.tipo === "lua" ? "#b0bec5" : (item.tipo === "estrela" ? "#4fc3f7" : "#ffd54f"));
        const labelTipo = item.tipo.toUpperCase();

        painel.innerHTML = `
            <div class="detalhe-titulo">🔭 ${item.nome}</div>
            ${avisoHTML}
            ${blocoFavorito(item)}
            <div class="detalhe-linha"><span class="detalhe-icon">🏷️</span><span class="detalhe-label">Tipo</span><span class="detalhe-valor" style="color:${corTipo}">${labelTipo}</span></div>
            <div class="detalhe-linha"><span class="detalhe-icon">🔆</span><span class="detalhe-label">Magnitude</span><span class="detalhe-valor" style="font-family:monospace">${item.mag}</span></div>
            <div class="detalhe-linha"><span class="detalhe-icon">📈</span><span class="detalhe-label">Altitude</span><span class="detalhe-valor" style="font-family:monospace;color:#ffcc80">${item.altitude}°</span></div>
            <div class="detalhe-linha"><span class="detalhe-icon">🧭</span><span class="detalhe-label">Azimute</span><span class="detalhe-valor" style="font-family:monospace;color:#ff8a65">${item.azimute}° (${obterRosaDosVentos(item.azimute)})</span></div>
            ${extrasHTML}
        `;
    }
}


// ── Painel Flutuante de Imagem ("ao lado") ──────────────────────────────────
// Abre a ilustração da constelação ou o retrato do planeta / Sol / Lua / ISS
// ao lado do mapa celeste quando o utilizador clica num desses objetos.
// Fecha automaticamente ao clicar noutro astro (ex: estrela isolada) ou espaço vazio.

const IMAGENS_ASTROS_CARTOES = {
    "sol": "/static/images/astros/sol.png",
    "lua": "/static/images/astros/lua.png",
    "mercurio": "/static/images/astros/mercurio.png",
    "venus": "/static/images/astros/venus.png",
    "marte": "/static/images/astros/marte.png",
    "jupiter": "/static/images/astros/jupiter.png",
    "saturno": "/static/images/astros/saturno.png",
    "urano": "/static/images/astros/urano.png",
    "neptuno": "/static/images/astros/neptuno.png",
    "iss": "/static/images/astros/iss.png"
};

function normalizarIdAstro(idOuNome) {
    if (!idOuNome) return "";
    return idOuNome.toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/\s+/g, "");
}

function mostrarImagemAstro(item) {
    if (!item) return;
    const painel = document.getElementById("painel-constelacao-lateral");
    const imgElem = document.getElementById("img-constelacao-lateral");
    const nomeElem = document.getElementById("painel-constelacao-nome");
    const badgeElem = document.getElementById("painel-constelacao-badge");
    if (!painel) return;

    const idNorm = normalizarIdAstro(item.id || item.nome);
    let badgeText = "✦ PLANETA DO SISTEMA SOLAR";
    let nomeFormatado = item.nome || idNorm;

    if (item.tipo === "sol" || idNorm === "sol") {
        badgeText = "✦ ESTRELA CENTRAL • SOL";
        nomeFormatado = "Sol";
    } else if (item.tipo === "lua" || idNorm === "lua") {
        badgeText = item.fase_nome ? `✦ LUA • ${item.fase_nome.toUpperCase()}` : "✦ SATÉLITE NATURAL • LUA";
        nomeFormatado = "Lua";
    } else if (item.tipo === "iss" || idNorm === "iss") {
        badgeText = "✦ ESTAÇÃO ESPACIAL INTERNACIONAL";
        nomeFormatado = "ISS";
    } else if (item.tipo === "planeta") {
        badgeText = "✦ PLANETA DO SISTEMA SOLAR";
    }

    if (badgeElem) badgeElem.textContent = badgeText;
    if (nomeElem) nomeElem.textContent = nomeFormatado;

    // Buscar imagem do astro nos retratos estilizados
    const src = IMAGENS_ASTROS_CARTOES[idNorm] || `/static/images/astros/${idNorm}.png`;

    if (imgElem) {
        imgElem.src = src;
        imgElem.alt = `Retrato de ${nomeFormatado}`;
    }

    painel.classList.remove("oculto");
    painel.style.display = "block";
}

function mostrarImagemConstelacao(const_id, nome) {
    const painel = document.getElementById("painel-constelacao-lateral");
    const imgElem = document.getElementById("img-constelacao-lateral");
    const nomeElem = document.getElementById("painel-constelacao-nome");
    const badgeElem = document.getElementById("painel-constelacao-badge");
    if (!painel) return;

    if (badgeElem) badgeElem.textContent = "✦ CONSTELAÇÃO";
    if (nomeElem) nomeElem.textContent = nome || const_id;

    // Obter imagem mapeada
    const src = IMAGENS_CONSTELACOES[const_id] || `/static/images/constelacoes/${const_id.toLowerCase()}.png`;

    if (imgElem) {
        imgElem.src = src;
        imgElem.alt = `Ilustração da Constelação de ${nome || const_id}`;
    }

    painel.classList.remove("oculto");
    painel.style.display = "block";
}

function esconderImagemConstelacao() {
    const painel = document.getElementById("painel-constelacao-lateral");
    if (painel) {
        painel.classList.add("oculto");
        painel.style.display = "none";
    }
    fecharModalConstelacao();
}

function abrirModalConstelacao() {
    const imgLateral = document.getElementById("img-constelacao-lateral");
    const nomeLateral = document.getElementById("painel-constelacao-nome");
    const badgeLateral = document.getElementById("painel-constelacao-badge");
    const modal = document.getElementById("modal-constelacao");
    const modalImg = document.getElementById("modal-constelacao-img");
    const modalNome = document.getElementById("modal-constelacao-nome");
    const modalBadge = document.getElementById("modal-constelacao-badge");

    if (!modal || !imgLateral || !imgLateral.src) return;

    if (modalImg) modalImg.src = imgLateral.src;
    if (modalNome && nomeLateral) modalNome.textContent = nomeLateral.textContent;
    if (modalBadge && badgeLateral) modalBadge.textContent = badgeLateral.textContent;

    modal.classList.remove("oculto");
}

function fecharModalConstelacao(e) {
    const modal = document.getElementById("modal-constelacao");
    if (modal) modal.classList.add("oculto");
}

// Fechar com a tecla ESC
document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
        esconderImagemConstelacao();
    }
});

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
    mostrarImagemAstro(objetoSelecionado);
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

// Um objeto de céu profundo, na mesma forma. Leva o `mag` já formatado como as
// estrelas (uma casa decimal a mais não serve de nada numa magnitude que se lê
// de meio em meio ponto) e os quatro campos que só ele tem: o tipo do catálogo,
// a constelação onde está, o tamanho em minutos de arco e a nota que o
// ceu_profundo.py lhe dá. É tudo o que o ramo do céu profundo do painel lê.
function itemCeuProfundo(dso_id, dso) {
    return {
        id: dso_id,
        nome: dso.nome,
        tipo: "ceu_profundo",
        dso_tipo: dso.tipo,
        constelacao: dso.constelacao,
        dimensao: dso.dimensao,
        nota: dso.nota,
        mag: dso.mag.toFixed(1),
        altitude: dso.altitude,
        azimute: dso.azimute
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
// custa nada (são ~134 entradas) e evita o único erro que aqui importava: uma
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

    // Os objetos de céu profundo entram com o nome completo ("M42 (Nebulosa de
    // Orion)"), por isso a pesquisa chega a eles tanto por "m42" como por
    // "nebulosa de orion" — e o id ("m42") é procurado à parte, o que faz uma
    // pesquisa por "m4" encontrar M4x sem precisar do parêntesis.
    const ceuProfundo = observatorioDados.ceu_profundo || {};
    for (const dso_id in ceuProfundo) {
        const dso = ceuProfundo[dso_id];
        indice.push({
            item: itemCeuProfundo(dso_id, dso),
            nome: normalizarTexto(dso.nome),
            id: normalizarTexto(dso_id)
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
// estrelas serve para apontar — o que, por omissão, quer dizer nenhuma acima
// do horizonte. Com "Ver abaixo do horizonte" ligado, as de baixo também
// servem: elas estão a ser desenhadas no mapa, e a pesquisa e o tour têm de
// concordar com o que se vê, senão recusam-se a ir a um sítio que está à vista.
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
        if (!est || (!est.visivel && !verAbaixoDoHorizonte())) return;

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

    // Os objetos de céu profundo ao lado das estrelas, e não lá em baixo com os
    // astros: não estão na lista "astros" e a busca por id que ali se faz
    // devolvia null — e um null aqui é um "ir para" que abria o painel e não
    // mexia a câmara, sem dizer porquê.
    if (item.tipo === "ceu_profundo") {
        const dso = observatorioDados.ceu_profundo ? observatorioDados.ceu_profundo[item.id] : null;
        if (!dso) return null;
        return { altitude: dso.altitude, azimute: dso.azimute, visivel: dso.visivel, mag: dso.mag };
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

    // Com "Ver abaixo do horizonte" ligado, o objeto está desenhado no mapa e
    // não há razão nenhuma para o "ir para" se recusar a apontar-lhe: o aviso
    // é para o caso de ele não se ver, e nesse modo vê-se.
    if (!posicao.visivel && !verAbaixoDoHorizonte()) {
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
    } else if (item.tipo === "ceu_profundo") {
        // O limite de brilho desta camada é o dela, não o slider das estrelas
        // (ver MAG_LIMITE_CEU_PROFUNDO): são grandezas que não se comparam.
        const caixa = document.getElementById("chk-ceu-profundo");
        if (caixa && !caixa.checked) {
            return {
                motivo: "Os objetos de céu profundo estão escondidos em Controlos → Objetos de Céu Profundo.",
                curto: "escondido pelos filtros"
            };
        }
        if (posicao.mag > MAG_LIMITE_CEU_PROFUNDO) {
            return {
                motivo: `É mais fraco do que o limite desta camada (Mag ≤ ${MAG_LIMITE_CEU_PROFUNDO}) e por isso não aparece no mapa.`,
                curto: "escondido pelos filtros"
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
        // Um objeto de céu profundo diz o que é — "Galáxia", "Nebulosa
        // planetária" — e não "Céu profundo": quem procura M57 quer saber que
        // encontrou um anel de gás, e é isso que o distingue de uma estrela.
        case "ceu_profundo": return TIPOS_CEU_PROFUNDO[item.dso_tipo] || "Céu profundo";
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

    // O campo fica limpo, e não com o nome que se acabou de escolher: a
    // pesquisa já deu o que tinha a dar — o objeto está no painel e o céu
    // apontado a ele —, e deixar lá "Órion" só fazia parecer que ainda estava
    // à espera de alguma coisa. A pesquisa seguinte começa do zero, sem ter de
    // apagar a anterior à mão.
    //
    // Escrever no campo não dispara o "input", mas não é preciso: fecharResultados
    // (aqui em cima) já esvaziou a lista e o estado dela, e um campo vazio dá a
    // mesma lista vazia se for focado outra vez.
    const campo = document.getElementById("obs-pesquisa");
    if (campo) {
        campo.value = "";
        // O foco sai a seguir: no telemóvel é isto que fecha o teclado e deixa
        // ver o céu.
        campo.blur();
    }
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
        // A exceção é o "Ver abaixo do horizonte": aí as que estão debaixo do
        // chão também entram, porque estão a ser desenhadas no mapa — e um
        // tour que salta metade do que se vê é que seria incompreensível. A
        // decisão é do alvoDaConstelacao, que é quem sabe as duas coisas.
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
    // A lista dos favoritos só faz falta aqui (é o painel de detalhes que tem
    // os ★). Esta chamada é a do caso em que a página abre já neste ecrã — a
    // outra está no mudarEcra, mais abaixo.
    carregarFavoritos();
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
    if (nome === "observatorio") {
        inicializarSeletorHora();
        carregarFavoritos();   // a lista dos ★ (só se pergunta uma vez)
    }
};

setTimeout(autoRefresh, 30000);
document.getElementById("musica").volume = 0.4;
