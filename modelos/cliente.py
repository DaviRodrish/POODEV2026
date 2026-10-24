from database.conexao_postgres import Base
from modelos.cpf import CPF
from modelos.enums import StatusCliente
from sqlalchemy import Column, Enum as SqlEnum, Integer, String


class ClienteModel(Base):
  __tablename__ = "clientes"

  id = Column(Integer, primary_key=True, autoincrement=True)
  nome = Column(String, nullable=False)
  email = Column(String, unique=True, nullable=False)
  _cpf = Column("cpf", String, unique=True, nullable=False)
  cnh = Column(String, nullable=False)
  status = Column(
      SqlEnum(StatusCliente), default=StatusCliente.ATIVO, nullable=False
  )
  motivo = Column(String, nullable=True)

  def __init__(self, nome, email, cpf, cnh):
    self.nome = nome
    self.email = email
    objeto_cpf = CPF(cpf)
    self._cpf = objeto_cpf.numero
    self.cnh = cnh
    self.status = StatusCliente.ATIVO
    self.motivo = None

  @property
  def cpf(self):
    return CPF(self._cpf)

  def bloquear(self, motivo=None):
    self.status = StatusCliente.BLOQUEADO
    self.motivo = motivo if motivo else "Nenhum"

  def desbloquear(self):
    self.status = StatusCliente.ATIVO
    self.motivo = None

  def pode_alugar(self):
    return self.status == StatusCliente.ATIVO