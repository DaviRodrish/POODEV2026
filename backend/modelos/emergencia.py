from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from backend.database.conexao_postgres import Base
from backend.modelos.enums import StatusEmergencia, StatusLocacao, TipoEmergencia


class EmergenciaModel(Base):
    __tablename__ = "emergencias"

    id = Column(Integer, primary_key=True, index=True)
    locacao_id = Column(Integer, nullable=False)
    agencia_id = Column(Integer, nullable=False)  # notifica diretamente a agência dona do carro
    tipo = Column(String(50), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    descricao = Column(Text, nullable=True)
    status = Column(String(30), default=StatusEmergencia.ABERTO.value)
    protocolo_seguro = Column(String(50), nullable=True)
    data_hora = Column(DateTime, default=datetime.now)


class EmergenciaError(Exception):
    pass


class Emergencia:
    _LOCACAO_STATUS_VALIDOS = (StatusLocacao.APROVADA, StatusLocacao.ATIVA)

    def __init__(self, locacao, tipo, latitude, longitude, descricao="", veiculo=None):
        if locacao is None:
            raise EmergenciaError("Locacao obrigatoria.")

        try:
            status_locacao = StatusLocacao(locacao.status)
        except ValueError:
            raise EmergenciaError("Locacao nao ativa.")
        if status_locacao not in self._LOCACAO_STATUS_VALIDOS:
            raise EmergenciaError("Locacao nao ativa.")

        try:
            tipo_enum = TipoEmergencia(tipo.strip().upper() if isinstance(tipo, str) else tipo)
        except ValueError:
            raise EmergenciaError("Tipo invalido.")

        try:
            lat, lon = float(latitude), float(longitude)
        except (ValueError, TypeError):
            raise EmergenciaError("Coordenadas invalidas.")
        if not -90.0 <= lat <= 90.0:
            raise EmergenciaError("Latitude invalida.")
        if not -180.0 <= lon <= 180.0:
            raise EmergenciaError("Longitude invalida.")

        self._locacao = locacao
        self._veiculo = veiculo if veiculo is not None else getattr(locacao, "veic", None)
        self._tipo = tipo_enum
        self._latitude = lat
        self._longitude = lon
        self._descricao = str(descricao).strip()
        self._status = StatusEmergencia.ABERTO
        self._data_hora = datetime.now()
        self._protocolo_seguro = None

    @property
    def locacao(self): return self._locacao
    @property
    def tipo(self): return self._tipo
    @property
    def latitude(self): return self._latitude
    @property
    def longitude(self): return self._longitude
    @property
    def descricao(self): return self._descricao
    @property
    def status(self): return self._status
    @property
    def data_hora(self): return self._data_hora
    @property
    def protocolo_seguro(self): return self._protocolo_seguro

    @property
    def seguro_acionado(self):
        return self._protocolo_seguro is not None

    @property
    def localizacao(self):
        return (self._latitude, self._longitude)

    def acionar_seguro(self):
        if self.seguro_acionado:
            raise EmergenciaError("Seguro ja acionado.")
        self._protocolo_seguro = f"SEG-{self._data_hora.strftime('%Y%m%d%H%M%S')}"
        if self._veiculo is not None:
            self._veiculo.enviar_para_manutencao()
        return self._protocolo_seguro

    def atender(self):
        if self._status is not StatusEmergencia.ABERTO:
            raise EmergenciaError("Chamado nao aberto.")
        self._status = StatusEmergencia.EM_ATENDIMENTO

    def resolver(self):
        if self._status not in (StatusEmergencia.ABERTO, StatusEmergencia.EM_ATENDIMENTO):
            raise EmergenciaError("Status invalido.")
        self._status = StatusEmergencia.RESOLVIDO

    def cancelar(self):
        if self._status is StatusEmergencia.RESOLVIDO:
            raise EmergenciaError("Chamado ja resolvido.")
        self._status = StatusEmergencia.CANCELADO


ChamadoEmergencia = Emergencia
SOS = Emergencia