# ============================================================
#  cidades.py — Catálogo de cidades, com coordenadas e fuso
#
#  É a lista que permite escolher uma localização pelo nome
#  ("Lisboa, Portugal") em vez de escrever latitude e longitude
#  à mão. Cada entrada traz tudo o que os cálculos do céu
#  precisam: as coordenadas, a elevação e o fuso horário.
#
#  Porque uma lista local e não só um serviço na internet: o
#  servidor tem de responder à procura enquanto a pessoa escreve
#  (uma ida à rede por cada tecla seria lenta e frágil), e a
#  aplicação tem de continuar a funcionar sem rede — é a mesma
#  razão por que o SQLite vive dentro do Python (ver o db.py).
#  A rede fica para o que a lista não tiver (ver geocoding.py).
# ============================================================

import unicodedata


# ── Os dados ──────────────────────────────────────────────────────────────────
# Uma linha por cidade, pela ordem dos campos de _CAMPOS abaixo. Estão assim, e
# não como dicionários, porque assim lêem-se umas por baixo das outras e
# comparam-se de vista — um dicionário por cidade dava oito linhas cada e
# escondia a lista inteira.
#
# As coordenadas são do centro da cidade e as elevações são aproximadas: para
# apontar um telescópio, uma centena de metros não se nota (ver o observador_de,
# no sky_engine, que é onde a elevação entra). Quem quiser o ponto exato procura
# a cidade que não esteja nesta lista, e aí a resposta vem do serviço de
# geocoding, que dá o valor medido.
#
# O último campo é o nome na língua de origem, para procurar sem traduzir: quem
# escreve "London" ou "New York" também tem de encontrar a cidade, apesar de a
# lista estar em português.
_CAMPOS = ("cidade", "pais", "regiao", "latitude", "longitude", "elevacao", "timezone", "alias")

