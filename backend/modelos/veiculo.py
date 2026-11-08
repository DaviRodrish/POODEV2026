import re
from backend.modelos.fipe import ServicoFipe

class NivelCombustivelError(ValueError):
    pass

class OdometroError(ValueError):
    pass

class VeiculoModel:
    def __init__(self, placa, marca_id, modelo_id, ano_id):
        self.placa = placa
        self.marca_id = marca_id
        self.modelo_id = modelo_id
        self.ano_id = ano_id

        dados_fipe = ServicoFipe.consultar_preco(marca_id, modelo_id, ano_id)

        if dados_fipe:
            self.nome_modelo = dados_fipe.get("Modelo")
            self.marca = dados_fipe.get("Marca")
            self.ano_modelo = dados_fipe.get("AnoModelo")
            self.combustivel = dados_fipe.get("Combustivel")
            self.valor_fipe_texto = dados_fipe.get("Valor")
            self.valor_mercado = self._converter_valor_para_float(self.valor_fipe_texto)
        else:
            raise ValueError("Não foi possível validar os dados do veículo na FIPE.")

    @property
    def marca_nome(self):
        return self.marca or "Marca FIPE"

    @property
    def modelo_nome(self):
        return self.nome_modelo or "Modelo FIPE"

    @property
    def ano_nome(self):
        return str(self.ano_modelo) if self.ano_modelo else "Ano FIPE"

    @property
    def cilindrada(self) -> float:
        nome = str(self.nome_modelo or "").lower()
        if "eletrico" in nome or "elétrico" in nome:
            return 0.0
        match = re.search(r"(\d+\.\d+)", nome)
        if match:
            return float(match.group(1))
        return 1.0

    def _converter_valor_para_float(self, valor_str):
        if not valor_str:
            return 0.0
        limpo = valor_str.replace("R$", "").replace(".", "").replace(",", ".").strip()
        try:
            return float(limpo)
        except ValueError:
            return 0.0

    def __str__(self):
        return f"Veículo [{self.placa}] - {self.marca} {self.nome_modelo} ({self.ano_modelo}) | Valor: {self.valor_fipe_texto}"


class Veiculo:
    def __init__(
        self,
        placa,
        marca,
        modelo,
        ano,
        quilometragem,
        combustivel,
        valor_mercado,
        valor_fipe,
        capacidade_tanque=50.0,
        intervalo_revisao=10000,
        cilindrada=None
    ):
        self.placa = placa
        self.marca = marca
        self.modelo = modelo
        self.ano = ano
        self._quilometragem = quilometragem
        self.combustivel = combustivel
        self.valor_mercado = valor_mercado
        self.valor_fipe = valor_fipe
        self.capacidade_tanque = capacidade_tanque
        self.intervalo_revisao = intervalo_revisao
        self._km_ultima_revisao = (quilometragem // intervalo_revisao) * intervalo_revisao
        self._nivel_combustivel = 1.0
        self._cilindrada = cilindrada

    @property
    def quilometragem(self):
        return self._quilometragem

    @property
    def nivel_combustivel(self):
        return self._nivel_combustivel

    @property
    def cilindrada(self) -> float:
        if self._cilindrada is not None:
            return float(self._cilindrada)
        nome = str(self.modelo or "").lower()
        if "eletrico" in nome or "elétrico" in nome:
            return 0.0
        match = re.search(r"(\d+\.\d+)", nome)
        if match:
            return float(match.group(1))
        return 1.0

    @property
    def tipo(self):
        from backend.modelos.enums import Veiculo as TipoVeiculo
        return TipoVeiculo.NOVO if self._quilometragem <= 10000 else TipoVeiculo.USADO

    def fipeAlert(self) -> bool:
        if not self.valor_mercado or self.valor_mercado <= 0:
            return False
        desvalorizacao = (self.valor_mercado - self.valor_fipe) / self.valor_mercado
        return desvalorizacao >= 0.15

    def abastecer(self, nivel):
        if nivel < 0 or nivel > 1:
            raise NivelCombustivelError(f"Nível de combustível inválido: {nivel}")
        self._nivel_combustivel = round(float(nivel), 2)

    def at_quilometragem(self, nova_km):
        if nova_km < self._quilometragem:
            raise OdometroError(f"Quilometragem inválida: {nova_km} não pode ser menor que {self._quilometragem}")
        self._quilometragem = int(nova_km)

    def rev(self):
        return (self._quilometragem - self._km_ultima_revisao) >= self.intervalo_revisao

    def fazerRev(self):
        self._km_ultima_revisao = self._quilometragem

    def calcular_taxa_reabastecimento(self, nivel_retorno):
        if nivel_retorno < 0 or nivel_retorno > 1:
            raise NivelCombustivelError("Nível de retorno deve ser entre 0 e 1")
        if nivel_retorno >= self._nivel_combustivel:
            return {"cobrar": False, "taxa": 0.0, "litros_faltantes": 0.0}
        
        litros = (self._nivel_combustivel - nivel_retorno) * self.capacidade_tanque
        taxa = (litros * 5.89) * 1.15
        return {"cobrar": True, "taxa": round(taxa, 2), "litros_faltantes": round(litros, 1)}

    def emissao(self, km, estrategia) -> float:
        if km < 0:
            raise ValueError("Quilometragem não pode ser negativa")
        return estrategia.calc(km, self.cilindrada)
