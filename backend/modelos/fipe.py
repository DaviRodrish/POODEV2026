import logging

import requests

log = logging.getLogger(__name__)

MARCAS_DESEJADAS = (
    "fiat", "chevrolet", "volkswagen", "toyota",
    "hyundai", "jeep", "renault", "honda", "nissan", "byd",
)

MARCAS_FALLBACK = [
    {"codigo": "21", "nome": "Fiat"},
    {"codigo": "25", "nome": "Chevrolet"},
    {"codigo": "23", "nome": "Volkswagen"},
    {"codigo": "59", "nome": "Toyota"},
    {"codigo": "26", "nome": "Hyundai"},
    {"codigo": "48", "nome": "Jeep"},
    {"codigo": "44", "nome": "Renault"},
    {"codigo": "25", "nome": "Honda"},  # TODO: mesmo código de Chevrolet, conferir na FIPE
    {"codigo": "41", "nome": "Nissan"},
    {"codigo": "245", "nome": "BYD"},
]


class ServicoFipe:
    """Cliente da API FIPE.

    Agora é uma instância: o `http_get` pode ser trocado por um mock nos testes
    e quem usa o serviço o recebe por injeção de dependência.
    """

    BASE_URL = "https://parallelum.com.br/fipe/api/v1/carros"
    TENTATIVAS = 3

    def __init__(self, http_get=requests.get, base_url=BASE_URL, timeout=10):
        self._http_get = http_get
        self._base_url = base_url
        self._timeout = timeout

    def _requisicao_com_retry(self, url):
        for tentativa in range(1, self.TENTATIVAS + 1):
            try:
                log.debug("FIPE GET %s (tentativa %d)", url, tentativa)
                resposta = self._http_get(url, timeout=self._timeout)
                if resposta.status_code == 200:
                    return resposta.json()
                log.warning("FIPE respondeu %s em %s", resposta.status_code, url)
            except requests.exceptions.Timeout:
                log.warning("Timeout na tentativa %d para %s", tentativa, url)
            except Exception:
                log.exception("Erro na tentativa %d para %s", tentativa, url)
        return None

    def listar_marcas(self):
        dados = self._requisicao_com_retry(f"{self._base_url}/marcas")
        if dados:
            filtradas = [
                m for m in dados
                if any(d in m.get("nome", "").lower() for d in MARCAS_DESEJADAS)
            ]
            if filtradas:
                return filtradas
        return list(MARCAS_FALLBACK)

    def listar_modelos(self, codigo_marca):
        dados = self._requisicao_com_retry(f"{self._base_url}/marcas/{codigo_marca}/modelos")
        if not dados or "modelos" not in dados:
            return [{"codigo": 1, "nome": "Modelo Padrão (Fallback)"}]
        return dados["modelos"]

    def listar_anos(self, codigo_marca, codigo_modelo):
        url = f"{self._base_url}/marcas/{codigo_marca}/modelos/{codigo_modelo}/anos"
        dados = self._requisicao_com_retry(url)
        return dados or [{"codigo": "2024-1", "nome": "2024 Gasolina"}]

    def consultar_preco(self, codigo_marca, codigo_modelo, codigo_ano):
        url = f"{self._base_url}/marcas/{codigo_marca}/modelos/{codigo_modelo}/anos/{codigo_ano}"
        return self._requisicao_com_retry(url)