from abc import ABC, abstractmethod

class Emissao(ABC):
    @abstractmethod
    def calc(self, km):
        pass

class Eletrico(Emissao):
    def calc(self, km):
        if km < 0:
            raise ValueError("KM tem que ser maior/igual que 0")
        return 0.0

class Gasolina(Emissao):
    def calc(self, km):
        if km < 0:
            raise ValueError("KM tem que ser maior/igual que 0")
        return km * 0.18

class Diesel(Emissao):
    def calc(self, km):
        if km < 0:
            raise ValueError("KM tem que ser maior/igual que 0")
        return km * 0.25

class Alcool(Emissao):
    def calc(self, km):
        if km < 0:
            raise ValueError("KM tem que ser maior/igual que 0")
        return km * 0.13

class Flex(Emissao):
    def calc(self, km):
        if km < 0:
            raise ValueError("KM tem que ser maior/igual que 0")
        return km * 0.15

class GNV(Emissao):
    def calc(self, km):
        if km < 0:
            raise ValueError("KM tem que ser maior/igual que 0")
        return km * 0.12

class Hibrido(Emissao):
    def calc(self, km):
        if km < 0:
            raise ValueError("KM tem que ser maior/igual que 0")
        return km * 0.08
    