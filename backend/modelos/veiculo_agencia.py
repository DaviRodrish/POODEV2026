from sqlalchemy import Column, Integer, String, Float, ForeignKey
from backend.database.conexao_postgres import Base

class VeiculoAgenciaModel(Base):
    __tablename__ = "veiculos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    agencia_id = Column(Integer, ForeignKey("agencias.id"), nullable=False)
    placa = Column(String, unique=True, index=True, nullable=False)
    marca = Column(String, nullable=False)
    modelo = Column(String, nullable=False)
    ano = Column(String, nullable=False)
    valor_diaria = Column(Float, nullable=False) # Ou valor de mercado da FIPE adaptado
    status = Column(String, default="disponível") # Disponível, Alugado, Manutenção