_BRUTO = (
    # ── Portugal ─────────────────────────────────────────────────────────────
    ("Lisboa", "Portugal", "Lisboa", 38.7169, -9.1399, 2, "Europe/Lisbon", ""),
    ("Porto", "Portugal", "Porto", 41.1496, -8.6110, 104, "Europe/Lisbon", ""),
    ("Vila Nova de Gaia", "Portugal", "Porto", 41.1239, -8.6117, 75, "Europe/Lisbon", "Gaia"),
    ("Braga", "Portugal", "Braga", 41.5454, -8.4265, 190, "Europe/Lisbon", ""),
    ("Coimbra", "Portugal", "Coimbra", 40.2033, -8.4103, 25, "Europe/Lisbon", ""),
    ("Aveiro", "Portugal", "Aveiro", 40.6443, -8.6455, 10, "Europe/Lisbon", ""),
    ("Faro", "Portugal", "Faro", 37.0194, -7.9304, 10, "Europe/Lisbon", ""),
    ("Setúbal", "Portugal", "Setúbal", 38.5244, -8.8882, 15, "Europe/Lisbon", ""),
    ("Évora", "Portugal", "Évora", 38.5714, -7.9135, 300, "Europe/Lisbon", ""),
    ("Beja", "Portugal", "Beja", 38.0151, -7.8632, 280, "Europe/Lisbon", ""),
    ("Castelo Branco", "Portugal", "Castelo Branco", 39.8222, -7.4909, 380, "Europe/Lisbon", ""),
    ("Guarda", "Portugal", "Guarda", 40.5373, -7.2652, 1056, "Europe/Lisbon", ""),
    ("Leiria", "Portugal", "Leiria", 39.7436, -8.8071, 50, "Europe/Lisbon", ""),
    ("Viseu", "Portugal", "Viseu", 40.6566, -7.9122, 480, "Europe/Lisbon", ""),
    ("Vila Real", "Portugal", "Vila Real", 41.3006, -7.7441, 450, "Europe/Lisbon", ""),
    ("Bragança", "Portugal", "Bragança", 41.8061, -6.7567, 700, "Europe/Lisbon", ""),
    ("Santarém", "Portugal", "Santarém", 39.2362, -8.6859, 30, "Europe/Lisbon", ""),
    ("Portalegre", "Portugal", "Portalegre", 39.2967, -7.4285, 460, "Europe/Lisbon", ""),
    ("Viana do Castelo", "Portugal", "Viana do Castelo", 41.6932, -8.8329, 10, "Europe/Lisbon", ""),
    ("Sintra", "Portugal", "Lisboa", 38.8029, -9.3817, 200, "Europe/Lisbon", ""),
    ("Cascais", "Portugal", "Lisboa", 38.6979, -9.4215, 20, "Europe/Lisbon", ""),
    ("Almada", "Portugal", "Setúbal", 38.6790, -9.1569, 60, "Europe/Lisbon", ""),
    ("Portimão", "Portugal", "Faro", 37.1367, -8.5398, 10, "Europe/Lisbon", ""),
    ("Fátima", "Portugal", "Santarém", 39.6325, -8.6731, 320, "Europe/Lisbon", ""),
    # A Torre é o ponto mais alto de Portugal continental — um destino de quem
    # observa, e por isso vale mais nesta lista do que a sua população sugeria.
    ("Serra da Estrela (Torre)", "Portugal", "Guarda", 40.3219, -7.6130, 1993, "Europe/Lisbon", "Torre"),
    ("Ponta Delgada", "Portugal", "Açores", 37.7412, -25.6756, 30, "Atlantic/Azores", ""),
    ("Angra do Heroísmo", "Portugal", "Açores", 38.6532, -27.2167, 20, "Atlantic/Azores", ""),
    ("Horta", "Portugal", "Açores", 38.5347, -28.6266, 20, "Atlantic/Azores", ""),
    ("Funchal", "Portugal", "Madeira", 32.6669, -16.9241, 25, "Atlantic/Madeira", ""),

    # ── Espanha ──────────────────────────────────────────────────────────────
    ("Madrid", "Espanha", "Comunidade de Madrid", 40.4168, -3.7038, 650, "Europe/Madrid", ""),
    ("Barcelona", "Espanha", "Catalunha", 41.3874, 2.1686, 12, "Europe/Madrid", ""),
    ("Sevilha", "Espanha", "Andaluzia", 37.3891, -5.9845, 11, "Europe/Madrid", "Sevilla"),
    ("Valência", "Espanha", "Comunidade Valenciana", 39.4699, -0.3763, 15, "Europe/Madrid", "Valencia"),
    ("Bilbau", "Espanha", "País Basco", 43.2630, -2.9350, 30, "Europe/Madrid", "Bilbao"),
    ("Málaga", "Espanha", "Andaluzia", 36.7213, -4.4214, 8, "Europe/Madrid", ""),
    ("Granada", "Espanha", "Andaluzia", 37.1773, -3.5986, 738, "Europe/Madrid", ""),
    ("Santiago de Compostela", "Espanha", "Galiza", 42.8782, -8.5448, 260, "Europe/Madrid", ""),
    ("Vigo", "Espanha", "Galiza", 42.2406, -8.7207, 30, "Europe/Madrid", ""),
    ("Salamanca", "Espanha", "Castela e Leão", 40.9701, -5.6635, 800, "Europe/Madrid", ""),
    ("Saragoça", "Espanha", "Aragão", 41.6488, -0.8891, 200, "Europe/Madrid", "Zaragoza"),
    ("Toledo", "Espanha", "Castela-Mancha", 39.8628, -4.0273, 530, "Europe/Madrid", ""),
    ("Badajoz", "Espanha", "Estremadura", 38.8794, -6.9707, 180, "Europe/Madrid", ""),
    ("Palma de Maiorca", "Espanha", "Ilhas Baleares", 39.5696, 2.6502, 15, "Europe/Madrid", "Palma"),
    ("Las Palmas", "Espanha", "Ilhas Canárias", 28.1235, -15.4363, 10, "Atlantic/Canary", "Las Palmas de Gran Canaria"),
    ("Santa Cruz de Tenerife", "Espanha", "Ilhas Canárias", 28.4636, -16.2518, 10, "Atlantic/Canary", "Tenerife"),

    # ── Resto da Europa ──────────────────────────────────────────────────────
    ("Paris", "França", "Ilha de França", 48.8566, 2.3522, 35, "Europe/Paris", ""),
    ("Marselha", "França", "Provença", 43.2965, 5.3698, 12, "Europe/Paris", "Marseille"),
    ("Lyon", "França", "Auvérnia-Ródano-Alpes", 45.7640, 4.8357, 173, "Europe/Paris", ""),
    ("Bordéus", "França", "Nova Aquitânia", 44.8378, -0.5792, 6, "Europe/Paris", "Bordeaux"),
    ("Toulouse", "França", "Occitânia", 43.6047, 1.4442, 146, "Europe/Paris", ""),
    ("Nice", "França", "Provença", 43.7102, 7.2620, 10, "Europe/Paris", ""),
    ("Londres", "Reino Unido", "Inglaterra", 51.5074, -0.1278, 11, "Europe/London", "London"),
    ("Manchester", "Reino Unido", "Inglaterra", 53.4808, -2.2426, 38, "Europe/London", ""),
    ("Edimburgo", "Reino Unido", "Escócia", 55.9533, -3.1883, 47, "Europe/London", "Edinburgh"),
    ("Dublim", "Irlanda", "Leinster", 53.3498, -6.2603, 20, "Europe/Dublin", "Dublin"),
    ("Bruxelas", "Bélgica", "Bruxelas", 50.8503, 4.3517, 56, "Europe/Brussels", "Brussels"),
    ("Antuérpia", "Bélgica", "Flandres", 51.2194, 4.4025, 8, "Europe/Brussels", "Antwerpen"),
    ("Amesterdão", "Países Baixos", "Holanda do Norte", 52.3676, 4.9041, 2, "Europe/Amsterdam", "Amsterdam"),
    ("Roterdão", "Países Baixos", "Holanda do Sul", 51.9244, 4.4777, 0, "Europe/Amsterdam", "Rotterdam"),
    ("Berlim", "Alemanha", "Berlim", 52.5200, 13.4050, 34, "Europe/Berlin", "Berlin"),
    ("Munique", "Alemanha", "Baviera", 48.1351, 11.5820, 520, "Europe/Berlin", "München"),
    ("Hamburgo", "Alemanha", "Hamburgo", 53.5511, 9.9937, 6, "Europe/Berlin", "Hamburg"),
    ("Frankfurt", "Alemanha", "Hesse", 50.1109, 8.6821, 112, "Europe/Berlin", ""),
    ("Colónia", "Alemanha", "Renânia do Norte-Vestfália", 50.9375, 6.9603, 53, "Europe/Berlin", "Köln"),
    ("Zurique", "Suíça", "Zurique", 47.3769, 8.5417, 408, "Europe/Zurich", "Zürich"),
    ("Genebra", "Suíça", "Genebra", 46.2044, 6.1432, 375, "Europe/Zurich", "Genève"),
    ("Berna", "Suíça", "Berna", 46.9480, 7.4474, 540, "Europe/Zurich", "Bern"),
    ("Viena", "Áustria", "Viena", 48.2082, 16.3738, 171, "Europe/Vienna", "Wien"),
    ("Roma", "Itália", "Lácio", 41.9028, 12.4964, 21, "Europe/Rome", "Roma"),
    ("Milão", "Itália", "Lombardia", 45.4642, 9.1900, 120, "Europe/Rome", "Milano"),
    ("Nápoles", "Itália", "Campânia", 40.8518, 14.2681, 17, "Europe/Rome", "Napoli"),
    ("Turim", "Itália", "Piemonte", 45.0703, 7.6869, 240, "Europe/Rome", "Torino"),
    ("Atenas", "Grécia", "Ática", 37.9838, 23.7275, 70, "Europe/Athens", "Athína"),
    ("Estocolmo", "Suécia", "Estocolmo", 59.3293, 18.0686, 28, "Europe/Stockholm", "Stockholm"),
    ("Oslo", "Noruega", "Oslo", 59.9139, 10.7522, 23, "Europe/Oslo", ""),
    ("Copenhaga", "Dinamarca", "Capital", 55.6761, 12.5683, 14, "Europe/Copenhagen", "København"),
    ("Helsínquia", "Finlândia", "Uusimaa", 60.1699, 24.9384, 16, "Europe/Helsinki", "Helsinki"),
    ("Reiquiavique", "Islândia", "Capital", 64.1466, -21.9426, 15, "Atlantic/Reykjavik", "Reykjavík"),
    ("Praga", "Chéquia", "Praga", 50.0755, 14.4378, 200, "Europe/Prague", "Praha"),
    ("Budapeste", "Hungria", "Budapeste", 47.4979, 19.0402, 102, "Europe/Budapest", "Budapest"),
    ("Varsóvia", "Polónia", "Mazóvia", 52.2297, 21.0122, 100, "Europe/Warsaw", "Warszawa"),
    ("Cracóvia", "Polónia", "Pequena Polónia", 50.0647, 19.9450, 220, "Europe/Warsaw", "Kraków"),
    ("Bucareste", "Roménia", "Bucareste", 44.4268, 26.1025, 85, "Europe/Bucharest", "București"),
    ("Sófia", "Bulgária", "Sófia", 42.6977, 23.3219, 550, "Europe/Sofia", "Sofia"),
    ("Zagreb", "Croácia", "Zagreb", 45.8150, 15.9819, 158, "Europe/Zagreb", ""),
    ("Liubliana", "Eslovénia", "Eslovénia Central", 46.0569, 14.5058, 295, "Europe/Ljubljana", "Ljubljana"),
    ("Belgrado", "Sérvia", "Belgrado", 44.7866, 20.4489, 117, "Europe/Belgrade", "Beograd"),
    ("Riga", "Letónia", "Riga", 56.9496, 24.1052, 7, "Europe/Riga", "Rīga"),
    ("Vilnius", "Lituânia", "Vilnius", 54.6872, 25.2797, 112, "Europe/Vilnius", ""),
    ("Tallinn", "Estónia", "Harju", 59.4370, 24.7536, 10, "Europe/Tallinn", ""),
    ("Kiev", "Ucrânia", "Kiev", 50.4501, 30.5234, 179, "Europe/Kyiv", "Kyiv"),
    ("Moscovo", "Rússia", "Moscovo", 55.7558, 37.6173, 156, "Europe/Moscow", "Moscow"),
    ("Istambul", "Turquia", "Istambul", 41.0082, 28.9784, 40, "Europe/Istanbul", "İstanbul"),

    # ── África e Médio Oriente ───────────────────────────────────────────────
    ("Casablanca", "Marrocos", "Casablanca-Settat", 33.5731, -7.5898, 50, "Africa/Casablanca", "الدار البيضاء"),
    ("Marraquexe", "Marrocos", "Marraquexe-Safim", 31.6295, -7.9811, 466, "Africa/Casablanca", "Marrakech"),
    ("Tunes", "Tunísia", "Tunes", 36.8065, 10.1815, 4, "Africa/Tunis", "Tunis"),
    ("Argel", "Argélia", "Argel", 36.7538, 3.0588, 24, "Africa/Algiers", "Alger"),
    ("Cairo", "Egito", "Cairo", 30.0444, 31.2357, 23, "Africa/Cairo", "القاهرة"),
    ("Acra", "Gana", "Grande Acra", 5.6037, -0.1870, 61, "Africa/Accra", "Accra"),
    ("Lagos", "Nigéria", "Lagos", 6.5244, 3.3792, 41, "Africa/Lagos", ""),
    ("Nairobi", "Quénia", "Nairobi", -1.2921, 36.8219, 1795, "Africa/Nairobi", ""),
    ("Joanesburgo", "África do Sul", "Gauteng", -26.2041, 28.0473, 1753, "Africa/Johannesburg", "Johannesburg"),
    ("Cidade do Cabo", "África do Sul", "Cabo Ocidental", -33.9249, 18.4241, 25, "Africa/Johannesburg", "Cape Town"),
    ("Telavive", "Israel", "Telavive", 32.0853, 34.7818, 5, "Asia/Jerusalem", "Tel Aviv"),
    ("Dubai", "Emirados Árabes Unidos", "Dubai", 25.2048, 55.2708, 5, "Asia/Dubai", "دبي"),
    ("Doha", "Catar", "Doha", 25.2854, 51.5310, 10, "Asia/Qatar", "الدوحة"),
    ("Riade", "Arábia Saudita", "Riade", 24.7136, 46.6753, 612, "Asia/Riyadh", "Riyadh"),
    ("Teerão", "Irão", "Teerão", 35.6892, 51.3890, 1200, "Asia/Tehran", "Tehran"),

    # ── Ásia e Oceânia ───────────────────────────────────────────────────────
    ("Tóquio", "Japão", "Tóquio", 35.6762, 139.6503, 40, "Asia/Tokyo", "Tokyo"),
    ("Osaka", "Japão", "Osaka", 34.6937, 135.5023, 15, "Asia/Tokyo", ""),
    ("Seul", "Coreia do Sul", "Seul", 37.5665, 126.9780, 38, "Asia/Seoul", "Seoul"),
    ("Pequim", "China", "Pequim", 39.9042, 116.4074, 44, "Asia/Shanghai", "Beijing"),
    ("Xangai", "China", "Xangai", 31.2304, 121.4737, 4, "Asia/Shanghai", "Shanghai"),
    ("Hong Kong", "China", "Hong Kong", 22.3193, 114.1694, 30, "Asia/Hong_Kong", ""),
    ("Singapura", "Singapura", "Singapura", 1.3521, 103.8198, 15, "Asia/Singapore", "Singapore"),
    ("Banguecoque", "Tailândia", "Banguecoque", 13.7563, 100.5018, 2, "Asia/Bangkok", "Bangkok"),
    ("Hanói", "Vietname", "Hanói", 21.0285, 105.8542, 12, "Asia/Ho_Chi_Minh", "Hanoi"),
    ("Jacarta", "Indonésia", "Jacarta", -6.2088, 106.8456, 8, "Asia/Jakarta", "Jakarta"),
    ("Manila", "Filipinas", "Metro Manila", 14.5995, 120.9842, 16, "Asia/Manila", ""),
    ("Bombaim", "Índia", "Maarastra", 19.0760, 72.8777, 14, "Asia/Kolkata", "Mumbai"),
    ("Nova Deli", "Índia", "Deli", 28.6139, 77.2090, 216, "Asia/Kolkata", "New Delhi"),
    ("Bangalore", "Índia", "Carnata", 12.9716, 77.5946, 920, "Asia/Kolkata", "Bengaluru"),
    ("Catmandu", "Nepal", "Bagmati", 27.7172, 85.3240, 1400, "Asia/Kathmandu", "Kathmandu"),
    ("Sydney", "Austrália", "Nova Gales do Sul", -33.8688, 151.2093, 20, "Australia/Sydney", ""),
    ("Melbourne", "Austrália", "Vitória", -37.8136, 144.9631, 31, "Australia/Melbourne", ""),
    ("Brisbane", "Austrália", "Queensland", -27.4698, 153.0251, 28, "Australia/Brisbane", ""),
    ("Adelaide", "Austrália", "Austrália do Sul", -34.9285, 138.6007, 50, "Australia/Adelaide", ""),
    ("Perth", "Austrália", "Austrália Ocidental", -31.9505, 115.8605, 32, "Australia/Perth", ""),
    ("Auckland", "Nova Zelândia", "Auckland", -36.8485, 174.7633, 26, "Pacific/Auckland", ""),
    ("Wellington", "Nova Zelândia", "Wellington", -41.2865, 174.7762, 30, "Pacific/Auckland", ""),
    ("Honolulu", "Estados Unidos", "Havaí", 21.3069, -157.8583, 6, "Pacific/Honolulu", ""),

    # ── Américas ─────────────────────────────────────────────────────────────
    ("Nova Iorque", "Estados Unidos", "Nova Iorque", 40.7128, -74.0060, 10, "America/New_York", "New York"),
    ("Boston", "Estados Unidos", "Massachusetts", 42.3601, -71.0589, 43, "America/New_York", ""),
    ("Washington", "Estados Unidos", "Distrito de Colúmbia", 38.9072, -77.0369, 20, "America/New_York", "Washington DC"),
    ("Miami", "Estados Unidos", "Flórida", 25.7617, -80.1918, 2, "America/New_York", ""),
    ("Chicago", "Estados Unidos", "Illinois", 41.8781, -87.6298, 181, "America/Chicago", ""),
    ("Houston", "Estados Unidos", "Texas", 29.7604, -95.3698, 13, "America/Chicago", ""),
    ("Denver", "Estados Unidos", "Colorado", 39.7392, -104.9903, 1609, "America/Denver", ""),
    ("Los Angeles", "Estados Unidos", "Califórnia", 34.0522, -118.2437, 71, "America/Los_Angeles", ""),
    ("São Francisco", "Estados Unidos", "Califórnia", 37.7749, -122.4194, 16, "America/Los_Angeles", "San Francisco"),
    ("Seattle", "Estados Unidos", "Washington", 47.6062, -122.3321, 56, "America/Los_Angeles", ""),
    ("Toronto", "Canadá", "Ontário", 43.6532, -79.3832, 76, "America/Toronto", ""),
    ("Montreal", "Canadá", "Quebec", 45.5017, -73.5673, 36, "America/Toronto", "Montréal"),
    ("Vancouver", "Canadá", "Colúmbia Britânica", 49.2827, -123.1207, 2, "America/Vancouver", ""),
    ("Cidade do México", "México", "Cidade do México", 19.4326, -99.1332, 2240, "America/Mexico_City", "Ciudad de México"),
    ("Havana", "Cuba", "Havana", 23.1136, -82.3666, 59, "America/Havana", "La Habana"),
    ("São Paulo", "Brasil", "São Paulo", -23.5505, -46.6333, 760, "America/Sao_Paulo", ""),
    ("Rio de Janeiro", "Brasil", "Rio de Janeiro", -22.9068, -43.1729, 11, "America/Sao_Paulo", ""),
    ("Brasília", "Brasil", "Distrito Federal", -15.7939, -47.8828, 1172, "America/Sao_Paulo", ""),
    ("Belo Horizonte", "Brasil", "Minas Gerais", -19.9167, -43.9345, 852, "America/Sao_Paulo", ""),
    ("Salvador", "Brasil", "Baía", -12.9777, -38.5016, 8, "America/Bahia", ""),
    ("Recife", "Brasil", "Pernambuco", -8.0476, -34.8770, 4, "America/Recife", ""),
    ("Fortaleza", "Brasil", "Ceará", -3.7319, -38.5267, 16, "America/Fortaleza", ""),
    ("Porto Alegre", "Brasil", "Rio Grande do Sul", -30.0346, -51.2177, 10, "America/Sao_Paulo", ""),
    ("Curitiba", "Brasil", "Paraná", -25.4284, -49.2733, 935, "America/Sao_Paulo", ""),
    ("Manaus", "Brasil", "Amazonas", -3.1190, -60.0217, 92, "America/Manaus", ""),
    ("Buenos Aires", "Argentina", "Buenos Aires", -34.6037, -58.3816, 25, "America/Argentina/Buenos_Aires", ""),
    ("Santiago", "Chile", "Região Metropolitana", -33.4489, -70.6693, 570, "America/Santiago", ""),
    ("Lima", "Peru", "Lima", -12.0464, -77.0428, 154, "America/Lima", ""),
    ("Bogotá", "Colômbia", "Cundinamarca", 4.7110, -74.0721, 2640, "America/Bogota", "Bogota"),
    ("Caracas", "Venezuela", "Distrito Capital", 10.4806, -66.9036, 900, "America/Caracas", ""),
    ("Montevideu", "Uruguai", "Montevideu", -34.9011, -56.1645, 43, "America/Montevideo", "Montevideo"),
)


