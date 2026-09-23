# ============================================================
#  ceu_profundo.py — Catálogo de objetos de céu profundo
#  Coordenadas celestes (J2000) de galáxias, nebulosas e
#  enxames de estrelas observáveis de Vila Nova de Gaia.
#
#  Ficheiro de DADOS, ao lado do estrelas.py e no mesmo
#  espírito: não tem uma linha de cálculo. Quem lhes dá
#  posição no céu é o sky_engine.py, e é o server.py que
#  junta as duas coisas — a mesma separação que o iss.py
#  explica no seu cabeçalho, ainda que por outra razão: uma
#  estrela, uma galáxia e uma nebulosa são todas objetos
#  fixos do céu, e o catálogo delas não é astronomia.
# ============================================================

# Dicionário com os objetos de Messier escolhidos.
# Estrutura: "id": {"nome", "ra" (horas decimais), "dec" (graus decimais),
#                   "mag", "tipo", "constelacao", "dimensao" (arcmin), "nota"}
#
#   mag      — magnitude INTEGRADA: numa galáxia ou numa nebulosa este brilho
#              está espalhado por toda a área, ao contrário do de uma estrela,
#              que está concentrado num ponto. Não são números comparáveis, e é
#              por isso que o mapa tem um limite de brilho próprio para esta
#              camada, separado do slider das estrelas.
#   dimensao — eixo maior em minutos de arco, para o símbolo no mapa dar uma
#              ideia do tamanho. Não é escala exata (ver index.js).
#   tipo     — "galaxia", "nebulosa", "nebulosa_planetaria", "resto_supernova",
#              "enxame_aberto", "enxame_globular" ou "estrela_dupla". O símbolo
#              e o rótulo de cada um destes vive no index.js.
#
# São 36 objetos e não os 110 do catálogo Messier de propósito: este é o
# conjunto que se vê de facto de Gaia (todos com declinação acima de −35°, ou
# seja, todos nascem acima do horizonte nesta latitude). Os mais fracos que
# ficaram de fora — M76, M97 — precisam de telescópio e ficam para uma próxima.
CATALOGO_CEU_PROFUNDO = {

    # ── Enxames abertos ───────────────────────────────────────────────────────
    # Estrelas nascidas juntas da mesma nuvem e ainda a andar juntas pelo espaço.
    "m45": {
        "nome": "M45 (Plêiades)", "ra": 3.792, "dec": 24.117, "mag": 1.6,
        "tipo": "enxame_aberto", "constelacao": "Taurus", "dimensao": 110,
        "nota": "O objeto mais brilhante da lista; conhecido desde a Antiguidade. A olho nu contam-se seis estrelas, mas o enxame tem mais de mil, a 444 anos-luz daqui.",
    },
    "m44": {
        "nome": "M44 (Presépio)", "ra": 8.673, "dec": 19.983, "mag": 3.7,
        "tipo": "enxame_aberto", "constelacao": "Cancer", "dimensao": 95,
        "nota": "O nome vem da manjedoura do presépio de Natal. É um retângulo de estrelas três vezes mais largo do que a Lua Cheia, e foi um dos primeiros objetos que Galileu apontou com um telescópio, em 1609.",
    },
    "m7": {
        "nome": "M7 (Aglomerado de Ptolomeu)", "ra": 17.898, "dec": -34.817, "mag": 3.3,
        "tipo": "enxame_aberto", "constelacao": "Scorpius", "dimensao": 80,
        "nota": "Já era descrito por Ptolomeu no século II e é dos poucos objetos Messier visíveis a olho nu como uma mancha clara, no fim da cauda do Escorpião.",
    },
    "m6": {
        "nome": "M6 (Aglomerado da Borboleta)", "ra": 17.668, "dec": -32.217, "mag": 4.2,
        "tipo": "enxame_aberto", "constelacao": "Scorpius", "dimensao": 25,
        "nota": "A forma das suas estrelas mais brilhantes lembra um par de asas abertas — daí o nome. Está praticamente colado a M7 no céu.",
    },
    "m11": {
        "nome": "M11 (Aglomerado do Pato Selvagem)", "ra": 18.852, "dec": -6.267, "mag": 5.8,
        "tipo": "enxame_aberto", "constelacao": "Scutum", "dimensao": 14,
        "nota": "Um dos enxames abertos mais ricos e mais densos do céu, com centenas de estrelas amontoadas. O nome não vem da forma: foi um naturalista inglês que o achou parecido com um bando de patos a voar.",
    },
    "m35": {
        "nome": "M35", "ra": 6.151, "dec": 24.333, "mag": 5.1,
        "tipo": "enxame_aberto", "constelacao": "Gemini", "dimensao": 28,
        "nota": "Fica no \"pé\" dos Gémeos e dá-se bem com binóculos. Ao lado dele esconde-se outro enxame, muito mais distante, o NGC 2158.",
    },
    "m41": {
        "nome": "M41", "ra": 6.767, "dec": -20.767, "mag": 4.5,
        "tipo": "enxame_aberto", "constelacao": "Canis Major", "dimensao": 38,
        "nota": "Está quatro graus a sul de Sirius, a estrela mais brilhante do céu noturno — é impossível apontar para Sirius e não lhe passar por cima.",
    },
    "m34": {
        "nome": "M34", "ra": 3.792, "dec": 42.717, "mag": 5.2,
        "tipo": "enxame_aberto", "constelacao": "Perseus", "dimensao": 35,
        "nota": "Um enxame espalhado, sem núcleo denso, com estrelas que se resolvem numa noite escura com binóculos comuns.",
    },
    "m39": {
        "nome": "M39", "ra": 21.537, "dec": 48.433, "mag": 4.6,
        "tipo": "enxame_aberto", "constelacao": "Cygnus", "dimensao": 32,
        "nota": "Fica na direção da Via Láctea, mas pertence à nossa vizinhança: está apenas a 800 anos-luz, uma das concentrações de estrelas jovens mais próximas.",
    },
    "m25": {
        "nome": "M25", "ra": 18.527, "dec": -19.117, "mag": 4.6,
        "tipo": "enxame_aberto", "constelacao": "Sagittarius", "dimensao": 32,
        "nota": "Fica na região do céu mais rica da Via Láctea, e entre as suas estrelas veem-se muitas outras ao fundo — o enxame está à frente de um pano de fundo cheio.",
    },
    "m37": {
        "nome": "M37", "ra": 5.872, "dec": 32.553, "mag": 5.6,
        "tipo": "enxame_aberto", "constelacao": "Auriga", "dimensao": 24,
        "nota": "O mais rico dos três enxames seguidos do Cocheiro (M36, M37 e M38). Uma estrela vermelha no meio destaca-se de todas as outras.",
    },
    "m47": {
        "nome": "M47", "ra": 7.610, "dec": -14.483, "mag": 4.4,
        "tipo": "enxame_aberto", "constelacao": "Puppis", "dimensao": 30,
        "nota": "Messier enganou-se a apontá-lo e registou-o no sítio errado durante dois séculos. É hoje fácil de encontrar a olho nu, na Popa do navio Argo.",
    },

    # ── Enxames globulares ────────────────────────────────────────────────────
    # Centenas de milhares de estrelas velhas, presas numa esfera pela gravidade.
    "m13": {
        "nome": "M13 (Grande Aglomerado de Hércules)", "ra": 16.695, "dec": 36.467, "mag": 5.8,
        "tipo": "enxame_globular", "constelacao": "Hercules", "dimensao": 20,
        "nota": "Uns 300 mil sóis amontoados numa bola, a 25 mil anos-luz. Em 1974 o radiotelescópio de Arecibo enviou-lhe uma mensagem a dizer quem somos e onde estamos — a resposta, se a houver, só chegaria daqui a uns 50 mil anos.",
    },
    "m22": {
        "nome": "M22", "ra": 18.607, "dec": -23.900, "mag": 5.1,
        "tipo": "enxame_globular", "constelacao": "Sagittarius", "dimensao": 32,
        "nota": "Dos globulares mais próximos e maiores — está a uns 10 mil anos-luz — e um dos primeiros a ser descoberto, em 1665.",
    },
    "m3": {
        "nome": "M3", "ra": 13.703, "dec": 28.383, "mag": 6.2,
        "tipo": "enxame_globular", "constelacao": "Canes Venatici", "dimensao": 18,
        "nota": "Com meio milhão de estrelas, é dos maiores globulares. Contém mais estrelas variáveis conhecidas do que qualquer outro — mais de 250.",
    },
    "m5": {
        "nome": "M5", "ra": 15.310, "dec": 2.083, "mag": 5.6,
        "tipo": "enxame_globular", "constelacao": "Serpens", "dimensao": 23,
        "nota": "Um dos globulares mais antigos, com quase 12 mil milhões de anos — nasceu quando a Via Láctea ainda se estava a formar.",
    },
    "m92": {
        "nome": "M92", "ra": 17.285, "dec": 43.133, "mag": 6.4,
        "tipo": "enxame_globular", "constelacao": "Hercules", "dimensao": 14,
        "nota": "Costuma ficar à sombra do vizinho M13, mas é igualmente bonito. Passa despercebido porque nenhuma estrela brilhante aponta para ele.",
    },
    "m15": {
        "nome": "M15", "ra": 21.500, "dec": 12.167, "mag": 6.2,
        "tipo": "enxame_globular", "constelacao": "Pegasus", "dimensao": 18,
        "nota": "O núcleo deste globular é dos mais comprimidos que se conhecem: as estrelas do centro estão amontoadas milhares de vezes mais do que na vizinhança do Sol.",
    },

    # ── Nebulosas ─────────────────────────────────────────────────────────────
    # Nuvens de gás e poeira, umas a formar estrelas, outras a despedaçar-se delas.
    "m42": {
        "nome": "M42 (Nebulosa de Orion)", "ra": 5.588, "dec": -5.391, "mag": 4.0,
        "tipo": "nebulosa", "constelacao": "Orion", "dimensao": 85,
        "nota": "O berçário de estrelas mais próximo da Terra, a 1344 anos-luz, e a nebulosa mais fácil de ver a olho nu, como uma mancha difusa. É a \"estrela\" do meio da espada de Orion.",
    },
    "m8": {
        "nome": "M8 (Nebulosa da Lagoa)", "ra": 18.063, "dec": -24.383, "mag": 6.0,
        "tipo": "nebulosa", "constelacao": "Sagittarius", "dimensao": 90,
        "nota": "Uma nuvem enorme onde estrelas estão a nascer agora, cortada ao meio por uma faixa escura de poeira — daí o nome de lagoa.",
    },
    "m20": {
        "nome": "M20 (Nebulosa Trífida)", "ra": 18.043, "dec": -22.967, "mag": 6.3,
        "tipo": "nebulosa", "constelacao": "Sagittarius", "dimensao": 28,
        "nota": "Três partes, separadas por riscas de poeira. É ao mesmo tempo uma nebulosa de emissão (vermelha) e de reflexão (azul) — as duas coisas no mesmo objeto.",
    },
    "m16": {
        "nome": "M16 (Nebulosa da Águia)", "ra": 18.313, "dec": -13.783, "mag": 6.4,
        "tipo": "nebulosa", "constelacao": "Serpens", "dimensao": 35,
        "nota": "Aqui estão os \"Pilares da Criação\", as colunas de gás fotografadas pelo telescópio Hubble em 1995 que ficaram famosas no mundo inteiro.",
    },
    "m17": {
        "nome": "M17 (Nebulosa do Cisne)", "ra": 18.347, "dec": -16.183, "mag": 6.0,
        "tipo": "nebulosa", "constelacao": "Sagittarius", "dimensao": 46,
        "nota": "Também chamada Ômega. É uma das nebulosas mais brilhantes da Via Láctea e, num telescópio, mostra uma forma que lembra mesmo um cisne a nadar.",
    },
    "m78": {
        "nome": "M78", "ra": 5.778, "dec": 0.067, "mag": 8.3,
        "tipo": "nebulosa", "constelacao": "Orion", "dimensao": 8,
        "nota": "Uma nebulosa de reflexão: não emite luz própria, reflecte a luz azulada de estrelas jovens que estão dentro dela. Fica logo acima do cinto de Orion.",
    },
    "m1": {
        "nome": "M1 (Nebulosa do Caranguejo)", "ra": 5.575, "dec": 22.017, "mag": 8.4,
        "tipo": "resto_supernova", "constelacao": "Taurus", "dimensao": 6,
        "nota": "Os restos de uma estrela que explodiu em 1054 e que os astrónomos chineses viram e registaram. É o primeiro objeto do catálogo de Messier, e o único resto de supernova que lá está.",
    },

    # ── Nebulosas planetárias ─────────────────────────────────────────────────
    # Nada a ver com planetas: é o que sobra de uma estrela parecida com o Sol
    # depois de ela largar as camadas exteriores. O nome ficou do primeiro
    # astrónomo que as viu, e achou que pareciam discos de planetas.
    "m57": {
        "nome": "M57 (Nebulosa do Anel)", "ra": 18.893, "dec": 33.029, "mag": 8.8,
        "tipo": "nebulosa_planetaria", "constelacao": "Lyra", "dimensao": 1.4,
        "nota": "Um anel de gás expulso por uma estrela moribunda, com uma anã branca no centro. É pequena no céu — umas vinte vezes mais pequena do que a Lua Cheia — mas num pequeno telescópio já se vê o buraco no meio.",
    },
    "m27": {
        "nome": "M27 (Nebulosa Halteres)", "ra": 19.993, "dec": 22.721, "mag": 7.5,
        "tipo": "nebulosa_planetaria", "constelacao": "Vulpecula", "dimensao": 8,
        "nota": "A primeira nebulosa planetária alguma vez descoberta, em 1764. Vista de perfil, o anel parece ter duas partes ligadas por um meio mais estreito — daí o nome.",
    },

    # ── Galáxias ──────────────────────────────────────────────────────────────
    # Cada uma destas é um universo-ilha com milhares de milhões de estrelas.
    "m31": {
        "nome": "M31 (Galáxia de Andrómeda)", "ra": 0.712, "dec": 41.269, "mag": 3.4,
        "tipo": "galaxia", "constelacao": "Andromeda", "dimensao": 178,
        "nota": "O objeto mais distante que se vê a olho nu: 2,5 milhões de anos-luz. A luz que dela nos chega esta noite saiu de lá muito antes de existir um único ser humano.",
    },
    "m33": {
        "nome": "M33 (Galáxia do Triângulo)", "ra": 1.565, "dec": 30.660, "mag": 5.7,
        "tipo": "galaxia", "constelacao": "Triangulum", "dimensao": 70,
        "nota": "A terceira maior do Grupo Local, depois de Andrómeda e da Via Láctea. Apesar do brilho, é difícil de ver: está de frente para nós e a luz espalha-se por uma área enorme.",
    },
    "m51": {
        "nome": "M51 (Galáxia do Redemoinho)", "ra": 13.498, "dec": 47.195, "mag": 8.4,
        "tipo": "galaxia", "constelacao": "Canes Venatici", "dimensao": 11,
        "nota": "A primeira galáxia a quem se reconheceu uma forma em espiral, em 1845. Está a trocar matéria com uma galáxia mais pequena que lhe passa ao lado, e é isso que lhe desenha os braços.",
    },
    "m81": {
        "nome": "M81 (Galáxia de Bode)", "ra": 9.926, "dec": 69.065, "mag": 6.9,
        "tipo": "galaxia", "constelacao": "Ursa Major", "dimensao": 27,
        "nota": "Uma das galáxias mais brilhantes do céu, grande e de frente para nós. Faz par com M82, a poucos graus de distância — as duas estão a interagir há mil milhões de anos.",
    },
    "m82": {
        "nome": "M82 (Galáxia do Charuto)", "ra": 9.931, "dec": 69.679, "mag": 8.4,
        "tipo": "galaxia", "constelacao": "Ursa Major", "dimensao": 11,
        "nota": "Vista de perfil, é uma risca comprida. Está a formar estrelas a um ritmo dez vezes maior do que a Via Láctea, empurrada pelo encontro com M81.",
    },
    "m104": {
        "nome": "M104 (Galáxia Sombrero)", "ra": 12.667, "dec": -11.623, "mag": 8.0,
        "tipo": "galaxia", "constelacao": "Virgo", "dimensao": 9,
        "nota": "Vista quase de perfil, com uma faixa escura de poeira a atravessá-la à frente e um núcleo muito brilhante por trás — a forma que lhe deu o nome do chapéu mexicano.",
    },
    "m64": {
        "nome": "M64 (Galáxia do Olho Negro)", "ra": 12.945, "dec": 21.683, "mag": 8.5,
        "tipo": "galaxia", "constelacao": "Coma Berenices", "dimensao": 10,
        "nota": "Tem uma nuvem escura de poeira à volta do núcleo, que lhe dá o aspecto de um olho. O gás interior roda ao contrário do exterior — sinal de que engoliu outra galáxia.",
    },
    "m101": {
        "nome": "M101 (Galáxia do Cata-vento)", "ra": 14.053, "dec": 54.349, "mag": 7.9,
        "tipo": "galaxia", "constelacao": "Ursa Major", "dimensao": 29,
        "nota": "Uma das maiores galáxias em espiral conhecidas, com um bilião de estrelas. Em 2011 explodiu lá uma supernova que ficou visível em pequenos telescópios durante semanas.",
    },

    # ── O caso à parte ────────────────────────────────────────────────────────
    "m40": {
        "nome": "M40", "ra": 12.373, "dec": 58.083, "mag": 8.4,
        "tipo": "estrela_dupla", "constelacao": "Ursa Major", "dimensao": 0.8,
        "nota": "O erro de Messier, em pessoa: ele procurou aqui uma nebulosa que já lhe tinham dito existir e catalogou só um par de estrelas, para não deixar o número vazio. Não há nebulosa nenhuma.",
    },
}
