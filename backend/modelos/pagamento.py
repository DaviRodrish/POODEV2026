
from abc import ABC, abstractmethod
from datetime import datetime


class MetodoPagamentoStrategy(ABC):

    @abstractmethod
    def processar(self, valor: float, destino: str) -> dict:
        pass

class PagamentoPix(MetodoPagamentoStrategy):

    def processar(self, valor: float, chave_pix_destino: str) -> dict:
        if valor <= 0:
            raise ValueError("Valor do pagamento deve ser positivo.")
        if not chave_pix_destino or len(str(chave_pix_destino).strip()) < 3:
            raise ValueError("Chave PIX de destino inválida ou não informada.")

        destino_limpo = str(chave_pix_destino).strip()
        codigo_copia_cola = (
            f"00020126580014BR.GOV.BCB.PIX0136{destino_limpo}"
            f"52040000530398654{valor:.2f}5802BR5913POODEV UENF6006CAMPOS"
        )

        return {
            "sucesso": True,
            "metodo": "PIX",
            "valor": round(float(valor), 2),
            "destino_pix": destino_limpo,
            "codigo_copia_cola": codigo_copia_cola,
            "data_hora": datetime.now().isoformat(),
            "mensagem": "Pagamento via PIX confirmado com sucesso (RF09)."
        }
