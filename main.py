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

from modelos.cliente import Cliente

print("\n--- TESTE CLIENTE ---")
c = Cliente("Davi", "davi@email.com", "529.982.247-25", "12345678900")
print("Cliente:", c.nome)
print("CPF:", c.cpf.formatado())
print("CNH:", c.cnh)
print("Status:", c.status)
print("Pode alugar?", c.pode_alugar())

c.bloquear("Documento pendente")
print("Apos bloqueio:", c.status, "| Motivo:", c.motivo)
print("Pode alugar?", c.pode_alugar())

c.desbloquear()
print("Apos desbloqueio:", c.status)
print("Pode alugar?", c.pode_alugar())