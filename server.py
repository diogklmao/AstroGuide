# ============================================================
#  server.py — Servidor Flask, ponto de entrada da app web
#  Cria um servidor HTTP local que serve o HTML ao browser
#  e responde a pedidos de dados astronómicos em JSON.
#  Para correr: py server.py
# ============================================================

from flask import Flask, jsonify, render_template, send_from_directory
import os
import secrets

from py.astronomia.sky_engine import (
    get_sol, get_lua, get_todos_planetas,
    get_fase_lua_dia, get_nascer_por_sol, get_fases_mes,
    get_observatorio, momento_de
)

from py.ceu.eventos import get_eventos_do_dia, get_eventos_do_mes  # importa funções de eventos
from py.astronomia.apod import get_imagem_do_dia                   # importa Imagem Astronómica do Dia (NASA)
from py.astronomia.iss import get_posicao_iss                      # Estação Espacial Internacional (ISS)
from py.config import LOCATION                                     # importa localização
import datetime                                                    # conversão e validação de datas/horas
from zoneinfo import ZoneInfo                                      # conversão de fuso horário
from flask import request                                          # para ler query parameters

from py.database.db import criar_esquema, fechar_ligacao           # base de dados (contas, favoritos, observações)
from py.database.auth import auth_bp, localizacao_do_utilizador    # rotas de conta e localização pessoal
from py.database.admin import admin_bp                             # página de administração (/admin)

app = Flask(__name__)                               # cria a aplicação Flask
                                                    # __name__ diz ao Flask onde está a pasta do projeto


def _chave_secreta():
    # Chave com que o Flask assina o cookie de sessão (é o que impede alguém
    # de forjar um cookie a dizer que já entrou como outro utilizador).
    #
    # Três casos, por ordem: se estiver definida no ambiente — que é o que se
    # faz num servidor a sério — usa-se essa e nunca chega ao disco. Se não
    # estiver mas já houver uma guardada de uma execução anterior, reutiliza-se
    # (sem isto, cada arranque do servidor invalidava as sessões todas e
    # obrigava a entrar outra vez). Se não houver nada, gera-se uma nova e
    # guarda-se.
    #
    # Fica num ficheiro e não escrita aqui no código porque este projeto está
    # num repositório público: uma chave fixa no código-fonte deixaria qualquer
    # pessoa que a lesse assinar cookies válidos para esta aplicação. O
    # ficheiro está no .gitignore.
    do_ambiente = os.environ.get("ASTROGUIDE_SECRET_KEY")
    if do_ambiente:
        return do_ambiente

    caminho = os.path.join(app.root_path, ".secret_key")
    if os.path.exists(caminho):
        with open(caminho, "r", encoding="utf-8") as f:
            guardada = f.read().strip()
        if guardada:
            return guardada

    nova = secrets.token_hex(32)
    with open(caminho, "w", encoding="utf-8") as f:
        f.write(nova)
    return nova


app.secret_key = _chave_secreta()

# O cookie da sessão nunca deve ser legível por JavaScript (HttpOnly): se
# alguma vez entrar na página um script de outra origem, não lhe serve de nada
# ler o cookie para se passar pelo utilizador. E SameSite=Lax impede que um
# site externo faça pedidos autenticados em nome de quem tem sessão aberta —
# é a defesa que falta e que, sem isto, obrigaria a um sistema de tokens CSRF.
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

criar_esquema()                                     # cria as tabelas que ainda não existam

app.register_blueprint(auth_bp)                     # junta as rotas de conta (/entrar, /api/entrar, ...)
app.register_blueprint(admin_bp)                    # junta a página de administração (/admin)

@app.teardown_appcontext
def _fechar_bd(excecao=None):
    # O Flask chama isto no fim de cada pedido, tenha ele corrido bem ou mal.
    # É o que devolve a ligação à base de dados aberta durante o pedido.
    fechar_ligacao(excecao)

