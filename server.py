# ============================================================
#  server.py — Servidor Flask, ponto de entrada da app web
#  Cria um servidor HTTP local que serve o HTML ao browser
#  e responde a pedidos de dados astronómicos em JSON.
#  Para correr: py server.py
# ============================================================

from flask import Flask, jsonify, render_template    # Flask = framework web | jsonify = converte dict para JSON | render_template = serve HTML
from sky_engine import (                             # importa todas as funções de cálculo astronómico
    get_sol, get_lua, get_todos_planetas,
    get_fase_lua_dia, get_nascer_por_sol, get_fases_mes
)
from eventos import get_eventos_do_dia, get_eventos_do_mes  # importa funções de eventos
from config import LOCATION                                  # importa localização
import datetime                                              # para obter a hora atual

app = Flask(__name__)                               # cria a aplicação Flask
                                                    # __name__ diz ao Flask onde está a pasta do projeto

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

@app.route("/api/calendario/<int:ano>/<int:mes>")   # URL com parâmetros: ex: /api/calendario/2026/3
def api_calendario(ano, mes):
    # Devolve fases da lua e eventos de um mês específico.
    # <int:ano> e <int:mes> são parâmetros passados pelo JavaScript.
    fases   = get_fases_mes(ano, mes)               # luas novas, cheias, quartos do mês
    eventos = get_eventos_do_mes(ano, mes)         # chuvas de meteoros e eclipses filtrados por ano
    return jsonify({
        "fases":   fases,
        "eventos": eventos,
    })

@app.route("/api/dia/<int:ano>/<int:mes>/<int:dia>")  # URL: ex: /api/dia/2026/3/17
def api_dia(ano, mes, dia):
    # Devolve detalhes de um dia específico para o painel do calendário.
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
        # Espera 1 segundo para o Flask estar pronto antes de abrir o browser.
        import time
        time.sleep(1)
        webbrowser.open("http://localhost:5000")    # abre o browser automaticamente

    t = threading.Thread(target=abrir_browser)      # cria uma thread separada para abrir o browser
    t.daemon = True                                 # fecha automaticamente quando o servidor fechar
    t.start()                                       # inicia a thread

    print("🔭 AstroGuide a iniciar em http://localhost:5000")
    app.run(port=5000, debug=False)                 # inicia o servidor na porta 5000
                                                    # debug=False para não abrir o browser duas vezes
