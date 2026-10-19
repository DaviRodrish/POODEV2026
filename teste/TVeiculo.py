import pytest
from modelos.enums import Combustivel, Veiculo as TipoVeiculo
from modelos.veiculo import NivelCombustivelError, OdometroError, Veiculo
from modelos.emissao import Eletrico, Hibrido, Alcool, GNV, Flex, Gasolina, Diesel


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

def test_rev():
    gol = Veiculo("ABC1234", "VW", "Gol", 2020, 8000, Combustivel.FLEX, 30000, 28000)
    assert gol.rev() is False

    gol.at_quilometragem(10500)
    assert gol.rev() is True

    gol.fazerRev()
    assert gol.rev() is False

def test_emissao():
    ecosport = Veiculo("RIO2C78", "Ford", "EcoSport", 2015, 85000, Combustivel.GASOLINA, 63000, 53400)
    assert ecosport.emissao(100, Gasolina()) == 18.0
    assert ecosport.emissao(100, Alcool()) == 13.0
    assert ecosport.emissao(100, Diesel()) == 25.0
    assert ecosport.emissao(100, Flex()) == 15.0
    assert ecosport.emissao(100, GNV()) == 12.0
    assert ecosport.emissao(100, Hibrido()) == 8.0
    assert ecosport.emissao(500, Eletrico()) == 0.0

    with pytest.raises(ValueError):
        ecosport.emissao(-50, Gasolina())