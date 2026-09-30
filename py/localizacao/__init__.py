# ============================================================
#  localizacao — Escolher um sítio pelo nome
#
#  O que a aplicação usa para transformar "Lisboa, Portugal"
#  nas coordenadas e no fuso horário de que o céu precisa.
#
#  São duas fontes, e são pedidas em separado — quem as junta é
#  o perfil.js, que mostra a primeira e acrescenta a segunda:
#
#   1. a lista local (cidades.py), que responde sempre e sem
#      rede, e cobre as cidades onde alguém observa;
#   2. o serviço de geocoding na internet (geocoding.py), que
#      traz as terras com aquele nome que a lista não tem.
#
#  Estarem separadas é o que permite às duas coisas serem
#  verdade ao mesmo tempo: a lista responde em memória e não
#  depende de haver internet, e é isso que faz a lista de
#  sugestões aparecer no instante em que se para de escrever;
#  a rede leva o seu tempo e pode falhar, e nenhuma procura
#  comum deve esperar por ela.
#
#  A rede não é, por isso, um recurso de emergência para quando a
#  lista não encontra nada — é o resto da resposta. A lista é uma
#  amostra: "Granada" existe em cinco países e ela conhece um.
# ============================================================

import math

from py.localizacao.cidades import procurar as _procurar_na_lista
from py.localizacao.cidades import sem_acentos
from py.localizacao.geocoding import procurar_online as _procurar_online
from py.localizacao.geocoding import reverter_online as _reverter_online

# Abaixo disto não se vai à rede. Com uma letra escrita, a lista responde
# "Lisboa" e não vale a pena perguntar a ninguém; e os serviços de geocoding
# devolvem coisas estranhas para procuras de uma ou duas letras ("a" tem
# milhares de terras).
_MINIMO_PARA_A_REDE = 3

# Os campos que descrevem uma localização. É esta a forma que a lista local e o
# serviço na internet têm de ter em comum, e é o que a API devolve e o que a
# rota de gravação aceita — uma só forma, para não haver duas verdades sobre o
# que é uma localização.
CAMPOS = ("cidade", "pais", "regiao", "latitude", "longitude", "elevacao", "timezone")


def nome_legivel(local):
    # O nome que aparece no ecrã: "Lisboa, Portugal".
    #
    # Vive aqui, e não em cada sítio que o mostra, para o cabeçalho da
    # aplicação, o menu e a página do perfil dizerem todos o mesmo. Quando o
    # país não se sabe (o serviço de geocoding não respondeu), fica só a
    # cidade — em vez de uma vírgula pendurada à espera de nada.
    cidade = (local.get("cidade") or "").strip()
    pais = (local.get("pais") or "").strip()
    if not cidade:
        return pais or "A minha localização"
    return f"{cidade}, {pais}" if pais else cidade


# Quantas terras se devolvem por procura. O número é este, e não oito, por
# causa da procura com uma letra só: quem escreve "S" está a percorrer a lista
# e não a fazer uma pergunta, e cortar-lhe as terras que começam por S a oito
# deixava de fora metade das que existem — sem nada a dizer que ficaram de
# fora, que é o pior de todos, porque parece que são só aquelas.
_LIMITE_POR_OMISSAO = 12


def procurar_na_lista(termo, limite=_LIMITE_POR_OMISSAO):
    # As terras da lista local que correspondem ao que se escreveu, da mais
    # provável para a menos provável (ver _pontuar, no cidades.py).
    #
    # Não sai à rede, de propósito: é esta a resposta que aparece no instante
    # em que a pessoa para de escrever, e é ela que continua a haver quando não
    # há internet. Quem chama pede também o procurar_mais, e é ao juntar as
    # duas que a resposta fica completa.
    return _procurar_na_lista(termo, limite)


