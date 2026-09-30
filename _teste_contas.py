# Teste funcional do sistema de contas e da localização pessoal.
# Usa o cliente de testes do Flask (não arranca servidor nenhum, não abre
# browser e não ocupa a porta 5000) e uma base de dados temporária, para não
# tocar no astroguide.db real.
#
# Correr com:  py _teste_contas.py
import os, sys, tempfile

# A pasta deste ficheiro — assim o teste funciona a partir de qualquer
# diretório e em qualquer máquina, sem caminhos escritos à mão.
RAIZ = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, RAIZ)

# A chave de sessão vem do ambiente para o teste não criar o ficheiro .secret_key
os.environ["ASTROGUIDE_SECRET_KEY"] = "chave-so-para-o-teste"

from py.database import db
TMP = os.path.join(tempfile.gettempdir(), "astroguide_teste.db")
if os.path.exists(TMP):
    os.remove(TMP)
db.CAMINHO_BD = TMP          # tudo o que usa a bd passa a apontar para aqui

import server
import promover_admin   # o script de terminal que dá o papel de admin

c = server.app.test_client()
falhas = []

def verificar(nome, condicao, detalhe=""):
    print(("  OK  " if condicao else " FALHA") + f" | {nome}" + (f"  -> {detalhe}" if detalhe else ""))
    if not condicao:
        falhas.append(nome)

print("\n== 1. Sem sessão ==")
r = c.get("/api/me")
d = r.get_json()
verificar("/api/me devolve 200 sem sessão", r.status_code == 200, r.status_code)
verificar("utilizador é null", d["utilizador"] is None)
verificar("localização por omissão é Gaia", d["localizacao"]["nome"] == "Vila Nova de Gaia, Portugal",
          d["localizacao"]["nome"])
verificar("e traz a cidade e o país separados, não só o nome todo",
          d["localizacao"]["cidade"] == "Vila Nova de Gaia" and d["localizacao"]["pais"] == "Portugal",
          d["localizacao"])

print("\n== 2. Registo: validação ==")
r = c.post("/api/registar", json={"nome": "ab", "email": "a@b.pt", "password": "12345678"})
verificar("nome curto -> 400", r.status_code == 400, r.get_json().get("erro"))
r = c.post("/api/registar", json={"nome": "diogo", "email": "nao-e-email", "password": "12345678"})
verificar("email inválido -> 400", r.status_code == 400, r.get_json().get("erro"))
r = c.post("/api/registar", json={"nome": "diogo", "email": "a@b.pt", "password": "curta"})
verificar("password curta -> 400", r.status_code == 400, r.get_json().get("erro"))

print("\n== 3. Registo válido ==")
r = c.post("/api/registar", json={"nome": "Diogo", "email": "diogo@exemplo.pt", "password": "password123"})
verificar("registo -> 201", r.status_code == 201, r.get_json())
r = c.get("/api/me")
d = r.get_json()
verificar("sessão iniciada automaticamente", d["utilizador"] is not None and d["utilizador"]["nome"] == "Diogo")

print("\n== 4. Registo duplicado ==")
c2 = server.app.test_client()
r = c2.post("/api/registar", json={"nome": "diogo", "email": "outro@exemplo.pt", "password": "password123"})
verificar("nome repetido (outra caixa) -> 409", r.status_code == 409, r.get_json().get("erro"))
r = c2.post("/api/registar", json={"nome": "Outro", "email": "DIOGO@exemplo.pt", "password": "password123"})
verificar("email repetido (outra caixa) -> 409", r.status_code == 409, r.get_json().get("erro"))

print("\n== 5. Localização pessoal, escolhida por nome ==")
# O que se grava é uma TERRA, não um par de números: cidade, país e região vão
# junto das coordenadas e do fuso que o seletor resolveu (ver py/localizacao).
# Escrever latitude e longitude à mão deixou de existir.
r = c.put("/api/localizacao", json={"cidade": "Paris", "pais": "França", "regiao": "Île-de-France",
                                    "latitude": 48.8566, "longitude": 2.3522,
                                    "elevacao": 35, "timezone": "Europe/Paris"})
verificar("guardar localização -> 200", r.status_code == 200, r.get_json())

# Sem cidade não há localização: o nome é a única coisa que a pessoa viu e
# escolheu, e uma linha sem ele aparecia no cabeçalho como um 📍 sozinho.
r = c.put("/api/localizacao", json={"latitude": 48.85, "longitude": 2.35})
verificar("sem cidade -> 400", r.status_code == 400, r.get_json().get("erro"))
r = c.put("/api/localizacao", json={"cidade": "   ", "latitude": 48.85, "longitude": 2.35})
verificar("cidade só com espaços -> 400", r.status_code == 400, r.get_json().get("erro"))
r = c.put("/api/localizacao", json={"cidade": "P" * 81, "latitude": 48.85, "longitude": 2.35})
verificar("cidade comprida demais -> 400", r.status_code == 400, r.get_json().get("erro"))

r = c.put("/api/localizacao", json={"cidade": "X", "latitude": 200, "longitude": 2})
verificar("latitude fora do intervalo -> 400", r.status_code == 400, r.get_json().get("erro"))
r = c.put("/api/localizacao", json={"cidade": "X", "latitude": 48, "longitude": 200})
verificar("longitude fora do intervalo -> 400", r.status_code == 400, r.get_json().get("erro"))
r = c.put("/api/localizacao", json={"cidade": "X", "latitude": 48, "longitude": 2, "elevacao": 99999})
verificar("elevação fora do intervalo -> 400", r.status_code == 400, r.get_json().get("erro"))

# O fuso é validado a sério (ZoneInfo) e não só copiado: um valor inventado
# gravado hoje só rebentava na primeira vez que se abrisse o Calendário Lunar.
r = c.put("/api/localizacao", json={"cidade": "X", "latitude": 48, "longitude": 2, "timezone": "Marte/Olympus"})
verificar("fuso horário inválido -> 400", r.status_code == 400, r.get_json().get("erro"))
r = c.put("/api/localizacao", json={"cidade": "X", "latitude": "abc", "longitude": 2})
verificar("latitude não numérica -> 400", r.status_code == 400, r.get_json().get("erro"))

r = c.get("/api/me")
local = r.get_json()["localizacao"]
# O nome que se vê é feito da cidade e do país (ver nome_legivel), e é por isso
# que o teste olha para os três: cidade e país são o que ficou guardado, e o
# nome é o que aparece no cabeçalho da aplicação.
verificar("a localização ficou guardada", local["nome"] == "Paris, França", local)
verificar("e com a cidade e o país à parte, como foram escolhidos",
          local["cidade"] == "Paris" and local["pais"] == "França", local)
verificar("e com o fuso que o seletor resolveu", local["timezone"] == "Europe/Paris", local.get("timezone"))

print("\n== 5b. O seletor de cidades ==")
# A procura que alimenta a lista do perfil: escreve-se o nome e o servidor
# devolve as terras que conhece com as coordenadas e o fuso já resolvidos.
r = c.get("/api/localidades?q=lisboa")
cidades = r.get_json().get("resultados", [])
verificar("procurar 'lisboa' -> 200", r.status_code == 200, r.status_code)
verificar("e devolve Lisboa em primeiro", cidades and cidades[0]["cidade"] == "Lisboa",
          [x["cidade"] for x in cidades])
if cidades:
    primeira = cidades[0]
    verificar("com as coordenadas já resolvidas — nada para escrever à mão",
              38 < primeira["latitude"] < 39 and -10 < primeira["longitude"] < -9, primeira)
    verificar("e com o fuso horário", primeira["timezone"] == "Europe/Lisbon", primeira.get("timezone"))
    verificar("e com o país, que é o que distingue terras com o mesmo nome",
              primeira["pais"] == "Portugal", primeira.get("pais"))

