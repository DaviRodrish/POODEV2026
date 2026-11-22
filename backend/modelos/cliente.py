from sqlalchemy import Column, Enum, String

from backend.modelos.cnh import CNH
from backend.modelos.condutor import Condutor
from backend.modelos.enums import StatusCliente
from backend.modelos.usuario import UsuarioModel, cifrar_documento, proteger_senha
from backend.security import decrypt_value


# [BLOQUEIO 2/2] RF01/RF04/RF27 - Tabela clientes com CPF cifrado + cpf_lookup
class ClienteModel(UsuarioModel):
    __tablename__ = "clientes"

    _cpf = Column("cpf", String, unique=True, index=True, nullable=False)
    cpf_lookup = Column("cpf_lookup", String(64), index=True, nullable=True)
    cnh = Column(String, nullable=True)
    tipo_perfil = Column(String, default="cliente")
    status = Column(
        Enum(*[s.value for s in StatusCliente], name="statuscliente", create_type=False),
        default=StatusCliente.ATIVO.value,
    )
    motivo = Column(String, nullable=True)

    def __init__(self, nome, email, cpf, cnh=None, senha="123",
                 tipo_perfil="cliente", status=StatusCliente.ATIVO, motivo=None):
        super().__init__(nome=nome, email=email, senha=proteger_senha(senha))
        self.cpf = cpf
        self.cnh = cnh
        self.tipo_perfil = tipo_perfil
        self.status = StatusCliente(status).value
        self.motivo = motivo

    @property
    def cpf(self):
        return self._cpf

    @cpf.setter
    def cpf(self, valor):
        self._cpf, self.cpf_lookup = cifrar_documento(valor)

    def get_documento(self):
        return decrypt_value(self._cpf)

    def obter_cnh(self):
        """Mesmo contrato de Condutor.obter_cnh: devolve CNH ou None."""
        if not self.cnh or self.cnh == "Não informada":
            return None
        cnh_decifrada = decrypt_value(self.cnh)
        return CNH(cnh_decifrada)

    def pode_operar(self):
        return self.status == StatusCliente.ATIVO

    def pode_alugar(self):
        return self.pode_operar()

    # [BLOQUEIO 2/2] RF27 - Bloqueia/desbloqueia cliente para novas locacoes
    def bloquear(self, motivo):
        self.status = StatusCliente.BLOQUEADO.value
        self.motivo = motivo

    def desbloquear(self):
        self.status = StatusCliente.ATIVO.value
        self.motivo = None

    def __repr__(self):
        return f"<ClienteModel(id={self.id}, nome='{self.nome}', status='{self.status}')>"


class Cliente(Condutor):
    def __init__(self, nome, email, cpf_str, cnh_num=None, senha="123", status=StatusCliente.ATIVO):
        super().__init__(nome=nome, email=email, cpf=cpf_str, cnh=cnh_num,
                         senha=senha, status=status, tipo_perfil="cliente")

    def exibir_dados(self):
        dados = self._dados_base()
        dados["pode_alugar"] = self.pode_alugar()
        return dados