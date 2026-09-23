# ============================================================
#  auth.py — Contas de utilizador
#
#  Registo, entrada e saída, e tudo o que é pessoal de cada
#  conta: a localização de observação, os favoritos e o
#  registo de observações.
#
#  Nenhuma secção da aplicação fica trancada atrás disto. O Céu,
#  o Calendário, o Observatório e a Imagem do Dia continuam
#  abertos a quem não tem conta — são a montra do projeto.
#  O que a conta dá é o que só faz sentido para uma pessoa:
#  o céu calculado para o sítio onde ela está, os seus objetos
#  favoritos e o seu caderno de observações.
# ============================================================

import re
import datetime
from zoneinfo import ZoneInfo

from flask import Blueprint, render_template, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash

from py.database.db import consultar_um, consultar_todos, executar, agora_iso, PAPEL_ADMIN
from py.config import LOCATION


auth_bp = Blueprint("auth", __name__)


# ── Regras de validação ───────────────────────────────────────────────────────
# Ficam aqui em cima, juntas, para as duas rotas que as usam (registo e
# entrada) nunca discordarem sobre o que é um nome ou um email válido.

NOME_MIN, NOME_MAX = 3, 30
PASSWORD_MIN = 8
TIPOS_FAVORITO = ("estrela", "ceu_profundo", "constelacao")

# O nome de utilizador é o que aparece no ecrã e o que se escreve para entrar,
# por isso aceita acentos e espaços (nomes portugueses como "João Silva" têm
# de caber). O que NÃO pode ter é os caracteres que dão problemas em URLs ou
# em HTML — daí a lista de excluídos em vez de uma lista de permitidos.
_NOME_INVALIDO = re.compile(r"[<>\"'&/\\@{}]")

_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _validar_registo(nome, email, password):
    # Devolve a mensagem de erro, ou None se estiver tudo bem.
    if not nome or not email or not password:
        return "Preenche o nome, o email e a password."
    if len(nome) < NOME_MIN or len(nome) > NOME_MAX:
        return f"O nome tem de ter entre {NOME_MIN} e {NOME_MAX} caracteres."
    if _NOME_INVALIDO.search(nome):
        return "O nome não pode conter < > \" ' & / \\ @ { }."
    if not _EMAIL.match(email):
        return "Esse email não parece válido."
    if len(password) < PASSWORD_MIN:
        return f"A password tem de ter pelo menos {PASSWORD_MIN} caracteres."
    return None


# ── Sessão ────────────────────────────────────────────────────────────────────

def utilizador_atual():
    # A conta com sessão iniciada, ou None se ninguém tiver entrado.
    # Lê-se da base de dados a cada pedido (e não se guardam os dados na
    # sessão) para uma alteração ao perfil aparecer logo, sem ser preciso
    # voltar a entrar. É também o que faz um papel tirado no terminal (ver
    # promover_admin.py) valer no pedido seguinte, sem esperar que a sessão
    # expire.
    uid = session.get("utilizador_id")
    if uid is None:
        return None
    return consultar_um(
        "SELECT id, nome, email, papel FROM utilizadores WHERE id = ?", (uid,)
    )


def e_admin(utilizador):
    # Uma conta é admin quando a coluna "papel" o diz — um valor que só o
    # terminal escreve (ver promover_admin.py), nunca o browser. Não há
    # nenhuma rota que dê ou tire papéis: essa é a diferença entre uma página
    # que mostra dados e uma que os pode entregar a quem a pedir.
    return utilizador is not None and utilizador["papel"] == PAPEL_ADMIN


def _iniciar_sessao(utilizador_id):
    # Guarda na sessão apenas o id. O cookie da sessão é assinado mas não
    # encriptado, por isso o que lá vai é legível por quem tenha o cookie —
    # nunca deve ser a password nem o hash dela.
    session.clear()
    session["utilizador_id"] = utilizador_id
    session.permanent = True


def localizacao_do_utilizador():
    # A localização a usar nos cálculos do céu: a que o utilizador guardou,
    # ou a de config.py se não tiver conta ou ainda não tiver escolhido nada.
    #
    # As chaves são as mesmas do dicionário LOCATION de config.py — é o que
    # permite ao sky_engine receber uma e outra sem saber de onde vêm.
    u = utilizador_atual()
    if u is None:
        return dict(LOCATION)

    linha = consultar_um(
        "SELECT nome, latitude, longitude, elevacao, timezone "
        "FROM localizacoes WHERE utilizador_id = ?",
        (u["id"],),
    )
    if linha is None:
        return dict(LOCATION)

    return {
        "nome":      linha["nome"],
        "latitude":  linha["latitude"],
        "longitude": linha["longitude"],
        "elevacao":  linha["elevacao"],
        "timezone":  linha["timezone"],
    }


