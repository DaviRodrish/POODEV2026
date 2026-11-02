from datetime import date

class CNHError(Exception):
    pass

class CNH:
    CATEGORIAS_VALIDAS = {"A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"}

    def __init__(self, numero, categoria="B", validade=None):
        if not isinstance(numero, str):
            raise CNHError("CNH deve ser string.")

        num = numero.replace(" ", "").replace(".", "").replace("-", "").strip()
        if len(num) != 11 or not num.isdigit():
            raise CNHError("CNH deve ter 11 digitos.")

        if num == num[0] * 11:
            raise CNHError("CNH invalida.")

        d1, d2 = self.calc_dv(num[:9])
        if num[9:] != f"{d1}{d2}":
            raise CNHError("CNH invalida.")

        cat = str(categoria).strip().upper()
        if cat not in self.CATEGORIAS_VALIDAS:
            raise CNHError("Categoria invalida.")

        if validade is not None and not isinstance(validade, date):
            raise CNHError("Validade invalida.")

        self._numero = num
        self._categoria = cat
        self._validade = validade

    def calc_dv(self, base):
        s1 = sum(int(d) * p for d, p in zip(base, range(9, 0, -1)))
        r1 = s1 % 11
        d1 = 0 if r1 >= 10 else r1
        ajuste = 2 if r1 >= 10 else 0

        s2 = sum(int(d) * p for d, p in zip(base, range(1, 10))) - ajuste
        r2 = s2 % 11
        d2 = 0 if r2 >= 10 else r2
        return d1, d2

    @property
    def numero(self):
        return self._numero

    @property
    def categoria(self):
        return self._categoria

    @property
    def validade(self):
        return self._validade

    def esta_valida(self, data_referencia):
        if self._validade is None:
            return True
        ref = data_referencia.date() if hasattr(data_referencia, "date") else data_referencia
        return self._validade >= ref

    def permite_categoria(self, categoria_exigida="B"):
        exigida = categoria_exigida.strip().upper()
        if exigida == "B":
            return any(c in self._categoria for c in ("B", "C", "D", "E"))
        return exigida in self._categoria

    def permite_carro(self):
        return any(c in self._categoria for c in ("B", "C", "D", "E"))

    def __eq__(self, outro):
        if isinstance(outro, CNH):
            return self._numero == outro.numero and self._categoria == outro.categoria
        return False

    def __str__(self):
        return f"CNH {self._numero} ({self._categoria})"