def procurar_mais(termo, limite=_LIMITE_POR_OMISSAO):
    # O resto da resposta: as terras com este nome que só o serviço de
    # geocoding conhece, para acrescentar POR BAIXO das da lista local.
    #
    # Existe porque a lista local é uma amostra das terras onde alguém aponta
    # um telescópio, e uma amostra não pode responder sozinha a um nome que
    # existe em vários países. Antes disto, escrever "Granada" devolvia a
    # Granada espanhola e mais nada — e há mais quatro no mundo, incluindo uma
    # na Nicarágua e o próprio país. A lista tapava-as: quem escrevia Granada
    # via uma terra e não tinha como saber das outras, que é o pior dos casos,
    # porque parece que só aquela existe.
    #
    # Quem chama já mostrou o que a lista deu (ver o procurar_na_lista), e o que
    # ela já tinha sai daqui — senão a Granada espanhola aparecia duas vezes,
    # uma por cada fonte.
    alvo = (termo or "").strip()
    if len(alvo) < _MINIMO_PARA_A_REDE:
        return []

    da_lista = _procurar_na_lista(alvo, _LIMITE_POR_OMISSAO)
    procurado = sem_acentos(alvo)

    resultados = []
    for local in _procurar_online(alvo, limite):
        # Só o que tem mesmo este nome. A procura do Open-Meteo é tolerante e
        # traz coisas que se chamam outra coisa: procurar "Santiago" devolvia
        # também Naguabo, Vilasantar e Verea, que não têm Santiago nenhum no
        # nome. Sugerir a quem escreveu "Santiago" uma terra que se chama outra
        # coisa é dar-lhe uma resposta errada.
        if procurado not in sem_acentos(local["cidade"]):
            continue

        # E nem o que a lista local já deu, ainda que o serviço lhe chame outra
        # coisa — é o caso de "Santiago do Chile", que é o "Santiago, Chile" da
        # lista. (Ver o _mesma_terra para o porquê de isto ser por distância e
        # não pelo nome.)
        if any(_mesma_terra(local, conhecida) for conhecida in da_lista):
            continue

        resultados.append(local)

    return resultados


# A partir de que distância duas terras deixam de ser a mesma. É largo de
# propósito, e o número não vem da precisão das fontes: as duas dão o centro da
# povoação com umas centenas de metros de diferença, e uma tolerância de 1 km
# chegava para isso. Vem do que a aplicação faz com a localização — o céu de
# duas terras a 15 km é o mesmo céu. Para escolher um sítio de observação,
# mostrá-las como duas seria mostrar a mesma coisa duas vezes.
_MESMA_TERRA_KM = 15


def _mesma_terra(a, b):
    # Compara-se a posição e não o nome porque o nome não é de confiança entre
    # as duas fontes. As cidades coincidem quase sempre ("Lisboa" é "Lisboa"),
    # mas os PAÍSES não: a lista escreve "Polónia" e "Chéquia" onde o serviço
    # escreve "Polônia" e "República Checa", e um nome traduzido de outra
    # maneira ("Santiago" -> "Santiago do Chile") dava a mesma terra duas vezes.
    # A posição não se traduz.
    return _distancia_km(
        (a["latitude"], a["longitude"]), (b["latitude"], b["longitude"])
    ) < _MESMA_TERRA_KM


def _distancia_km(a, b):
    # Distância em linha reta entre duas coordenadas, em km. A projeção
    # equirretangular — os graus de longitude encolhem com o cosseno da latitude
    # — chega bem para isto: ao lado de 15 km, o erro dela é de metros.
    raio = 111.32
    lat_media = math.radians((a[0] + b[0]) / 2)
    return raio * math.hypot((b[1] - a[1]) * math.cos(lat_media), b[0] - a[0])


def reverter(latitude, longitude):
    # O nome da terra onde caem umas coordenadas — o caminho contrário, para
    # quando as coordenadas vêm do dispositivo (ver o perfil.js) e o que falta
    # é saber que terra é aquela.
    #
    # Aqui não há lista local equivalente: as coordenadas não dizem nada sem um
    # mapa, e um mapa de todas as terras do mundo não cabe numa lista escrita à
    # mão. Devolve None se não houver resposta.
    return _reverter_online(latitude, longitude)
