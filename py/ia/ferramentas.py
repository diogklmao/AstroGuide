# ============================================================
#  ferramentas.py — as funções que a AstroGuide AI pode chamar
#
#  Este ficheiro é a ponte entre a IA e a astronomia da
#  aplicação. Descreve, em linguagem que um modelo entende, o
#  que se pode perguntar ao motor do AstroGuide, e traduz cada
#  pedido numa chamada às funções que já existem — o
#  sky_engine.py e o eventos.py. Não calcula nada por sua
#  conta: se um número sai daqui, saiu de onde sempre saiu.
#
#  COMO ISTO ESTÁ LIGADO
#
#  Pelo ai_engine.py, que apresenta este CATALOGO ao modelo e
#  corre o que ele pedir através do executar() lá em baixo.
#  Isso é a "Function Calling", e mudou o ciclo de uma
#  resposta: deixou de ser um pedido só e passou a ser um
#  vaivém — a pergunta vai, o modelo pede uma ferramenta, o
#  servidor corre-a com o motor do AstroGuide, devolve-lhe o
#  resultado, e só então é que o modelo escreve a resposta,
#  já com os números verdadeiros à frente.
#
#  É isto que permite à AstroGuide AI responder a "que
#  constelações estão visíveis?" sem inventar nada: a resposta
#  não sai do modelo, sai do get_observatorio(). O modelo
#  escolhe o que perguntar e escreve a resposta; os números
#  continuam a ser os mesmos que estão no Céu Agora.
#
#  A localização continua a não passar pelo modelo: ele escolhe
#  QUAL ferramenta chamar e com que argumentos, mas o
#  executar() deita fora qualquer localização que venha no
#  pedido e mete a da conta. Quem pergunta não escolhe de onde
#  se está a olhar o céu por interposta pessoa.
#
#  A FORMA DO CATÁLOGO
#
#  Cada ferramenta é um dicionário com nome, descrição,
#  parâmetros (JSON Schema, que é o que os fornecedores de IA
#  aceitam) e a função que a executa. Não há aqui nada
#  específico do Gemini: é de propósito, para o dia em que o
#  fornecedor mudar.
# ============================================================

import datetime
from zoneinfo import ZoneInfo

from skyfield.errors import EphemerisRangeError

from py.config import LOCATION
from py.localizacao.cidades import sem_acentos
from py.astronomia.sky_engine import (
    get_todos_planetas,
    get_observatorio,
    get_fase_lua_dia,
)
from py.ceu.eventos import get_eventos_do_mes


# ── Auxiliares ────────────────────────────────────────────────────────────────

def _hoje(localizacao):
    # A data de hoje na terra de quem pergunta, e não a do servidor.
    #
    # Importa mais do que parece: às 23h em Lisboa, em Tóquio já é o dia
    # seguinte. Se a data saísse do relógio do servidor, quem perguntasse "que
    # fase tem a Lua hoje?" a partir de um fuso adiantado recebia a resposta do
    # dia anterior — um erro pequeno, mas num assunto em que a pessoa está a
    # olhar para a Lua e a comparar.
    try:
        tz = ZoneInfo(localizacao["timezone"])
    except Exception:
        tz = datetime.timezone.utc
    return datetime.datetime.now(tz).date()


def _variantes(nome):
    # As maneiras de escrever o mesmo nome. O parêntese é um nome alternativo:
    # o "M45 (Plêiades)" responde tanto a "m45" como a "pleiades".
    limpo = sem_acentos(nome or "")
    if "(" in limpo and ")" in limpo:
        base, dentro = limpo.split("(", 1)
        return [p for p in (base.strip(), dentro.split(")", 1)[0].strip(), limpo) if p]
    return [limpo] if limpo else []


def _casa(procurado, nome, modo):
    # Um nome corresponde ao que foi procurado, no modo pedido.
    #
    # Os três modos vão do mais exato para o mais solto, e a procura corre os
    # três por esta ordem — primeiro todos os candidatos ao acerto exato, e só
    # depois os começos, e só no fim os "contém". É esta ordem que faz com que
    # "Órion" encontre a constelação Órion e não a "Nebulosa de Orion": as duas
    # contêm a palavra, mas só uma se chama assim.
    for v in _variantes(nome):
        if modo == "exato" and v == procurado:
            return True
        if modo == "comeca" and v.startswith(procurado):
            return True
        if modo == "contem" and procurado in v:
            return True
    return False


