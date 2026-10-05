# ============================================================
#  rotas.py — as rotas da AstroGuide AI
#
#  Duas portas, e mais nenhuma:
#
#    GET  /api/ia/estado  — há IA configurada neste servidor?
#    POST /api/ia/chat    — uma pergunta, uma resposta
#
#  Vive num Blueprint, como as contas e o /admin, em vez
#  de mais dois @app.route no server.py: o server.py fica com
#  as rotas que servem a aplicação, e o que é de um módulo
#  entra no sítio desse módulo.
#
#  Nenhuma das duas toca em cálculos. A localização com que
#  a IA fala vem do localizacao_do_utilizador(), que é a
#  mesma função que o /api/ceu usa — a IA não pergunta ao
#  browser onde é que ele está, nem tem uma ideia própria
#  sobre isso.
# ============================================================

import threading
import time

from flask import Blueprint, jsonify, request

from py.database.auth import localizacao_do_utilizador, utilizador_atual
from py.ia.ai_engine import ECRAS, responder, estado


ia_bp = Blueprint("ia", __name__)

# O tecto de uma pergunta. Não é uma regra de segurança — quem tem sessão na
# aplicação pode escrever o que quiser —, é uma trava para dois casos chatos:
# uma mensagem que se colou por engano a meio de outra coisa, e um pedido
# forjado contra o endpoint a ver até onde é que ele aguenta. Mil e quinhentos
# caracteres são meia página de texto, muito mais do que uma pergunta a um
# painel de conversa.
MAXIMO_CARACTERES = 1500

# Quantas mensagens de histórico se aceitam do cliente. O ai_engine já corta o
# que manda ao modelo; isto é a mesma defesa do lado de fora, para que o corpo
# do pedido não possa trazer uma conversa inteira escrita à mão.
MAXIMO_MENSAGENS = 20

# Quantos pedidos de conversa se aceita do mesmo IP por minuto.
#
# Isto não é uma regra de cortesia: é a proteção de uma quota paga. Cada
# pergunta vale dois pedidos ao serviço de IA (a pergunta e a resposta já com
# os dados), o plano gratuito dá vinte por dia e por modelo, e o /api/ia/chat
# não exige conta — sem este tecto, uma pessoa sózinha com um script de dez
# linhas deixava o painel de toda a gente a dizer que não havia quota. E é
# também a diferença entre um ataque e um colega com o painel aberto.
#
# Dez por minuto é muito acima do que alguém escreve à mão e abaixo do que
# um script quer. Vem em memória e por processo: o AstroGuide corre num só
# processo, e se um dia correr em vários, a janela passa a ser de cada um —
# nesse dia é um limite de referência a trocar por algo partilhado.
LIMITE_PEDIDOS_POR_MINUTO = 10
JANELA_SEGUNDOS = 60

# Quantos IPs se acompanham ao mesmo tempo. Não é um limite de utilização —
# é só o tamanho da memória: sem ele, um ataque de IPs diferentes encheria o
# dicionário sem fim. Chegando lá, limpa-se o que já passou da janela e, se
# mesmo assim for muito, começa-se de novo — o pior caso é um minuto sem
# limite, e não um servidor sem memória.
MAXIMO_IPS_ACOMPANHADOS = 4096

_pedidos = {}
_pedidos_trava = threading.Lock()


def _passou_do_limite(ip):
    # True se este IP já gastou a janela do minuto. Cada entrada que passa é
    # registada aqui mesmo — o limite conta os pedidos que se deixaram ir, e
    # não os que foram recusados.
    agora = time.monotonic()

    with _pedidos_trava:
        if len(_pedidos) > MAXIMO_IPS_ACOMPANHADOS:
            _pedidos.clear()

        tempos = _pedidos.setdefault(ip, [])
        tempos[:] = [t for t in tempos if agora - t < JANELA_SEGUNDOS]

        if len(tempos) >= LIMITE_PEDIDOS_POR_MINUTO:
            return True

        tempos.append(agora)
        return False


def _historico_limpo(historico):
    # O histórico que se aceita do browser, já cortado ao tamanho da pergunta.
    #
    # O tecto dos 1500 caracteres está na pergunta nova, mas era nele só que
    # contava: sem tratar daqui, as vinte mensagens velhas podiam ir em
    # megabytes cada, o serviço recusava o pedido por contexto a mais, e a
    # pessoa via "não consegui chegar ao serviço de IA" sem perceber de onde
    # vinha aquilo. O que vem de fora é de quem está do outro lado — por isso
    # só entra o que é mesmo conversa, com os papéis que o motor conhece, e
    # texto de cada vez cortado ao mesmo comprimento da pergunta.
    limpo = []

    for m in historico[-MAXIMO_MENSAGENS:]:
        if not isinstance(m, dict):
            continue

        papel = m.get("papel")
        if papel not in ("user", "assistant"):
            continue

        texto = m.get("texto")
        if not isinstance(texto, str):
            continue

        texto = texto.strip()
        if not texto:
            continue

        limpo.append({"papel": papel, "texto": texto[:MAXIMO_CARACTERES]})

    return limpo


