"""Regras de veículo compartilhadas pela classe de domínio (Veiculo) e pelo ORM
(VeiculoAgenciaModel). Antes cada uma tinha sua cópia, e as cópias divergiam."""
import re
from typing import Protocol

CAPACIDADE_TANQUE_PADRAO = 50.0
PRECO_LITRO = 5.89
MARGEM_REABASTECIMENTO = 1.15
_RE_CILINDRADA = re.compile(r"(\d+[.,]\d+)")


class NivelCombustivelError(ValueError):
    pass


class OdometroError(ValueError):
    pass


class VeiculoStatusError(ValueError):
    pass


class VeiculoLocavel(Protocol):
    """Contrato que a Locacao exige de um veículo (substitui os hasattr)."""

    def esta_disponivel(self) -> bool: ...
    def alugar(self) -> None: ...
    def liberar(self) -> None: ...
    def enviar_para_manutencao(self) -> None: ...


def extrair_cilindrada(nome_modelo) -> float:
    nome = str(nome_modelo or "").lower()
    if "eletrico" in nome or "elétrico" in nome:
        return 0.0
    match = _RE_CILINDRADA.search(nome)
    return float(match.group(1).replace(",", ".")) if match else 1.0


def validar_nivel(nivel) -> float:
    if nivel is None or nivel < 0 or nivel > 1:
        raise NivelCombustivelError(f"Nível de combustível inválido: {nivel}")
    return round(float(nivel), 2)


def calcular_taxa_reabastecimento(nivel_atual, nivel_retorno,
                                  capacidade_tanque=CAPACIDADE_TANQUE_PADRAO) -> dict:
    nivel_retorno = validar_nivel(nivel_retorno)
    if nivel_retorno >= nivel_atual:
        return {"cobrar": False, "taxa": 0.0, "litros_faltantes": 0.0}
    litros = (nivel_atual - nivel_retorno) * capacidade_tanque
    taxa = litros * PRECO_LITRO * MARGEM_REABASTECIMENTO
    return {"cobrar": True, "taxa": round(taxa, 2), "litros_faltantes": round(litros, 1)}