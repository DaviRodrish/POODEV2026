from modelos.enums import StatusCliente
from modelos.cpf import CPF

class Cliente:
    def __init__(self, nome, email, cpf, cnh):
        self.nome = nome
        self.email = email
        self.cpf = CPF(cpf)
        self.cnh = cnh
        self.status = StatusCliente.ATIVO
        self.motivo = None

    def bloquear(self, motivo=None):
        self.status = StatusCliente.BLOQUEADO
        if motivo == None:
            self.motivo = "Nenhum"
        else:
            self.motivo = motivo

    def desbloquear(self):
        self.status = StatusCliente.ATIVO
        self.motivo = None

    def pode_alugar(self):
        if self.status == StatusCliente.ATIVO:
            return True
        else:
            return False