# Quem escreve depressa escreve com vírgula ("Lisboa, Portugal") e quem escreve
# sem acentos não pode ficar sem resposta — são as duas maneiras como as pessoas
# escrevem o nome de uma terra, e nenhuma delas é um erro.
r = c.get("/api/localidades?q=Lisboa%2C%20Portugal")
verificar("'Lisboa, Portugal' (com vírgula) encontra Lisboa",
          r.get_json()["resultados"] and r.get_json()["resultados"][0]["cidade"] == "Lisboa",
          [x["cidade"] for x in r.get_json()["resultados"]])
r = c.get("/api/localidades?q=madrid")
verificar("'madrid' encontra Madrid, em Espanha",
          r.get_json()["resultados"] and r.get_json()["resultados"][0]["pais"] == "Espanha",
          r.get_json()["resultados"][:1])

r = c2.get("/api/localidades?q=lisboa")
verificar("procurar cidades sem sessão -> 401", r.status_code == 401, r.status_code)

# Uma letra chega. Quem escreve "S" está a percorrer a lista para escolher de
# lá, e não a fazer uma pergunta — cortar isso obrigava a saber o nome todo de
# cor, que é exatamente o que esta funcionalidade veio tirar.
r = c.get("/api/localidades?q=s")
letra = r.get_json().get("resultados", [])
verificar("'s' (uma letra) devolve as terras que começam por S",
          len(letra) >= 8 and all(x["cidade"].lower().startswith("s") for x in letra),
          [x["cidade"] for x in letra[:6]])
verificar("e todas trazem coordenadas e fuso, prontas a guardar",
          all(x["latitude"] and x["longitude"] and x["timezone"] for x in letra), letra[:1])

# Uma procura vazia não devolve o catálogo todo: quem ainda não escreveu nada
# não quer 150 linhas a abrir-se debaixo do campo.
r = c.get("/api/localidades?q=")
verificar("procura vazia -> lista vazia (não o catálogo todo)",
          r.get_json()["resultados"] == [], r.get_json()["resultados"])

# Quando há terras que se chamam mesmo o que se escreveu, as que só
# coincidiram por causa do país ou da região saem. Sem isto, "port" trazia o
# Porto e mais três, e depois Beja, Braga e Faro — que lá estavam só porque a
# região delas é "Portugal". Numa lista de sugestões isso lê-se como um erro,
# e a pessoa desconfia também das linhas de cima, que estavam certas.
r = c.get("/api/localidades?q=port")
portos = r.get_json()["resultados"]
verificar("'port' devolve os Portos e não as terras cuja região é Portugal",
          portos and all(x["cidade"].lower().startswith("port") for x in portos),
          [x["cidade"] for x in portos])

# O outro lado da mesma regra: "espanha" não tem nome nenhum que lhe
# corresponda, e é a lista das terras daquele país que se quer ver. Um filtro
# fixo em vez de condicional deixava esta procura sem resposta nenhuma.
r = c.get("/api/localidades?q=espanha")
espanha = r.get_json()["resultados"]
verificar("mas 'espanha' continua a dar as terras de Espanha",
          len(espanha) >= 8 and all(x["pais"] == "Espanha" for x in espanha),
          [x["cidade"] for x in espanha[:6]])

print("\n== 5b-bis. O resto do mundo (a segunda fonte) ==")
# A lista local é uma amostra: "Granada" existe em cinco países e ela conhece
# um. Antes disto, quem escrevia Granada via a espanhola e mais nada — as
# outras existiam e não havia como lá chegar, que é o pior dos casos, porque
# parece que só aquela existe. A segunda fonte traz as outras, num pedido à
# parte, para o perfil.js as acrescentar por baixo das primeiras.

# A primeira fonte continua a ser só a lista local, e continua a não sair à
# rede — é isso que faz a lista de sugestões aparecer no instante em que se
# para de escrever, e é por isso que "Granada" (a espanhola) vem sozinha.
r = c.get("/api/localidades?q=granada")
so_lista = r.get_json()["resultados"]
verificar("'granada' sem fonte=rede devolve só a da lista local",
          len(so_lista) == 1 and so_lista[0]["pais"] == "Espanha",
          [f"{x['cidade']}/{x['pais']}" for x in so_lista])

# Abaixo de três letras não se pergunta ao serviço — é o mesmo mínimo do
# _MINIMO_PARA_A_REDE. Este pedido não sai à rede, por isso é determinístico
# mesmo numa máquina sem internet.
r = c.get("/api/localidades?q=gr&fonte=rede")
verificar("'gr' com fonte=rede -> vazio, sem sair à rede",
          r.status_code == 200 and r.get_json()["resultados"] == [], r.get_json())

r = c2.get("/api/localidades?q=granada&fonte=rede")
verificar("a segunda fonte também exige sessão -> 401", r.status_code == 401, r.status_code)

# O resto depende de haver rede: com o serviço em baixo isto vem vazio, e vazio
# aqui não é uma resposta errada — é a mesma coisa que a aplicação faz, ficar
# com o que a lista local tinha. Salta-se em vez de falhar.
r = c.get("/api/localidades?q=granada&fonte=rede")
outras = r.get_json()["resultados"]
if not outras:
    print("    (saltado: sem rede, ou o serviço de geocoding não respondeu)")
else:
    verificar("e traz as outras Granadas do mundo",
              len(outras) >= 3, [f"{x['cidade']}/{x['pais']}" for x in outras])
    # O corte que evita a terra aparecer duas vezes, uma por cada fonte.
    verificar("sem repetir a espanhola que a lista já deu",
              all(x["pais"] != "Espanha" for x in outras),
              [f"{x['cidade']}/{x['pais']}" for x in outras])
    # A procura do Open-Meteo é tolerante e devolve coisas que se chamam outra
    # coisa — "Santiago" trazia Naguabo e Vilasantar. Sugerir a quem escreveu
    # Granada uma terra que não se chama Granada é uma resposta errada.
    verificar("e só com terras que se chamam mesmo Granada",
              all("granada" in x["cidade"].lower() for x in outras),
              [x["cidade"] for x in outras])
    verificar("todas com coordenadas e fuso, prontas a guardar",
              all(x["latitude"] and x["longitude"] and x["timezone"] for x in outras),
              outras[:1])

print("\n== 5c. A procura ao contrário (o dispositivo) ==")
# O botão "usar a localização deste dispositivo" manda as coordenadas do
# browser e recebe o NOME da terra. Sem esta rota, guardava-se um par de
# números sem nome nenhum.
r = c.post("/api/localidades/reversa", json={"latitude": 999, "longitude": 2})
verificar("coordenadas impossíveis -> 400 (sem sair à rede)", r.status_code == 400, r.get_json().get("erro"))
r = c2.post("/api/localidades/reversa", json={"latitude": 41.13, "longitude": -8.66})
verificar("sem sessão -> 401", r.status_code == 401, r.status_code)

# Com coordenadas válidas o resultado depende da rede: 200 com o nome da terra,
# ou 503 se não se conseguir saber qual é. O que não pode é inventar um nome —
# era pior do que não responder, porque um nome errado no cabeçalho não se
# distingue de um certo.
r = c.post("/api/localidades/reversa", json={"latitude": 38.7169, "longitude": -9.1399})
if r.status_code == 503:
    print("    (saltado: sem rede para saber que terra são as coordenadas)")
else:
    verificar("coordenadas válidas -> 200 com o nome da terra", r.status_code == 200, r.get_json())
    verificar("e o que volta é uma cidade com nome",
              bool((r.get_json().get("localidade") or {}).get("cidade")), r.get_json())

