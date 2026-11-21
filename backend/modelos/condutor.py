from abc import ABC

from backend.modelos.cnh import CNH
from backend.modelos.cpf import CPF
from backend.modelos.enums import StatusCliente
from backend.modelos.usuario import Usuario


class Condutor(Usuario, ABC):
    """Base comum de quem dirige: tem CPF e (opcionalmente) CNH.

    Elimina a duplicação entre Cliente e Motorista.
    """

    def __init__(self, nome, email, cpf, cnh=None, senha="123",
                 status=StatusCliente.ATIVO, tipo_perfil="condutor"):
        super().__init__(nome=nome, email=email, senha=senha, status=status, tipo_perfil=tipo_perfil)
        self.cpf = cpf
        self.cnh = cnh

    @property
    def cpf(self) -> CPF:
        return self._cpf

    @cpf.setter
    def cpf(self, valor):
        if isinstance(valor, CPF):
            self._cpf = valor
        elif isinstance(valor, str):
            self._cpf = CPF(valor)
        else:
            raise TypeError("cpf deve ser str ou CPF.")

    @property
    def cnh(self):
        return self._cnh

    @cnh.setter
    def cnh(self, valor):
        if valor is None or isinstance(valor, CNH):
            self._cnh = valor
        elif isinstance(valor, str):
            self._cnh = CNH(valor)
        else:
            raise TypeError("cnh deve ser str, CNH ou None.")

    def obter_cnh(self):
        """Contrato usado pela Locacao (mesmo nome no ClienteModel)."""
        return self._cnh

    def get_documento(self):
        return self.cpf.formatado()

    def pode_alugar(self):
        return self.pode_operar()

    def _dados_base(self):
        return {
            "tipo": self.tipo_perfil,
            "nome": self.nome,
            "email": self.email,
            "documento": self.get_documento(),
            "cnh": self._cnh.numero if self._cnh else None,
            "status": self.status.value,
        }