from datetime import date
from backend.modelos.usuario import Usuario
from backend.modelos.enums import StatusCliente
from backend.modelos.cpf import CPF
from backend.modelos.cnh import CNH

class Motorista(Usuario):
    def __init__(self, nome, email, cpf_str, cnh_num, categoria="B", validade=None, titular=None, senha="123", status="ATIVO"):
        super().__init__(nome=nome, email=email, senha=senha, status=status, tipo_perfil="motorista")
        self.cpf = cpf_str
        try:
            self._cnh = CNH(cnh_num, categoria=categoria, validade=validade) if isinstance(cnh_num, str) else cnh_num
        except Exception:
            self._cnh = cnh_num
        self.titular = titular

    @property
    def cpf(self):
        return self._cpf

    @cpf.setter
    def cpf(self, valor):
        self._cpf = CPF(valor) if isinstance(valor, str) else valor

    @property
    def cnh(self):
        return self._cnh

    @cnh.setter
    def cnh(self, valor):
        try:
            self._cnh = CNH(valor) if isinstance(valor, str) else valor
        except Exception:
            self._cnh = valor

    def get_documento(self):
        doc = self.cnh.numero if hasattr(self.cnh, "numero") else str(self.cnh)
        cat = self.cnh.categoria if hasattr(self.cnh, "categoria") else "B"
        return f"CNH {doc} (Cat. {cat})"

    def pode_operar(self):
        st = getattr(self.status, "value", self.status)
        if st != "ATIVO" or not self.cnh:
            return False
        if hasattr(self.cnh, "esta_valida") and not self.cnh.esta_valida(date.today()):
            return False
        if hasattr(self.cnh, "permite_carro") and not self.cnh.permite_carro():
            return False
        return True

    def pode_alugar(self):
        return self.pode_operar()

    def exibir_dados(self):
        st = getattr(self.status, "value", self.status)
        return {
            "tipo": self.tipo_perfil(),
            "nome": self.nome,
            "email": self.email,
            "documento": self.get_documento(),
            "cnh": self.cnh.numero if hasattr(self.cnh, "numero") else str(self.cnh),
            "cpf": self.cpf.formatado() if hasattr(self.cpf, "formatado") else str(self.cpf),
            "status": st,
            "titular_vinculado": getattr(self.titular, "nome", "Nenhum") if self.titular else "Nenhum",
            "apto_conduzir": self.pode_operar()
        }

# Alias conforme Figura 5.2 do relatório oficial da UENF
MotoristaSecundario = Motorista
