class CPFError(Exception):
    pass

class CPF:
    def __init__(self, val):
        if not isinstance(val, str):
            raise CPFError("Erro")
        
        num = val.replace(".", "").replace("-", "").strip()
        if len(num) != 11 or not num.isdigit():
            raise CPFError("Erro")

        if num == num[0] * 11: 
            raise CPFError("Erro")

        d1 = self.calc(num[:9], 10)
        d2 = self.calc(num[:9] + str(d1), 11)

        if num[9:] != f"{d1}{d2}":
            raise CPFError("Erro")

        self._numero = num

    def calc(self, texto, peso):
        soma = 0
        for letra in texto:
            soma += int(letra) * peso
            peso -= 1
        resto = (soma * 10) % 11
        if resto == 10:
            resto = 0
        return resto

    @property
    def numero(self):
        return self._numero

    def formatado(self):
        n = self._numero
        return f"{n[:3]}.{n[3:6]}.{n[6:9]}-{n[9:]}"

    def __eq__(self, outro):
        if isinstance(outro, CPF):
            return self._numero == outro.numero
        return False