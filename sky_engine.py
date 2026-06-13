# ============================================================
# sky_engine.py — Motor de cálculo astronómico
# Usa as efemérides DE421 da NASA via biblioteca Skyfield
# para calcular posições reais de astros em tempo real.
# ============================================================

# --- Bibliotecas externas ---
from skyfield.api import load, wgs84, N, W, Star  # load = carrega dados NASA | wgs84 = sistema GPS da Terra | N/W = direções | Star = coordenadas de estrelas
from skyfield import almanac                      # funções de astronomia: nascer/pôr do sol, fases da lua, etc.
from zoneinfo import ZoneInfo                    # converte horas UTC para hora local com suporte a hora de verão
import datetime                                  # manipulação de datas e horas

# --- Módulos internos ---
from config import LOCATION                      # localização definida em config.py
from estrelas import ESTRELAS_BD, CONSTELACOES_BD # base de dados de estrelas e constelações

# ── Inicialização global ──────────────────────────────────────────────────────
# Estas variáveis são criadas uma vez quando o ficheiro é carregado
# e reutilizadas por todas as funções abaixo.

ts = load.timescale()       # sistema de tempo científico ultra-preciso do Skyfield
eph = load("de421.bsp")     # efemérides NASA — posições de todos os planetas

observador = wgs84.latlon(              # ponto de observação na superfície da Terra
    LOCATION["latitude"] * N,           # latitude em graus Norte
    abs(LOCATION["longitude"]) * W,     # longitude em graus Oeste (valor absoluto)
    elevation_m=LOCATION["elevacao"]    # altitude em metros acima do nível do mar
)

PLANETAS = {                            # mapeamento de nomes internos NASA para português
    "mercury": "Mercúrio",
    "venus": "Vénus",
    "mars": "Marte",
    "jupiter barycenter": "Júpiter",    # gigantes usam "barycenter" = centro de massa planeta+luas
    "saturn barycenter": "Saturno",
    "uranus barycenter": "Úrano",
    "neptune barycenter": "Neptuno",
}

# ── Funções de posição em tempo real ─────────────────────────────────────────

