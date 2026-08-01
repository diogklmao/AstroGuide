# ============================================================
#  server.py — Servidor Flask, ponto de entrada da app web
#  Cria um servidor HTTP local que serve o HTML ao browser
#  e responde a pedidos de dados astronómicos em JSON.
#  Para correr: py server.py
# ============================================================

from flask import Flask, jsonify, render_template, send_from_directory
import os

from sky_engine import (
    get_sol, get_lua, get_todos_planetas,
    get_fase_lua_dia, get_nascer_por_sol, get_fases_mes,
    get_observatorio
)

from eventos import get_eventos_do_dia, get_eventos_do_mes  # importa funções de eventos
from config import LOCATION                                  # importa localização
import datetime                                              # para obter a hora atual
from zoneinfo import ZoneInfo                                # conversão de fuso horário
from flask import request                                    # para ler query parameters

app = Flask(__name__)                               # cria a aplicação Flask
                                                    # __name__ diz ao Flask onde está a pasta do projeto

@app.route("/favicon.ico")
def favicon():
    # O browser pede /favicon.ico automaticamente — servimos a estrela SVG
    return send_from_directory(
        os.path.join(app.root_path, "static"),
        "favicon.svg",
        mimetype="image/svg+xml",
    )

# ── Rotas de páginas ──────────────────────────────────────────────────────────
# Rotas são URLs — quando o browser acede a um URL, Flask chama a função correspondente

@app.route("/")                                     # rota "/" = página principal (http://localhost:5000/)
def menu():
    return render_template("menu.html")

@app.route("/app")                                   # serve o ficheiro templates/index.html ao browser
def app_principal():
    return render_template("index.html")


@app.route("/calendario")                           # serve o ficheiro templates/calendario.html ao browser
def calendario():
    return render_template("index.html")


@app.route("/ceu")                                  # serve o ficheiro templates/mapa.html ao browser
def ceu():
    return render_template("index.html")

@app.route("/observatorio")                         # serve o observatório ao browser
def observatorio():
    return render_template("index.html")


# ── Rotas da API — devolvem JSON ──────────────────────────────────────────────
# A API é o canal de comunicação entre o browser (JavaScript) e o Python
# O JavaScript faz fetch("/api/ceu") e recebe os dados em JSON

@app.route("/api/ceu")                              # URL: http://localhost:5000/api/ceu
def api_ceu():
    # Devolve os dados do céu em tempo real — sol, lua e planetas.
    return jsonify({
        "sol":      get_sol(),                      # chama sky_engine e obtém dados do Sol
        "lua":      get_lua(),                      # idem para a Lua
        "planetas": get_todos_planetas(),           # lista com os 7 planetas
        "hora":     datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S"),  # hora atual formatada
        "location": LOCATION["nome"],               # nome da localização para mostrar na interface
    })

@app.route("/api/observatorio")                      # URL: http://localhost:5000/api/observatorio
def api_observatorio():
    # Devolve as posições das estrelas e constelações no céu de Vila Nova de Gaia.
    # Aceita query params opcionais: ?data=YYYY-MM-DD&hora=HH:MM
    # Se fornecidos, calcula para essa data/hora local em vez do tempo real.

    data_str = request.args.get("data")   # ex: "2026-07-18"
    hora_str = request.args.get("hora")   # ex: "02:00"

    timestamp_utc = None
    if data_str and hora_str:
        try:
            local_tz = ZoneInfo(LOCATION["timezone"])
            # Converte a data e hora local para UTC com suporte a hora de verão
            dt_local = datetime.datetime.strptime(
                f"{data_str} {hora_str}", "%Y-%m-%d %H:%M"
            ).replace(tzinfo=local_tz)
            timestamp_utc = dt_local.astimezone(datetime.timezone.utc)
        except Exception as e:
            # Regista o erro (para depuração) mas não interrompe o pedido —
            # o utilizador simplesmente recebe os dados em tempo real como fallback.
            app.logger.warning(f"Parâmetros data/hora inválidos ('{data_str}', '{hora_str}'): {e}")

    return jsonify(get_observatorio(timestamp_utc))


@app.route("/api/calendario/<int:ano>/<int:mes>")   # URL com parâmetros: ex: /api/calendario/2026/3
def api_calendario(ano, mes):
    # Devolve fases da lua e eventos de um mês específico.
    # <int:ano> e <int:mes> são parâmetros passados pelo JavaScript.
    if not (1 <= mes <= 12):
        # <int:mes> aceita qualquer inteiro (ex: /api/calendario/2026/13) — sem isto,
        # o Skyfield rebentava com um erro 500 em vez de uma resposta sensata.
        return jsonify({"erro": "Mês inválido — tem de estar entre 1 e 12"}), 400

    fases   = get_fases_mes(ano, mes)               # luas novas, cheias, quartos do mês
    eventos = get_eventos_do_mes(ano, mes)         # chuvas de meteoros e eclipses filtrados por ano
    return jsonify({
        "fases":   fases,
        "eventos": eventos,
    })

@app.route("/api/dia/<int:ano>/<int:mes>/<int:dia>")  # URL: ex: /api/dia/2026/3/17
def api_dia(ano, mes, dia):
    # Devolve detalhes de um dia específico para o painel do calendário.
    try:
        # datetime.date() valida mês (1-12) e dia (conforme o mês/ano, incluindo anos bissextos)
        # de uma vez só — mais simples e mais correto do que reimplementar essas regras à mão.
        datetime.date(ano, mes, dia)
    except ValueError:
        return jsonify({"erro": "Data inválida"}), 400

    sol     = get_nascer_por_sol(ano, mes, dia)     # horas de nascer e pôr do sol
    fase    = get_fase_lua_dia(ano, mes, dia)        # fase da lua nesse dia
    eventos = get_eventos_do_dia(ano, mes, dia)     # eventos astronómicos nesse dia (filtrado por ano para eclipses)
    return jsonify({
        "sol":     sol,
        "fase":    fase,
        "eventos": eventos,
    })

# ── Iniciar servidor ──────────────────────────────────────────────────────────

if __name__ == "__main__":                          # só executa se correr diretamente com "py server.py"
    import threading                                # permite correr código em paralelo
    import webbrowser                               # módulo do Python para abrir o browser

    def abrir_browser():
        # Em vez de esperar um tempo fixo (que falha se o Flask ainda estiver a carregar
        # o de421.bsp na 1ª execução), tenta ligar-se ao servidor até responder,
        # até 15 segundos. Só então abre o browser — mais fiável em máquinas lentas.
        import time
        import urllib.request

        for _ in range(30):
            try:
                urllib.request.urlopen("http://localhost:5000", timeout=1)
                break
            except Exception:
                time.sleep(0.5)
        webbrowser.open("http://localhost:5000")    # abre o browser automaticamente

    t = threading.Thread(target=abrir_browser)      # cria uma thread separada para abrir o browser
    t.daemon = True                                 # fecha automaticamente quando o servidor fechar
    t.start()                                       # inicia a thread

    print("AstroGuide a iniciar em http://localhost:5000")
    app.run(port=5000, debug=False)                 # inicia o servidor na porta 5000
                                                    # debug=False para não abrir o browser duas vezes