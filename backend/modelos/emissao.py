from abc import ABC

class Emissao(ABC):
    taxa_base = 0.0

    def calc(self, km, cilindrada=1.0):
        if km < 0:
            raise ValueError("KM tem que ser maior/igual que 0")
        if cilindrada < 0:
            raise ValueError("Cilindrada tem que ser maior/igual que 0")
        
        return round(float(km) * self.taxa_base * float(cilindrada), 2)


class Eletrico(Emissao):
    taxa_base = 0.0


class Gasolina(Emissao):
    taxa_base = 0.18


class Diesel(Emissao):
    taxa_base = 0.25


class Alcool(Emissao):
    taxa_base = 0.13


class Flex(Emissao):
    taxa_base = 0.15


class GNV(Emissao):
    taxa_base = 0.12


class Hibrido(Emissao):
    taxa_base = 0.08