print("\n== 6. A localização chega ao cálculo do céu ==")
r = c.get("/api/ceu")
verificar("/api/ceu usa a localização da conta", r.get_json()["location"] == "Paris, França",
          r.get_json()["location"])
r = c2.get("/api/ceu")
verificar("outro cliente (sem sessão) fica com Gaia", r.get_json()["location"] == "Vila Nova de Gaia, Portugal",
          r.get_json()["location"])

# A prova de que a personalização chega mesmo à matemática: o mesmo instante,
# duas localizações muito distantes, altitudes diferentes.
from py.astronomia import sky_engine
import datetime
t = datetime.datetime(2026, 9, 22, 22, 0, tzinfo=datetime.timezone.utc)
gaia = sky_engine.get_observatorio(t, {"nome": "Gaia", "latitude": 41.13, "longitude": -8.66, "elevacao": 75,
                                       "timezone": "Europe/Lisbon"})
sydney = sky_engine.get_observatorio(t, {"nome": "Sydney", "latitude": -33.87, "longitude": 151.21, "elevacao": 20,
                                         "timezone": "Australia/Sydney"})
alt_polaris_gaia = gaia["estrelas"]["polaris"]["altitude"]
alt_polaris_sydney = sydney["estrelas"]["polaris"]["altitude"]
verificar("Polaris está alta em Gaia", alt_polaris_gaia > 30, f"{alt_polaris_gaia}°")
verificar("Polaris está abaixo do horizonte em Sydney", alt_polaris_sydney < 0, f"{alt_polaris_sydney}°")

# O bug do lado errado do planeta. A longitude positiva é LESTE: Tóquio está a
# 139.69° E, Gaia a 8.66° O, logo 139.69 - (-8.66) = 148.35° de diferença.
#
# Não se compara com ">" porque o tempo sideral dá a volta aos 360°: Gaia está
# em 323.1° e Tóquio em 111.5°, e "323.1 > 111.5" não quer dizer nada quando o
# que se mede é um ângulo circular. O que se verifica é a diferença em módulo.
toquio = sky_engine.get_observatorio(t, {"nome": "Tóquio", "latitude": 35.68, "longitude": 139.69,
                                         "elevacao": 40, "timezone": "Asia/Tokyo"})
gast_gaia = gaia["tempo_sideral"]
gast_toquio = toquio["tempo_sideral"]
diferenca = (gast_toquio - gast_gaia) % 360
verificar("longitude a leste dá os 148.35° de diferença", abs(diferenca - 148.35) < 0.6,
          f"Gaia={gast_gaia:.1f}° Tóquio={gast_toquio:.1f}° dif={diferenca:.2f}°")

# Isto é o teste de regressão do bug, escrito ao contrário: com o antigo
# `abs(longitude) * W`, Tóquio (139.69 E) passava a valer 139.69 O, e a
# diferença dava (360 - 148.35) = 211.65° em vez de 148.35°.
verificar("a diferença não é a que o bug antigo daria", abs(diferenca - 211.65) > 1.0,
          f"o bug antigo daria 211.65°, veio {diferenca:.2f}°")

# E a verificação direta: o construtor do observador tem de preservar o sinal
# da longitude, a leste e a oeste.
verificar("observador_de preserva longitude leste",
          abs(sky_engine.observador_de({"latitude": 0, "longitude": 2.35}).longitude.degrees - 2.35) < 0.001)
verificar("observador_de preserva longitude oeste",
          abs(sky_engine.observador_de({"latitude": 0, "longitude": -8.66}).longitude.degrees - (-8.66)) < 0.001)
verificar("observador_de preserva latitude sul",
          abs(sky_engine.observador_de({"latitude": -33.87, "longitude": 18.4}).latitude.degrees - (-33.87)) < 0.001)

print("\n== 7. Favoritos ==")
r = c.post("/api/favoritos", json={"tipo": "estrela", "objeto_id": "vega"})
verificar("adicionar favorito -> 201", r.status_code == 201, r.get_json())
c.post("/api/favoritos", json={"tipo": "estrela", "objeto_id": "vega"})
r = c.get("/api/favoritos")
verificar("adicionar duas vezes não duplica", len(r.get_json()["favoritos"]) == 1,
          r.get_json()["favoritos"])
r = c.post("/api/favoritos", json={"tipo": "estrelas", "objeto_id": "vega"})
verificar("tipo desconhecido -> 400", r.status_code == 400, r.get_json().get("erro"))
r = c.delete("/api/favoritos", json={"tipo": "estrela", "objeto_id": "vega"})
verificar("remover favorito -> 200", r.status_code == 200)
r = c.get("/api/favoritos")
verificar("ficou vazio", r.get_json()["favoritos"] == [])

print("\n== 8. Observações ==")
r = c.post("/api/observacoes", json={"objeto_nome": "Saturno", "data": "2026-09-18", "nota": "Anéis bem visíveis"})
verificar("criar observação -> 201", r.status_code == 201, r.get_json())
obs_id = r.get_json()["observacao"]["id"]
r = c.post("/api/observacoes", json={"objeto_nome": "X", "data": "2026-02-31"})
verificar("data impossível -> 400", r.status_code == 400, r.get_json().get("erro"))
r = c.post("/api/observacoes", json={"objeto_nome": "", "data": "2026-09-18"})
verificar("sem objeto -> 400", r.status_code == 400, r.get_json().get("erro"))
r = c.get("/api/observacoes")
verificar("aparece na lista", len(r.get_json()["observacoes"]) == 1)

print("\n== 9. Isolamento entre contas ==")
c3 = server.app.test_client()
c3.post("/api/registar", json={"nome": "Maria", "email": "maria@exemplo.pt", "password": "password123"})
r = c3.get("/api/observacoes")
verificar("Maria não vê as observações do Diogo", r.get_json()["observacoes"] == [])
r = c3.delete(f"/api/observacoes/{obs_id}")
verificar("Maria não apaga a observação do Diogo -> 200 sem efeito", r.status_code == 200)
r = c.get("/api/observacoes")
verificar("a observação do Diogo continua lá", len(r.get_json()["observacoes"]) == 1,
          r.get_json()["observacoes"])
r = c.delete(f"/api/observacoes/{obs_id}")
r = c.get("/api/observacoes")
verificar("o dono apaga", r.get_json()["observacoes"] == [])
r = c3.put("/api/localizacao", json={"cidade": "Lisboa", "pais": "Portugal",
                                     "latitude": 38.7169, "longitude": -9.1399,
                                     "timezone": "Europe/Lisbon"})
r = c.get("/api/me")
verificar("a localização da Maria não mexeu na do Diogo",
          r.get_json()["localizacao"]["nome"] == "Paris, França", r.get_json()["localizacao"]["nome"])

print("\n== 10. Sair e voltar a entrar ==")
r = c.post("/api/sair")
r = c.get("/api/me")
verificar("depois de sair fica sem sessão", r.get_json()["utilizador"] is None)
r = c.get("/api/localizacao")
verificar("PUT exige sessão -> 405/401", r.status_code in (401, 405), r.status_code)
r = c.put("/api/localizacao", json={"cidade": "X", "latitude": 1, "longitude": 1})
verificar("guardar localização sem sessão -> 401", r.status_code == 401, r.status_code)
r = c.get("/api/localidades?q=lisboa")
verificar("procurar cidades sem sessão -> 401 (a mesma porta)", r.status_code == 401, r.status_code)

r = c.post("/api/entrar", json={"identificador": "Diogo", "password": "errada"})
verificar("password errada -> 401", r.status_code == 401, r.get_json().get("erro"))
r = c.post("/api/entrar", json={"identificador": "nao-existe", "password": "password123"})
verificar("conta inexistente -> 401", r.status_code == 401, r.get_json().get("erro"))
verificar("a mensagem não revela se a conta existe",
          r.get_json().get("erro") == "Nome ou password incorretos.")
