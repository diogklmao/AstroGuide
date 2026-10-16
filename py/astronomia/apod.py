# AstroGuide - Imagem Astronómica do Dia (APOD)
# Busca a "Astronomy Picture of the Day" da NASA e mantém em cache
# (a imagem só muda uma vez por dia, não faz sentido pedir de cada vez)

import os
import requests
import datetime
import re
from html import unescape

# As duas APIs da NASA que servem a APOD, por ordem de preferência.
#
# A oficial (api.nasa.gov) vem primeiro porque é a única que diz qual é o
# vídeo: nos dias de vídeo dá o endereço que toca (o do YouTube, quase sempre)
# e a imagem que o representa. A do science.nasa.gov ficou como reserva — e
# nesses dias só dá a página do artigo, que é uma página e não um vídeo. Foi
# por isso que a APOD de vídeo aparecia sem nada para tocar e que o link não
# levava a vídeo nenhum: apontava para o artigo.
#
# As duas usam os mesmos nomes de campos; só diferem na forma — a oficial
# devolve um registo, a outra devolve uma lista deles.
FONTES_APOD = [
    "https://api.nasa.gov/planetary/apod",
    "https://science.nasa.gov/wp-json/wp/v2/apod-basic",
]

# O que se vê ser um vídeo, e não uma imagem ou uma página: um link do YouTube
# ou do Vimeo, ou um ficheiro de vídeo. É por aqui que se reconhece o vídeo do
# dia, porque o campo onde ele vem já mudou de nome mais do que uma vez.
PARECE_VIDEO = re.compile(
    r"https?://\S*(youtube|youtu\.be|vimeo|\.mp4|\.webm|\.mov|\.m4v|\.m3u8)",
    re.IGNORECASE,
)

# O id de um vídeo do YouTube, nas três formas de endereço que ele usa.
ID_YOUTUBE = re.compile(r"(?:youtube\.com/(?:embed/|watch\?v=)|youtu\.be/)([\w-]{6,})")

# Cache simples em memória
_cache = {"data": None, "resultado": None}


def chave_da_nasa():
    """
    A chave do pedido à API oficial: a do .env, se houver, senão a DEMO_KEY.

    A DEMO_KEY chega para uma APOD por dia — e o pedido é um por dia, por causa
    da cache — mas é partilhada por toda a gente e vive sujeita ao limite de
    pedidos dela. Uma chave própria é gratuita em https://api.nasa.gov e vai
    para o .env como NASA_API_KEY.
    """
    return (os.environ.get("NASA_API_KEY") or "DEMO_KEY").strip()


def remover_html(texto):
    """Remove tags HTML presentes na explicação/créditos da nova API."""
    if not texto:
        return ""
    return re.sub(r"<[^>]+>", "", texto).strip()


def pedir_apod(url):
    """Pede a APOD a uma das fontes e devolve o registo do dia."""
    resposta = requests.get(url, params={"api_key": chave_da_nasa()}, timeout=6)

    resposta.raise_for_status()

    registos = resposta.json()

    # Uma das APIs devolve um registo e a outra uma lista deles — na lista, o
    # mais recente é o primeiro.
    if isinstance(registos, list):
        registos = registos[0] if registos else None

    # Só serve se for mesmo um registo com campos lá dentro.
    return registos if isinstance(registos, dict) else None


def buscar_apod():
    """
    Vai buscar a APOD à primeira fonte que responder.

    Não se fica pela primeira: se a API oficial estiver em baixo, ou se a
    DEMO_KEY tiver esgotado os pedidos do dia, a reserva responde. Só quando
    falham as duas é que isto levanta erro — e aí o server.py devolve o erro
    que já devolvia.
    """
    ultimo_erro = None

    for url in FONTES_APOD:
        try:
            apod = pedir_apod(url)
        except Exception as erro:
            ultimo_erro = erro
            continue

        if apod:
            return apod

        ultimo_erro = ValueError("A NASA não devolveu nenhuma APOD.")

    raise ultimo_erro or ValueError("A NASA não devolveu nenhuma APOD.")


def metatag(conteudo, propriedade):
    """
    O conteúdo de uma metatag do HTML, pelo nome dela (og:video, og:image).

    Os atributos podem vir em qualquer ordem na tag, por isso procuram-se as
    duas maneiras.
    """
    nome = re.escape(propriedade)

    for padrao in (
        rf'<meta[^>]+(?:property|name)="{nome}"[^>]+content="([^"]*)"',
        rf'<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="{nome}"',
    ):
        encontrado = re.search(padrao, conteudo, re.IGNORECASE)
        if encontrado:
            # O que vem de dentro do HTML traz as entidades por decodificar
            # (&amp; e companhia), e uma URL com elas não abre.
            return unescape(encontrado.group(1))

    return None


# Como o vídeo aparece dentro da página do artigo, por ordem de preferência:
# o iframe do YouTube ou do Vimeo é o caso normal, o <video> é o dos vídeos
# que a NASA serve do próprio site.
CANDIDATOS_DE_VIDEO = [
    r'<iframe[^>]+src="([^"]*(?:youtube\.com/embed|youtu\.be|player\.vimeo\.com)[^"]*)"',
    r'<video[^>]+src="([^"]+\.(?:mp4|webm|mov)[^"]*)"',
    r'<source[^>]+src="([^"]+\.(?:mp4|webm|mov)[^"]*)"',
]


