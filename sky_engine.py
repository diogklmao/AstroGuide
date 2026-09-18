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
import math                                      # cálculo do disco iluminado da Lua

# --- Módulos internos ---
from config import LOCATION                      # localização definida em config.py
from estrelas import ESTRELAS_BD, CONSTELACOES_BD # base de dados de estrelas e constelações
from ceu_profundo import CATALOGO_CEU_PROFUNDO    # base de dados de galáxias, nebulosas e enxames

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

# ── Funções de posição (suportam instante personalizado) ──────────────────────

def momento_de(timestamp_utc=None):
    # Converte um datetime UTC (com tzinfo) no instante correspondente do
    # Skyfield. Sem argumento, é o agora.
    # Existe para o observatório e a ISS (iss.py) olharem para o MESMO instante
    # sem cada um repetir a conversão por sua conta.
    if timestamp_utc is not None:
        return ts.from_datetime(timestamp_utc)
    return ts.now()

def _centro_em(momento):
    # Posição do observador (Terra + Gaia) no instante pedido.
    # É o passo mais caro do cálculo — interpola as efemérides da NASA e a
    # rotação da Terra — mas só depende do INSTANTE e do LOCAL, nunca do
    # alvo que estamos a observar. Por isso calcula-se uma vez por pedido
    # e reutiliza-se para todas as estrelas e astros.
    return (eph["earth"] + observador).at(momento)

def get_planeta(chave, momento=None, centro=None):
    # Calcula a posição de um planeta visto de Vila Nova de Gaia.
    # Recebe a chave interna ex: "saturn barycenter"
    # momento: objeto Time do Skyfield; se None usa ts.now() (tempo real)
    # centro:  posição do observador já calculada (opcional) — permite
    #          reutilizar o mesmo cálculo entre vários astros do mesmo instante
    # Devolve dicionário com altitude, azimute, distância e visibilidade.

    t = momento if momento is not None else ts.now()   # usa o instante pedido ou o atual
    if centro is None:
        centro = _centro_em(t)
    planeta = eph[chave]        # objeto do planeta pedido nas efemérides

    posicao = centro.observe(planeta).apparent()
    # centro             → onde estamos (Terra + Gaia) no instante de cálculo
    # .observe(planeta)  → calcula o vetor de direção Gaia → planeta
    # .apparent()        → aplica correções atmosféricas para posição aparente real

    alt, az, dist = posicao.altaz()     # decompõe em altitude, azimute e distância
    ra_ap, dec_ap, _ = posicao.radec(epoch="date")   # RA/Dec aparentes na época da data

    return {
        "nome": PLANETAS[chave],                        # nome em português ex: "Saturno"
        "altitude": round(float(alt.degrees), 2),       # graus acima do horizonte
        "azimute": round(float(az.degrees), 2),         # direção em graus (0=Norte, 90=Este...)
        "ra_aparente": round(float(ra_ap.hours), 6),    # para o frontend animar a mudança de hora
        "dec_aparente": round(float(dec_ap.degrees), 6),
        "distancia": round(float(dist.au), 4),          # distância em Unidades Astronómicas
        "visivel": bool(alt.degrees > 0)                # True se acima do horizonte
    }

def get_todos_planetas(momento=None, centro=None):
    # Devolve lista com os 7 planetas de uma vez.
    # List comprehension — chama get_planeta() para cada chave do dicionário PLANETAS.
    # O centro é calculado uma única vez e partilhado pelos 7 planetas.
    return [get_planeta(chave, momento, centro) for chave in PLANETAS]

def get_sol(momento=None, centro=None):
    # Calcula a posição do Sol num dado instante (ou agora se None).
    # Distância em UA e km porque faz sentido para uma estrela.

    t = momento if momento is not None else ts.now()
    if centro is None:
        centro = _centro_em(t)
    sol = eph["sun"]            # "sun" = nome do Sol nas efemérides NASA

    posicao = centro.observe(sol).apparent()
    alt, az, dist = posicao.altaz()
    ra_ap, dec_ap, _ = posicao.radec(epoch="date")   # RA/Dec aparentes na época da data

    km = round(float(dist.au) * 149597870.7, 0)    # converte UA para km (1 UA = 149.597.870,7 km)

    return {
        "nome": "Sol",
        "altitude": round(float(alt.degrees), 2),
        "azimute": round(float(az.degrees), 2),
        "ra_aparente": round(float(ra_ap.hours), 6),    # para o frontend animar a mudança de hora
        "dec_aparente": round(float(dec_ap.degrees), 6),
        "distancia": f"{round(float(dist.au), 4)} UA ({km:,.0f} km)",  # ex: "0.9942 UA (148,732,816 km)"
        "visivel": bool(alt.degrees > 0)
    }