r = c.post("/api/entrar", json={"identificador": "diogo@exemplo.pt", "password": "password123"})
verificar("entrar pelo EMAIL -> 200", r.status_code == 200, r.get_json())
r = c.get("/api/me")
verificar("localização guardada sobrevive ao sair/entrar",
          r.get_json()["localizacao"]["nome"] == "Paris, França", r.get_json()["localizacao"]["nome"])

print("\n== 11. A password não fica em texto na base de dados ==")
import sqlite3
bd = sqlite3.connect(TMP)
linha = bd.execute("SELECT password_hash FROM utilizadores WHERE nome = 'Diogo'").fetchone()
verificar("o hash não contém a password", "password123" not in linha[0], linha[0][:40] + "...")
verificar("o hash tem o formato do werkzeug", linha[0].count("$") >= 2)

print("\n== 12. Páginas ==")
# A entrada é pedida com um cliente SEM sessão: quem já entrou é mandado para o
# perfil (ver pagina_entrar, no auth.py), e o que aqui se quer ver é a página
# com os formulários.
r = c2.get("/entrar")
verificar("/entrar devolve 200 a quem não tem conta", r.status_code == 200, r.status_code)
verificar("a página traz os dois formulários",
          b'id="form-entrar"' in r.data and b'id="form-registar"' in r.data)
for rota in ["/", "/app", "/ceu", "/observatorio", "/apod", "/calendario"]:
    r = c.get(rota)
    verificar(f"{rota} continua aberto sem conta", r.status_code == 200, r.status_code)

print("\n== 13. Ficheiros novos ligados às páginas ==")
for rota, esperado in [("/", b"conta.js"), ("/app", b"conta.js")]:
    r = c.get(rota)
    verificar(f"{rota} carrega o conta.js", esperado in r.data)
    verificar(f"{rota} carrega o conta.css", b"conta.css" in r.data)
    verificar(f"{rota} carrega o shared-ui-controls.js antes do conta.js",
              r.data.find(b"shared-ui-controls.js") < r.data.find(b"conta.js"))

r = c2.get("/entrar")   # sem sessão — é a página de entrada que se quer ver
verificar("/entrar carrega o auth.js", b"auth.js" in r.data)
verificar("/entrar carrega o auth.css", b"auth.css" in r.data)

for ficheiro in ["css/conta.css", "js/conta.js", "css/auth.css", "js/auth.js"]:
    r = c.get("/static/" + ficheiro)
    verificar(f"/static/{ficheiro} é servido", r.status_code == 200, r.status_code)

# O criarEstrelas passou do menu.js para o shared-ui-controls.js. Se alguma das
# pontas se perder, o campo de estrelas desaparecia sem erro nenhum na consola
# — daí a verificação.
r = c.get("/static/js/shared-ui-controls.js")
verificar("criarEstrelas vive no shared-ui-controls.js", b"window.criarEstrelas" in r.data)
r = c.get("/static/js/menu.js")
verificar("o menu.js já não tem uma segunda cópia de criarEstrelas",
          b"function criarEstrelas" not in r.data)
verificar("o menu.js chama a versão partilhada", b"window.criarEstrelas()" in r.data)
r = c.get("/static/js/auth.js")
verificar("a página de entrada usa a versão partilhada", b"window.criarEstrelas()" in r.data)

print("\n== 14. O botão de conta é a porta para o perfil ==")
css = c.get("/static/css/conta.css").data.decode("utf-8")
js  = c.get("/static/js/conta.js").data.decode("utf-8")

# O botão é uma ligação, e não um botão que abre um painel por cima da página:
# é o que o faz funcionar com o teclado, com o clique do meio e antes de o
# JavaScript responder. O href é sempre o mesmo, com sessão ou sem ela — quem
# não tem conta é a página de entrada que o recebe, e volta ao perfil depois de
# entrar (ver pagina_perfil, no auth.py).
verificar("o botão de conta é um <a>", 'createElement("a")' in js)
verificar("e aponta para o perfil", 'botao.href = "/perfil"' in js)

# O painel flutuante que ele abria foi substituído pela página. Se alguém o
# voltasse a pôr — ou deixasse metade dele para trás —, o botão deixava de ser
# uma porta e passava a haver duas contas com metade das ações em cada uma.
verificar("o painel de conta já não existe", "painel-conta" not in js and "painel-conta" not in css)
verificar("e já não há gestos de o fechar", "MutationObserver" not in js and "Escape" not in js)

# O rótulo ("Entrar" ou o nome) sai do servidor, que é quem sabe quem está
# dentro. Não é adivinhado a partir do endereço nem de nada na página.
verificar("o rótulo sai do /api/me", 'fetch("/api/me")' in js)
verificar("sem sessão diz Entrar", '"Entrar"' in js)

# Os dois seletores têm de estar lá. Em VR a classe "observatorio-ativo" sai do
# body (ver mudarEcra, no index.js), por isso deixar só um deles fazia o botão
# reaparecer ao entrar no VR — é este o erro que o teste guarda.
verificar("esconde o botão no Observatório", "body.observatorio-ativo #btn-conta" in css)
verificar("esconde o botão no VR", "body.vr-ativo #btn-conta" in css)

# A regra tem de ganhar à que define o display do botão:
#   #btn-conta -> display: flex (especificidade 1,0,0)
#   body.observatorio-ativo #btn-conta é (1,1,1), logo ganha.
verificar("a regra de esconder usa a mesma especificidade alta",
          css.count("body.observatorio-ativo #btn-conta") == 1
          and css.count("body.vr-ativo #btn-conta") == 1)

print("\n== 15. O Observatório segue a localização da conta ==")
# A rota, e não só o sky_engine: o /api/ceu já era testado no ponto 6, mas o
# /api/observatorio — que é o ecrã onde a localização mais se nota — não era.
r = c.get("/api/observatorio")
verificar("/api/observatorio usa a localização da conta",
          r.get_json().get("localizacao_nome") == "Paris, França", r.get_json().get("localizacao_nome"))
r = c2.get("/api/observatorio")
verificar("outro cliente (sem sessão) fica com Gaia",
          r.get_json().get("localizacao_nome") == "Vila Nova de Gaia, Portugal",
          r.get_json().get("localizacao_nome"))

# A ISS era o único objeto do céu que ficava sempre em Gaia: o iss.py usava o
# observador do módulo em vez do de quem estava a ver. Visto de Sydney, o erro
# dava dezenas de graus — a ISS aparecia no lado errado do céu.
from py.astronomia import iss
from py.config import LOCATION
momento = sky_engine.momento_de(t)
# A "sem localização" é a de config.py, e é mesmo ela que se passa aqui: com
# uma aproximação escrita à mão (41.13 em vez dos 41.1346... do config.py) a
# comparação ficava à mercê do arredondamento do último algarismo.
iss_gaia = iss.get_posicao_iss(momento, LOCATION)
iss_sydney = iss.get_posicao_iss(momento, {"nome": "Sydney", "latitude": -33.87, "longitude": 151.21,
                                           "elevacao": 20, "timezone": "Australia/Sydney"})

if iss_gaia is None:
    # Sem TLE (tipicamente sem rede) a ISS não existe no céu e não há nada
    # para comparar. Diz-se — um teste que passa por não ter corrido é pior do
    # que um que falha, porque dá por verificado o que ninguém verificou.
    print("    (saltado: sem elementos orbitais da ISS — provavelmente sem rede)")
