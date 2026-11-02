import requests

class ServicoFipe:
    # Alterado de 'cars' para 'carros' para aceitar o formato correto da API
    BASE_URL = "https://parallelum.com.br/fipe/api/v1/carros"

    @staticmethod
    def listar_marcas():
        """Retorna a lista de marcas de carros disponíveis."""
        try:
            url = f"{ServicoFipe.BASE_URL}/marcas"
            print(f"A contactar a URL: {url}...")
            
            resposta = requests.get(url, timeout=5)
            print(f"Status Code recebido: {resposta.status_code}")
            
            if resposta.status_code == 200:
                return resposta.json()
            else:
                print(f"Conteúdo da resposta com erro: {resposta.text}")
        except requests.exceptions.Timeout:
            print("Erro: A ligação à API da FIPE excedeu o tempo limite (Timeout).")
        except Exception as e:
            print(f"Erro detalhado ao ligar à API da FIPE (marcas): {e}")
        return []

    @staticmethod
    def listar_modelos(codigo_marca):
        """Retorna os modelos de uma marca específica."""
        try:
            url = f"{ServicoFipe.BASE_URL}/marcas/{codigo_marca}/modelos"
            resposta = requests.get(url, timeout=5)
            if resposta.status_code == 200:
                return resposta.json().get("modelos", [])
        except Exception as e:
            print(f"Erro ao ligar à API da FIPE (modelos): {e}")
        return []

    @staticmethod
    def listar_anos(codigo_marca, codigo_modelo):
        """Retorna os anos disponíveis para um modelo específico."""
        try:
            url = f"{ServicoFipe.BASE_URL}/marcas/{codigo_marca}/modelos/{codigo_modelo}/anos"
            resposta = requests.get(url, timeout=5)
            if resposta.status_code == 200:
                return resposta.json()
        except Exception as e:
            print(f"Erro ao ligar à API da FIPE (anos): {e}")
        return []

    @staticmethod
    def consultar_preco(codigo_marca, codigo_modelo, codigo_ano):
        """Consulta os detalhes e o valor médio atual do veículo na FIPE."""
        try:
            url = f"{ServicoFipe.BASE_URL}/marcas/{codigo_marca}/modelos/{codigo_modelo}/anos/{codigo_ano}"
            resposta = requests.get(url, timeout=5)
            if resposta.status_code == 200:
                return resposta.json()
        except Exception as e:
            print(f"Erro ao consultar o valor FIPE: {e}")
        return None