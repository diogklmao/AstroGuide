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

------------------------------------------------------------
  ESTRUTURA DE FICHEIROS
------------------------------------------------------------

astroguide/
│
├── server.py              → Ponto de entrada da app web
│                            Cria o servidor Flask e define
│                            as rotas da API
│
├── sky_engine.py          → Motor de cálculo astronómico
│                            Usa as efemérides da NASA para
│                            calcular posições de astros
│
├── eventos.py             → Base de dados de eventos
│                            Chuvas de meteoros e eclipses
│
├── config.py              → Configurações globais
│                            Localização, nome, versão
│
├── de421.bsp              → Efemérides da NASA
│                            Ficheiro com posições de todos
│                            os planetas (descarregado uma
│                            única vez pelo Skyfield)
│
├── templates/
│   └── index.html         → Interface visual da app
│                            HTML + CSS + JavaScript
│                            Toda a parte visual está aqui
│
└── static/
    └── musica.mp3         → Música ambiente opcional


------------------------------------------------------------
  LINGUAGENS USADAS
------------------------------------------------------------

PYTHON (Backend)
  O Python corre no servidor e é responsável por todos os
  cálculos astronómicos. Não é visível para o utilizador.
  Ficheiros: server.py, sky_engine.py, eventos.py, config.py

HTML (Estrutura)
  Define a estrutura da página — títulos, botões, secções,
  calendário. É o "esqueleto" da interface.
  Ficheiro: templates/index.html

CSS (Estilo)
  Define o aspeto visual — cores, fontes, animações,
  tamanhos, espaçamentos. Está dentro do index.html
  na secção <style>.

JavaScript (Interatividade)
  Corre no browser do utilizador. Comunica com o servidor
  Python via pedidos HTTP (fetch), constrói o calendário,
  atualiza os dados a cada 30 segundos, anima as estrelas
  de fundo. Está dentro do index.html na secção <script>.

------------------------------------------------------------
  BIBLIOTECAS PYTHON USADAS
------------------------------------------------------------

skyfield (pip install skyfield)
  Biblioteca científica de astronomia.
  Usa as efemérides DE421 da NASA para calcular com
  precisão a posição de qualquer astro em qualquer
  momento e qualquer lugar da Terra.
  Usada em: sky_engine.py

flask (pip install flask)
  Micro-framework web para Python.
  Cria o servidor HTTP local que serve o HTML ao browser
  e responde a pedidos de dados em formato JSON.
  Usada em: server.py

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
  Python (servidor). O JavaScript faz um pedido a um URL
  como /api/ceu e recebe os dados em formato JSON.
  Ex: fetch("/api/ceu") → {"sol": {...}, "lua": {...}}

JSON (JavaScript Object Notation)
  Formato de troca de dados entre o Python e o JavaScript.
  É basicamente um dicionário Python em formato texto.
  Ex: {"altitude": 36.5, "azimute": 202.1, "visivel": true}

Altitude
  Ângulo em graus acima do horizonte.
  0° = horizonte | 90° = zenith (diretamente acima)
  Negativo = abaixo do horizonte (não visível)

Azimute
  Direção horizontal em graus a partir do Norte.
  0° = Norte | 90° = Este | 180° = Sul | 270° = Oeste

UA (Unidade Astronómica)
  Distância média da Terra ao Sol = 149.597.870 km
  Usada para medir distâncias no sistema solar.

------------------------------------------------------------
  FUNCIONALIDADES IMPLEMENTADAS
------------------------------------------------------------

  [x] Dados em tempo real — Sol, Lua e 7 planetas
  [x] Altitude, azimute e distância de cada astro
  [x] Visibilidade (acima/abaixo do horizonte)
  [x] Fase da Lua em tempo real com emoji
  [x] Calendário lunar com fases calculadas pela NASA
  [x] Eventos astronómicos — chuvas de meteoros e eclipses
  [x] Detalhe do dia — nascer/pôr do sol, fase da lua
  [x] Atualização automática a cada 30 segundos
  [x] Relógio em tempo real
  [x] Estrelas animadas no fundo
  [x] Música ambiente opcional
  [x] Design responsivo (funciona em PC e telemóvel)

------------------------------------------------------------
  ROADMAP — PRÓXIMAS FUNCIONALIDADES
------------------------------------------------------------

  [ ] Menu de entrada com 3 botões (Observatório, Calendário, Céu Agora)
  [ ] Observatório interativo — mapa do céu clicável
  [ ] Constelações com estrelas individuais e características
  [ ] Hosting online (Railway/Render) com URL público
  [ ] Ligação Arduino para telescópio automatizado (Fase 2)

------------------------------------------------------------

  Desenvolvido por: Diogo Vedor Peres Pinho
  Escola: Escola Profissional de Gaia
  Curso: Programador de Informática

============================================================