else:
    verificar("a ISS sai em sítios diferentes vista de Gaia e de Sydney",
              (iss_gaia["altitude"], iss_gaia["azimute"]) != (iss_sydney["altitude"], iss_sydney["azimute"]),
              f"Gaia alt={iss_gaia['altitude']} az={iss_gaia['azimute']} | "
              f"Sydney alt={iss_sydney['altitude']} az={iss_sydney['azimute']}")
    verificar("sem localização a ISS sai como saía (não parte quem não passar nenhuma)",
              iss.get_posicao_iss(momento)["altitude"] == iss_gaia["altitude"])

print("\n== 16. O seletor de cidades, no perfil ==")
# A localização escolhe-se pelo NOME. O painel flutuante onde os campos de
# latitude e longitude nasceram foi substituído pela página do perfil, e com
# ele foram-se os dois campos: ninguém sabe de cor que Madrid são 40,4168° N,
# e um algarismo trocado punha o céu inteiro no sítio errado sem nada a avisar.
js   = c.get("/static/js/perfil.js").data.decode("utf-8")
css  = c.get("/static/css/perfil.css").data.decode("utf-8")
html = c.get("/perfil").get_data(as_text=True)

verificar("a página do perfil carrega o perfil.js", "perfil.js" in html)

# O campo onde se escreve o nome da terra, com a lista de resultados por baixo.
verificar("a página tem o campo de procura de cidades",
          'id="local-procura"' in html and 'type="search"' in html)
verificar("o campo sabe que manda na lista (aria-controls)",
          'aria-controls="local-resultados"' in html and 'aria-expanded="false"' in html)
verificar("a lista de resultados começa escondida",
          'id="local-resultados"' in html and 'class="perfil-resultados" role="listbox" hidden' in html)

# A ligação que faltava. O campo, a lista, a rota e o procurarCidade estavam
# todos lá — e escrever não fazia nada, porque ninguém avisava o JavaScript que
# alguém estava a escrever. Nada disto se vê no ecrã (o campo até parecia
# normal, com o cursor a piscar); o que se vê é a lista a não aparecer, e não
# há como distinguir isso de "esta terra não existe".
verificar("escrever no campo chama a procura (o campo está mesmo ligado)",
          'campoProcura.addEventListener("input", procurarCidade)' in js)
verificar("e o Escape continua a fechar a lista, no mesmo sítio",
          'campoProcura.addEventListener("keydown", fecharResultadosComEscape)' in js)

# Uma letra chega para procurar, e é a constante que o diz — não um 2 perdido
# no meio do código. Procurar a partir de uma letra é o que faz a lista servir
# para escolher em vez de obrigar a saber o nome todo de cor.
verificar("a procura aceita uma letra só", "const MINIMO_DA_PROCURA = 1" in js)
verificar("e o limiar é usado, e não só declarado",
          "termo.length < MINIMO_DA_PROCURA" in js)

# A cidade escolhida fica à espera de um "Guardar". Sem este passo, percorrer a
# lista às setas mudava o céu a cada resultado por que se passasse.
verificar("a escolha fica à espera de confirmação antes de gravar",
          'id="local-escolhida"' in html and 'id="btn-guarda-local"' in html
          and "guardarLocalizacaoEscolhida()" in html)
verificar("e começa escondida, como a lista",
          'id="local-escolhida" class="perfil-escolha" hidden' in html)
verificar("e há o caminho do dispositivo, para quem não quer escrever nada",
          'id="btn-local-dispositivo"' in html and "usarLocalizacaoDoBrowser()" in html)

# O que saiu: os campos de coordenadas à mão e o que os abria.
verificar("os campos de latitude e longitude à mão desapareceram",
          "manual-lat" not in html and "manual-lon" not in html and "perfil-form-manual" not in html)
verificar("e não sobrou código a abrir o formulário que já não existe",
          "alternarFormularioManual" not in html and "alternarFormularioManual" not in js)

# Os dois caminhos (a lista e o dispositivo) gravam pelo mesmo sítio. Não é à
# toa: eles encontram-se no mostrarEscolha, e é daí que sai o único "Guardar"
# que existe. Se alguém duplicar a gravação, a próxima correção feita só num
# deles passa despercebida no outro.
# Conta-se o PUT, e não os fetch("/api/localizacao"): o "voltar a Gaia" usa a
# mesma rota com DELETE, e esse é outro pedido, não uma segunda gravação.
verificar("a gravação é uma só, e os dois caminhos chegam à mesma",
          js.count("function guardarLocalizacao(") == 1
          and js.count("await guardarLocalizacao(") == 1
          and js.count('method: "PUT"') == 1
          and js.count("mostrarEscolha(") == 3,   # a definição e os dois caminhos
          f"definições={js.count('function guardarLocalizacao(')} "
          f"chamadas={js.count('await guardarLocalizacao(')} "
          f"PUTs={js.count('method: \"PUT\"')} "
          f"mostrarEscolha={js.count('mostrarEscolha(')}")

# Nada do que vem do servidor chegou a ser interpretado como código: os
# resultados da procura vão para data-* e o texto escreve-se com textContent.
# Com innerHTML, bastava o nome de uma terra para injetar o que quisesse — e o
# geocoding online devolve nomes que ninguém deste lado escreveu.
verificar("os resultados da procura vão para data-*, e não para dentro de código",
          "botao.dataset.cidade" in js and "botao.dataset.latitude" in js
          and "botao.dataset.timezone" in js)
verificar("e o que aparece no ecrã é escrito como texto",
          "nome.textContent" in js and "detalhe.textContent" in js)

# Os data-* são sempre texto: "38.7169" ia para o servidor como string, que o
# recusa (ver _validar_coordenadas, no auth.py) — certo, mas obrigava a uma ida
# e volta à rede para nada.
verificar("as coordenadas lidas do DOM são convertidas em números",
          "Number(botao.dataset.latitude)" in js and "Number(botao.dataset.longitude)" in js)

# Escrever "Madrid" são seis teclas, e não se pode perguntar ao servidor por
# cada uma: espera-se que a pessoa pare, e só então se pergunta.
verificar("a procura espera que se pare de escrever antes de perguntar",
          "ESPERA_DA_PROCURA" in js and "clearTimeout(temporizadorProcura)" in js)
# Duas procuras seguidas podiam chegar trocadas — a resposta de "Mad" a chegar
# depois da de "Madrid" — e a lista mostrava o que já não correspondia ao campo.
verificar("e a resposta atrasada de uma procura antiga é deitada fora",
          "meuPedido !== pedidoAtual" in js)
verificar("o Escape fecha a lista sem apagar o que está escrito",
          "fecharResultadosComEscape" in js and '"Escape"' in js)

# A hora local anda no fuso da localização escolhida, e não no do computador:
# é a prova visível de que o fuso ficou bem guardado. O fuso vem do data-* que
# o servidor escreveu, e não de uma segunda cópia no JavaScript — dois sítios
# onde ele estivesse escrito eram dois fusos a poder discordar.
verificar("o cartão mostra o fuso e as coordenadas da localização a valer",
          "Fuso horário" in html and "Coordenadas" in html and 'id="perfil-hora-local"' in html)
verificar("e a hora é calculada no fuso que o servidor escreveu no data-*",
          "dataset.fuso" in js and "timeZone: fuso" in js and "data-fuso=" in html)

for classe in [".perfil-campo {", ".perfil-resultados {", ".perfil-escolha {"]:
    verificar(f"{classe} está no CSS", classe in css)
# O [hidden] do HTML não ganha à regra que dá "display: block" a um <ul>: sem
# estas linhas, a lista de resultados aparecia aberta e vazia antes de se
# procurar seja o que for.
verificar("o CSS repõe o escondido que o display do browser ganhava",
          ".perfil-resultados[hidden]" in css and ".perfil-escolha[hidden]" in css)
