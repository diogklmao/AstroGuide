# ============================================================
#  py/ — Todo o código que é importado
#
#  Na raiz do projeto fica o que se executa (server.py,
#  promover_admin.py, _teste_contas.py) e os dados
#  (astroguide.db, de421.bsp). Aqui dentro fica o resto.
#
#    config.py    — as definições globais
#    database/    — a base de dados e as contas
#    astronomia/  — o cálculo e a rede
#    ceu/         — os catálogos do céu (só dados)
#
#  Este __init__.py existe para a pasta ser um pacote a sério
#  (importável como "py.astronomia.sky_engine") e não só uma
#  pasta com ficheiros lá dentro.
#
#  Nota: "py" é também o nome do comando que arranca o Python no
#  Windows ("py server.py") e de um pacote que o pytest traz. Aqui
#  não colide com nada, mas fica dito para quem passar por cá.
# ============================================================
