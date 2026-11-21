from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String

from backend.database.conexao_postgres import Base
from backend.modelos.cnh import CNH
from backend.modelos.condutor import Condutor
from backend.modelos.enums import StatusLocacao
from backend.modelos.veiculo_regras import VeiculoLocavel

_STATUS_PAGAMENTO = {
    StatusLocacao.ATIVA: "PAGO",
    StatusLocacao.CONCLUIDA: "PAGO",
    StatusLocacao.AGUARDANDO_CONFIRMACAO: "AGUARDANDO_CONFIRMACAO",
    StatusLocacao.APROVADA: "PAGAMENTO_PENDENTE",
    StatusLocacao.PENDENTE: "AGUARDANDO_APROVACAO",
    StatusLocacao.RECUSADA: "RECUSADA",
}


class LocacaoModel(Base):
    __tablename__ = "locacoes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    veiculo_id = Column(Integer, ForeignKey("veiculos.id"), nullable=False)
    agencia_id = Column(Integer, ForeignKey("agencias.id"), nullable=False)
    dias_contratados = Column(Integer, nullable=False, default=1)
    valor_estimado = Column(Float, default=0.0)
    motorista_secundario = Column(Boolean, default=False)
    motorista_nome = Column(String(150), nullable=True)
    motorista_cnh = Column(String, nullable=True)
    outra_agencia = Column(Boolean, default=False)
    agencia_destino = Column(String(150), nullable=True)

    status = Column(String(30), default=StatusLocacao.PENDENTE.value)
    ativa = Column(Boolean, default=True)
    data_criacao = Column(DateTime, default=datetime.now)

    @property
    def status_pagamento(self):
        try:
            return _STATUS_PAGAMENTO.get(StatusLocacao(self.status), self.status)
        except ValueError:
            return self.status


class ErroLocacao(Exception):
    pass


class Locacao:
    def __init__(self, cli: Condutor, veic: VeiculoLocavel, ini, fim, diaria, ori, dest, taxa=150.0):
        if fim < ini:
            raise ErroLocacao("Datas invalidas.")
        if diaria < 0:
            raise ErroLocacao("Diaria negativa.")
        if taxa < 0:
            raise ErroLocacao("Taxa negativa.")
        if not cli.pode_alugar():
            raise ErroLocacao("Cliente bloqueado.")
        if not veic.esta_disponivel():
            raise ErroLocacao("Veiculo indisponivel.")

        cnh = cli.obter_cnh()
        if cnh is not None:  # CNH do titular é opcional no cadastro
            self._validar_cnh(cnh, fim)

        self._cli = cli
        self._veic = veic
        self._ini = ini
        self._fim = fim
        self._diaria = float(diaria)
        self._ori = str(ori).strip()
        self._dest = str(dest).strip()
        self._taxa = float(taxa)
        self._status = StatusLocacao.RESERVADA
        self._km_saida = None
        self._km_volta = None
        self._motoristas_secundarios = []

    # ---- leitura ----
    @property
    def cli(self): return self._cli
    @property
    def veic(self): return self._veic
    @property
    def veiculo(self): return self._veic
    @property
    def ini(self): return self._ini
    @property
    def fim(self): return self._fim
    @property
    def diaria(self): return self._diaria
    @property
    def ori(self): return self._ori
    @property
    def dest(self): return self._dest
    @property
    def taxa(self): return self._taxa
    @property
    def status(self): return self._status
    @property
    def km_saida(self): return self._km_saida
    @property
    def km_volta(self): return self._km_volta

    @property
    def motoristas_secundarios(self):
        return tuple(self._motoristas_secundarios)

    @property
    def motorista_secundario(self):
        return self._motoristas_secundarios[0] if self._motoristas_secundarios else None

    @property
    def qtd_dias(self):
        dias = (self._fim - self._ini).days
        return dias if dias > 0 else 1

    @property
    def taxa_extra(self):
        return self._taxa if self._ori.upper() != self._dest.upper() else 0.0

    def total(self):
        return (self.qtd_dias * self._diaria) + self.taxa_extra

    # ---- regras ----
    @staticmethod
    def _validar_cnh(cnh: CNH, data_ref, categoria="B"):
        if not cnh.esta_valida(data_ref):
            raise ErroLocacao("CNH vencida.")
        if not cnh.permite_categoria(categoria):
            raise ErroLocacao("Categoria incompativel.")

    def _exigir_status(self, esperado: StatusLocacao, mensagem: str):
        if self._status is not esperado:
            raise ErroLocacao(mensagem)

    # ---- transições de estado: o veículo muda por métodos, não por atribuição ----
    def retirar(self, km):
        self._exigir_status(StatusLocacao.RESERVADA, "Locacao nao reservada.")
        if km < 0:
            raise ErroLocacao("KM negativo.")
        self._veic.alugar()
        self._km_saida = float(km)
        self._status = StatusLocacao.ATIVA

    def devolver(self, km):
        self._exigir_status(StatusLocacao.ATIVA, "Locacao nao ativa.")
        if self._km_saida is not None and km < self._km_saida:
            raise ErroLocacao("KM menor que saida.")
        self._km_volta = float(km)
        self._status = StatusLocacao.CONCLUIDA
        self._veic.liberar()

    def cancelar(self):
        self._exigir_status(StatusLocacao.RESERVADA, "Locacao nao reservada.")
        self._status = StatusLocacao.CANCELADA
        self._veic.liberar()

    def adicionar_motorista_secundario(self, motorista: Condutor, categoria="B"):
        self._exigir_status(StatusLocacao.RESERVADA, "Locacao nao reservada.")
        if not motorista.pode_alugar():
            raise ErroLocacao("Motorista bloqueado.")
        if motorista.cpf == self._cli.cpf:
            raise ErroLocacao("Motorista e o titular.")
        if any(m.cpf == motorista.cpf for m in self._motoristas_secundarios):
            raise ErroLocacao("Motorista ja cadastrado.")

        cnh = motorista.obter_cnh()
        if cnh is None:
            raise ErroLocacao("CNH ausente.")
        self._validar_cnh(cnh, self._fim, categoria)

        self._motoristas_secundarios.append(motorista)