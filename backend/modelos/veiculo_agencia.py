import unicodedata
from datetime import datetime

from sqlalchemy import Column, Float, ForeignKey, Integer, String

from backend.database.conexao_postgres import Base
from backend.modelos.emissao import Alcool, Diesel, Eletrico, Flex, GNV, Gasolina, Hibrido
from backend.modelos.enums import StatusManutencao
from backend.modelos.veiculo_regras import (
    CAPACIDADE_TANQUE_PADRAO,
    calcular_taxa_reabastecimento,
    extrair_cilindrada,
    validar_nivel,
)


class StatusVeiculoDB:
    DISPONIVEL = "disponível"
    LOCADO = "locado"
    MANUTENCAO = "manutenção"


def _normalizar(texto) -> str:
    sem_acento = unicodedata.normalize("NFD", str(texto or ""))
    return "".join(c for c in sem_acento if unicodedata.category(c) != "Mn").strip().lower()


_ESTRATEGIAS = {
    "Elétrico": Eletrico(), "Híbrido": Hibrido(), "Diesel": Diesel(),
    "GNV": GNV(), "Álcool": Alcool(), "Flex": Flex(), "Gasolina": Gasolina(),
}


class VeiculoAgenciaModel(Base):
    __tablename__ = "veiculos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    agencia_id = Column(Integer, ForeignKey("agencias.id"), nullable=False)
    placa = Column(String, unique=True, index=True, nullable=False)
    marca = Column(String, nullable=False)
    modelo = Column(String, nullable=False)
    ano = Column(Integer, nullable=False)
    valor_diaria = Column(Float, nullable=False)
    status = Column(String, default=StatusVeiculoDB.DISPONIVEL)
    combustivel_nivel = Column(Float, default=1.0)
    quilometragem = Column(Integer, default=0)
    km_rev = Column(Integer, default=10000)
    fipeP = Column(String, nullable=True)
    fipeA = Column(String, nullable=True)

    def esta_disponivel(self) -> bool:
        return _normalizar(self.status) == "disponivel"

    def alugar(self):
        if not self.esta_disponivel():
            raise ValueError(f"Veículo {self.placa} não está disponível.")
        self.status = StatusVeiculoDB.LOCADO

    def liberar(self):
        self.status = StatusVeiculoDB.DISPONIVEL

    def enviar_para_manutencao(self):
        self.status = StatusVeiculoDB.MANUTENCAO

    colocar_em_manutencao = enviar_para_manutencao  # nome antigo, mantido por compatibilidade

    # ---- regras (delegam ao módulo compartilhado) ----
    def abastecer(self, nivel):
        self.combustivel_nivel = validar_nivel(nivel)

    def calcular_taxa_reabastecimento(self, nivel_retorno):
        return calcular_taxa_reabastecimento(
            self.combustivel_nivel, nivel_retorno, CAPACIDADE_TANQUE_PADRAO
        )

    def precisa_revisao(self):
        limite = self.km_rev or 10000
        return (self.quilometragem or 0) >= limite

    def registrar_revisao(self):
        self.km_rev = (self.quilometragem or 0) + 10000
        self.liberar()

    @property
    def cilindrada(self):
        return extrair_cilindrada(self.modelo)

    @property
    def tipo_combustivel(self):
        texto = f"{self.modelo or ''} {self.fipeA or ''}".lower()
        sufixo = str(self.fipeA)
        if "eletrico" in texto or "elétrico" in texto:
            return "Elétrico"
        if "hibrido" in texto or "híbrido" in texto or "hybrid" in texto:
            return "Híbrido"
        if "diesel" in texto or sufixo.endswith("-3"):
            return "Diesel"
        if "gnv" in texto:
            return "GNV"
        if any(p in texto for p in ("alcool", "álcool", "etanol")) or sufixo.endswith("-2"):
            return "Álcool"
        if "flex" in texto:
            return "Flex"
        return "Gasolina"

    def calcular_emissao(self, km=100):
        estrategia = _ESTRATEGIAS.get(self.tipo_combustivel, _ESTRATEGIAS["Gasolina"])
        return estrategia.calc(km, self.cilindrada)


class Manutencao:
    def __init__(self, veiculo, descricao="", origem="REVISAO_KM"):
        if veiculo is None:
            raise ValueError("Veículo é obrigatório para manutenção.")
        self.veiculo = veiculo
        self.descricao = str(descricao or "").strip()
        self.origem = origem
        self.km_revisao = veiculo.quilometragem or 0
        self.status = StatusManutencao.PENDENTE
        self.data_hora = datetime.now()

    def _atualizar_descricao(self, descricao, mensagem_erro):
        if descricao and str(descricao).strip():
            self.descricao = str(descricao).strip()
        if not self.descricao:
            raise ValueError(mensagem_erro)

    def iniciar(self, descricao=""):
        self._atualizar_descricao(
            descricao, "Informe a descrição do serviço para iniciar a manutenção.")
        self.status = StatusManutencao.EM_ANDAMENTO
        self.veiculo.enviar_para_manutencao()

    def finalizar(self, descricao=""):
        self._atualizar_descricao(
            descricao, "Informe a descrição do serviço realizado para finalizar.")
        self.status = StatusManutencao.CONCLUIDA
        self.data_hora = datetime.now()
        self.veiculo.registrar_revisao()