from modelos.enums import Combustivel
from modelos.veiculo import Veiculo

v = Veiculo("ABC1234", "VW", "Gol", 2014, 100000, Combustivel.FLEX, 35000, 30000)

print(v.status)
print(v.tipo)
print(v.deprec())
print(v.fipeAlert())

v.at_quilometragem(105000)
print(v.quilometragem)

v.abastecer(0.5)
print(v.combustivel)