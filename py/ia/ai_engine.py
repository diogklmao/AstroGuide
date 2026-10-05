# ============================================================
#  ai_engine.py — o motor da AstroGuide AI
#
#  É o único ficheiro do projeto que fala com um serviço de IA.
#  Tudo o resto — o endpoint, o painel, o histórico — fala com
#  este módulo sem saber sequer qual é o fornecedor: é isso que
#  faz com que trocar o Gemini por outro serviço seja mexer
#  aqui e mais nada.
#
#  O que este módulo NÃO faz, de propósito: cálculos astronómicos.
#  Recebe a localização já resolvida — a mesma que o /api/ceu usa
#  — e escreve-a no pedido como contexto. Posições, fases e horas
#  continuam a sair do sky_engine.py e do eventos.py. A IA é uma
#  porta de entrada para esses dados, nunca um substituto deles.
#
#  O modelo não responde de cor: tem à frente as ferramentas do
#  ferramentas.py, que vão buscar os números ao motor do
#  AstroGuide. Quando lhe perguntam onde está Júpiter, ele não
#  sabe — pede a posição, recebe-a, e só então escreve a
#  resposta. É este vaivém que faz com que um número que saia
#  daqui seja o mesmo que está no Céu Agora.
# ============================================================

import datetime
import os
import re
import time
from zoneinfo import ZoneInfo

from py.config import LOCATION
from py.ia import ferramentas


# ── Configuração ──────────────────────────────────────────────────────────────

# O modelo principal. É um "flash" de propósito: isto é uma janela de conversa,
# e interessa responder depressa e barato, não raciocinar durante meio minuto.
MODELO = "gemini-3.8-flash"

# Os modelos de recurso, pela ordem por que se desce até eles.
#
# Isto existe por causa de uma coisa que só se descobre a levar com ela: o plano
# gratuito do Google dá 20 pedidos por dia — POR MODELO. O erro é explícito
# ("GenerateRequestsPerDayPerProjectPerModel-FreeTier", limit: 20, model:
# gemini-3.8-flash), e o "PerModel" no meio do nome é a parte que interessa:
# cada modelo tem o seu próprio balde de 20, e esgotar um não gasta nada do
# outro.
#
# Sem esta lista, a aplicação tem 20 perguntas por dia — o que uma demonstração
# gasta em dez minutos, e a partir daí o painel só sabe dizer que há demasiados
# pedidos. Com ela, cada modelo acrescenta o seu balde.
#
# A ordem não é arbitrária: os primeiros escrevem melhor português de Portugal,
# e os "lite" são mais rápidos mas mais propensos a escorregar para o português
# do Brasil. Como só se desce a lista quando os de cima estão esgotados, em uso
# normal respondem sempre os melhores.
#
# Dois modelos que aqui estiveram já lá não estão: o gemini-2.5-flash e o
# gemini-2.5-flash-lite continuam a aparecer na listagem da API, mas na geração
# respondem 404 — "no longer available to new users". Estava-se a gastar duas
# voltas da lista inteira à procura de uma resposta que nunca vinha e, pior,
# era esse 404 (a última falha de todas) que subia ao painel a dizer que não se
# encontravam modelos, escondendo a causa a sério: a quota diária esgotada.
# Ver _PRIORIDADE_FALHA, mais abaixo.
#
# Os que entraram — 3.7, 3.6 e o 3.5-flash-lite — foram todos testados a
# gerar com esta chave antes de entrar aqui, e cada um dá os seus 20 pedidos
# por dia, que é do que esta lista é feita: baldes.
#
# Não estão aqui os apelidos "gemini-flash-latest" nem "gemini-flash-lite-latest":
# apontam para um modelo que já está na lista e gastam do mesmo balde — tê-los
# era fingir que havia ali quota a mais.
MODELOS_ALTERNATIVOS = (
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
)

# A lista completa, pela ordem por que se tenta.
MODELOS = (MODELO,) + MODELOS_ALTERNATIVOS

# O tecto de uma resposta. Um painel de conversa não é sítio para respostas
# longas, e este número é também a defesa contra um pedido que fuja: sem ele,
# uma resposta disparatada paga-se ao token.
MAXIMO_TOKENS_RESPOSTA = 2048

# Quanto tempo se espera por cada chamada ao serviço, e quanto tempo tem uma
# pergunta inteira. Sem estes dois números nada tinha limite: o SDK não põe
# timeout nenhum por omissão, uma ligação que estagnasse ficava presa para
# sempre, e a pergunta que pede dados ao motor são três chamadas seguidas —
# em medições reais, uma pergunta dessas demorou 167 segundos a resposta
# toda. O painel fica a dizer "A pensar..." durante esse tempo todo, por isso
# o tecto tem de existir do lado de cá (aqui) e do lado de lá (o ia.js, que
# desiste do pedido quando chega ao dele).
#
# Os números andam juntos: cada chamada pode levar até TIMEOUT_PEDIDO_MS, e
# só se começa uma nova se ainda resta TEMPO_MINIMO_RESTANTE para não se
# ultrapassar o total de uma forma descontrolada. O tecto da pergunta é o
# maior que se aceita esperar — abaixo disto, o utilizador prefere perguntar
# outra vez a olhar para um cursor parado.
TIMEOUT_PEDIDO_MS = 90_000            # cada chamada ao serviço: 90 s
TEMPO_MAXIMO_PERGUNTA = 180           # a pergunta inteira: 3 minutos
TEMPO_MINIMO_RESTANTE = 45            # só se continua se ainda faltar isto