# ── Páginas ───────────────────────────────────────────────────────────────────

@auth_bp.route("/entrar")
def pagina_entrar():
    # Uma só página serve a entrada e o registo — os dois formulários estão
    # lá, e o JavaScript alterna entre eles. Separá-los em duas páginas
    # obrigaria a duplicar o fundo, o campo de estrelas e os estilos todos.
    return render_template("entrar.html")


# ── Entrada, registo e saída ──────────────────────────────────────────────────

@auth_bp.route("/api/registar", methods=["POST"])
def api_registar():
    dados = request.get_json(silent=True) or {}
    nome      = (dados.get("nome") or "").strip()
    email     = (dados.get("email") or "").strip().lower()
    password  = dados.get("password") or ""

    erro = _validar_registo(nome, email, password)
    if erro:
        return jsonify({"erro": erro}), 400

    if consultar_um("SELECT id FROM utilizadores WHERE nome = ?", (nome,)):
        return jsonify({"erro": "Já existe uma conta com esse nome."}), 409
    if consultar_um("SELECT id FROM utilizadores WHERE email = ?", (email,)):
        return jsonify({"erro": "Já existe uma conta com esse email."}), 409

    # generate_password_hash trata do sal e escolhe o algoritmo — a password
    # nunca é gravada tal como foi escrita, nem sequer de forma reversível.
    novo_id = executar(
        "INSERT INTO utilizadores (nome, email, password_hash, criado_em) "
        "VALUES (?, ?, ?, ?)",
        (nome, email, generate_password_hash(password), agora_iso()),
    )

    _iniciar_sessao(novo_id)
    # "admin": False explícito, e não omitido: uma conta acabada de criar nunca
    # é admin, e dizê-lo evita que o frontend fique a olhar para um campo que
    # não existe.
    return jsonify({"utilizador": {"id": novo_id, "nome": nome, "email": email,
                                   "admin": False}}), 201


@auth_bp.route("/api/entrar", methods=["POST"])
def api_entrar():
    dados = request.get_json(silent=True) or {}
    # O campo aceita o nome OU o email — quem tem contas em vários sítios
    # escreve quase sempre o email por hábito, e não vale a pena obrigá-lo a
    # lembrar-se de qual usou aqui.
    identificador = (dados.get("identificador") or "").strip()
    password      = dados.get("password") or ""

    if not identificador or not password:
        return jsonify({"erro": "Preenche os dois campos."}), 400

    # O "papel" vem na consulta porque a resposta o vai ler (ver e_admin, no
    # fim): sem ele, o e_admin rebentava com IndexError em TODAS as entradas
    # bem-sucedidas — e, como a sessão já tinha sido iniciada na linha
    # anterior, o utilizador ficava com sessão aberta a ver um erro 500, que é
    # o pior dos dois mundos: entrava e parecia que não.
    linha = consultar_um(
        "SELECT id, nome, email, password_hash, papel FROM utilizadores "
        "WHERE nome = ? OR email = ?",
        (identificador, identificador.lower()),
    )

    # Uma única mensagem para os dois casos (conta inexistente e password
    # errada). Distingui-los diria a quem estivesse a tentar à força quais os
    # nomes que existem.
    if linha is None or not check_password_hash(linha["password_hash"], password):
        return jsonify({"erro": "Nome ou password incorretos."}), 401

    _iniciar_sessao(linha["id"])
    return jsonify({
        "utilizador": {
            "id": linha["id"], "nome": linha["nome"], "email": linha["email"],
            "admin": e_admin(linha),
        }
    })


@auth_bp.route("/api/sair", methods=["POST"])
def api_sair():
    session.clear()
    return jsonify({"ok": True})