# ── As constelações ───────────────────────────────────────────────────────────

def _constelacao_info(ceu, constelacao):
    # A visibilidade de UMA constelação, tirada das estrelas que a desenham.
    #
    # O céu do Observatório traz as constelações só com o nome e as linhas —
    # as suas estrelas é que levam altitude e visibilidade. Como essas estrelas
    # já estão todas calculadas, juntá-las é o que responde a "que constelações
    # estão visíveis" sem um único cálculo astronómico novo: os números saem do
    # mesmo sítio de onde sempre saíram.
    #
    # A altitude dada à constelação é a da sua estrela mais alta. É uma
    # escolha, e é a que responde à pergunta que se faz: uma constelação está
    # no céu enquanto uma parte dela estiver acima do horizonte, e o ponto mais
    # alto é o quanto ela está levantada. Como ela pode estar só meio
    # levantada, vai também o "parcial" — sem isso, uma constelação com metade
    # das estrelas debaixo do horizonte respondia "visível" e mais nada.
    ids = [e for par in constelacao["linhas"] for e in par]
    estrelas = [ceu["estrelas"][e] for e in ids if e in ceu["estrelas"]]

    if not estrelas:
        return {
            "nome": constelacao["nome"],
            "visivel": False,
            "altitude_maxima": None,
            "nota": "Não há estrelas desta constelação no catálogo.",
        }

    visiveis = [e for e in estrelas if e["visivel"]]

    return {
        "nome": constelacao["nome"],
        "visivel": bool(visiveis),
        "parcial": bool(visiveis) and len(visiveis) < len(estrelas),
        "altitude_maxima": round(max(e["altitude"] for e in estrelas), 1),
        "estrelas_visiveis": len(visiveis),
        "estrelas": len(estrelas),
    }


def _constelacoes_visiveis(ceu):
    # As catorze constelações do catálogo, da mais alta para a mais baixa.
    return sorted(
        (_constelacao_info(ceu, c) for c in ceu["constelacoes"].values()),
        key=lambda c: (c["altitude_maxima"] is not None, c["altitude_maxima"]),
        reverse=True,
    )


# ── Os adaptadores ────────────────────────────────────────────────────────────
# Cada um devolve JSON simples — nada de objetos do Skyfield, nada de tuplos —
# porque isto acaba a viajar num pedido HTTP para um serviço de IA, e só o que
# é simples atravessa essa fronteira sem se perder.