def _sem_acentos(texto):
    # "São Paulo" -> "sao paulo". É o que faz a procura funcionar sem a pessoa
    # ter de acertar nos acentos nem na caixa — ninguém escreve "SÃO PAULO"
    # para procurar São Paulo, e quem escreve "santarem" tem de encontrar
    # Santarém.
    #
    # O NFD separa cada letra do acento que leva (o "é" vira "e" + acento) e o
    # filtro deita fora o que for marcação de acento. Fica uma letra só.
    decomposto = unicodedata.normalize("NFD", texto)
    return "".join(c for c in decomposto if unicodedata.category(c) != "Mn").lower()


def _sem_pontuacao(texto):
    # A vírgula (e o resto da pontuação) vira espaço, antes de a procura ser
    # partida em palavras.
    #
    # Sem isto, "Lisboa, Portugal" não encontrava Lisboa: o que se divide em
    # palavras era "lisboa," e "portugal", e a primeira não está contida em
    # "lisboa portugal lisboa" por causa da vírgula agarrada. É a maneira mais
    # natural de escrever um sítio — e é como os resultados desta lista são
    # mostrados no ecrã ("Lisboa, Portugal") — por isso é a primeira coisa que
    # alguém escreve no campo.
    return "".join(" " if unicodedata.category(c).startswith("P") else c for c in texto)


