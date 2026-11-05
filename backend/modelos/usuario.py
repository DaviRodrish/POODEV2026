from abc import ABC, abstractmethod
from sqlalchemy import Column, Integer, String
from backend.database.conexao_postgres import Base
from backend.modelos.enums import StatusCliente


class UsuarioModel(Base):
    __abstract__ = True

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha = Column(String, nullable=False)

    def autenticar(self, senha_tentativa):
        return bool(self.senha) and self.senha == str(senha_tentativa)

    def get_documento(self):
        return ""

    def pode_operar(self):
        return True


class Usuario(ABC):
    def __init__(self, nome, email, senha, status="ATIVO", tipo_perfil="usuario"):
        self.nome = str(nome).strip()
        self.email = str(email).strip().lower()
        self.senha = str(senha)
        if status == "ATIVO" or status == StatusCliente.ATIVO:
            self.status = StatusCliente.ATIVO
        elif status == "BLOQUEADO" or status == StatusCliente.BLOQUEADO:
            self.status = StatusCliente.BLOQUEADO
        else:
            self.status = status
        self.motivo = None
        self._tipo_perfil = tipo_perfil

    def autenticar(self, senha):
        return bool(self.senha) and self.senha == str(senha)

    def pode_operar(self):
        st = getattr(self.status, "value", self.status)
        return st == "ATIVO"

    def tipo_perfil(self):
        return self._tipo_perfil

    def bloquear(self, motivo):
        self.status = StatusCliente.BLOQUEADO
        self.motivo = motivo

    def desbloquear(self):
        self.status = StatusCliente.ATIVO
        self.motivo = None

    @abstractmethod
    def get_documento(self):
        pass

    @abstractmethod
    def exibir_dados(self):
        pass