def get_sky_now(tipo="tudo", limite=10, localizacao=None):
    # O que está no céu agora, no local de quem pergunta.
    #
    # É a ferramenta que responde a "o que é que eu vejo esta noite?". Lê o
    # get_observatorio() — o mesmo cálculo que desenha o mapa celeste — e
    # devolve o que ele já tem separado por tipo: os astros do sistema solar,
    # as constelações, as estrelas e os objetos de céu profundo.
    #
    # O `tipo` existe para não arrastar cento e trinta objetos quando a
    # pergunta é só sobre planetas. E o `limite` corta as estrelas e o céu
    # profundo, que são listas compridas: ficam os mais brilhantes, que são os
    # que se veem à vista desarmada e os que interessam a quem está a olhar
    # para cima.
    #
    # Nos astros e nas constelações vão também os que estão ABAIXO do
    # horizonte. São listas curtas — nove e catorze —, e "Órion não está
    # visível, mas nasce daqui a umas horas" é uma resposta melhor do que não
    # encontrar Órion na lista. Nas estrelas e no céu profundo não: são
    # dezenas, e a lista dos invisíveis não diz nada a ninguém.
    local = localizacao or LOCATION
    ceu = get_observatorio(localizacao=local)

    pedido = (tipo or "tudo").strip().lower()
    if pedido not in ("planetas", "constelacoes", "estrelas", "ceu_profundo", "tudo"):
        pedido = "tudo"

    try:
        quantos = max(1, min(int(limite), 40))
    except (TypeError, ValueError):
        quantos = 10

    resultado = {"localizacao": local["nome"], "tipo_pedido": pedido}

    if pedido in ("planetas", "tudo"):
        # A distância não vem no Observatório — ele não a desenha em lado
        # nenhum —, por isso vai-se buscá-la ao get_todos_planetas(), que é
        # quem a calcula. É o que permite responder a "qual é o planeta mais
        # próximo", que é pergunta diferente de "qual está mais alto".
        distancias = {p["nome"]: p["distancia"] for p in get_todos_planetas(localizacao=local)}

        astros = []
        for a in ceu["astros"]:
            item = {
                "nome": a["nome"],
                "altitude": a["altitude"],
                "azimute": a["azimute"],
                "visivel": a["visivel"],
            }
            if a["nome"] in distancias:
                item["distancia_ua"] = distancias[a["nome"]]
            if a["tipo"] == "lua":
                item["fase"] = a["fase_nome"]
                item["iluminacao_percentagem"] = a["iluminacao"]
            astros.append(item)

        resultado["astros"] = astros

    if pedido in ("constelacoes", "tudo"):
        resultado["constelacoes"] = _constelacoes_visiveis(ceu)

    if pedido in ("estrelas", "tudo"):
        visiveis = sorted(
            (e for e in ceu["estrelas"].values() if e["visivel"]),
            key=lambda e: e["mag"],
        )[:quantos]

        resultado["estrelas"] = [
            {
                "nome": e["nome"],
                "altitude": e["altitude"],
                "azimute": e["azimute"],
                "magnitude": e["mag"],
            }
            for e in visiveis
        ]

    if pedido in ("ceu_profundo", "tudo"):
        visiveis = sorted(
            (o for o in ceu["ceu_profundo"].values() if o["visivel"]),
            key=lambda o: o["mag"],
        )[:quantos]

        resultado["ceu_profundo"] = [
            {
                "nome": o["nome"],
                "tipo": o["tipo"],
                "constelacao": o["constelacao"],
                "magnitude": o["mag"],
                "altitude": o["altitude"],
                "azimute": o["azimute"],
            }
            for o in visiveis
        ]

    return resultado


def get_object_position(nome, localizacao=None):
    # Onde está um objeto: um planeta, o Sol, a Lua, uma estrela, um objeto de
    # céu profundo ou uma constelação.
    #
    # Reutiliza o get_observatorio(), que é o mesmo cálculo que desenha o mapa
    # celeste. É mais caro do que pedir só a posição do objeto — calcula o céu
    # todo —, mas garante uma coisa que importa mais: que o número que a IA dá
    # é exatamente o do Observatório. Duas fórmulas diferentes para a mesma
    # pergunta davam duas respostas diferentes, e uma delas estaria errada.
    local = localizacao or LOCATION
    ceu = get_observatorio(localizacao=local)

    # Os astros (Sol, Lua, planetas) vêm numa lista e não num dicionário, por
    # isso levam um id próprio para poderem entrar na mesma procura dos outros.
    astros = {a["id"]: a for a in ceu["astros"]}

    # Todos os candidatos numa lista só, pela ordem em que se prefere
    # encontrá-los, com o tipo já agarrado a cada um.
    candidatos = (
        [("astro", d) for d in astros.values()]
        + [("estrela", d) for d in ceu["estrelas"].values()]
        + [("ceu_profundo", d) for d in ceu["ceu_profundo"].values()]
        + [("constelacao", d) for d in ceu["constelacoes"].values()]
    )

    alvo = sem_acentos(nome or "").strip()
    achado = None

    # Três passagens pelo conjunto todo — acerto exato, depois começo, depois
    # "contém" — em vez de uma passagem por grupo. Assim um acerto exato no
    # fim da lista ganha a um acerto solto no princípio, que é o que faz "Órion"
    # dar a constelação e não a Nebulosa de Orion (ver o _casa).
    for modo in ("exato", "comeca", "contem"):
        for grupo, dados in candidatos:
            if alvo and _casa(alvo, dados.get("nome"), modo):
                achado = (grupo, dados)
                break
        if achado:
            break

    if achado:
        grupo, dados = achado

        # Uma constelação é uma região do céu, não um ponto: não tem altitude
        # nem azimute. Devolver os da sua estrela mais brilhante seria inventar
        # uma posição que o Observatório não mostra em lado nenhum.
        if grupo == "constelacao":
            # A constelação responde com a visibilidade que se tira das suas
            # estrelas (ver o _constelacao_info). Continua a não ter uma
            # altitude só sua — o que vai é a da estrela mais alta dela.
            return {
                **_constelacao_info(ceu, dados),
                "encontrado": True,
                "tipo": "constelacao",
                "nota": ("Uma constelação é uma área do céu, não um ponto: não "
                         "tem uma altitude e um azimute só seus. A altitude "
                         "aqui é a da sua estrela mais alta."),
                "localizacao": local["nome"],
            }

        return {
            "encontrado": True,
            "nome": dados["nome"],
            "tipo": grupo,
            "altitude": dados["altitude"],
            "azimute": dados["azimute"],
            "visivel": dados["visivel"],
            "localizacao": local["nome"],
        }

    # Não se encontrou nada. Dizer QUE não se encontrou é mais útil do que
    # devolver uma posição aproximada de outra coisa qualquer.
    return {
        "encontrado": False,
        "procurado": nome,
        "nota": "Não há nenhum objeto com esse nome no catálogo da AstroGuide.",
    }


