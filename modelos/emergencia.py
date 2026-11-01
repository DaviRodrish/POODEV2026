from datetime import datetime
from modelos.enums import Status, StatusLocacao, TipoEmergencia, StatusEmergencia

class EmergenciaError(Exception):
    pass

class Emergencia:
    def __init__(self, locacao, tipo, latitude, longitude, descricao=""):
        if locacao is None:
            raise EmergenciaError("Locacao obrigatoria.")

        if hasattr(locacao, "status") and locacao.status != StatusLocacao.ATIVA:
            raise EmergenciaError("Locacao nao ativa.")

        if isinstance(tipo, TipoEmergencia):
            tipo_val = tipo.value
        elif isinstance(tipo, str) and tipo.strip():
            tipo_val = tipo.strip().upper()
        else:
            raise EmergenciaError("Tipo invalido.")

        try:
            lat = float(latitude)
            lon = float(longitude)
        except (ValueError, TypeError):
            raise EmergenciaError("Coordenadas invalidas.")

        if not (-90.0 <= lat <= 90.0):
            raise EmergenciaError("Latitude invalida.")

        if not (-180.0 <= lon <= 180.0):
            raise EmergenciaError("Longitude invalida.")

        self.locacao = locacao
        self.tipo = tipo_val
        self.latitude = lat
        self.longitude = lon
        self.descricao = str(descricao).strip()
        self.status = StatusEmergencia.ABERTO
        self.data_hora = datetime.now()
        self.seguro_acionado = False
        self.protocolo_seguro = None

    @property
    def localizacao(self):
        return (self.latitude, self.longitude)

    def acionar_seguro(self):
        if self.seguro_acionado:
            raise EmergenciaError("Seguro ja acionado.")

        self.seguro_acionado = True
        carimbo = self.data_hora.strftime("%Y%m%d%H%M%S")
        self.protocolo_seguro = f"SEG-{carimbo}"

        if hasattr(self.locacao, "veic"):
            veic = self.locacao.veic
            if hasattr(veic, "status"):
                veic.status = Status.MANUTENCAO

        return self.protocolo_seguro

    def atender(self):
        if self.status != StatusEmergencia.ABERTO:
            raise EmergenciaError("Chamado nao aberto.")
        self.status = StatusEmergencia.EM_ATENDIMENTO

    def resolver(self):
        if self.status not in (StatusEmergencia.ABERTO, StatusEmergencia.EM_ATENDIMENTO):
            raise EmergenciaError("Status invalido.")
        self.status = StatusEmergencia.RESOLVIDO

    def cancelar(self):
        if self.status == StatusEmergencia.RESOLVIDO:
            raise EmergenciaError("Chamado ja resolvido.")
        self.status = StatusEmergencia.CANCELADO

ChamadoEmergencia = Emergencia
SOS = Emergencia
