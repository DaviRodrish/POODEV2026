from enum import Enum


class _StrEnum(str, Enum):
    """Enum que também é str: StatusLocacao.ATIVA == "ATIVA".

    Assim o mesmo enum serve para o domínio e para as colunas String do ORM,
    sem precisar de conversões nem de comparações misturando str e enum.
    """

    def __str__(self):
        return self.value


class TipoVeiculo(_StrEnum):  # antes: "Veiculo" (conflitava com a classe Veiculo)
    NOVO = "NOVO"
    USADO = "USADO"


class Combustivel(_StrEnum):
    GASOLINA = "GASOLINA"
    ALCOOL = "ALCOOL"
    DIESEL = "DIESEL"
    FLEX = "FLEX"
    ELETRICO = "ELETRICO"
    GNV = "GNV"
    HIBRIDO = "HIBRIDO"


class Status(_StrEnum):
    DISPONIVEL = "DISPONIVEL"
    LOCADO = "LOCADO"
    MANUTENCAO = "MANUTENCAO"


class StatusCliente(_StrEnum):
    ATIVO = "ATIVO"
    BLOQUEADO = "BLOQUEADO"


class StatusLocacao(_StrEnum):
    # estados do fluxo de aprovação/pagamento (antes só existiam como strings soltas)
    PENDENTE = "PENDENTE"
    APROVADA = "APROVADA"
    AGUARDANDO_CONFIRMACAO = "AGUARDANDO_CONFIRMACAO"
    RECUSADA = "RECUSADA"
    # estados do ciclo de vida da locação
    RESERVADA = "RESERVADA"
    ATIVA = "ATIVA"
    CONCLUIDA = "CONCLUIDA"
    CANCELADA = "CANCELADA"


class TipoEmergencia(_StrEnum):
    PANE_MECANICA = "PANE_MECANICA"
    ACIDENTE = "ACIDENTE"
    ROUBO = "ROUBO"
    OUTRO = "OUTRO"


class StatusEmergencia(_StrEnum):
    ABERTO = "ABERTO"
    EM_ATENDIMENTO = "EM_ATENDIMENTO"
    AGUARDANDO_CLIENTE = "AGUARDANDO_CLIENTE"
    RESOLVIDO = "RESOLVIDO"
    CANCELADO = "CANCELADO"


class StatusManutencao(_StrEnum):
    PENDENTE = "PENDENTE"
    EM_ANDAMENTO = "EM_ANDAMENTO"
    CONCLUIDA = "CONCLUIDA"