# A frase do tempo esgotado, escrita uma vez porque a devolvem dois sítios:
# o prazo da pergunta (aqui) e o timeout de uma chamada (o _classificar).
FRASE_TEMPO_ESGOTADO = (
    "A AstroGuide AI demorou demasiado tempo a responder. "
    "Tenta a pergunta outra vez."
)

# Os ecrãs da aplicação, pelo nome com que o painel os manda e pelo nome que
# a pessoa vê. É lista branca e não lista de aconselhamento: o que não estiver
# aqui não entra nas instruções do modelo, venha de onde vier (o /api/ia/chat
# filtra por estas chaves antes de chamar o responder).
#
# Estes são os ecrãs, e o que cada um mostra está escrito no _instrucoes —
# é a parte mais importante das instruções, porque é ela que decide se a IA
# manda a pessoa ao sítio certo. O Céu Agora não mostra magnitudes nem
# constelações, e foi exactamente por dizer o contrário que este mapa passou
# a existir.
ECRAS = {
    "menu":         "menu inicial",
    "ceu":          "Céu Agora",
    "calendario":   "Calendário Cósmico",
    "observatorio": "Observatório",
    "apod":         "NASA – Imagem do Dia",
    "vr":           "Observatório VR",
    "perfil":       "perfil da conta",
    "admin":        "administração",
}

# O que cada ecrã mostra, na ordem em que os ecrãs se visitam. Escrito à mão
# e revisto à mão: é a descrição de uma aplicação que muda, e um ecrã novo
# entra aqui antes de entrar no mundo.
O_QUE_CADA_ECRA_MOSTRA = (
    "· Menu inicial: os quatro cartões que levam a cada um dos ecrãs — Céu\n"
    "  Agora, Calendário Cósmico, Observatório e NASA – Imagem do Dia.\n"
    "· Céu Agora: só o Sol, a Lua e os planetas AGORA, cada um com altitude,\n"
    "  azimute, distância e se está visível. NÃO tem estrelas, NÃO tem\n"
    "  constelações e NÃO tem magnitudes — quem pergunta por uma magnitude ou\n"
    "  por uma constelação não é aqui que a pessoa a vê.\n"
    "· Calendário Cósmico: um mês de cada vez com a fase da Lua em cada dia e\n"
    "  os eventos marcados (eclipses e chuvas de meteoros); clicar num dia\n"
    "  abre os detalhes dele, com a fase e o que acontece.\n"
    "· Observatório: o mapa celeste interativo, e é AQUI que se vêem\n"
    "  magnitudes e constelações — clica-se numa estrela, planeta,\n"
    "  constelação ou objeto de céu profundo e o painel de Detalhes traz a\n"
    "  magnitude, a altitude, o azimute e a constelação. Tem pesquisa, tour\n"
    "  guiado, controlos (linhas e nomes das constelações, brilho por\n"
    "  magnitude, ver abaixo do horizonte, Night Mode), o botão da ISS e o\n"
    "  botão 🥽 VR para ver o mesmo céu em 3D.\n"
    "· Observatório VR: o mesmo céu do Observatório em 3D, para óculos.\n"
    "· NASA – Imagem do Dia: a fotografia da NASA do dia, com título e\n"
    "  explicação.\n"
    "· Perfil: a localização de observação guardada, os favoritos e o\n"
    "  caderno de observações.\n"
)

# Até onde vai o histórico que se manda em cada pedido. A conversa é reenviada
# inteira de cada vez — a API não guarda nada entre pedidos —, por isso sem um
# limite o custo de cada mensagem cresceria com o tamanho da conversa, e ao fim
# de meia hora estava-se a pagar para repetir o princípio dela. Vinte mensagens
# são dez pares pergunta/resposta, mais do que qualquer conversa que este
# painel venha a ter.
MAXIMO_MENSAGENS_HISTORICO = 20

# Quantas vezes se deixa o modelo pedir ferramentas antes de o travar.
#
# Uma pergunta normal gasta duas voltas: na primeira ele pede os dados, na
# segunda responde já com eles. A terceira é a folga para ele perceber que
# pediu a ferramenta errada ou com os argumentos trocados e corrigir.
#
# Mais do que isto não é preciso, e custa dinheiro: cada volta é um pedido ao
# serviço de IA, e o plano gratuito dá vinte por dia. Um modelo que aos três
# pedidos ainda não sabe responder está a andar em círculos, e a volta
# seguinte não o endireita.
MAXIMO_VOLTAS_FERRAMENTAS = 3

# Onde a chave pode estar, por ordem de preferência:
#
#   1. a variável de ambiente GEMINI_API_KEY — é o nome que o próprio SDK lê,
#      e é o que se usa num servidor a sério, porque nunca chega ao disco;
#   2. um ficheiro .ai_key ao lado do server.py — para quem corre isto na
#      própria máquina e não quer mexer em variáveis de ambiente.
#
# O ficheiro está no .gitignore pela mesma razão que o .secret_key: quem tiver
# a chave gasta o dinheiro de quem a criou. E nada disto chega ao browser — a
# chave não sai deste processo, e é por isso que o painel fala com o nosso
# servidor e não com o serviço de IA.
VARIAVEL_CHAVE = "GEMINI_API_KEY"
FICHEIRO_CHAVE = ".ai_key"

