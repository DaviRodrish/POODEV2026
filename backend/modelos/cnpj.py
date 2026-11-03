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
        # Validação básica de dígitos repetidos (ex: 00.000.000/0000-00)
        if self.numero == self.numero[0] * 14:
            return False
        
        # Aqui podes aplicar o algoritmo matemático oficial de validação de CNPJ se desejado,
        # ou manter a validação estrutural de tamanho e formato.
        return True

    def formatado(self) -> str:
        n = self.numero
        return f"{n[:2]}.{n[2:5]}.{n[5:8]}/{n[8:12]}-{n[12:]}"