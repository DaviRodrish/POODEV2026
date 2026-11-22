class CPFError(Exception):
    pass


class CPF:

    def __init__(self, valor):
        if not isinstance(valor, str):
            raise CPFError("CPF deve ser string.")

        num = valor.replace(".", "").replace("-", "").strip()
        if len(num) != 11 or not num.isdigit():
            raise CPFError("CPF deve ter 11 dígitos.")
        if num == num[0] * 11:
            raise CPFError("CPF inválido.")

        d1 = self._calcular_digito(num[:9], 10)
        d2 = self._calcular_digito(num[:9] + str(d1), 11)
        if num[9:] != f"{d1}{d2}":
            raise CPFError("CPF inválido.")

        self._numero = num

    @staticmethod
    def _calcular_digito(texto, peso):
        soma = 0
        for letra in texto:
            soma += int(letra) * peso
            peso -= 1
        resto = (soma * 10) % 11
        return 0 if resto == 10 else resto

    @property
    def numero(self):
        return self._numero

    def formatado(self):
        n = self._numero
        return f"{n[:3]}.{n[3:6]}.{n[6:9]}-{n[9:]}"

    def __eq__(self, outro):
        return isinstance(outro, CPF) and self._numero == outro.numero

    def __hash__(self):
        return hash(self._numero)

    def __str__(self):
        return self.formatado()

    def __repr__(self):
        return f"CPF('{self.formatado()}')"