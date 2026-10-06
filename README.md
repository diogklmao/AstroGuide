# ============================================================

  ASTROGUIDE — Documentação do Projeto
  PAP 12.º Ano | Curso de Programação

O AstroGuide é uma aplicação web de astronomia que mostra
dados reais do céu em tempo real, calculados com efemérides
oficiais da NASA. Por omissão é o céu de Vila Nova de Gaia, e
quem tem conta escolhe a sua terra pelo nome — "Lisboa",
"Madrid", "Sydney" — para o céu, o calendário e o observatório
passarem a ser calculados para lá.
Inclui também um Observatório 3D com suporte WebXR
(compatível com Meta Quest 3, com tracking real da cabeça)
e a Imagem Astronómica do Dia da NASA (APOD).

Tem contas de utilizador: cada uma pode guardar a sua própria
localização de observação, os seus favoritos e um caderno de
observações — tudo reunido na página /perfil.

---

## COMO CORRER A APLICAÇÃO

1. Instalar as dependências (só é necessário fazer uma vez):
  py -m pip install -r requirements.txt
2. Correr o servidor:
  py server.py
3. O browser abre automaticamente em http://localhost:5000
4. Para parar o servidor, pressione Ctrl+C no terminal.
5. Para atualizar no GitHub:
  git add .
  git commit -m "descrição do que foi feito"
  git push

Não é preciso criar a base de dados à mão. Na primeira execução
o servidor cria o ficheiro astroguide.db e as tabelas todas, na
raiz do projeto. A partir daí as contas ficam lá guardadas entre
execuções. As dependências continuam a ser as mesmas de antes:
o SQLite vem dentro do Python e o resto já vinha com o Flask.

A AstroGuide AI é a única funcionalidade que precisa de mais
alguma coisa: uma chave da API do Gemini. Sem ela, tudo o resto
funciona como sempre e é só o painel da IA que fica a dizer que
não está configurada. Para a ligar, ver ASTROGUIDE AI — Como
configurar, mais abaixo.

---

## ESTRUTURA DE FICHEIROS

