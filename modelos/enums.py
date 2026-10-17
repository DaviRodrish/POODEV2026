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