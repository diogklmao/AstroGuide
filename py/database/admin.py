# ============================================================
#  admin.py — Painel de administração
#
#  Uma página só de leitura, para o dono da aplicação ver o que
#  a base de dados tem: que contas existem e o que cada uma
#  guardou. Não é uma secção da aplicação — não aparece no
#  menu, não calcula céu nenhum, e quem não for admin recebe
#  uma porta fechada em vez de dados.
#
#  Porque uma página renderizada no servidor, e não mais um par
#  API + JavaScript como o resto: os dados que aqui se mostram
#  são os de TODOS os utilizadores, e um endpoint em JSON que
#  os devolvesse passava a ser uma porta a mais que tinha de
#  estar bem fechada. Assim não há endpoint nenhum — o HTML sai
#  já pronto, e um pedido sem permissão não chega a ver um único
#  dado. Menos código, menos superfície.
# ============================================================

from flask import Blueprint, render_template, redirect

from py.database.auth import utilizador_atual, e_admin
from py.database.db import consultar_todos


admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/admin")
def pagina_admin():
    u = utilizador_atual()

    # Sem sessão: manda-se entrar, e o "seguinte" traz a pessoa de volta ao
    # /admin depois de entrar — em vez de a deixar no menu a perguntar-se
    # porque é que a ligação não fez nada.
    if u is None:
        return redirect("/entrar?seguinte=/admin")

    # Com sessão mas sem papel: 403, e não outro redirecionamento. Quem chegou
    # aqui entrou com uma conta válida, e mandá-lo para outro sítio sem
    # explicação deixava-o a achar que o link estava avariado. A página
    # diz-lhe o que se passa — e é também o que separa "não entraste" de
    # "entraste mas não podes", que são problemas diferentes.
    if not e_admin(u):
        return render_template("admin.html", autorizado=False), 403

    # Uma consulta só, com subconsultas: o número de favoritos e de observações
    # de cada conta vem contado pelo SQLite, em vez de se pedir a lista toda de
    # cada um e contá-la em Python. Com muitas contas, a diferença é a
    # diferença entre uma consulta e centenas.
    #
    # O LEFT JOIN nas localizações é de propósito: quem se registou e ainda não
    # escolheu local aparece na mesma, com a localização a vazio — que é
    # exatamente quem fica em Vila Nova de Gaia nos cálculos. Esconder essas
    # linhas dava a impressão errada de que a conta não existe.
    contas = [dict(linha) for linha in consultar_todos(
        "SELECT u.nome, u.email, u.criado_em, "
        "       l.nome AS local_nome, "
        "       (SELECT COUNT(*) FROM favoritos   f WHERE f.utilizador_id = u.id) AS n_favoritos, "
        "       (SELECT COUNT(*) FROM observacoes o WHERE o.utilizador_id = u.id) AS n_observacoes "
        "FROM utilizadores u "
        "LEFT JOIN localizacoes l ON l.utilizador_id = u.id "
        "ORDER BY u.id"
    )]

    return render_template(
        "admin.html",
        autorizado=True,
        contas=contas,
        totais={
            "contas":      len(contas),
            "com_local":   sum(1 for c in contas if c["local_nome"]),
            "favoritos":   sum(c["n_favoritos"] for c in contas),
            "observacoes": sum(c["n_observacoes"] for c in contas),
        },
    )
