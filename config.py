# ============================================================
#  config.py — Configurações globais da aplicação AstroGuide
#  Este ficheiro não executa nada por si só.
#  É um dicionário central de definições que os outros
#  ficheiros importam. Se precisares de mudar a localização
#  ou o nome da app, é aqui que o fazes.
# ============================================================

APP_NAME    = "AstroGuide"      # nome da aplicação — aparece no título do browser e na interface
APP_VERSION = "0.1.0"           # versão no formato major.minor.patch
                                # 0.x.x = em desenvolvimento | 1.0.0 = versão final completa

LOCATION = {                                    # dicionário com os dados da localização do observador
    "nome":      "Vila Nova de Gaia",           # nome legível — aparece na interface com o ícone 📍
    "latitude":  41.134697150942294,            # posição Norte/Sul em graus — positivo = Norte, negativo = Sul
    "longitude": -8.661392342590231,            # posição Este/Oeste em graus — negativo = Oeste (Portugal)
    "elevacao":  75,                            # altitude em metros — afeta ligeiramente os cálculos astronómicos
    "timezone":  "Europe/Lisbon"                # fuso horário — usado para converter horas UTC para hora local
}