astroguide/
│
├── server.py              → Ponto de entrada da app web
│                            Cria o servidor Flask e define
│                            as rotas da API e das páginas.
│
├── py/                    → Todo o código que é importado
│                            Na raiz do projeto fica o que se
│                            executa (o server.py, o
│                            promover_admin.py e o teste) e os
│                            dados; aqui dentro fica o resto.
│
├── py/config.py           → Configurações globais
│                            Localização por omissão (Vila Nova
│                            de Gaia, Portugal), com cidade,
│                            país, coordenadas, elevação e fuso
│                            horário. É a que se usa enquanto
│                            ninguém escolheu a sua.
│
├── py/database/           → A base de dados e as contas
│   │
│   ├── db.py              → Base de dados SQLite
│   │                        Contas de utilizador, localização
│   │                        pessoal, favoritos e registo de
│   │                        observações. Cria as tabelas na
│   │                        1ª execução.
│   │
│   ├── auth.py            → Contas de utilizador
│   │                        Registo, entrada e saída, as rotas
│   │                        do que é pessoal de cada conta
│   │                        (localização, favoritos,
│   │                        observações) e a página /perfil,
│   │                        que é onde tudo isso aparece
│   │                        reunido.
│   │
│   └── admin.py           → Página de administração
│                            Só de leitura, e só para a conta
│                            com o papel de admin: mostra as
│                            contas registadas e o que cada uma
│                            tem guardado. É renderizada no
│                            servidor, para não haver um endpoint
│                            em JSON a devolver os dados de todos.
│
├── py/localizacao/        → Escolher uma localização pelo NOME
│   │                        É o que faz não ser preciso escrever
│   │                        latitude e longitude à mão: escreve-se
│   │                        "Lisboa" e as coordenadas aparecem.
│   │
│   ├── cidades.py         → Lista de cidades, fora da rede
│   │                        ~160 terras com coordenadas, elevação
│   │                        e fuso horário. A procura ignora
│   │                        acentos e pontuação e conhece os
│   │                        nomes portugueses ("Londres" e
│   │                        "London" dão a mesma terra).
│   │
│   ├── geocoding.py       → Geocoding: Open-Meteo para procurar
│   │                        pelo nome e BigDataCloud para o
│   │                        caminho contrário (coordenadas do
│   │                        browser → nome da terra). Traz as
│   │                        terras que a lista local não tem —
│   │                        as duas somam-se, não se
│   │                        substituem. Sem chave de API, com
│   │                        cache em memória de 10 minutos.
│   │
│   └── __init__.py        → A porta de entrada do módulo:
│                            procurar_na_lista(), procurar_mais()
│                            e reverter(). A lista local responde
│                            primeiro e sem rede; a rede
│                            acrescenta as terras com aquele nome
│                            que ela não tem.
│
├── py/astronomia/         → Cálculo e rede
│   │                        O que pensa (o sky_engine.py) e os
│   │                        dois sítios que vão à internet.
│   │
│   ├── sky_engine.py      → Motor de cálculo astronómico
│   │                        Usa as efemérides da NASA para
│   │                        calcular posições de astros em
│   │                        qualquer momento (passado/futuro).
│   │
│   ├── iss.py             → Estação Espacial Internacional
│   │                        Vai buscar os elementos orbitais
│   │                        (TLE) à Celestrak e calcula onde a
│   │                        ISS está no céu de quem está a ver.
│   │
│   └── apod.py            → Imagem Astronómica do Dia (NASA)
│                            Vai buscar a APOD à API pública
│                            da NASA, com cache diário em
│                            memória para poupar pedidos.
│
├── py/ceu/                → Catálogos do céu
│   │                        Ficheiros de DADOS: listas de
│   │                        coordenadas, sem uma linha de
│   │                        cálculo. Quem lhes dá posição no céu
│   │                        é o py/astronomia/sky_engine.py.
│   │
│   ├── estrelas.py        → Base de dados de estrelas e
│   │                        constelações para o Observatório.
│   │                        Nomes das constelações em Latim
│   │                        (nomenclatura oficial da IAU).
│   │
│   ├── ceu_profundo.py    → Catálogo de céu profundo
│   │                        36 objetos de Messier visíveis de
│   │                        Gaia: galáxias, nebulosas, enxames e
│   │                        estrelas duplas. Ficaram de fora os
│   │                        que precisam de telescópio.
│   │
│   └── eventos.py         → Base de dados de eventos
│                            Chuvas de meteoros e eclipses
│                            (inclui eclipses de 2026 e 2027).
│
├── py/ia/                 → A AstroGuide AI
│   │                        O painel de conversa. É o único
│   │                        sítio do projeto que fala com um
│   │                        serviço externo de IA — e é o
│   │                        servidor que fala com ele, nunca o
│   │                        browser: a chave não sai daqui.
│   │
│   ├── ai_engine.py       → O motor da conversa
│   │                        Monta o pedido (a pergunta, o
│   │                        histórico e o contexto do local de
│   │                        observação), fala com a API do
│   │                        Gemini e devolve a resposta ou uma
│   │                        falha já explicada em português.
│   │                        Não faz cálculos astronómicos: é a
│   │                        regra que está escrita nas suas
│   │                        instruções, para a IA não inventar
│   │                        posições que a aplicação sabe
│   │                        calcular de verdade.
│   │
│   ├── rotas.py           → As duas rotas da IA
│   │                        /api/ia/estado (há IA configurada?)
│   │                        e /api/ia/chat (uma pergunta, uma
│   │                        resposta). Num Blueprint próprio,
│   │                        como as contas e o /admin.
│   │
│   └── ferramentas.py     → Catálogo de ferramentas para a IA
│                            As quatro funções que a IA chama
│                            sozinha quando lhe perguntam pelo céu
│                            (o que está visível, a posição de um
│                            objeto, a fase da Lua e os próximos
│                            eventos), cada uma a reutilizar o
│                            sky_engine.py e o eventos.py. Ver
│                            FUNCTION CALLING, mais abaixo.
│
├── .ai_key                → Chave da AstroGuide AI (opcional)
│                            Um ficheiro com a chave do Gemini
│                            numa linha só. Alternativa à
│                            variável de ambiente
│                            GEMINI_API_KEY. Não está no GitHub —
│                            uma chave publicada é gasta por
│                            outros em minutos.
│
├── promover_admin.py      → Dá (ou tira) o papel de admin
│                            Corre no terminal, na pasta do
│                            projeto: py promover_admin.py email
│                            Não está ligado a rota nenhuma — é
│                            de propósito o único caminho para
│                            uma conta passar a admin.
│
├── astroguide.db          → Base de dados (criada ao correr)
│                            Um ficheiro só, na raiz, ao lado
│                            do server.py. Cada máquina cria o seu.
│                            Não está no GitHub — tem os
│                            dados de quem já usou a aplicação.
│
├── _teste_contas.py       → Testes das contas, do perfil e da
│                            localização
│                            224 verificações automáticas
│                            (216 se não houver rede — a segunda
│                            fonte de cidades salta 4, a
│                            localização do dispositivo salta 2 e
│                            a ISS salta 2, e dizem que
│                            saltaram).
│                            Correr com: py _teste_contas.py
│                            Não arranca servidor nem abre browser.
│
├── requirements.txt       → Lista de dependências Python
│                            Instalar com:
│                            py -m pip install -r requirements.txt
│
├── de421.bsp              → Efemérides da NASA
│                            Ficheiro com posições de todos
│                            os planetas. Descarregado
│                            automaticamente na 1ª execução.
│                            Não está no GitHub (17MB).
│
├── templates/
│   ├── menu.html          → Menu de entrada (Landing Page)
│   │                        Com animações espaciais e os
│   │                        4 cartões de acesso rápido. Sem
│   │                        música: ela é do Observatório.
│   │
│   ├── index.html         → Interface principal da app
│   │                        Céu Agora, Observatório,
│   │                        Calendário Cósmico, NASA - Imagem
│   │                        do Dia, e Observatório VR.
│   │
│   ├── entrar.html        → Página de entrada e registo
│   │                        Os dois formulários na mesma
│   │                        página, alternados por abas.
│   │
│   ├── perfil.html        → Página do perfil (O meu perfil)
│   │                        Tudo o que só faz sentido para uma
│   │                        conta, numa página: a localização
│   │                        de observação, os favoritos e o
│   │                        caderno de observações. Chega
│   │                        pronta do servidor — a página não
│   │                        se abre sem sessão iniciada.
│   │
│   └── admin.html         → Página de administração
│                            A tabela das contas. O HTML chega
│                            pronto do servidor; o JavaScript
│                            só trata do campo de estrelas.
│
└── static/
    ├── css/
    │   ├── shared-ui-controls.css → Reset global e estilos
    │   │                            partilhados entre páginas.
    │   │
    │   ├── glass.css      → Design system de glassmorphism.
    │   │                    Variáveis CSS, painéis glass,
    │   │                    animações shimmer e borderGlow.
    │   │
    │   ├── menu.css       → Estilos exclusivos do menu
    │   │                    (foto de fundo, cards, título).
    │   │
    │   ├── index.css      → Estilos da app principal
    │   │                    (céu agora, calendário, dados,
    │   │                    observatório, APOD e VR).
    │   │
    │   ├── auth.css       → Página de entrada e registo
    │   │                    (campos, abas, botões).
    │   │
    │   ├── conta.css      → O botão de conta do canto (menu,
    │   │                    app e perfil). O painel que ele
    │   │                    abria antes passou a ser a página
    │   │                    /perfil.
    │   │
    │   ├── perfil.css     → Página do perfil, no desenho da
    │   │                    referência: o cabeçalho (avatar,
    │   │                    nome e o selo "Conta AstroGuide"),
    │   │                    as quatro caixas da localização,
    │   │                    e os favoritos e o caderno lado a
    │   │                    lado.
    │   │
    │   ├── admin.css      → Página de administração (tabela
    │   │                    das contas, totais, cartão de
    │   │                    acesso negado).
    │   │
    │   └── ia.css         → O botão e o painel da AstroGuide AI
    │                        O botão fica em baixo à esquerda (as
    │                        outras esquinas já têm dono) e o
    │                        painel abre por cima dele. Está em
    │                        todas as páginas — menu, aplicação,
    │                        perfil e /admin. Esconde-se só no
    │                        VR; no Observatório 2D fica, mas
    │                        afasta-se do painel lateral.
    │
    ├── js/
    │   ├── shared-ui-controls.js → Funções partilhadas
    │   │                    (o campo de estrelas do fundo e a
    │   │                    música, que só toca no Observatório
    │   │                    e no VR, com o volume dela).
    │   │
    │   ├── conta.js       → O botão de conta do canto: desenha-o
    │   │                    e escreve-lhe o nome de quem tem
    │   │                    sessão (ou "Entrar"). É tudo o que
    │   │                    restou dele — o resto do que fazia
    │   │                    passou para o perfil.js.
    │   │
    │   ├── auth.js        → Formulários da página de entrada:
    │   │                    alternar as abas, validar e enviar.
    │   │
    │   ├── perfil.js      → Página do perfil: o seletor de
    │   │                    cidades (a procura, a lista de
    │   │                    resultados, a hora local no fuso
    │   │                    escolhido), guardar e repor a
    │   │                    localização, remover favoritos,
    │   │                    acrescentar e apagar observações, e
    │   │                    terminar sessão.
    │   │
    │   ├── admin.js       → Página de administração: só o campo
    │   │                    de estrelas do fundo. Os dados já
    │   │                    vêm no HTML, do servidor.
    │   │
    │   ├── menu.js        → Lógica do menu: os ícones Canvas
    │   │                    desenhados à mão (estrela, lua
    │   │                    crescente, telescópio, jornal). A
    │   │                    localização que o menu mostra já vem
    │   │                    escrita no HTML, do servidor.
    │   │
    │   ├── index.js       → Lógica da app: navegação SPA,
    │   │                    dados do céu, calendário cósmico,
    │   │                    APOD, e o Observatório interativo
    │   │                    (canvas 360°/2D) com estrelas,
    │   │                    constelações, planetas com imagem
    │   │                    real, pesquisa, Night Mode, o ★ dos
    │   │                    favoritos e auto-refresh a cada 30s.
    │   │
    │   ├── ia.js          → O painel da AstroGuide AI: abrir e
    │   │                    fechar, a lista de mensagens, o
    │   │                    "a pensar", as falhas e o pedido ao
    │   │                    /api/ia/chat. O histórico da conversa
    │   │                    vive no sessionStorage, como o estado
    │   │                    da música — o servidor não guarda
    │   │                    conversas nenhumas. Não tem chave
    │   │                    nenhuma: fala com o nosso servidor, e
    │   │                    é ele que fala com o serviço de IA.
    │   │                    Manda também em que ecrã está quem
    │   │                    pergunta (o campo "ecra", lista
    │   │                    branca no ai_engine) e, sem sessão,
    │   │                    abre o aviso com a porta de saída
    │   │                    para o /entrar.
    │   │
    │   └── vr-observatorio.js → Observatório VR
    │                        Cena 3D em Three.js — reutiliza
    │                        os dados de /api/observatorio
    │                        (zero duplicação da lógica
    │                        astronómica). Estrelas, constelações,
    │                        Sol, Lua, planetas e a ISS posicionados por
    │                        altitude/azimute reais à volta do
    │                        observador. Navegação por arrasto do
    │                        rato no PC, e sessão WebXR imersiva
    │                        (immersive-vr) com tracking real da
    │                        cabeça num Meta Quest 3.
    │                        Segue a data/hora do seletor do
    │                        Observatório 2D (tempo real ou
    │                        simulado), para os dois mostrarem
    │                        sempre o mesmo céu.
    │
    ├── images/
    │   ├── constelacoes/  → Ilustrações de cada constelação
    │   │                    (mitologia), mostradas no painel
    │   │                    de detalhes do Observatório.
    │   │
    │   ├── mercury.png, venus.png, mars.png, jupiter.png, saturn.png, uranus.png, neptune.png
    │   │                  → Imagens reais dos planetas do Sistema Solar,
    │   │                    usadas no Observatório.
    │   │
    │   ├── moon_render.png, sun.png → Imagens da Lua e Sol.
    │   │
    │   ├── iss.png        → Fotografia da Estação Espacial
    │   │                  Internacional (ISS), desenhada nos
    │   │                  Observatórios 2D e VR sem o recorte circular
    │   │                  dos planetas — é um objeto largo, e o
    │   │                  círculo cortava-lhe as pontas.
    │   │
    │   ├── 618.jpg        → Fotografia de fundo do menu, da
    │   │                    entrada, do perfil e da
    │   │                    administração — a mesma moldura nas
    │   │                    quatro páginas.
    │   │
    │   ├── SolarSystem.jpg, Moon.jpg, Sky.jpg
    │   │                  → Imagens dos cartões de acesso rápido
    │   │                    do menu (Céu Agora, Calendário
    │   │                    Cósmico e Observatório).
    │   │
    │   └── space.jpg      → Panorâmica da Via Láctea, usada
    │                        como fundo do céu no Observatório
    │                        360° (com efeito parallax) e como
    │                        imagem do cartão da NASA no menu.
    │
    ├── audio/
    │   └── musica.mp3     → Música ambiente do Observatório e do VR
    │
    └── favicon.svg        → Ícone da aplicação (estrela SVG)

---

## ROUTING (ROTAS)

A aplicação usa um sistema de rotas simples:
  /            → Menu de entrada (Landing Page)
  /app         → Interface principal, a abrir no Céu Agora
  /ceu         → Ecrã Céu Agora
  /calendario  → Ecrã Calendário Cósmico
  /observatorio → Ecrã Observatório Astronómico
  /apod        → Ecrã NASA - Imagem do Dia
  /entrar      → Página de entrada e registo
  /perfil      → Página do perfil (exige sessão iniciada)
  /admin       → Página de administração (exige o papel de
                 admin)

O /app e as quatro rotas dos ecrãs servem todas o mesmo
templates/index.html: é o JavaScript que decide o ecrã que
aparece, pela SPA.

Todas estas rotas, menos o /perfil e o /admin, estão abertas a
quem não tem conta: quem não tiver sessão iniciada vê tudo,
calculado para a localização de config.py. O /perfil sem sessão
manda entrar e traz a pessoa de volta a ele depois disso.
  /entrar?seguinte=/observatorio → Volta ao sítio onde estava
                                   depois de entrar (só aceita
                                   caminhos internos, por segurança)
  /entrar?aba=registar           → Abre já na aba de criar conta
  (sem "seguinte", entrar leva ao /perfil)

