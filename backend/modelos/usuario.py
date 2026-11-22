from abc import ABC, abstractmethod

from sqlalchemy import Column, Integer, String

from backend.database.conexao_postgres import Base
from backend.modelos.enums import StatusCliente
from backend.security import (
    decrypt_value,
    doc_lookup_hash,
    encrypt_value,
    hash_password,
    normalize_doc,
    verify_password,
)

_PREFIXO_HASH = "pbkdf2_sha256$"


def proteger_senha(senha) -> str:

    texto = str(senha)
    return texto if texto.startswith(_PREFIXO_HASH) else hash_password(texto)


def cifrar_documento(valor):

    if valor is None:
        return None, None
    texto = str(valor).strip()
    decifrado = decrypt_value(texto)
    if decifrado != texto:
        return texto, doc_lookup_hash(decifrado)
    norm = normalize_doc(texto)
    return encrypt_value(norm), doc_lookup_hash(norm)


# [USUARIO 1/3] RF01/RNF04 - Mixin compartilhado: autenticar() unico para dominio e ORM
class AutenticavelMixin:

    def autenticar(self, senha_tentativa):
        if not self.senha or senha_tentativa is None:
            return False
        return verify_password(str(senha_tentativa), self.senha)


# [USUARIO 1/3] ORM abstrato: sem tabela usuarios, herdado por clientes/agencias
class UsuarioModel(AutenticavelMixin, Base):
    __abstract__ = True

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha = Column(String, nullable=False)

    def get_documento(self):
        return ""

    def pode_operar(self):
        return True


# [USUARIO 1/3] RF01 - Classe abstrata Usuario -> herdada por Condutor e Agencia
class Usuario(AutenticavelMixin, ABC):
    def __init__(self, nome, email, senha, status=StatusCliente.ATIVO, tipo_perfil="usuario"):
        self.nome = str(nome).strip()
        self.email = str(email).strip().lower()
        self.senha = proteger_senha(senha)
        self._status = StatusCliente(status)
        self.motivo = None
        self._tipo_perfil = tipo_perfil

    @property
    def status(self):
        return self._status

    @property
    def tipo_perfil(self):
        return self._tipo_perfil

    def pode_operar(self):
        return self._status is StatusCliente.ATIVO

    def bloquear(self, motivo):
        self._status = StatusCliente.BLOQUEADO
        self.motivo = motivo

    def desbloquear(self):
        self._status = StatusCliente.ATIVO
        self.motivo = None

    @abstractmethod
    def get_documento(self):
        ...

    @abstractmethod
    def exibir_dados(self):
        ...