# Relê os templates .html do disco a cada pedido, tal como o Flask já faz com
# os .css e os .js. Sem isto — e como o servidor corre com debug=False — o Jinja
# guarda cada template em cache logo no primeiro render, e uma alteração ao
# menu.html só aparecia depois de reiniciar o servidor. Isso dava a impressão
# errada de que "o CSS novo chegou mas o elemento novo não existe".
# Nota: isto NÃO liga o modo de depuração. Não ativa o recarregador automático
# nem o depurador interativo — é só a releitura dos templates.
# Tem de ficar aqui, antes do primeiro render: o jinja_env do Flask só é criado
# no primeiro acesso, e é nessa altura que lê esta configuração.
app.config["TEMPLATES_AUTO_RELOAD"] = True

@app.route("/favicon.ico")
def favicon():
    # O browser pede /favicon.ico automaticamente — servimos a estrela SVG
    return send_from_directory(
        os.path.join(app.root_path, "static"),
        "favicon.svg",
        mimetype="image/svg+xml",
    )

@app.route("/.well-known/appspecific/com.chrome.devtools.json")
def devtools_workspace():
    # Tal como o favicon acima, este é um pedido que o browser faz por
    # iniciativa própria: o Chrome pede este ficheiro quando as DevTools estão
    # abertas (F12), a tentar ligar a pasta do projeto à janela do inspetor.
    # Não temos nada para lhe dar — mas responder 404 enchia o terminal de
    # erros que não eram erros nenhuns, por isso devolvemos um JSON vazio.
    # Isto não afeta a aplicação: serve só para o log ficar limpo.
    return jsonify({})

# ── Rotas de páginas ──────────────────────────────────────────────────────────
# Rotas são URLs — quando o browser acede a um URL, Flask chama a função correspondente

def _pagina_do_menu():
    # O menu mostra a localização de quem está a ver (o "📍 Lisboa, Portugal"
    # debaixo do título). Vem daqui, escrito pelo servidor, e não de uma
    # pergunta ao browser: a localização da aplicação é a que a pessoa
    # escolheu no perfil, e é essa que o céu, o calendário e o observatório
    # usam — perguntar ao dispositivo dava um nome que não correspondia a nada
    # do que a aplicação estava a calcular.
    return render_template("menu.html", localizacao=localizacao_do_utilizador())


def _pagina_aplicacao():
    # As cinco rotas da aplicação (o céu, o calendário, o observatório, a
    # imagem do dia) servem todas o mesmo index.html — é uma aplicação de um
    # ecrã só, e o que muda entre elas é o que o JavaScript abre (ver o fim do
    # index.js). A localização vai no HTML por ser o que o relógio do
    # cabeçalho e o seletor de hora do observatório precisam para saber em que
    # fuso horário estão: sem ela, os dois mostravam a hora do computador de
    # quem está a ver, que é a hora errada para quem escolheu observar de
    # Sydney.
    return render_template("index.html", localizacao=localizacao_do_utilizador())

@app.route("/")                                     # rota "/" = página principal (http://localhost:5000/)
def menu():
    return _pagina_do_menu()

@app.route("/app")                                   # serve o ficheiro templates/index.html ao browser
def app_principal():
    return _pagina_aplicacao()


@app.route("/calendario")                           # serve o ficheiro templates/calendario.html ao browser
def calendario():
    return _pagina_aplicacao()


@app.route("/ceu")                                  # serve o ficheiro templates/mapa.html ao browser
def ceu():
    return _pagina_aplicacao()

@app.route("/observatorio")                         # serve o observatório ao browser
def observatorio():
    return _pagina_aplicacao()

@app.route("/apod")                                  # serve a aba NASA - Imagem do Dia ao browser
def apod_pagina():
    return _pagina_aplicacao()

# ── Rotas da API — devolvem JSON ──────────────────────────────────────────────
# A API é o canal de comunicação entre o browser (JavaScript) e o Python
# O JavaScript faz fetch("/api/ceu") e recebe os dados em JSON

@app.route("/api/ceu")                              # URL: http://localhost:5000/api/ceu
def api_ceu():
    # Devolve os dados do céu em tempo real — sol, lua e planetas.
    # Calculados para a localização da conta com sessão iniciada, ou para a de
    # config.py se ninguém tiver entrado (ver localizacao_do_utilizador).
    local = localizacao_do_utilizador()
    return jsonify({
        "sol":      get_sol(localizacao=local),         # chama sky_engine e obtém dados do Sol
        "lua":      get_lua(localizacao=local),         # idem para a Lua
        "planetas": get_todos_planetas(localizacao=local),  # lista com os 7 planetas
        "location": local["nome"],                      # nome da localização para mostrar na interface
    })

