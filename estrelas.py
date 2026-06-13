# ============================================================
#  estrelas.py — Base de dados de estrelas e constelações
#  Contém coordenadas celestes (J2000) e magnitudes das
#  principais estrelas visíveis de Vila Nova de Gaia,
#  bem como as linhas que as ligam para formar constelações.
# ============================================================

# Dicionário com as principais estrelas
# Estrutura: "id_estrela": {"nome": "Nome Comum", "ra": RA_horas, "dec": Dec_graus, "mag": Magnitude}
# RA (Right Ascension) em horas decimais, Dec (Declination) em graus decimais
ESTRELAS_BD = {
    # ── Ursa Menor (Ursa Minor) ──
    "polaris":    {"nome": "Polaris (Estrela Polar)", "ra": 2.5303,  "dec": 89.264,  "mag": 1.97},
    "kochab":     {"nome": "Kochab",                  "ra": 14.8451, "dec": 74.155,  "mag": 2.07},
    "pherkad":    {"nome": "Pherkad",                 "ra": 15.3475, "dec": 71.834,  "mag": 3.00},
    "yildun":     {"nome": "Yildun",                  "ra": 17.5372, "dec": 86.586,  "mag": 4.35},
    "eps_umi":    {"nome": "Urodelus",                "ra": 16.7661, "dec": 82.036,  "mag": 4.21},
    "zet_umi":    {"nome": "Ahfa al Farkadain",       "ra": 15.7348, "dec": 77.794,  "mag": 4.29},
    "eta_umi":    {"nome": "Anwar al Farkadain",      "ra": 16.2994, "dec": 75.753,  "mag": 4.95},

    # ── Ursa Maior (Ursa Major) ──
    "dubhe":      {"nome": "Dubhe",                   "ra": 11.0621, "dec": 61.751,  "mag": 1.81},
    "merak":      {"nome": "Merak",                   "ra": 11.0303, "dec": 56.382,  "mag": 2.34},
    "phecda":     {"nome": "Phecda",                  "ra": 11.8973, "dec": 53.691,  "mag": 2.41},
    "megrez":     {"nome": "Megrez",                  "ra": 12.2570, "dec": 57.031,  "mag": 3.32},
    "alioth":     {"nome": "Alioth",                  "ra": 12.9004, "dec": 55.959,  "mag": 1.76},
    "mizar":      {"nome": "Mizar",                   "ra": 13.3987, "dec": 54.921,  "mag": 2.23},
    "alkaid":     {"nome": "Alkaid",                  "ra": 13.7923, "dec": 49.313,  "mag": 1.85},

    # ── Orião (Orion) ──
    "betelgeuse": {"nome": "Betelgeuse",              "ra": 5.9195,  "dec": 7.407,   "mag": 0.42},
    "rigel":      {"nome": "Rigel",                   "ra": 5.2423,  "dec": -8.201,  "mag": 0.12},
    "bellatrix":  {"nome": "Bellatrix",               "ra": 5.4189,  "dec": 6.349,   "mag": 1.64},
    "alnilam":    {"nome": "Alnilam",                 "ra": 5.6035,  "dec": -1.201,  "mag": 1.69},
    "alnitak":    {"nome": "Alnitak",                 "ra": 5.6826,  "dec": -1.942,  "mag": 1.74},
    "mintaka":    {"nome": "Mintaka",                 "ra": 5.5333,  "dec": -0.301,  "mag": 2.25},
    "saiph":      {"nome": "Saiph",                   "ra": 5.7969,  "dec": -9.669,  "mag": 2.07},

    # ── Cassiopeia (Cassiopeia) ──
    "schedar":    {"nome": "Schedar",                 "ra": 0.6751,  "dec": 56.537,  "mag": 2.24},
    "caph":       {"nome": "Caph",                    "ra": 0.1529,  "dec": 59.150,  "mag": 2.28},
    "gam_cas":    {"nome": "Tsih",                    "ra": 0.9490,  "dec": 60.716,  "mag": 2.15},
    "ruchbah":    {"nome": "Ruchbah",                 "ra": 1.4310,  "dec": 60.235,  "mag": 2.66},
    "segin":      {"nome": "Segin",                   "ra": 1.9038,  "dec": 63.670,  "mag": 3.35},

    # ── Leão (Leo) ──
    "regulus":    {"nome": "Regulus",                 "ra": 10.1395, "dec": 11.967,  "mag": 1.36},
    "denebola":   {"nome": "Denebola",                "ra": 11.8200, "dec": 14.572,  "mag": 2.14},
    "algieba":    {"nome": "Algieba",                 "ra": 10.3331, "dec": 19.842,  "mag": 2.01},
    "zosma":      {"nome": "Zosma",                   "ra": 11.2340, "dec": 20.524,  "mag": 2.56},
    "chertan":    {"nome": "Chertan",                 "ra": 11.2351, "dec": 15.429,  "mag": 3.33},
    "rasalas":    {"nome": "Rasalas",                 "ra": 9.8828,  "dec": 26.002,  "mag": 3.88},
    "adhafera":   {"nome": "Adhafera",                "ra": 10.2831, "dec": 23.418,  "mag": 3.43},

    # ── Touro (Taurus) ──
    "aldebaran":  {"nome": "Aldebaran",               "ra": 4.5987,  "dec": 16.509,  "mag": 0.87},
    "elnath":     {"nome": "Elnath",                  "ra": 5.4382,  "dec": 28.599,  "mag": 1.65},
    "gam_tau":    {"nome": "Hyadum I",                "ra": 4.3303,  "dec": 15.629,  "mag": 3.65},
    "eps_tau":    {"nome": "Ain",                     "ra": 4.4776,  "dec": 19.180,  "mag": 3.53},
    "alcyone":    {"nome": "Alcyone (Plêiades)",       "ra": 3.7912,  "dec": 24.101,  "mag": 2.87},

    # ── Gémeos (Gemini) ──
    "castor":     {"nome": "Castor",                  "ra": 7.5767,  "dec": 31.888,  "mag": 1.58},
    "pollux":     {"nome": "Pollux",                  "ra": 7.7553,  "dec": 28.026,  "mag": 1.16},
    "alhena":     {"nome": "Alhena",                  "ra": 6.6292,  "dec": 16.399,  "mag": 1.93},
    "mebsuta":    {"nome": "Mebsuta",                 "ra": 6.7219,  "dec": 25.131,  "mag": 3.06},
    "tejat":      {"nome": "Tejat Posterior",         "ra": 6.3813,  "dec": 22.513,  "mag": 2.87},
    "wasat":      {"nome": "Wasat",                   "ra": 7.3343,  "dec": 21.982,  "mag": 3.50},

    # ── Cisne (Cygnus) ──
    "deneb":      {"nome": "Deneb",                   "ra": 20.6905, "dec": 45.280,  "mag": 1.25},
    "sadr":       {"nome": "Sadr",                    "ra": 20.3731, "dec": 40.262,  "mag": 2.23},
    "albireo":    {"nome": "Albireo",                 "ra": 19.5126, "dec": 27.961,  "mag": 3.05},
    "gienah":     {"nome": "Gienah",                  "ra": 20.7701, "dec": 33.968,  "mag": 2.48},
    "fawaris":    {"nome": "Fawaris",                 "ra": 19.6079, "dec": 45.131,  "mag": 2.86},

    # ── Lira (Lyra) ──
    "vega":       {"nome": "Vega",                    "ra": 18.6156, "dec": 38.783,  "mag": 0.03},
    "sheliak":    {"nome": "Sheliak",                 "ra": 18.8355, "dec": 33.364,  "mag": 3.52},
    "sulafat":    {"nome": "Sulafat",                 "ra": 18.9814, "dec": 32.684,  "mag": 3.25},

    # ── Águia (Aquila) ──
    "altair":     {"nome": "Altair",                  "ra": 19.8464, "dec": 8.868,   "mag": 0.76},
    "alshain":    {"nome": "Alshain",                 "ra": 19.9205, "dec": 6.405,   "mag": 3.71},
    "tarazed":    {"nome": "Tarazed",                 "ra": 19.7719, "dec": 10.605,  "mag": 2.72},

    # ── Boieiro (Boötes) ──
    "arcturus":   {"nome": "Arcturus",                "ra": 14.2610, "dec": 19.182,  "mag": -0.05},
    "izar":       {"nome": "Izar",                    "ra": 14.7491, "dec": 27.078,  "mag": 2.35},
    "muphrid":    {"nome": "Muphrid",                 "ra": 13.9118, "dec": 18.397,  "mag": 2.68},
    "nekkar":     {"nome": "Nekkar",                  "ra": 15.0315, "dec": 40.391,  "mag": 3.49},
    "seginus":    {"nome": "Seginus",                 "ra": 14.5348, "dec": 38.307,  "mag": 3.03},

    # ── Virgem (Virgo) ──
    "spica":      {"nome": "Spica",                   "ra": 13.4199, "dec": -11.161, "mag": 0.98},
    "porrima":    {"nome": "Porrima",                 "ra": 12.6946, "dec": -1.450,  "mag": 2.74},
    "vindemiat":  {"nome": "Vindemiatrix",            "ra": 13.0360, "dec": 10.958,  "mag": 2.85},
    "heze":       {"nome": "Heze",                    "ra": 13.5786, "dec": -0.598,  "mag": 3.38},

    # ── Escorpião (Scorpius) ──
    "antares":    {"nome": "Antares",                 "ra": 16.4901, "dec": -26.432, "mag": 1.06},
    "shaula":     {"nome": "Shaula",                  "ra": 17.5601, "dec": -37.103, "mag": 1.62},
    "graffias":   {"nome": "Graffias",                "ra": 16.0900, "dec": -19.802, "mag": 2.56},
    "dschubba":   {"nome": "Dschubba",                "ra": 16.0142, "dec": -22.621, "mag": 2.29},
    "sargas":     {"nome": "Sargas",                  "ra": 17.6221, "dec": -42.998, "mag": 1.86},

    # ── Pégaso (Pegasus) ──
    "markab":     {"nome": "Markab",                  "ra": 23.0792, "dec": 15.205,  "mag": 2.49},
    "scheat":     {"nome": "Scheat",                  "ra": 23.0632, "dec": 28.082,  "mag": 2.44},
    "algenib":    {"nome": "Algenib",                 "ra": 0.2206,  "dec": 15.183,  "mag": 2.83},
    "enif":       {"nome": "Enif",                    "ra": 21.7351, "dec": 9.875,   "mag": 2.38},
    "homam":      {"nome": "Homam",                   "ra": 22.6901, "dec": 10.833,  "mag": 3.41},
}