O /admin não tem API própria e não aparece no menu: é uma página
só, para o dono da aplicação, e chega-se lá escrevendo o endereço
ou pela ligação que aparece na página de perfil de quem tem o
papel.

(O Observatório VR não tem rota própria — abre-se a partir
de um botão dentro do Observatório, dentro da mesma SPA.)

Rotas da API (devolvem JSON para o JavaScript):
  /api/ceu                         → Sol, Lua e 7 planetas em tempo real
  /api/calendario/ano/mes          → Fases da lua e eventos do mês
                                      (valida mês entre 1 e 12)
  /api/dia/ano/mes/dia             → Detalhes de um dia específico
                                      (valida a data completa)
  /api/observatorio                → Estrelas, constelações e astros
                                      (tempo real) — usado tanto pelo
                                      Observatório 2D como pelo VR
  /api/observatorio?data=&hora=    → Idem para uma data/hora específica
  /api/apod                        → Imagem Astronómica do Dia da NASA
                                      (título, explicação, imagem/vídeo)

Rotas da API de conta (Precisa de sessão, marcadas com ✱):
  /api/me          → Quem tem sessão iniciada e a que localização
                     está associado (devolve utilizador: null se
                     ninguém tiver entrado — não é um erro)
  /api/registar    → Criar conta (nome, email, password)
  /api/entrar      → Iniciar sessão (aceita o nome OU o email)
  /api/sair        → Terminar sessão
  /api/localizacao ✱ → PUT guarda a localização pessoal,
                       DELETE volta à de config.py
  /api/localidades ✱ → ?q=lisboa devolve as terras com esse nome,
                       com as coordenadas e o fuso horário já
                       resolvidos. É o que alimenta a lista do
                       seletor de cidades — ninguém escreve
                       coordenadas à mão. São duas fontes e dois
                       pedidos: sem mais nada responde a lista
                       local (instantânea, e sem rede), e
                       &fonte=rede responde o serviço de
                       geocoding com as terras daquele nome que
                       a lista não tem (ver LOCALIZAÇÃO PESSOAL).
  /api/localidades/reversa ✱ → O caminho contrário: POST com
                       latitude e longitude e devolve o NOME da
                       terra onde elas caem. É o que permite ao
                       botão "usar a localização deste dispositivo"
                       saber o nome do sítio, e não só os números.
                       503 se não se conseguir saber (tipicamente
                       sem rede) — nunca um nome inventado.
  /api/favoritos   ✱ → GET lista, POST adiciona, DELETE remove
  /api/observacoes ✱ → GET lista, POST adiciona,
                       DELETE /api/observacoes/id remove

Rotas da API da AstroGuide AI (precisam de sessão iniciada —
ver ASTROGUIDE AI —, e não têm chave nenhuma lá dentro: é o
servidor que fala com o serviço de IA):
  /api/ia/estado   → {"disponivel": true/false, "motivo": null |
                     "sem_conta" | "sem_chave" | "sem_dependencia",
                     "modelo": "..." | null}
                     Se a AstroGuide AI está pronta a usar, e o que
                     falta quando não está. O painel pergunta-o ao
                     abrir e, se a resposta for que não, avisa em vez
                     de deixar escrever para nada. Nunca devolve a
                     chave, nem um pedaço dela. Sem sessão, responde
                     "sem_conta" — que é o primeiro que se pergunta,
                     antes de saber se há chave.
  /api/ia/chat     → POST {"mensagem": "...", "historico": [...],
                          "ecra": "observatorio"}
                     → {"ok": true, "resposta": "...", "modelo": "..."}
                     Sem sessão responde 401 sem_conta e não gasta um
                     pedido ao serviço. O histórico vem do browser
                     (sessionStorage) e
                     volta a ir em cada pedido: o servidor não
                     guarda conversas. Só o que é mesmo conversa
                     entra (papéis "user" e "assistant"), e cada
                     mensagem é cortada aos mesmos 1500 caracteres
                     da pergunta — sem isto, o tecto da pergunta
                     contava só para a nova e as velhas iam em
                     megabytes. Um mesmo IP pode fazer dez pedidos
                     por minuto (LIMITE_PEDIDOS_POR_MINUTO, no
                     py/ia/rotas.py). O "ecra" é uma lista branca:
                     só o que estiver no ECRAS do ai_engine.py
                     passa para as instruções do modelo, o resto é
                     deitado fora. As falhas vêm com o estado
                     HTTP da família (401 sem conta, 400 pedido
                     inválido ou recusado, 429 limite, 503 sem
                     chave, 502 serviço em baixo, 504 sem rede ou
                     sem tempo) e com uma frase já em português no
                     campo "erro".

---

## CONTAS DE UTILIZADOR

A conta não tranca nada. O Céu, o Calendário, o Observatório e a
Imagem do Dia continuam abertos a quem não tem conta — são a
montra do projeto e quem abrir a aplicação pela primeira vez
tem de os ver sem barreiras.

O que a conta acrescenta é o que só faz sentido para uma pessoa:

  📍 Localização pessoal
     O observador não é fixo em Vila Nova de Gaia. Cada conta
     guarda a sua cidade, o país, as coordenadas, a elevação e o
     fuso horário, e todos os cálculos passam a ser feitos para
     lá: o céu, o calendário e o observatório. A ISS entra aqui
     também — é o objeto do céu cuja posição mais depende do
     sítio de quem olha, por estar só a 400 km de altitude.

     A localização escolhe-se pelo NOME, e nunca escrevendo
     latitude e longitude. Escrever um par de números era pedir a
     quem usa a aplicação uma coisa que ninguém sabe de cor: quem
     quisesse observar de Madrid tinha de saber que são 40,4168° N
     e 3,7038° O, e um algarismo trocado punha o céu inteiro no
     sítio errado sem nada a avisar — o erro não dá erro, dá um céu
     errado. Agora escreve-se "Madrid" e as coordenadas, a
     elevação e o fuso vêm com a terra escolhida.

     A procura vive no py/localizacao/, e tem duas fontes que se
     pedem em separado. A primeira é a lista de ~160 cidades:
     instantânea e sem rede, é ela que responde quase sempre. A
     segunda é o serviço público de geocoding (Open-Meteo), que
     traz as terras com aquele nome que a lista não tem. A lista
     ignora acentos e pontuação — "Lisboa, Portugal" e "lIsBoA"
     dão a mesma terra — e conhece os nomes portugueses ao lado
     dos originais, por isso "Londres" e "London" também.

     As duas somam-se, não se substituem: a lista é uma amostra,
     e uma amostra não pode responder sozinha a um nome que
     existe em vários países. Escrever "Granada" devolvia a
     espanhola e mais nada, quando há mais quatro no mundo. Os
     resultados da lista aparecem primeiro e os do serviço logo
     abaixo, e o que a lista já deu não se repete — a mesma
     Granada não aparece duas vezes por vir de duas fontes.
     Estão em pedidos separados por uma razão prática: juntá-los
     num só obrigava toda a procura a esperar pela internet para
     mostrar o que já estava em memória, e "Porto" não tem nada
     que esperar.

     Há três caminhos na página de perfil:
       · escrever o nome da cidade — a lista de resultados aparece
         debaixo do campo à medida que se escreve, e cada linha
         mostra a região e as coordenadas, que é o que distingue as
         terras com o mesmo nome. Basta UMA letra: quem escreve "S"
         vê as terras que começam por S e escolhe de lá, em vez de
         ter de saber o nome todo de cor. A partir de três letras a
         lista é completada com o que o serviço de geocoding
         conhece com aquele nome — chega um instante depois, por
         baixo das primeiras, e é assim que "Granada" mostra as
         outras quatro que existem no mundo. Escrever o nome do
         país também serve ("Espanha" dá as terras de Espanha) — mas
         quando há terras que se chamam mesmo o que se escreveu,
         as que só coincidiram por causa da região saem da lista,
         porque "port" a devolver o Porto e, atrás dele, Beja e
         Braga lê-se como um erro. Escolher na lista não grava
         nada: a escolha fica à espera do "Guardar esta
         localização", porque uma lista percorrida às setas mudava
         o céu a cada resultado por que se passasse;
       · "usar a localização deste dispositivo" — o browser dá as
         coordenadas e o fuso, e a aplicação vai buscar o NOME da
         terra a essas coordenadas (BigDataCloud). Sem esse nome
         não se grava nada: as coordenadas certas com um nome
         errado era pior do que não gravar, porque um nome errado
         no cabeçalho não se distingue de um certo;
       · "voltar a Vila Nova de Gaia" — repõe a localização de
         config.py. Só aparece a quem tem uma localização própria,
         porque sem ela já se está em Gaia.

     O cartão mostra o que está a valer, com as coordenadas e o
     fuso à vista — é a maneira de confirmar que a cidade escolhida
     é mesmo a que a aplicação está a usar, sem ter de acreditar só
     no nome — e uma hora local a andar segundo a segundo nesse
     fuso, e não no do computador. Quem escolher Sydney vê ali as
     horas de Sydney no mesmo instante em que o computador diz
     outra coisa.

  ⭐ Favoritos
     Estrelas, constelações e objetos de céu profundo, guardados
     por conta. Marcam-se no Observatório, com o ★ do painel de
     detalhes, e a lista (agrupada por tipo) fica na página de
     perfil. O objeto_id gravado é a chave do catálogo
     ("vega", "Ori"), e não o nome visível — mudar um nome no
     catálogo não deixa os favoritos de ninguém pendurados.

  📔 Registo de observações
     "Vi Saturno em 18/09, anéis bem visíveis." Escreve-se no
     formulário da página de perfil, e a lista fica logo abaixo.
     O nome do objeto fica copiado no registo, para a observação
     continuar a fazer sentido mesmo que o objeto mude de nome ou
     saia do catálogo.

