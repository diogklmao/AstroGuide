# ============================================================
#  sky_engine.py — Motor de cálculo astronómico
#  Usa as efemérides DE421 da NASA via biblioteca Skyfield
#  para calcular posições reais de astros em tempo real.
# ============================================================

from skyfield.api import load, wgs84, N, W      # load = carrega dados NASA | wgs84 = sistema GPS da Terra | N/W = direções
from config import LOCATION                     # importa a localização definida no config.py

ts  = load.timescale()                          # cria sistema de tempo científico ultra-preciso
eph = load("de421.bsp")                         # carrega as efemérides da NASA com posições de todos os planetas
                                                # na primeira execução descarrega ~17MB, depois fica guardado localmente

observador = wgs84.latlon(                      # define o ponto de observação na superfície da Terra (sistema WGS84 = o mesmo do GPS)
    LOCATION["latitude"] * N,                   # latitude multiplicada por N para indicar Norte
    abs(LOCATION["longitude"]) * W,             # longitude em valor absoluto, multiplicada por W para indicar Oeste
    elevation_m=LOCATION["elevacao"]            # altitude em metros acima do nível do mar
)

PLANETAS = {                                    # dicionário que mapeia nomes internos NASA para português
    "mercury":            "Mercúrio",           # chave = nome reconhecido pelo .bsp | valor = nome em português
    "venus":              "Vénus",
    "mars":               "Marte",
    "jupiter barycenter": "Júpiter",            # planetas gigantes usam "barycenter" = centro de massa planeta+luas
    "saturn barycenter":  "Saturno",
    "uranus barycenter":  "Úrano",
    "neptune barycenter": "Neptuno",
}

def get_planeta(chave):
    # Calcula a posição atual de um planeta visto de Vila Nova de Gaia.
    # Recebe a chave interna ex: "saturn barycenter"
    # Devolve dicionário com altitude, azimute, distância e visibilidade.
    agora   = ts.now()                          # instante atual em tempo científico Skyfield
    terra   = eph["earth"]                      # objeto Terra nas efemérides
    planeta = eph[chave]                        # objeto do planeta pedido nas efemérides

    posicao = (terra + observador).at(agora).observe(planeta).apparent()
    # terra + observador → posiciona o observador em Gaia especificamente
    # .at(agora)         → define o instante de cálculo
    # .observe(planeta)  → calcula o vetor de direção Gaia → planeta
    # .apparent()        → aplica correções atmosféricas para posição aparente real

    alt, az, dist = posicao.altaz()             # decompõe em altitude, azimute e distância

    return {
        "nome":      PLANETAS[chave],           # nome em português ex: "Saturno"
        "altitude":  round(float(alt.degrees), 2),   # graus acima do horizonte — float() converte NumPy para Python normal
        "azimute":   round(float(az.degrees), 2),    # direção em graus (0=Norte, 90=Este, 180=Sul, 270=Oeste)
        "distancia": round(float(dist.au), 4),        # distância em Unidades Astronómicas
        "visivel":   bool(alt.degrees > 0)            # True se acima do horizonte, False se abaixo
    }

def get_todos_planetas():
    # Devolve lista com os 7 planetas de uma vez.
    # List comprehension — chama get_planeta() para cada chave do dicionário PLANETAS.
    return [get_planeta(chave) for chave in PLANETAS]

def get_sol():
    # Calcula a posição atual do Sol.
    # Distância em UA e km porque faz sentido para uma estrela.
    agora = ts.now()
    terra = eph["earth"]
    sol   = eph["sun"]                          # "sun" = nome do Sol nas efemérides NASA

    posicao = (terra + observador).at(agora).observe(sol).apparent()
    alt, az, dist = posicao.altaz()

    km = round(float(dist.au) * 149597870.7, 0) # converte UA para km (1 UA = 149.597.870,7 km)
    return {
        "nome":      "Sol",
        "altitude":  round(float(alt.degrees), 2),
        "azimute":   round(float(az.degrees), 2),
        "distancia": f"{round(float(dist.au), 4)} UA ({km:,.0f} km)",  # ex: "0.9942 UA (148,732,816 km)"
        "visivel":   bool(alt.degrees > 0)
    }

def get_lua():
    # Calcula a posição atual da Lua.
    # Distância só em km — UA seria "0.0026", pouco intuitivo.
    agora = ts.now()
    terra = eph["earth"]
    lua   = eph["moon"]                         # "moon" = nome da Lua nas efemérides NASA

    posicao = (terra + observador).at(agora).observe(lua).apparent()
    alt, az, dist = posicao.altaz()

    km = round(float(dist.au) * 149597870.7, 0) # converte UA para km
    return {
        "nome":      "Lua",
        "altitude":  round(float(alt.degrees), 2),
        "azimute":   round(float(az.degrees), 2),
        "distancia": f"{km:,.0f} km",           # ex: "384,400 km"
        "visivel":   bool(alt.degrees > 0)
    }

