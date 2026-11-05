from sqlalchemy import Column, String
from backend.modelos.cpf import CPF
from backend.modelos.cnh import CNH
from backend.modelos.usuario import Usuario, UsuarioModel

class ClienteModel(UsuarioModel):
    __tablename__ = "clientes"

    _cpf = Column("cpf", String, unique=True, index=True, nullable=False)
    cnh = Column(String, nullable=True)
    tipo_perfil = Column(String, default="cliente")
    status = Column(String, default="ATIVO")
    motivo = Column(String, nullable=True)

    def __init__(self, nome, email, cpf, cnh=None, senha="123", tipo_perfil="cliente", status="ATIVO", motivo=None):
        super().__init__(nome=nome, email=email, senha=senha)
        self.cpf = cpf
        self.cnh = cnh
        self.tipo_perfil = tipo_perfil
        self.status = status
        self.motivo = motivo

    @property
    def cpf(self):
        return self._cpf

    @cpf.setter
    def cpf(self, valor):
        self._cpf = "".join(filter(str.isdigit, str(valor)))

    def get_documento(self):
        return self._cpf

    def pode_operar(self):
        return self.status == "ATIVO"

    def pode_alugar(self):
        return self.pode_operar()

    def bloquear(self, motivo):
        self.status = "BLOQUEADO"
        self.motivo = motivo

    def desbloquear(self):
        self.status = "ATIVO"
        self.motivo = None

    def __repr__(self):
        return f"<ClienteModel(id={self.id}, nome='{self.nome}', status='{self.status}')>"


class Cliente(Usuario):
    def __init__(self, nome, email, cpf_str, cnh_num=None, senha="123", status="ATIVO"):
        super().__init__(nome=nome, email=email, senha=senha, status=status, tipo_perfil="cliente")
        self.cpf = cpf_str
        self.cnh = cnh_num

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
        if valor is None:
            self._cnh = None
        else:
            self._cnh = CNH(valor) if isinstance(valor, str) else valor

    def get_documento(self):
        return self.cpf.formatado() if hasattr(self.cpf, "formatado") else str(self.cpf)

    def pode_alugar(self):
        return self.pode_operar()

    def exibir_dados(self):
        st = getattr(self.status, "value", self.status)
        return {
            "tipo": self.tipo_perfil(),
            "nome": self.nome,
            "email": self.email,
            "documento": self.get_documento(),
            "cnh": str(self.cnh.numero) if hasattr(self.cnh, "numero") else (str(self.cnh) if self.cnh else None),
            "status": st,
            "pode_alugar": self.pode_alugar()
        }
