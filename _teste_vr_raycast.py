# Verificação final: caminhos REAIS de raycasting (rato e controlador) e botão
# 3D «SAIR DO VR», mais o regresso completo à vista geral. Ficheiro temporário.
import asyncio
import json
import subprocess
import sys
import tempfile
import time
import urllib.request

import websockets

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ALVO = "http://localhost:5000/observatorio"
PORTA = 9335


async def enviar(ws, contador, metodo, params=None):
    msg = {"id": contador[0], "method": metodo}
    if params:
        msg["params"] = params
    await ws.send(json.dumps(msg))
    while True:
        resposta = json.loads(await ws.recv())
        if resposta.get("id") == contador[0]:
            contador[0] += 1
            return resposta


async def avaliar(ws, contador, expressao):
    resposta = await enviar(ws, contador, "Runtime.evaluate",
                            {"expression": expressao, "returnByValue": True, "awaitPromise": True})
    r = resposta.get("result", {})
    if "exceptionDetails" in r:
        return {"ERRO": str(r["exceptionDetails"].get("exception", {}).get("description", ""))[:300]}
    return r.get("result", {}).get("value")


async def main():
    perfil = tempfile.mkdtemp(prefix="chrome-vr3-")
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
        print("FALHA: sem endpoint de depuração")
        chrome.terminate()
        sys.exit(1)

    resultados = {}
    async with websockets.connect(ws_url, max_size=64 * 1024 * 1024) as ws:
        contador = [1]
        await enviar(ws, contador, "Runtime.enable")
        await enviar(ws, contador, "Page.enable")
        await enviar(ws, contador, "Page.navigate", {"url": ALVO})
        await asyncio.sleep(4)
        await avaliar(ws, contador, "mudarEcra('vr'); 'ok'")

        for i in range(30):
            await asyncio.sleep(5)
            estado = await avaliar(ws, contador,
                "dadosVRAtuais && dadosVRAtuais.astros.length ? 'pronto' : null")
            if estado == "pronto":
                break
        await asyncio.sleep(3)

        # ── 1) Raycast do RATO: projeta Júpiter no ecrã e clica nesse ponto ──
        resultados["raycast_rato_planeta"] = await avaliar(ws, contador, """
            (() => {
                try {
                    const astro = dadosVRAtuais.astros.find(a => a.nome === 'Júpiter');
                    const pos = altAzParaXYZ(astro.altitude, astro.azimute, RAIO_CEU_VR);
                    const p = pos.clone().project(vrCamera);   // mundo → NDC
                    vrUltimoRatoNDC = new THREE.Vector2(p.x, p.y);
                    limparSelecaoVR();
                    selecionarComRaycastVR(vrCamera);          // MESMO caminho do clique
                    return {
                        selecionado: vrUltimaSelecao ? vrUltimaSelecao.nome : null,
                        painel: document.getElementById('vr-info').classList.contains('visivel')
                    };
                } catch (e) { return 'ERRO: ' + e.message; }
            })()
        """)

        # ── 2) Painel 3D na cena (o mesmo criado no sessionstart) ────────────
        resultados["painel3d_criado"] = await avaliar(ws, contador, """
            (() => {
                try {
                    criarPainelUI3D();
                    criarPainelUI3D();   // não deve duplicar
                    vrPainelUI3D.updateMatrixWorld(true);
                    return {
                        existe: !!vrPainelUI3D,
                        filhos: vrPainelUI3D.children.map(c => c.userData.acao || 'legenda')
                    };
                } catch (e) { return 'ERRO: ' + e.message; }
            })()
        """)

        # ── 3) Raycast do CONTROLADOR no botão 3D «SAIR DO VR» ───────────────
        resultados["raycast_controlador_sair"] = await avaliar(ws, contador, """
            (() => {
                try {
                    window.__acoes = [];
                    const originalSair = sairSessaoVR;
                    sairSessaoVR = () => { window.__acoes.push('sair-vr'); };
                    try {
                        // Controlador sintético: origem à frente do botão, olhando para -Z
                        const ctrl = new THREE.Object3D();
                        ctrl.position.set(0, 1.73, -1.5);   // botão «SAIR DO VR» em (0, 1.73, -2.6)
                        ctrl.quaternion.identity();
                        ctrl.updateMatrixWorld(true);
                        selecionarComRaycastVR(ctrl);        // MESMO caminho do gatilho
                    } finally {
                        sairSessaoVR = originalSair;
                    }
                    return {acoes: window.__acoes, esperado: ['sair-vr']};
                } catch (e) { return 'ERRO: ' + e.message; }
            })()
        """)

        # ── 4) Raycast do controlador no botão «VISTA GERAL» ─────────────────
        resultados["raycast_controlador_vista"] = await avaliar(ws, contador, """
            (() => {
                try {
                    const ctrl = new THREE.Object3D();
                    ctrl.position.set(0, 1.31, -1.5);       // botão «VISTA GERAL» em (0, 1.31, -2.6)
                    ctrl.quaternion.identity();
                    ctrl.updateMatrixWorld(true);
                    selecionarComRaycastVR(ctrl);
                    return {zoom_ativo: vrZoomAtivo,
                            alvo: vrPosCameraAlvo ? vrPosCameraAlvo.length() : null};
                } catch (e) { return 'ERRO: ' + e.message; }
            })()
        """)

        # ── 5) O zoom ASSENTA mesmo na vista geral (posição 0, zoom desligado) ─
        for i in range(12):
            await asyncio.sleep(2)
            estado = await avaliar(ws, contador,
                "[Math.round(vrCamera.position.length() * 100) / 100, vrZoomAtivo]")
            if isinstance(estado, list) and estado[0] < 1 and estado[1] is False:
                break
        resultados["vista_geral_assenta"] = estado

        # ── 6) remoção do painel 3D e limpeza total ──────────────────────────
        resultados["limpeza"] = await avaliar(ws, contador, """
            (() => {
                try {
                    restaurarInterfaceAposSessao();
                    return {
                        painel3d_removido: vrPainelUI3D === null,
                        marcador_removido: vrMarcadorSelecao === null,
                        painel_info_removido: vrPainelInfo3D === null,
                        classe_sessao_fora: !document.body.classList.contains('vr-sessao'),
                        botao_iniciar_habilitado: !document.getElementById('btn-iniciar-vr').disabled
                    };
                } catch (e) { return 'ERRO: ' + e.message; }
            })()
        """)

    chrome.terminate()
    print(json.dumps(resultados, indent=2, ensure_ascii=False))


asyncio.run(main())
