# ============================================================
#  config.py — Configurações globais da aplicação AstroGuide
#  Este ficheiro não executa nada por si só.
#  É um dicionário central de definições que os outros
#  ficheiros importam. Se precisares de mudar a localização
#  do observador, é aqui que o fazes.
# ============================================================

# A localização por omissão — a que se usa enquanto ninguém escolheu a sua.
#
# As chaves são as mesmas que as da lista de cidades (ver
# py/localizacao/__init__.py, CAMPOS): uma localização é a mesma coisa venha
# ela do config.py, da lista de cidades ou do serviço de geocoding, e é isso
# que permite ao sky_engine receber qualquer delas sem saber de onde vem.
LOCATION = {
    "cidade":    "Vila Nova de Gaia",           # a terra — é por aqui que a localização se escolhe
    "pais":      "Portugal",                    # o país, para distinguir terras com o mesmo nome
    "nome":      "Vila Nova de Gaia, Portugal", # nome legível — aparece na interface com o ícone 📍
    "latitude":  41.134697150942294,            # posição Norte/Sul em graus — positivo = Norte, negativo = Sul
    "longitude": -8.661392342590231,            # posição Este/Oeste em graus — negativo = Oeste (Portugal)
    "elevacao":  75,                            # altitude em metros — afeta ligeiramente os cálculos astronómicos
    "timezone":  "Europe/Lisbon"                # fuso horário — usado para converter horas UTC para hora local
}
