# ============================================================
#  localizacao — Escolher um sítio pelo nome
#
#  O que a aplicação usa para transformar "Lisboa, Portugal"
#  nas coordenadas e no fuso horário de que o céu precisa.
#
#  Junta as duas fontes e esconde de quem chama qual delas
#  respondeu:
#
#   1. a lista local (cidades.py), que responde sempre e sem
#      rede, e cobre as cidades onde alguém observa;
#   2. o serviço de geocoding na internet (geocoding.py), só
#      quando a lista não devolveu nada.
#
#  A ordem não é arbitrária: a lista responde em memória e não
#  depende de haver internet, e é por isso que é ela que atende
#  o caso comum. A rede fica para o que a lista não tem.
# ============================================================

from py.localizacao.cidades import procurar as _procurar_na_lista
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


def procurar(termo, limite=_LIMITE_POR_OMISSAO):
    # A lista de locais que correspondem ao que se escreveu, da mais provável
    # para a menos provável (ver _pontuar, no cidades.py).
    resultados = _procurar_na_lista(termo, limite)

    # A rede só entra quando não há nada: se a lista já respondeu, a resposta
    # dela é a que aparece, e a procura fica instantânea. É esta a diferença
    # entre escrever "Porto" (sem sair do computador) e escrever "Gaziantep"
    # (uma ida à internet).
    if resultados:
        return resultados

    if len((termo or "").strip()) < _MINIMO_PARA_A_REDE:
        return []

    return _procurar_online(termo, limite)


def reverter(latitude, longitude):
    # O nome da terra onde caem umas coordenadas — o caminho contrário, para
    # quando as coordenadas vêm do dispositivo (ver o perfil.js) e o que falta
    # é saber que terra é aquela.
    #
    # Aqui não há lista local equivalente: as coordenadas não dizem nada sem um
    # mapa, e um mapa de todas as terras do mundo não cabe numa lista escrita à
    # mão. Devolve None se não houver resposta.
    return _reverter_online(latitude, longitude)
