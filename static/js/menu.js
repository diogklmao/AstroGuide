// ── Estrelas ──────────────────────────────────────────────────────────────────
function criarEstrelas() {
    const container = document.getElementById("stars");
    for (let i = 0; i < 180; i++) {
        const star = document.createElement("div");
        star.className = "star";
        const size = Math.random() * 2.5 + 0.5;
        star.style.cssText = `
            width:${size}px; height:${size}px;
            left:${Math.random() * 100}%; top:${Math.random() * 100}%;
            --dur:${Math.random() * 4 + 2}s;
            animation-delay:${Math.random() * 4}s;
        `;
        container.appendChild(star);
    }
}

// ── Localização ───────────────────────────────────────────────────────────────
// Tenta detetar a localização real do utilizador para personalizar a experiência do menu.
function detetarLocalizacao() {
    // tenta obter a localização pelo browser
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                // usa API de geocoding reverso para obter o nome da cidade
                fetch(`https://geocoding-api.open-meteo.com/v1/search?name=&latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}`)
                    .catch(() => { });
                // fallback — mostra as coordenadas
                const lat = pos.coords.latitude.toFixed(2);
                const lon = pos.coords.longitude.toFixed(2);
                document.getElementById("lbl-localizacao").textContent = `📍 ${lat}°N, ${Math.abs(lon)}°W`;
            },
            () => {
                // se recusar a permissão mostra a localização padrão do config
                document.getElementById("lbl-localizacao").textContent = "📍 Vila Nova de Gaia, Portugal";
            }
        );
    } else {
        document.getElementById("lbl-localizacao").textContent = "📍 Vila Nova de Gaia, Portugal";
    }
}