verificar("os campos podem encolher dentro da linha", "min-width: 0" in css)

# A página do perfil cresce com o número de favoritos e de observações. Com o
# "overflow: hidden" do menu.css (que ela veste, pela moldura), o fim da página
# desaparecia — e sem barra de scroll para lá chegar, porque o que está
# escondido não se percorre. Era o painel que tinha scroll próprio; agora é a
# página. (O /admin tem exatamente a mesma regra, pelo mesmo motivo.)
verificar("a página do perfil tem scroll próprio",
          "body.page-perfil" in css and "overflow-y: auto" in css)

print("\n== 17. A página /admin ==")
import io, contextlib

# c2 nunca iniciou sessão (foi o cliente usado para o registo duplicado, que
# falhou) — é o caso "não entraste".
r = c2.get("/admin")
verificar("sem sessão -> redireciona para a entrada", r.status_code == 302, r.status_code)
verificar("e o destino traz de volta ao /admin",
          "seguinte=/admin" in r.headers.get("Location", ""), r.headers.get("Location"))

# c3 é a Maria, com sessão mas sem papel — é o caso "entraste mas não podes".
r = c3.get("/admin")
negado = r.get_data(as_text=True)
verificar("conta sem o papel -> 403", r.status_code == 403, r.status_code)
verificar("a página explica que falta o papel", "não tem esse papel" in negado)
verificar("e diz como se atribui", "promover_admin.py" in negado)

# O que interessa mesmo: uma porta fechada não pode deixar escapar nada. Se a
# página mostrasse a tabela antes de verificar o papel — ou se o 403 viesse
# depois de renderizar — os dados de todos os utilizadores saíam para quem
# não é admin, e o código de estado era o único sinal de que algo correra mal.
verificar("a porta fechada não mostra dados de ninguém",
          "maria@exemplo.pt" not in negado and "diogo@exemplo.pt" not in negado)

# Promover pelo script, que é o caminho a sério — e não escrevendo na coluna
# à mão aqui no teste. Com um UPDATE direto, o teste passava mesmo que o
# script estivesse avariado, e o script é justamente o que o utilizador vai
# correr para ganhar acesso.
def correr_promover(*argumentos):
    # O main() lê sys.argv e escreve no stdout: substitui-se um e apanha-se o
    # outro, para o teste poder verificar as mensagens sem as imprimir no meio
    # dos resultados.
    antigo = sys.argv
    sys.argv = ["promover_admin.py", *argumentos]
    saida = io.StringIO()
    try:
        with contextlib.redirect_stdout(saida):
            codigo = promover_admin.main()
    finally:
        sys.argv = antigo
    return codigo, saida.getvalue()

codigo, saida = correr_promover("diogo@exemplo.pt")
verificar("o script promove -> código 0", codigo == 0, codigo)
verificar("e diz o que fez", "é agora administrador" in saida, saida.strip())

# Sem novo login: a sessão que já estava aberta passa a valer como admin. É o
# que faz o papel depender da base de dados e não da cópia que ficou gravada
# na sessão no momento da entrada.
r = c.get("/api/me")
verificar("/api/me passa a dizer que é admin", r.get_json()["utilizador"]["admin"] is True,
          r.get_json()["utilizador"])

# A entrada tem uma consulta própria, escrita à mão e separada da do /api/me.
# Foi por essa costura que a coluna "papel" escapou: o SELECT do login não a
# trazia, e TODAS as entradas bem-sucedidas rebentavam com IndexError depois
# de já terem aberto a sessão — o utilizador entrava e via um erro 500. Este
# teste é o que prende as duas consultas à mesma resposta.
c5 = server.app.test_client()
r = c5.post("/api/entrar", json={"identificador": "diogo@exemplo.pt", "password": "password123"})
verificar("entrar com uma conta admin -> 200", r.status_code == 200, r.status_code)
verificar("e a resposta da entrada também diz que é admin",
          r.get_json()["utilizador"]["admin"] is True, r.get_json())

r = c.get("/admin")
texto = r.get_data(as_text=True)
verificar("/admin devolve 200 ao admin", r.status_code == 200, r.status_code)
verificar("a tabela lista as contas", "diogo@exemplo.pt" in texto and "maria@exemplo.pt" in texto)
verificar("com a localização de cada uma", "Paris" in texto and "Lisboa" in texto)
verificar("avisa que é só de leitura", "só mostra" in texto)

# O que a página mostra é a lista de contas, não os segredos delas. Uma coluna
# a mais na consulta punha hashes de password no HTML de uma página que fica
# aberta no browser.
verificar("não mostra hashes de password",
          "password_hash" not in texto and "scrypt" not in texto)

# Esta é a única página da aplicação que ninguém abre por acidente: se os
# ficheiros que lhe dão forma não estiverem ligados, quem tem o papel vê uma
# tabela sem estilo e não sabe se é um bug ou se é assim. Nas outras páginas
# o erro salta à vista a toda a hora; aqui passava despercebido.
verificar("a página carrega o admin.css", "admin.css" in texto)
verificar("a página carrega o admin.js", "admin.js" in texto)
for ficheiro in ["css/admin.css", "js/admin.js"]:
    r = c.get("/static/" + ficheiro)
    verificar(f"/static/{ficheiro} é servido", r.status_code == 200, r.status_code)

# Ter um admin na base de dados não pode tornar admin quem chegou depois:
# a verificação é da conta que está a pedir, não da existência de admins.
r = c3.get("/admin")
verificar("a conta sem papel continua sem acesso depois de haver um admin",
          r.status_code == 403, r.status_code)

codigo, saida = correr_promover("diogo@exemplo.pt")
verificar("promover quem já é admin não é erro", codigo == 0, codigo)
verificar("e di-lo em vez de repetir a operação", "já é administrador" in saida, saida.strip())

# O email é declarado COLLATE NOCASE no esquema. Sem isso, escrever o email com
# outra caixa não encontrava a conta e o utilizador ficava a achar que a conta
# não existia — logo a seguir a se ter registado com ela.
codigo, saida = correr_promover("DIOGO@EXEMPLO.PT")
verificar("o email encontra a conta sem olhar à caixa", "já é administrador" in saida, saida.strip())

codigo, saida = correr_promover("nao-existe@exemplo.pt")
verificar("email inexistente -> código 1", codigo == 1, codigo)
verificar("e lista as contas que existem para ajudar a encontrar o engano",
          "diogo@exemplo.pt" in saida and "maria@exemplo.pt" in saida)

codigo, saida = correr_promover("Diogo@Exemplo.pt", "--remover")
verificar("o --remover tira o papel", codigo == 0, codigo)
verificar("e diz que tirou", "deixou de ser administrador" in saida, saida.strip())

r = c.get("/api/me")
verificar("/api/me volta a dizer que não é admin", r.get_json()["utilizador"]["admin"] is False)
r = c.get("/admin")
verificar("e /admin volta a fechar", r.status_code == 403, r.status_code)

# O --remover funciona em qualquer posição: quem escreve o comando está a
# pensar no que quer, não na ordem dos argumentos.
codigo, saida = correr_promover("--remover", "diogo@exemplo.pt")
verificar("sem o papel, despromover de novo não é erro", codigo == 0, codigo)
verificar("e di-lo", "não é administrador. Não há nada a fazer" in saida, saida.strip())

codigo, saida = correr_promover()
verificar("sem argumentos -> lista os admins", codigo == 0, codigo)
verificar("e, não havendo nenhum, explica como se dá o papel",
          "Ainda não há administradores" in saida and "py promover_admin.py" in saida, saida.strip())

correr_promover("diogo@exemplo.pt")   # deixa um admin para o teste da listagem
codigo, saida = correr_promover()
verificar("com um admin, a listagem mostra-o", "diogo@exemplo.pt" in saida and "Administradores" in saida,
          saida.strip())

