from sqlalchemy import Column, String

from backend.modelos.cnpj import CNPJ
from backend.modelos.enums import StatusCliente
from backend.modelos.pagamento import Pagamento
from backend.modelos.usuario import Usuario, UsuarioModel, cifrar_documento, proteger_senha
from backend.security import decrypt_value


class AgenciaModel(UsuarioModel):
    __tablename__ = "agencias"

    _cnpj = Column("cnpj", String, unique=True, index=True, nullable=False)
    cnpj_lookup = Column("cnpj_lookup", String(64), index=True, nullable=True)
    endereco = Column(String, nullable=False)
    chave_pix = Column(String, nullable=True, default="")
    tipo_perfil = "agencia"

    def __init__(self, nome, email, cnpj, senha="123", endereco="", chave_pix=""):
        super().__init__(nome=nome, email=email, senha=proteger_senha(senha))
        self.cnpj = cnpj
        self.endereco = endereco
        self.chave_pix = chave_pix or str(cnpj)

    @property
    def cnpj(self):
        return self._cnpj

    @cnpj.setter
    def cnpj(self, valor):
        self._cnpj, self.cnpj_lookup = cifrar_documento(valor)

    def get_documento(self):
        return decrypt_value(self._cnpj)

    def get_chave_pix(self):
        return decrypt_value(self.chave_pix) if self.chave_pix else self.get_documento()

    def pode_operar(self):
        return bool(self._cnpj) and bool(self.endereco)


class Agencia(Usuario):
    def __init__(self, nome, email, cnpj, endereco, senha="123",
                 status=StatusCliente.ATIVO, chave_pix=""):
        super().__init__(nome=nome, email=email, senha=senha, status=status, tipo_perfil="agencia")
        self.cnpj = cnpj
        self.endereco = str(endereco).strip()
        self._chave_pix = str(chave_pix).strip() or self.get_documento()
        self._frota = []
        self._caixa = []

    @property
    def cnpj(self) -> CNPJ:
        return self._cnpj

    @cnpj.setter
    def cnpj(self, valor):
        if isinstance(valor, CNPJ):
            self._cnpj = valor
        elif isinstance(valor, str):
            self._cnpj = CNPJ(valor)
        else:
            raise TypeError("cnpj deve ser str ou CNPJ.")

    @property
    def chave_pix(self):
        return self._chave_pix

    @property
    def frota(self):
        return tuple(self._frota)  # cópia somente leitura

    @property
    def recebimentos(self):
        return tuple(self._caixa)

    def get_documento(self):
        return self.cnpj.formatado()

    def pode_operar(self):
        return super().pode_operar() and bool(self.endereco)

    def configurar_chave_pix(self, nova_chave: str):
        if not nova_chave or len(str(nova_chave).strip()) < 3:
            raise ValueError("Chave PIX inválida.")
        self._chave_pix = str(nova_chave).strip()

    def registrar_pagamento(self, pagamento: Pagamento):
        if not isinstance(pagamento, Pagamento):
            raise TypeError("registrar_pagamento espera um Pagamento.")
        self._caixa.append(pagamento)

    def total_faturado(self) -> float:
        return sum(p.valor for p in self._caixa)

    def cadastrar_veiculo(self, veiculo):
        self._frota.append(veiculo)

    def exibir_dados(self):
        return {
            "tipo": self.tipo_perfil,
            "nome": self.nome,
            "email": self.email,
            "documento": self.get_documento(),
            "chave_pix": self.chave_pix,
            "endereco": self.endereco,
            "status": self.status.value,
            "total_frota": len(self._frota),
        }