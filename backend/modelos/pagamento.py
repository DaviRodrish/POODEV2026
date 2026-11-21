from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class Pagamento:
    """Comprovante imutável de um pagamento (substitui o dict solto)."""

    metodo: str
    valor: float
    destino: str
    codigo_copia_cola: str
    data_hora: datetime
    mensagem: str
    sucesso: bool = True

    def to_dict(self) -> dict:
        return {
            "sucesso": self.sucesso,
            "metodo": self.metodo,
            "valor": self.valor,
            "destino": self.destino,
            "destino_pix": self.destino,  # compatibilidade com o formato antigo
            "codigo_copia_cola": self.codigo_copia_cola,
            "data_hora": self.data_hora.isoformat(),
            "mensagem": self.mensagem,
        }


class MetodoPagamentoStrategy(ABC):
    @abstractmethod
    def processar(self, valor: float, destino: str) -> Pagamento:
        ...


class PagamentoPix(MetodoPagamentoStrategy):
    def processar(self, valor: float, destino: str) -> Pagamento:
        if valor <= 0:
            raise ValueError("Valor do pagamento deve ser positivo.")
        if not destino or len(str(destino).strip()) < 3:
            raise ValueError("Chave PIX de destino inválida ou não informada.")

        destino_limpo = str(destino).strip()
        codigo = (
            f"00020126580014BR.GOV.BCB.PIX0136{destino_limpo}"
            f"52040000530398654{valor:.2f}5802BR5913POODEV UENF6006CAMPOS"
        )
        return Pagamento(
            metodo="PIX",
            valor=round(float(valor), 2),
            destino=destino_limpo,
            codigo_copia_cola=codigo,
            data_hora=datetime.now(),
            mensagem="Pagamento via PIX confirmado com sucesso (RF09).",
        )