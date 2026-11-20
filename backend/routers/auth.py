from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.database.conexao_postgres import obter_conexao
from backend.database.repositorio_fotos import salvar_cnh_motorista_binaria, colecao_fotos
from backend.modelos.agencia import AgenciaModel
from backend.modelos.cliente import ClienteModel
from backend.modelos.cpf import CPF, CPFError
from backend.modelos.cnpj import CNPJ, CNPJError
from backend.security import decrypt_value, doc_lookup_hash, encrypt_value, hash_password, normalize_doc

router = APIRouter(prefix="/api", tags=["Autenticação"])


@router.post("/login")
async def login_usuario(
    identificador: str = Form(...),
    senha: str = Form(...),
    db: Session = Depends(obter_conexao)
):
    try:
        identificador_limpo = identificador.strip()
        identificador_email = identificador_limpo.lower()
        id_doc_hash = doc_lookup_hash(identificador_limpo)

        cliente = db.query(ClienteModel).filter(
            (func.lower(ClienteModel.email) == identificador_email) |
            (ClienteModel.cpf_lookup == id_doc_hash if id_doc_hash and hasattr(ClienteModel, "cpf_lookup") else (ClienteModel._cpf == identificador_limpo))
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
            (func.lower(AgenciaModel.email) == identificador_email) |
            (AgenciaModel.cnpj_lookup == id_doc_hash if id_doc_hash and hasattr(AgenciaModel, "cnpj_lookup") else (AgenciaModel._cnpj == identificador_limpo))
        ).first()

        if agencia and agencia.autenticar(senha):
            chave_pix_clara = decrypt_value(agencia.chave_pix) if agencia.chave_pix else None
            cnpj_claro = decrypt_value(agencia.cnpj) if agencia.cnpj else None
            return {
                "success": True,
                "message": "Login de agência efetuado com sucesso!",
                "tipoPerfil": agencia.tipo_perfil,
                "usuario": {
                    "id": agencia.id,
                    "nome": agencia.nome,
                    "email": agencia.email,
                    "cnpj": cnpj_claro,
                    "chave_pix": chave_pix_clara or cnpj_claro
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

        cpf_normalizado = normalize_doc(cpf_obj.numero)
        cpf_hash = doc_lookup_hash(cpf_normalizado)
        email_limpo = email.strip().lower()

        cliente_existente = db.query(ClienteModel).filter(
            (ClienteModel.email == email_limpo) |
            (ClienteModel.cpf_lookup == cpf_hash if cpf_hash and hasattr(ClienteModel, "cpf_lookup") else (ClienteModel._cpf == cpf_obj.numero))
        ).first()

        if cliente_existente:
            raise HTTPException(status_code=400, detail="E-mail ou CPF já cadastrados.")

        cnh_limpa = normalize_doc(cnh) if cnh and cnh.strip() else "Não informada"
        cnh_armazenar = encrypt_value(cnh_limpa) if cnh_limpa != "Não informada" else "Não informada"
        cpf_cifrado = encrypt_value(cpf_normalizado)
        senha_hash = hash_password(senha)

        novo_cliente = ClienteModel(
            nome=nome.strip(),
            email=email_limpo,
            cpf=cpf_cifrado,
            cnh=cnh_armazenar,
            senha=senha_hash,
            tipo_perfil=tipoPerfil,
            status="ATIVO",
            motivo=None
        )
        if hasattr(novo_cliente, "cpf_lookup"):
            novo_cliente.cpf_lookup = cpf_hash

        db.add(novo_cliente)
        db.commit()
        db.refresh(novo_cliente)

        if fotoCnh and fotoCnh.filename:
            dados_bytes = await fotoCnh.read()

            if len(dados_bytes) > 10 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="A imagem da CNH excede o tamanho máximo permitido (10MB).")

            salvar_cnh_motorista_binaria(
                cliente_id=novo_cliente.id,
                nome_arquivo=fotoCnh.filename,
                content_type=fotoCnh.content_type or "image/jpeg",
                dados_binarios=dados_bytes
            )

        return {"success": True, "message": "Usuário cadastrado com sucesso!"}
    except HTTPException as he:
        db.rollback()
        raise he
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

        cnpj_normalizado = normalize_doc(cnpj_obj.numero)
        cnpj_hash = doc_lookup_hash(cnpj_normalizado)
        email_limpo = email.strip().lower()

        agencia_existente = db.query(AgenciaModel).filter(
            (AgenciaModel.email == email_limpo) |
            (AgenciaModel.cnpj_lookup == cnpj_hash if cnpj_hash and hasattr(AgenciaModel, "cnpj_lookup") else (AgenciaModel._cnpj == cnpj_obj.numero))
        ).first()

        if agencia_existente:
            raise HTTPException(status_code=400, detail="E-mail ou CNPJ já cadastrados.")

        nova_agencia = AgenciaModel(
            nome=nome.strip(),
            email=email_limpo,
            cnpj=encrypt_value(cnpj_normalizado),
            senha=hash_password(senha),
            endereco=endereco.strip()
        )
        if hasattr(nova_agencia, "cnpj_lookup"):
            nova_agencia.cnpj_lookup = cnpj_hash

        db.add(nova_agencia)
        db.commit()
        db.refresh(nova_agencia)

        return {"success": True, "message": "Agência cadastrada com sucesso!"}
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


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