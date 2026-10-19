from modelos.enums import Combustivel
from modelos.veiculo import Veiculo
from modelos.emissao import Flex

v = Veiculo("ABC1234", "VW", "Gol", 2014, 100000, Combustivel.FLEX, 35000, 30000)

print(v.status)
print(v.tipo)
print(v.deprec())
print(v.fipeAlert())

v.at_quilometragem(105000)
print(v.quilometragem)

v.abastecer(0.5)
print(v.combustivel)

poluicao = v.emissao(327, Flex())
print(poluicao)

from modelos.cliente import Cliente

print("\n TESTE CLIENTE ")
c = Cliente("Davi", "davi@email.com", "529.982.247-25", "12345678900")
print(c.nome)
print(c.cpf.formatado())
print(c.cnh)
print(c.status)
print(c.pode_alugar())

c.bloquear("Documento pendente")
print(c.status, c.motivo)
print(c.pode_alugar())

c.desbloquear()
print(c.status)
print(c.pode_alugar())


print("\n")
c = Cliente("Paulo", "PauloF@email.com", "06421522769", "12345678800")
print(c.nome)
print(c.cpf.formatado())
print(c.cnh)
print(c.status)
print(c.pode_alugar())

c.bloquear("Violou Termos de Uso")
print(c.status, c.motivo)
print(c.pode_alugar())

c.desbloquear()
print(c.status)
print(c.pode_alugar())