print("\n== 18. A página /perfil ==")
# Sem sessão: para a página de entrada, com o "seguinte" que traz a pessoa de
# volta — é ele que faz o botão do canto servir as duas coisas (a porta para
# quem está de fora e o atalho para quem já entrou).
r = c2.get("/perfil")
verificar("sem sessão -> redireciona para a entrada", r.status_code == 302, r.status_code)
verificar("e o destino traz de volta ao /perfil",
          "seguinte=/perfil" in r.headers.get("Location", ""), r.headers.get("Location"))

# A Maria tem sessão e não tem o papel: é o caso "entrei, mas não sou admin".
r = c3.get("/perfil")
texto_maria = r.get_data(as_text=True)
verificar("quem tem sessão vê o perfil -> 200", r.status_code == 200, r.status_code)
verificar("com o nome e o email da própria conta",
          "Maria" in texto_maria and "maria@exemplo.pt" in texto_maria)
verificar("e com a localização dela", "Lisboa" in texto_maria)
# A ligação à administração aparece só a quem tem o papel (o Diogo foi
# promovido no ponto anterior, a Maria não). Não é ela que protege a página —
# quem escrever /admin à mão bate na mesma na verificação do servidor — mas um
# botão que leva a uma porta fechada é um caminho inútil que se evita.
verificar("não mostra a ligação à administração a quem não tem o papel",
          'href="/admin"' not in texto_maria)

texto_diogo = c.get("/perfil").get_data(as_text=True)
verificar("o admin vê o papel e a ligação para a administração",
          "Administrador" in texto_diogo and 'href="/admin"' in texto_diogo)

# Um favorito de verdade, um favorito que já não existe no catálogo, e uma
# observação — a página tem de mostrar as três coisas.
# O nome da observação não pode ser "Saturno": é esse o exemplo que a frase do
# caderno vazio dá, e a Maria (que não tem observações nenhumas) mostraria a
# mesma palavra por outra razão — o teste passava por engano.
c.post("/api/favoritos", json={"tipo": "constelacao", "objeto_id": "Ori"})
c.post("/api/favoritos", json={"tipo": "estrela", "objeto_id": "ja-nao-existe"})
c.post("/api/observacoes", json={"objeto_nome": "Vénus", "data": "2026-09-18",
                                 "nota": "Anéis bem visíveis"})
texto = c.get("/perfil").get_data(as_text=True)

# O nome do favorito sai do catálogo do Python: o que está guardado é o id
# ("Ori"), e quem sabe que ele se chama "Orion" é o servidor. É esta a razão
# por que a página é desenhada no lado do servidor em vez de um endpoint em
# JSON a mais.
verificar("o favorito mostra o nome do catálogo, não o id", "Orion" in texto)
# Um favorito é o registo de uma pessoa e não desaparece por o catálogo mudar:
# o que já não tem nome mostra-se pelo id, que ainda diz o que era.
verificar("um favorito que saiu do catálogo mostra o id", "ja-nao-existe" in texto)
verificar("a observação aparece com a data legível", "Vénus" in texto and "18/09/2026" in texto)
verificar("e com a nota escrita", "Anéis bem visíveis" in texto)

# O isolamento entre contas, do lado da página e não só da API: o perfil é
# desenhado a partir da conta que está a pedir, e não da última que mexeu em
# nada. É o mesmo "AND utilizador_id = ?" das rotas, visto por outro caminho.
texto_maria = c3.get("/perfil").get_data(as_text=True)
verificar("a Maria não vê os favoritos nem as observações do Diogo",
          "Orion" not in texto_maria and "Vénus" not in texto_maria)

# Uma página que fica aberta no browser não leva segredos.
verificar("não mostra hashes de password",
          "password_hash" not in texto and "scrypt" not in texto)

verificar("a página carrega o perfil.css", "perfil.css" in texto)
verificar("e o conta.js, que desenha o botão do canto", "conta.js" in texto)
for ficheiro in ["css/perfil.css", "js/perfil.js"]:
    r = c.get("/static/" + ficheiro)
    verificar(f"/static/{ficheiro} é servido", r.status_code == 200, r.status_code)

# ── O ★ do painel de detalhes do Observatório ──
# É o único sítio onde se marca um favorito. Sem ele, a lista do perfil nunca
# se enchia — e é por isso que ele entra no mesmo ponto que a página.
index_js = c.get("/static/js/index.js").data.decode("utf-8")
verificar("o painel de detalhes tem o botão dos favoritos", "alternarFavorito(this)" in index_js)
# Um clique marca e desmarca: o mesmo botão, os dois pedidos da mesma rota.
verificar("o mesmo botão marca e desmarca", 'jaEstava ? "DELETE" : "POST"' in index_js)
# Os tipos que o ★ manda têm de ser os que o servidor aceita (TIPOS_FAVORITO).
# O contrário — o servidor ter tipos que o ★ não conhece — não é erro: é só um
# favorito que ainda não se pode marcar a partir do céu.
from py.database.auth import TIPOS_FAVORITO
for tipo in ("constelacao", "ceu_profundo", "estrela"):
    verificar(f"o botão dos favoritos sabe guardar um objeto do tipo {tipo}",
              all([tipo in TIPOS_FAVORITO, f'item.tipo === "{tipo}"' in index_js]))
# Sem sessão a rota responde 401: em vez de uma mensagem de erro, manda-se a
# pessoa entrar e volta-se ao Observatório — o ?seguinte= é o que a página de
# entrada usa para a trazer de volta (ver auth.js), e é fixo porque é essa a
# página que abre já neste ecrã.
verificar("sem sessão manda entrar e voltar ao Observatório",
          '"/entrar?seguinte=/observatorio"' in index_js)

print("\n== 19. Depois de entrar, aterra-se no perfil ==")
# O botão do canto é desenhado antes de o /api/me responder, e um clique nesse
# instante levava a /entrar quem já está dentro da conta — a olhar para um
# pedido de password que não faz sentido. Quem resolve isso é o servidor.
r = c.get("/entrar")
verificar("/entrar com sessão -> redireciona para o perfil", r.status_code == 302, r.status_code)
verificar("e o destino é mesmo o perfil", r.headers.get("Location", "").endswith("/perfil"),
          r.headers.get("Location"))
r = c2.get("/entrar")
verificar("sem sessão, /entrar continua a ser a página de entrada", r.status_code == 200, r.status_code)

# O destino depois de entrar é decidido no browser (ver auth.js): o ?seguinte=
# ganha quando existe — é dele que o /admin depende — e o perfil é a omissão.
auth_js = c.get("/static/js/auth.js").data.decode("utf-8")
verificar("o destino por omissão é o perfil", 'DESTINO_POR_OMISSAO = "/perfil"' in auth_js)
verificar("e o ?seguinte= continua a ganhar quando existe",
          "caminhoInterno ? pedido : DESTINO_POR_OMISSAO" in auth_js)
# O valor do endereço é do utilizador e não é de confiança: um "seguinte"
# externo levava a pessoa a aterrar num site alheio logo a seguir a ter
# escrito a password aqui.
verificar("e só passa caminhos internos",
          'pedido.startsWith("/") && !pedido.startsWith("//")' in auth_js)

# A outra ponta do mesmo ?seguinte=: quem é mandado para a entrada a meio do
# /admin volta ao /admin, e não ao perfil. É o lado do servidor daquilo que o
# auth.js promete do lado do browser.
r = c2.get("/admin")
verificar("o /admin continua a trazer de volta ao /admin",
          "seguinte=/admin" in r.headers.get("Location", ""), r.headers.get("Location"))

