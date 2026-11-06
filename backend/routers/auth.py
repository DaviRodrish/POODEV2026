from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
import os

from backend.database.conexao_postgres import obter_conexao
from backend.database.repositorio_fotos import salvar_cnh_motorista
from backend.modelos.agencia import AgenciaModel
from backend.modelos.cliente import ClienteModel
from backend.modelos.cpf import CPF, CPFError
from backend.modelos.cnpj import CNPJ, CNPJError

router = APIRouter(prefix="/api", tags=["Autenticação"])

@router.post("/login")
async def login_usuario(
    identificador: str = Form(...),
    senha: str = Form(...),
    db: Session = Depends(obter_conexao)
):
    try:
        cliente = db.query(ClienteModel).filter(
            (ClienteModel.email == identificador) | (ClienteModel._cpf == identificador)
        ).first()

        if cliente and cliente.autenticar(senha):
            return {
                "success": True,
                "message": "Login efetuado com sucesso!",
                "tipoPerfil": cliente.tipo_perfil or "cliente",
                "usuario": {
                    "id": cliente.id,
                    "nome": cliente.nome,
                    "email": cliente.email,
                    "status": cliente.status or "ATIVO",
                    "motivo": cliente.motivo,
                    "pode_alugar": cliente.pode_alugar()
                }
            }

        agencia = db.query(AgenciaModel).filter(
            (AgenciaModel.email == identificador) | (AgenciaModel._cnpj == identificador)
        ).first()

        if agencia and agencia.autenticar(senha):
            return {
                "success": True,
                "message": "Login de agência efetuado com sucesso!",
                "tipoPerfil": agencia.tipo_perfil,
                "usuario": {
                    "id": agencia.id,
                    "nome": agencia.nome,
                    "email": agencia.email
                }
            }

        raise HTTPException(
            status_code=401,
            detail="Credenciais inválidas. Verifique seu e-mail, CPF/CNPJ e senha."
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cadastro")
async def cadastrar_usuario(
    nome: str = Form(...),
    email: str = Form(...),
    cpf: str = Form(...),
    tipoPerfil: str = Form(...),
    senha: str = Form(...),
    cnh: str = Form(None),
    fotoCnh: UploadFile = File(None),
    db: Session = Depends(obter_conexao)
):
    try:
        try:
            cpf_obj = CPF(cpf)
        except CPFError:
            raise HTTPException(status_code=400, detail="CPF inválido.")

        cliente_existente = db.query(ClienteModel).filter(
            (ClienteModel.email == email) | (ClienteModel._cpf == cpf_obj.numero)
        ).first()

        if cliente_existente:
            raise HTTPException(status_code=400, detail="E-mail ou CPF já registados.")

        novo_cliente = ClienteModel(
            nome=nome, email=email, cpf=cpf, cnh=cnh or "Não informada",
            senha=senha, tipo_perfil=tipoPerfil, status="ATIVO", motivo=None
        )

        db.add(novo_cliente)
        db.commit()
        db.refresh(novo_cliente)

        if fotoCnh and fotoCnh.filename:
            caminho_local = os.path.join("backend/uploads", fotoCnh.filename)
            with open(caminho_local, "wb") as f:
                f.write(await fotoCnh.read())
            salvar_cnh_motorista(cliente_id=novo_cliente.id, caminho_arquivo=f"uploads/{fotoCnh.filename}")

        return {"success": True, "message": "Utilizador cadastrado com sucesso!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cadastro-agencia")
async def cadastrar_agencia(
    nome: str = Form(...),
    email: str = Form(...),
    cnpj: str = Form(...),
    senha: str = Form(...),
    endereco: str = Form(...),
    db: Session = Depends(obter_conexao)
):
    try:
        try:
            cnpj_obj = CNPJ(cnpj)
        except CNPJError:
            raise HTTPException(status_code=400, detail="CNPJ inválido.")

        agencia_existente = db.query(AgenciaModel).filter(
            (AgenciaModel.email == email) | (AgenciaModel._cnpj == cnpj_obj.numero)
        ).first()

        if agencia_existente:
            raise HTTPException(status_code=400, detail="E-mail ou CNPJ já registados.")

        nova_agencia = AgenciaModel(
            nome=nome, email=email, cnpj=cnpj, senha=senha, endereco=endereco
        )

        db.add(nova_agencia)
        db.commit()
        db.refresh(nova_agencia)

        return {"success": True, "message": "Agência cadastrada com sucesso!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))