O botão de conta (👤, no canto superior direito) não aparece no
Observatório nem no VR: nesses dois modos a página é toda céu e
ele ficava a flutuar por cima, sem nada à volta. Voltar ao menu
(botão "◀ Menu") traz o botão de novo. É ele que leva ao
/perfil — com sessão ou sem ela, porque quem não a tem é a
página de entrada que o recebe, e volta ao perfil depois de
entrar.

SEGURANÇA

  · As passwords nunca são gravadas. É gravado um hash scrypt
    (generate_password_hash, do werkzeug), com sal, do qual não
    se consegue voltar atrás para a password.
  · A sessão é um cookie assinado. Só lá vai o id da conta, e
    o cookie é HttpOnly (o JavaScript não o consegue ler) e
    SameSite=Lax (um site externo não consegue fazer pedidos
    autenticados em nome de quem tem sessão aberta).
  · A chave que assina o cookie é gerada na primeira execução
    para um ficheiro .secret_key, que está no .gitignore. Se
    estiver definida a variável de ambiente
    ASTROGUIDE_SECRET_KEY, é essa que é usada.
  · Entrar com uma conta que não existe e entrar com a password
    errada dão exatamente a mesma mensagem ("Nome ou password
    incorretos."). Distingui-las diria a quem tentasse à força
    quais os nomes que existem.
  · Apagar uma observação obriga a que ela seja da própria
    conta, e não apenas a que exista — um id adivinhado de
    outra pessoa não apaga nada.
  · O papel de administrador só se atribui a partir do
    terminal (py promover_admin.py). Nenhuma rota o pode dar e
    não há na aplicação nenhum botão que o faça — um botão
    desses seria a peça mais valiosa do projeto: chegar a ele
    era passar a ver os dados de todas as contas.
  · A /perfil verifica a sessão antes de renderizar, e mostra
    apenas os dados da própria conta. As rotas dos favoritos e
    das observações fazem todas o mesmo: perguntam ao servidor
    quem tem sessão e filtram por esse id — o id nunca vem do
    browser, por isso não há nada que se possa adivinhar para
    chegar aos dados de outra pessoa.
  · A /admin verifica o papel ANTES de renderizar, e a página
    de acesso negado não leva um único dado lá dentro. Um
    endpoint em JSON que devolvesse a lista de contas seria
    mais uma porta que teria de estar bem fechada; assim não
    existe nenhuma.

---

## ADMINISTRAÇÃO

O /admin mostra o que a base de dados tem: a lista das contas
com a localização de cada uma, quantos favoritos e quantas
observações guardou, e a data de registo. No topo, os totais.

É uma página só de leitura: não apaga contas, não muda papéis,
não apaga observações. É para olhar, e cliques distraídos aqui
não estragam nada.

Para passar uma conta a admin, uma vez, na pasta do projeto:

  py promover_admin.py                            → quem é admin
  py promover_admin.py o-email-da-conta           → promove
  py promover_admin.py o-email-da-conta --remover → tira o papel

Depois, entra na aplicação com essa conta e abre o /admin. O
papel fica gravado na base de dados, por isso vale para
qualquer browser e para qualquer sessão nova — e se a sessão
estiver aberta no momento em que se corre o script, também já
vale, sem ser preciso voltar a entrar.

O papel é uma coluna da tabela dos utilizadores, com
'utilizador' por omissão. Quem se regista nunca nasce admin, e
um astroguide.db que já existisse de antes desta alteração ganha
a coluna no arranque seguinte, com todas as contas a ficar
'utilizador' — ninguém ganha poderes por ter sido criado antes.

---

## ASTROGUIDE AI

Um painel de conversa dentro da aplicação: o botão "✦ AstroGuide
AI", em baixo à esquerda, abre uma janela onde se pode perguntar
o que é uma magnitude, porque é que a Lua tem fases, ou onde é
que cada coisa se vê no AstroGuide — e, desde que as ferramentas
se ligaram, também o que está visível agora, onde está um astro e
que eventos se aproximam.

### O aspeto: vidro escuro, e espaço para ler

O painel é vidro escuro sobre o céu — fundo translúcido, bordas
finas, cantos arredondados e um halo azul-violeta tão suave que
só se nota à procura dele. Uma conversa lê-se durante minutos, e
por isso o que manda é o ar: bolhas translúcidas com bastante
espaço entre elas, entrelinha larga e nada a brilhar mais do que
o necessário. As respostas são cartões escuros à esquerda, com a
estrela ao lado; as perguntas, mais compactas, à direita, num
fundo ligeiramente azulado.

O cabeçalho é o de uma mini-janela: "✦ AstroGuide AI" à
esquerda, o ↺ da conversa nova encostado ao título, e — ⛶ ✕ à
direita — minimizar, maximizar e fechar; o maximizar alterna com
um quase full-screen, para as conversas que crescem. Por baixo, a
linha verde do estado: "Online • Pronto para explorar o
universo". O ponto é desenhado em CSS e não um emoji, para ser
igual em todas as máquinas, e o divisor subtil fecha o cabeçalho
antes da conversa.

Quando não há conversa, o painel cumprimenta pelo primeiro nome
de quem chegou (o mesmo /api/me do botão de conta) e mostra
quatro perguntas de partida em cards com ícone à esquerda e seta
à direita. Quando a resposta está a chegar, são três pontos a
acender-se por turnos — sem texto ao lado, e com o salto trocado
por esbatimento para quem pediu menos movimento. E em baixo,
discretamente, a fonte: "ⓘ A IA utiliza os dados reais do
AstroGuide".

### A regra que manda em tudo o resto

**A IA não faz cálculos astronómicos.** Não tem fórmulas, não tem
efemérides e não tem as posições dos planetas — e as suas
instruções dizem-lhe, em primeiro lugar, para nunca inventar
posições, altitudes, azimutes, horas, fases nem datas de eventos.

Isto é deliberado, e é a decisão mais importante desta
funcionalidade. Um modelo de linguagem é bom a inventar uma
altitude plausível para Júpiter com toda a confiança, e ninguém
no painel tem como saber que é falsa. Uma aplicação de astronomia
que dá números errados com ar de certos é pior do que uma que não
dá número nenhum — por isso os números continuam a sair do
sky_engine.py, que é quem os calcula desde o princípio, e a IA é
uma porta de entrada para o AstroGuide e não um substituto dele.

O que mudou com o Function Calling foi a forma da regra, não o
seu fundo. Antes, a IA não tinha acesso aos cálculos, e a
instrução era recusar-se a dá-los: quem perguntasse por Júpiter
ouvia que ela ainda não os tinha e ia vê-los ao Céu Agora. Agora
tem-nos — mas não por os saber: por os ir buscar. A instrução
passou a ser usá-los sempre, e nunca completar de cabeça aquilo
que eles não disserem. A tentação é a mesma de antes, e agora
havia uma desculpa a menos: com os números verdadeiros à distância
de uma chamada, não há razão nenhuma para inventar um.

O que a IA faz, e para isso serve: explicar conceitos, responder
a perguntas de astronomia geral, orientar quem se perdeu na
aplicação ("onde vejo as constelações?") e — desde que as
ferramentas se ligaram (ver FUNCTION CALLING) — ir buscar os
números ao motor da aplicação. Quando os dá, são os
verdadeiros: os mesmos que estão no Céu Agora, no Calendário e
no Observatório.

### A chave nunca sai do servidor

A chave da API do Gemini é um segredo pago ao pedido: quem a
tiver gasta o dinheiro de quem a criou. Por isso:

  · vive na variável de ambiente GEMINI_API_KEY ou num
    ficheiro .ai_key na raiz do projeto — os dois fora do Git
    (ver .gitignore);
  · nunca chega ao browser. O painel (ia.js) fala com o nosso
    /api/ia/chat, e é o py/ia/rotas.py que chama o
    py/ia/ai_engine.py, que é o único ficheiro que fala com o
    serviço de IA. O JavaScript não sabe sequer qual é o
    fornecedor;
  · nem o /api/ia/estado a devolve — responde só se há IA
    configurada, e com que modelo.

### Só com sessão iniciada, e em todas as páginas

A AstroGuide AI é de contas: sem sessão, o /api/ia/estado
responde "sem_conta" e o /api/ia/chat responde 401 — sem gastar
um pedido ao serviço de IA. A razão é a mesma de tudo o resto
que é pessoal na aplicação: uma quota paga é de quem a paga, e
quem não tem conta não está a contribuir para ela.

O botão, ao contrário, não se esconde. Esconder uma porta é a
melhor maneira de ninguém perceber que ela existe — quem ainda
não entrou abre o painel e encontra o aviso com a porta de
saída para o /entrar (e o /entrar leva a criar conta).

E o painel está em todas as páginas: menu inicial, as cinco
abas da aplicação (Observatório incluído), o perfil e o /admin.
Só o Observatório VR a esconde — lá o ecrã é todo céu e um
botão flutuante é uma coisa a mais —, e no Observatório 2D o
botão e o painel se afastam do painel lateral, que ocupa a
esquerda toda (ver o ia.css). A IA é peça da moldura, não de
um ecrã.

### Sem chave, a aplicação corre igual

A AstroGuide AI é opcional, e é opcional até ao fim: sem chave
configurada, o servidor arranca normalmente, o céu, o calendário
e o observatório funcionam como sempre, e o painel abre a dizer
que a IA não está configurada e como é que quem administra o
servidor a configura. Nada rebenta e nenhum ecrã fica preso.

O mesmo vale para o pacote: o `google-genai` é importado dentro
do ai_engine.py e não no topo do ficheiro, de propósito. No
topo, um servidor sem o pacote instalado não arrancava de todo —
o server.py importa as rotas da IA, as rotas importam o motor, e
um ModuleNotFoundError derrubava a aplicação inteira, céu e
observatório incluídos, por causa de uma funcionalidade
opcional.

### Onde vive o histórico

No browser. O servidor Flask não guarda conversas: a sessão tem
só o id do utilizador, e uma tabela de conversas exigiria
guardar o que as pessoas perguntam e responder a "de quem são
estas conversas?" — ninguém pediu isso. O histórico da conversa
vive no sessionStorage, como o estado da música (ver o
shared-ui-controls.js), vai inteiro em cada pedido, e desaparece
quando o separador fecha. É isso que faz a conversa durar
enquanto se navega entre o Céu, o Calendário e o Observatório.

### Duas vozes, dois avatares

Cada mensagem leva, ao lado, o avatar de quem a disse: a estrela ✦
da AstroGuide AI, à esquerda das respostas, e uma silhueta de
pessoa, à direita das perguntas. O da pessoa é cinza e o da IA é
azul, de propósito — o azul é a marca da IA em todo o painel, e
dois círculos azuis davam a mesma cara às duas vozes.

Não é decoração. Sem eles, a conversa eram duas bolhas parecidas,
uma à esquerda e outra à direita, e o lado era a única pista:
quem abrisse o painel a meio, com a conversa já a rolar, tinha de
seguir cada bolha até ao princípio para saber de quem era. O da
pessoa é desenhado em CSS, com duas formas redondas, em vez de ser
um emoji — um emoji traria a paleta do sistema (o amarelo no
Windows, o azul na Apple) para dentro de um painel que é todo azul
e vidro, e mudava de feitio de máquina para máquina.

As falhas ficam sem avatar nenhum: não foram ditas por ninguém, e
dar-lhes a cara da IA era fazer passar por ela uma coisa que ela
nunca disse.

### O que a IA recebe em cada pergunta

  · a pergunta;
  · o histórico da conversa (as últimas 20 mensagens; as
    respostas que falharam ficam no painel mas não são
    enviadas);
  · a localização de observação — a mesma que o /api/ceu usa,
    do localizacao_do_utilizador(), e não uma que o browser
    diga. Vai com o nome da terra, as coordenadas e o fuso, e
    a data e hora locais no instante do pedido: sem isso o
    modelo responde sobre o céu de uma noite que não é esta,
    e de um sítio que não é o de quem pergunta;
  · as quatro ferramentas do py/ia/ferramentas.py, declaradas
    no próprio pedido (ver FUNCTION CALLING). São elas, e não
    o texto acima, que lhe dão os números — e ele vai buscá-las
    sozinho, sem que ninguém tenha de lho pedir.

### A IA sabe em que ecrã está quem pergunta

Um mapa dos ecrãs, escrito à mão, vai em cada instrução (ver
O_QUE_CADA_ECRA_MOSTRA, no ai_engine.py). Isto existe por uma
razão concreta: a IA mandava quem perguntava por uma magnitude
ver "no Céu Agora" — e o Céu Agora não tem magnitudes nem
constelações, tem só o Sol, a Lua e os planetas. Quem a isso
atendia chegava lá e não encontrava nada.

O mapa diz o que cada ecrã mostra:

  · Menu inicial — os quatro cartões que levam aos outros.
  · Céu Agora — o Sol, a Lua e os planetas AGORA, com altitude,
    azimute, distância e se estão visíveis. Sem estrelas, sem
    constelações e sem magnitudes.
  · Calendário Cósmico — a fase da Lua em cada dia e os
    eventos marcados; clicar num dia abre os detalhes dele.
  · Observatório — o mapa celeste interativo, e é AQUI que se
    vêem magnitudes e constelações: clica-se numa estrela,
    num planeta, numa constelação ou num objeto de céu
    profundo e o painel de Detalhes traz a magnitude, a
    altitude, o azimute e a constelação. Com pesquisa, tour
    guiado, controlos, o botão da ISS e a entrada no VR.
  · Observatório VR — o mesmo céu em 3D, para óculos.
  · NASA – Imagem do Dia — a fotografia da NASA e a explicação.
  · Perfil — a localização guardada, os favoritos e o caderno
    de observações.

E, para além do mapa, o painel diz ao servidor em que ecrã está
(campo "ecra", dentro da lista branca do ECRAS): quem pergunta
por uma magnitude com o Observatório aberto ouve falar do
Observatório, e não dos cartões do menu. Um ecrã errado vale
tanto como um número inventado — a pessoa chega lá e não
encontra o que lhe foi prometido.

### Vinte pedidos por dia, por modelo

O plano gratuito do Google não dá um limite por minuto: dá
**20 pedidos por dia, e por modelo**. O erro di-lo por extenso
("GenerateRequestsPerDayPerProjectPerModel-FreeTier", limit: 20),
e o "PerModel" no meio do nome é a parte que interessa: cada
modelo tem o seu próprio balde de 20, e esgotar um não gasta nada
do outro.

Vinte perguntas por dia esgotam-se numa demonstração, e a partir
daí o painel só sabia dizer que havia demasiados pedidos. Por isso
o ai_engine.py não tem um modelo: tem uma lista.

  gemini-3.8-flash        ← o principal
  gemini-3.7-flash
  gemini-3.6-flash
  gemini-3.5-flash
  gemini-3.5-flash-lite
  gemini-3.1-flash-lite

Seis baldes, e não cinco. Os gemini-2.5-flash e
gemini-2.5-flash-lite que aqui estiveram respondem 404 a contas
novas ("no longer available to new users") apesar de continuarem
na listagem da API — eram duas voltas da lista a troco de nada e,
pior, era o 404 deles, a última falha de todas, que subia ao
painel. Os que entraram — 3.7, 3.6 e o 3.5-flash-lite — foram
todos testados a gerar com a chave antes de entrar.

Cada pergunta começa pelo primeiro. Se ele responder 429 (o balde
dele cheio) ou 5xx (ele em baixo), passa-se ao seguinte e
tenta-se outra vez — e, como os baldes são separados, o segundo
responde. É esta lista que dá à aplicação folga para umas
sessenta perguntas por dia em vez de vinte — e não cento e vinte,
porque uma pergunta que peça dados ao motor gasta dois pedidos e
não um (ver FUNCTION CALLING).

Só se desce a lista quando a falha é do modelo. Uma chave
inválida, um pedido mal formado ou a rede caída são iguais em
todos, e insistir só gastaria tempo sem poupar quota nenhuma.

E, quando a lista toda falha, o que se mostra NÃO é a última
falha — é a mais importante (_PRIORIDADE_FALHA, no ai_engine.py:
limite > serviço > modelo). Sem isto, a quota diária esgotada
mostrava o 404 de um modelo antigo ("não encontrei nenhum
modelo"), e a pessoa ia procurar o problema na lista de modelos
em vez de esperar que a quota voltasse.

A ordem não é arbitrária: os primeiros escrevem melhor português
de Portugal, e os "lite" são mais rápidos mas mais propensos a
escorregar para o português do Brasil — as instruções de sistema
dizem-lhes por isso, explicitamente, para tratar o utilizador por
"tu" e nunca por "você". Em uso normal responde sempre o
principal; os outros só entram quando os de cima estão gastos.

O balde volta a encher no dia seguinte, e o painel diz QUANTO
falta e a que horas — não "espera um pouco". Um limite diário não
se resolve à espera de um minuto, e mandar esperar quem já tem a
resposta do outro lado do ecrã à espera de horas é trocar um
problema por outro.

O momento exato vem do próprio erro da API, que o traz escrito
("Please retry in 6h10m…"); na falta dele, calcula-se pela
meia-noite UTC — que é onde o relógio do serviço aponta (medido
em 2026-10, o "retry in" deles dava sempre 00:00 em ponto, e não
a meia-noite da Califórnia que a documentação pública descreve;
quando os dois discordam, manda o serviço). O que sai daqui é o
campo "quota_renova_em", em ISO com o fuso lá dentro:

  · a frase do erro leva já o tempo escrito — "Faltam 6 h 07 min
    — renova às 01:00, hora local", no fuso de quem pergunta;
  · e o painel pendura-lhe por baixo uma contagem que se atualiza
    sozinha a cada 20 segundos e, ao chegar ao zero, troca por um
    "já deve ter voltado — tenta a pergunta outra vez"
    (contarQuota, no ia.js; a linha é a .ia-contagem, no ia.css).

A resposta do /api/ia/chat traz um campo "modelo" com o modelo que
respondeu de facto. O painel não o mostra — é para quem estiver a
ler um log perceber se naquele dia andou a responder o bom ou o de
recurso.

### Quando falha

Cada família de falha tem o seu estado HTTP e uma frase em
português, e é essa frase que o painel mostra:

  401 → não há sessão iniciada. A funcionalidade é de contas, e
        quem não entrou não gasta um pedido ao serviço de IA —
        o painel mostra a frase e a porta para o /entrar
  400 → o pedido está mal feito (mensagem vazia, ou acima dos
        1500 caracteres) ou o serviço recusou-o como está
        montado (quase sempre a conversa a ser grande demais
        para o contexto — aí, a frase manda começar uma nova)
  429 → um limite de pedidos. O do serviço de IA muda de frase
        consoante o balde que encheu: o por minuto manda esperar
        um pouco, o diário diz quanto falta e a que horas, com a
        contagem a correr dentro da bolha; antes de desistir, o
        motor já tentou todos os modelos da lista.
        O nosso é de dez perguntas por minuto por IP, e existe
        pela mesma razão dos outros — a quota é paga e é de
        todos os que usam o servidor
  503 → não há chave, a chave não está a ser aceite, ou falta o
        pacote google-genai
  502 → o serviço de IA está com problemas, um dos modelos já
        não existe, ou não devolveu resposta nenhuma (a
        resposta foi bloqueada)
  504 → não se conseguiu chegar ao serviço (rede), ou o tempo
        acabou

### Quanto tempo se espera

Tem de haver um fim, e o fim está em três sítios que se
encaixam:

  · 90 segundos por chamada ao serviço de IA
    (TIMEOUT_PEDIDO_MS, no py/ia/ai_engine.py) — é o timeout
    que o SDK não põe sozinho, e sem ele uma ligação que
    estagnasse ficava presa para sempre;
  · 3 minutos pela pergunta inteira (TEMPO_MAXIMO_PERGUNTA) —
    uma pergunta que peça dados ao motor são três chamadas
    seguidas, e em uso real uma dessas demorou 167 segundos;
    só se arranca a chamada seguinte se ainda faltar tempo
    para ela;
  · 4 minutos no painel (TEMPO_MAXIMO_PEDIDO_MS, no
    static/js/ia.js) — acima do que o servidor pode demorar,
    para o aviso nosso nunca chegar antes do dele. Ao
    estourar, o pedido cancela-se e a pergunta fica no painel
    com o aviso, pronta a repetir-se.

Uma falha não deita fora a conversa: a pergunta fica no painel
com a falha logo abaixo, e a pergunta seguinte segue com o
histórico todo. O motor junta mensagens seguidas do mesmo lado,
para que um pedido falhado não produza dois turnos seguidos do
utilizador.

### Como configurar

  1. Criar uma chave no Google AI Studio (Get API key);
  2. Guardá-la numa das duas formas:
       · variável de ambiente GEMINI_API_KEY (recomendado
         num servidor — nunca chega ao disco);
       · ficheiro .ai_key na raiz do projeto, com a chave
         numa linha só (mais simples para correr na própria
         máquina);
  3. Instalar a dependência: py -m pip install -r
     requirements.txt (traz o google-genai);
  4. Reiniciar o servidor.

O ficheiro .ai_key leva a chave numa linha só, sem aspas e sem
espaços à volta. O formato das chaves do Google tem mudado — as
mais recentes começam por "AQ." e não por "AIza" —, por isso o
que vale é copiar o que o Google AI Studio dá, sem inventar. Se a
chave for inválida ou tiver sido revogada, o /api/ia/chat responde
503 e o painel diz que a chave não está a ser aceite — a distinção
entre "não há chave" e "a chave não serve" está lá precisamente
para não se andar às cegas.

### FUNCTION CALLING (ligado)

A IA não responde de cor aos números. Tem quatro ferramentas, no
py/ia/ferramentas.py, e é chamá-las que faz com que uma altitude
dita por ela seja a mesma que está no Céu Agora:

  get_sky_now          → o que está visível agora. Por omissão
                         devolve tudo — o Sol, a Lua e os sete
                         planetas (com a distância à Terra e, na
                         Lua, a fase), as catorze constelações, as
                         estrelas e os objetos de céu profundo —,
                         e o parâmetro "tipo" deixa pedir só uma
                         dessas famílias. É a ferramenta das
                         perguntas largas: "que constelações estão
                         visíveis?", "das visíveis qual está mais
                         alta?"
  get_object_position  → onde está um objeto pelo nome — planeta,
                         estrela, objeto de céu profundo ou
                         constelação
  get_moon_phase       → a fase da Lua num dia
  get_next_events      → os próximos eventos, a partir de hoje

Cada uma reutiliza as funções que já existiam (get_observatorio,
get_todos_planetas, get_fase_lua_dia, get_eventos_do_mes): não há
aqui um único cálculo novo. A IA é uma porta de entrada para o
motor do AstroGuide, nunca um substituto dele.

**Como é que o vaivém funciona.** O modelo recebe as ferramentas
na declaração do pedido e, quando a pergunta é sobre o céu,
responde com um PEDIDO de ferramenta em vez de responder com
texto. O servidor corre o que ele pediu, devolve-lhe o resultado,
e só então ele escreve a resposta. Uma pergunta normal são, por
isso, dois pedidos ao serviço de IA — e não um.

**O que isso custa.** Com 20 pedidos por dia e por modelo, isto
baixa a capacidade de cada balde de cerca de 20 perguntas para
cerca de 10. A lista de modelos de recurso (ver acima) continua a
dar folga suficiente para uma demonstração, mas é a razão pela
qual o ai_engine.py trava o vaivém às três voltas: um modelo que
aos três pedidos ainda não sabe responder está a andar em
círculos, e a volta seguinte não o endireita.

**A localização nunca passa pelo modelo.** Ele sabe onde a pessoa
está porque lhe dizemos, mas não a pode mudar: o executar() deita
fora qualquer "localizacao" que venha nos argumentos e usa a que o
servidor já tinha resolvido (ver localizacao_do_utilizador, em
py/database/auth.py). Sem isso, uma pergunta com "estou em Marte"
escrito lá dentro respondia com o céu de Marte.

**O catálogo não sabe de que marca é.** As ferramentas estão
descritas em JSON Schema puro, sem nada específico do Gemini, e é
o ai_engine.py que as traduz para o formato que a API come (ver o
_declaracoes). Trocar de fornecedor mexe no _sdk() e pouco mais —
o ferramentas.py fica como está.

E a regra mantém-se, agora mais forte: os números que a IA der vêm
todos do motor da aplicação, e são exatamente os mesmos que
aparecem no Céu Agora, no Calendário e no Observatório.

---

## LINGUAGENS USADAS

PYTHON (Backend)
  Responsável por todos os cálculos astronómicos e pelo
  servidor. Nunca é visível para o utilizador.
  Ficheiros: server.py, promover_admin.py, _teste_contas.py,
             py/config.py, py/database/ (db.py, auth.py,
             admin.py), py/astronomia/ (sky_engine.py, iss.py,
             apod.py), py/ceu/ (estrelas.py, ceu_profundo.py,
             eventos.py), py/ia/ (ai_engine.py, rotas.py,
             ferramentas.py)

HTML (Estrutura)
  Define a estrutura das páginas e as secções da app.
  Ficheiros: templates/menu.html, templates/index.html,
             templates/entrar.html, templates/perfil.html,
             templates/admin.html

CSS (Estilo)
  Design system com glassmorphism e tema escuro.
  Animações de entrada, hover, shimmer e borderGlow.
  Ficheiros: shared-ui-controls.css, glass.css,
             menu.css, index.css, auth.css, conta.css,
             perfil.css, admin.css, ia.css

JavaScript (Interatividade)
  Gere o estado da aplicação no browser. Comunica com o
  Python via API (fetch). Desenha o mapa celeste em Canvas
  com projeção 360° e 2D (planisfério), e uma versão 3D real
  em WebGL (Three.js) no Observatório VR.
  Ficheiros: shared-ui-controls.js, menu.js,
             index.js, vr-observatorio.js, conta.js,
             auth.js, perfil.js, admin.js, ia.js

---

## BIBLIOTECAS PYTHON USADAS

skyfield (pip install skyfield)
  Biblioteca científica de astronomia.
  Usa as efemérides DE421 da NASA para calcular com
  precisão a posição de qualquer astro em qualquer
  momento e lugar da Terra.
  Suporta ts.from_datetime() para cálculos em datas
  passadas ou futuras (funcionalidade de Viagem no Tempo).

flask (pip install flask)
  Micro-framework web para Python.
  Cria o servidor que serve as páginas e a API JSON.
  Usa request.args para ler os query parameters da API.

tzdata (pip install tzdata)
  Base de dados de fusos horários.
  Necessário no Windows para converter horas UTC
  para hora local (Europe/Lisbon, Europe/Madrid,
  Australia/Sydney...).
  É também o que o py/database/auth.py usa para
  verificar, à entrada, que um fuso horário existe
  mesmo (ZoneInfo), em vez de o gravar às cegas.
  Incluído no requirements.txt.

requests (pip install requests)
  Biblioteca para pedidos HTTP.
  Usada no py/astronomia/apod.py (Imagem Astronómica do Dia,
  à API pública da NASA), no py/astronomia/iss.py (elementos
  orbitais da ISS, à Celestrak) e no py/localizacao/geocoding.py
  (o nome de uma terra a partir das coordenadas do dispositivo,
  ao BigDataCloud).

google-genai (pip install google-genai)
  O SDK oficial do Google para a API do Gemini — a IA da
  AstroGuide AI.
  Usado só no py/ia/ai_engine.py: é o único ficheiro do
  projeto que fala com um serviço externo de IA, e é essa
  fronteira que faz com que trocar de fornecedor seja mexer
  num ficheiro só.
  A chave não vai no código: vem da variável de ambiente
  GEMINI_API_KEY ou do ficheiro .ai_key, os dois fora do Git.
  Incluído no requirements.txt.

## BIBLIOTECAS JAVASCRIPT USADAS

Three.js (via CDN)
  Biblioteca de gráficos 3D baseada em WebGL.
  Usada no Observatório VR (vr-observatorio.js): cena 3D
  real com estrelas (THREE.Points) e linhas de constelações
  (THREE.LineSegments) posicionadas pelas coordenadas
  astronómicas reais devolvidas pela API.
  O carregamento é garantido por garantirTHREE(), que
  reutiliza o THREE já presente ou o vai buscar ao CDN.
  Versão: r160 — cdn.jsdelivr.net/npm/three@0.160.0

Canvas API (nativa do browser)
  Usada para desenhar o mapa celeste do Observatório 2D.
  Suporta dois modos: Vista 360° (projeção perspetiva 3D
  com rotação de câmara por arrasto, fundo panorâmico da
  Via Láctea e planetas com imagem real) e Planisfério
  (vista zenital 2D clássica). Permite clicar em astros,
  estrelas e constelações para ver detalhes, curiosidades
  e imagens.

Intl.DateTimeFormat (nativa do browser)
  É com ela que o perfil mostra a hora local da terra
  escolhida, e que o Céu Agora sabe que dia é lá: a opção
  timeZone formata a hora no fuso pedido, e o
  formatToParts() dá as peças (ano, mês, dia, hora) uma a
  uma. Sem isto, a aplicação usava a hora do computador —
  que está certa para quem a usa e errada para o céu que
  está a mostrar, se a localização escolhida for noutro fuso.

Geolocation API (nativa do browser)
  Usada no botão "usar a localização deste dispositivo"
  (perfil.js). Dá as coordenadas, e o nome da terra vem
  depois do servidor (ver /api/localidades/reversa).
  Se o browser recusar ou não a tiver, diz-se — a lista de
  cidades é o outro caminho, e está sempre lá.

---

## CONCEITOS-CHAVE

Efemérides (de421.bsp)
  Tabela matemática com as posições de todos os planetas
  ao longo do tempo. Calculada pela NASA com altíssima
  precisão. O Skyfield usa este ficheiro para saber onde
  está cada planeta em cada momento.

API (Application Programming Interface)
  Canal de comunicação entre o JavaScript (browser) e o
  Python (servidor). O JavaScript faz fetch("/api/ceu")
  e recebe os dados em formato JSON.

Query Parameters
  Parâmetros opcionais passados no URL após o "?".
  Ex: /api/observatorio?data=2026-07-18&hora=02:00
  Usados na funcionalidade de Viagem no Tempo para
  calcular o céu num momento diferente do atual.

JSON (JavaScript Object Notation)
  Formato de troca de dados entre Python e JavaScript.
  Ex: {"altitude": 36.5, "azimute": 202.1, "visivel": true}

SPA (Single Page Application)
  Técnica onde a navegação entre ecrãs acontece no browser
  sem recarregar a página. O JavaScript mostra e esconde
  secções conforme o ecrã ativo, tornando a app mais rápida.

Glassmorphism
  Estilo visual de painéis translúcidos com desfoque de
  fundo (backdrop-filter: blur). Cria profundidade e
  elegância mantendo o conteúdo legível sobre fundos
  complexos como o campo de estrelas e a fotografia
  do menu.

Projeção Perspetiva 3D (Vista 360°)
  O Observatório 2D usa geometria de câmara virtual com
  rotação Yaw (azimute) e Pitch (altitude) e campo de
  visão (FOV) variável via scroll. Cada estrela/astro
  é projetado no plano do ecrã com divisão pela
  profundidade (z), criando a ilusão de perspetiva real.

WebGL / Three.js (Observatório VR)
  Ao contrário do Observatório 2D (Canvas achatado com
  matemática de projeção manual), o Observatório VR cria
  uma cena 3D real — a câmara existe genuinamente no
  espaço 3D, e o WebGL trata da projeção e profundidade.
  É isto que permite ligar o WebXR e usar o tracking real
  da cabeça de um headset como o Meta Quest 3, em vez de
  uma rotação de câmara simulada pelo arrasto do rato.

Coordenadas Horizontais (Altitude/Azimute)
  Sistema de coordenadas usado em todo o projeto — 2D, 360°
  e VR — porque é relativo ao observador (ao contrário de
  RA/Dec, que são coordenadas absolutas do céu). Permite
  reutilizar exatamente os mesmos dados da API em três
  motores de renderização diferentes sem duplicar cálculos.

Geração Procedural
  Conteúdo criado por código/matemática em vez de imagens
  ou ficheiros externos. Usado nos ícones do menu (estrela,
  lua crescente, telescópio e jornal), desenhados com a
  Canvas API — não ocupam espaço no repositório e mantêm
  a nitidez em qualquer resolução.

Degradação Graciosa (Graceful Degradation)
  Padrão usado nas imagens de constelações e de planetas:
  se uma imagem não existir ou falhar a carregar, a app não
  parte — mostra automaticamente um resultado alternativo
  (texto sem imagem, ou o círculo de cor original) em vez de
  um ícone de imagem partida.

Altitude
  Ângulo em graus acima do horizonte.
  0° = horizonte | 90° = zenith | Negativo = não visível

Azimute
  Direção horizontal em graus a partir do Norte.
  0° = Norte | 90° = Este | 180° = Sul | 270° = Oeste

UA (Unidade Astronómica)
  Distância média da Terra ao Sol = 149.597.870 km

sessionStorage
  Memória temporária do browser usada para manter o
  estado da música ao navegar entre páginas e o histórico
  da conversa com a AstroGuide AI. Apaga quando o browser
  é fechado.

Chave de API
  A credencial que identifica quem está a usar um serviço
  externo — no caso da AstroGuide AI, a chave do Gemini.
  É um segredo pago ao pedido: quem a tiver gasta o dinheiro
  de quem a criou, e uma chave publicada num repositório é
  encontrada por robôs em minutos. Por isso vive numa
  variável de ambiente ou num ficheiro fora do Git, e nunca
  chega ao browser.

Instruções de sistema (system prompt)
  O texto que diz ao modelo o que ele é e o que não é, e que
  vai em cada pedido antes da conversa. É aqui que está
  escrita a regra da AstroGuide AI: não inventar posições,
  altitudes, horas nem fases — esses números só podem vir das
  ferramentas, que os vão buscar ao sky_engine.py. A IA é a
  porta de entrada, não o motor.

Function Calling
  Mecanismo que permite a um modelo pedir para executar uma
  função nossa em vez de responder de cor. O modelo diz
  "chama get_sky_now"; o servidor corre-a com as funções do
  AstroGuide, devolve-lhe o resultado, e a resposta final já
  vem com os dados verdadeiros. É o que transforma a IA de
  narradora em porta de acesso ao motor da aplicação: é o que
  está ligado no py/ia/ferramentas.py e no _declaracoes do
  ai_engine.py.

DRY (Don't Repeat Yourself)
  Princípio de programação aplicado no projeto:
  glass.css centraliza o design system,
  shared-ui-controls.js evita repetição de lógica de música
  e configurações, e o Observatório VR reutiliza a mesma
  API do Observatório 2D em vez de recalcular posições
  astronómicas.

Geocoding
  Traduzir um NOME numa posição (e o contrário). É o que
  permite que a localização se escolha escrevendo "Madrid":
  alguém já fez a lista de que Madrid são 40,4168° N, 3,7038° O
  e o fuso Europe/Madrid, e a aplicação vai buscá-la em vez de
  a pedir a quem está a usar.
  Aqui é feito em duas camadas: a lista local de
  py/localizacao/cidades.py (instantânea, e funciona sem
  rede) e os serviços públicos Open-Meteo e BigDataCloud —
  ambos sem chave de API. As duas camadas somam-se em vez de
  se substituírem: a lista responde primeiro e sem rede, e o
  Open-Meteo acrescenta as terras com aquele nome que ela não
  tem — é uma amostra, e "Granada" existe em cinco países.
  O BigDataCloud é o caminho contrário, das coordenadas para
  o nome da terra (ver "usar a localização deste
  dispositivo").

Fuso horário IANA
  Os fusos são identificados pelo nome da região
  ("Europe/Lisbon", "Australia/Sydney"), e não por um
  deslocamento em horas. A diferença importa: o deslocamento
  de Lisboa muda entre as 0 e as +1 horas conforme a hora de
  verão, e um "0" gravado hoje estava errado metade do ano.
  O nome traz as regras todas, incluindo as mudanças de hora
  — e é o próprio Python que o confirma (ZoneInfo) antes de
  ele ser gravado.

---

## FUNCIONALIDADES IMPLEMENTADAS

  [x] Landing Page interativa com menu dinâmico (4 cartões)
  [x] Campo de estrelas animado em CSS (menu e app)
  [x] Design system glassmorphism (glass.css)
  [x] Animações Canvas — ícones desenhados à mão no menu
  [x] Favicon SVG personalizado
  [x] Dados em tempo real — Sol, Lua e 7 planetas
  [x] Altitude, azimute e distância de cada astro
  [x] Visibilidade (acima/abaixo do horizonte)
  [x] Fase da Lua em tempo real com emoji
  [x] Calendário Cósmico com fases calculadas pela NASA
  [x] Eventos astronómicos — chuvas de meteoros e eclipses
      (2026 e 2027, incluindo o eclipse solar de 2/8/2027)
  [x] Detalhe do dia — nascer/pôr do sol, fase da lua
  [x] Validação de datas nas rotas da API (mês/dia inválidos)
  [x] NASA - Imagem do Dia (APOD) com cache diário
  [x] Painel de configurações com controlo de volume
  [x] Música ambiente com persistência entre páginas — toca
      só no Observatório (2D) e no VR, que é onde acompanha o
      que se está a ver. No menu e nas outras abas não há
      música nenhuma, e é por isso que o ⚙️ (que só tem o
      volume e o botão da música lá dentro) só aparece
      nesses dois ecrãs
  [x] Localização no menu — mostra a localização da conta (ou a
      de omissão), escrita pelo servidor. A deteção pelo browser
      que ali estava saiu: competia com a escolha feita no perfil,
      e o menu podia dizer uma terra e o céu estar a calcular
      outra
  [x] Navegação SPA — todos os ecrãs sempre acessíveis
  [x] Atualização automática dos dados a cada 30 segundos
  [x] Relógio em tempo real
  [x] Botão ◀ Menu em todas as páginas
  [x] Separação de responsabilidades HTML / CSS / JS
  [x] Código partilhado (DRY) em ficheiros shared
  [x] Repositório no GitHub com historial de commits
  [x] Observatório — Mapa celeste interativo com Canvas
  [x] Vista 360° com câmara virtual (arrastar + zoom)
  [x] Vista Planisfério (2D zenital clássico)
  [x] Estrelas reais com magnitude e posição calculada
  [x] Constelações com linhas e nomes (nomenclatura latina/IAU)
  [x] Curiosidades e ilustrações por constelação (ao clicar)
  [x] Sol, Lua e todos os planetas no mapa celeste, com imagens reais
  [x] A ISS desenhada no céu, com a posição tirada da órbita
      real (e por isso diferente de cada sítio), e um botão 🛰
      que a localiza agora
  [x] Fundo panorâmico real da Via Láctea, com parallax
  [x] Clique num astro/estrela/constelação para ver detalhes
  [x] Painel de filtros — constelações, nomes, magnitude
  [x] Pesquisa — procurar uma estrela, constelação ou planeta
      pelo nome, com a lista de resultados a aparecer enquanto
      se escreve (e navegável pelo teclado)
  [x] Night Mode (Red Velvet) — o mapa todo em tons de
      vermelho, para não estragar a visão noturna. Caixa no
      painel dos Controlos, com as outras camadas — no mapa
      era um segundo botão para o que já tinha um, a ocupar a
      esquina do céu
  [x] "Ver abaixo do horizonte" — tira o chão e mostra as
      estrelas, constelações e planetas que estão debaixo do
      horizonte, desenhados mais apagados para se perceber
      que não estão observáveis nesse instante (só na vista
      360°: no Planisfério eles caem fora do círculo)
  [x] Botão "⤓ Céu sob os pés" — desce a câmara de uma vez
      até ao polo celeste escondido (o meio da metade do céu
      que nunca se vê daqui) e volta a subir no clique
      seguinte. Sem ele, chegar lá abaixo era arrastar o rato
      mais de um ecrã inteiro, e outro tanto para voltar — a
      caixa sozinha não chegava para ver aquilo que ela
      própria destapa
  [x] Painel lateral com scroll independente
  [x] Viagem no Tempo — simular o céu em qualquer data/hora
  [x] Botão "↺ Tempo Real" para voltar ao céu atual
  [x] Auto-refresh desativado automaticamente em simulação
  [x] Conversão automática hora local → UTC (hora de verão,
      segundo o fuso da localização escolhida: quem observa de
      Sydney vê o céu de Sydney, e não o do computador)
  [x] Observatório VR — Fase 1: cena 3D com Three.js,
      reutilizando os dados do Observatório 2D, com estrelas
      e constelações reais e navegação por arrasto do rato
  [x] Hora simulada partilhada entre o Observatório 2D e o
      Observatório VR — o VR mostra sempre o mesmo céu, e a
      hora escolhida mantém-se ao voltar do VR ao Observatório
  [x] Observatório VR — Fase 2: sessão WebXR imersiva
      (immersive-vr) com tracking real da cabeça num Meta
      Quest 3, mantendo o arrasto do rato no PC
  [x] Observatório VR — Sol, Lua, planetas e a ISS na cena 3D,
      cada um com a sua imagem real. A ISS leva o mesmo
      tratamento que no 2D: desenhada inteira, na proporção 3:2
      da fotografia, em vez do recorte circular dos planetas —
      o círculo espremia-a e cortava as pontas dos painéis
      solares
  [x] Observatório VR — céu sob os pés, sempre ligado: aqui o
      "Ver abaixo do horizonte" não é uma caixa, porque não há
      chão nenhum a tapar o céu. As estrelas, as constelações e
      os planetas debaixo do horizonte aparecem sempre, e
      desenhados a 0,6 (o mesmo ALFA_ABAIXO do Observatório 2D)
      para se continuar a ver que não estão observáveis. Uma
      linha de constelação que atravesse o horizonte conta como
      céu de cima e leva o neon todo — a divisão é a mesma do
      2D, para os dois observatórios mostrarem o mesmo céu
  [x] Página /perfil — a localização de observação, os
      favoritos e o caderno de observações de uma conta, numa
      página só (as iniciais do nome como avatar)
  [x] Localização escolhida pelo NOME — um seletor de cidade e
      país que resolve as coordenadas e o fuso horário sozinho,
      a partir de uma lista local de ~160 cidades com o serviço
      de geocoding por trás dela. Escrever latitude e longitude
      à mão deixou de ser preciso, e deixou de ser possível
  [x] Papel de administrador, atribuído a partir do terminal
      (py promover_admin.py) e nunca a partir do browser
  [x] Página /admin — só para quem tem esse papel: as contas
      registadas e o que cada uma guardou, numa tabela só de
      leitura, com os totais no topo
  [x] AstroGuide AI — um painel de conversa com a IA (Gemini),
      aberto pelo botão "✦ AstroGuide AI". A chave da API vive
      só no servidor (variável de ambiente ou .ai_key) e nunca
      chega ao browser; o histórico da conversa vive no
      sessionStorage e atravessa a navegação entre ecrãs. A IA
      é instruída a não inventar dados astronómicos — os
      números continuam a ser os do sky_engine.py, e quem
      pergunta por eles é encaminhado para o Céu Agora, o
      Calendário ou o Observatório. Sem chave configurada, o
      painel di-lo e o resto da aplicação corre igual

---

## ROADMAP — PRÓXIMAS FUNCIONALIDADES

  [x] Contas de utilizador e localização pessoal (feito)
  [x] Favoritos no Observatório — o ★ no painel de detalhes, e
      a lista (agrupada por tipo) na página de perfil (feito)
  [x] Registo de observações na interface — o formulário e a
      lista do caderno, na página de perfil (feito)
  [x] AstroGuide AI — painel de conversa com contexto da
      localização (feito)
  [x] AstroGuide AI — Function Calling ligado: a IA consulta as
      ferramentas do py/ia/ferramentas.py (get_sky_now,
      get_object_position, get_moon_phase, get_next_events) e
      responde com os números do próprio AstroGuide, em vez de
      dizer que ainda não os tem (feito)
  [ ] Catálogo de estrelas alargado (Hipparcos — 117k estrelas)
  [ ] Hosting online com URL público
  [ ] Versão mobile (React Native ou Capacitor)
  [ ] Ligação a telescópio via Arduino — figura física que
      aponta para a estrela selecionada (Fase 2 do hardware)

---

## FERRAMENTAS USADAS NO DESENVOLVIMENTO

  Claude (claude.ai)   → Assistente de aprendizagem e desenvolvimento
  Cursor               → Editor de código com IA integrada
  GitHub               → Controlo de versões e repositório
  Postman              → Teste das rotas da API
  Brave                → Browser de desenvolvimento
  Notion               → Organização e notas do projeto

---

  Desenvolvido por: Diogo Vedor Peres Pinho
  Escola: Escola Profissional de Gaia
  Curso: Programador de Informática
  Ano: 2025/2026