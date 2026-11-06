import requests

class ServicoFipe:
    BASE_URL = "https://parallelum.com.br/fipe/api/v1/carros"

    @staticmethod
    def _requisicao_com_retry(url):
        """Método auxiliar para executar requisições com tratamento de timeout e múltiplas tentativas."""
        for tentativa in range(3):
            try:
                print(f"A contactar a URL (Tentativa {tentativa + 1}): {url}...")
                resposta = requests.get(url, timeout=10)
                if resposta.status_code == 200:
                    return resposta.json()
            except requests.exceptions.Timeout:
                print(f"Aviso: Timeout na tentativa {tentativa + 1} para {url}")
            except Exception as e:
                print(f"Erro detalhado na tentativa {tentativa + 1}: {e}")
        return None

    @classmethod
    def listar_marcas(cls):
        """Retorna apenas as 10 marcas mais populares e utilizadas no Brasil."""
        url = f"{cls.BASE_URL}/marcas"
        dados = cls._requisicao_com_retry(url)
        
        # Lista de palavras-chave das marcas mais comuns no Brasil
        marcas_desejadas = [
            "fiat", "chevrolet", "volkswagen", "toyota", 
            "hyundai", "jeep", "renault", "honda", "nissan", "byd"
        ]
        
        if dados:
            # Filtra a resposta da FIPE mantendo apenas as marcas da nossa lista principal
            marcas_filtradas = [
                m for m in dados 
                if any(desejada in m.get("nome", "").lower() for desejada in marcas_desejadas)
            ]
            if marcas_filtradas:
                return marcas_filtradas
        
        # Fallback de segurança caso a API externa esteja instável
        return [
            {"codigo": "21", "nome": "Fiat"},
            {"codigo": "25", "nome": "Chevrolet"},
            {"codigo": "23", "nome": "Volkswagen"},
            {"codigo": "59", "nome": "Toyota"},
            {"codigo": "26", "nome": "Hyundai"},
            {"codigo": "48", "nome": "Jeep"},
            {"codigo": "44", "nome": "Renault"},
            {"codigo": "25", "nome": "Honda"},
            {"codigo": "41", "nome": "Nissan"},
            {"codigo": "245", "nome": "BYD"}
        ]

    @classmethod
    def listar_modelos(cls, codigo_marca):
        """Retorna os modelos de uma marca específica com fallback."""
        url = f"{cls.BASE_URL}/marcas/{codigo_marca}/modelos"
        dados = cls._requisicao_com_retry(url)
        
        if not dados or "modelos" not in dados:
            return [{"codigo": 1, "nome": "Modelo Padrão (Fallback)"}]
        return dados.get("modelos", [])

    @classmethod
    def listar_anos(cls, codigo_marca, codigo_modelo):
        """Retorna os anos disponíveis para um modelo específico com fallback."""
        url = f"{cls.BASE_URL}/marcas/{codigo_marca}/modelos/{codigo_modelo}/anos"
        dados = cls._requisicao_com_retry(url)
        
        if not dados:
            return [{"codigo": "2024-1", "nome": "2024 Gasolina"}]
        return dados

    @classmethod
    def consultar_preco(cls, codigo_marca, codigo_modelo, codigo_ano):
        """Consulta os detalhes e o valor médio atual do veículo na FIPE."""
        url = f"{cls.BASE_URL}/marcas/{codigo_marca}/modelos/{codigo_modelo}/anos/{codigo_ano}"
        dados = cls._requisicao_com_retry(url)
        return dados