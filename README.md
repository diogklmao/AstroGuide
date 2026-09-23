# ============================================================

  ASTROGUIDE — Documentação do Projeto
  PAP 12.º Ano | Curso de Programação

O AstroGuide é uma aplicação web de astronomia que mostra
dados reais do céu em tempo real, calculados com efemérides
oficiais da NASA, para a localização de Vila Nova de Gaia.
Inclui também um Observatório 3D com suporte WebXR
(compatível com Meta Quest 3, com tracking real da cabeça)
e a Imagem Astronómica do Dia da NASA (APOD).

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
│                            de Gaia), nome, versão, fuso horário
│                            e elevação.
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
│   │                        Registo, entrada e saída, e as
│   │                        rotas do que é pessoal de cada
│   │                        conta (localização, favoritos,
│   │                        observações).
│   │
│   └── admin.py           → Página de administração
│                            Só de leitura, e só para a conta
│                            com o papel de admin: mostra as
│                            contas registadas e o que cada uma
│                            tem guardado. É renderizada no
│                            servidor, para não haver um endpoint
│                            em JSON a devolver os dados de todos.
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
├── _teste_contas.py       → Testes das contas e da localização
│                            139 verificações automáticas
│                            (137 se não houver rede — a parte
│                            da ISS salta 2, e diz que saltou).
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
│   │                        Com animações espaciais,
│   │                        configurações de áudio e os
│   │                        4 cartões de acesso rápido.
│   │
│   ├── index.html         → Interface principal da app
│   │                        Céu Agora, Observatório,
│   │                        Calendário Lunar, NASA - Imagem
│   │                        do Dia, e Observatório VR.
│   │
│   ├── entrar.html        → Página de entrada e registo
│   │                        Os dois formulários na mesma
│   │                        página, alternados por abas.
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
    │   ├── conta.css      → Botão e painel de conta, no menu
    │   │                    e na app.
    │   │
    │   └── admin.css      → Página de administração (tabela
    │                        das contas, totais, cartão de
    │                        acesso negado).
    │
    ├── js/
    │   ├── shared-ui-controls.js → Funções partilhadas
    │   │                    (música, volume, configurações e o
    │   │                    campo de estrelas do fundo).
    │   │
    │   ├── conta.js       → Botão e painel de conta: quem tem
    │   │                    sessão iniciada, guardar a localização
    │   │                    do dispositivo, terminar sessão.
    │   │
    │   ├── auth.js        → Formulários da página de entrada:
    │   │                    alternar as abas, validar e enviar.
    │   │
    │   ├── admin.js       → Página de administração: só o campo
    │   │                    de estrelas do fundo. Os dados já
    │   │                    vêm no HTML, do servidor.
    │   │
    │   ├── menu.js        → Lógica do menu: deteção de
    │   │                    localização e ícones Canvas
    │   │                    desenhados à mão (estrela,
    │   │                    lua crescente, telescópio, jornal).
    │   │
    │   ├── index.js       → Lógica da app: navegação SPA,
    │   │                    dados do céu, calendário lunar,
    │   │                    APOD, e o Observatório interativo
    │   │                    (canvas 360°/2D) com estrelas,
    │   │                    constelações, planetas com imagem
    │   │                    real e auto-refresh a cada 30s.
    │   │
    │   └── vr-observatorio.js → Observatório VR
    │                        Cena 3D em Three.js — reutiliza
    │                        os dados de /api/observatorio
    │                        (zero duplicação da lógica
    │                        astronómica). Estrelas, constelações,
    │                        Sol, Lua e planetas posicionados por
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
    │   │                  Internacional (ISS), desenhada no
    │   │                  Observatório sem o recorte circular
    │   │                  dos planetas — é um objeto largo, e o
    │   │                  círculo cortava-lhe as pontas.
    │   │
    │   └── space.jpg      → Panorâmica da Via Láctea, usada
    │                        como fundo do céu no Observatório
    │                        360° (com efeito parallax).
    │
    ├── audio/
    │   └── musica.mp3     → Música ambiente relaxante
    │
    └── favicon.svg        → Ícone da aplicação (estrela SVG)

