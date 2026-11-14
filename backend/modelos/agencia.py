from sqlalchemy import Column, String
from backend.modelos.cnpj import CNPJ
from backend.modelos.usuario import Usuario, UsuarioModel

class AgenciaModel(UsuarioModel):
    __tablename__ = "agencias"

    _cnpj = Column("cnpj", String, unique=True, index=True, nullable=False)
    endereco = Column(String, nullable=False)
    chave_pix = Column(String(100), nullable=True, default="")
    tipo_perfil = "agencia"

    def __init__(self, nome: str, email: str, cnpj: str, senha: str = "123", endereco: str = "", chave_pix: str = ""):
        super().__init__(nome=nome, email=email, senha=senha)
        self.cnpj = cnpj
        self.endereco = endereco
        self.chave_pix = chave_pix or str(cnpj)

    @property
    def cnpj(self):
        return self._cnpj

    @cnpj.setter
    def cnpj(self, valor: str):
        cnpj_obj = CNPJ(valor) if isinstance(valor, str) else valor
        self._cnpj = cnpj_obj.numero

    def get_documento(self):
        return self._cnpj

    def get_chave_pix(self):
        return self.chave_pix if self.chave_pix else self.get_documento()

    def pode_operar(self):
        return bool(self._cnpj) and bool(self.endereco)


class Agencia(Usuario):
    def __init__(self, nome, email, cnpj, endereco, senha="123", status="ATIVO", chave_pix=""):
        super().__init__(nome=nome, email=email, senha=senha, status=status, tipo_perfil="agencia")
        self.cnpj = cnpj
        self.endereco = str(endereco).strip()
        self.chave_pix = str(chave_pix).strip() or str(self.get_documento())
        self.frota = []
        self.caixa_recebimentos = []

    @property
    def cnpj(self):
        return self._cnpj

    @cnpj.setter
    def cnpj(self, valor):
        self._cnpj = CNPJ(valor) if isinstance(valor, str) else valor

    def get_documento(self):
        return self.cnpj.formatado() if hasattr(self.cnpj, "formatado") else str(self.cnpj)

    def pode_operar(self):
        st = getattr(self.status, "value", self.status)
        return st == "ATIVO" and bool(self.endereco)

    def configurar_chave_pix(self, nova_chave: str):
        if not nova_chave or len(str(nova_chave).strip()) < 3:
            raise ValueError("Chave PIX inválida.")
        self.chave_pix = str(nova_chave).strip()

    def registrar_pagamento(self, pagamento_dict: dict):
        self.caixa_recebimentos.append(pagamento_dict)

    def total_faturado(self) -> float:
        return sum(p.get("valor", 0.0) for p in self.caixa_recebimentos)

    def cadastrar_veiculo(self, veiculo):
        self.frota.append(veiculo)

    def exibir_dados(self):
        st = getattr(self.status, "value", self.status)
        return {
            "tipo": self.tipo_perfil(),
            "nome": self.nome,
            "email": self.email,
            "documento": self.get_documento(),
            "chave_pix": self.chave_pix,
            "endereco": self.endereco,
            "status": st,
            "total_frota": len(self.frota)
        }