def video_no_artigo(url, miniatura):
    """
    Vai buscar o vídeo à página do artigo da NASA.

    É o plano B dos dias de vídeo. Quando a API oficial não responde, quem
    serve a APOD é a reserva do science.nasa.gov — e nesses dias ela só conhece
    a página do artigo. O vídeo está lá dentro, num iframe ou num <video>, e é
    de lá que se tira. As metatags de partilha vêm primeiro porque dão o
    endereço já limpo, sem HTML à volta — são as que a NASA põe para o vídeo
    aparecer com imagem quando o link é partilhado.

    Se a página não abrir, ou não tiver nada que se veja ser um vídeo, devolve
    o que recebeu — e aí o front-end abre a página numa aba, que é o melhor que
    resta.
    """
    try:
        resposta = requests.get(url, timeout=8)
        resposta.raise_for_status()
    except Exception:
        return url, miniatura

    conteudo = resposta.text

    video = (
        metatag(conteudo, "og:video:secure_url")
        or metatag(conteudo, "og:video:url")
        or metatag(conteudo, "og:video")
        or metatag(conteudo, "twitter:player")
    )

    if not video:
        for padrao in CANDIDATOS_DE_VIDEO:
            encontrado = re.search(padrao, conteudo, re.IGNORECASE)
            if encontrado:
                video = unescape(encontrado.group(1))
                break

    miniatura_da_pagina = metatag(conteudo, "og:image") or metatag(conteudo, "twitter:image")

    return video or url, miniatura or miniatura_da_pagina


def video_do_dia(apod, url, hdurl):
    """
    O vídeo do dia, e a imagem que o representa.

    O endereço do vídeo não se escolhe pelo nome do campo: ganha o primeiro
    valor que se veja ser um vídeo (YouTube, Vimeo ou um ficheiro), porque já
    houve duas APIs a chamar-lhe nomes diferentes. O valor tem de ser uma URL
    de fio a pavio, senão a explicação do dia — que às vezes fala de vídeos e
    os liga — passava por link de vídeo.
    """
    video = next(
        (
            valor for valor in [url, hdurl, *apod.values()]
            if isinstance(valor, str) and PARECE_VIDEO.match(valor)
        ),
        url or hdurl,
    )

    miniatura = apod.get("thumbnail_url")

    # O que saiu daqui não é um vídeo, é a página do artigo: vai-se lá buscá-lo.
    if not PARECE_VIDEO.match(video or ""):
        video, miniatura = video_no_artigo(video, miniatura)

    # Sem miniatura, um vídeo do YouTube ainda tem a dele: o YouTube guarda uma
    # imagem por vídeo neste endereço, e para lá chegar só é preciso o id.
    do_youtube = ID_YOUTUBE.search(video or "")
    if not miniatura and do_youtube:
        miniatura = f"https://img.youtube.com/vi/{do_youtube.group(1)}/hqdefault.jpg"

    return video, miniatura


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

    apod = buscar_apod()

    tipo = apod.get("media_type", "image")

    # O "url" é o campo que muda de significado conforme o dia: nos dias de
    # imagem é a imagem, nos dias de vídeo é o vídeo. O "hdurl" só aparece nos
    # dias de imagem.
    url = apod.get("url")
    hdurl = apod.get("hdurl")

    # A data da APOD, em ISO. É a da NASA quando ela a dá em condições; senão,
    # a de hoje.
    data_apod = apod.get("date", hoje)
    if not isinstance(data_apod, str) or len(data_apod) < 10:
        data_apod = hoje

    # A página da APOD no apod.nasa.gov tem um endereço por dia (apAAMMDD.html).
    # Ao contrário do "url", este endereço é sempre uma página — é a rede que
    # fica por baixo quando não há vídeo para tocar.
    pagina_nasa = (
        "https://apod.nasa.gov/apod/"
        f"ap{data_apod[2:4]}{data_apod[5:7]}{data_apod[8:10]}.html"
    )

    if tipo == "video":
        url_video, url_miniatura = video_do_dia(apod, url, hdurl)
        url_imagem = None
        url_hd = None
    else:
        url_video = None
        url_miniatura = None
        # A imagem em alta resolução é a que se mostra; se faltar, fica o "url"
        # em vez de se ficar sem nada.
        url_imagem = hdurl or url
        url_hd = hdurl or url

    resultado = {
        "titulo": apod.get("title", "Imagem do Dia"),

        "explicacao": remover_html(
            apod.get("explanation", "")
        ),

        "url_imagem": url_imagem,

        "url_video": url_video,

        "url_miniatura": url_miniatura,

        "url_hd": url_hd,

        "tipo_media": tipo,

        "data": data_apod,

        "autor": remover_html(
            apod.get("copyright") or apod.get("credit")
        ),

        # Página oficial da APOD na NASA
        "pagina_nasa": pagina_nasa
    }

    _cache["data"] = hoje
    _cache["resultado"] = resultado

    return resultado