def get_lua(momento=None, centro=None):
    # Calcula a posição da Lua num dado instante (ou agora se None).
    # Distância só em km — UA seria "0.0026", pouco intuitivo.

    t = momento if momento is not None else ts.now()
    if centro is None:
        centro = _centro_em(t)
    lua = eph["moon"]           # "moon" = nome da Lua nas efemérides NASA

    posicao = centro.observe(lua).apparent()
    alt, az, dist = posicao.altaz()
    ra_ap, dec_ap, _ = posicao.radec(epoch="date")   # RA/Dec aparentes na época da data

    km = round(float(dist.au) * 149597870.7, 0)    # converte UA para km

    return {
        "nome": "Lua",
        "altitude": round(float(alt.degrees), 2),
        "azimute": round(float(az.degrees), 2),
        "ra_aparente": round(float(ra_ap.hours), 6),    # para o frontend animar a mudança de hora
        "dec_aparente": round(float(dec_ap.degrees), 6),
        "distancia": f"{km:,.0f} km",               # ex: "384,400 km"
        "visivel": bool(alt.degrees > 0)
    }

# ── Funções de calendário ─────────────────────────────────────────────────────

def _descrever_fase(fase_graus):
    # Traduz o ângulo da fase (0-360°) no nome, emoji e % de iluminação.
    # É a tabela de limiares partilhada pelo Calendário e pelo Observatório,
    # para os dois nunca discordarem sobre o que é "Lua Cheia".
    fase_norm = fase_graus / 360.0

    if   fase_norm < 0.0625 or fase_norm >= 0.9375: nome, emoji = "Lua Nova",         "🌑"
    elif fase_norm < 0.1875:                         nome, emoji = "Crescente",         "🌒"
    elif fase_norm < 0.3125:                         nome, emoji = "Quarto Crescente",  "🌓"
    elif fase_norm < 0.4375:                         nome, emoji = "Gibosa Crescente",  "🌔"
    elif fase_norm < 0.5625:                         nome, emoji = "Lua Cheia",         "🌕"
    elif fase_norm < 0.6875:                         nome, emoji = "Gibosa Minguante",  "🌖"
    elif fase_norm < 0.8125:                         nome, emoji = "Quarto Minguante",  "🌗"
    else:                                            nome, emoji = "Minguante",         "🌘"

    return {
        "iluminacao": round((1 - math.cos(math.radians(fase_graus))) / 2 * 100, 1),  # % real do disco
        "nome":       nome,
        "emoji":      emoji,
    }

def get_fase_lua_instante(momento):
    # Fase da Lua no instante exato pedido (objeto Time do Skyfield).
    # Usada pelo Observatório: a fase mostrada é a do céu que está a ser
    # desenhado, seja em tempo real seja numa data simulada.
    return _descrever_fase(almanac.moon_phase(eph, momento).degrees)

def get_fase_lua_dia(ano, mes, dia):
    # Fase da Lua num dia do calendário (usada pelo Calendário Lunar).
    # Amostra o meio-dia UTC desse dia — uma fase por dia, como o calendário
    # apresenta. Para a fase de um instante exato, ver get_fase_lua_instante().
    return _descrever_fase(almanac.moon_phase(eph, ts.utc(ano, mes, dia, 12)).degrees)

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

def _posicao_objeto_fixo(centro, ra_horas, dec_graus):
    # Onde é que um objeto fixo do céu — uma estrela, uma galáxia, uma nebulosa,
    # um enxame — está no instante que o `centro` representa, visto de Gaia.
    #
    # Existe para as estrelas e os objetos de céu profundo não terem duas
    # cópias do mesmo cálculo. As posições que saem daqui têm de ser idênticas
    # às que saíam do ciclo das estrelas, casa a casa: o frontend compara-as
    # com as que ele próprio calcula (ver verificarAltAz, no index.js).
    #
    # A Ascensão Reta e a Declinação que se devolvem NÃO são as do catálogo
    # (ra_horas/dec_graus), são as APARENTES na época da data: o `.apparent()`
    # já lhes aplicou a precessão, a nutação e a aberração. Usar as do catálogo
    # punha o céu do browser ~0,4° ao lado deste, e a transição animada da
    # mudança de hora acabava com um salto visível no último frame. Vão para o
    # frontend para ele poder passar de RA/Dec a Alt/Az em qualquer instante
    # intermédio (ver animarTransicaoCeu, no index.js).
    objeto = Star(ra_hours=ra_horas, dec_degrees=dec_graus)
    posicao = centro.observe(objeto).apparent()
    alt, az, _ = posicao.altaz()
    ra_ap, dec_ap, _ = posicao.radec(epoch="date")

    return {
        "altitude": round(float(alt.degrees), 2),
        "azimute": round(float(az.degrees), 2),
        "ra_aparente": round(float(ra_ap.hours), 6),
        "dec_aparente": round(float(dec_ap.degrees), 6),
    }


