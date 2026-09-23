# ============================================================
#  db.py — Base de dados SQLite do AstroGuide
#
#  Guarda as contas de utilizador e tudo o que é pessoal:
#  a localização de cada um, os objetos favoritos e o registo
#  de observações.
#
#  Porque SQLite e não PostgreSQL/MySQL: o projeto corre com
#  "py server.py" na máquina de quem o usa, sem nada instalado
#  a mais. O SQLite vive dentro do próprio Python (módulo
#  sqlite3) e a base de dados inteira é um só ficheiro
#  (astroguide.db). Não há servidor para arrancar antes da
#  aplicação, nem nada que possa estar em baixo no dia da
#  apresentação. Para este número de utilizadores é igualmente
#  rápido, e se um dia for preciso mudar, o SQL é o mesmo.
# ============================================================

import os
import sqlite3
import datetime

from flask import g


# O ficheiro da base de dados fica na RAIZ do projeto, ao lado do server.py —
# não ao lado deste módulo. Este ficheiro está três pastas abaixo
# (py/database/db.py), e os três dirname são o caminho de volta até à raiz.
#
# Usa-se o caminho absoluto (e não um caminho relativo) para o servidor
# funcionar independentemente da pasta de onde foi arrancado.
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CAMINHO_BD = os.path.join(RAIZ, "astroguide.db")


# ── Papéis ────────────────────────────────────────────────────────────────────
# Os valores que a coluna "papel" pode ter. Ficam aqui, e não escritos à mão em
# cada sítio que os usa, porque um "admin" trocado por "Admin" não dava erro
# nenhum: dava uma conta que se comportava como utilizador normal e ninguém
# percebia porquê. O DEFAULT no esquema é literal (o SQL não interpola isto),
# por isso há um teste que verifica que os dois continuam a dizer o mesmo.
PAPEL_UTILIZADOR = "utilizador"
PAPEL_ADMIN = "admin"


# ── Esquema ───────────────────────────────────────────────────────────────────
# "IF NOT EXISTS" em tudo: isto corre sempre que o servidor arranca, e o que já
# existe fica como está. Não apaga nem recria nada — criar uma conta, desligar
# o servidor e voltar a ligá-lo não perde dados.
#
# O ON DELETE CASCADE nas tabelas que apontam para utilizadores é o que impede
# ficarem favoritos órfãos de contas apagadas. O SQLite não aplica chaves
# estrangeiras por omissão (é preciso ligar o PRAGMA em cada ligação, ver
# obter_ligacao) — sem isso, o CASCADE seria decorativo.
ESQUEMA = """
CREATE TABLE IF NOT EXISTS utilizadores (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nome          TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT    NOT NULL,
    criado_em     TEXT    NOT NULL,
    -- 'utilizador' por omissão: quem se regista é utilizador normal, e passar
    -- a admin é um ato deliberado, feito a partir do terminal (ver
    -- promover_admin.py). Sem isto, um erro no registo dava poderes a mais.
    papel         TEXT    NOT NULL DEFAULT 'utilizador'
);

-- A localização é opcional: quem não preencher nada fica com a de
-- config.py (Vila Nova de Gaia). Por isso é uma tabela separada em vez de
-- colunas na tabela dos utilizadores — a ausência de linha significa
-- exatamente "ainda não escolheu", sem precisar de valores nulos a fingir.
CREATE TABLE IF NOT EXISTS localizacoes (
    utilizador_id INTEGER PRIMARY KEY
                  REFERENCES utilizadores(id) ON DELETE CASCADE,
    nome      TEXT NOT NULL,
    latitude  REAL NOT NULL,
    longitude REAL NOT NULL,
    elevacao  REAL NOT NULL DEFAULT 0,
    timezone  TEXT NOT NULL DEFAULT 'Europe/Lisbon'
);

-- tipo distingue estrela / constelação / objeto de céu profundo. O objeto_id
-- é a chave que o objeto tem no catálogo de origem (ex: "vega", "Ori"), e não
-- o nome visível: os nomes aparecem traduzidos e acentuados, e mudá-los não
-- deve deixar os favoritos de ninguém apontados para o vazio.
CREATE TABLE IF NOT EXISTS favoritos (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    utilizador_id INTEGER NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
    tipo          TEXT    NOT NULL,
    objeto_id     TEXT    NOT NULL,
    criado_em     TEXT    NOT NULL,
    UNIQUE (utilizador_id, tipo, objeto_id)
);

-- objeto_nome fica copiado de propósito, e não é lido do catálogo na altura
-- de mostrar: uma observação é o registo de um momento ("vi Saturno em
-- 18/09"), e tem de continuar a fazer sentido mesmo que o objeto mude de nome
-- no catálogo ou saia dele.
CREATE TABLE IF NOT EXISTS observacoes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    utilizador_id INTEGER NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
    objeto_id     TEXT,
    objeto_nome   TEXT    NOT NULL,
    data          TEXT    NOT NULL,
    nota          TEXT    NOT NULL DEFAULT '',
    criado_em     TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_favoritos_utilizador  ON favoritos  (utilizador_id);
CREATE INDEX IF NOT EXISTS idx_observacoes_utilizador ON observacoes (utilizador_id);
"""


