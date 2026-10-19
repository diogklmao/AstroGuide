# Regressão do modo PC no código FINAL: Observatório 2D + clique do rato num
# planeta no VR (modo navegador) + erros de consola. Ficheiro temporário.
import asyncio
import json
import subprocess
import tempfile
import time
import urllib.request

import websockets

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORTA = 9343
erros = []


async def enviar(ws, contador, metodo, params=None):
    msg = {"id": contador[0], "method": metodo}
    if params:
        msg["params"] = params
    await ws.send(json.dumps(msg))
    while True:
        r = json.loads(await ws.recv())
        if r.get("id") == contador[0]:
            contador[0] += 1
            return r
        p = r.get("params", {})
        if r.get("method") == "Runtime.exceptionThrown":
            e = p.get("exceptionDetails", {})
            erros.append("EXCEÇÃO: " + str(e.get("text", "")) + " " +
                         str(e.get("exception", {}).get("description", ""))[:200])
        elif r.get("method") == "Runtime.consoleAPICalled" and p.get("type") == "error":
            erros.append("CONSOLA: " + " ".join(
                str(a.get("value", a.get("description", ""))) for a in p.get("args", []))[:200])


async def avaliar(ws, contador, expr):
    res = await enviar(ws, contador, "Runtime.evaluate",
                       {"expression": expr, "returnByValue": True, "awaitPromise": True})
    r = res.get("result", {})
    if "exceptionDetails" in r:
        return {"ERRO": str(r["exceptionDetails"].get("exception", {}).get("description", ""))[:400]}
    return r.get("result", {}).get("value")


async def main():
    perfil = tempfile.mkdtemp(prefix="chrome-reg-")
    chrome = subprocess.Popen([
        CHROME, "--headless=new", f"--remote-debugging-port={PORTA}",
        "--no-first-run", "--no-default-browser-check", "--no-sandbox",
        "--window-size=1280,800", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
        f"--user-data-dir={perfil}", "about:blank",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    ws_url = None
    for _ in range(40):
        try:
            alvos = json.load(urllib.request.urlopen(f"http://localhost:{PORTA}/json"))
            paginas = [a for a in alvos if a.get("type") == "page"]
            if paginas:
                ws_url = paginas[0]["webSocketDebuggerUrl"]
                break
        except Exception:
            pass
        time.sleep(0.5)
    if not ws_url:
        print("FALHA: sem endpoint")
        chrome.terminate()
        return

    res = {}
    async with websockets.connect(ws_url, max_size=64 * 1024 * 1024) as ws:
        contador = [1]
        await enviar(ws, contador, "Runtime.enable")
        await enviar(ws, contador, "Page.enable")
        await enviar(ws, contador, "Page.navigate",
                     {"url": "http://localhost:5000/observatorio"})

        for _ in range(40):
            await asyncio.sleep(2)
            if await avaliar(ws, contador, "typeof carregarVR") == "function":
                break

        # 1) Observatório 2D continua a desenhar
        res["2d_pixeis"] = await avaliar(ws, contador, """
            (() => {
                const c = document.getElementById('observatorio-canvas');
                const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
                let n = 0;
                for (let i = 0; i < d.length; i += 4) if (d[i] || d[i+1] || d[i+2]) n++;
                return n;
            })()
        """)

        # 2) Ecrã VR + dados do céu (espera paciente)
        await avaliar(ws, contador, "mudarEcra('vr'); 'ok'")
        chegou = False
        for _ in range(40):
            await asyncio.sleep(4)
            if await avaliar(ws, contador, "dadosVRAtuais ? 'ok' : null") == "ok":
                chegou = True
                break
        res["dados_chegaram"] = chegou
        await asyncio.sleep(3)

        # 3) Clique do RATO no planeta — evento real no canvas, no ponto do ecrã
        res["clique_rato"] = await avaliar(ws, contador, """
            (() => {
                const canvas = document.getElementById('vr-canvas');
                const astro = dadosVRAtuais.astros.find(a => a.nome === 'Marte');
                const p3 = altAzParaXYZ(astro.altitude, astro.azimute, RAIO_CEU_VR);
                const ndc = p3.clone().project(vrCamera);
                const r = canvas.getBoundingClientRect();
                const x = r.left + (ndc.x + 1) / 2 * r.width;
                const y = r.top + (1 - ndc.y) / 2 * r.height;
                limparSelecaoVR();
                canvas.dispatchEvent(new MouseEvent('click', {
                    clientX: x, clientY: y, bubbles: true, cancelable: true
                }));
                return {selecionado: vrUltimaSelecao ? vrUltimaSelecao.nome : null,
                        painel_html: document.getElementById('vr-info').classList.contains('visivel'),
                        marcador: !!vrMarcadorSelecao};
            })()
        """)

        # 4) Arrastar (não deve selecionar) — impede cliques acidentais
        res["arrasto_nao_seleciona"] = await avaliar(ws, contador, """
            (() => {
                limparSelecaoVR();
                const canvas = document.getElementById('vr-canvas');
                canvas.dispatchEvent(new MouseEvent('mousedown', {clientX: 300, clientY: 300, bubbles: true}));
                window.dispatchEvent(new MouseEvent('mousemove', {clientX: 420, clientY: 380, bubbles: true}));
                window.dispatchEvent(new MouseEvent('mouseup', {bubbles: true}));
                const astro = dadosVRAtuais.astros.find(a => a.nome === 'Marte');
                const p3 = altAzParaXYZ(astro.altitude, astro.azimute, RAIO_CEU_VR);
                const ndc = p3.clone().project(vrCamera);
                const r = canvas.getBoundingClientRect();
                canvas.dispatchEvent(new MouseEvent('click', {
                    clientX: r.left + (ndc.x + 1) / 2 * r.width,
                    clientY: r.top + (1 - ndc.y) / 2 * r.height, bubbles: true
                }));
                return {selecionado: vrUltimaSelecao ? vrUltimaSelecao.nome : null};
            })()
        """)

    chrome.terminate()
    print(json.dumps(res, indent=2, ensure_ascii=False))
    print("erros de consola:", erros if erros else "nenhum")


asyncio.run(main())