def get_planeta(chave):
    # Calcula a posição atual de um planeta visto de Vila Nova de Gaia.
    # Recebe a chave interna ex: "saturn barycenter"
    # Devolve dicionário com altitude, azimute, distância e visibilidade.

    agora = ts.now()            # instante atual em tempo científico Skyfield
    terra = eph["earth"]        # objeto Terra nas efemérides
    planeta = eph[chave]        # objeto do planeta pedido nas efemérides

    posicao = (terra + observador).at(agora).observe(planeta).apparent()
    # terra + observador → posiciona o observador em Gaia especificamente
    # .at(agora)         → define o instante de cálculo
    # .observe(planeta)  → calcula o vetor de direção Gaia → planeta
    # .apparent()        → aplica correções atmosféricas para posição aparente real

    alt, az, dist = posicao.altaz()     # decompõe em altitude, azimute e distância

    return {
        "nome": PLANETAS[chave],                        # nome em português ex: "Saturno"
        "altitude": round(float(alt.degrees), 2),       # graus acima do horizonte
        "azimute": round(float(az.degrees), 2),         # direção em graus (0=Norte, 90=Este...)
        "distancia": round(float(dist.au), 4),          # distância em Unidades Astronómicas
        "visivel": bool(alt.degrees > 0)                # True se acima do horizonte
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
    sol = eph["sun"]            # "sun" = nome do Sol nas efemérides NASA

    posicao = (terra + observador).at(agora).observe(sol).apparent()
    alt, az, dist = posicao.altaz()

    km = round(float(dist.au) * 149597870.7, 0)    # converte UA para km (1 UA = 149.597.870,7 km)

    return {
        "nome": "Sol",
        "altitude": round(float(alt.degrees), 2),
        "azimute": round(float(az.degrees), 2),
        "distancia": f"{round(float(dist.au), 4)} UA ({km:,.0f} km)",  # ex: "0.9942 UA (148,732,816 km)"
        "visivel": bool(alt.degrees > 0)
    }

def get_lua():
    # Calcula a posição atual da Lua.
    # Distância só em km — UA seria "0.0026", pouco intuitivo.

    agora = ts.now()
    terra = eph["earth"]
    lua = eph["moon"]           # "moon" = nome da Lua nas efemérides NASA

    posicao = (terra + observador).at(agora).observe(lua).apparent()
    alt, az, dist = posicao.altaz()

    km = round(float(dist.au) * 149597870.7, 0)    # converte UA para km

    return {
        "nome": "Lua",
        "altitude": round(float(alt.degrees), 2),
        "azimute": round(float(az.degrees), 2),
        "distancia": f"{km:,.0f} km",               # ex: "384,400 km"
        "visivel": bool(alt.degrees > 0)
    }

# ── Funções de calendário ─────────────────────────────────────────────────────

def get_fase_lua_dia(ano, mes, dia):
    import math

    t = ts.utc(ano, mes, dia, 12)
    fase_graus = almanac.moon_phase(eph, t).degrees
    fase_norm  = fase_graus / 360.0

    # Iluminação real do disco 
    iluminacao = round((1 - math.cos(math.radians(fase_graus))) / 2 * 100, 1)

    if   fase_norm < 0.0625 or fase_norm >= 0.9375: nome, emoji = "Lua Nova",         "🌑"
    elif fase_norm < 0.1875:                         nome, emoji = "Crescente",         "🌒"
    elif fase_norm < 0.3125:                         nome, emoji = "Quarto Crescente",  "🌓"
    elif fase_norm < 0.4375:                         nome, emoji = "Gibosa Crescente",  "🌔"
    elif fase_norm < 0.5625:                         nome, emoji = "Lua Cheia",         "🌕"
    elif fase_norm < 0.6875:                         nome, emoji = "Gibosa Minguante",  "🌖"
    elif fase_norm < 0.8125:                         nome, emoji = "Quarto Minguante",  "🌗"
    else:                                            nome, emoji = "Minguante",         "🌘"

    return {
        "iluminacao": iluminacao,  # % real do disco iluminado
        "nome":       nome,
        "emoji":      emoji,
    }

def get_nascer_por_sol(ano, mes, dia):
    # Calcula o nascer e pôr do sol para um dia específico.
    # Usa o observador global definido no topo do ficheiro.

    t0 = ts.utc(ano, mes, dia, 0)   # início do dia (meia-noite UTC)

    # calcula o dia seguinte corretamente sem ultrapassar o fim do mês
    data_seguinte = datetime.date(ano, mes, dia) + datetime.timedelta(days=1)
    t1 = ts.utc(data_seguinte.year, data_seguinte.month, data_seguinte.day, 0)

    f = almanac.sunrise_sunset(eph, observador)         # usa o observador global
    tempos, eventos = almanac.find_discrete(t0, t1, f)  # encontra nascer e pôr no intervalo

    resultado = {"nascer": "---", "por": "---"}         # valores padrão caso não encontre
    local_tz = ZoneInfo(LOCATION["timezone"])           # fuso horário de Lisboa com hora de verão

    for t, e in zip(tempos, eventos):       # percorre os momentos encontrados
        hora_utc = t.utc_datetime()         # converte para objeto datetime UTC do Python

        if hora_utc.tzinfo is None:
            hora_utc = hora_utc.replace(tzinfo=datetime.timezone.utc)

        hora_local = hora_utc.astimezone(local_tz)  # converte para hora local Lisboa
        hora_str = hora_local.strftime("%H:%M")      # formata como "07:23"

        if e == 1:                          # evento 1 = sol a cruzar o horizonte subindo (nascer)
            resultado["nascer"] = hora_str
        else:                               # evento 0 = sol a cruzar o horizonte descendo (pôr)
            resultado["por"] = hora_str

    return resultado

def get_fases_mes(ano, mes):
    # Calcula todas as fases principais da Lua num mês inteiro.
    # Devolve lista com lua nova, quarto crescente, lua cheia e quarto minguante.

    t0 = ts.utc(ano, mes, 1)                                                        # primeiro dia do mês
    t1 = ts.utc(ano, mes + 1, 1) if mes < 12 else ts.utc(ano + 1, 1, 1)           # primeiro dia do mês seguinte

    tempos, fases = almanac.find_discrete(t0, t1, almanac.moon_phases(eph))         # deteta as 4 fases principais

    nomes = {
        0: ("Lua Nova", "🌑"),          # fase 0 = lua nova
        1: ("Quarto Crescente", "🌓"),  # fase 1 = quarto crescente
        2: ("Lua Cheia", "🌕"),         # fase 2 = lua cheia
        3: ("Quarto Minguante", "🌗"),  # fase 3 = quarto minguante
    }

    resultado = []
    local_tz = ZoneInfo(LOCATION["timezone"])   # fuso horário de Lisboa

    for t, fase in zip(tempos, fases):          # percorre cada fase encontrada
        hora_utc = t.utc_datetime()

        if hora_utc.tzinfo is None:
            hora_utc = hora_utc.replace(tzinfo=datetime.timezone.utc)

        hora_local = hora_utc.astimezone(local_tz)  # converte para hora local Lisboa
        nome, emoji = nomes[fase]

        resultado.append({
            "dia": hora_local.day,              # dia do mês em que ocorre a fase
            "hora": hora_local.strftime("%H:%M"), # hora exata da fase
            "nome": nome,
            "emoji": emoji,
        })

    return resultado

def get_observatorio():
    # Calcula a posição atual das estrelas, constelações e planetas
    # observáveis a partir de Vila Nova de Gaia.
    
    agora = ts.now()
    terra = eph["earth"]
    observador_pos = terra + observador
    
    estrelas_calculadas = {}
    
    # Calcular posição das estrelas
    for star_id, dados in ESTRELAS_BD.items():
        # Criar o objeto Star com as coordenadas de Ascensão Reta e Declinação
        estrela_sf = Star(ra_hours=dados["ra"], dec_degrees=dados["dec"])
        
        # Calcular posição horizontal (Alt/Az)
        posicao = observador_pos.at(agora).observe(estrela_sf).apparent()
        alt, az, _ = posicao.altaz()
        
        alt_deg = round(float(alt.degrees), 2)
        az_deg = round(float(az.degrees), 2)
        
        # Guardamos a informação. Enviamos todas para o frontend poder ligar
        # as linhas das constelações de forma contínua, mas marcamos a visibilidade.
        estrelas_calculadas[star_id] = {
            "nome": dados["nome"],
            "altitude": alt_deg,
            "azimute": az_deg,
            "mag": dados["mag"],
            "visivel": alt_deg > 0
        }
        
    # Obter posições atuais do Sol, Lua e Planetas
    sol_dados = get_sol()
    lua_dados = get_lua()
    planetas_dados = get_todos_planetas()
    
    # Adicionar astros à lista de planetas/luminares
    astros = []
    
    # Adicionar Sol
    astros.append({
        "id": "sol",
        "nome": "Sol",
        "altitude": sol_dados["altitude"],
        "azimute": sol_dados["azimute"],
        "visivel": sol_dados["visivel"],
        "tipo": "sol"
    })
    
    # Adicionar Lua com o seu emoji correto da fase atual
    hoje = datetime.datetime.now()
    fase_lua = get_fase_lua_dia(hoje.year, hoje.month, hoje.day)
    
    astros.append({
        "id": "lua",
        "nome": "Lua",
        "altitude": lua_dados["altitude"],
        "azimute": lua_dados["azimute"],
        "visivel": lua_dados["visivel"],
        "tipo": "lua",
        "emoji": fase_lua["emoji"],
        "fase_nome": fase_lua["nome"],
        "iluminacao": fase_lua["iluminacao"]
    })
    
    # Adicionar Planetas
    for p in planetas_dados:
        # Encontrar a chave correspondente ao nome em português para ID
        p_id = p["nome"].lower().replace("ú", "u").replace("é", "e").replace("ó", "o")
        astros.append({
            "id": p_id,
            "nome": p["nome"],
            "altitude": p["altitude"],
            "azimute": p["azimute"],
            "visivel": p["visivel"],
            "tipo": "planeta"
        })
        
    return {
        "estrelas": estrelas_calculadas,
        "constelacoes": CONSTELACOES_BD,
        "astros": astros
    }