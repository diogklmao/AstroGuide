# AstroGuide - Imagem Astronómica do Dia (APOD)
# Busca a "Astronomy Picture of the Day" da NASA e mantém em cache
# (a imagem só muda uma vez por dia, não faz sentido pedir de cada vez)

import requests
import datetime
import re

APOD_URL = "https://science.nasa.gov/wp-json/wp/v2/apod-basic"
API_KEY = "DEMO_KEY"

# Cache simples em memória
_cache = {"data": None, "resultado": None}


def remover_html(texto):
    """Remove tags HTML presentes na explicação/créditos da nova API."""
    if not texto:
        return ""
    return re.sub(r"<[^>]+>", "", texto).strip()


def get_imagem_do_dia():
    """
    Devolve a imagem/vídeo astronómico mais recente da NASA,
    com título, explicação, imagem, data e autor.

    Usa cache em memória para não repetir pedidos desnecessários.
    """

    hoje = datetime.date.today().isoformat()

    # Se já temos a APOD de hoje em cache, devolve-a
    if _cache["data"] == hoje and _cache["resultado"] is not None:
        return _cache["resultado"]

    resposta = requests.get(
        APOD_URL,
        params={"api_key": API_KEY},
        timeout=6
    )

    resposta.raise_for_status()

    dados = resposta.json()

    # A nova API devolve uma lista de APODs
    if not isinstance(dados, list) or len(dados) == 0:
        raise ValueError("A NASA não devolveu nenhuma APOD.")

    # O primeiro elemento é a APOD mais recente
    apod = dados[0]

    resultado = {
        "titulo": apod.get("title", "Imagem do Dia"),

        "explicacao": remover_html(
            apod.get("explanation", "")
        ),

        # Na nova API, hdurl contém diretamente a imagem
        "url_imagem": apod.get("hdurl"),

        "url_hd": apod.get("hdurl"),

        "tipo_media": apod.get("media_type", "image"),

        "data": apod.get("date", hoje),

        "autor": remover_html(
            apod.get("copyright") or apod.get("credit")
        ),

        # Página oficial da APOD na NASA
        "pagina_nasa": apod.get("url")
    }

    _cache["data"] = hoje
    _cache["resultado"] = resultado

    return resultado