// ── Animação: Céu Agora (Mini Sistema Solar) ──────────────────────────────────
// Desenha uma animação simplificada de planetas a orbitar o Sol num Canvas 2D.
function animarCeu() {
    const canvas = document.getElementById("canvas-ceu");
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // planetas com órbitas
    const planetas = [
        { raio: 6, orbita: 55, vel: 0.008, ang: 0, cor: "#b0bec5" },   // mercúrio
        { raio: 9, orbita: 85, vel: 0.005, ang: 1.5, cor: "#ffcc80" },   // vénus
        { raio: 10, orbita: 120, vel: 0.003, ang: 3.0, cor: "#4fc3f7" },   // terra
        { raio: 7, orbita: 155, vel: 0.002, ang: 4.5, cor: "#ef5350" },   // marte
    ];

    // mini estrelas de fundo no canvas
    const estrelas = Array.from({ length: 60 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.3,
        op: Math.random()
    }));

    let frame = 0;
    function desenhar() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // fundo escuro
        ctx.fillStyle = "#03030d";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // estrelas de fundo
        estrelas.forEach(s => {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.4 * Math.sin(frame * 0.02 + s.op * 10)})`;
            ctx.fill();
        });

        const cx = canvas.width / 2;
        const cy = canvas.height / 2 + 30;    // centro ligeiramente abaixo

        // sol
        const grdSol = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
        grdSol.addColorStop(0, "#fff9c4");
        grdSol.addColorStop(0.4, "#ff8f00");
        grdSol.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.fillStyle = grdSol;
        ctx.fill();

        // corona do sol (brilho)
        ctx.beginPath();
        ctx.arc(cx, cy, 30, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,143,0,0.08)";
        ctx.fill();

        // órbitas e planetas
        planetas.forEach(p => {
            p.ang += p.vel;

            // órbita
            ctx.beginPath();
            ctx.arc(cx, cy, p.orbita, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255,255,255,0.05)";
            ctx.lineWidth = 1;
            ctx.stroke();

            // planeta
            const px = cx + Math.cos(p.ang) * p.orbita;
            const py = cy + Math.sin(p.ang) * p.orbita;

            const grd = ctx.createRadialGradient(px, py, 0, px, py, p.raio);
            grd.addColorStop(0, "#ffffff");
            grd.addColorStop(0.3, p.cor);
            grd.addColorStop(1, "transparent");

            ctx.beginPath();
            ctx.arc(px, py, p.raio, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();
        });

        frame++;
        requestAnimationFrame(desenhar);    // chama-se a si própria — cria o loop de animação
    }
    desenhar();
}

// ── Animação: Calendário Lunar ────────────────────────────────────────────────
function animarCalendario() {
    const canvas = document.getElementById("canvas-calendario");
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const estrelas = Array.from({ length: 80 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.2,
        op: Math.random() * Math.PI * 2
    }));
    //  Variáveis para a estrela cadente
    let sc = { x: -50, y: 30, vel: 5, ativa: false, timer: 0 };
    let frame = 0;

    function desenhar() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // fundo escuro
        ctx.fillStyle = "#03030d";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // estrelas de fundo
        estrelas.forEach(s => {
            const op = 0.3 + 0.5 * Math.sin(frame * 0.02 + s.op);
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${op})`;
            ctx.fill();
        });

        const lx = canvas.width / 2;
        const ly = canvas.height / 2;
        const lr = 70;
        const fase = (frame * 0.004) % (Math.PI * 2);

        // ── Lua com textura e crateras ────────────────────────────────────
        const aura = ctx.createRadialGradient(lx, ly, lr * 0.8, lx, ly, lr * 2);
        aura.addColorStop(0, "rgba(200,200,220,0.08)");
        aura.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(lx, ly, lr * 2, 0, Math.PI * 2);
        ctx.fillStyle = aura;
        ctx.fill();

        const grdBase = ctx.createRadialGradient(lx - lr * 0.2, ly - lr * 0.2, 0, lx, ly, lr);
        grdBase.addColorStop(0, "#f0f0f8");
        grdBase.addColorStop(0.4, "#c8c8d8");
        grdBase.addColorStop(0.8, "#9898a8");
        grdBase.addColorStop(1, "#606070");
        ctx.beginPath();
        ctx.arc(lx, ly, lr, 0, Math.PI * 2);
        ctx.fillStyle = grdBase;
        ctx.fill();

        const crateras = [
            { dx: -20, dy: -15, r: 10 },
            { dx: 25, dy: 10, r: 7 },
            { dx: -5, dy: 25, r: 9 },
            { dx: 15, dy: -30, r: 6 },
            { dx: -30, dy: 20, r: 5 },
            { dx: 10, dy: 5, r: 4 },
        ];

        ctx.save();
        ctx.beginPath();
        ctx.arc(lx, ly, lr, 0, Math.PI * 2);
        ctx.clip();

        crateras.forEach(c => {
            const cx = lx + c.dx;
            const cy = ly + c.dy;

            const grdCratera = ctx.createRadialGradient(cx - c.r * 0.3, cy - c.r * 0.3, 0, cx, cy, c.r);
            grdCratera.addColorStop(0, "rgba(80,80,90,0.6)");
            grdCratera.addColorStop(0.6, "rgba(100,100,110,0.3)");
            grdCratera.addColorStop(1, "rgba(180,180,190,0.1)");
            ctx.beginPath();
            ctx.arc(cx, cy, c.r, 0, Math.PI * 2);
            ctx.fillStyle = grdCratera;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx - c.r * 0.3, cy - c.r * 0.3, c.r * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.15)";
            ctx.fill();
        });

        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.arc(lx, ly, lr, 0, Math.PI * 2);
        ctx.clip();

        const offset = Math.cos(fase) * lr;
        const grdSombra = ctx.createLinearGradient(lx + offset - lr, ly, lx + offset + lr, ly);
        grdSombra.addColorStop(0, "rgba(3,3,13,0.95)");
        grdSombra.addColorStop(0.4, "rgba(3,3,13,0.85)");
        grdSombra.addColorStop(0.6, "rgba(3,3,13,0.2)");
        grdSombra.addColorStop(1, "rgba(3,3,13,0)");
        ctx.fillStyle = grdSombra;
        ctx.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
        ctx.restore();

        const grdBrilho = ctx.createRadialGradient(lx - lr * 0.3, ly - lr * 0.3, 0, lx, ly, lr);
        grdBrilho.addColorStop(0, "rgba(255,255,255,0.12)");
        grdBrilho.addColorStop(0.5, "rgba(255,255,255,0.03)");
        grdBrilho.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(lx, ly, lr, 0, Math.PI * 2);
        ctx.fillStyle = grdBrilho;
        ctx.fill();

        // ── Estrela cadente ───────────────────────────────────────────────
        sc.timer++;
        if (sc.timer > 120) {
            sc.x = -20; sc.y = Math.random() * 100 + 10;
            sc.ativa = true; sc.timer = 0;
        }
        if (sc.ativa) {
            const grad = ctx.createLinearGradient(sc.x, sc.y, sc.x - 60, sc.y - 12);
            grad.addColorStop(0, "rgba(255,255,255,1)");
            grad.addColorStop(1, "transparent");
            ctx.beginPath();
            ctx.moveTo(sc.x, sc.y);
            ctx.lineTo(sc.x - 60, sc.y - 12);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(sc.x, sc.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = "white";
            ctx.fill();

            sc.x += sc.vel;
            if (sc.x > canvas.width + 20) sc.ativa = false;
        }

        frame++;
        requestAnimationFrame(desenhar);
    }
    desenhar();
}

