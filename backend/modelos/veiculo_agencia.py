from sqlalchemy import Column, Integer, String, Float, ForeignKey
from backend.database.conexao_postgres import Base

class VeiculoAgenciaModel(Base):
    __tablename__ = "veiculos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    agencia_id = Column(Integer, ForeignKey("agencias.id"), nullable=False)
    placa = Column(String, unique=True, index=True, nullable=False)
    marca = Column(String, nullable=False)
    modelo = Column(String, nullable=False)
    ano = Column(Integer, nullable=False)
    valor_diaria = Column(Float, nullable=False)
    status = Column(String, default="disponível")
    combustivel_nivel = Column(Float, default=1.0)
    quilometragem = Column(Integer, default=0)
    km_rev = Column(Integer, default=10000)
    fipeP = Column(String, nullable=True)
    fipeA = Column(String, nullable=True)

    def abastecer(self, nivel):
        if nivel < 0 or nivel > 1:
            raise ValueError("Nível de combustível deve ser entre 0 e 1")
        self.combustivel_nivel = float(nivel)

    def calcular_taxa_reabastecimento(self, nivel_retorno):
        if nivel_retorno >= self.combustivel_nivel:
            return {"cobrar": False, "taxa": 0.0, "litros_faltantes": 0.0}
        
        litros = (self.combustivel_nivel - nivel_retorno) * 50
        valor = litros * 5.89
        taxa = valor * 1.15
        return {
            "cobrar": True,
            "taxa": round(taxa, 2),
            "litros_faltantes": round(litros, 1)
        }

    def precisa_revisao(self):
        limite = self.km_rev or 10000
        return self.quilometragem >= limite

    def registrar_revisao(self):
        self.km_rev = self.quilometragem + 10000
        if self.status == "manutenção":
            self.status = "disponível"
