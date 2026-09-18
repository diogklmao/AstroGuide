# ============================================================
#  config.py — Configurações globais da aplicação AstroGuide
#  Este ficheiro não executa nada por si só.
#  É um dicionário central de definições que os outros
#  ficheiros importam. Se precisares de mudar a localização
#  do observador, é aqui que o fazes.
# ============================================================

LOCATION = {                                    # dicionário com os dados da localização do observador
    "nome":      "Vila Nova de Gaia",           # nome legível — aparece na interface com o ícone 📍
    "latitude":  41.134697150942294,            # posição Norte/Sul em graus — positivo = Norte, negativo = Sul
    "longitude": -8.661392342590231,            # posição Este/Oeste em graus — negativo = Oeste (Portugal)
    "elevacao":  75,                            # altitude em metros — afeta ligeiramente os cálculos astronómicos
    "timezone":  "Europe/Lisbon"                # fuso horário — usado para converter horas UTC para hora local
}
