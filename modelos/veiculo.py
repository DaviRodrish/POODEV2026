import datetime
from modelos.enums import Combustivel, Status, Veiculo as TipoVeiculo

class OdometroError(Exception):
    pass

class NivelCombustivelError(Exception):
    pass

class ValorFipeError(Exception):
    pass

class Veiculo:
    def __init__(self, placa, marca, modelo, ano, quilometragem, combustivel, fipeP, fipeA):
        self.placa = placa
        self.marca = marca
        self.modelo = modelo
        self.ano = ano
        self.status = Status.DISPONIVEL

        if fipeP <= 0 or fipeA <= 0:
            raise ValorFipeError("Valor da fipe tem que ser maior que 0")
        self.fipeP = fipeP
        self.fipeA = fipeA

        self.combustivel = 1.0

        if quilometragem < 0:
            raise OdometroError("Quilometragem tem que ser maior/igual que 0")
        self._quilometragem = quilometragem

    @property
    def quilometragem(self):
        return self._quilometragem

    def at_quilometragem(self, n_km):
        if n_km < self.quilometragem:
            raise OdometroError("Quilometragem tem que ser maior que atual")
        self._quilometragem = n_km

    def abastecer(self, nivel):
        if nivel < 0 or nivel > 1:
            raise NivelCombustivelError("Combustivel tem que ser entre 0 e 1")
        self.combustivel = nivel

    @property
    def tipo(self):
        ano = datetime.datetime.now().year
        if self.ano == ano and self.quilometragem < 5000:
            return TipoVeiculo.NOVO
        else:
            return TipoVeiculo.USADO

    def deprec(self):
        diff = self.fipeP - self.fipeA
        return diff / self.fipeP

    def fipeAlert(self):
        return self.deprec() >= 0.15