@app.route("/api/observatorio")                      # URL: http://localhost:5000/api/observatorio
def api_observatorio():
    # Devolve as posições das estrelas e constelações no céu de Vila Nova de Gaia.
    # Aceita query params opcionais: ?data=YYYY-MM-DD&hora=HH:MM
    # Se fornecidos, calcula para essa data/hora local em vez do tempo real.

    data_str = request.args.get("data")   # ex: "2026-07-18"
    hora_str = request.args.get("hora")   # ex: "02:00"

    # A localização da conta manda em tudo nesta rota: no céu que é calculado e
    # no fuso horário em que a data/hora pedida é interpretada. Se ?hora=02:00
    # viesse de alguém em Tóquio e fosse lida como hora de Lisboa, o céu
    # mostrado seria o de um instante seis horas ao lado do que a pessoa pediu.
    local = localizacao_do_utilizador()

    timestamp_utc = None
    if data_str and hora_str:
        try:
            local_tz = ZoneInfo(local["timezone"])
            # Converte a data e hora local para UTC com suporte a hora de verão
            dt_local = datetime.datetime.strptime(
                f"{data_str} {hora_str}", "%Y-%m-%d %H:%M"
            ).replace(tzinfo=local_tz)
            timestamp_utc = dt_local.astimezone(datetime.timezone.utc)
        except Exception as e:
            # Regista o erro (para depuração) mas não interrompe o pedido —
            # o utilizador simplesmente recebe os dados em tempo real como fallback.
            app.logger.warning(f"Parâmetros data/hora inválidos ('{data_str}', '{hora_str}'): {e}")

    ceu = get_observatorio(timestamp_utc, local)

    # A ISS entra na lista dos astros para ser desenhada no céu tal como o Sol,
    # a Lua e os planetas. Se não houver elementos orbitais (sem internet, por
    # exemplo) não se acrescenta nada e o céu sai exatamente como saía antes:
    # esta rota nunca pode falhar por causa do satélite.
    try:
        iss = get_posicao_iss(momento_de(timestamp_utc), local)
    except Exception as e:
        # Nem a propagação da órbita pode impedir o céu de ser desenhado.
        app.logger.warning(f"Erro ao calcular a posição da ISS: {e}")
        iss = None
    if iss:
        ceu["astros"].append(iss)

    return jsonify(ceu)


@app.route("/api/calendario/<int:ano>/<int:mes>")   # URL com parâmetros: ex: /api/calendario/2026/3
def api_calendario(ano, mes):
    # Devolve fases da lua e eventos de um mês específico.
    # <int:ano> e <int:mes> são parâmetros passados pelo JavaScript.
    if not (1 <= mes <= 12):
        # <int:mes> aceita qualquer inteiro (ex: /api/calendario/2026/13) — sem isto,
        # o Skyfield rebentava com um erro 500 em vez de uma resposta sensata.
        return jsonify({"erro": "Mês inválido — tem de estar entre 1 e 12"}), 400

    fases   = get_fases_mes(ano, mes, localizacao_do_utilizador())   # luas novas, cheias, quartos do mês
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

    sol     = get_nascer_por_sol(ano, mes, dia, localizacao_do_utilizador())  # horas de nascer e pôr do sol
    fase    = get_fase_lua_dia(ano, mes, dia)        # fase da lua nesse dia
    eventos = get_eventos_do_dia(ano, mes, dia)     # eventos astronómicos nesse dia (filtrado por ano para eclipses)
    return jsonify({
        "sol":     sol,
        "fase":    fase,
        "eventos": eventos,
    })

@app.route("/api/apod")                              # URL: http://localhost:5000/api/apod
def api_apod():
    # Devolve a Imagem Astronómica do Dia (APOD) da NASA para a aba "NASA - Imagem do Dia".
    try:
        return jsonify(get_imagem_do_dia())
    except Exception as e:
        # Se a NASA estiver em baixo, sem internet, ou o limite de pedidos for excedido,
        # devolve um erro claro em vez de rebentar o servidor.
        app.logger.warning(f"Erro ao obter APOD: {e}")
        return jsonify({"erro": "Não foi possível carregar a imagem do dia. Tenta novamente mais tarde."}), 503

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