# A raiz do projeto: py/ia/ai_engine.py -> py/ia -> py -> AstroGuide.
# Serve só para encontrar o .ai_key, que vive ao lado do server.py e não
# dentro deste pacote — é ali que quem corre a aplicação o vai procurar.
_RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ── O SDK ─────────────────────────────────────────────────────────────────────
# O google-genai importa-se aqui dentro, e não no topo do ficheiro, de
# propósito.
#
# No topo, um servidor sem o pacote instalado não arrancava de todo: o
# server.py importa as rotas da IA, as rotas importam este módulo, e um
# "ModuleNotFoundError" aqui em cima derrubava a aplicação inteira — o céu, o
# calendário e o observatório incluídos — por causa de uma funcionalidade
# opcional. Assim, sem o pacote, o AstroGuide corre como sempre e é só o painel
# da IA que diz o que falta.
#
# O False é o estado "ainda não se tentou": só à primeira pergunta é que se
# importa, e a partir daí guarda-se o resultado. None quer dizer que se tentou
# e não está instalado.
_SDK = False


def _sdk():
    global _SDK
    if _SDK is False:
        try:
            from google import genai
            _SDK = genai
        except ImportError:
            _SDK = None
    return _SDK


# ── A chave ───────────────────────────────────────────────────────────────────

def _chave():
    # A chave do serviço, ou None se não houver nenhuma configurada.
    #
    # Devolver None não é um erro: é o estado normal de quem acabou de clonar
    # o repositório e ainda não tem chave. Quem chama decide o que fazer com
    # isso — e o que a aplicação faz é continuar a funcionar sem IA, com o
    # painel a dizê-lo, em vez de rebentar.
    do_ambiente = (os.environ.get(VARIAVEL_CHAVE) or "").strip()
    if do_ambiente:
        return do_ambiente

    # O ficheiro guarda-se em memória com a marca do disco: o /api/ia/estado é
    # pedido em cada abertura de página, e reler o disco para isso é trabalho
    # que não muda nada. Se quem corre a aplicação trocar a chave, o mtime do
    # ficheiro muda e a cópia deixa de servir — o valor novo entra na
    # primeira leitura a seguir, sem reiniciar nada.
    caminho = os.path.join(_RAIZ, FICHEIRO_CHAVE)
    try:
        mtime = os.path.getmtime(caminho)
    except OSError:
        # Sem ficheiro (ou apagado entretanto): não há chave nenhuma, e a cópia
        # que cá pudesse estar fica de fora por caminho.
        _CHAVE_FICHEIRO["mtime"] = None
        _CHAVE_FICHEIRO["valor"] = None
        return None

    if _CHAVE_FICHEIRO["mtime"] != mtime:
        guardada = ""
        try:
            with open(caminho, "r", encoding="utf-8") as f:
                guardada = f.read().strip()
        except OSError:
            guardada = ""
        _CHAVE_FICHEIRO["mtime"] = mtime
        _CHAVE_FICHEIRO["valor"] = guardada

    return _CHAVE_FICHEIRO["valor"] or None


# O que se leu do .ai_key e quando é que se leu (ver _chave).
_CHAVE_FICHEIRO = {"mtime": None, "valor": None}


def estado():
    # Se a AstroGuide AI está pronta a usar, e o que falta quando não está.
    #
    # São duas coisas independentes, e quem administra o servidor precisa de
    # saber qual delas falta: ter a chave e não ter o pacote é um problema
    # diferente de ter o pacote e não ter a chave, e a resolução é diferente
    # em cada caso. Dizer só "não está disponível" obrigava a adivinhar.
    if _chave() is None:
        return {"disponivel": False, "motivo": "sem_chave", "modelo": None}
    if _sdk() is None:
        return {"disponivel": False, "motivo": "sem_dependencia", "modelo": None}
    return {"disponivel": True, "motivo": None, "modelo": MODELO}


def disponivel():
    # Há chave e há SDK? É o atalho do estado() para quem só quer o sim ou não.
    return estado()["disponivel"]


# ── O contexto que vai no pedido ──────────────────────────────────────────────

_DIAS = ("segunda-feira", "terça-feira", "quarta-feira", "quinta-feira",
         "sexta-feira", "sábado", "domingo")

_MESES = ("", "janeiro", "fevereiro", "março", "abril", "maio", "junho",
          "julho", "agosto", "setembro", "outubro", "novembro", "dezembro")


def _agora_local(localizacao):
    # "quinta-feira, 5 de outubro de 2026, 21:14" — na hora da terra de quem
    # pergunta, e não na do servidor.
    #
    # Isto não é decoração. Sem uma data no pedido, o modelo não sabe se está
    # a falar em 2026 ou no ano em que foi treinado, e responde sobre o céu de
    # uma noite qualquer do passado. A hora sai do fuso da localização
    # escolhida, pela mesma razão que o relógio do cabeçalho sai: quem escolheu
    # observar de Sydney quer respostas para Sydney.
    try:
        tz = ZoneInfo(localizacao["timezone"])
    except Exception:
        # Fuso desconhecido ou em falta (uma localização vinda de um serviço
        # externo pode não o trazer): UTC é errado para quem está num fuso
        # deslocado, mas é um erro de horas, não uma resposta inventada.
        tz = datetime.timezone.utc

    agora = datetime.datetime.now(tz)
    return (f"{_DIAS[agora.weekday()]}, {agora.day} de {_MESES[agora.month]} "
            f"de {agora.year}, {agora.strftime('%H:%M')}")


