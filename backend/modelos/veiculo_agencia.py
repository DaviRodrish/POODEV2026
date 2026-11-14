import re
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from backend.database.conexao_postgres import Base
from backend.modelos.emissao import Eletrico, Gasolina, Diesel, Alcool, Flex, GNV, Hibrido

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
        return (self.quilometragem or 0) >= limite

    def registrar_revisao(self):
        self.km_rev = (self.quilometragem or 0) + 10000
        self.status = "disponível"

    def colocar_em_manutencao(self):
        self.status = "manutenção"

    @property
    def cilindrada(self):
        nome = str(self.modelo or "").lower()
        if "eletrico" in nome or "elétrico" in nome:
            return 0.0
        match = re.search(r"(\d+[\.,]\d+)", nome)
        if match:
            return float(match.group(1).replace(",", "."))
        return 1.0

    @property
    def tipo_combustivel(self):
        texto = f"{self.modelo or ''} {self.fipeA or ''}".lower()
        if "eletrico" in texto or "elétrico" in texto:
            return "Elétrico"
        if "hibrido" in texto or "híbrido" in texto or "hybrid" in texto:
            return "Híbrido"
        if "diesel" in texto or str(self.fipeA).endswith("-3"):
            return "Diesel"
        if "gnv" in texto:
            return "GNV"
        if "alcool" in texto or "álcool" in texto or "etanol" in texto or str(self.fipeA).endswith("-2"):
            return "Álcool"
        if "flex" in texto:
            return "Flex"
        return "Gasolina"

    def calcular_emissao(self, km=100):
        mapa = {
            "Elétrico": Eletrico(),
            "Híbrido": Hibrido(),
            "Diesel": Diesel(),
            "GNV": GNV(),
            "Álcool": Alcool(),
            "Flex": Flex(),
            "Gasolina": Gasolina(),
        }
        estrategia = mapa.get(self.tipo_combustivel, Gasolina())
        return estrategia.calc(km, self.cilindrada)


class Manutencao:
    def __init__(self, veiculo, descricao="", origem="REVISAO_KM"):
        if veiculo is None:
            raise ValueError("Veículo é obrigatório para manutenção.")
        self.veiculo = veiculo
        self.descricao = str(descricao or "").strip()
        self.origem = origem
        self.km_revisao = veiculo.quilometragem or 0
        self.status = "PENDENTE"
        self.data_hora = datetime.now()

    def iniciar(self, descricao=""):
        if descricao and str(descricao).strip():
            self.descricao = str(descricao).strip()
        if not self.descricao:
            raise ValueError("Informe a descrição do serviço para iniciar a manutenção.")
        self.status = "EM_ANDAMENTO"
        self.veiculo.colocar_em_manutencao()

    def finalizar(self, descricao=""):
        if descricao and str(descricao).strip():
            self.descricao = str(descricao).strip()
        if not self.descricao:
            raise ValueError("Informe a descrição do serviço realizado para finalizar.")
        self.status = "CONCLUIDA"
        self.data_hora = datetime.now()
        self.veiculo.registrar_revisao()