print("\n== 20. Um registo novo nunca nasce admin ==")
c4 = server.app.test_client()
r = c4.post("/api/registar", json={"nome": "Novo", "email": "novo@exemplo.pt", "password": "password123"})
verificar("a resposta do registo diz admin: false",
          r.get_json()["utilizador"]["admin"] is False, r.get_json())
r = c4.get("/api/me")
verificar("e /api/me confirma", r.get_json()["utilizador"]["admin"] is False)
r = c4.get("/admin")
verificar("o registo novo não abre /admin", r.status_code == 403, r.status_code)

print("\n== 21. Base de dados anterior ganha a coluna \"papel\" ==")
# O DEFAULT do SQL é texto literal — o Python não interpola ali a constante.
# Se alguém mudar uma das duas pontas (db.PAPEL_UTILIZADOR ou o esquema) e
# esquecer a outra, as contas novas passam a nascer com um papel que o resto
# do código não reconhece, e o sintoma é só "esta conta não é admin", sem
# causa à vista. Esta verificação prende as duas.
verificar("a constante e o DEFAULT do esquema dizem o mesmo",
          f"DEFAULT '{db.PAPEL_UTILIZADOR}'" in db.ESQUEMA, db.PAPEL_UTILIZADOR)

# Uma base de dados criada ANTES de o papel existir. O CREATE TABLE IF NOT
# EXISTS do esquema não toca numa tabela que já lá esteja — nem para lhe juntar
# uma coluna. Sem a migração em db._acrescentar_colunas_em_falta, esta base
# ficava sem "papel" e a aplicação partia na primeira consulta que a pedisse
# (o registo, a entrada e o /admin), num erro que não tem nada a ver com a
# causa. É o caso de quem já tinha o projeto a correr antes desta alteração.
ANTIGA = os.path.join(tempfile.gettempdir(), "astroguide_antiga.db")
if os.path.exists(ANTIGA):
    os.remove(ANTIGA)

velha = sqlite3.connect(ANTIGA)
velha.executescript("""
    CREATE TABLE utilizadores (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        nome          TEXT    NOT NULL UNIQUE COLLATE NOCASE,
        email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT    NOT NULL,
        criado_em     TEXT    NOT NULL
    );
    INSERT INTO utilizadores (nome, email, password_hash, criado_em)
    VALUES ('Antigo', 'antigo@exemplo.pt', 'hash-de-exemplo', '2026-01-01T00:00:00+00:00');
""")
velha.commit()
velha.close()

guardado = db.CAMINHO_BD
try:
    db.CAMINHO_BD = ANTIGA
    db.criar_esquema()
finally:
    db.CAMINHO_BD = guardado   # reposto mesmo que a migração rebente

velha = sqlite3.connect(ANTIGA)
velha.row_factory = sqlite3.Row
colunas = [col["name"] for col in velha.execute("PRAGMA table_info(utilizadores)")]
verificar("a coluna \"papel\" foi acrescentada", "papel" in colunas, colunas)

linha = velha.execute("SELECT papel FROM utilizadores WHERE nome = 'Antigo'").fetchone()
verificar("quem já tinha conta fica utilizador normal, não admin",
          linha["papel"] == db.PAPEL_UTILIZADOR, linha["papel"])
verificar("e os dados que lá estavam continuam lá",
          velha.execute("SELECT email FROM utilizadores WHERE nome = 'Antigo'").fetchone()["email"]
          == "antigo@exemplo.pt")

# A migração acrescenta a coluna, não a tabela: as outras têm de ter nascido
# também, senão a base antiga ficava só com metade do esquema.
tabelas = {t["name"] for t in velha.execute("SELECT name FROM sqlite_master WHERE type = 'table'")}
verificar("as tabelas em falta foram criadas", {"localizacoes", "favoritos", "observacoes"} <= tabelas,
          sorted(tabelas))
velha.close()
os.remove(ANTIGA)

print("\n== 22. A localização que já estava guardada ganha cidade ==")
# A outra metade da migração, e a que toca a quem já usava a aplicação: uma
# base de dados COM uma localização guardada, mas da forma antiga (sem
# "cidade" nem "pais", porque os campos não existiam). Sem o ALTER TABLE, o
# INSERT da localização partia com "no such column: cidade"; sem o UPDATE de
# trás, a página do perfil mostrava a localização sem nome nenhum.
ANTIGA2 = os.path.join(tempfile.gettempdir(), "astroguide_local_antiga.db")
if os.path.exists(ANTIGA2):
    os.remove(ANTIGA2)

velha = sqlite3.connect(ANTIGA2)
velha.executescript("""
    CREATE TABLE utilizadores (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        nome          TEXT    NOT NULL UNIQUE COLLATE NOCASE,
        email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT    NOT NULL,
        criado_em     TEXT    NOT NULL,
        papel         TEXT    NOT NULL DEFAULT 'utilizador'
    );
    INSERT INTO utilizadores (nome, email, password_hash, criado_em)
    VALUES ('Antigo', 'antigo@exemplo.pt', 'hash-de-exemplo', '2026-01-01T00:00:00+00:00');

    CREATE TABLE localizacoes (
        utilizador_id INTEGER PRIMARY KEY REFERENCES utilizadores(id) ON DELETE CASCADE,
        nome          TEXT    NOT NULL,
        latitude      REAL    NOT NULL,
        longitude     REAL    NOT NULL,
        elevacao      REAL    NOT NULL DEFAULT 0,
        timezone      TEXT    NOT NULL DEFAULT 'Europe/Lisbon'
    );
    INSERT INTO localizacoes (utilizador_id, nome, latitude, longitude, elevacao, timezone)
    VALUES (1, 'Serra da Estrela', 40.3219, -7.6128, 1993, 'Europe/Lisbon');
""")
velha.commit()
velha.close()

guardado = db.CAMINHO_BD
try:
    db.CAMINHO_BD = ANTIGA2
    db.criar_esquema()
finally:
    db.CAMINHO_BD = guardado

velha = sqlite3.connect(ANTIGA2)
velha.row_factory = sqlite3.Row
colunas = {c["name"] for c in velha.execute("PRAGMA table_info(localizacoes)")}
verificar("a localização antiga ganhou as colunas da cidade e do país",
          {"cidade", "pais"} <= colunas, sorted(colunas))

linha = velha.execute("SELECT * FROM localizacoes WHERE utilizador_id = 1").fetchone()
verificar("e a localização que lá estava ficou com o nome antigo como cidade",
          linha["cidade"] == "Serra da Estrela", dict(linha))
verificar("sem país, porque nunca ninguém o escolheu", linha["pais"] == "", linha["pais"])
verificar("e as coordenadas que lá estavam não se mexeram",
          abs(linha["latitude"] - 40.3219) < 1e-9 and abs(linha["longitude"] + 7.6128) < 1e-9,
          (linha["latitude"], linha["longitude"]))

# E o que aparece no ecrã: sem país, o nome legível é só a cidade. Com vírgula
# e país vazio, o cabeçalho mostrava "Serra da Estrela, " — que é o tipo de
# coisa que só se vê depois de estar à frente de quem usa a aplicação.
from py.localizacao import nome_legivel
verificar("e o nome que se vê é a cidade, sem vírgula pendurada",
          nome_legivel({"cidade": linha["cidade"], "pais": linha["pais"]}) == "Serra da Estrela",
          nome_legivel({"cidade": linha["cidade"], "pais": linha["pais"]}))
velha.close()
os.remove(ANTIGA2)

bd.close()
os.remove(TMP)

print("\n" + "=" * 60)
if falhas:
    print(f"{len(falhas)} FALHA(S): " + ", ".join(falhas))
    sys.exit(1)
print("TODOS OS TESTES PASSARAM")