def _instrucoes(localizacao, ecra=None):
    # O que a IA é. É este texto, e não o modelo, que garante a regra mais
    # importante desta funcionalidade: os números da AstroGuide AI são os da
    # AstroGuide.
    #
    # O `ecra` é onde está quem pergunta — vem do browser, já filtrado pelas
    # chaves do ECRAS. Não é obrigatório (um pedido sem ele tem as instruções
    # todas, menos a frase que diz onde está), mas muda a qualidade da resposta:
    # quem pergunta por uma magnitude com o painel do Observatório aberto não
    # precisa de ir buscar o mouse aos cartões do menu.
    #
    # A regra não mudou de fundo quando as ferramentas se ligaram — mudou de
    # forma. Antes, a IA não tinha acesso aos cálculos e a instrução era
    # recusar-se a dá-los; agora tem, e a instrução é usá-los sempre, sem
    # nunca completar de cabeça aquilo que eles não disserem.
    #
    # A tentação continua a ser a mesma, e é grande: o modelo é bom a inventar
    # uma altitude plausível para Júpiter com toda a confiança, e ninguém no
    # painel tem como saber que é falsa. Uma aplicação de astronomia que dá
    # números errados com ar de certos é pior do que uma que não dá número
    # nenhum — e agora que há números verdadeiros à distância de uma chamada,
    # não há desculpa nenhuma para inventar um.
    #
    # A regra 6 vem montada à parte, porque é a maior de todas e porque muda
    # com o ecrã. É ela que faz a IA acertar no sítio para onde manda: o Céu
    # Agora mostra só o Sol, a Lua e os planetas, e dizer "vê-se no Céu Agora"
    # a quem pergunta por uma magnitude é mandar a pessoa procurar uma coisa
    # que lá não está. Um mapa escrito é melhor do que deixar o modelo a
    # adivinhar a arquitetura de uma aplicação que nunca viu.
    mapa_ecras = (
        "6. Quando fizer sentido, diz onde a pessoa vê aquilo na aplicação — "
        "e diz o ecrã certo: eles não mostram todos a mesma coisa. O mapa é:\n"
        + O_QUE_CADA_ECRA_MOSTRA
        + (f"Quem te fala está neste momento no ecrã {ECRAS[ecra]}. Começa por "
           "ali, e só aponta para outro se for outro que responde à pergunta.\n"
           if ecra in ECRAS else "")
        + "Um número ou um passo a seguir para o ecrã errado vale tanto como "
          "um número inventado: a pessoa chega lá e não encontra o que lhe "
          "foi prometido. Se não souberes em que ecrã está aquilo, aponta o "
          "ecrã que mostra a coisa toda em vez de arriscares.\n"
    )

    return (
        "És a AstroGuide AI, o assistente da AstroGuide — uma aplicação "
        "portuguesa para observar o céu.\n"
        "\n"
        f"Quem te fala observa a partir de {localizacao['nome']} "
        f"({float(localizacao['latitude']):.4f}°, "
        f"{float(localizacao['longitude']):.4f}°), no fuso horário "
        f"{localizacao['timezone']}. Na hora local dessa terra, neste "
        f"instante, é {_agora_local(localizacao)}.\n"
        "\n"
        "Tens ferramentas que consultam o motor de cálculo da AstroGuide e te "
        "devolvem os dados verdadeiros do céu: o que está visível agora, onde "
        "está um objeto, a fase da Lua e os próximos eventos. Os números que "
        "deres têm de sair sempre de lá.\n"
        "\n"
        "Regras, por ordem de importância:\n"
        "\n"
        "1. NUNCA inventes nem calcule dados astronómicos por tua conta: "
        "posições, altitudes, azimutes, coordenadas, distâncias, magnitudes, "
        "horas de nascer e de pôr, fases da Lua, ou datas de eventos. Vai "
        "buscá-los com uma ferramenta. Um número inventado com ar de certo é "
        "a pior resposta possível — quem está a ler não tem como saber que é "
        "falso.\n"
        "2. Chama uma ferramenta sempre que a pergunta for sobre o céu real: "
        "o que está visível, onde está um objeto, se está acima do horizonte, "
        "que fase tem a Lua, que eventos se aproximam. Não respondas a isso "
        "de memória, nem com o que sabes de outras noites.\n"
        "3. Dá os números exatamente como a ferramenta os deu. Não os "
        "arredondes para outros, não acrescentes precisão que ela não deu, e "
        "não completes com um dado que ela não trouxe. Se ela disser que não "
        "encontrou um objeto, diz isso mesmo.\n"
        "4. Para perguntas de conceitos — o que é uma magnitude, porque é que "
        "a Lua tem fases, o que é um equinócio, como se lê um planisfério — "
        "responde tu, sem ferramentas. Isso é conhecimento geral, e não chames "
        "uma ferramenta só porque a pergunta fala de astros.\n"
        "5. Não tens acesso à internet nem a mais nada em tempo real além "
        "destas ferramentas. Se não souberes algo, diz que não sabes.\n"
        + mapa_ecras
        + "7. Responde em português de Portugal, em texto simples (sem Markdown "
        "nem listas compridas). Trata o utilizador por 'tu' — nunca por "
        "'você', que é português do Brasil. Sê breve: duas ou três frases "
        "chegam para quase tudo.\n"
        "8. Se a pergunta não tiver nada a ver com astronomia nem com a "
        "aplicação, diz que só ajudas nesse âmbito.\n"
    )


# ── As ferramentas, do lado do modelo ─────────────────────────────────────────
# O catálogo é do ferramentas.py; o que se faz aqui é traduzi-lo para o formato
# que a API come. A tradução é curta de propósito, e é curta porque o catálogo
# já está escrito em JSON Schema — que é o que os parâmetros são, em qualquer
# fornecedor. É isso que faz com que trocar o Gemini por outro serviço seja
# mexer no _sdk() e pouco mais: as declarações não sabem de que marca são.

