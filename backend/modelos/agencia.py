from sqlalchemy import Column, String
from backend.modelos.cnpj import CNPJ
from backend.modelos.usuario import Usuario, UsuarioModel
from backend.security import decrypt_value, doc_lookup_hash, encrypt_value, normalize_doc


class AgenciaModel(UsuarioModel):
    __tablename__ = "agencias"

    _cnpj = Column("cnpj", String, unique=True, index=True, nullable=False)
    cnpj_lookup = Column("cnpj_lookup", String(64), index=True, nullable=True)
    endereco = Column(String, nullable=False)
    chave_pix = Column(String, nullable=True, default="")
    tipo_perfil = "agencia"

    def __init__(self, nome: str, email: str, cnpj: str, senha: str = "123", endereco: str = "", chave_pix: str = ""):
        super().__init__(nome=nome, email=email, senha=senha)
        self.cnpj = cnpj
        self.endereco = endereco
        self.chave_pix = chave_pix or str(cnpj)

    @property
    def cnpj(self):
        return self._cnpj

    @cnpj.setter
    def cnpj(self, valor):
        if valor is None:
            self._cnpj = None
            self.cnpj_lookup = None
            return
        texto = str(valor).strip()
        decifrado = decrypt_value(texto)
        if decifrado != texto:
            self._cnpj = texto
            self.cnpj_lookup = doc_lookup_hash(decifrado)
        else:
            norm = normalize_doc(texto)
            self._cnpj = encrypt_value(norm)
            self.cnpj_lookup = doc_lookup_hash(norm)

    def get_documento(self):
        return decrypt_value(self._cnpj)

    def get_chave_pix(self):
        if self.chave_pix:
            return decrypt_value(self.chave_pix)
        return self.get_documento()

    def pode_operar(self):
        return bool(self._cnpj) and bool(self.endereco)


class Agencia(Usuario):
    def __init__(self, nome, email, cnpj, endereco, senha="123", status="ATIVO", chave_pix=""):
        super().__init__(nome=nome, email=email, senha=senha, status=status, tipo_perfil="agencia")
        self.cnpj = cnpj
        self.endereco = str(endereco).strip()
        self.chave_pix = str(chave_pix).strip() or str(self.get_documento())
        self.frota = []
        self.caixa_recebimentos = []

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

    def configurar_chave_pix(self, nova_chave: str):
        if not nova_chave or len(str(nova_chave).strip()) < 3:
            raise ValueError("Chave PIX inválida.")
        self.chave_pix = str(nova_chave).strip()

    def registrar_pagamento(self, pagamento_dict: dict):
        self.caixa_recebimentos.append(pagamento_dict)

    def total_faturado(self) -> float:
        return sum(p.get("valor", 0.0) for p in self.caixa_recebimentos)

    def cadastrar_veiculo(self, veiculo):
        self.frota.append(veiculo)

    def exibir_dados(self):
        st = getattr(self.status, "value", self.status)
        return {
            "tipo": self.tipo_perfil(),
            "nome": self.nome,
            "email": self.email,
            "documento": self.get_documento(),
            "chave_pix": self.chave_pix,
            "endereco": self.endereco,
            "status": st,
            "total_frota": len(self.frota)
        }