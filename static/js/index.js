// ── Variáveis globais ─────────────────────────────────────────────
let calAno = new Date().getFullYear();
let calMes = new Date().getMonth() + 1;

const MESES_PT = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DIAS_PT = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

// ── Estrelas ──────────────────────────────────────────────────────
function criarEstrelas() {
    const container = document.getElementById("stars");
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
    document.querySelectorAll(".ecra").forEach(e => e.classList.remove("ativo"));
    document.querySelectorAll("nav button").forEach(b => b.classList.remove("ativo"));
    document.getElementById("ecra-" + nome).classList.add("ativo");
    const btn = document.getElementById("btn-" + nome);
    if (btn) btn.classList.add("ativo");
    if (nome === "calendario") carregarCalendario();
}

// ── Céu Agora ─────────────────────────────────────────────────────
async function carregarCeu() {
    try {
        const res = await fetch("/api/ceu");
        const data = await res.json();
        document.getElementById("localizacao").textContent = "📍 " + data.location;
        document.getElementById("ceu-conteudo").innerHTML = `
            <div class="card">
                <div class="card-titulo" style="color:#ff8f00">☀ Sol</div>
                <div class="dados-grelha">
                    ${dadoHTML("Altitude", data.sol.altitude + "°")}
                    ${dadoHTML("Azimute", data.sol.azimute + "°")}
                    ${dadoHTML("Distância", data.sol.distancia)}
                    ${dadoVisivel(data.sol.visivel)}
                </div>
            </div>
            <div class="card">
                <div class="card-titulo" style="color:#b0bec5">🌙 Lua</div>
                <div class="dados-grelha">
                    ${dadoHTML("Altitude", data.lua.altitude + "°")}
                    ${dadoHTML("Azimute", data.lua.azimute + "°")}
                    ${dadoHTML("Distância", data.lua.distancia)}
                    ${dadoVisivel(data.lua.visivel)}
                </div>
            </div>
            <div class="card">
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
            <div class="evento-card">
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
        <div class="detalhe-linha"><span class="detalhe-icon">${data.fase.emoji}</span><span class="detalhe-label">Fase da Lua</span><span class="detalhe-valor" style="color:${corFase}">${data.fase.nome} (${data.fase.percentagem}%)</span></div>
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

// ── Auto-refresh ──────────────────────────────────────────────────
function autoRefresh() {
    if (document.getElementById("ecra-ceu").classList.contains("ativo")) carregarCeu();
    setTimeout(autoRefresh, 30000);
}

// ── Detetar página e mostrar ecrã correto ─────────────────────────
const pagina = window.location.pathname;
if (pagina === "/calendario") {
    document.getElementById("btn-ceu").style.display = "none";
    mudarEcra("calendario");
} else {
    document.getElementById("btn-calendario").style.display = "none";
    mudarEcra("ceu");
}

// ── Inicialização ─────────────────────────────────────────────────
criarEstrelas();
atualizarRelogio();
setInterval(atualizarRelogio, 1000);
carregarCeu();
autoRefresh();
document.getElementById("musica").volume = 0.4;