def _declaracoes(sdk):
    # O CATALOGO traduzido para o que se passa no "tools" do pedido.
    #
    # Os parâmetros vão como "parameters_json_schema" e não como "parameters":
    # aquele campo deixa passar o JSON Schema tal e qual, sem o converter para
    # os tipos do SDK. É o que mantém o catálogo independente — o dia em que os
    # tipos do SDK mudarem, isto não muda.
    return [sdk.types.Tool(function_declarations=[
        sdk.types.FunctionDeclaration(
            name=t["nome"],
            description=t["descricao"],
            parameters_json_schema=t["parametros"],
        )
        for t in ferramentas.CATALOGO
    ])]


# ── A conversa ────────────────────────────────────────────────────────────────

def _construir_conteudo(historico, mensagem):
    # A conversa que vai no pedido: o histórico desta sessão, mais a pergunta
    # nova sempre no fim.
    #
    # As mensagens seguidas do mesmo lado são juntadas numa só. Acontece quando
    # um pedido falha: a pergunta do utilizador fica no painel à espera, e a
    # pergunta seguinte vinha logo encostada a ela. Juntá-las é mais fiel ao
    # que aconteceu do que mandar dois turnos seguidos do mesmo lado.
    turnos = []

    for m in (historico or [])[-MAXIMO_MENSAGENS_HISTORICO:]:
        if not isinstance(m, dict):
            continue
        # "assistant" é o nome que o painel usa para as respostas; "model" é o
        # que a API usa. A tradução é aqui, e só aqui.
        papel = "model" if m.get("papel") == "assistant" else "user"
        texto = (m.get("texto") or "").strip()
        if not texto:
            continue

        if turnos and turnos[-1]["role"] == papel:
            turnos[-1]["parts"].append({"text": texto})
        else:
            turnos.append({"role": papel, "parts": [{"text": texto}]})

    pergunta = mensagem.strip()
    if turnos and turnos[-1]["role"] == "user":
        turnos[-1]["parts"].append({"text": pergunta})
    else:
        turnos.append({"role": "user", "parts": [{"text": pergunta}]})

    return turnos


# ── Os erros ──────────────────────────────────────────────────────────────────

def _falha(tipo, mensagem, **extra):
    # `extra` são campos a mais que uma família de falha traz para o painel.
    # Há um: o quota_renova_em, o momento em que o balde diário volta a
    # encher — é ele que permite ao ia.js mostrar "faltam 7 h 36 min" a
    # contar para baixo em vez de uma frase genérica de espera (ver o
    # _classificar e o contarQuota, no ia.js).
    return {"ok": False, "tipo": tipo, "erro": mensagem, **extra}


# A importância de cada falha, para quando a lista de modelos acaba toda sem
# responder: a pessoa precisa da CAUSA, e a última falha raramente é ela.
#
# Isto existe por uma razão que só se descobre a levar com ela. Com a quota
# diária esgotada, os modelos antigos da lista davam 404 (já não existem para
# contas novas) e era esse 404 — o último — que se mostrava: o painel dizia
# "não encontrei nenhum modelo" a quem tinha mesmo é falta de quota, e quem
# lia ia procurar o problema no sítio errado, a mexer na lista de modelos em
# vez de esperar pela renovação da quota. A falha do balde cheio é que descreve
# o estado das coisas, mesmo que tenha sido a primeira de cinco.
#
# Menor número = mais importante = a que se mostra.
_PRIORIDADE_FALHA = {"limite": 0, "servico": 1, "modelo": 2}


def _guardar_falha(ultima, tipo, frase, extra=None):
    # Entre a falha já guardada e esta, fica a mais esclarecedora. Nunca a
    # mais recente — é isso que o _PRIORIDADE_FALHA decide.
    nova = _falha(tipo, frase, **(extra or {}))
    if ultima is None:
        return nova
    if _PRIORIDADE_FALHA[tipo] < _PRIORIDADE_FALHA[ultima["tipo"]]:
        return nova
    if (tipo == ultima["tipo"]
            and "quota_renova_em" in nova
            and "quota_renova_em" not in ultima):
        # Mesma família, mas esta traz o prazo da quota. Um 429 por minuto
        # ("espera um pouco") seguido de um 429 diário ("faltam 7 h") é a
        # mesma prioridade — e é o segundo que a pessoa precisa de ler.
        return nova
    return ultima


# ── Quanto tempo falta para a quota voltar ───────────────────────────────────

def _fuso(localizacao):
    # O fuso de quem pergunta, ou UTC se ele vier em falta ou errado. É o
    # mesmo cuidado do _agora_local — uma localização de fora pode não trazer
    # timezone nenhum.
    try:
        return ZoneInfo(localizacao["timezone"])
    except Exception:
        return datetime.timezone.utc


def _duracao(segundos):
    # "7 h 36 min", "45 min", "2 min", "40 s" — como se diz uma espera.
    total = max(int(round(segundos)), 1)
    h, resto = divmod(total, 3600)
    m, s = divmod(resto, 60)
    if h and m:
        return f"{h} h {m:02d} min"
    if h:
        return f"{h} h"
    if m:
        return f"{m} min"
    return f"{s} s"