def get_moon_phase(ano=None, mes=None, dia=None, localizacao=None):
    # A fase da Lua num dia. Sem data, é hoje.
    #
    # Usa o get_fase_lua_dia() — a mesma função que o Calendário Cósmico usa
    # para desenhar os emojis da Lua em cada casa. É de meia em meia hora que a
    # fase muda de nome, e não é por a IA olhar para ela que passa a ser outra.
    local = localizacao or LOCATION
    hoje = _hoje(local)

    try:
        ano = int(ano) if ano is not None else hoje.year
        mes = int(mes) if mes is not None else hoje.month
        dia = int(dia) if dia is not None else hoje.day
        data = datetime.date(ano, mes, dia)
    except (TypeError, ValueError):
        return {"encontrado": False,
                "nota": "A data pedida não existe no calendário."}

    fase = None
    try:
        fase = get_fase_lua_dia(data.year, data.month, data.day)
    except EphemerisRangeError:
        # A efeméride que o AstroGuide usa (DE421) cobre 1899–2053, e fora
        # daí ela própria levanta erro. Aqui isso não pode vir à superfície:
        # o executar() até apanhava a exceção, mas a pessoa acabava por ler
        # "ephemeris segment only covers dates..." — erro a sério, em inglês
        # e sem dizer o que fazer. O que se diz é o mesmo que a aplicação já
        # diz noutros sítios: aquela data está fora do que se consegue calcular.
        return {
            "encontrado": False,
            "data": data.isoformat(),
            "nota": (f"A AstroGuide só calcula fases entre 1899 e 2053 — "
                     f"{data.isoformat()} está fora desse intervalo, e não "
                     f"há fase nenhuma a dar para esse dia."),
        }

    return {
        "encontrado": True,
        "data": data.isoformat(),
        "fase": fase["nome"],
        "emoji": fase["emoji"],
        "iluminacao_percentagem": fase["iluminacao"],
        "localizacao": local["nome"],
    }


