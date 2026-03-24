============================================================
  ASTROGUIDE — Documentação do Projeto
  PAP 12.º Ano | Curso de Programação
============================================================

O AstroGuide é uma aplicação web de astronomia que mostra
dados reais do céu em tempo real, calculados com efemérides
oficiais da NASA, para a localização de Vila Nova de Gaia.

------------------------------------------------------------
  COMO CORRER A APLICAÇÃO
------------------------------------------------------------

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

------------------------------------------------------------
  ESTRUTURA DE FICHEIROS
------------------------------------------------------------

astroguide/
│
├── server.py              → Ponto de entrada da app web
│                            Cria o servidor Flask e define
│                            as rotas da API e das páginas.
│
├── sky_engine.py          → Motor de cálculo astronómico
│                            Usa as efemérides da NASA para
│                            calcular posições de astros.
│
├── eventos.py             → Base de dados de eventos
│                            Chuvas de meteoros e eclipses.
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
│   │                        Com animações espaciais e
│   │                        configurações de áudio.
│   │
│   └── index.html         → Interface principal da app
│                            Céu Agora e Calendário Lunar.
│
└── static/
    ├── css/
    │   ├── menu.css       → Estilos do menu de entrada
    │   └── index.css      → Estilos da app principal
    │
    ├── js/
    │   ├── menu.js        → Lógica do menu (animações Canvas)
    │   ├── index.js       → Lógica da app (céu, calendário)
    │   └── shared-ui-controls.js → Funções partilhadas
    │                               (música, volume, config)
    │
    └── audio/
        └── musica.mp3     → Música ambiente relaxante


------------------------------------------------------------
  ROUTING (ROTAS)
------------------------------------------------------------

A aplicação usa um sistema de rotas simples:
  /            → Menu de entrada (Landing Page)
  /ceu         → Ecrã Céu Agora
  /calendario  → Ecrã Calendário Lunar

Rotas da API (devolvem JSON para o JavaScript):
  /api/ceu                    → Sol, Lua e 7 planetas em tempo real
  /api/calendario/ano/mes     → Fases da lua e eventos do mês
  /api/dia/ano/mes/dia        → Detalhes de um dia específico

------------------------------------------------------------
  LINGUAGENS USADAS
------------------------------------------------------------

PYTHON (Backend)
  Responsável por todos os cálculos astronómicos e pelo
  servidor. Nunca é visível para o utilizador.
  Ficheiros: server.py, sky_engine.py, eventos.py, config.py

HTML (Estrutura)
  Define a estrutura das páginas e as secções da app.
  Ficheiros: templates/menu.html, templates/index.html

CSS (Estilo)
  Estilização moderna com tema escuro. Animações de estrelas,
  cards interativos, layouts responsivos e efeitos de brilho.
  Ficheiros: static/css/menu.css, static/css/index.css

JavaScript (Interatividade)
  Gere o estado da aplicação no browser. Comunica com o
  Python via API (fetch). Desenha órbitas planetárias e
  constelações usando HTML5 Canvas.
  Ficheiros: static/js/menu.js, static/js/index.js,
             static/js/shared-ui-controls.js

------------------------------------------------------------
  BIBLIOTECAS PYTHON USADAS
------------------------------------------------------------

skyfield (pip install skyfield)
  Biblioteca científica de astronomia.
  Usa as efemérides DE421 da NASA para calcular com
  precisão a posição de qualquer astro em qualquer
  momento e lugar da Terra.

flask (pip install flask)
  Micro-framework web para Python.
  Cria o servidor que serve as páginas e a API JSON.

tzdata (pip install tzdata)
  Base de dados de fusos horários.
  Necessário no Windows para converter horas UTC
  para hora local (Europe/Lisbon).
  Incluído no requirements.txt.

------------------------------------------------------------
  CONCEITOS-CHAVE
------------------------------------------------------------

Efemérides (de421.bsp)
  Tabela matemática com as posições de todos os planetas
  ao longo do tempo. Calculada pela NASA com altíssima
  precisão. O Skyfield usa este ficheiro para saber onde
  está cada planeta em cada momento.

API (Application Programming Interface)
  Canal de comunicação entre o JavaScript (browser) e o
  Python (servidor). O JavaScript faz fetch("/api/ceu")
  e recebe os dados em formato JSON.

JSON (JavaScript Object Notation)
  Formato de troca de dados entre Python e JavaScript.
  Ex: {"altitude": 36.5, "azimute": 202.1, "visivel": true}

Altitude
  Ângulo em graus acima do horizonte.
  0° = horizonte | 90° = zenith | Negativo = não visível

Azimute
  Direção horizontal em graus a partir do Norte.
  0° = Norte | 90° = Este | 180° = Sul | 270° = Oeste

UA (Unidade Astronómica)
  Distância média da Terra ao Sol = 149.597.870 km

sessionStorage
  Memória temporária do browser usada para manter a
  música ativa ao navegar entre páginas. Apaga quando
  o browser é fechado.

DRY (Don't Repeat Yourself)
  Princípio de programação aplicado no projeto —
  funções partilhadas entre páginas estão em
  shared-ui-controls.js em vez de repetidas em cada ficheiro.

------------------------------------------------------------
  FUNCIONALIDADES IMPLEMENTADAS
------------------------------------------------------------

  [x] Landing Page interativa com menu dinâmico
  [x] Animações Canvas — Sistema Solar em órbita
  [x] Animações Canvas — Lua com crateras e fase dinâmica
  [x] Animações Canvas — Constelação de Orion com brilho
  [x] Dados em tempo real — Sol, Lua e 7 planetas
  [x] Altitude, azimute e distância de cada astro
  [x] Visibilidade (acima/abaixo do horizonte)
  [x] Fase da Lua em tempo real com emoji
  [x] Calendário lunar com fases calculadas pela NASA
  [x] Eventos astronómicos — chuvas de meteoros e eclipses
  [x] Detalhe do dia — nascer/pôr do sol, fase da lua
  [x] Painel de configurações com controlo de volume
  [x] Música ambiente com persistência entre páginas
  [x] Deteção automática de localização no menu
  [x] Atualização automática dos dados a cada 30 segundos
  [x] Relógio em tempo real
  [x] Botão ◀ Menu em todas as páginas
  [x] Separação de responsabilidades HTML / CSS / JS
  [x] Código partilhado em shared-ui-controls.js (DRY)
  [x] Repositório no GitHub com historial de commits

------------------------------------------------------------
  ROADMAP — PRÓXIMAS FUNCIONALIDADES
------------------------------------------------------------

  [ ] Observatório — Mapa do céu interativo com estrelas reais
  [ ] Catálogo de estrelas (Hipparcos — 117k estrelas)
  [ ] Constelações clicáveis com informação de cada estrela
  [ ] Hosting online no Railway com URL público
  [ ] Versão mobile (React Native ou Capacitor)
  [ ] Ligação a telescópio via Arduino (Fase 2)

------------------------------------------------------------
  FERRAMENTAS USADAS NO DESENVOLVIMENTO
------------------------------------------------------------

  Claude (claude.ai)       → Assistente de aprendizagem e desenvolvimento
  Cursor                   → Editor de código com IA integrada
  GitHub                   → Controlo de versões e repositório
  Brave                    → Browser de desenvolvimento
  Postman                  → Teste das rotas da API
  Notion                   → Organização e notas do projeto

------------------------------------------------------------

  Desenvolvido por: Diogo Vedor Peres Pinho
  Escola: Escola Profissional de Gaia
  Curso: Programador de Informática
  Ano: 2025/2026

============================================================