@ia_bp.route("/api/ia/estado")
def api_ia_estado():
    # Se a AstroGuide AI está pronta a usar, e o que falta quando não está
    # ("sem_conta", "sem_chave" ou "sem_dependencia" — ver o estado(), no
    # ai_engine.py, e o sem_conta, que é daqui).
    #
    # O painel pergunta isto ao abrir e, se a resposta for que não, avisa logo
    # em vez de deixar escrever uma pergunta para receber um erro. Não devolve
    # nada que não se possa dizer em voz alta: nem a chave, nem um fragmento
    # dela, nem o caminho onde ela está.
    #
    # A conta vem primeiro que tudo: a AstroGuide AI é de quem tem sessão
    # iniciada, e sem isso nada do resto se pergunta — nem sequer se há chave,
    # porque a resposta ia dar ao mesmo a quem não pode usar a funcionalidade.
    if utilizador_atual() is None:
        return jsonify({"disponivel": False, "motivo": "sem_conta", "modelo": None})

    return jsonify(estado())


@ia_bp.route("/api/ia/chat", methods=["POST"])
def api_ia_chat():
    # A pergunta vai daqui ao ai_engine.responder() e a resposta volta como veio.
    #
    # O histórico não vive no servidor: vem no corpo do pedido, dentro do
    # sessionStorage do browser, e volta a ir no pedido seguinte. A sessão do
    # Flask guarda só o id do utilizador, e não havia por onde pendurar uma
    # conversa sem lhe mexer — e guardar conversas no servidor exigiria uma
    # tabela nova, uma política de retenção, e uma resposta a "de quem são
    # estas conversas?" que ninguém pediu. Assim não se guarda nada.
    #
    # Quem não tem sessão nem chega a gastar um pedido ao serviço de IA: a
    # funcionalidade é de contas, e a recusa vem escrita para o painel a dizer
    # o (o ia.js trata o "sem_conta" com a porta de saída para o /entrar).
    if utilizador_atual() is None:
        return jsonify({
            "ok": False, "tipo": "sem_conta",
            "erro": "A AstroGuide AI é para contas com sessão iniciada. "
                    "Entra na tua conta ou cria uma — demora um minuto.",
        }), 401

    corpo = request.get_json(silent=True) or {}

    mensagem = corpo.get("mensagem")
    if not isinstance(mensagem, str) or not mensagem.strip():
        return jsonify({"ok": False, "tipo": "pedido_invalido",
                        "erro": "Escreve uma pergunta para eu poder responder."}), 400

    if len(mensagem) > MAXIMO_CARACTERES:
        return jsonify({
            "ok": False, "tipo": "pedido_invalido",
            "erro": f"Essa pergunta é demasiado longa (o limite é "
                    f"{MAXIMO_CARACTERES} caracteres).",
        }), 400

    # A quota do plano de IA é paga e é de todos os que usam o servidor, por
    # isto vem antes de qualquer trabalho: validar primeiro (um pedido mal
    # feito não gasta janela de ninguém) e só depois contar.
    if _passou_do_limite(request.remote_addr or "?"):
        return jsonify({
            "ok": False, "tipo": "limite_local",
            "erro": "Estás a fazer perguntas depressa demais. "
                    "Espera um minuto e tenta outra vez.",
        }), 429

    historico = corpo.get("historico")
    if not isinstance(historico, list):
        historico = []
    historico = _historico_limpo(historico)

    # Em que ecrã está quem pergunta. Vem do browser, por isso só entra o que
    # está na lista branca do ai_engine (ECRAS) — um valor de fora dela é
    # deitado fora em vez de ir parar às instruções do modelo.
    ecra = corpo.get("ecra")
    if ecra not in ECRAS:
        ecra = None

    resultado = responder(
        mensagem,
        historico=historico,
        localizacao=localizacao_do_utilizador(),
        ecra=ecra,
    )

    if resultado["ok"]:
        return jsonify(resultado)

    # O estado HTTP segue a família da falha, para que quem estiver a ler um
    # log — ou a testar o endpoint à mão — perceba o que aconteceu sem abrir o
    # corpo. O painel ignora o código e lê sempre o campo "erro": é essa a
    # frase que se mostra, e é por isso que ela vem escrita em português.
    return jsonify(resultado), _estado_http(resultado.get("tipo"))


def _estado_http(tipo):
    # 503 quando é o servidor que não está pronto, 429 quando o limite é do
    # serviço de IA, 504 quando não se chegou lá a tempo (rede ou prazo
    # estourado). Tudo o resto é 400 — o pedido é que foi mal feito.
    return {
        "pedido_invalido": 400,
        "recusado": 400,
        "sem_conta": 401,
        "sem_chave": 503,
        "sem_dependencia": 503,
        "chave_invalida": 503,
        "limite": 429,
        "servico": 502,
        "modelo": 502,
        "rede": 504,
        "tempo_esgotado": 504,
        "vazia": 502,
    }.get(tipo, 500)