@auth_bp.route("/api/me")
def api_me():
    # O frontend pergunta aqui quem está a entrar, para decidir o que mostra
    # no menu e no painel de conta. Devolver 200 com {"utilizador": null} (em
    # vez de 401) é de propósito: "ninguém entrou" é uma resposta normal, não
    # um erro, e assim o JavaScript tem um só caminho para os dois casos.
    u = utilizador_atual()
    if u is None:
        return jsonify({"utilizador": None, "localizacao": dict(LOCATION)})

    return jsonify({
        "utilizador": {
            "id": u["id"], "nome": u["nome"], "email": u["email"],
            # Vai o papel, e não o nome dele: o frontend só precisa de saber se
            # mostra ou não a ligação para o /admin. Quem decide se a página
            # abre é sempre o servidor, que volta a verificar por sua conta.
            "admin": e_admin(u),
        },
        "localizacao": localizacao_do_utilizador(),
    })


# ── Localização de observação ─────────────────────────────────────────────────

@auth_bp.route("/api/localizacao", methods=["PUT", "DELETE"])
def api_localizacao():
    u = utilizador_atual()
    if u is None:
        return jsonify({"erro": "Precisas de ter sessão iniciada."}), 401

    if request.method == "DELETE":
        # Voltar à localização de config.py. Apagar a linha é o que faz
        # localizacao_do_utilizador() voltar ao valor por omissão.
        executar("DELETE FROM localizacoes WHERE utilizador_id = ?", (u["id"],))
        return jsonify({"localizacao": dict(LOCATION)})

    dados = request.get_json(silent=True) or {}

    try:
        latitude  = float(dados.get("latitude"))
        longitude = float(dados.get("longitude"))
        elevacao  = float(dados.get("elevacao") or 0)
    except (TypeError, ValueError):
        return jsonify({"erro": "Latitude e longitude têm de ser números."}), 400

    if not (-90 <= latitude <= 90):
        return jsonify({"erro": "A latitude tem de estar entre -90 e 90."}), 400
    if not (-180 <= longitude <= 180):
        return jsonify({"erro": "A longitude tem de estar entre -180 e 180."}), 400
    if not (-500 <= elevacao <= 9000):
        return jsonify({"erro": "A elevação tem de estar entre -500 e 9000 metros."}), 400

    nome = (dados.get("nome") or "").strip() or "A minha localização"
    if len(nome) > 80:
        return jsonify({"erro": "O nome do local não pode ter mais de 80 caracteres."}), 400

    # O fuso horário é validado a sério, e não só copiado para a base de
    # dados: mais tarde é passado ao ZoneInfo() nos cálculos do calendário, e
    # um valor inválido gravado hoje só rebentava na primeira vez que alguém
    # abrisse o Calendário Lunar.
    timezone = (dados.get("timezone") or "Europe/Lisbon").strip()
    try:
        ZoneInfo(timezone)
    except Exception:
        return jsonify({"erro": "Fuso horário desconhecido."}), 400

    # INSERT ... ON CONFLICT: as duas operações num só passo, para não haver
    # uma janela entre verificar se existe e inserir.
    executar(
        "INSERT INTO localizacoes (utilizador_id, nome, latitude, longitude, elevacao, timezone) "
        "VALUES (?, ?, ?, ?, ?, ?) "
        "ON CONFLICT(utilizador_id) DO UPDATE SET "
        "  nome = excluded.nome, latitude = excluded.latitude, "
        "  longitude = excluded.longitude, elevacao = excluded.elevacao, "
        "  timezone = excluded.timezone",
        (u["id"], nome, latitude, longitude, elevacao, timezone),
    )

    return jsonify({"localizacao": localizacao_do_utilizador()})


# ── Favoritos ─────────────────────────────────────────────────────────────────

@auth_bp.route("/api/favoritos")
def api_listar_favoritos():
    u = utilizador_atual()
    if u is None:
        return jsonify({"favoritos": []})

    linhas = consultar_todos(
        "SELECT tipo, objeto_id, criado_em FROM favoritos "
        "WHERE utilizador_id = ? ORDER BY criado_em DESC",
        (u["id"],),
    )
    return jsonify({"favoritos": [dict(l) for l in linhas]})