def _renovacao_quota(detalhe, localizacao=None):
    # Quando é que o balde diário volta a encher: (segundos até lá, momento em
    # ISO para o painel, hora local para a frase).
    #
    # Duas fontes, por ordem de confiança:
    #
    #   1. o próprio erro diz — "Please retry in 7h36m24.365373576s." ou o
    #      campo RetryInfo com "retryDelay": "27384s". É o relógio do
    #      serviço, e não o nosso, por isso vale mais;
    #   2. sem prazo nenhum no erro, calcula-se pela meia-noite UTC — que é
    #      onde o relógio do próprio serviço aponta: em medições de 2026-10,
    #      com a quota esgotada, o "Please retry in" deles dava sempre 00:00
    #      em ponto. (A documentação pública fala em meia-noite da
    #      Califórnia; quando os dois discordam, manda o serviço.)
    #
    # O que sai daqui é sempre o mesmo: um instante absoluto (ISO, com fuso
    # lá dentro, para o browser não precisar de adivinhar) e a hora local de
    # quem pergunta, que é a que se escreve na frase.
    agora_utc = datetime.datetime.now(datetime.timezone.utc)

    segundos = None

    m = re.search(r"retry in (?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?", detalhe)
    if m and any(m.groups()):
        segundos = (float(m.group(1) or 0) * 3600
                    + float(m.group(2) or 0) * 60
                    + float(m.group(3) or 0))

    if segundos is None:
        m = re.search(r"retryDelay[\"']?\s*[:=]\s*[\"']?(\d+)s", detalhe)
        if m:
            segundos = float(m.group(1))

    if segundos is None:
        amanha = (agora_utc + datetime.timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0)
        segundos = (amanha - agora_utc).total_seconds()

    momento = agora_utc + datetime.timedelta(seconds=max(segundos, 0))
    hora_local = momento.astimezone(_fuso(localizacao)).strftime("%H:%M")
    return segundos, momento.isoformat(timespec="minutes"), hora_local


def _classificar(excecao, localizacao=None):
    # Traduz uma falha do serviço na família de erro que o painel mostra, e
    # junta o que ela souber de extra (ver _falha) — por agora só o instante
    # em que a quota diária volta, que é o que o painel conta em voz alta.
    #
    # O `localizacao` serve só para pôr essa hora no fuso de quem pergunta:
    # "às 08:36, hora local" diz mais do que "à meia-noite da Califórnia".
    #
    # Não se apanham as classes específicas do SDK de propósito: os nomes
    # delas mudam entre versões, e boa parte do que pode correr mal nem sequer
    # vem do SDK — uma ligação que cai é uma exceção do httpx, que está por
    # baixo. O que o painel precisa de distinguir é a família do problema, e
    # essa lê-se do código HTTP quando ele existe:
    #
    #   429        -> demasiados pedidos (o plano gratuito tem limites por minuto)
    #   401 / 403  -> a chave não está a ser aceite
    #   404        -> o modelo pedido já não existe (ver o MODELOS)
    #   400 / 422  -> o serviço recusou o pedido como está montado
    #   5xx        -> o serviço está em baixo
    #   timeout    -> a chamada não chegou a tempo
    #   nada disto -> rede, ou algo que não se sabe
    codigo = getattr(excecao, "code", None) or getattr(excecao, "status_code", None)
    try:
        codigo = int(codigo)
    except (TypeError, ValueError):
        codigo = None

    if codigo == 429:
        # Nem todos os 429 são a mesma coisa, e dizê-lo mal é pior do que não
        # dizer nada. Há dois limites diferentes por trás do mesmo código:
        #
        #   - o por minuto, que passa em segundos — aqui "espera um pouco" é
        #     verdade;
        #   - o por dia, que é o do plano gratuito: 20 pedidos por dia e por
        #     modelo, e o balde só volta a encher no dia seguinte. Aqui
        #     "espera um pouco" é falso, e manda esperar quem já tem a
        #     resposta do outro lado do ecrã à espera de horas — por isso a
        #     frase leva quanto falta e a que horas (ver _renovacao_quota).
        #
        # Qual dos dois é lê-se do nome da quota que vem no erro:
        # "GenerateRequestsPerDayPerProjectPerModel-FreeTier". O "PerDay" é a
        # parte que interessa. Procura-se no texto da exceção, e não numa
        # estrutura do SDK, porque a estrutura muda entre versões e o texto
        # diz sempre o mesmo.
        detalhe = str(excecao)
        if "PerDay" in detalhe or "per_day" in detalhe.lower():
            # A frase leva o tempo que falta, e não "renova à meia-noite da
            # Califórnia": é a diferença entre mandar alguém esperar "um
            # pouco" por um dia inteiro e dizer-lhe quanto é que é. O prazo
            # vem do próprio erro quando ele o traz; sem ele, calcula-se pela
            # meia-noite da Califórnia (ver _renovacao_quota).
            segundos, iso, hora_local = _renovacao_quota(detalhe, localizacao)
            return (
                "limite",
                "A AstroGuide AI esgotou o limite diário do plano "
                f"gratuito nos modelos disponíveis. Faltam {_duracao(segundos)} "
                f"— renova às {hora_local}, hora local.",
                {"quota_renova_em": iso},
            )
        return ("limite",
                "A AstroGuide AI está a receber demasiados pedidos. "
                "Espera um pouco e tenta outra vez.", {})
    if codigo in (401, 403):
        return ("chave_invalida",
                "A chave da AstroGuide AI não está a ser aceite. "
                "Confirma-a no servidor.", {})
    if codigo == 404:
        # Um modelo da lista foi descontinuado (os nomes mudam de versão para
        # versão). É problema DELE e não da pergunta, por isso a família é a
        # mesma do 429 e do 5xx: deixa-se ir ao modelo seguinte, que pode bem
        # existir ainda. Sem este ramo, o 404 caía no "nada disto" lá em
        # baixo, a cascata de modelos morria à primeira e o painel via um
        # "verifica a ligação à internet" que não tinha nada a ver com a rede.
        return ("modelo",
                "A AstroGuide AI não encontrou um dos modelos disponíveis. "
                "Tenta outra vez dentro de momentos.", {})
    if codigo in (400, 422):
        # O pedido foi recusado como está montado — quase sempre a conversa a
        # ser grande demais para o contexto. Como é o pedido e não o modelo,
        # o seguinte havia de recusar igual, e aqui não se tenta mais nada.
        return ("recusado",
                "A AstroGuide AI recusou o pedido. Se a conversa já for muito "
                "longa, começa uma nova com o botão ↺.", {})
    if codigo is not None and codigo >= 500:
        return ("servico",
                "O serviço de IA está com problemas. Tenta novamente daqui a pouco.", {})

    # Sem código HTTP nenhum: ou é rede a cair, ou é uma exceção dos nossos
    # próprios limites de tempo. O segundo caso acontece sempre que uma
    # chamada estoura o timeout do SDK (ou o prazo da pergunta, que é medido
    # aqui em baixo) — e "verifica a ligação à internet" é a frase errada
    # para quem tem a ligação perfeitamente de pé e foi só o serviço a demorar.
    nome_excecao = type(excecao).__name__.lower()
    if "timeout" in nome_excecao or "timed out" in str(excecao).lower():
        return ("rede", FRASE_TEMPO_ESGOTADO, {})

    return ("rede", "Não consegui chegar ao serviço de IA. Verifica a ligação à internet.", {})