---

## ROUTING (ROTAS)

A aplicação usa um sistema de rotas simples:
  /            → Menu de entrada (Landing Page)
  /ceu         → Ecrã Céu Agora
  /calendario  → Ecrã Calendário Lunar
  /observatorio → Ecrã Observatório Astronómico
  /apod        → Ecrã NASA - Imagem do Dia
  /entrar      → Página de entrada e registo
  /admin       → Página de administração (exige o papel de
                 admin — é a única rota com essa exigência)

Todas estas rotas, menos o /admin, estão abertas a quem não tem
conta: quem não tiver sessão iniciada vê tudo, calculado para a
localização de config.py.
  /entrar?seguinte=/observatorio → Volta ao sítio onde estava
                                   depois de entrar (só aceita
                                   caminhos internos, por segurança)
  /entrar?aba=registar           → Abre já na aba de criar conta

O /admin não tem API própria e não aparece no menu: é uma página
só, para o dono da aplicação, e chega-se lá escrevendo o endereço
ou pela ligação que aparece no painel de conta de quem é admin.

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
  /api/favoritos   ✱ → GET lista, POST adiciona, DELETE remove
  /api/observacoes ✱ → GET lista, POST adiciona,
                       DELETE /api/observacoes/id remove

---

## CONTAS DE UTILIZADOR

A conta não tranca nada. O Céu, o Calendário, o Observatório e a
Imagem do Dia continuam abertos a quem não tem conta — são a
montra do projeto e quem abrir a aplicação pela primeira vez
tem de os ver sem barreiras.

O que a conta acrescenta é o que só faz sentido para uma pessoa:

  📍 Localização pessoal
     O observador não é fixo em Vila Nova de Gaia. Cada conta
     pode guardar a sua latitude, longitude, elevação e fuso
     horário, e todos os cálculos passam a ser feitos para lá:
     o céu, o calendário lunar e o observatório. A ISS entra
     aqui também — é o objeto do céu cuja posição mais depende
     do sítio de quem olha, por estar só a 400 km de altitude.
     Há dois caminhos no painel de conta:
       · "usar a localização deste dispositivo" — pede as
         coordenadas ao browser e o fuso ao sistema;
       · "escrever as coordenadas" — para quando o browser não
         ajuda: um sítio de observação onde ainda não se está,
         ou um GPS que recusa. Aí o fuso vem pré-preenchido com
         o do dispositivo, e só é preciso mexer nele se o local
         for noutro fuso horário.

  ⭐ Favoritos
     Estrelas, constelações e objetos de céu profundo, guardados
     por conta. O objeto_id gravado é a chave do catálogo
     ("vega", "Ori"), e não o nome visível — mudar um nome no
     catálogo não deixa os favoritos de ninguém pendurados.

  📔 Registo de observações
     "Vi Saturno em 18/09, anéis bem visíveis." O nome do objeto
     fica copiado no registo, para a observação continuar a fazer
     sentido mesmo que o objeto mude de nome ou saia do catálogo.

O botão de conta não aparece no Observatório nem no VR: nesses
dois modos a página é toda céu e ele ficava a flutuar por cima,
sem nada à volta. Voltar ao menu (botão "◀ Menu") traz o botão
de novo.

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

É uma página só de leitura. Não apaga contas, não muda papéis,
não apaga observações. Quem quiser mexer nos dados usa o
DB Browser for SQLite, que é uma ferramenta feita para isso —
esta página é para olhar, e cliques distraídos aqui não
estragam nada.

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

## LINGUAGENS USADAS

PYTHON (Backend)
  Responsável por todos os cálculos astronómicos e pelo
  servidor. Nunca é visível para o utilizador.
  Ficheiros: server.py, promover_admin.py, _teste_contas.py,
             py/config.py, py/database/ (db.py, auth.py,
             admin.py), py/astronomia/ (sky_engine.py, iss.py,
             apod.py), py/ceu/ (estrelas.py, ceu_profundo.py,
             eventos.py)

