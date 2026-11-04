from sqlalchemy import Column, Integer, String
from backend.database.conexao_postgres import Base
from backend.modelos.cpf import CPF

class ClienteModel(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    _cpf = Column("cpf", String, unique=True, index=True, nullable=False)
    cnh = Column(String, nullable=True)
    senha = Column(String, nullable=False)
    tipo_perfil = Column(String, default="cliente")
    status = Column(String, default="ATIVO")
    motivo = Column(String, nullable=True)

    def __init__(self, nome, email, cpf, cnh, senha, tipo_perfil="cliente", status="ATIVO", motivo=None):
        self.nome = nome
        self.email = email
        self.cpf = cpf
        self.cnh = cnh
        self.senha = senha
        self.tipo_perfil = tipo_perfil
        self.status = status
        self.motivo = motivo

    @property
    def cpf(self):
        return self._cpf

    @cpf.setter
    def cpf(self, valor):
        self._cpf = "".join(filter(str.isdigit, str(valor)))

    def pode_alugar(self):
        return self.status == "ATIVO"

    def bloquear(self, motivo):
        self.status = "BLOQUEADO"
        self.motivo = motivo

    def desbloquear(self):
        self.status = "ATIVO"
        self.motivo = None

    def __repr__(self):
        return f"<ClienteModel(id={self.id}, nome='{self.nome}', status='{self.status}')>"


class Cliente:
    def __init__(self, nome, email, cpf_str, cnh_num):
        self.nome = nome
        self.email = email
        self.cpf = CPF(cpf_str) if isinstance(cpf_str, str) else cpf_str
        self.cnh = cnh_num
        self.status = "ATIVO"
        self.motivo = None

    def pode_alugar(self):
        return self.status == "ATIVO"

    def bloquear(self, motivo):
        self.status = "BLOQUEADO"
        self.motivo = motivo

    def desbloquear(self):
        self.status = "ATIVO"
        self.motivo = None