# ── O cliente ─────────────────────────────────────────────────────────────────
# Um só cliente por chave, guardado entre pedidos.
#
# Antes criava-se um novo a cada pergunta e nunca se fechava: cada cliente
# traz a sua ligação por baixo, e ao fim de um dia de uso eram centenas de
# ligações abertas à espera de ninguém. Guardar um é também o que faz a
# ligação e o TLS se reutilizarem — a resposta seguinte não espera por uma
# ligação nova a ser construída, e a pergunta ao serviço já demora tempo
# suficiente.
#
# O timeout entra aqui, na criação, porque é onde o SDK o aceita: é em
# milissegundos, e vale para cada chamada que se faça com este cliente.
_CLIENTE = {"chave": None, "cliente": None}


def _cliente(sdk, chave):
    if _CLIENTE["cliente"] is not None and _CLIENTE["chave"] == chave:
        return _CLIENTE["cliente"]

    antigo = _CLIENTE["cliente"]
    _CLIENTE["chave"] = chave
    _CLIENTE["cliente"] = None
    if antigo is not None:
        # A chave mudou entretanto (ou o ficheiro foi reescrito): a ligação
        # velha deixa de servir e fecha-se aqui, que é o único sítio onde ainda
        # há alguém com a mão nela.
        try:
            antigo.close()
        except Exception:
            pass

    _CLIENTE["cliente"] = sdk.Client(
        api_key=chave,
        http_options=sdk.types.HttpOptions(timeout=TIMEOUT_PEDIDO_MS),
    )
    return _CLIENTE["cliente"]