def _preparar(entrada):
    # Dá a cada cidade os campos da lista mais os dois que só servem para
    # procurar: "_texto" (tudo o que se pode escrever para a encontrar) e
    # "_palavras" (as palavras do nome, para reconhecer um começo de palavra).
    cidade = dict(zip(_CAMPOS, entrada))
    cidade["_texto"] = _sem_acentos(" ".join(
        (cidade["cidade"], cidade["pais"], cidade["regiao"], cidade["alias"])
    ))
    cidade["_palavras"] = [
        _sem_acentos(p) for p in (cidade["cidade"] + " " + cidade["alias"]).split() if p
    ]
    # O nome da cidade sozinho, já sem acentos, para a comparação exata do
    # _pontuar ("lisboa" tal e qual vale mais do que "lisboa" no meio de outra
    # coisa). Fica calculado aqui, uma vez por cidade, e não a cada procura.
    cidade["_nome_limpo"] = _sem_acentos(cidade["cidade"])
    return cidade


CIDADES = [_preparar(e) for e in _BRUTO]


# ── Procura ───────────────────────────────────────────────────────────────────

def _pontuar(cidade, palavras):
    # 0 significa "não serve". Devolve-se a pontuação em vez de um simples
    # sim/não porque a ordem por que os resultados aparecem é o que faz a
    # procura parecer certa: quem escreve "por" quer o Porto à frente de
    # Portalegre, e quem escreve "portugal" quer a lista toda.
    #
    # A pontuação vem da MELHOR palavra escrita, e não da primeira. Quem
    # escreve "Lisboa, Portugal" está a dizer o mesmo que quem escreve
    # "Portugal, Lisboa", e nos dois casos o que interessa é que uma das
    # palavras é "lisboa" — com a primeira a mandar, "Lisboa, Portugal" dava a
    # mesma pontuação a Lisboa e a Cascais (o distrito de Cascais é Lisboa), e
    # a ordem saía por ordem alfabética.
    if not all(p in cidade["_texto"] for p in palavras):
        return 0

    nome = cidade["_nome_limpo"]
    melhor = 0
    for palavra in palavras:
        if nome == palavra:
            melhor = max(melhor, 100)
        elif nome.startswith(palavra):
            melhor = max(melhor, 90)
        elif any(p.startswith(palavra) for p in cidade["_palavras"]):
            melhor = max(melhor, 70)
        elif palavra in nome:
            melhor = max(melhor, 50)

    if melhor:
        return melhor

    # Chegou aqui porque cada palavra aparece algures (no país, na região ou no
    # nome de origem), mas nenhuma serve para ordenar: é o caso de procurar
    # "portugal" ou "espanha", em que a resposta certa é a lista toda daquele
    # país. Estas ficam à frente de nada e atrás de todas as outras.
    return _PONTOS_SO_PELO_TEXTO


