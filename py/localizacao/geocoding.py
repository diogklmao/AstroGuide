# ============================================================
#  geocoding.py — Os nomes de lugares que a lista não tem
#
#  A lista de cidades (ver cidades.py) cobre as terras onde
#  alguém, com alguma probabilidade, aponta um telescópio. Isto
#  é o resto: a aldeia, a cidade pequena, o sítio onde alguém
#  está mesmo quando escreve o nome dele.
#
#  Só entra em ação quando a lista local não devolveu nada (ver
#  o __init__.py). É de propósito: ir à rede por cada tecla
#  escrita tornaria a procura lenta e dependente de haver
#  internet, e a lista responde às cidades comuns sem sair da
#  memória. Aqui é o caminho raro, e pode falhar sem que nada se
#  perca — quem falha recebe o que a lista tiver.
#
#  Nenhum destes serviços pede chave nem conta, e é por isso que
#  foram escolhidos: o projeto corre com "py server.py" sem nada
#  para configurar (é o mesmo critério do SQLite, no db.py).
#  O requests já cá estava para a imagem do dia da NASA (ver
#  apod.py).
# ============================================================

import time

import requests


# Open-Meteo: procura por nome e devolve coordenadas, elevação e — o que
# interessa aqui — o fuso horário IANA ("Europe/Lisbon").
_URL_PROCURA = "https://geocoding-api.open-meteo.com/v1/search"

# BigDataCloud: o contrário — das coordenadas para o nome. É o que permite ao
# botão "usar a localização deste dispositivo" dizer "Lisboa, Portugal" em vez
# de dois números. (O browser sabe as coordenadas mas não o nome do sítio.)
_URL_REVERSA = "https://api.bigdatacloud.net/data/reverse-geocode-client"

# Quatro segundos: chega para uma resposta normal e não é tanto que a procura
# pareça ter encravado. Passado esse tempo, desiste-se e responde-se com o que
# a lista local tinha (é o mesmo espírito do timeout de 6s do apod.py).
_TEMPO_LIMITE = 4

# A mesma pergunta repetida não volta a sair para a rede. A procura é escrita
# tecla a tecla, e sem isto escrever "Vila Franca de Xira" eram dezoito pedidos
# iguais ao serviço — que é gratuito mas não é nosso. Dez minutos chega bem:
# as coordenadas de uma cidade não mudam.
_VALIDADE = 600
_MAX_CACHE = 256
_cache = {}


def _obter_json(url, parametros):
    # Devolve o JSON do endereço, ou None se não se conseguir falar com ele.
    #
    # Falhar não é uma exceção para quem chama: pode ser só não haver internet
    # neste momento, e a aplicação tem de continuar a andar sem isto (é o mesmo
    # princípio que a imagem do dia da NASA e os elementos orbitais da ISS
    # seguem).
    chave = url + "?" + str(sorted(parametros.items()))
    agora = time.time()
    guardado = _cache.get(chave)
    if guardado and guardado[0] > agora:
        return guardado[1]

    try:
        resposta = requests.get(url, params=parametros, timeout=_TEMPO_LIMITE)
        resposta.raise_for_status()
        dados = resposta.json()
    except (requests.RequestException, ValueError):
        # ValueError é o requests.json() a queixar-se de uma resposta que não é
        # JSON (uma página de erro do serviço, por exemplo). Sem ele aqui, isso
        # subia como um erro 500 numa rota que só estava a tentar ajudar.
        return None

    # O cache não cresce sem fim: são procuras escritas à mão numa página de
    # perfil, mas um servidor deixado a correr durante meses acumulava uma
    # entrada por cada procura de sempre. A partir de umas centenas, limpa-se
    # tudo — é mais simples do que andar a tirar as mais antigas, e o que se
    # perde é só uma ida à rede.
    if len(_cache) >= _MAX_CACHE:
        _cache.clear()
    _cache[chave] = (agora + _VALIDADE, dados)
    return dados


def procurar_online(termo, limite=8):
    # As cidades que o serviço conhece com este nome, no mesmo formato das da
    # lista local — é isso que permite ao resto do código tratá-las por igual,
    # sem saber de onde vieram.
    dados = _obter_json(_URL_PROCURA, {
        "name": termo,
        "count": limite,
        "language": "pt",
        "format": "json",
    })
    if not dados:
        return []

    resultados = []
    for linha in dados.get("results") or []:
        latitude = linha.get("latitude")
        longitude = linha.get("longitude")
        # Sem coordenadas não há localização nenhuma para guardar. Um resultado
        # assim é lixo do serviço, e entrava na lista só para depois dar erro.
        if latitude is None or longitude is None:
            continue

        resultados.append({
            "cidade": linha.get("name") or termo,
            "pais": linha.get("country") or "",
            # A região (admin1 é o equivalente a distrito ou estado) é o que
            # distingue as terras com o mesmo nome: há mais do que uma
            # "Vila Nova" no mundo e a pessoa precisa de saber qual escolhe.
            "regiao": linha.get("admin1") or "",
            "latitude": latitude,
            "longitude": longitude,
            "elevacao": linha.get("elevation") or 0,
            "timezone": linha.get("timezone") or "Europe/Lisbon",
        })

    return resultados


def reverter_online(latitude, longitude):
    # Das coordenadas para o nome do sítio onde elas caem. Devolve None quando
    # não se consegue saber — e nesse caso quem chama fica com as coordenadas
    # exatas e sem nome de terra, que é o que já acontecia antes de isto existir.
    dados = _obter_json(_URL_REVERSA, {
        "latitude": latitude,
        "longitude": longitude,
        "localityLanguage": "pt",
    })
    if not dados:
        return None

    # O "city" vem vazio no meio do campo: aí o serviço só sabe a freguesia
    # ("locality") ou o distrito ("principalSubdivision"). Desce-se até haver
    # alguma coisa com que nomear o local, porque um nome vazio não serve para
    # mostrar no ecrã.
    cidade = dados.get("city") or dados.get("locality") or dados.get("principalSubdivision")
    if not cidade:
        return None

    return {
        "cidade": cidade,
        "pais": dados.get("countryName") or "",
        "regiao": dados.get("principalSubdivision") or "",
    }
