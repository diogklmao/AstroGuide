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

   py -m pip install skyfield flask

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
├── de421.bsp              → Efemérides da NASA
│                            Ficheiro com posições de todos
│                            os planetas.
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
    └── musica.mp3         → Música ambiente relaxante.


------------------------------------------------------------
  ROUTING (ROTAS)
------------------------------------------------------------

A aplicação usa um sistema de rotas simples:
  /            → Menu de entrada (Landing Page)
  /app         → Aplicação principal (Céu Agora)
  /calendario  → Calendário Lunar (visto de Gaia)
  /ceu         → Visão direta do Céu Agora

Nota: /app, /calendario e /ceu servem o mesmo ficheiro (index.html),
mas o JavaScript interno muda o "ecrã" automaticamente.

------------------------------------------------------------
  LINGUAGENS USADAS
------------------------------------------------------------

PYTHON (Backend)
  Responsável por todos os cálculos astronómicos.
  Ficheiros: server.py, sky_engine.py, eventos.py, config.py

HTML (Estrutura)
  Define a estrutura das páginas e as secções da app.
  Ficheiros: menu.html, index.html

CSS (Estilo)
  Estilização moderna e "dark mode". Animações de estrelas,
  cards interativos e layouts responsivos.

JavaScript (Interatividade)
  Gere o estado da aplicação no browser. Desenha órbitas
  e constelações no menu usando HTML5 Canvas.

------------------------------------------------------------
  BIBLIOTECAS PYTHON USADAS
------------------------------------------------------------

skyfield (pip install skyfield)
  Biblioteca científica de astronomia.
  Usa as efemérides DE421 da NASA para cálculos.

flask (pip install flask)
  Micro-framework web para Python.
  Cria o servidor que serve as páginas e a API (JSON).

------------------------------------------------------------
  CONCEITOS-CHAVE
------------------------------------------------------------

Efemérides (de421.bsp)
  Posições matemáticas precisas dos planetas no tempo.

API JSON
  Comunicação entre Front-end (JS) e Back-end (Python).

Altitude / Azimute
  Coordenadas horizontais para localizar astros no céu.

------------------------------------------------------------
  FUNCIONALIDADES IMPLEMENTADAS
------------------------------------------------------------

  [x] Landing Page Interativa com menu dinâmico
  [x] Animações Canvas (Sistema Solar, Fases da Lua)
  [x] Dados em tempo real — Sol, Lua e 7 planetas
  [x] Altitude, azimute e distância de cada astro
  [x] Visibilidade (acima/abaixo do horizonte)
  [x] Fase da Lua em tempo real com emoji
  [x] Calendário lunar com fases e eventos (Nasa/Skyfield)
  [x] Painel de configurações (Volume, Música ambiente)
  [x] Geoview: Deteta cidade automaticamente na landing page
  [x] Design Responsivo e interface "Glassmorphism"

------------------------------------------------------------
  ROADMAP — PRÓXIMAS FUNCIONALIDADES
------------------------------------------------------------

  [x] Menu de entrada dinâmico (Concluído)
  [ ] Observatório — Mapa do céu com estrelas reais
  [ ] Constelações interativas clicáveis
  [ ] Hosting online (Publicação Web)
  [ ] Automatização de telescópio com Arduino

------------------------------------------------------------

  Desenvolvido por: Diogo Vedor Peres Pinho
  Escola: Escola Profissional de Gaia
  Curso: Programador de Informática

============================================================
