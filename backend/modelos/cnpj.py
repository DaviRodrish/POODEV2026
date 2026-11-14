class CNPJError(Exception):
    pass

class CNPJ:
    def __init__(self, numero: str):
        self.numero = self._limpar(numero)
        if not self._validar():
            raise CNPJError("CNPJ inválido.")

    def _limpar(self, cnpj: str) -> str:
        return "".join([c for c in cnpj if c.isdigit()])

    def _validar(self) -> bool:
        if len(self.numero) != 14:
            return False
        if self.numero == self.numero[0] * 14:
            return False
        
        return True

    def formatado(self) -> str:
        n = self.numero
        return f"{n[:2]}.{n[2:5]}.{n[5:8]}/{n[8:12]}-{n[12:]}"