def get_next_events(ano=None, mes=None, localizacao=None, limite=5):
    # Os próximos eventos astronómicos: chuvas de meteoros e eclipses.
    #
    # Se for dada uma data, a lista começa nessa data; sem ela, começa hoje.
    # Depois anda para a frente, mês a mês, até juntar os eventos pedidos — é
    # isso que faz a diferença entre "os eventos de agosto" e "os PRÓXIMOS
    # eventos", que é o que se pergunta quando se quer saber quando é o próximo
    # eclipse e ele é para o ano.
    #
    # Os eventos saem do eventos.py, sem lhe tocar. As chuvas de meteoros não
    # têm ano (acontecem todos os anos) e os eclipses têm; a distinção é do
    # eventos.py, e é ele que a faz também aqui.
    local = localizacao or LOCATION
    hoje = _hoje(local)

    # Sem data, a lista começa hoje. Com mês e ano, começa no primeiro dia
    # desse mês: quem pergunta "o que há em dezembro?" quer o mês inteiro, e
    # não o que falta dele.
    inicio = hoje
    if ano is not None and mes is not None:
        try:
            inicio = datetime.date(int(ano), int(mes), 1)
        except (TypeError, ValueError):
            inicio = hoje

    try:
        quantos = max(1, min(int(limite), 20))
    except (TypeError, ValueError):
        quantos = 5

    eventos = []

    # Doze meses é o suficiente para apanhar as chuvas todas, que se repetem
    # ano a ano, e os eclipses que já estejam anunciados.
    for salto in range(13):
        ref = (inicio.replace(day=1) + datetime.timedelta(days=32 * salto)).replace(day=1)
        for e in get_eventos_do_mes(ref.year, ref.month):
            # Um evento sem ano é anual: o ano em que cai é o que está a ser
            # percorrido. Com ano, é o que lá estiver.
            ano_evento = e.get("ano", ref.year)
            try:
                quando = datetime.date(ano_evento, e["mes"], e["dia"])
            except (TypeError, ValueError):
                continue
            if quando < inicio:
                continue
            if any(ev["nome"] == e["nome"] and ev["data"] == quando.isoformat()
                   for ev in eventos):
                continue
            eventos.append({
                "nome": e["nome"],
                "tipo": e["tipo"],
                "emoji": e.get("emoji", "✦"),
                "data": quando.isoformat(),
                "descricao": e.get("descricao", ""),
            })

        eventos.sort(key=lambda ev: ev["data"])
        if len(eventos) >= quantos:
            break

    return {
        "a_partir_de": inicio.isoformat(),
        "eventos": eventos[:quantos],
        "localizacao": local["nome"],
    }


# ── O catálogo ────────────────────────────────────────────────────────────────
# O que a IA vê. A descrição é a parte que interessa: é ela que decide quando o
# modelo acha que deve chamar a ferramenta, e por isso explica também quando
# NÃO a deve chamar — sem isso, um modelo entusiasta chamava a ferramenta da
# Lua a quem perguntasse o que é um quarto minguante.