// ── Animação: Observatório ────────────────────────────────────────────────────
function animarObservatorio() {
    const canvas = document.getElementById("canvas-observatorio");
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 - 10;

    const orion = {
        estrelas: [
            { x: cx - 55, y: cy - 90, r: 5, cor: "#ff7043", nome: "Betelgeuse" },
            { x: cx + 50, y: cy - 75, r: 3.5, cor: "#90caf9", nome: "Bellatrix" },
            { x: cx - 18, y: cy - 15, r: 3, cor: "#e0e0e0", nome: "Alnitak" },
            { x: cx + 5, y: cy + 2, r: 3, cor: "#e0e0e0", nome: "Alnilam" },
            { x: cx + 28, y: cy + 18, r: 3, cor: "#e0e0e0", nome: "Mintaka" },
            { x: cx - 45, y: cy + 80, r: 3.5, cor: "#90caf9", nome: "Saiph" },
            { x: cx + 60, y: cy + 90, r: 5, cor: "#e3f2fd", nome: "Rigel" },
            { x: cx - 30, y: cy - 50, r: 2, cor: "#e0e0e0", nome: "λ Ori" },
            { x: cx + 20, y: cy - 55, r: 2, cor: "#e0e0e0", nome: "φ Ori" },
            { x: cx - 8, y: cy + 45, r: 1.5, cor: "#b0bec5", nome: "θ¹" },
            { x: cx + 5, y: cy + 58, r: 1.5, cor: "#b0bec5", nome: "θ²" },
        ],
        linhas: [
            [0, 2], [1, 2], [2, 3], [3, 4], [0, 5], [1, 6], [5, 6], [0, 7], [1, 8], [7, 8], [3, 9], [9, 10],
        ]
    };

    const estrelasFundo = Array.from({ length: 60 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.2,
        op: Math.random() * Math.PI * 2
    }));

    let frame = 0;
    function desenhar() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#03030d";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        estrelasFundo.forEach(s => {
            const op = 0.15 + 0.35 * Math.sin(frame * 0.02 + s.op);
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${op})`;
            ctx.fill();
        });

        const pulso = 0.3 + 0.2 * Math.sin(frame * 0.025);
        orion.linhas.forEach(([a, b]) => {
            const ea = orion.estrelas[a];
            const eb = orion.estrelas[b];

            ctx.beginPath();
            ctx.moveTo(ea.x, ea.y);
            ctx.lineTo(eb.x, eb.y);
            ctx.strokeStyle = `rgba(79,195,247,${pulso})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(ea.x, ea.y);
            ctx.lineTo(eb.x, eb.y);
            ctx.strokeStyle = `rgba(200,240,255,${pulso * 0.3})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        orion.estrelas.forEach(e => {
            const brilho = 0.8 + 0.2 * Math.sin(frame * 0.04 + e.x * 0.01);
            const aura = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 5);
            aura.addColorStop(0, e.cor.replace(")", ",0.3)").replace("rgb", "rgba"));
            aura.addColorStop(1, "transparent");
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.r * 5, 0, Math.PI * 2);
            ctx.fillStyle = aura;
            ctx.fill();

            const grd = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * brilho);
            grd.addColorStop(0, "#ffffff");
            grd.addColorStop(0.3, e.cor);
            grd.addColorStop(1, "transparent");
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.r * brilho * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(e.x, e.y, e.r * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
        });

        [orion.estrelas[0], orion.estrelas[6]].forEach(e => {
            const tamanho = e.r * 4 * (0.8 + 0.2 * Math.sin(frame * 0.05));
            ctx.strokeStyle = "rgba(255,255,255,0.25)";
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(e.x - tamanho, e.y);
            ctx.lineTo(e.x + tamanho, e.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(e.x, e.y - tamanho);
            ctx.lineTo(e.x, e.y + tamanho);
            ctx.stroke();
        });

        const opTexto = 0.2 + 0.1 * Math.sin(frame * 0.015);
        ctx.fillStyle = `rgba(79,195,247,${opTexto})`;
        ctx.font = "bold 10px 'Segoe UI'";
        ctx.textAlign = "center";
        ctx.letterSpacing = "5px";
        ctx.fillText("ORION", cx, cy + 140);

        frame++;
        requestAnimationFrame(desenhar);
    }
    desenhar();
}

// ── Inicialização ─────────────────────────────────────────────────────────────
criarEstrelas();
detetarLocalizacao();

setTimeout(() => {
    animarCeu();
    animarCalendario();
    animarObservatorio();
}, 100);

document.getElementById("musica").volume = 0.4;
