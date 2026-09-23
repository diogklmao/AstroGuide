# ============================================================
#  promover_admin.py — dar (ou tirar) o papel de administrador
#
#  Corre no terminal, na pasta do projeto:
#
#      py promover_admin.py                          -> quem é admin
#      py promover_admin.py o-email-da-conta         -> promove
#      py promover_admin.py o-email-da-conta --remover
#
#  Porque um script de terminal e não um botão dentro da
#  aplicação: o papel de admin é o que abre /admin, e /admin
#  mostra os dados de todas as contas. Se houvesse um botão
#  para o dar, esse botão seria a peça mais valiosa da
#  aplicação — bastava chegar a ele para passar a ver tudo.
#  Assim, dar o papel obriga a ter acesso à máquina onde o
#  projeto está, que é a mesma coisa que já ser dono dos
#  dados todos. Quem não tem a máquina, não tem o papel.
#
#  Este ficheiro abre a base de dados diretamente, sem Flask:
#  não há pedido HTTP nenhum, logo não há sessão, e o
#  db.obter_ligacao() do resto da aplicação (que vive no "g"
#  do pedido) não estaria disponível.
# ============================================================

import sys
import sqlite3
from contextlib import closing

from py.database import db


def abrir_bd():
    # O criar_esquema() é o que garante que a coluna "papel" já existe. Sem
    # ele, isto dava erro a quem tivesse um astroguide.db criado antes de o
    # papel existir — exatamente o caso de quem corre isto pela primeira vez,
    # que é quem mais precisa dele.
    db.criar_esquema()
    bd = sqlite3.connect(db.CAMINHO_BD)
    bd.row_factory = sqlite3.Row
    return bd


def procurar(bd, email):
    # Sem COLLATE explícito: a coluna "email" já é declarada COLLATE NOCASE no
    # esquema (ver db.py), e o SQLite usa a colação da coluna em qualquer
    # comparação que a envolva. Escrever "diogo@exemplo.pt" quando a conta foi
    # criada como "Diogo@Exemplo.pt" encontra a conta na mesma — que é o que se
    # espera de um email.
    return bd.execute(
        "SELECT id, nome, email, papel FROM utilizadores WHERE email = ?", (email,)
    ).fetchone()


def listar_contas(bd):
    # Usado quando o email não existe: quase sempre o problema é um engano no
    # email, e ver a lista resolve-o na hora, sem ter de ir procurar a outra
    # ponta. Leva o papel à frente porque, com duas contas parecidas, é o que
    # distingue a que já é admin da que não é.
    linhas = bd.execute(
        "SELECT nome, email, papel FROM utilizadores ORDER BY nome"
    ).fetchall()
    if not linhas:
        print("  (a base de dados ainda não tem contas nenhumas)")
        return
    for linha in linhas:
        marca = "  [admin]" if linha["papel"] == db.PAPEL_ADMIN else ""
        print(f"  - {linha['nome']} <{linha['email']}>{marca}")


def listar_admins(bd):
    admins = bd.execute(
        "SELECT nome, email FROM utilizadores WHERE papel = ? ORDER BY nome",
        (db.PAPEL_ADMIN,),
    ).fetchall()
    total = bd.execute("SELECT COUNT(*) FROM utilizadores").fetchone()[0]

    if not admins:
        print(f"Ainda não há administradores. ({total} conta(s) registada(s))")
        print()
        print("Para dar o papel a uma conta:")
        print("  py promover_admin.py o-email-da-conta")
        return 0

    print(f"Administradores ({len(admins)} de {total} conta(s)):")
    for linha in admins:
        print(f"  - {linha['nome']} <{linha['email']}>")
    return 0


def definir_papel(bd, email, papel):
    # Uma função para os dois sentidos: promover e despromover fazem o mesmo,
    # só muda o valor escrito. Duas funções quase iguais seria pedir que uma
    # delas ficasse para trás na próxima alteração.
    promover = papel == db.PAPEL_ADMIN
    linha = procurar(bd, email)

    if linha is None:
        print(f"Não existe nenhuma conta com o email: {email}")
        print()
        print("Contas registadas:")
        listar_contas(bd)
        return 1

    # Já está como se quer: diz-se e sai-se com sucesso. Não é um erro — quem
    # corre isto pediu um estado, e o estado já é esse.
    if linha["papel"] == papel:
        estado = "já é administrador" if promover else "não é administrador"
        print(f"{linha['nome']} <{linha['email']}> {estado}. Não há nada a fazer.")
        return 0

    bd.execute("UPDATE utilizadores SET papel = ? WHERE id = ?", (papel, linha["id"]))
    bd.commit()

    if promover:
        print(f"{linha['nome']} <{linha['email']}> é agora administrador.")
        print("Entra na aplicação com essa conta e abre http://localhost:5000/admin")
    else:
        print(f"{linha['nome']} <{linha['email']}> deixou de ser administrador.")
        print("Se tiver a sessão aberta, o acesso a /admin cai no pedido seguinte.")
    return 0


def main():
    argumentos = sys.argv[1:]

    if not argumentos:
        with closing(abrir_bd()) as bd:
            return listar_admins(bd)

    # O --remover pode vir antes ou depois do email: quem escreve o comando
    # está a pensar no que quer fazer, não na ordem dos argumentos, e recusar
    # "py promover_admin.py --remover a@b.pt" por causa da ordem era implicar
    # com quem fez tudo certo.
    remover = "--remover" in argumentos
    restantes = [a for a in argumentos if not a.startswith("--")]

    if len(restantes) != 1:
        print("Uso:")
        print("  py promover_admin.py                       -> quem é admin")
        print("  py promover_admin.py o-email-da-conta      -> promove")
        print("  py promover_admin.py o-email-da-conta --remover")
        return 1

    papel = db.PAPEL_UTILIZADOR if remover else db.PAPEL_ADMIN

    # O closing, e não um "with bd:" direto: o "with" de uma ligação sqlite3 é
    # um gestor de transação — faz commit no fim e rollback se der erro, mas
    # não fecha nada. A ligação só fechava quando o processo morresse. Aqui
    # fecha-se à saída. O commit continua a ser explícito, onde a alteração é
    # feita (ver definir_papel), que é onde se percebe que ela é gravada.
    with closing(abrir_bd()) as bd:
        return definir_papel(bd, restantes[0].strip(), papel)


if __name__ == "__main__":
    sys.exit(main())
