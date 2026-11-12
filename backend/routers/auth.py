from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session
from bson import ObjectId

from backend.database.conexao_postgres import obter_conexao
from backend.database.repositorio_fotos import salvar_cnh_motorista_binaria, colecao_fotos
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

        # Se enviou foto da CNH, lemos os bytes e guardamos no MongoDB Atlas diretamente
        if fotoCnh and fotoCnh.filename:
            dados_bytes = await fotoCnh.read()
            
            # Validação para respeitar o limite de 16MB do MongoDB por documento
            if len(dados_bytes) > 10 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="A imagem da CNH excede o tamanho máximo permitido (10MB).")

            salvar_cnh_motorista_binaria(
                cliente_id=novo_cliente.id,
                nome_arquivo=fotoCnh.filename,
                content_type=fotoCnh.content_type or "image/jpeg",
                dados_binarios=dados_bytes
            )

        return {"success": True, "message": "Utilizador cadastrado com sucesso com persistência poliglota!"}
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
            raise HTTPException(status_code=400, detail="E-mail ou CNPJ já registadosdados.")

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

# Rota para recuperar a CNH do MongoDB e exibi-la na tela (Frontend)
@router.get("/documentos/cnh/{cliente_id}")
def obter_cnh_cliente(cliente_id: int):
    if colecao_fotos is None:
        raise HTTPException(status_code=500, detail="MongoDB não está conectado.")
        
    doc = colecao_fotos.find_one({"cliente_id": cliente_id, "tipo_documento": "CNH"})
    
    if not doc or "dados_binarios" not in doc:
        raise HTTPException(status_code=404, detail="Documento CNH não encontrado.")

    return Response(
        content=doc["dados_binarios"],
        media_type=doc.get("content_type", "image/jpeg")
    )