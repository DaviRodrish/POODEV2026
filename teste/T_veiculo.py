import pytest
from modelos.enums import Combustivel, Veiculo as TipoVeiculo
from modelos.veiculo import NivelCombustivelError, OdometroError, Veiculo


def test_tipo():
    gol = Veiculo(
        "KXZ1A23",
        "VW",
        "Gol",
        2014,
        110000,
        Combustivel.FLEX,
        36000,
        33800,
    )
    assert gol.tipo == TipoVeiculo.USADO

def test_odometro():
    celta = Veiculo(
        "LST4B56",
        "GM",
        "Celta",
        2012,
        95000,
        Combustivel.FLEX,
        25500,
        24000,
    )
    celta.at_quilometragem(96000)
    assert celta.quilometragem == 96000

    with pytest.raises(OdometroError):
        celta.at_quilometragem(90000)

def test_fipe():
    ecosport = Veiculo(
        "RIO2C78",
        "Ford",
        "EcoSport",
        2015,
        85000,
        Combustivel.FLEX,
        63000,
        53400,
    )
    assert ecosport.fipeAlert() is True

def test_combustivel():
    gol = Veiculo(
        "KXZ1A23",
        "VW",
        "Gol",
        2014,
        110000,
        Combustivel.FLEX,
        36000,
        33800,
    )
    with pytest.raises(NivelCombustivelError):
        gol.abastecer(1.2)