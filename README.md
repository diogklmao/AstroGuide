<div align="center">

<img src="static/images/space.jpg" alt="A Via Láctea ao fundo do Observatório" width="100%">

<br>

# 🌌 AstroGuide

### O céu inteiro, num browser.

Aplicação web de astronomia que calcula o céu **a sério** — com as efemérides
oficiais da NASA (DE421) — para a terra que cada pessoa escolher.
Sem telescópio, sem instalações, sem chaves de API para quem a usa.

<br>

[![Python](https://img.shields.io/badge/Python-3-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.1-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Skyfield](https://img.shields.io/badge/Skyfield-1.48-1F3A5F?style=flat-square)](https://rhodesmill.org/skyfield/)
[![Three.js](https://img.shields.io/badge/Three.js-r160-000000?style=flat-square&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![WebXR](https://img.shields.io/badge/WebXR-immersive--vr-6E4AFF?style=flat-square)](https://immersiveweb.dev/)
[![PAP](https://img.shields.io/badge/PAP-2025%2F2026-FFCC02?style=flat-square)](#-autor)

**[Começar](#-como-correr-a-aplicação)** ·
**[Funcionalidades](#-funcionalidades)** ·
**[Como funciona](#-como-funciona)** ·
**[AstroGuide AI](#-astroguide-ai)** ·
**[Rotas](#-rotas)** ·
**[Roadmap](#-roadmap)**

</div>

---

## ✨ O que torna isto diferente

| | |
|---|---|
| 🔭 **Números a sério** | As posições do Sol, da Lua e dos planetas saem das efemérides **DE421 da NASA**, lidas pelo Skyfield. Não há tabelas aproximadas nem valores escritos à mão: qualquer data, passada ou futura, é calculada. |
| 🌍 **O céu da tua terra** | Por omissão é o céu de **Vila Nova de Gaia**. Quem tem conta escreve "Lisboa", "Madrid" ou "Sydney" e o céu, o calendário e o observatório passam a ser calculados para lá — coordenadas, elevação e fuso horário incluídos. |
| 🥽 **Observatório a sério** | Um mapa celeste em Canvas com projeção 3D, **e** uma cena WebGL real em Three.js que entra em modo imersivo (`immersive-vr`) com tracking da cabeça num **Meta Quest 3**. Os dois mostram o mesmo céu, porque os dois leem a mesma API. |
| 🤖 **Uma IA que não inventa** | A AstroGuide AI explica conceitos e orienta dentro da aplicação — mas os números vêm sempre das ferramentas, que os vão buscar ao motor. Está escrito nas instruções dela: **nunca inventar posições, altitudes, horas nem fases.** Uma aplicação de astronomia que dá números errados com ar de certos é pior do que uma que não dá número nenhum. |
| ✨ **Tudo feito de raiz** | Sem framework de front-end, sem biblioteca de componentes. HTML, CSS e JavaScript à mão: os ícones do menu são desenhados em Canvas por código, o campo de estrelas é CSS, e o design system inteiro cabe num ficheiro de variáveis. |

---

## 🚀 Como correr a aplicação

```bash
# 1. Instalar as dependências (só é preciso fazer uma vez)
py -m pip install -r requirements.txt

# 2. Correr o servidor
py server.py
```

O browser abre sozinho em **http://localhost:5000**. Para parar, `Ctrl+C`.

**Não é preciso criar a base de dados à mão.** Na primeira execução o servidor
cria o `astroguide.db` e as tabelas todas, na raiz do projeto — e a partir daí
as contas ficam lá guardadas entre execuções. As dependências são as mesmas de
sempre: o SQLite vem dentro do Python e o resto já vinha com o Flask.

> **A AstroGuide AI é a única funcionalidade que precisa de mais alguma coisa:**
> uma chave da API Groq. Sem ela, tudo o resto funciona como sempre e é só o
> painel da IA que fica a dizer que não está configurada.
> [Ver como configurar ↓](#-como-configurar)

<details>
<summary><b>📦 O que acontece na primeira execução</b></summary>

<br>

- Cria o `astroguide.db` e as tabelas todas, na raiz do projeto;
- Gera o `.secret_key`, que é a chave com que o Flask assina o cookie de sessão
  (fica no `.gitignore`);
- Descarrega o `de421.bsp` (17 MB), o ficheiro de efemérides da NASA — depois
  fica em disco e nunca mais sai à rede.

Nenhum destes ficheiros vai para o Git, e nenhum deles é preciso trazer de fora.

</details>

<details>
<summary><b>⬆️ Atualizar o repositório</b></summary>

<br>

```bash
git add .
git commit -m "descrição do que foi feito"
git push
```

</details>

---

## 🌟 Funcionalidades

### 🌌 Céu Agora
- Sol, Lua e os **sete planetas** em tempo real
- Altitude, azimute e distância de cada astro
- Visibilidade — acima ou abaixo do horizonte
- Fase da Lua calculada, com emoji
- Relógio a correr, no fuso da localização escolhida

### 📅 Calendário Cósmico
- Fases da Lua para cada dia do mês
- Chuvas de meteoros e eclipses
- **Eclipses até 2028**, incluindo o eclipse solar de 2/8/2027
- Clicar num dia abre o detalhe: nascer e pôr do Sol, fase, eventos
- Validação de datas nas rotas (mês e dia inválidos dão erro)

### 📰 NASA — Imagem do Dia
- A **APOD** oficial, com cache diário
- Imagem **ou vídeo**, os dois no mesmo sítio
- Nos dias de vídeo, um **botão de play sobre a miniatura** que o traz para
  dentro da página — YouTube, Vimeo ou ficheiro, cada um no seu player
- Link para a alta resolução, quando existe

### 🔭 Observatório
- **Vista 360°** com câmara virtual (arrastar + zoom)
- **Planisfério** — a vista zenital 2D clássica
- Estrelas reais com magnitude e posição calculada
- Constelações com linhas e nomes (nomenclatura oficial da IAU)
- Curiosidades e ilustrações por constelação
- Sol, Lua e planetas desenhados com **imagens reais**
- Fundo panorâmico da Via Láctea com parallax
- **Pesquisa** por nome, com resultados enquanto se escreve
- **Tour guiado**, painel de filtros e controlos
- A **ISS** desenhada na órbita real, com botão 🛰 para a localizar
- ⤓ **Céu sob os pés** — desce a câmara até ao polo escondido num clique
- ★ **Favoritos** por conta

### 🥽 Observatório VR
- Cena 3D real em WebGL (Three.js)
- Sessão **WebXR imersiva** com tracking da cabeça (Meta Quest 3)
- Arrasto do rato no PC, para quem não tem headset
- Hora simulada **partilhada com o 2D** — os dois mostram sempre o mesmo céu

### 👤 Conta
- Localização de observação, escolhida **pelo nome**
- Favoritos e caderno de observações
- Tudo reunido na página **/perfil**

### 🤖 AstroGuide AI
- Painel de conversa, em todas as páginas
- **Function Calling**: vai buscar os números ao motor da aplicação
- A chave nunca sai do servidor

### E ainda

- 🎨 **Design system glassmorphism** (`glass.css`) — painéis translúcidos,
  animações shimmer e borderGlow
- ✨ **Campo de estrelas animado** em CSS, no menu e na aplicação
- 🖌️ **Ícones desenhados à mão em Canvas** — não ocupam espaço no repositório
  e mantêm a nitidez em qualquer resolução
- 🕐 **Viagem no Tempo** — simular o céu em qualquer data e hora, com botão
  "↺ Tempo Real" para voltar
- 🎵 **Música ambiente** no Observatório e no VR, com volume e persistência
  entre páginas
- 🔄 **Atualização automática** dos dados a cada 30 segundos (desligada em
  simulação)
- 🧭 **Navegação SPA** — todos os ecrãs sempre acessíveis, sem recarregar
- 🌍 **Conversão automática hora local → UTC**, segundo o fuso da localização
  escolhida: quem observa de Sydney vê o céu de Sydney, e não o do computador
- 🛠️ **Código partilhado (DRY)** em ficheiros `shared`

---

## 🧭 Rotas

### Páginas

| Rota | O que é |
|:--|:--|
| `/` | Menu de entrada (*landing page*) |
| `/app` | Aplicação principal, a abrir no Céu Agora |
| `/ceu` | Ecrã Céu Agora |
| `/calendario` | Ecrã Calendário Cósmico |
| `/observatorio` | Ecrã Observatório Astronómico |
| `/apod` | Ecrã NASA — Imagem do Dia |
| `/entrar` | Página de entrada e registo |
| `/perfil` | 🔒 Página do perfil |
| `/admin` | 🔒 Página de administração |

O `/app` e as quatro rotas dos ecrãs servem **todas o mesmo `index.html`**: é o
JavaScript que decide o ecrã que aparece, pela SPA. O Observatório VR não tem
rota própria — abre-se a partir de um botão dentro do Observatório, na mesma SPA.

Todas estas rotas, **menos o `/perfil` e o `/admin`, estão abertas a quem não
tem conta**: quem não tiver sessão iniciada vê tudo, calculado para a
localização de `config.py`. O `/perfil` sem sessão manda entrar e traz a pessoa
de volta a ele depois disso.

| Parâmetro | Efeito |
|:--|:--|
| `/entrar?seguinte=/observatorio` | Volta ao sítio onde estava depois de entrar — só aceita caminhos internos, por segurança |
| `/entrar?aba=registar` | Abre já na aba de criar conta |

Sem `seguinte`, entrar leva ao `/perfil`.

O `/admin` não tem API própria e **não aparece no menu**: é uma página só, para
o dono da aplicação, e chega-se lá escrevendo o endereço ou pela ligação que
aparece no perfil de quem tem o papel.

### API

Devolvem JSON para o JavaScript. 🔒 = precisa de sessão iniciada.

| Rota | O que devolve |
|:--|:--|
| `/api/ceu` | Sol, Lua e 7 planetas em tempo real |
| `/api/calendario/<ano>/<mes>` | Fases da Lua e eventos do mês *(valida o mês entre 1 e 12)* |
| `/api/dia/<ano>/<mes>/<dia>` | Detalhes de um dia específico *(valida a data completa)* |
| `/api/observatorio` | Estrelas, constelações e astros, em tempo real |
| `/api/observatorio?data=&hora=` | O mesmo, para uma data/hora específica |
| `/api/apod` | Imagem Astronómica do Dia — título, explicação e imagem **ou vídeo** |

### API de conta

| Rota | O que faz |
|:--|:--|
| `/api/me` | Quem tem sessão iniciada e a localização associada. Devolve `utilizador: null` se ninguém tiver entrado — **não é um erro** |
| `/api/registar` | Criar conta (nome, email, password) |
| `/api/entrar` | Iniciar sessão — aceita o **nome ou o email** |
| `/api/sair` | Terminar sessão |
| 🔒 `/api/localizacao` | `PUT` guarda a localização pessoal · `DELETE` volta à de `config.py` |
| 🔒 `/api/localidades` | `?q=lisboa` devolve as terras com esse nome, com coordenadas e fuso já resolvidos. É o que alimenta o seletor de cidades — ninguém escreve coordenadas à mão. Sem `&fonte=rede` responde a lista local; com ele, responde o serviço de geocoding |
| 🔒 `/api/localidades/reversa` | O caminho contrário: `POST` com latitude e longitude, devolve o **nome** da terra. É o que permite ao botão *"usar a localização deste dispositivo"* saber o nome do sítio, e não só os números. `503` se não se conseguir saber — **nunca um nome inventado** |
| 🔒 `/api/favoritos` | `GET` lista · `POST` adiciona · `DELETE` remove |
| 🔒 `/api/observacoes` | `GET` lista · `POST` adiciona · `DELETE /api/observacoes/<id>` remove |

### API da AstroGuide AI

Precisam de sessão iniciada, e **não têm chave nenhuma lá dentro**: é o
servidor que fala com o serviço de IA.

| Rota | O que devolve |
|:--|:--|
| `/api/ia/estado` | `{"disponivel": true/false, "motivo": null \| "sem_conta" \| "sem_chave" \| "sem_dependencia", "modelo": "..."}` — se a IA está pronta a usar, e o que falta quando não está. Nunca devolve a chave, nem um pedaço dela |
| `/api/ia/chat` | `POST {"mensagem", "historico", "ecra"}` → `{"ok", "resposta", "modelo"}` |

O `ecra` é uma **lista branca**: só o que estiver no `ECRAS` do `ai_engine.py`
passa para as instruções do modelo, o resto é deitado fora. As falhas vêm com o
estado HTTP da família (401 sem conta, 400 pedido inválido ou recusado, 429
limite, 503 sem chave, 502 serviço em baixo, 504 sem rede ou sem tempo) e com
uma frase **já em português** no campo `erro`.

---

## 🏗️ Estrutura do projeto

```text
AstroGuide/
│
├── server.py                  → Ponto de entrada. Cria o servidor Flask e
│                                define as rotas da API e das páginas.
│
├── promover_admin.py          → Dá (ou tira) o papel de admin, a partir do
│                                terminal. É de propósito o único caminho.
│
├── _teste_contas.py           → Testes automáticos das contas, do perfil e da
│                                localização — 224 verificações (216 se não
│                                houver rede: a segunda fonte de cidades salta
│                                4, a localização do dispositivo salta 2 e a
│                                ISS salta 2, e dizem que saltaram).
│                                Não arranca servidor nem abre browser.
│                                py _teste_contas.py
│
├── requirements.txt           → Dependências Python
├── .env.example               → Modelo das variáveis de ambiente (sem valores)
├── astroguide.db              → Base de dados (criada na 1ª execução) · fora do Git
├── de421.bsp                  → Efemérides da NASA, 17 MB (descarregado na 1ª
│                                execução) · fora do Git
│
├── py/                        → Todo o código que é importado
│   │
│   ├── config.py              → Localização por omissão: Vila Nova de Gaia,
│   │                            com cidade, país, coordenadas, elevação e fuso.
│   │                            É a que se usa enquanto ninguém escolheu a sua.
│   │
│   ├── database/              → A base de dados e as contas
│   │   ├── db.py              → SQLite: contas, localização pessoal, favoritos
│   │   │                        e registo de observações. Cria as tabelas na
│   │   │                        1ª execução.
│   │   ├── auth.py            → Registo, entrada e saída, as rotas do que é
│   │   │                        pessoal de cada conta e a página /perfil.
│   │   └── admin.py           → Página de administração, só de leitura e só
│   │                            para a conta com o papel de admin. Renderizada
│   │                            no servidor, para não haver um endpoint em JSON
│   │                            a devolver os dados de todos.
│   │
│   ├── localizacao/           → Escolher uma localização PELO NOME
│   │   ├── cidades.py         → Lista local de 162 cidades, com coordenadas,
│   │   │                        elevação e fuso. A procura ignora acentos e
│   │   │                        pontuação e conhece os nomes portugueses
│   │   │                        ("Londres" e "London" dão a mesma terra).
│   │   ├── geocoding.py       → Open-Meteo para procurar pelo nome e
│   │   │                        BigDataCloud para o caminho contrário. Sem
│   │   │                        chave de API, com cache em memória de 10 min.
│   │   └── __init__.py        → A porta de entrada do módulo:
│   │                            procurar_na_lista(), procurar_mais() e reverter().
│   │
│   ├── astronomia/            → Cálculo e rede
│   │   ├── sky_engine.py      → Motor de cálculo astronómico. Usa as
│   │   │                        efemérides da NASA para calcular posições de
│   │   │                        astros em qualquer momento (passado/futuro).
│   │   ├── iss.py             → Elementos orbitais (TLE) da Celestrak, e onde
│   │   │                        a ISS está no céu de quem está a ver.
│   │   └── apod.py            → Imagem Astronómica do Dia, com cache diário.
│   │
│   ├── ceu/                   → Catálogos do céu — ficheiros de DADOS, sem
│   │   │                        uma linha de cálculo. Quem lhes dá posição no
│   │   │                        céu é o sky_engine.py.
│   │   ├── estrelas.py        → 74 estrelas e as 14 constelações, com as
│   │   │                        linhas que as ligam. Nomes em Latim
│   │   │                        (nomenclatura oficial da IAU).
│   │   ├── ceu_profundo.py    → 36 objetos de Messier visíveis de Gaia:
│   │   │                        galáxias, nebulosas, enxames e estrelas duplas.
│   │   │                        Ficaram de fora os que precisam de telescópio.
│   │   └── eventos.py         → Chuvas de meteoros e eclipses (2026 a 2028).
│   │
│   └── ia/                    → A AstroGuide AI — o único sítio do projeto que
│       │                        fala com um serviço externo de IA. E é o
│       │                        servidor que fala com ele, nunca o browser:
│       │                        a chave não sai daqui.
│       ├── ai_engine.py       → Monta o pedido e fala com a API. Não faz
│       │                        cálculos astronómicos — é a regra escrita nas
│       │                        suas instruções, para a IA não inventar
│       │                        posições que a aplicação sabe calcular.
│       ├── rotas.py           → /api/ia/estado e /api/ia/chat, num Blueprint
│       │                        próprio, como as contas e o /admin.
│       └── ferramentas.py     → As quatro ferramentas que a IA chama sozinha:
│                                get_sky_now, get_object_position,
│                                get_moon_phase e get_next_events.
│
├── templates/
│   ├── menu.html              → Menu de entrada, com animações espaciais e os
│   │                            4 cartões. Sem música: ela é do Observatório.
│   ├── index.html             → Interface principal — Céu Agora, Observatório,
│   │                            Calendário Cósmico, NASA e Observatório VR.
│   ├── entrar.html            → Entrada e registo, os dois formulários na mesma
│   │                            página, alternados por abas.
│   ├── perfil.html            → O meu perfil. Chega pronta do servidor — a
│   │                            página não se abre sem sessão iniciada.
│   └── admin.html             → A tabela das contas. O HTML chega pronto do
│                                servidor; o JavaScript só trata do campo de
│                                estrelas.
│
└── static/
    ├── css/
    │   ├── shared-ui-controls.css → Reset global e estilos partilhados
    │   ├── glass.css              → Design system de glassmorphism: variáveis
    │   │                            CSS, painéis glass, shimmer, borderGlow
    │   ├── menu.css               → Menu (foto de fundo, cards, título)
    │   ├── index.css              → Aplicação principal
    │   ├── auth.css               → Entrada e registo
    │   ├── conta.css              → O botão de conta do canto
    │   ├── perfil.css             → Página do perfil
    │   ├── admin.css              → Página de administração
    │   └── ia.css                 → O botão e o painel da AstroGuide AI
    │
    ├── js/
    │   ├── shared-ui-controls.js  → Funções partilhadas: o campo de estrelas
    │   │                            do fundo e a música (só toca no
    │   │                            Observatório e no VR)
    │   ├── conta.js               → O botão de conta do canto
    │   ├── auth.js                → Formulários da página de entrada
    │   ├── perfil.js              → Seletor de cidades, guardar a localização,
    │   │                            favoritos, observações e terminar sessão
    │   ├── admin.js               → Só o campo de estrelas do fundo
    │   ├── menu.js                → Lógica do menu e os ícones Canvas
    │   ├── index.js               → Navegação SPA, dados do céu, calendário,
    │   │                            APOD e o Observatório interativo
    │   ├── ia.js                  → O painel da AstroGuide AI
    │   └── vr-observatorio.js     → Observatório VR (Three.js + WebXR)
    │
    ├── images/
    │   ├── constelacoes/          → Ilustrações de cada constelação (mitologia).
    │   │                            Os nomes são os do catálogo, letra por
    │   │                            letra — UMi.png, AqL.png, ori.png. Num
    │   │                            servidor Linux um "aql.png" minúsculo dá
    │   │                            404; no Windows nem se nota, porque o
    │   │                            sistema de ficheiros não distingue.
    │   ├── astros/                → Imagens dos astros nos cartões do Céu Agora
    │   │                            (sol, lua, mercurio, …, iss)
    │   ├── mercury.png … neptune.png → Planetas do Sistema Solar, no Observatório
    │   ├── moon_render.png, sun.png  → Lua e Sol
    │   ├── iss.png                → A Estação Espacial Internacional, desenhada
    │   │                            inteira (é um objeto largo — o recorte
    │   │                            circular dos planetas cortava-lhe as pontas)
    │   ├── 618.jpg                → Fundo do menu, da entrada, do perfil e da
    │   │                            administração — a mesma moldura nas quatro
    │   ├── SolarSystem.jpg, Moon.jpg, Sky.jpg → Cartões do menu
    │   └── space.jpg              → Panorâmica da Via Láctea: fundo do céu no
    │                                Observatório 360° (com parallax) e imagem
    │                                do cartão da NASA
    │
    ├── audio/musica.mp3           → Música ambiente do Observatório e do VR
    └── favicon.svg                → Ícone da aplicação (estrela SVG)
```

---

## 🔭 Como funciona

### O motor: números que não se inventam

Tudo o que a aplicação diz sobre o céu sai do **`py/astronomia/sky_engine.py`**,
que lê as efemérides **DE421 da NASA** através do Skyfield. É o mesmo motor que
responde ao Céu Agora, ao Calendário, ao Observatório 2D, ao VR e às
ferramentas da IA — uma função, quatro ecrãs.

E é por isso que a regra da AstroGuide AI existe: com os números verdadeiros a
uma chamada de distância, não há razão nenhuma para inventar um.

### A localização: pelo nome, nunca por coordenadas

O observador não é fixo em Vila Nova de Gaia. Cada conta guarda a sua cidade, o
país, as coordenadas, a elevação e o fuso horário, e **todos os cálculos passam
a ser feitos para lá**: o céu, o calendário e o observatório. A ISS entra aqui
também — é o objeto do céu cuja posição mais depende do sítio de quem olha, por
estar só a 400 km de altitude.

> **Porque é que ninguém escreve latitude e longitude?**
> Escrever um par de números era pedir a quem usa a aplicação uma coisa que
> ninguém sabe de cor: quem quisesse observar de Madrid tinha de saber que são
> 40,4168° N e 3,7038° O — e **um algarismo trocado punha o céu inteiro no sítio
> errado sem nada a avisar.** O erro não dá erro, dá um céu errado.
> Agora escreve-se "Madrid" e as coordenadas, a elevação e o fuso vêm com a
> terra escolhida.

A procura vive no `py/localizacao/` e tem **duas fontes que se pedem em
separado**:

| Fonte | O que dá | Custo |
|:--|:--|:--|
| **Lista local** (162 cidades) | Quase todas as respostas | Instantânea, e **sem rede** |
| **Open-Meteo** (geocoding) | As terras com aquele nome que a lista não tem | Um pedido à rede, a partir de 3 letras |

As duas **somam-se, não se substituem**: a lista é uma amostra, e uma amostra
não pode responder sozinha a um nome que existe em vários países. Escrever
"Granada" devolvia a espanhola e mais nada, quando há mais quatro no mundo. Os
resultados da lista aparecem primeiro e os do serviço logo abaixo, e o que a
lista já deu não se repete.

Estão em pedidos separados por uma razão prática: juntá-los num só obrigava toda
a procura a esperar pela internet para mostrar o que já estava em memória — e
"Porto" não tem nada que esperar.

<details>
<summary><b>Os três caminhos do seletor de cidades</b></summary>

<br>

**1. Escrever o nome da cidade.** A lista de resultados aparece debaixo do campo
à medida que se escreve, e cada linha mostra a região e as coordenadas — que é
o que distingue as terras com o mesmo nome. Basta **uma letra**: quem escreve "S"
vê as terras que começam por S e escolhe de lá, em vez de ter de saber o nome
todo de cor. A partir de três letras a lista é completada com o que o serviço de
geocoding conhece com aquele nome — chega um instante depois, por baixo das
primeiras.

Escrever o nome do país também serve ("Espanha" dá as terras de Espanha) — mas
quando há terras que se chamam mesmo o que se escreveu, as que só coincidiram
por causa da região saem da lista: "port" a devolver o Porto e, atrás dele, Beja
e Braga lê-se como um erro.

Escolher na lista **não grava nada**: a escolha fica à espera do "Guardar esta
localização", porque uma lista percorrida às setas mudava o céu a cada resultado
por que se passasse.

**2. "Usar a localização deste dispositivo".** O browser dá as coordenadas e o
fuso, e a aplicação vai buscar o **nome** da terra a essas coordenadas
(BigDataCloud). Sem esse nome não se grava nada: as coordenadas certas com um
nome errado era pior do que não gravar, porque um nome errado no cabeçalho não
se distingue de um certo.

**3. "Voltar a Vila Nova de Gaia".** Repõe a localização de `config.py`. Só
aparece a quem tem uma localização própria, porque sem ela já se está em Gaia.

</details>

O cartão mostra o que está a valer, com as **coordenadas e o fuso à vista** — é
a maneira de confirmar que a cidade escolhida é mesmo a que a aplicação está a
usar, sem ter de acreditar só no nome — e uma **hora local a andar segundo a
segundo nesse fuso**, e não no do computador. Quem escolher Sydney vê ali as
horas de Sydney no mesmo instante em que o computador diz outra coisa.

### A APOD: imagem ou vídeo, sempre no mesmo sítio

A **Astronomy Picture of the Day** da NASA nem sempre é uma imagem — há dias em
que é um vídeo, e foi aí que esta funcionalidade deu luta.

O problema tinha raiz no `apod.py`, e a raiz era esta: a aplicação lia o campo
`hdurl` para **as duas coisas**, a imagem e o link do vídeo. Só que nos dias de
vídeo esse campo não tem um vídeo — tem a **página do artigo** da NASA. Não
havia, portanto, vídeo nenhum para tocar, e o link mandava a pessoa para uma
página em vez de lhe dar o vídeo.

A correção tem três partes:

<table>
<tr><th width="30%">Peça</th><th>O que faz</th></tr>
<tr><td><b>Duas fontes, por ordem</b></td><td>A API oficial (<code>api.nasa.gov</code>) vem primeiro, porque é a única que diz qual é o vídeo: nos dias de vídeo dá o endereço que toca (o do YouTube, quase sempre) <b>e</b> a imagem que o representa. A do <code>science.nasa.gov</code> ficou como reserva.</td></tr>
<tr><td><b>O campo não decide</b></td><td>O endereço do vídeo não se escolhe pelo <i>nome</i> do campo — ganha o primeiro valor que <b>se veja ser um vídeo</b> (YouTube, Vimeo ou ficheiro), porque já houve duas APIs a chamar-lhe nomes diferentes. O valor tem de ser uma URL de fio a pavio, senão a explicação do dia — que às vezes fala de vídeos e os liga — passava por link de vídeo.</td></tr>
<tr><td><b>Plano B: ir à página</b></td><td>Quando só a reserva responde, o <code>apod.py</code> vai <b>à própria página do artigo</b> e tira de lá o vídeo — primeiro pelas metatags de partilha (<code>og:video</code>, <code>twitter:player</code>), que dão o endereço já limpo, e só depois por varrer o HTML à procura de um <code>&lt;iframe&gt;</code> ou de um <code>&lt;video&gt;</code>. Sem miniatura, um vídeo do YouTube ainda tem a dele: basta o id para chegar ao <code>img.youtube.com/vi/&lt;id&gt;/hqdefault.jpg</code>.</td></tr>
</table>

E, no browser, o vídeo aparece **como a imagem aparece** — com um botão de play
por cima da miniatura. Ao clicar, o vídeo entra no lugar da miniatura, no mesmo
sítio e com a mesma forma:

- **ficheiro** (`.mp4`, `.webm`, …) → um `<video>` com controlos e autoplay;
- **YouTube ou Vimeo** → um `<iframe>` no player do serviço, com o `autoplay`
  já ligado, para o clique no play valer por si;
- **nem uma coisa nem outra** — é a página do artigo, e uma página não se toca
  lá dentro (o site dela recusa-se a ser mostrado num iframe): abre-se numa aba,
  que é o melhor que resta.

Duas defesas que não se veem: o `referrerpolicy="no-referrer"` no iframe, porque
há servidores de vídeo que recusam pedidos que cheguem com o `Referer` de outro
site; e a **escapagem de tudo o que vem da NASA** antes de entrar no HTML, porque
uma aspa no título de uma APOD chegava para partir o resto da página.

> **Opcional:** uma chave própria da NASA (`NASA_API_KEY`, no `.env`) melhora
> isto. Sem ela usa-se a `DEMO_KEY`, que é pública e partilhada por toda a
> gente: chega para uma APOD por dia — e o pedido é um por dia, por causa da
> cache — mas vive sujeita ao limite de pedidos dela.
> Uma chave própria é **gratuita** em [api.nasa.gov](https://api.nasa.gov) e
> ocupa o lugar da `DEMO_KEY` sem mais nada mudar.

### O Observatório: um motor, três renderizadores

| | Como desenha | Para quê |
|:--|:--|:--|
| **Vista 360°** | Canvas, com câmara virtual: rotação Yaw (azimute) e Pitch (altitude) e campo de visão variável por scroll. Cada astro é projetado no plano do ecrã com divisão pela profundidade (z) | A ilusão de perspetiva real, sem sair do 2D |
| **Planisfério** | Canvas, vista zenital 2D clássica | A carta do céu de sempre |
| **VR** | WebGL real (Three.js): a câmara existe genuinamente no espaço 3D | Ligar o WebXR e usar o tracking real da cabeça |

Os três leem **exatamente a mesma API** (`/api/observatorio`), porque todos
trabalham em **coordenadas horizontais** (altitude e azimute) — que são relativas
ao observador, ao contrário de RA/Dec, que são absolutas. É isso que permite
reutilizar os mesmos dados em três motores de renderização diferentes **sem
duplicar um único cálculo**.

<details>
<summary><b>O parallax do fundo, e porque não é 1:1</b></summary>

<br>

A panorâmica da Via Láctea acompanha o zoom, mas **amortecida**: cresce segundo
uma potência do rácio de FOV (expoente `0.3`, teto `1.35×`), em vez de 1:1 como
as estrelas. A 1:1 o centro do ecrã — que é onde se está a olhar — perdia
nitidez, por ser uma fotografia e não um vetor; amortecido, dá uma pista de
profundidade e lê-se atrás das estrelas.

A imagem é preparada **uma só vez** à escala do zoom máximo (`FUNDO_ESCALA_MAX`)
e depois é só desenhada, sem voltar a passar pelo filtro de cor.

</details>

<details>
<summary><b>⤓ Céu sob os pés — e porque é que a caixa se desliga ao voltar</b></summary>

<br>

A caixa *"Ver abaixo do horizonte"* tira o chão e mostra as estrelas,
constelações e planetas que estão debaixo do horizonte, **desenhados mais
apagados** (`ALFA_ABAIXO = 0.6`) para se perceber que não estão observáveis
nesse instante. Só na vista 360°: no Planisfério eles caem fora do círculo.

A caixa sozinha não chegava. A sensibilidade do arrasto sai da largura do ecrã,
por isso descer dos +15° do início até ao céu escondido são **mais de mil pixels
de rato arrastado para baixo** — um ecrã inteiro, e outro tanto para voltar a
subir. O botão ⤓ **Céu sob os pés** faz a viagem num clique.

O botão é **o dono dos dois estados enquanto se anda nele**: desce a câmara *e*
liga a caixa (descer com a caixa desligada era mergulhar dentro de um chão
opaco — o botão parecia avariado e não estava); e, ao voltar, sobe a câmara *e*
desliga a caixa. Sem essa segunda metade, voltar ao céu de cima deixava o chão
levantado e os astros de baixo desenhados — o estado de baixo colado a uma vista
que já não era a dele.

Quem tique a caixa **à mão**, sem tocar no botão, fica com ela como a deixou: o
botão não lha mexe.

No **VR** não há caixa nenhuma: aqui o céu sob os pés está **sempre ligado**,
porque não há chão nenhum a tapar o céu. As estrelas, as constelações e os
planetas debaixo do horizonte aparecem sempre, e desenhados a `0.6` (o mesmo
`ALFA_ABAIXO` do 2D). Uma linha de constelação que atravesse o horizonte conta
como céu de cima e leva o neon todo — a divisão é a mesma do 2D, para os dois
observatórios mostrarem o mesmo céu.

</details>

### Contas e segurança

A conta **não tranca nada**. O Céu, o Calendário, o Observatório e a Imagem do
Dia continuam abertos a quem não tem conta — são a montra do projeto, e quem
abrir a aplicação pela primeira vez tem de os ver sem barreiras.

O que a conta acrescenta é o que só faz sentido para uma pessoa:

- 📍 **Localização pessoal** — a cidade de cada um, com coordenadas, elevação e
  fuso. Todos os cálculos passam a ser feitos para lá;
- ⭐ **Favoritos** — estrelas, constelações e objetos de céu profundo, guardados
  por conta. Marcam-se no Observatório, com o ★ do painel de detalhes. O
  `objeto_id` gravado é a **chave do catálogo** (`"vega"`, `"Ori"`), e não o nome
  visível — mudar um nome no catálogo não deixa os favoritos de ninguém
  pendurados;
- 📔 **Registo de observações** — *"Vi Saturno em 18/09, anéis bem visíveis."* O
  nome do objeto fica copiado no registo, para a observação continuar a fazer
  sentido mesmo que o objeto mude de nome ou saia do catálogo.

O botão de conta (👤, no canto superior direito) **não aparece no Observatório nem
no VR**: nesses dois modos a página é toda céu e ele ficava a flutuar por cima,
sem nada à volta. Voltar ao menu traz o botão de novo. É ele que leva ao
`/perfil` — com sessão ou sem ela, porque quem não a tem é a página de entrada
que o recebe, e volta ao perfil depois de entrar.

<details>
<summary><b>🔐 As decisões de segurança, uma a uma</b></summary>

<br>

- **As passwords nunca são gravadas.** É gravado um hash **scrypt**
  (`generate_password_hash`, do werkzeug), com sal, do qual não se consegue
  voltar atrás para a password.
- **A sessão é um cookie assinado.** Só lá vai o id da conta, e o cookie é
  `HttpOnly` (o JavaScript não o consegue ler) e `SameSite=Lax` (um site externo
  não consegue fazer pedidos autenticados em nome de quem tem sessão aberta —
  é a defesa que, sem isto, obrigaria a um sistema de tokens CSRF).
- **A chave que assina o cookie** é gerada na primeira execução para o
  `.secret_key`, que está no `.gitignore`. Se estiver definida a variável
  `ASTROGUIDE_SECRET_KEY`, é essa que é usada — num servidor com vários
  processos é obrigatório defini-la, senão cada processo assina à sua maneira e
  as sessões não passam de um para o outro.
- **Entrar com uma conta que não existe e entrar com a password errada dão
  exatamente a mesma mensagem** ("Nome ou password incorretos."). Distingui-las
  diria a quem tentasse à força quais os nomes que existem.
- **Apagar uma observação obriga a que ela seja da própria conta**, e não apenas
  a que exista — um id adivinhado de outra pessoa não apaga nada.
- **O papel de administrador só se atribui a partir do terminal**
  (`py promover_admin.py`). Nenhuma rota o pode dar, e não há na aplicação
  nenhum botão que o faça: um botão desses seria a peça mais valiosa do projeto
  — chegar a ele era passar a ver os dados de todas as contas.
- **A `/perfil` verifica a sessão antes de renderizar**, e mostra apenas os dados
  da própria conta. As rotas dos favoritos e das observações fazem todas o mesmo:
  perguntam ao servidor quem tem sessão e filtram por esse id — **o id nunca vem
  do browser**, por isso não há nada que se possa adivinhar para chegar aos dados
  de outra pessoa.
- **A `/admin` verifica o papel ANTES de renderizar**, e a página de acesso
  negado não leva um único dado lá dentro. Um endpoint em JSON que devolvesse a
  lista de contas seria mais uma porta que teria de estar bem fechada; assim não
  existe nenhuma.

</details>

### 🛠️ Administração

O `/admin` mostra o que a base de dados tem: a lista das contas com a localização
de cada uma, quantos favoritos e quantas observações guardou, e a data de
registo. No topo, os totais.

É uma página **só de leitura**: não apaga contas, não muda papéis, não apaga
observações. É para olhar — e cliques distraídos aqui não estragam nada.

```bash
py promover_admin.py                            # quem é admin
py promover_admin.py o-email-da-conta           # promove
py promover_admin.py o-email-da-conta --remover # tira o papel
```

Depois, entra na aplicação com essa conta e abre o `/admin`. O papel fica gravado
na base de dados, por isso vale para qualquer browser e para qualquer sessão nova
— e se a sessão estiver aberta no momento em que se corre o script, também já
vale, sem ser preciso voltar a entrar.

O papel é uma coluna da tabela dos utilizadores, com `'utilizador'` por omissão.
Quem se regista **nunca nasce admin**, e um `astroguide.db` que já existisse de
antes desta alteração ganha a coluna no arranque seguinte, com todas as contas a
ficar `'utilizador'` — ninguém ganha poderes por ter sido criado antes.

---

## 🤖 AstroGuide AI

Um painel de conversa dentro da aplicação: o botão **"✦ AstroGuide AI"**, em
baixo à esquerda, abre uma janela onde se pode perguntar o que é uma magnitude,
porque é que a Lua tem fases, ou onde é que cada coisa se vê no AstroGuide — e,
desde que as ferramentas se ligaram, também **o que está visível agora**, onde
está um astro e que eventos se aproximam.

### A regra que manda em tudo o resto

> ### A IA não faz cálculos astronómicos.
> Não tem fórmulas, não tem efemérides e não tem as posições dos planetas — e as
> suas instruções dizem-lhe, em primeiro lugar, para **nunca inventar posições,
> altitudes, azimutes, horas, fases nem datas de eventos.**

Isto é deliberado, e é a decisão mais importante desta funcionalidade. Um modelo
de linguagem é bom a inventar uma altitude plausível para Júpiter com toda a
confiança, e ninguém no painel tem como saber que é falsa. **Uma aplicação de
astronomia que dá números errados com ar de certos é pior do que uma que não dá
número nenhum** — por isso os números continuam a sair do `sky_engine.py`, que é
quem os calcula desde o princípio, e a IA é uma porta de entrada para o
AstroGuide e não um substituto dele.

<details>
<summary><b>O que mudou com o Function Calling (e o que não mudou)</b></summary>

<br>

Mudou a **forma** da regra, não o seu fundo. Antes, a IA não tinha acesso aos
cálculos, e a instrução era **recusar-se a dá-los**: quem perguntasse por Júpiter
ouvia que ela ainda não os tinha e ia vê-los ao Céu Agora.

Agora tem-nos — mas **não por os saber: por os ir buscar**. A instrução passou a
ser usá-los sempre, e nunca completar de cabeça aquilo que eles não disserem.

A tentação é a mesma de antes, e agora havia uma desculpa a menos: com os números
verdadeiros à distância de uma chamada, não há razão nenhuma para inventar um.

</details>

O que a IA faz, e para isso serve: **explicar conceitos**, responder a perguntas
de astronomia geral, **orientar quem se perdeu na aplicação** ("onde vejo as
constelações?") e ir buscar os números ao motor da aplicação. Quando os dá, são
os verdadeiros: os mesmos que estão no Céu Agora, no Calendário e no
Observatório.

### 🔑 A chave nunca sai do servidor

A chave da API da Groq é um segredo **pago ao pedido**: quem a tiver gasta o
dinheiro de quem a criou. Por isso:

- vive na variável de ambiente `GROQ_API_KEY`, e só aí (o `.env` carrega-a para o
  ambiente — ver `.env.example`). A alternativa Gemini, em `AI_PROVIDER=gemini`,
  aceita ainda o ficheiro `.ai_key` na raiz do projeto. Tudo fora do Git;
- **nunca chega ao browser.** O painel (`ia.js`) fala com o nosso `/api/ia/chat`,
  e é o `py/ia/rotas.py` que chama o `py/ia/ai_engine.py`, que é o único ficheiro
  que fala com o serviço de IA. O JavaScript não sabe sequer qual é o fornecedor;
- nem o `/api/ia/estado` a devolve — responde só se há IA configurada, e com que
  modelo.

**Só com sessão iniciada.** Sem sessão, o `/api/ia/estado` responde `"sem_conta"`
e o `/api/ia/chat` responde 401 — sem gastar um pedido ao serviço de IA. A razão
é a mesma de tudo o resto que é pessoal na aplicação: uma quota paga é de quem a
paga.

O **botão**, ao contrário, não se esconde. Esconder uma porta é a melhor maneira
de ninguém perceber que ela existe — quem ainda não entrou abre o painel e
encontra o aviso com a porta de saída para o `/entrar`.

**Sem chave, a aplicação corre igual.** O servidor arranca normalmente, o céu, o
calendário e o observatório funcionam como sempre, e o painel abre a dizer que a
IA não está configurada e como é que quem administra o servidor a configura. Nada
rebenta e nenhum ecrã fica preso.

> O `google-genai` é importado **dentro** do `ai_engine.py` e não no topo do
> ficheiro, de propósito. No topo, um servidor sem o pacote instalado não
> arrancava de todo: o `server.py` importa as rotas da IA, as rotas importam o
> motor, e um `ModuleNotFoundError` derrubava a aplicação inteira — céu e
> observatório incluídos — por causa de uma funcionalidade opcional.

### 🧰 Function Calling (ligado)

A IA não responde de cor aos números. Tem quatro ferramentas, no
`py/ia/ferramentas.py`, e é chamá-las que faz com que uma altitude dita por ela
seja a mesma que está no Céu Agora:

| Ferramenta | Para que serve |
|:--|:--|
| `get_sky_now` | O que está visível agora. Por omissão devolve **tudo** — o Sol, a Lua e os sete planetas (com a distância à Terra e, na Lua, a fase), as catorze constelações, as estrelas e os objetos de céu profundo. O parâmetro `tipo` deixa pedir só uma dessas famílias. É a ferramenta das perguntas largas: *"que constelações estão visíveis?"*, *"das visíveis qual está mais alta?"* |
| `get_object_position` | Onde está um objeto pelo nome — planeta, estrela, objeto de céu profundo ou constelação |
| `get_moon_phase` | A fase da Lua num dia |
| `get_next_events` | Os próximos eventos, a partir de hoje |

Cada uma **reutiliza as funções que já existiam** (`get_observatorio`,
`get_todos_planetas`, `get_fase_lua_dia`, `get_eventos_do_mes`): não há aqui um
único cálculo novo. A IA é uma porta de entrada para o motor do AstroGuide,
nunca um substituto dele.

<details>
<summary><b>Como é que o vaivém funciona, e o que custa</b></summary>

<br>

O modelo recebe as ferramentas na declaração do pedido e, quando a pergunta é
sobre o céu, responde com um **pedido de ferramenta** em vez de responder com
texto. O servidor corre o que ele pediu, devolve-lhe o resultado, e só então ele
escreve a resposta. Uma pergunta normal são, por isso, **dois pedidos** ao
serviço de IA — e não um.

Com os 20 pedidos/dia/modelo do Gemini, isto baixa a capacidade de cada balde de
cerca de 20 perguntas para cerca de 10. A lista de modelos de recurso continua a
dar folga suficiente para uma demonstração, mas é a razão pela qual o
`ai_engine.py` trava o vaivém às **três voltas**: um modelo que aos três pedidos
ainda não sabe responder está a andar em círculos, e a volta seguinte não o
endireita.

**A localização nunca passa pelo modelo.** Ele sabe onde a pessoa está porque
lhe dizemos, mas não a pode mudar: o `executar()` deita fora qualquer
`localizacao` que venha nos argumentos e usa a que o servidor já tinha resolvido.
Sem isso, uma pergunta com *"estou em Marte"* escrito lá dentro respondia com o
céu de Marte.

**O catálogo não sabe de que marca é.** As ferramentas estão descritas em JSON
Schema puro, sem nada específico de fornecedor nenhum, e é o `ai_engine.py` que
as traduz para o formato que cada API come. Trocar de fornecedor mexe no
`ai_engine.py` e pouco mais — o `ferramentas.py` fica como está.

</details>

### 🗺️ A IA sabe em que ecrã está quem pergunta

Um mapa dos ecrãs, escrito à mão, vai em cada instrução
(`O_QUE_CADA_ECRA_MOSTRA`, no `ai_engine.py`). Isto existe por uma razão
concreta: a IA mandava quem perguntava por uma magnitude ver "no Céu Agora" — e
o Céu Agora **não tem magnitudes nem constelações**, tem só o Sol, a Lua e os
planetas. Quem a isso atendia chegava lá e não encontrava nada.

| Ecrã | O que mostra |
|:--|:--|
| Menu inicial | Os quatro cartões que levam aos outros |
| Céu Agora | O Sol, a Lua e os planetas **agora**, com altitude, azimute, distância e visibilidade. Sem estrelas, sem constelações e sem magnitudes |
| Calendário Cósmico | A fase da Lua em cada dia e os eventos marcados |
| **Observatório** | O mapa celeste interativo — e é **aqui** que se vêem magnitudes e constelações |
| Observatório VR | O mesmo céu em 3D, para óculos |
| NASA — Imagem do Dia | A fotografia da NASA e a explicação |
| Perfil | A localização guardada, os favoritos e o caderno de observações |

E, para além do mapa, o painel **diz ao servidor em que ecrã está** (campo
`ecra`, dentro da lista branca do `ECRAS`). Um ecrã errado vale tanto como um
número inventado — a pessoa chega lá e não encontra o que lhe foi prometido.

### ⚙️ Os fornecedores

<table>
<tr><th width="25%">Fornecedor</th><th>Como está</th></tr>
<tr><td><b>Groq</b><br><sub>principal</sub></td><td>Modelo <code>openai/gpt-oss-120b</code>, e o nome vem todo da variável <code>GROQ_MODEL</code>: a mudança de modelo seguinte é uma linha no <code>.env</code>, e não uma alteração de código. As chamadas vão todas pelo servidor — o browser nunca fala com a Groq, e é por isso que qualquer pessoa pode usar a AstroGuide AI sem ter chave nenhuma sua.</td></tr>
<tr><td><b>Gemini</b><br><sub>alternativa</sub></td><td>Liga-se com <code>AI_PROVIDER=gemini</code>. Ver abaixo.</td></tr>
</table>

**Não há fallback automático para o Gemini, de propósito:** um fallback que
passasse despercebido chamava os dois serviços à mesma pergunta e gastava quota
dos dois sem ninguém o pedir. Quando a Groq não responde — 429, 5xx, rede —, o
painel diz-o com uma frase em português, e quem administra troca o
`AI_PROVIDER` para a alternativa.

<details>
<summary><b>🔁 A alternativa Gemini: 20 pedidos por dia, por modelo</b></summary>

<br>

O plano gratuito do Google não dá um limite por minuto: dá **20 pedidos por dia,
e por modelo**. O erro di-lo por extenso
(`GenerateRequestsPerDayPerProjectPerModel-FreeTier`, limit: 20), e o "PerModel"
no meio do nome é a parte que interessa: **cada modelo tem o seu próprio balde de
20**, e esgotar um não gasta nada do outro.

Vinte perguntas por dia esgotam-se numa demonstração, e a partir daí o painel só
sabia dizer que havia demasiados pedidos. Por isso o `ai_engine.py` não tem um
modelo: **tem uma lista.**

```text
gemini-3.8-flash        ← o principal
gemini-3.7-flash
gemini-3.6-flash
gemini-3.5-flash
gemini-3.5-flash-lite
gemini-3.1-flash-lite
```

Seis baldes, e não cinco. Os `gemini-2.5-flash` e `gemini-2.5-flash-lite` que
aqui estiveram respondem **404 a contas novas** ("no longer available to new
users") apesar de continuarem na listagem da API — eram duas voltas da lista a
troco de nada e, pior, era o 404 deles, a última falha de todas, que subia ao
painel. Os que entraram — 3.7, 3.6 e o 3.5-flash-lite — foram todos testados a
gerar com a chave antes de entrar.

Cada pergunta começa pelo primeiro. Se ele responder 429 (o balde dele cheio) ou
5xx (ele em baixo), passa-se ao seguinte e tenta-se outra vez — e, como os baldes
são separados, o segundo responde. É esta lista que dá à aplicação folga para
umas **sessenta perguntas por dia** em vez de vinte — e não cento e vinte, porque
uma pergunta que peça dados ao motor gasta dois pedidos e não um.

**Só se desce a lista quando a falha é do modelo.** Uma chave inválida, um pedido
mal formado ou a rede caída são iguais em todos, e insistir só gastaria tempo sem
poupar quota nenhuma.

E, quando a lista toda falha, o que se mostra **não é a última falha — é a mais
importante** (`_PRIORIDADE_FALHA`: limite > serviço > modelo). Sem isto, a quota
diária esgotada mostrava o 404 de um modelo antigo ("não encontrei nenhum
modelo"), e a pessoa ia procurar o problema na lista de modelos em vez de esperar
que a quota voltasse.

A ordem não é arbitrária: **os primeiros escrevem melhor português de Portugal**,
e os "lite" são mais rápidos mas mais propensos a escorregar para o português do
Brasil — as instruções de sistema dizem-lhes por isso, explicitamente, para
tratar o utilizador por **"tu"** e nunca por "você". Em uso normal responde
sempre o principal; os outros só entram quando os de cima estão gastos.

</details>

<details>
<summary><b>⏳ Quando a quota volta: quanto falta, e a que horas</b></summary>

<br>

O balde volta a encher no dia seguinte, e o painel diz **quanto** falta e a que
horas — não "espera um pouco". Um limite diário não se resolve à espera de um
minuto, e mandar esperar quem já tem a resposta do outro lado do ecrã à espera de
horas é trocar um problema por outro.

O momento exato vem do **próprio serviço**: o cabeçalho `retry-after` da Groq (em
segundos), ou a frase do erro, que o traz escrito (`"Please retry in 6h10m…"` no
Gemini, `"Please try again in 2m59.56s"` na Groq); na falta de tudo, calcula-se
pela meia-noite UTC — que é onde o relógio do serviço aponta (medido em 2026-10,
o "retry in" deles dava sempre 00:00 em ponto, e não a meia-noite da Califórnia
que a documentação pública descreve; **quando os dois discordam, manda o
serviço**).

O que sai daqui é o campo `quota_renova_em`, em ISO com o fuso lá dentro:

- a frase do erro leva já o tempo escrito — *"Faltam 6 h 07 min — renova às
  01:00, hora local"*, no fuso de quem pergunta;
- e o painel pendura-lhe por baixo uma **contagem que se atualiza sozinha** a
  cada 20 segundos e, ao chegar ao zero, troca por um *"já deve ter voltado —
  tenta a pergunta outra vez"* (`contarQuota`, no `ia.js`).

A resposta do `/api/ia/chat` traz um campo `modelo` com o modelo que respondeu
de facto. O painel não o mostra — é para quem estiver a ler um log perceber se
naquele dia andou a responder o bom ou o de recurso.

</details>

### ⏱️ Quanto tempo se espera

Tem de haver um fim, e o fim está em três sítios que se encaixam:

| Onde | Quanto | Porquê |
|:--|:--|:--|
| `TIMEOUT_PEDIDO_MS`<br><sub>ai_engine.py</sub> | **90 s** por chamada | É o timeout que o SDK não põe sozinho — e sem ele uma ligação que estagnasse ficava presa para sempre |
| `TEMPO_MAXIMO_PERGUNTA`<br><sub>ai_engine.py</sub> | **3 min** pela pergunta inteira | Uma pergunta que peça dados ao motor são três chamadas seguidas, e em uso real uma dessas demorou 167 segundos. Só se arranca a chamada seguinte se ainda faltar tempo para ela |
| `TEMPO_MAXIMO_PEDIDO_MS`<br><sub>ia.js</sub> | **4 min** no painel | Acima do que o servidor pode demorar, para o aviso nosso nunca chegar antes do dele. Ao estourar, o pedido cancela-se e a pergunta fica no painel com o aviso, pronta a repetir-se |

**Uma falha não deita fora a conversa**: a pergunta fica no painel com a falha
logo abaixo, e a pergunta seguinte segue com o histórico todo. O motor junta
mensagens seguidas do mesmo lado, para que um pedido falhado não produza dois
turnos seguidos do utilizador.

### 🚨 Quando falha

Cada família de falha tem o seu estado HTTP e **uma frase em português**, e é
essa frase que o painel mostra:

| HTTP | O que aconteceu |
|:--|:--|
| **401** | Não há sessão iniciada. A funcionalidade é de contas, e quem não entrou não gasta um pedido ao serviço de IA — o painel mostra a frase e a porta para o `/entrar` |
| **400** | O pedido está mal feito (mensagem vazia, ou acima dos 1500 caracteres) ou o serviço recusou-o como está montado — quase sempre a conversa a ser grande demais para o contexto, e aí a frase manda começar uma nova |
| **429** | Um limite de pedidos. O do serviço muda de frase consoante o balde que encheu: o por minuto manda esperar um pouco, o diário diz quanto falta e a que horas, com a contagem a correr dentro da bolha. Na alternativa Gemini, antes de desistir o motor já tentou todos os modelos da lista. O nosso é de **dez perguntas por minuto por IP** e **dez por dia por conta**, e existe pela mesma razão dos outros — a quota é paga e é de todos os que usam o servidor |
| **503** | Não há chave, a chave não está a ser aceite, ou falta o pacote `google-genai` (só na alternativa Gemini) |
| **502** | O serviço de IA está com problemas, um dos modelos já não existe, ou não devolveu resposta nenhuma (a resposta foi bloqueada) |
| **504** | Não se conseguiu chegar ao serviço (rede), ou o tempo acabou |

### 🎨 O aspeto

O painel é **vidro escuro sobre o céu** — fundo translúcido, bordas finas, cantos
arredondados e um halo azul-violeta tão suave que só se nota à procura dele. Uma
conversa lê-se durante minutos, e por isso o que manda é o ar: bolhas translúcidas
com bastante espaço entre elas, entrelinha larga e nada a brilhar mais do que o
necessário. As respostas são cartões escuros à esquerda, com a estrela ao lado;
as perguntas, mais compactas, à direita, num fundo ligeiramente azulado.

O cabeçalho é o de uma mini-janela — título à esquerda, o ↺ da conversa nova
encostado a ele, e ⛶ ✕ à direita. Por baixo, a linha verde do estado:
*"Online • Pronto para explorar o universo"*. O ponto é desenhado em **CSS** e
não um emoji, para ser igual em todas as máquinas.

Quando não há conversa, o painel cumprimenta pelo **primeiro nome** de quem
chegou e mostra quatro perguntas de partida. Quando a resposta está a chegar, são
três pontos a acender-se por turnos — com o salto trocado por esbatimento para
quem pediu menos movimento.

**Duas vozes, dois avatares.** A estrela ✦ da IA à esquerda das respostas, e uma
silhueta de pessoa à direita das perguntas. Não é decoração: sem eles, a conversa
eram duas bolhas parecidas e o lado era a única pista — quem abrisse o painel a
meio, com a conversa já a rolar, tinha de seguir cada bolha até ao princípio para
saber de quem era. O da pessoa é desenhado em CSS, em vez de ser um emoji: um
emoji traria a paleta do sistema (o amarelo no Windows, o azul na Apple) para
dentro de um painel que é todo azul e vidro, e mudava de feitio de máquina para
máquina.

**As falhas ficam sem avatar nenhum**: não foram ditas por ninguém, e dar-lhes a
cara da IA era fazer passar por ela uma coisa que ela nunca disse.

### 🗂️ Onde vive o histórico

**No browser.** O servidor Flask não guarda conversas: a sessão tem só o id do
utilizador, e uma tabela de conversas exigiria guardar o que as pessoas perguntam
e responder a "de quem são estas conversas?" — ninguém pediu isso.

O histórico vive no `sessionStorage`, **como o estado da música** (ver o
`shared-ui-controls.js`), vai inteiro em cada pedido, e desaparece quando o
separador fecha. É isso que faz a conversa durar enquanto se navega entre o Céu,
o Calendário e o Observatório.

<details>
<summary><b>O que a IA recebe em cada pergunta</b></summary>

<br>

- a **pergunta**;
- o **histórico** da conversa (as últimas 20 mensagens; as respostas que falharam
  ficam no painel mas não são enviadas). Só o que é mesmo conversa entra (papéis
  `user` e `assistant`), e cada mensagem é cortada aos mesmos 1500 caracteres da
  pergunta — sem isto, o tecto da pergunta contava só para a nova e as velhas iam
  em megabytes;
- a **localização de observação** — a mesma que o `/api/ceu` usa, do
  `localizacao_do_utilizador()`, e não uma que o browser diga. Vai com o nome da
  terra, as coordenadas e o fuso, e a data e hora locais no instante do pedido:
  sem isso o modelo responde sobre o céu de uma noite que não é esta, e de um
  sítio que não é o de quem pergunta;
- as **quatro ferramentas** do `py/ia/ferramentas.py`, declaradas no próprio
  pedido. São elas, e não o texto acima, que lhe dão os números — e ele vai
  buscá-las sozinho, sem que ninguém tenha de lho pedir.

</details>

### ⚙️ Como configurar

1. Criar uma chave em **[console.groq.com/keys](https://console.groq.com/keys)**
   (Groq Console → API Keys);
2. Guardá-la na variável de ambiente `GROQ_API_KEY`. Para correr na própria
   máquina, o mais simples é copiar o `.env.example` para `.env` e escrevê-la lá
   — o `server.py` carrega o `.env` no arranque. Num servidor, escreve-se a mesma
   variável no painel do alojamento. **Não há ficheiro alternativo para esta
   chave, de propósito**: a variável de ambiente é o único sítio onde ela vive;
3. Instalar as dependências: `py -m pip install -r requirements.txt`;
4. Reiniciar o servidor.

```ini
# .env — tudo opcional menos a chave
GROQ_API_KEY=a-tua-chave

GROQ_MODEL=openai/gpt-oss-120b      # muda o modelo
GROQ_REASONING_EFFORT=low           # low | medium | high — quanto ele pensa antes de responder
LIMITE_PERGUNTAS_DIA=10             # perguntas por conta por dia
```

Se a chave for inválida ou tiver sido revogada, o `/api/ia/chat` responde **503**
e o painel diz que a chave não está a ser aceite — a distinção entre "não há
chave" e "a chave não serve" está lá precisamente para não se andar às cegas.

<details>
<summary><b>Usar a alternativa Gemini em vez da Groq</b></summary>

<br>

1. `AI_PROVIDER=gemini` no ambiente;
2. Uma chave do Google AI Studio (*Get API key*) na variável `GEMINI_API_KEY` —
   ou no ficheiro `.ai_key` na raiz do projeto, com a chave numa linha só, sem
   aspas e sem espaços à volta;
3. O pacote `google-genai` instalado (já vem no `requirements.txt`).

O formato das chaves do Google tem mudado — as mais recentes começam por `"AQ."`
e não por `"AIza"` —, por isso o que vale é **copiar o que o Google AI Studio
dá**, sem inventar.

</details>

---

## 🧰 Tecnologias

### Linguagens

| Linguagem | Onde | O que faz |
|:--|:--|:--|
| **Python** | `server.py`, `promover_admin.py`, `_teste_contas.py`, todo o `py/` | Todos os cálculos astronómicos e o servidor. Nunca é visível para o utilizador |
| **HTML** | `templates/` | A estrutura das páginas e das secções da app |
| **CSS** | `static/css/` | Design system com glassmorphism e tema escuro. Animações de entrada, hover, shimmer e borderGlow |
| **JavaScript** | `static/js/` | O estado da aplicação no browser. Fala com o Python por `fetch`, desenha o mapa celeste em Canvas (360° e planisfério) e a cena 3D em WebGL |

### Bibliotecas Python

| | Biblioteca | Para que serve |
|:--|:--|:--|
| 🔭 | **skyfield** | Biblioteca científica de astronomia. Usa as efemérides **DE421 da NASA** para calcular com precisão a posição de qualquer astro em qualquer momento e lugar da Terra. Suporta `ts.from_datetime()`, que é o que faz a **Viagem no Tempo** funcionar |
| 🌐 | **flask** | Micro-framework web. Cria o servidor que serve as páginas e a API JSON |
| 🕐 | **tzdata** | Base de dados de fusos horários. Necessária no **Windows** para converter UTC em hora local (`Europe/Lisbon`, `Europe/Madrid`, `Australia/Sydney`…). É também o que o `auth.py` usa para verificar, à entrada, que um fuso existe mesmo (`ZoneInfo`), em vez de o gravar às cegas |
| 📡 | **requests** | Pedidos HTTP. Usada no `apod.py` (NASA), no `iss.py` (Celestrak), no `geocoding.py` (BigDataCloud) e no `ai_engine.py` (a API da Groq — que **não tem SDK nenhum**, é chamada com `requests`) |
| 🤖 | **google-genai** | O SDK oficial do Google para o Gemini — a alternativa da AstroGuide AI. Usado só no `ai_engine.py`: é o único ficheiro do projeto que fala com um serviço externo de IA, e é essa fronteira que faz com que trocar de fornecedor seja mexer num ficheiro só |
| 🔑 | **python-dotenv** | Carrega o `.env` para as variáveis de ambiente no arranque do `server.py` — é o que permite correr a aplicação com a chave no `.env`, sem exportar variáveis à mão |

### Bibliotecas JavaScript

| | Biblioteca | Para que serve |
|:--|:--|:--|
| 🧊 | **Three.js** *(r160, via CDN)* | Gráficos 3D em WebGL, no Observatório VR: estrelas (`THREE.Points`) e linhas de constelações (`THREE.LineSegments`) posicionadas pelas coordenadas reais devolvidas pela API. O carregamento é garantido por `garantirTHREE()`, que reutiliza o `THREE` já presente ou o vai buscar ao CDN |
| 🎨 | **Canvas API** *(nativa)* | O mapa celeste do Observatório 2D, nos dois modos. Permite clicar em astros, estrelas e constelações para ver detalhes, curiosidades e imagens |
| 🕐 | **Intl.DateTimeFormat** *(nativa)* | É com ela que o perfil mostra a hora local da terra escolhida, e que o Céu Agora sabe que dia é lá: a opção `timeZone` formata a hora no fuso pedido, e o `formatToParts()` dá as peças uma a uma. Sem isto, a aplicação usava a hora do computador — que está certa para quem a usa e **errada para o céu que está a mostrar**, se a localização escolhida for noutro fuso |
| 📍 | **Geolocation API** *(nativa)* | Usada no botão "usar a localização deste dispositivo". Dá as coordenadas, e o nome da terra vem depois do servidor (ver `/api/localidades/reversa`). Se o browser recusar ou não a tiver, diz-se — a lista de cidades é o outro caminho, e está sempre lá |

---

## 📚 Conceitos-chave

<details open>
<summary><b>Astronomia</b></summary>

<br>

**Efemérides (`de421.bsp`)** — Tabela matemática com as posições de todos os
planetas ao longo do tempo, calculada pela NASA com altíssima precisão. O
Skyfield usa este ficheiro para saber onde está cada planeta em cada momento.

**Coordenadas Horizontais (Altitude/Azimute)** — O sistema usado em todo o
projeto — 2D, 360° e VR — porque é **relativo ao observador**, ao contrário de
RA/Dec, que são coordenadas absolutas do céu. Permite reutilizar exatamente os
mesmos dados da API em três motores de renderização diferentes sem duplicar
cálculos.

**Altitude** — Ângulo em graus acima do horizonte.
`0°` = horizonte · `90°` = zénite · negativo = não visível.

**Azimute** — Direção horizontal em graus a partir do Norte.
`0°` = Norte · `90°` = Este · `180°` = Sul · `270°` = Oeste.

**UA (Unidade Astronómica)** — Distância média da Terra ao Sol = 149 597 870 km.

**Fuso horário IANA** — Os fusos são identificados pelo **nome da região**
(`"Europe/Lisbon"`, `"Australia/Sydney"`), e não por um deslocamento em horas. A
diferença importa: o deslocamento de Lisboa muda entre as 0 e as +1 horas conforme
a hora de verão, e um `"0"` gravado hoje estava errado metade do ano. O nome traz
as regras todas, incluindo as mudanças de hora — e é o próprio Python que o
confirma (`ZoneInfo`) antes de ele ser gravado.

**Geocoding** — Traduzir um **nome** numa posição (e o contrário). É o que permite
que a localização se escolha escrevendo "Madrid": alguém já fez a lista de que
Madrid são 40,4168° N, 3,7038° O e o fuso `Europe/Madrid`, e a aplicação vai
buscá-la em vez de a pedir a quem está a usar. Aqui é feito em duas camadas que
**se somam**: a lista local (`cidades.py`, instantânea, sem rede) e os serviços
públicos Open-Meteo e BigDataCloud, ambos sem chave de API.

</details>

<details>
<summary><b>Web e arquitetura</b></summary>

<br>

**API (Application Programming Interface)** — O canal de comunicação entre o
JavaScript (browser) e o Python (servidor). O JavaScript faz `fetch("/api/ceu")`
e recebe os dados em JSON.

**JSON** — O formato de troca de dados entre Python e JavaScript.
Ex.: `{"altitude": 36.5, "azimute": 202.1, "visivel": true}`

**Query Parameters** — Parâmetros opcionais passados no URL após o `?`.
Ex.: `/api/observatorio?data=2026-07-18&hora=02:00` — é o que faz a Viagem no
Tempo funcionar.

**SPA (Single Page Application)** — Técnica onde a navegação entre ecrãs acontece
no browser **sem recarregar a página**. O JavaScript mostra e esconde secções
conforme o ecrã ativo, tornando a app mais rápida.

**Degradação Graciosa** *(graceful degradation)* — Padrão usado nas imagens de
constelações e de planetas: se uma imagem não existir ou falhar a carregar, a app
não parte — mostra automaticamente um resultado alternativo (texto sem imagem, ou
o círculo de cor original) em vez de um ícone de imagem partida.

**Geração Procedural** — Conteúdo criado por código/matemática em vez de imagens
ou ficheiros externos. Usado nos ícones do menu (estrela, lua crescente,
telescópio e jornal), desenhados com a Canvas API — não ocupam espaço no
repositório e mantêm a nitidez em qualquer resolução.

**DRY (Don't Repeat Yourself)** — Princípio aplicado no projeto: o `glass.css`
centraliza o design system, o `shared-ui-controls.js` evita repetição de lógica
de música e configurações, e o Observatório VR reutiliza a mesma API do
Observatório 2D em vez de recalcular posições astronómicas.

**sessionStorage** — Memória temporária do browser, usada para manter o estado da
música ao navegar entre páginas e o histórico da conversa com a AstroGuide AI.
Apaga quando o separador fecha.

</details>

<details>
<summary><b>Estilo e 3D</b></summary>

<br>

**Glassmorphism** — Estilo visual de painéis translúcidos com desfoque de fundo
(`backdrop-filter: blur`). Cria profundidade e elegância mantendo o conteúdo
legível sobre fundos complexos como o campo de estrelas e a fotografia do menu.

**Projeção Perspetiva 3D (Vista 360°)** — O Observatório 2D usa geometria de
câmara virtual com rotação Yaw (azimute) e Pitch (altitude) e campo de visão
(FOV) variável via scroll. Cada estrela/astro é projetado no plano do ecrã com
divisão pela profundidade (z), criando a ilusão de perspetiva real.

**WebGL / Three.js (Observatório VR)** — Ao contrário do Observatório 2D (Canvas
achatado com matemática de projeção manual), o VR cria uma cena 3D real — a
câmara existe genuinamente no espaço 3D, e o WebGL trata da projeção e
profundidade. É isto que permite ligar o WebXR e usar o tracking real da cabeça
de um headset como o Meta Quest 3, em vez de uma rotação de câmara simulada pelo
arrasto do rato.

</details>

<details>
<summary><b>Inteligência Artificial</b></summary>

<br>

**Chave de API** — A credencial que identifica quem está a usar um serviço
externo. É um **segredo pago ao pedido**: quem a tiver gasta o dinheiro de quem a
criou, e uma chave publicada num repositório é encontrada por robôs em minutos.
Por isso vive numa variável de ambiente ou num ficheiro fora do Git, e nunca
chega ao browser.

**Instruções de sistema** *(system prompt)* — O texto que diz ao modelo o que ele
é e o que não é, e que vai em cada pedido antes da conversa. É aqui que está
escrita a regra da AstroGuide AI: não inventar posições, altitudes, horas nem
fases — esses números só podem vir das ferramentas, que os vão buscar ao
`sky_engine.py`. **A IA é a porta de entrada, não o motor.**

**Function Calling** — Mecanismo que permite a um modelo **pedir para executar
uma função nossa** em vez de responder de cor. O modelo diz "chama
`get_sky_now`"; o servidor corre-a com as funções do AstroGuide, devolve-lhe o
resultado, e a resposta final já vem com os dados verdadeiros. É o que transforma
a IA de narradora em porta de acesso ao motor da aplicação.

</details>

---

## 🗺️ Roadmap

- [x] Landing page interativa com menu dinâmico
- [x] Dados em tempo real — Sol, Lua e 7 planetas
- [x] Calendário Cósmico com fases da Lua e eventos
- [x] NASA — Imagem do Dia (APOD), com **imagem e vídeo**
- [x] Observatório — mapa celeste interativo (360° e planisfério)
- [x] Observatório VR — Three.js e sessão WebXR imersiva
- [x] Viagem no Tempo — simular o céu em qualquer data/hora
- [x] Contas de utilizador e localização pessoal
- [x] Favoritos no Observatório e caderno de observações
- [x] Página `/perfil` e papel de administrador com `/admin`
- [x] AstroGuide AI — painel de conversa com contexto da localização
- [x] AstroGuide AI — **Function Calling** ligado: a IA consulta as ferramentas
      e responde com os números do próprio AstroGuide
- [ ] Catálogo de estrelas alargado (Hipparcos — 117k estrelas)
- [ ] Hosting online com URL público
- [ ] Versão mobile (React Native ou Capacitor)
- [ ] Ligação a telescópio via Arduino — figura física que aponta para a estrela
      selecionada *(Fase 2 do hardware)*

---

## 🛠️ Ferramentas usadas no desenvolvimento

| Ferramenta | Para quê |
|:--|:--|
| **Claude** (claude.ai) | Assistente de aprendizagem e desenvolvimento |
| **Cursor** | Editor de código com IA integrada |
| **GitHub** | Controlo de versões e repositório |
| **Postman** | Teste das rotas da API |
| **Brave** | Browser de desenvolvimento |
| **Notion** | Organização e notas do projeto |

---

<div align="center">

### 👤 Autor

**Diogo Vedor Peres Pinho**

Escola Profissional de Gaia · Curso de Programador de Informática

**Prova de Aptidão Profissional — 2025/2026**

<br>

<sub>Feito com Python, JavaScript e alguma paciência a olhar para o céu. 🌙</sub>

</div>