def get_fase_lua_dia(ano, mes, dia):
    # Calcula a fase da Lua para um dia específico.
    # Devolve dicionário com percentagem, nome e emoji.
    from skyfield import almanac
    import datetime

    t = ts.utc(ano, mes, dia, 12)               # usa o meio-dia como referência
    fase_graus = almanac.moon_phase(eph, t).degrees  # fase em graus de 0 a 360
    fase = fase_graus / 360.0                   # normaliza para 0.0 a 1.0

    # determina nome e emoji consoante o ângulo de fase
    if fase < 0.0625 or fase >= 0.9375:
        nome, emoji = "Lua Nova",          "🌑"
    elif fase < 0.1875:
        nome, emoji = "Crescente",         "🌒"
    elif fase < 0.3125:
        nome, emoji = "Quarto Crescente",  "🌓"
    elif fase < 0.4375:
        nome, emoji = "Gibosa Crescente",  "🌔"
    elif fase < 0.5625:
        nome, emoji = "Lua Cheia",         "🌕"
    elif fase < 0.6875:
        nome, emoji = "Gibosa Minguante",  "🌖"
    elif fase < 0.8125:
        nome, emoji = "Quarto Minguante",  "🌗"
    else:
        nome, emoji = "Minguante",         "🌘"

    return {
        "percentagem": round(fase * 100, 1),    # ex: 73.2% — percentagem de iluminação
        "nome":        nome,                    # ex: "Lua Cheia"
        "emoji":       emoji,                   # ex: "🌕"
    }

def get_nascer_por_sol(ano, mes, dia):
    # Calcula o nascer e pôr do sol para um dia específico.
    # Devolve dicionário com as horas em hora local de Lisboa.
    import datetime
    from skyfield import almanac

    t0 = ts.utc(ano, mes, dia, 0)               # início do dia (meia-noite UTC)

    # calcula o dia seguinte corretamente sem ultrapassar o mês
    data_seguinte = datetime.date(ano, mes, dia) + datetime.timedelta(days=1)
    t1 = ts.utc(data_seguinte.year, data_seguinte.month, data_seguinte.day, 0)

    # cria o observador dentro da função — necessário para o almanac.sunrise_sunset funcionar corretamente
    from skyfield.api import wgs84, N, W
    from config import LOCATION
    obs = wgs84.latlon(
        LOCATION["latitude"] * N,
        abs(LOCATION["longitude"]) * W,
        elevation_m=LOCATION["elevacao"]
    )

    f = almanac.sunrise_sunset(eph, obs)        # função que deteta nascer e pôr do sol
    tempos, eventos = almanac.find_discrete(t0, t1, f)  # encontra os momentos exatos dentro do intervalo

    resultado = {"nascer": "---", "por": "---"} # valores padrão caso não encontre (ex: sol da meia-noite)
    for t, e in zip(tempos, eventos):           # percorre os momentos encontrados
        hora_utc   = t.utc_datetime()           # converte para datetime UTC
        hora_local = hora_utc + datetime.timedelta(hours=1)  # UTC+1 para Lisboa (simplificado)
        hora_str   = hora_local.strftime("%H:%M")            # formata como "07:23"
        if e == 1:                              # evento 1 = nascer do sol
            resultado["nascer"] = hora_str
        else:                                   # evento 0 = pôr do sol
            resultado["por"] = hora_str

    return resultado

def get_fases_mes(ano, mes):
    # Calcula todas as fases principais da Lua num mês inteiro.
    # Devolve lista com lua nova, quarto crescente, lua cheia e quarto minguante.
    import datetime
    from skyfield import almanac

    t0 = ts.utc(ano, mes, 1)                    # primeiro dia do mês
    t1 = ts.utc(ano, mes + 1, 1) if mes < 12 else ts.utc(ano + 1, 1, 1)  # primeiro dia do mês seguinte

    tempos, fases = almanac.find_discrete(t0, t1, almanac.moon_phases(eph))  # encontra mudanças de fase no mês

    nomes = {
        0: ("Lua Nova",         "🌑"),          # fase 0 = lua nova
        1: ("Quarto Crescente", "🌓"),          # fase 1 = quarto crescente
        2: ("Lua Cheia",        "🌕"),          # fase 2 = lua cheia
        3: ("Quarto Minguante", "🌗"),          # fase 3 = quarto minguante
    }

    resultado = []
    for t, fase in zip(tempos, fases):          # percorre cada fase encontrada
        hora_utc   = t.utc_datetime()
        hora_local = hora_utc + datetime.timedelta(hours=1)     # converte para hora local Lisboa
        nome, emoji = nomes[fase]
        resultado.append({
            "dia":   hora_local.day,            # dia do mês em que ocorre a fase
            "hora":  hora_local.strftime("%H:%M"),  # hora exata da fase
            "nome":  nome,
            "emoji": emoji,
        })

    return resultado