def get_observatorio(timestamp_utc=None):
    # Calcula a posição das estrelas, constelações e planetas
    # observáveis a partir de Vila Nova de Gaia.
    # timestamp_utc: datetime UTC com tzinfo; se None usa o instante atual.

    agora = momento_de(timestamp_utc)            # o instante pedido, ou o agora
    # Posição do observador (Terra + Gaia) no instante pedido.
    # Calculada UMA vez e reutilizada por todas as estrelas, pelo Sol,
    # pela Lua e pelos 7 planetas — em vez de a recalcular a cada um.
    centro = _centro_em(agora)
    
    estrelas_calculadas = {}

    # Calcular posição das estrelas
    for star_id, dados in ESTRELAS_BD.items():
        posicao = _posicao_objeto_fixo(centro, dados["ra"], dados["dec"])

        # Guardamos a informação. Enviamos todas para o frontend poder ligar
        # as linhas das constelações de forma contínua, mas marcamos a visibilidade.
        estrelas_calculadas[star_id] = {
            "nome": dados["nome"],
            "altitude": posicao["altitude"],
            "azimute": posicao["azimute"],
            "ra_aparente": posicao["ra_aparente"],
            "dec_aparente": posicao["dec_aparente"],
            "mag": dados["mag"],
            "visivel": posicao["altitude"] > 0
        }

    # Calcular posição dos objetos de céu profundo (galáxias, nebulosas e
    # enxames). São objetos fixos do céu tal como as estrelas, e por isso levam
    # também o RA/Dec aparente: é isso que os faz acompanhar a transição
    # animada da mudança de hora, em vez de ficarem quietos como a ISS, que não
    # é um objeto fixo (ver animarTransicaoCeu, no index.js).
    ceu_profundo_calculado = {}

    for dso_id, dados in CATALOGO_CEU_PROFUNDO.items():
        posicao = _posicao_objeto_fixo(centro, dados["ra"], dados["dec"])

        ceu_profundo_calculado[dso_id] = {
            "nome": dados["nome"],
            "altitude": posicao["altitude"],
            "azimute": posicao["azimute"],
            "ra_aparente": posicao["ra_aparente"],
            "dec_aparente": posicao["dec_aparente"],
            "mag": dados["mag"],
            "visivel": posicao["altitude"] > 0,
            # O tipo, o tamanho, a constelação e a nota seguem como estão no
            # catálogo, sem o Python lhes tocar: quem os mostra é o browser, e
            # assim cada um destes textos tem uma única definição no projeto.
            "tipo": dados["tipo"],
            "constelacao": dados["constelacao"],
            "dimensao": dados["dimensao"],
            "nota": dados["nota"],
        }
        
    # Obter posições do Sol, Lua e Planetas para o instante pedido
    sol_dados = get_sol(agora, centro)
    lua_dados = get_lua(agora, centro)
    planetas_dados = get_todos_planetas(agora, centro)
    
    # Adicionar astros à lista de planetas/luminares
    astros = []
    
    # Adicionar Sol
    # (o RA/Dec aparente acompanha cada astro, tal como nas estrelas, para o
    #  frontend poder calcular a posição em qualquer instante intermédio — ver
    #  animarTransicaoCeu, no index.js)
    astros.append({
        "id": "sol",
        "nome": "Sol",
        "altitude": sol_dados["altitude"],
        "azimute": sol_dados["azimute"],
        "ra_aparente": sol_dados["ra_aparente"],
        "dec_aparente": sol_dados["dec_aparente"],
        "visivel": sol_dados["visivel"],
        "tipo": "sol"
    })
    
    # Fase da Lua no instante exato que está a ser mostrado — o mesmo `agora`
    # usado para as posições. Antes usava-se a data local em tempo real e a
    # data UTC em simulação, o que dava dias diferentes perto da meia-noite.
    fase_lua = get_fase_lua_instante(agora)
    
    astros.append({
        "id": "lua",
        "nome": "Lua",
        "altitude": lua_dados["altitude"],
        "azimute": lua_dados["azimute"],
        "ra_aparente": lua_dados["ra_aparente"],
        "dec_aparente": lua_dados["dec_aparente"],
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
            "ra_aparente": p["ra_aparente"],
            "dec_aparente": p["dec_aparente"],
            "visivel": p["visivel"],
            "tipo": "planeta"
        })
        
    return {
        "estrelas": estrelas_calculadas,
        "ceu_profundo": ceu_profundo_calculado,
        "constelacoes": CONSTELACOES_BD,
        "astros": astros,
        # Dados que o browser precisa para animar a mudança de hora (ver
        # animarTransicaoCeu, no index.js): a latitude do observador e o tempo
        # sideral local deste instante, em graus. Com o RA/Dec aparente de cada
        # estrela, é tudo o que falta para ele calcular a posição de qualquer
        # instante intermédio. `gast` é uma propriedade (escreve-se sem
        # parênteses) e vem em horas. A longitude segue a convenção positiva
        # para leste (config.py), ou seja negativa em Gaia — que é o que faz o
        # tempo sideral local ser menor que o de Greenwich, como deve ser.
        "latitude": LOCATION["latitude"],
        "tempo_sideral": (agora.gast * 15 + LOCATION["longitude"]) % 360
    }