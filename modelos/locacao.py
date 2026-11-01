from datetime import date
from modelos.enums import Status, StatusLocacao
from modelos.cnh import CNH

class ErroLocacao(Exception):
    pass

class Locacao:
    def __init__(self, cli, veic, ini, fim, diaria, ori, dest, taxa=150.0):
        if fim < ini:
            raise ErroLocacao("Datas invalidas.")
        if diaria < 0:
            raise ErroLocacao("Diaria negativa.")
        if taxa < 0:
            raise ErroLocacao("Taxa negativa.")
        if hasattr(cli, "pode_alugar") and not cli.pode_alugar():
            raise ErroLocacao("Cliente bloqueado.")
        if hasattr(veic, "status") and veic.status != Status.DISPONIVEL:
            raise ErroLocacao("Veiculo indisponivel.")

        cli_cnh = getattr(cli, "cnh", None)
        if cli_cnh:
            if isinstance(cli_cnh, str):
                cli_cnh = CNH(cli_cnh)
            if hasattr(cli_cnh, "esta_valida") and not cli_cnh.esta_valida(fim):
                raise ErroLocacao("CNH vencida.")
            if hasattr(cli_cnh, "permite_carro") and not cli_cnh.permite_carro():
                raise ErroLocacao("Categoria incompativel.")

        self.cli = cli
        self.veic = veic
        self.ini = ini
        self.fim = fim
        self.diaria = float(diaria)
        self.ori = str(ori).strip()
        self.dest = str(dest).strip()
        self.taxa = float(taxa)
        self.status = StatusLocacao.RESERVADA
        self.km_saida = None
        self.km_volta = None
        self.motoristas_secundarios = []

    @property
    def qtd_dias(self):
        dias = (self.fim - self.ini).days
        return dias if dias > 0 else 1

    @property
    def taxa_extra(self):
        if self.ori.upper() != self.dest.upper():
            return self.taxa
        return 0.0

    @property
    def motorista_secundario(self):
        if self.motoristas_secundarios:
            return self.motoristas_secundarios[0]
        return None

    def total(self):
        return (self.qtd_dias * self.diaria) + self.taxa_extra

    def retirar(self, km):
        if self.status != StatusLocacao.RESERVADA:
            raise ErroLocacao("Locacao nao reservada.")
        if km < 0:
            raise ErroLocacao("KM negativo.")
        self.km_saida = float(km)
        self.status = StatusLocacao.ATIVA
        if hasattr(self.veic, "status"):
            self.veic.status = Status.LOCADO

    def devolver(self, km):
        if self.status != StatusLocacao.ATIVA:
            raise ErroLocacao("Locacao nao ativa.")
        if self.km_saida is not None and km < self.km_saida:
            raise ErroLocacao("KM menor que saida.")
        self.km_volta = float(km)
        self.status = StatusLocacao.CONCLUIDA
        if hasattr(self.veic, "status"):
            self.veic.status = Status.DISPONIVEL

    def cancelar(self):
        if self.status != StatusLocacao.RESERVADA:
            raise ErroLocacao("Locacao nao reservada.")
        self.status = StatusLocacao.CANCELADA
        if hasattr(self.veic, "status"):
            self.veic.status = Status.DISPONIVEL

    def adicionar_motorista_secundario(self, motorista, categoria="B"):
        if self.status != StatusLocacao.RESERVADA:
            raise ErroLocacao("Locacao nao reservada.")
        if hasattr(motorista, "pode_alugar") and not motorista.pode_alugar():
            raise ErroLocacao("Motorista bloqueado.")
        if motorista == self.cli or getattr(motorista, "cpf", 1) == getattr(self.cli, "cpf", 2):
            raise ErroLocacao("Motorista e o titular.")
        if motorista in self.motoristas_secundarios:
            raise ErroLocacao("Motorista ja cadastrado.")

        cnh = getattr(motorista, "cnh", motorista)
        if not cnh:
            raise ErroLocacao("CNH ausente.")
        if isinstance(cnh, str):
            cnh = CNH(cnh)

        if not hasattr(cnh, "esta_valida") or not cnh.esta_valida(self.fim):
            raise ErroLocacao("CNH vencida.")
        if not hasattr(cnh, "permite_carro") or not cnh.permite_carro():
            raise ErroLocacao("Categoria incompativel.")

        self.motoristas_secundarios.append(motorista)