# Ligações para desenhar as constelações
# Estrutura: "id_constelacao": {"nome": "Nome da Constelação", "linhas": [("id_estrela_A", "id_estrela_B"), ...]}
CONSTELACOES_BD = {
    "UMi": {
        "nome": "Ursa Menor",
        "linhas": [
            ("polaris", "yildun"),
            ("yildun", "eps_umi"),
            ("eps_umi", "zet_umi"),
            ("zet_umi", "kochab"),
            ("kochab", "pherkad"),
            ("pherkad", "eta_umi"),
            ("eta_umi", "zet_umi")
        ]
    },
    "UMa": {
        "nome": "Ursa Maior",
        "linhas": [
            ("dubhe", "merak"),
            ("merak", "phecda"),
            ("phecda", "megrez"),
            ("megrez", "alioth"),
            ("alioth", "mizar"),
            ("mizar", "alkaid"),
            ("megrez", "dubhe")
        ]
    },
    "Ori": {
        "nome": "Orião",
        "linhas": [
            ("betelgeuse", "bellatrix"),
            ("bellatrix", "mintaka"),
            ("mintaka", "alnilam"),
            ("alnilam", "alnitak"),
            ("alnitak", "betelgeuse"),
            ("alnitak", "saiph"),
            ("saiph", "rigel"),
            ("rigel", "mintaka"),
            ("betelgeuse", "rigel"), # Linha diagonal interior do corpo (opcional)
            ("bellatrix", "saiph")  # Linha diagonal interior do corpo (opcional)
        ]
    },
    "Cas": {
        "nome": "Cassiopeia",
        "linhas": [
            ("caph", "schedar"),
            ("schedar", "gam_cas"),
            ("gam_cas", "ruchbah"),
            ("ruchbah", "segin")
        ]
    },
    "Leo": {
        "nome": "Leão",
        "linhas": [
            ("denebola", "chertan"),
            ("chertan", "zosma"),
            ("zosma", "denebola"),
            ("zosma", "algieba"),
            ("algieba", "adhafera"),
            ("adhafera", "rasalas"),
            ("rasalas", "regulus"),
            ("regulus", "chertan")
        ]
    },
    "Tau": {
        "nome": "Touro",
        "linhas": [
            ("elnath", "aldebaran"),
            ("aldebaran", "gam_tau"),
            ("gam_tau", "eps_tau"),
            ("eps_tau", "aldebaran")
        ]
    },
    "Gem": {
        "nome": "Gémeos",
        "linhas": [
            ("castor", "pollux"),
            ("castor", "mebsuta"),
            ("mebsuta", "tejat"),
            ("pollux", "wasat"),
            ("wasat", "alhena"),
            ("tejat", "alhena")
        ]
    },
    "Cyg": {
        "nome": "Cisne",
        "linhas": [
            ("deneb", "sadr"),
            ("sadr", "albireo"),
            ("sadr", "gienah"),
            ("sadr", "fawaris")
        ]
    },
    "Lyr": {
        "nome": "Lira",
        "linhas": [
            ("vega", "sheliak"),
            ("sheliak", "sulafat"),
            ("sulafat", "vega")
        ]
    },
    "Aql": {
        "nome": "Águia",
        "linhas": [
            ("altair", "alshain"),
            ("altair", "tarazed")
        ]
    },
    "Boo": {
        "nome": "Boieiro",
        "linhas": [
            ("arcturus", "muphrid"),
            ("arcturus", "izar"),
            ("izar", "seginus"),
            ("seginus", "nekkar"),
            ("nekkar", "izar")
        ]
    },
    "Vir": {
        "nome": "Virgem",
        "linhas": [
            ("spica", "porrima"),
            ("porrima", "vindemiat"),
            ("porrima", "heze"),
            ("heze", "spica")
        ]
    },
    "Sco": {
        "nome": "Escorpião",
        "linhas": [
            ("antares", "dschubba"),
            ("dschubba", "graffias"),
            ("antares", "shaula"),
            ("shaula", "sargas")
        ]
    },
    "Peg": {
        "nome": "Pégaso",
        "linhas": [
            ("markab", "scheat"),
            ("scheat", "algenib"),
            ("algenib", "markab"),
            ("markab", "enif"),
            ("enif", "homam")
        ]
    }
}
