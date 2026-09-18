# ============================================================
#  iss.py — Estação Espacial Internacional (ISS)
#  Vai buscar os elementos orbitais (TLE) à Celestrak e usa-os
#  para saber onde a ISS está no céu de Vila Nova de Gaia.
#
#  Vive em ficheiro próprio, ao lado do apod.py, porque é o
#  único sítio do projeto que junta rede e órbita: o
#  sky_engine.py continua a ser só astronomia, e é o server.py
#  que junta as duas coisas.
# ============================================================

# --- Bibliotecas externas ---
import datetime                          # datas e horas da cache
import logging                           # avisar no terminal quando o TLE não vem
import requests                          # pedido do TLE à Celestrak
from skyfield.api import EarthSatellite  # propaga um satélite a partir do seu TLE

# --- Módulos internos ---
from sky_engine import ts, observador    # o tempo e o ponto de observação do projeto

log = logging.getLogger(__name__)

# ── Elementos orbitais (TLE) ──────────────────────────────────────────────────
# 25544 é o número NORAD da ISS — o mesmo desde 1998. O DE421 da NASA não tem
# satélites nenhuns, por isso a órbita tem de vir de fora. E tem de vir fresca:
# os TLE descrevem a órbita com uma precisão de dias, não de meses, porque o
# atrito da atmosfera vai travando a estação pouco a pouco.

TLE_URL = "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE"

# A Celestrak recusa pedidos sem identificação própria (bloqueia o User-Agent
# por omissão do requests), por isso vai um cabeçalho a dizer quem pede.
CABECALHOS = {"User-Agent": "AstroGuide/1.0 (projeto escolar; via Python requests)"}

VALIDADE_TLE = 6 * 60 * 60      # segundos: 6 h. A órbita é atualizada várias vezes por dia,
                                # e um TLE com horas ainda põe a ISS no lugar certo.
ESPERA_APOS_FALHA = 5 * 60      # segundos: sem rede, não vale a pena insistir a cada pedido

# Cache em memória (nunca em disco, tal como o apod.py): sem internet a app
# arranca sem ISS, em vez de a desenhar num sítio inventado.
_cache = {
    "obtido_em": None,     # quando é que o TLE foi obtido com sucesso
    "linhas": None,        # (nome, linha 1, linha 2) tal como vieram
    "satelite": None,      # EarthSatellite construído a partir dessas linhas
    "falhou_em": None,     # última falha — evita repetir a espera do timeout
}


def _tle_fresco():
    # Há um TLE obtido há menos de VALIDADE_TLE?
    if _cache["obtido_em"] is None:
        return False
    idade = (datetime.datetime.now(datetime.timezone.utc) - _cache["obtido_em"]).total_seconds()
    return idade < VALIDADE_TLE


def _em_espera_apos_falha():
    # Falhámos há pouco? Sem isto, cada /api/observatorio (e a atualização
    # automática de 30 em 30 segundos) apanhava 6 segundos de espera à espera
    # de uma rede que não está lá.
    if _cache["falhou_em"] is None:
        return False
    desde = (datetime.datetime.now(datetime.timezone.utc) - _cache["falhou_em"]).total_seconds()
    return desde < ESPERA_APOS_FALHA


def _obter_tle():
    # Descarrega o TLE da ISS e devolve (nome, linha 1, linha 2).
    # Levanta exceção se a resposta não tiver o formato esperado.
    resposta = requests.get(TLE_URL, headers=CABECALHOS, timeout=6)
    resposta.raise_for_status()   # 404, 500 ou limite excedido → exceção

    linhas = [linha.strip() for linha in resposta.text.splitlines() if linha.strip()]
    # Um TLE são 3 linhas: o nome, os elementos e a órbita. As duas últimas
    # começam por "1 " e "2 " — se não começarem, veio outra coisa qualquer
    # (uma página de erro, por exemplo) e é melhor não acreditar nela.
    if len(linhas) < 3 or not linhas[1].startswith("1 ") or not linhas[2].startswith("2 "):
        raise ValueError(f"resposta inesperada da Celestrak ({len(linhas)} linhas)")
    return linhas[0], linhas[1], linhas[2]