# A pontuação de quem só coincidiu no texto que acompanha o nome (o país, a
# região, um nome de origem) e não no nome em si. É fraca de propósito: serve
# para responder a "portugal", e nunca para competir com uma terra que se
# chama mesmo aquilo que se escreveu.
_PONTOS_SO_PELO_TEXTO = 20


def procurar(termo, limite=8):
    # As cidades que correspondem ao que se escreveu, da mais provável para a
    # menos. Uma procura vazia não devolve a lista toda: quem ainda não
    # escreveu nada não quer 150 resultados.
    alvo = _sem_acentos(_sem_pontuacao(termo or ""))
    if not alvo:
        return []

    palavras = alvo.split()
    resultados = []
    for cidade in CIDADES:
        pontos = _pontuar(cidade, palavras)
        if pontos:
            resultados.append((pontos, cidade))

    # Quando há terras que se chamam mesmo o que se escreveu, as que só
    # coincidiram por causa do país ou da região saem da lista.
    #
    # Sem isto, escrever "port" devolvia o Porto, Portimão e Portalegre — que é
    # a resposta — e, atrás deles, Beja, Braga e Faro, que só lá estavam porque
    # a região delas se chama "Portugal". Numa lista de sugestões isso lê-se
    # como um erro, e a pessoa deixa de confiar nas linhas de cima, que estavam
    # certas.
    #
    # A exceção é a procura que só o texto responde: "portugal" e "espanha" não
    # têm nome nenhum que lhes corresponda, e é essa a lista que se quer ver.
    # É por isso que o corte é condicional, e não um filtro fixo.
    if any(pontos > _PONTOS_SO_PELO_TEXTO for pontos, _ in resultados):
        resultados = [(pontos, cidade) for pontos, cidade in resultados
                      if pontos > _PONTOS_SO_PELO_TEXTO]

    # O desempate é pelo comprimento do nome, e só depois alfabético.
    #
    # Com dois nomes igualmente bons — "por" abre o Porto, Portalegre e
    # Portimão da mesma maneira — ganha o mais curto, que é o que menos letras
    # gastou a dizer a mesma coisa: quem escreveu três letras quer o "Porto", e
    # não a "Portalegre". Sem isto a ordem saía alfabética, e uma procura a
    # meio vinha com a resposta menos provável à frente.
    resultados.sort(key=lambda par: (-par[0], len(par[1]["cidade"]), par[1]["cidade"]))

    return [
        {chave: cidade[chave] for chave in _CAMPOS if chave != "alias"}
        for _, cidade in resultados[:limite]
    ]