# ── A resposta ────────────────────────────────────────────────────────────────
def responder(mensagem, historico=None, localizacao=None, ecra=None):
    # Uma pergunta, uma resposta, e onde é que ela foi feita: devolve
    # {"ok": True, "resposta": "..."} ou {"ok": False, "tipo": "...",
    # "erro": "..."}. O `ecra` é o ecrã da aplicação onde está quem pergunta
    # (ver o ECRAS); não é obrigatório, e um valor desconhecido é ignorado.
    #
    # Devolver um dicionário em vez de deixar a exceção subir é deliberado: o
    # endpoint que chama isto responde a um browser, e um 500 com um traceback
    # não diz nada a quem está a usar o painel. Aqui cada família de falha tem
    # o seu nome e uma frase que se pode mostrar.
    local = localizacao or LOCATION

    chave = _chave()
    if not chave:
        return _falha("sem_chave",
                      "A AstroGuide AI ainda não está configurada neste servidor.")

    sdk = _sdk()
    if sdk is None:
        return _falha("sem_dependencia",
                      "A AstroGuide AI não está instalada neste servidor: "
                      "falta o pacote google-genai.")

    if not isinstance(mensagem, str) or not mensagem.strip():
        return _falha("pedido_invalido", "Escreve uma pergunta para eu poder responder.")

    # O pedido prepara-se uma vez e reaproveita-se em todas as tentativas: o que
    # muda de uma para a outra é só o nome do modelo.
    conteudo = _construir_conteudo(historico, mensagem)
    instrucoes = _instrucoes(local, ecra)
    cliente = _cliente(sdk, chave)
    declaracoes = _declaracoes(sdk)
    inicio = time.monotonic()

    ultima = None

    # Um modelo de cada vez, e só se desce ao seguinte quando a falha é do
    # modelo. Ver o MODELOS_ALTERNATIVOS, em cima, para a razão de haver lista.
    for modelo in MODELOS:
        # A conversa desta tentativa. A pergunta é a mesma do princípio ao fim;
        # o que se acumula aqui é o vaivém com as ferramentas, e isso não pode
        # passar de um modelo para o seguinte — o segundo não sabe do pedido
        # que o primeiro fez, e via-se a responder a uma ferramenta que nunca
        # tinha chamado.
        conversa = list(conteudo)

        try:
            for _ in range(MAXIMO_VOLTAS_FERRAMENTAS):
                # O prazo da pergunta. Ver-se antes de cada chamada, e não só
                # entre modelos: é isto que faz com que uma resposta lenta
                # termine numa frase a dizer que demorou, em vez de tragar o
                # minuto que falta para o tecto. Só se arranca uma chamada se
                # ainda sobrar TEMPO_MINIMO_RESTANTE para ela — começar uma
                # que já não vai a tempo é só empurrar o aviso para mais tarde.
                restante = TEMPO_MAXIMO_PERGUNTA - (time.monotonic() - inicio)
                if restante < TEMPO_MINIMO_RESTANTE:
                    return _falha("tempo_esgotado", FRASE_TEMPO_ESGOTADO)

                resposta = cliente.models.generate_content(
                    model=modelo,
                    contents=conversa,
                    config={
                        "system_instruction": instrucoes,
                        "max_output_tokens": MAXIMO_TOKENS_RESPOSTA,
                        "tools": declaracoes,
                    },
                )

                pedidos = resposta.function_calls
                if not pedidos:
                    break

                # Resposta sem candidato nenhum — bloqueada pelo serviço, ou
                # por algum motivo sem conteúdo nenhum. Não há turno nenhum a
                # juntar à conversa, e o texto lá em baixo há de sair vazio.
                candidatos = getattr(resposta, "candidates", None) or []
                if not candidatos:
                    texto = ""
                    break

                # O modelo pediu dados em vez de responder. O turno dele — com
                # o pedido lá dentro — tem de entrar na conversa antes do
                # resultado, ou o serviço perde o fio: o pedido e a resposta
                # são um par, e é o par que faz sentido.
                conversa.append(candidatos[0].content)

                # Corre-se tudo o que ele pediu. Numa pergunta sobre o céu pode
                # pedir mais do que uma ferramenta na mesma volta — a posição e
                # a fase, por exemplo —, e nesse caso vão todas juntas.
                #
                # A localização é a NOSSA, e não a que vier nos argumentos: o
                # executar deita fora qualquer "localizacao" que o modelo
                # invente (ver o ferramentas.py). O modelo não sabe onde a
                # pessoa está; sabe que nós sabemos.
                partes = []
                for pedido in pedidos:
                    partes.append(sdk.types.Part.from_function_response(
                        name=pedido.name,
                        response=ferramentas.executar(
                            pedido.name,
                            pedido.args,
                            localizacao=local,
                        ),
                    ))

                # O resultado volta como turno do utilizador. É a convenção da
                # API — não há um papel "ferramenta" —, e é o que a própria SDK
                # faz no chat dela: o chats.py monta o mesmo Content com
                # role="user".
                conversa.append(sdk.types.Content(role="user", parts=partes))

            if resposta.function_calls:
                # Gastaram-se as voltas todas e o modelo ainda estava a pedir
                # ferramentas. Perdeu-se, e insistir só gastaria pedidos a quem
                # está a andar em círculos — mas o modelo seguinte pode não se
                # perder, daí ser o "continue" e não uma desistência.
                ultima = _guardar_falha(
                    ultima, "servico",
                    "A AstroGuide AI não conseguiu concluir a resposta. "
                    "Tenta reformular a pergunta.")
                continue

            # O .text levanta exceção quando a resposta foi bloqueada ou não
            # trouxe texto nenhum. Apanha-se à parte, e vira texto vazio.
            #
            # Sem este try, a exceção subia para o except de baixo, o
            # _classificar via ali um erro sem código HTTP nenhum, e a pessoa
            # que usava o painel lia "verifica a ligação à internet" para uma
            # ligação que estava perfeitamente de pé — quando o que aconteceu
            # foi o serviço recusar a resposta. O caso vazio tem a sua frase,
            # que é a de baixo.
            try:
                texto = (resposta.text or "").strip()
            except Exception:
                texto = ""
        except Exception as e:
            tipo, frase, extra = _classificar(e, local)
            # Só se passa ao modelo seguinte quando o problema é DELE: um 429 é
            # o balde dele cheio, um 5xx é ele em baixo e um 404 é um modelo
            # que já não existe — e em todos o seguinte pode responder. Uma
            # chave inválida, um pedido mal formado ou a rede caída são iguais
            # em todos — insistir só gastaria tempo.
            if tipo in _PRIORIDADE_FALHA:
                ultima = _guardar_falha(ultima, tipo, frase, extra)
                continue
            return _falha(tipo, frase, **extra)

        if texto:
            # O modelo que respondeu vai na resposta. Não é para o painel, que
            # não mostra isto — é para quem estiver a ver um log perceber se
            # naquele dia andou a responder o bom ou o de recurso.
            return {"ok": True, "resposta": texto, "modelo": modelo}

        # Veio vazio: a resposta foi bloqueada ou não veio nada. É o mesmo
        # pedido em qualquer modelo, e não se gasta o balde seguinte à procura
        # de outra coisa.
        return _falha("vazia",
                      "A AstroGuide AI não devolveu resposta. "
                      "Tenta reformular a pergunta.")

    # Chegou-se ao fim da lista: todos deram limite, erro de serviço ou um
    # modelo inexistente. Não é a última falha que se mostra, é a mais
    # esclarecedora de todas as que se guardaram (ver _PRIORIDADE_FALHA) —
    # é ela que diz à pessoa o que aconteceu mesmo.
    return ultima
