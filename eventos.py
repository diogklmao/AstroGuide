# ============================================================
#  eventos.py — Base de dados de eventos astronómicos
#  Contém chuvas de meteoros e eclipses do ano.
#  As chuvas de meteoros têm datas fixas todos os anos
#  (são sempre os mesmos detritos de cometas).
#  Os eclipses são específicos de 2026.
# ============================================================

EVENTOS = [

    # ── Chuvas de meteoros ────────────────────────────────────────────────────
    # Acontecem todos os anos aproximadamente nas mesmas datas.
    # A Terra atravessa os detritos deixados por cometas nas suas órbitas.

    {
        "nome":      "Quadrântidas",
        "tipo":      "meteoros",                # tipo do evento — usado para filtrar e estilizar
        "emoji":     "☄️",
        "mes":       1,                         # janeiro
        "dia":       3,                         # dia de pico da chuva
        "hora_ini":  "00:00",                   # início da janela ideal de observação
        "hora_fim":  "04:00",                   # fim da janela
        "hora_pico": "03:00",                   # hora de maior intensidade
        "descricao": "Uma das melhores chuvas do ano. Até 120 meteoros/hora no pico.",
    },
    {
        "nome":      "Líridas",
        "tipo":      "meteoros",
        "emoji":     "☄️",
        "mes":       4,                         # abril
        "dia":       22,
        "hora_ini":  "22:00",
        "hora_fim":  "04:00",
        "hora_pico": "02:00",
        "descricao": "Chuva moderada, até 20 meteoros/hora.",
    },
    {
        "nome":      "Eta Aquáridas",
        "tipo":      "meteoros",
        "emoji":     "☄️",
        "mes":       5,                         # maio
        "dia":       6,
        "hora_ini":  "02:00",
        "hora_fim":  "05:00",
        "hora_pico": "03:30",
        "descricao": "Detritos do cometa Halley. Até 50 meteoros/hora.",
    },
    {
        "nome":      "Perseidas",
        "tipo":      "meteoros",
        "emoji":     "☄️",
        "mes":       8,                         # agosto
        "dia":       12,
        "hora_ini":  "22:00",
        "hora_fim":  "04:00",
        "hora_pico": "01:00",
        "descricao": "A mais popular do ano. Até 100 meteoros/hora no pico.",
    },
    {
        "nome":      "Oriônidas",
        "tipo":      "meteoros",
        "emoji":     "☄️",
        "mes":       10,                        # outubro
        "dia":       21,
        "hora_ini":  "23:00",
        "hora_fim":  "04:00",
        "hora_pico": "02:00",
        "descricao": "Também detritos do cometa Halley. Até 20 meteoros/hora.",
    },
    {
        "nome":      "Leônidas",
        "tipo":      "meteoros",
        "emoji":     "☄️",
        "mes":       11,                        # novembro
        "dia":       17,
        "hora_ini":  "23:00",
        "hora_fim":  "04:00",
        "hora_pico": "03:00",
        "descricao": "Rápidas e brilhantes. Até 15 meteoros/hora.",
    },
    {
        "nome":      "Gemínidas",
        "tipo":      "meteoros",
        "emoji":     "☄️",
        "mes":       12,                        # dezembro
        "dia":       13,
        "hora_ini":  "21:00",
        "hora_fim":  "04:00",
        "hora_pico": "02:00",
        "descricao": "A melhor chuva do ano. Até 150 meteoros/hora no pico.",
    },
    {
        "nome":      "Úrsidas",
        "tipo":      "meteoros",
        "emoji":     "☄️",
        "mes":       12,                        # dezembro
        "dia":       22,
        "hora_ini":  "23:00",
        "hora_fim":  "03:00",
        "hora_pico": "01:00",
        "descricao": "Chuva discreta de fim de ano. Até 10 meteoros/hora.",
    },

    # ── Eclipses 2026 ─────────────────────────────────────────────────────────
    # Calculados com precisão — datas específicas de 2026.

    {
        "nome":      "Eclipse Solar Total",
        "tipo":      "eclipse_solar",
        "emoji":     "🌑",
        "ano":       2026,
        "mes":       8,                         # agosto
        "dia":       12,
        "hora_ini":  "17:00",
        "hora_fim":  "20:00",
        "hora_pico": "18:30",
        "descricao": "Eclipse solar total visível em Espanha e norte de Portugal. Evento raro!",
    },
    {
        "nome":      "Eclipse Lunar Penumbral",
        "tipo":      "eclipse_lunar",
        "emoji":     "🌕",
        "ano":       2026,
        "mes":       3,                         # março
        "dia":       3,
        "hora_ini":  "22:00",
        "hora_fim":  "01:00",
        "hora_pico": "23:30",
        "descricao": "Eclipse lunar penumbral — a Lua fica ligeiramente escurecida.",
    },
]

def get_eventos_do_dia(ano, mes, dia):
    """
    Filtra a lista global EVENTOS e devolve apenas os que ocorrem na data pedida.
    Usado no painel 'Detalhe do Dia' do calendário.
    """
    return [
        e for e in EVENTOS
        if e["mes"] == mes
        and e["dia"] == dia
        # Meteoros não têm campo "ano" (aparecem todos os anos);
        # eclipses têm "ano" específico.
        and ("ano" not in e or e["ano"] == ano)
    ]

def get_eventos_do_mes(ano, mes):
    """
    Devolve todos os eventos de um mês específico (ex: todos os de Agosto).
    Ajudar a API do calendário a saber onde colocar ícones de aviso.
    """
    return [
        e for e in EVENTOS
        if e["mes"] == mes
        # Meteoros não têm campo "ano" (aparecem todos os anos);
        # eclipses têm "ano" específico.
        and ("ano" not in e or e["ano"] == ano)
    ]

def tem_evento(ano, mes, dia):
    """
    Verificação rápida (True/False) se um dia tem algum evento registado.
    """
    return len(get_eventos_do_dia(ano, mes, dia)) > 0
