from sqlalchemy import Column, Integer, String
from backend.database.conexao_postgres import Base

class AgenciaModel(Base):
    __tablename__ = "agencias"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    _cnpj = Column("cnpj", String, unique=True, index=True, nullable=False)
    senha = Column(String, nullable=False)
    endereco = Column(String, nullable=False)

    def __init__(self, nome: str, email: str, cnpj: str, senha: str, endereco: str):
        self.nome = nome
        self.email = email
        self.cnpj = cnpj  # Usa o property abaixo para validar
        self.senha = senha
        self.endereco = endereco

    @property
    def cnpj(self):
        return self._cnpj

    @cnpj.setter
    def cnpj(self, valor: str):
        from backend.modelos.cnpj import CNPJ
        cnpj_obj = CNPJ(valor)
        self._cnpj = cnpj_obj.numero