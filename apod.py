# AstroGuide - Imagem Astronómica do Dia (APOD)
# Busca a "Astronomy Picture of the Day" da NASA e mantém em cache
# (a imagem só muda uma vez por dia, não faz sentido pedir de cada vez)

import requests
import datetime

APOD_URL = "https://api.nasa.gov/planetary/apod"
API_KEY = "DEMO_KEY"  # chave pública de demonstração da NASA (~30 pedidos/hora)

# Cache simples em memória: guarda a última resposta e a data em que foi obtida
_cache = {"data": None, "resultado": None}


def get_imagem_do_dia():
    """
    Devolve a imagem/vídeo astronómico do dia, com título e explicação.
    Usa cache em memória para não repetir o pedido à NASA no mesmo dia.
    """
    hoje = datetime.date.today().isoformat()

    if _cache["data"] == hoje and _cache["resultado"] is not None:
        return _cache["resultado"]  # já temos a imagem de hoje, poupa um pedido à NASA

    resposta = requests.get(APOD_URL, params={"api_key": API_KEY}, timeout=6)
    resposta.raise_for_status()  # lança exceção se a NASA devolver erro (ex: limite excedido)
    dados = resposta.json()

    resultado = {
        "titulo": dados.get("title", "Imagem do Dia"),
        "explicacao": dados.get("explanation", ""),
        "url_imagem": dados.get("url"),
        "url_hd": dados.get("hdurl"),          # versão em alta resolução, se existir
        "tipo_media": dados.get("media_type", "image"),  # "image" ou "video"
        "data": dados.get("date", hoje),
        "autor": dados.get("copyright"),        # nem toda a imagem tem autor (muitas são domínio público da NASA)
    }

    _cache["data"] = hoje
    _cache["resultado"] = resultado
    return resultado