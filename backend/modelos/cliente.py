from sqlalchemy import Column, Integer, String
from backend.database.conexao_postgres import Base

class ClienteModel(Base):
    """
    Classe que representa o Utilizador / Cliente / Motorista no sistema,
    mapeando a tabela 'clientes' do PostgreSQL com suporte a perfis diferenciados.
    """
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    _cpf = Column("cpf", String, unique=True, index=True, nullable=False)
    cnh = Column(String, nullable=True)
    senha = Column(String, nullable=False)
    tipo_perfil = Column(String, default="cliente")  # Pode ser 'cliente' (usuário comum) ou 'motorista'

    def __init__(self, nome: str, email: str, cpf: str, cnh: str, senha: str, tipo_perfil: str = "cliente"):
        self.nome = nome
        self.email = email
        self.cpf = cpf  # Utiliza a property para validação e armazenamento limpo
        self.cnh = cnh
        self.senha = senha
        self.tipo_perfil = tipo_perfil

    @property
    def cpf(self):
        """Retorna o CPF armazenado na base de dados."""
        return self._cpf

    @cpf.setter
    def cpf(self, valor: str):
        """Atribui o CPF removendo caracteres não numéricos se necessário."""
        # Remove pontos e traços para guardar apenas os números
        limpo = "".join(filter(str.isdigit, str(valor)))
        self._cpf = limpo

    def __repr__(self):
        return f"<ClienteModel(id={self.id}, nome='{self.nome}', email='{self.email}', perfil='{self.tipo_perfil}')>"