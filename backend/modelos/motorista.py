from datetime import date

from backend.modelos.cnh import CNH, CNHError
from backend.modelos.condutor import Condutor
from backend.modelos.enums import StatusCliente


class Motorista(Condutor):
    """Motorista secundário: igual ao Cliente, mas a CNH é obrigatória."""

    def __init__(self, nome, email, cpf_str, cnh_num, categoria="B", validade=None,
                 titular=None, senha="123", status=StatusCliente.ATIVO):
        if isinstance(cnh_num, str):
            # erros de CNH agora propagam (antes eram engolidos por `except Exception`)
            cnh_num = CNH(cnh_num, categoria=categoria, validade=validade)
        if cnh_num is None:
            raise CNHError("Motorista exige CNH.")
        super().__init__(nome=nome, email=email, cpf=cpf_str, cnh=cnh_num,
                         senha=senha, status=status, tipo_perfil="motorista")
        self.titular = titular

    def get_documento(self):
        return f"CNH {self.cnh.numero} (Cat. {self.cnh.categoria})"

    def pode_operar(self):
        return (
            super().pode_operar()
            and self.cnh.esta_valida(date.today())
            and self.cnh.permite_carro()
        )

    def exibir_dados(self):
        dados = self._dados_base()
        dados.update({
            "cpf": self.cpf.formatado(),
            "titular_vinculado": self.titular.nome if self.titular else "Nenhum",
            "apto_conduzir": self.pode_operar(),
        })
        return dados


MotoristaSecundario = Motorista