def get_satelite():
    # Devolve o objeto EarthSatellite da ISS pronto a usar, ou None quando não
    # há elementos orbitais — nunca levanta exceção, porque quem chama é o céu
    # do observatório, e o céu não pode deixar de ser desenhado por causa disto.
    if _cache["satelite"] is not None and _tle_fresco():
        return _cache["satelite"]
    if _em_espera_apos_falha():
        return _cache["satelite"]      # pode ser None: já se tentou há pouco

    try:
        nome, linha1, linha2 = _obter_tle()

        # A Celestrak devolve muitas vezes exatamente o mesmo TLE (só muda quando
        # a órbita é recalculada). Nesse caso fica o objeto que já existe —
        # comparar as linhas é comparar os dados, e evita reconstruir sem motivo.
        # As linhas só são guardadas DEPOIS de o objeto estar feito: se a
        # construção falhar, a próxima tentativa volta a tentar construí-lo.
        if _cache["linhas"] != (nome, linha1, linha2):
            _cache["satelite"] = EarthSatellite(linha1, linha2, nome, ts)
            _cache["linhas"] = (nome, linha1, linha2)
    except Exception as e:
        _cache["falhou_em"] = datetime.datetime.now(datetime.timezone.utc)
        # Uma linha no terminal por cada tentativa falhada (e não a cada pedido:
        # a espera de 5 minutos acima é que manda no ritmo). Sem isto, a ISS
        # simplesmente não aparecia no céu e não havia por onde saber porquê.
        log.warning(f"Não foi possível obter os elementos orbitais da ISS: {e}")
        # Não se deita fora o TLE que já se tem: um com 6 h ainda põe a ISS no
        # lugar certo, e mais vale isso do que ficar sem ISS nenhuma por causa de
        # uma falha de rede passageira. (Se nunca houve TLE, isto é None.)
        return _cache["satelite"]

    _cache["obtido_em"] = datetime.datetime.now(datetime.timezone.utc)
    _cache["falhou_em"] = None

    return _cache["satelite"]


# ── Posição da ISS ────────────────────────────────────────────────────────────

def get_posicao_iss(momento=None):
    # Onde é que a ISS está no instante pedido (ou agora), vista de Gaia.
    # Devolve um dicionário com a MESMA forma dos outros astros, para poder
    # entrar na lista "astros" sem o frontend precisar de saber que é diferente.
    # None quando não há elementos orbitais.
    sat = get_satelite()
    if sat is None:
        return None

    t = momento if momento is not None else ts.now()

    # (sat - observador) é o vetor do observador até ao satélite; o .at(t) e o
    # .altaz() a seguir dão o mesmo par altitude/azimute que o Sol e os planetas.
    alt, az, dist = (sat - observador).at(t).altaz()

    # De propósito, NÃO se envia ra_aparente/dec_aparente como nas estrelas e
    # nos astros: esses campos existem para o frontend animar a mudança de hora
    # a partir de coordenadas fixas do céu, e a ISS não é um objeto fixo — a
    # sua posição não tem nada que ver com a rotação sideral. Sem eles, a
    # transição animada deixa-a quieta e só no último frame é que ela aparece
    # no lugar certo, que é o comportamento correto para um satélite.
    return {
        "id": "iss",
        "nome": "ISS",
        "altitude": round(float(alt.degrees), 2),
        "azimute": round(float(az.degrees), 2),
        "distancia": f"{round(float(dist.km), 0):,.0f} km",
        "visivel": bool(alt.degrees > 0),
        "tipo": "iss",
        # Sem magnitude: o brilho da ISS varia entre aproximadamente −4 e +2
        # conforme a altura e o ângulo com que o Sol a ilumina. Um número fixo
        # seria inventado.
    }