# ── Ligação ───────────────────────────────────────────────────────────────────

def obter_ligacao():
    # Devolve a ligação SQLite do pedido HTTP atual, criando-a na primeira vez
    # que é pedida dentro desse pedido.
    #
    # Porque uma ligação por pedido, guardada no "g" do Flask, em vez de uma
    # ligação global: o servidor de desenvolvimento do Flask atende vários
    # pedidos em threads diferentes, e uma ligação sqlite3 não pode ser
    # partilhada entre threads. Uma por pedido evita o problema pela raiz — e
    # como o Flask fecha o "g" no fim do pedido, ela é sempre devolvida.
    if "bd" not in g:
        g.bd = sqlite3.connect(CAMINHO_BD)
        g.bd.row_factory = sqlite3.Row   # cada linha comporta-se como um dicionário
        g.bd.execute("PRAGMA foreign_keys = ON")
    return g.bd


def fechar_ligacao(excecao=None):
    # Chamada pelo Flask no fim de cada pedido (ver o teardown em server.py).
    # O parâmetro "excecao" é exigido pelo Flask, mas não é preciso aqui: a
    # ligação fecha de qualquer forma, tenha o pedido corrido bem ou mal.
    bd = g.pop("bd", None)
    if bd is not None:
        bd.close()


# ── Acesso a dados ────────────────────────────────────────────────────────────

def consultar_um(sql, parametros=()):
    # Uma linha, ou None se não houver nenhuma.
    return obter_ligacao().execute(sql, parametros).fetchone()


def consultar_todos(sql, parametros=()):
    # Todas as linhas que satisfazem a consulta.
    return obter_ligacao().execute(sql, parametros).fetchall()


def executar(sql, parametros=()):
    # Escreve (INSERT/UPDATE/DELETE) e devolve o id da linha inserida.
    #
    # O commit é feito aqui, e não deixado para o fim do pedido: se o commit
    # falhasse só no fim, a resposta HTTP de sucesso já teria sido enviada ao
    # browser e o utilizador veria a operação como bem-sucedida sem nada
    # gravado. Assim, um erro na gravação acontece antes de responder.
    bd = obter_ligacao()
    cursor = bd.execute(sql, parametros)
    bd.commit()
    return cursor.lastrowid


def agora_iso():
    # Instante atual em texto ISO 8601, em UTC.
    # UTC (e não a hora local) porque isto é gravado, não mostrado: guardar em
    # UTC mantém os registos comparáveis mesmo que o fuso do servidor mude.
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")


def _acrescentar_colunas_em_falta(bd):
    # Colunas que foram acrescentadas depois de a base de dados já existir.
    #
    # O "CREATE TABLE IF NOT EXISTS" do ESQUEMA só cria tabelas que faltem
    # criar — a uma tabela que já lá esteja não lhe toca, nem para lhe juntar
    # uma coluna nova. Sem isto, quem já tivesse um astroguide.db de antes
    # continuava sem a coluna "papel" e a aplicação partia na primeira consulta
    # que a pedisse (o registo, a entrada e a página /admin).
    #
    # O ALTER TABLE ADD COLUMN do SQLite aceita NOT NULL desde que traga um
    # DEFAULT constante — as linhas que já existem ficam com esse valor, que é
    # exatamente o que se quer: quem já tinha conta passa a ser utilizador
    # normal, não admin.
    colunas = {linha["name"] for linha in bd.execute("PRAGMA table_info(utilizadores)")}
    if "papel" not in colunas:
        bd.execute(
            "ALTER TABLE utilizadores "
            f"ADD COLUMN papel TEXT NOT NULL DEFAULT '{PAPEL_UTILIZADOR}'"
        )


def criar_esquema():
    # Cria as tabelas que ainda não existam e acrescenta as colunas que faltem.
    # Corre uma vez, no arranque.
    bd = sqlite3.connect(CAMINHO_BD)
    bd.row_factory = sqlite3.Row   # para o PRAGMA acima vir com nomes e não por índice
    try:
        bd.executescript(ESQUEMA)
        _acrescentar_colunas_em_falta(bd)
        bd.commit()
    finally:
        bd.close()