@auth_bp.route("/api/favoritos", methods=["POST"])
def api_adicionar_favorito():
    u = utilizador_atual()
    if u is None:
        return jsonify({"erro": "Precisas de ter sessão iniciada."}), 401

    dados = request.get_json(silent=True) or {}
    tipo     = (dados.get("tipo") or "").strip()
    objeto_id = (dados.get("objeto_id") or "").strip()

    # O tipo tem de ser um dos que existem: sem isto, um erro no JavaScript
    # criava uma categoria nova ("estrelas", no plural) que nunca mais
    # aparecia em lado nenhum e ficava na base de dados para sempre.
    if tipo not in TIPOS_FAVORITO:
        return jsonify({"erro": "Tipo de favorito desconhecido."}), 400
    if not objeto_id:
        return jsonify({"erro": "Falta o objeto."}), 400

    # OR IGNORE: marcar duas vezes como favorito não é um erro, é um clique a
    # mais. A restrição UNIQUE garante que não fica duplicado.
    executar(
        "INSERT OR IGNORE INTO favoritos (utilizador_id, tipo, objeto_id, criado_em) "
        "VALUES (?, ?, ?, ?)",
        (u["id"], tipo, objeto_id, agora_iso()),
    )
    return jsonify({"tipo": tipo, "objeto_id": objeto_id, "favorito": True}), 201


@auth_bp.route("/api/favoritos", methods=["DELETE"])
def api_remover_favorito():
    u = utilizador_atual()
    if u is None:
        return jsonify({"erro": "Precisas de ter sessão iniciada."}), 401

    dados = request.get_json(silent=True) or {}
    tipo      = (dados.get("tipo") or "").strip()
    objeto_id = (dados.get("objeto_id") or "").strip()

    executar(
        "DELETE FROM favoritos WHERE utilizador_id = ? AND tipo = ? AND objeto_id = ?",
        (u["id"], tipo, objeto_id),
    )
    return jsonify({"tipo": tipo, "objeto_id": objeto_id, "favorito": False})


# ── Registo de observações ────────────────────────────────────────────────────

@auth_bp.route("/api/observacoes")
def api_listar_observacoes():
    u = utilizador_atual()
    if u is None:
        return jsonify({"observacoes": []})

    linhas = consultar_todos(
        "SELECT id, objeto_id, objeto_nome, data, nota FROM observacoes "
        "WHERE utilizador_id = ? ORDER BY data DESC, id DESC",
        (u["id"],),
    )
    return jsonify({"observacoes": [dict(l) for l in linhas]})


@auth_bp.route("/api/observacoes", methods=["POST"])
def api_adicionar_observacao():
    u = utilizador_atual()
    if u is None:
        return jsonify({"erro": "Precisas de ter sessão iniciada."}), 401

    dados = request.get_json(silent=True) or {}
    objeto_nome = (dados.get("objeto_nome") or "").strip()
    objeto_id   = (dados.get("objeto_id") or "").strip() or None
    nota        = (dados.get("nota") or "").strip()
    data        = (dados.get("data") or "").strip()

    if not objeto_nome:
        return jsonify({"erro": "Escreve o que observaste."}), 400
    if len(objeto_nome) > 80:
        return jsonify({"erro": "O nome do objeto não pode ter mais de 80 caracteres."}), 400
    if len(nota) > 1000:
        return jsonify({"erro": "A nota não pode ter mais de 1000 caracteres."}), 400

    if not data:
        # Se não for indicada, assume-se hoje.
        data = datetime.date.today().isoformat()
    try:
        # Valida o formato e a data ao mesmo tempo: fromisoformat aceita
        # "2026-02-31" sem se queixar só de olhar para o formato.
        datetime.date.fromisoformat(data)
    except ValueError:
        return jsonify({"erro": "Data inválida (usa AAAA-MM-DD)."}), 400

    novo_id = executar(
        "INSERT INTO observacoes (utilizador_id, objeto_id, objeto_nome, data, nota, criado_em) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (u["id"], objeto_id, objeto_nome, data, nota, agora_iso()),
    )
    return jsonify({
        "observacao": {
            "id": novo_id, "objeto_id": objeto_id, "objeto_nome": objeto_nome,
            "data": data, "nota": nota,
        }
    }), 201


@auth_bp.route("/api/observacoes/<int:observacao_id>", methods=["DELETE"])
def api_remover_observacao(observacao_id):
    u = utilizador_atual()
    if u is None:
        return jsonify({"erro": "Precisas de ter sessão iniciada."}), 401

    # O "AND utilizador_id = ?" não é decorativo: sem ele, qualquer pessoa com
    # sessão iniciada podia apagar as observações de outra, bastando-lhe
    # adivinhar o id. A condição faz com que um id alheio simplesmente não
    # corresponda a nada.
    executar(
        "DELETE FROM observacoes WHERE id = ? AND utilizador_id = ?",
        (observacao_id, u["id"]),
    )
    return jsonify({"ok": True})