CATALOGO = [
    {
        "nome": "get_sky_now",
        "descricao": (
            "Devolve o que está no céu AGORA no local do utilizador: os astros "
            "do sistema solar (Sol, Lua e os sete planetas, com a distância à "
            "Terra e a fase da Lua), as constelações, as estrelas mais "
            "brilhantes e os objetos de céu profundo. Cada um leva a altitude "
            "(0° no horizonte, 90° mesmo por cima da cabeça) e o azimute (0° "
            "Norte, 90° Este, 180° Sul, 270° Oeste), e se está acima do "
            "horizonte.\n"
            "Usa esta ferramenta sempre que a pergunta for sobre o que se vê "
            "no céu neste momento: que planetas, estrelas ou constelações "
            "estão visíveis, qual está mais alto, ou qual está mais perto.\n"
            "Atenção a 'mais perto', que tem dois sentidos: em distancia_ua é "
            "a distância à Terra, e em altitude_maxima é o quanto o objeto "
            "está levantado no céu. Se a pergunta não distinguir, responde ao "
            "que ela pede."
        ),
        "parametros": {
            "type": "object",
            "properties": {
                "tipo": {
                    "type": "string",
                    "enum": ["tudo", "planetas", "constelacoes", "estrelas",
                             "ceu_profundo"],
                    "description": ("O que pedir ao céu. 'tudo' devolve tudo o "
                                    "que está em cima; usa um tipo só quando a "
                                    "pergunta for claramente sobre ele. Por "
                                    "omissão, 'tudo'."),
                },
                "limite": {
                    "type": "integer",
                    "description": ("Quantas estrelas e objetos de céu "
                                    "profundo devolver, dos mais brilhantes "
                                    "para os mais fracos. Por omissão, 10."),
                },
            },
        },
        "funcao": get_sky_now,
    },
    {
        "nome": "get_object_position",
        "descricao": (
            "Devolve a posição atual de um objeto celeste — um planeta, o Sol, "
            "a Lua, uma estrela, um objeto de céu profundo (galáxia, nebulosa, "
            "enxame) ou uma constelação — com altitude, azimute e se está "
            "visível. Para uma constelação devolve a visibilidade e a altitude "
            "da sua estrela mais alta, e não uma posição única, porque uma "
            "constelação é uma área do céu. Usa esta ferramenta quando for dado "
            "o NOME de um objeto e se quiser saber onde ele está ou se está "
            "visível; para saber o que está no céu em geral, usa antes a "
            "get_sky_now."
        ),
        "parametros": {
            "type": "object",
            "properties": {
                "nome": {
                    "type": "string",
                    "description": ("O nome do objeto, como o utilizador o "
                                    "escreveu. Exemplos: 'Júpiter', 'Polaris', "
                                    "'M45', 'Órion'."),
                },
            },
            "required": ["nome"],
        },
        "funcao": get_object_position,
    },
    {
        "nome": "get_moon_phase",
        "descricao": (
            "Devolve a fase da Lua (nome, emoji e percentagem de iluminação) "
            "numa data. Sem data, devolve a de hoje. As datas têm de ficar "
            "entre 1899 e 2053 — fora daí não há dados, e ela própria o diz. "
            "Usa esta ferramenta "
            "sempre que a pergunta for sobre a fase da Lua numa data — NÃO "
            "uses isto para explicar o que é uma fase da Lua; isso é "
            "conhecimento geral e não precisa de dados."
        ),
        "parametros": {
            "type": "object",
            "properties": {
                "ano": {"type": "integer", "description": "Ano, ex: 2026."},
                "mes": {"type": "integer", "description": "Mês, de 1 a 12."},
                "dia": {"type": "integer", "description": "Dia do mês."},
            },
        },
        "funcao": get_moon_phase,
    },
    {
        "nome": "get_next_events",
        "descricao": (
            "Devolve os próximos eventos astronómicos do catálogo da "
            "AstroGuide — chuvas de meteoros e eclipses — a partir de hoje ou "
            "de uma data indicada, com a data, o tipo e uma descrição. Usa "
            "esta ferramenta quando a pergunta for sobre o que vem a seguir "
            "no céu: a próxima chuva de meteoros, o próximo eclipse, ou o que "
            "acontece este mês."
        ),
        "parametros": {
            "type": "object",
            "properties": {
                "ano": {"type": "integer", "description": "Ano de início, ex: 2026."},
                "mes": {"type": "integer", "description": "Mês de início, de 1 a 12."},
                "limite": {
                    "type": "integer",
                    "description": "Quantos eventos devolver. Por omissão, 5.",
                },
            },
        },
        "funcao": get_next_events,
    },
]


# ── O executor ────────────────────────────────────────────────────────────────

def executar(nome, argumentos=None, localizacao=None):
    # Corre a ferramenta pedida pelo modelo e devolve o que ela der.
    #
    # A localização vem de fora e sobrepõe-se a qualquer coisa que o modelo
    # invente: o modelo pode escolher QUAL ferramenta chamar e com que
    # argumentos, mas não decide de onde se está a olhar o céu. Sem isto, um
    # pedido com a localização lá dentro era uma maneira de o modelo — ou de
    # quem escrevesse no painel — pedir o céu de outro sítio que não o da
    # conta.
    #
    # Nunca deixa subir uma exceção: quem chama isto está a meio de responder a
    # alguém, e um erro de uma ferramenta deve virar uma frase, não acabar com
    # a conversa.
    argumentos = dict(argumentos or {})
    argumentos.pop("localizacao", None)

    for ferramenta in CATALOGO:
        if ferramenta["nome"] != nome:
            continue

        try:
            return {
                "ok": True,
                "resultado": ferramenta["funcao"](localizacao=localizacao, **argumentos),
            }
        except TypeError as e:
            # Quase sempre é o modelo a inventar um argumento que a ferramenta
            # não aceita. Dizer-lhe isso ajuda-o a corrigir na tentativa
            # seguinte; engolir o erro deixava-o a repetir a mesma chamada.
            return {"ok": False, "erro": f"Argumentos inválidos para {nome}: {e}"}
        except Exception as e:
            return {"ok": False, "erro": f"A ferramenta {nome} falhou: {e}"}

    return {"ok": False, "erro": f"Não existe nenhuma ferramenta chamada '{nome}'."}
