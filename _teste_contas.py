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
verificar("localização por omissão é Gaia", d["localizacao"]["nome"] == "Vila Nova de Gaia", d["localizacao"]["nome"])

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

print("\n== 5. Localização pessoal ==")
r = c.put("/api/localizacao", json={"nome": "Paris", "latitude": 48.8566, "longitude": 2.3522,
                                    "elevacao": 35, "timezone": "Europe/Paris"})
verificar("guardar localização -> 200", r.status_code == 200, r.get_json())
r = c.put("/api/localizacao", json={"nome": "X", "latitude": 200, "longitude": 2})
verificar("latitude fora do intervalo -> 400", r.status_code == 400, r.get_json().get("erro"))
r = c.put("/api/localizacao", json={"nome": "X", "latitude": 48, "longitude": 2, "timezone": "Marte/Olympus"})
verificar("fuso horário inválido -> 400", r.status_code == 400, r.get_json().get("erro"))
r = c.put("/api/localizacao", json={"nome": "X", "latitude": "abc", "longitude": 2})
verificar("latitude não numérica -> 400", r.status_code == 400, r.get_json().get("erro"))

r = c.get("/api/me")
verificar("a localização ficou guardada", r.get_json()["localizacao"]["nome"] == "Paris",
          r.get_json()["localizacao"])

print("\n== 6. A localização chega ao cálculo do céu ==")
r = c.get("/api/ceu")
verificar("/api/ceu usa a localização da conta", r.get_json()["location"] == "Paris", r.get_json()["location"])
r = c2.get("/api/ceu")
verificar("outro cliente (sem sessão) fica com Gaia", r.get_json()["location"] == "Vila Nova de Gaia",
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
r = c3.put("/api/localizacao", json={"nome": "Lisboa", "latitude": 38.7, "longitude": -9.1})
r = c.get("/api/me")
verificar("a localização da Maria não mexeu na do Diogo",
          r.get_json()["localizacao"]["nome"] == "Paris", r.get_json()["localizacao"]["nome"])

print("\n== 10. Sair e voltar a entrar ==")
r = c.post("/api/sair")
r = c.get("/api/me")
verificar("depois de sair fica sem sessão", r.get_json()["utilizador"] is None)
r = c.get("/api/localizacao")
verificar("PUT exige sessão -> 405/401", r.status_code in (401, 405), r.status_code)
r = c.put("/api/localizacao", json={"nome": "X", "latitude": 1, "longitude": 1})
verificar("guardar localização sem sessão -> 401", r.status_code == 401, r.status_code)

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
          r.get_json()["localizacao"]["nome"] == "Paris", r.get_json()["localizacao"]["nome"])

print("\n== 11. A password não fica em texto na base de dados ==")
import sqlite3
bd = sqlite3.connect(TMP)
linha = bd.execute("SELECT password_hash FROM utilizadores WHERE nome = 'Diogo'").fetchone()
verificar("o hash não contém a password", "password123" not in linha[0], linha[0][:40] + "...")
verificar("o hash tem o formato do werkzeug", linha[0].count("$") >= 2)

print("\n== 12. Páginas ==")
r = c.get("/entrar")
verificar("/entrar devolve 200", r.status_code == 200, r.status_code)
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

r = c.get("/entrar")
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

print("\n== 14. O botão de conta some-se nos modos imersivos ==")
css = c.get("/static/css/conta.css").data.decode("utf-8")
js  = c.get("/static/js/conta.js").data.decode("utf-8")

# Os dois seletores têm de estar lá. Em VR a classe "observatorio-ativo" sai do
# body (ver mudarEcra, no index.js), por isso deixar só um deles fazia o botão
# reaparecer ao entrar no VR — é este o erro que o teste guarda.
verificar("esconde o botão no Observatório", "body.observatorio-ativo #btn-conta" in css)
verificar("esconde o botão no VR", "body.vr-ativo #btn-conta" in css)
verificar("esconde o painel no Observatório", "body.observatorio-ativo #painel-conta" in css)
verificar("esconde o painel no VR", "body.vr-ativo #painel-conta" in css)

# A regra tem de ganhar às que definem o display destes elementos:
#   #btn-conta        -> display: flex   (especificidade 1,0,0)
#   #painel-conta     -> display: none   (1,0,0)
#   #painel-conta.visivel -> display: block (1,1,0)
# body.observatorio-ativo #btn-conta é (1,1,1), logo ganha às três.
verificar("a regra de esconder usa a mesma especificidade alta dos dois lados",
          css.count("body.observatorio-ativo #btn-conta") == 1
          and css.count("body.vr-ativo #btn-conta") == 1)

# O painel é fechado também no estado, e não só escondido no ecrã.
verificar("o painel é fechado ao entrar num modo imersivo", "MutationObserver" in js)
verificar("o fecho cobre os dois modos",
          'classList.contains("observatorio-ativo")' in js and 'classList.contains("vr-ativo")' in js)