HTML (Estrutura)
  Define a estrutura das páginas e as secções da app.
  Ficheiros: templates/menu.html, templates/index.html

CSS (Estilo)
  Design system com glassmorphism e tema escuro.
  Animações de entrada, hover, shimmer e borderGlow.
  Ficheiros: shared-ui-controls.css, glass.css,
             menu.css, index.css

JavaScript (Interatividade)
  Gere o estado da aplicação no browser. Comunica com o
  Python via API (fetch). Desenha o mapa celeste em Canvas
  com projeção 360° e 2D (planisfério), e uma versão 3D real
  em WebGL (Three.js) no Observatório VR.
  Ficheiros: shared-ui-controls.js, menu.js,
             index.js, vr-observatorio.js

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
  para hora local (Europe/Lisbon).
  Incluído no requirements.txt.

requests (pip install requests)
  Biblioteca para pedidos HTTP.
  Usada no py/astronomia/apod.py (Imagem Astronómica do Dia,
  à API pública da NASA) e no py/astronomia/iss.py (elementos
  orbitais da ISS, à Celestrak).

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
  estado da música ao navegar entre páginas. Apaga quando
  o browser é fechado.

DRY (Don't Repeat Yourself)
  Princípio de programação aplicado no projeto:
  glass.css centraliza o design system,
  shared-ui-controls.js evita repetição de lógica de música
  e configurações, e o Observatório VR reutiliza a mesma
  API do Observatório 2D em vez de recalcular posições
  astronómicas.

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
  [x] Calendário lunar com fases calculadas pela NASA
  [x] Eventos astronómicos — chuvas de meteoros e eclipses
      (2026 e 2027, incluindo o eclipse solar de 2/8/2027)
  [x] Detalhe do dia — nascer/pôr do sol, fase da lua
  [x] Validação de datas nas rotas da API (mês/dia inválidos)
  [x] NASA - Imagem do Dia (APOD) com cache diário
  [x] Painel de configurações com controlo de volume
  [x] Música ambiente com persistência entre páginas
  [x] Deteção automática de localização no menu
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
  [x] Fundo panorâmico real da Via Láctea, com parallax
  [x] Clique num astro/estrela/constelação para ver detalhes
  [x] Painel de filtros — constelações, nomes, magnitude
  [x] Painel lateral com scroll independente
  [x] Viagem no Tempo — simular o céu em qualquer data/hora
  [x] Botão "↺ Tempo Real" para voltar ao céu atual
  [x] Auto-refresh desativado automaticamente em simulação
  [x] Conversão automática hora local → UTC (hora de verão)
  [x] Observatório VR — Fase 1: cena 3D com Three.js,
      reutilizando os dados do Observatório 2D, com estrelas
      e constelações reais e navegação por arrasto do rato
  [x] Hora simulada partilhada entre o Observatório 2D e o
      Observatório VR — o VR mostra sempre o mesmo céu, e a
      hora escolhida mantém-se ao voltar do VR ao Observatório
  [x] Observatório VR — Fase 2: sessão WebXR imersiva
      (immersive-vr) com tracking real da cabeça num Meta
      Quest 3, mantendo o arrasto do rato no PC
  [x] Observatório VR — Sol, Lua e planetas na cena 3D
  [x] Papel de administrador, atribuído a partir do terminal
      (py promover_admin.py) e nunca a partir do browser
  [x] Página /admin — só para quem tem esse papel: as contas
      registadas e o que cada uma guardou, numa tabela só de
      leitura, com os totais no topo

---

## ROADMAP — PRÓXIMAS FUNCIONALIDADES

  [x] Contas de utilizador e localização pessoal (feito)
  [ ] Favoritos no Observatório — a API já está feita e a
      funcionar; falta o botão de estrela ao clicar num objeto,
      e a lista dos favoritos no painel lateral
  [ ] Registo de observações na interface — a API já está feita;
      falta o formulário para escrever e a lista do caderno
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