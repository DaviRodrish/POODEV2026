from enum import Enum

class Veiculo(Enum):
    NOVO = "NOVO"
    USADO = "USADO"

class Combustivel(Enum):
    GASOLINA = "GASOLINA"
    ALCOOL = "ALCOOL"
    DIESEL = "DIESEL"
    FLEX = "FLEX"
    ELETRICO = "ELETRICO"
    GNV = "GNV"
    HIBRIDO = "HIBRIDO"

class Status(Enum):
    DISPONIVEL = "DISPONIVEL"
    LOCADO = "LOCADO"
    MANUTENCAO = "MANUTENCAO"

class StatusCliente(Enum):
    ATIVO = "ATIVO"
    BLOQUEADO = "BLOQUEADO"

class StatusLocacao(Enum):
    RESERVADA = "RESERVADA"
    ATIVA = "ATIVA"
    CONCLUIDA = "CONCLUIDA"
    CANCELADA = "CANCELADA"

class TipoEmergencia(Enum):
    PANE_MECANICA = "PANE_MECANICA"
    ACIDENTE = "ACIDENTE"
    ROUBO = "ROUBO"
    OUTRO = "OUTRO"

class StatusEmergencia(Enum):
    ABERTO = "ABERTO"
    EM_ATENDIMENTO = "EM_ATENDIMENTO"
    RESOLVIDO = "RESOLVIDO"
    CANCELADO = "CANCELADO"
