# ============================================================

  ASTROGUIDE — Documentação do Projeto
  PAP 12.º Ano | Curso de Programação

O AstroGuide é uma aplicação web de astronomia que mostra
dados reais do céu em tempo real, calculados com efemérides
oficiais da NASA, para a localização de Vila Nova de Gaia.
Inclui também um Observatório 3D em desenvolvimento (WebXR,
compatível com Meta Quest 3) e a Imagem Astronómica do Dia
da NASA (APOD).

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

---

## ESTRUTURA DE FICHEIROS

astroguide/
│
├── server.py              → Ponto de entrada da app web
│                            Cria o servidor Flask e define
│                            as rotas da API e das páginas.
│
├── sky_engine.py          → Motor de cálculo astronómico
│                            Usa as efemérides da NASA para
│                            calcular posições de astros em
│                            qualquer momento (passado/futuro).
│
├── eventos.py             → Base de dados de eventos
│                            Chuvas de meteoros e eclipses
│                            (inclui eclipses de 2026 e 2027).
│
├── estrelas.py            → Base de dados de estrelas e
│                            constelações para o Observatório.
│                            Nomes das constelações em Latim
│                            (nomenclatura oficial da IAU).
│
├── apod.py                → Imagem Astronómica do Dia (NASA)
│                            Vai buscar a APOD à API pública
│                            da NASA, com cache diário em
│                            memória para poupar pedidos.
│
├── config.py              → Configurações globais
│                            Localização, nome, versão,
│                            fuso horário e elevação.
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
│   └── index.html         → Interface principal da app
│                            Céu Agora, Observatório,
│                            Calendário Lunar, NASA - Imagem
│                            do Dia, e Observatório VR.
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
    │   └── index.css      → Estilos da app principal
    │                        (céu agora, calendário, dados,
    │                        observatório, APOD e VR).
    │
    ├── js/
    │   ├── shared-ui-controls.js → Funções partilhadas
    │   │                    (música, volume, configurações).
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
    │   │                    real, silhueta de montanhas e
    │   │                    auto-refresh a cada 30s.
    │   │
    │   └── vr-observatorio.js → Observatório VR (Fase 1)
    │                        Cena 3D em Three.js — reutiliza
    │                        os dados de /api/observatorio
    │                        (zero duplicação da lógica
    │                        astronómica). Estrelas e linhas
    │                        de constelações posicionadas por
    │                        altitude/azimute reais à volta
    │                        do observador. Navegação por
    │                        arrasto do rato (WebXR/Quest 3
    │                        ainda por implementar — Fase 2).
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

---

## LINGUAGENS USADAS

PYTHON (Backend)
  Responsável por todos os cálculos astronómicos e pelo
  servidor. Nunca é visível para o utilizador.
  Ficheiros: server.py, sky_engine.py, eventos.py, config.py,
             estrelas.py, apod.py

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
  Usada em apod.py para ir buscar a Imagem Astronómica do
  Dia à API pública da NASA (api.nasa.gov).

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
  Via Láctea, silhueta de montanhas gerada por código, e
  planetas com imagem real) e Planisfério (vista zenital 2D
  clássica). Permite clicar em astros, estrelas e
  constelações para ver detalhes, curiosidades e imagens.

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
  Isto é o que permite, na Fase 2, ligar o WebXR e usar o
  tracking real da cabeça de um headset como o Meta Quest 3.

Coordenadas Horizontais (Altitude/Azimute)
  Sistema de coordenadas usado em todo o projeto — 2D, 360°
  e VR — porque é relativo ao observador (ao contrário de
  RA/Dec, que são coordenadas absolutas do céu). Permite
  reutilizar exatamente os mesmos dados da API em três
  motores de renderização diferentes sem duplicar cálculos.

Geração Procedural
  Conteúdo criado por código/matemática em vez de imagens
  ou ficheiros externos. Usado na silhueta de montanhas do
  Observatório (soma de ondas sinusoidais) — garante um
  perfil sempre consistente à volta dos 360°, sem precisar
  de nenhum ficheiro de imagem novo.

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
  [x] Silhueta de montanhas no horizonte (gerada por código)
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

---

## ROADMAP — PRÓXIMAS FUNCIONALIDADES

  [ ] Observatório VR — Fase 2: suporte WebXR para Meta
      Quest 3 (tracking real da cabeça, em vez de arrasto
      do rato)
  [ ] Observatório VR — Sol, Lua e planetas na cena 3D
      (atualmente só tem estrelas e constelações)
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