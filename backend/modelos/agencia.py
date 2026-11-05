from sqlalchemy import Column, String
from backend.modelos.cnpj import CNPJ
from backend.modelos.usuario import Usuario, UsuarioModel

class AgenciaModel(UsuarioModel):
    __tablename__ = "agencias"

    _cnpj = Column("cnpj", String, unique=True, index=True, nullable=False)
    endereco = Column(String, nullable=False)
    tipo_perfil = "agencia"

    def __init__(self, nome: str, email: str, cnpj: str, senha: str = "123", endereco: str = ""):
        super().__init__(nome=nome, email=email, senha=senha)
        self.cnpj = cnpj
        self.endereco = endereco

    @property
    def cnpj(self):
        return self._cnpj

    @cnpj.setter
    def cnpj(self, valor: str):
        cnpj_obj = CNPJ(valor) if isinstance(valor, str) else valor
        self._cnpj = cnpj_obj.numero

    def get_documento(self):
        return self._cnpj

    def pode_operar(self):
        return bool(self._cnpj) and bool(self.endereco)


class Agencia(Usuario):
    def __init__(self, nome, email, cnpj, endereco, senha="123", status="ATIVO"):
        super().__init__(nome=nome, email=email, senha=senha, status=status, tipo_perfil="agencia")
        self.cnpj = cnpj
        self.endereco = str(endereco).strip()
        self.frota = []

    @property
    def cnpj(self):
        return self._cnpj

    @cnpj.setter
    def cnpj(self, valor):
        self._cnpj = CNPJ(valor) if isinstance(valor, str) else valor

    def get_documento(self):
        return self.cnpj.formatado() if hasattr(self.cnpj, "formatado") else str(self.cnpj)

    def pode_operar(self):
        st = getattr(self.status, "value", self.status)
        return st == "ATIVO" and bool(self.endereco)

    def cadastrar_veiculo(self, veiculo):
        self.frota.append(veiculo)

    def exibir_dados(self):
        st = getattr(self.status, "value", self.status)
        return {
            "tipo": self.tipo_perfil(),
            "nome": self.nome,
            "email": self.email,
            "documento": self.get_documento(),
            "endereco": self.endereco,
            "status": st,
            "total_frota": len(self.frota)
        }
