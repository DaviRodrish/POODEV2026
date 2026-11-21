class CNPJError(Exception):
    pass


class CNPJ:
    """Value object imutável: valida tamanho, repetição e dígitos verificadores."""

    _PESOS_1 = (5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)
    _PESOS_2 = (6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2)

    def __init__(self, numero):
        if not isinstance(numero, str):
            raise CNPJError("CNPJ deve ser string.")

        num = "".join(c for c in numero if c.isdigit())
        if len(num) != 14 or num == num[0] * 14:
            raise CNPJError("CNPJ inválido.")

        d1 = self._calcular_digito(num[:12], self._PESOS_1)
        d2 = self._calcular_digito(num[:12] + str(d1), self._PESOS_2)
        if num[12:] != f"{d1}{d2}":
            raise CNPJError("CNPJ inválido.")

        self._numero = num

    @staticmethod
    def _calcular_digito(base, pesos):
        soma = sum(int(d) * p for d, p in zip(base, pesos))
        resto = soma % 11
        return 0 if resto < 2 else 11 - resto

    @property
    def numero(self):
        return self._numero

    def formatado(self):
        n = self._numero
        return f"{n[:2]}.{n[2:5]}.{n[5:8]}/{n[8:12]}-{n[12:]}"

    def __eq__(self, outro):
        return isinstance(outro, CNPJ) and self._numero == outro.numero

    def __hash__(self):
        return hash(self._numero)

    def __str__(self):
        return self.formatado()

    def __repr__(self):
        return f"CNPJ('{self.formatado()}')"