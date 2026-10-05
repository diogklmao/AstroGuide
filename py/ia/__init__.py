# ============================================================
#  ia — A AstroGuide AI
#
#  O motor de conversa da aplicação: um painel que responde a
#  perguntas sobre o céu, sabendo de onde quem pergunta está a
#  olhar.
#
#  Está fechado num pacote próprio, e não espalhado pelo
#  server.py, por uma razão prática: é a única parte do projeto
#  que depende de um serviço externo de IA. Trocá-lo por outro
#  — outro fornecedor, outro modelo — é trocar o que está por
#  baixo desta porta, e nem as rotas nem o frontend dão por
#  isso.
#
#  O que sai daqui:
#    · responder()  — uma pergunta, uma resposta;
#    · estado()     — se está pronta a usar, e o que falta quando
#                     não está;
#    · disponivel() — o mesmo, em sim ou não.
# ============================================================

from py.ia.ai_engine import responder, estado, disponivel, MODELO
