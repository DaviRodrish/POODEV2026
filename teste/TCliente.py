import pytest
from modelos.enums import StatusCliente
from modelos.cpf import CPF, CPFError
from modelos.cliente import Cliente

def test_cpf_valido():
    c = CPF("529.982.247-25")
    assert c.numero == "52998224725"
    assert c.formatado() == "529.982.247-25"

def test_cpf_invalido():
    with pytest.raises(CPFError):
        CPF("123456789")
    with pytest.raises(CPFError):
        CPF("111.111.111-11")

def test_cliente_criacao_ativo():
    cli = Cliente("Davi", "davi@email.com", "529.982.247-25", "12345678900")
    assert cli.nome == "Davi"
    assert cli.status == StatusCliente.ATIVO
    assert cli.pode_alugar() is True

def test_cliente_bloquear():
    cli = Cliente("Paulo", "paulo@email.com", "529.982.247-25", "12345678900")
    cli.bloquear("Inadimplência financeira")
    assert cli.status == StatusCliente.BLOQUEADO
    assert cli.motivo == "Inadimplência financeira"
    assert cli.pode_alugar() is False

def test_cliente_desbloquear():
    cli = Cliente("Paulo", "paulo@email.com", "529.982.247-25", "12345678900")
    cli.bloquear("Problema temporário")
    cli.desbloquear()
    assert cli.status == StatusCliente.ATIVO
    assert cli.motivo is None
    assert cli.pode_alugar() is True