print("\n== 15. O Observatório segue a localização da conta ==")
# A rota, e não só o sky_engine: o /api/ceu já era testado no ponto 6, mas o
# /api/observatorio — que é o ecrã onde a localização mais se nota — não era.
r = c.get("/api/observatorio")
verificar("/api/observatorio usa a localização da conta",
          r.get_json().get("localizacao_nome") == "Paris", r.get_json().get("localizacao_nome"))
r = c2.get("/api/observatorio")
verificar("outro cliente (sem sessão) fica com Gaia",
          r.get_json().get("localizacao_nome") == "Vila Nova de Gaia", r.get_json().get("localizacao_nome"))

# A ISS era o único objeto do céu que ficava sempre em Gaia: o iss.py usava o
# observador do módulo em vez do de quem estava a ver. Visto de Sydney, o erro
# dava dezenas de graus — a ISS aparecia no lado errado do céu.
from py.astronomia import iss
momento = sky_engine.momento_de(t)
iss_gaia = iss.get_posicao_iss(momento, {"nome": "Gaia", "latitude": 41.13, "longitude": -8.66,
                                         "elevacao": 75, "timezone": "Europe/Lisbon"})
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

print("\n== 16. Localização escrita à mão ==")
js  = c.get("/static/js/conta.js").data.decode("utf-8")
css = c.get("/static/css/conta.css").data.decode("utf-8")

verificar("o painel tem o botão de escrever coordenadas", "alternarFormularioManual" in js)
verificar("o formulário tem latitude e longitude",
          'id="manual-lat"' in js and 'id="manual-lon"' in js)
verificar("o formulário começa fechado",
          'id="conta-form-manual" style="display:none"' in js)

# Os dois caminhos (o detetado pelo browser e o escrito à mão) gravam pelo
# mesmo sítio. Se alguém duplicar a gravação, a próxima correção feita só num
# deles passa despercebida no outro.
# Conta-se o PUT, e não os fetch("/api/localizacao"): o "voltar a Gaia" usa a
# mesma rota com DELETE, e esse é outro pedido, não uma segunda gravação.
verificar("a gravação é uma só e é usada pelos dois caminhos",
          js.count("function guardarLocalizacao(") == 1
          and js.count("await guardarLocalizacao(") == 2
          and js.count('method: "PUT"') == 1,
          f"definições={js.count('function guardarLocalizacao(')} "
          f"chamadas={js.count('await guardarLocalizacao(')} "
          f"PUTs={js.count('method: \"PUT\"')}")

# A validação do browser repete a do servidor (auth.py). Os limites têm de
# bater certo: se o browser deixar passar o que o servidor recusa, o
# utilizador só descobre o erro depois da ida e volta à rede.
verificar("latitude validada no browser com os limites do servidor", "latitude < -90 || latitude > 90" in js)
verificar("longitude validada no browser com os limites do servidor", "longitude < -180 || longitude > 180" in js)
verificar("elevação validada no browser com os limites do servidor", "elevacao < -500 || elevacao > 9000" in js)

# É o erro clássico do Number(""): sem um teste ao texto antes da conversão,
# deixar a latitude em branco gravava 0° — o Golfo da Guiné — sem avisar.
verificar("campo em branco não passa por zero", 'textoLat === ""' in js)

verificar("o fuso do dispositivo é reaproveitado nos dois caminhos",
          js.count("fusoDoDispositivo()") >= 2)

for classe in [".conta-campo {", ".conta-campos-linha {"]:
    verificar(f"{classe} está no CSS", classe in css)
verificar("os campos podem encolher dentro da linha", "min-width: 0" in css)

# Com o formulário de coordenadas aberto o painel fica mais alto do que um
# ecrã pequeno. Sendo position: fixed, não acompanha o scroll da página —
# sem scroll próprio, o botão de guardar saía fora do ecrã e não havia como
# lá chegar. É por isso que isto é testado e não só escrito.
verificar("o painel tem scroll próprio",
          "max-height: calc(100vh - 96px)" in css and "overflow-y: auto" in css)

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

print("\n== 18. Um registo novo nunca nasce admin ==")
c4 = server.app.test_client()
r = c4.post("/api/registar", json={"nome": "Novo", "email": "novo@exemplo.pt", "password": "password123"})
verificar("a resposta do registo diz admin: false",
          r.get_json()["utilizador"]["admin"] is False, r.get_json())
r = c4.get("/api/me")
verificar("e /api/me confirma", r.get_json()["utilizador"]["admin"] is False)
r = c4.get("/admin")
verificar("o registo novo não abre /admin", r.status_code == 403, r.status_code)

print("\n== 19. Base de dados anterior ganha a coluna \"papel\" ==")
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

bd.close()
os.remove(TMP)

print("\n" + "=" * 60)
if falhas:
    print(f"{len(falhas)} FALHA(S): " + ", ".join(falhas))
    sys.exit(1)
print("TODOS OS TESTES PASSARAM")
