from modelos.fipe import ServicoFipe

class VeiculoModel:
    def __init__(self, placa, marca_id, modelo_id, ano_id):
        self.placa = placa
        self.marca_id = marca_id
        self.modelo_id = modelo_id
        self.ano_id = ano_id

        # Busca automática dos dados oficiais na FIPE ao instanciar o veículo
        dados_fipe = ServicoFipe.consultar_preco(marca_id, modelo_id, ano_id)

        if dados_fipe:
            self.nome_modelo = dados_fipe.get("Modelo")
            self.marca = dados_fipe.get("Marca")
            self.ano_modelo = dados_fipe.get("AnoModelo")
            self.combustivel = dados_fipe.get("Combustivel")
            self.valor_fipe_texto = dados_fipe.get("Valor") # Ex: "R$ 45.890,00"
            self.valor_mercado = self._converter_valor_para_float(self.valor_fipe_texto)
        else:
            raise ValueError("Não foi possível validar os dados do veículo na FIPE.")

    def _converter_valor_para_float(self, valor_str):
        """Converte a string de moeda da FIPE para float para uso em cálculos."""
        if not valor_str:
            return 0.0
        limpo = valor_str.replace("R$", "").replace(".", "").replace(",", ".").strip()
        try:
            return float(limpo)
        except ValueError:
            return 0.0

    def __str__(self):
        return f"Veículo [{self.placa}] - {self.marca} {self.nome_modelo} ({self.ano_modelo}) | Valor: {self.valor_fipe_texto}"