from backend.modelos.enums import Status, TipoVeiculo
from backend.modelos.fipe import ServicoFipe
from backend.modelos.veiculo_regras import (
    CAPACIDADE_TANQUE_PADRAO,
    NivelCombustivelError, 
    OdometroError,
    VeiculoStatusError,
    calcular_taxa_reabastecimento,
    extrair_cilindrada,
    validar_nivel,
)


class VeiculoFipe:

    def __init__(self, placa, marca_id, modelo_id, ano_id, dados_fipe: dict):
        if not dados_fipe:
            raise ValueError("Não foi possível validar os dados do veículo na FIPE.")
        self.placa = placa
        self.marca_id = marca_id
        self.modelo_id = modelo_id
        self.ano_id = ano_id
        self.nome_modelo = dados_fipe.get("Modelo")
        self.marca = dados_fipe.get("Marca")
        self.ano_modelo = dados_fipe.get("AnoModelo")
        self.combustivel = dados_fipe.get("Combustivel")
        self.valor_fipe_texto = dados_fipe.get("Valor")
        self.valor_mercado = self._converter_valor_para_float(self.valor_fipe_texto)

    @classmethod
    def consultar(cls, placa, marca_id, modelo_id, ano_id, servico: ServicoFipe = None):
        servico = servico or ServicoFipe()
        dados = servico.consultar_preco(marca_id, modelo_id, ano_id)
        return cls(placa, marca_id, modelo_id, ano_id, dados)

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
        return extrair_cilindrada(self.nome_modelo)

    @staticmethod
    def _converter_valor_para_float(valor_str):
        if not valor_str:
            return 0.0
        limpo = valor_str.replace("R$", "").replace(".", "").replace(",", ".").strip()
        try:
            return float(limpo)
        except ValueError:
            return 0.0

    def __str__(self):
        return (f"Veículo [{self.placa}] - {self.marca} {self.nome_modelo} "
                f"({self.ano_modelo}) | Valor: {self.valor_fipe_texto}")


class Veiculo:

    def __init__(self, placa, marca, modelo, ano, quilometragem, combustivel,
                 valor_mercado, valor_fipe, capacidade_tanque=CAPACIDADE_TANQUE_PADRAO,
                 intervalo_revisao=10000, cilindrada=None, status=Status.DISPONIVEL):
        self.placa = placa
        self.marca = marca
        self.modelo = modelo
        self.ano = ano
        self.combustivel = combustivel
        self.valor_mercado = valor_mercado
        self.valor_fipe = valor_fipe
        self.capacidade_tanque = capacidade_tanque
        self.intervalo_revisao = intervalo_revisao
        self._quilometragem = quilometragem
        self._km_ultima_revisao = (quilometragem // intervalo_revisao) * intervalo_revisao
        self._nivel_combustivel = 1.0
        self._cilindrada = cilindrada
        self._status = Status(status)

    # ---- estado (somente leitura de fora; mudanças só pelos métodos) ----
    @property
    def quilometragem(self):
        return self._quilometragem

    @property
    def nivel_combustivel(self):
        return self._nivel_combustivel

    @property
    def status(self) -> Status:
        return self._status

    @property
    def cilindrada(self) -> float:
        if self._cilindrada is not None:
            return float(self._cilindrada)
        return extrair_cilindrada(self.modelo)

    @property
    def tipo(self) -> TipoVeiculo:
        return TipoVeiculo.NOVO if self._quilometragem <= 10000 else TipoVeiculo.USADO

    # ---- transições de estado (contrato VeiculoLocavel) ----
    def esta_disponivel(self) -> bool:
        return self._status is Status.DISPONIVEL

    def alugar(self):
        if not self.esta_disponivel():
            raise VeiculoStatusError(f"Veículo {self.placa} não está disponível.")
        self._status = Status.LOCADO

    def liberar(self):
        self._status = Status.DISPONIVEL

    def enviar_para_manutencao(self):
        self._status = Status.MANUTENCAO

    # ---- regras ----
    def alerta_fipe(self) -> bool:  # antes: fipeAlert
        if not self.valor_mercado or self.valor_mercado <= 0:
            return False
        return (self.valor_mercado - self.valor_fipe) / self.valor_mercado >= 0.15

    def abastecer(self, nivel):
        self._nivel_combustivel = validar_nivel(nivel)

    def atualizar_quilometragem(self, nova_km):  # antes: at_quilometragem
        if nova_km < self._quilometragem:
            raise OdometroError(
                f"Quilometragem inválida: {nova_km} não pode ser menor que {self._quilometragem}"
            )
        self._quilometragem = int(nova_km)

    def precisa_revisao(self) -> bool:  # antes: rev
        return (self._quilometragem - self._km_ultima_revisao) >= self.intervalo_revisao

    def registrar_revisao(self):  # antes: fazerRev
        self._km_ultima_revisao = self._quilometragem

    def calcular_taxa_reabastecimento(self, nivel_retorno):
        return calcular_taxa_reabastecimento(
            self._nivel_combustivel, nivel_retorno, self.capacidade_tanque
        )

    def emissao(self, km, estrategia) -> float:
        if km < 0:
            raise ValueError("Quilometragem não pode ser negativa")
        return estrategia.calc(km, self.cilindrada)