import os
from fastapi import FastAPI, Depends, File, Form, HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy.orm import Session

from backend.modelos.agencia import AgenciaModel
from backend.modelos.cnpj import CNPJ, CNPJError
from backend.modelos.veiculo_agencia import VeiculoAgenciaModel
from backend.modelos.fipe import ServicoFipe
from backend.modelos.veiculo import VeiculoModel
from backend.modelos.cpf import CPF, CPFError
from backend.modelos.cliente import ClienteModel

from backend.database.conexao_postgres import obter_conexao
from backend.database.repositorio_fotos import salvar_cnh_motorista

load_dotenv()

app = FastAPI(title="API Sistema de Aluguel de Carros")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("backend/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="backend/uploads"), name="uploads")

@app.get("/")
def raiz():
    return {"mensagem": "API do Sistema de Aluguel de Carros a rodar com sucesso!"}

@app.post("/api/login")
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
        print(f"Erro no login: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/cadastro")
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
            raise HTTPException(
                status_code=400, 
                detail="CPF inválido. Verifique os números digitados."
            )

        cliente_existente = db.query(ClienteModel).filter(
            (ClienteModel.email == email) | (ClienteModel._cpf == cpf_obj.numero)
        ).first()

        if cliente_existente:
            raise HTTPException(
                status_code=400, 
                detail="E-mail ou CPF já registados no sistema."
            )

        cnh_valor = cnh if cnh else "Não informada"

        novo_cliente = ClienteModel(
            nome=nome,
            email=email,
            cpf=cpf,
            cnh=cnh_valor,
            senha=senha,
            tipo_perfil=tipoPerfil,
            status="ATIVO",
            motivo=None
        )

        db.add(novo_cliente)
        db.commit()
        db.refresh(novo_cliente)

        if fotoCnh and fotoCnh.filename:
            cliente_id = novo_cliente.id
            caminho_local = os.path.join("backend/uploads", fotoCnh.filename)
            with open(caminho_local, "wb") as f:
                f.write(await fotoCnh.read())

            caminho_para_mongo = f"uploads/{fotoCnh.filename}"
            id_mongo = salvar_cnh_motorista(cliente_id=cliente_id, caminho_arquivo=caminho_para_mongo)
            print(f"Documento da CNH salvo no MongoDB com ID: {id_mongo}")

        return {"success": True, "message": "Utilizador cadastrado com sucesso!"}

    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        print(f"Erro no cadastro: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/cadastro-agencia")
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
            raise HTTPException(
                status_code=400, 
                detail="CNPJ inválido. Verifique os números digitados."
            )

        agencia_existente = db.query(AgenciaModel).filter(
            (AgenciaModel.email == email) | (AgenciaModel._cnpj == cnpj_obj.numero)
        ).first()

        if agencia_existente:
            raise HTTPException(
                status_code=400, 
                detail="E-mail ou CNPJ já registados no sistema."
            )

        nova_agencia = AgenciaModel(
            nome=nome,
            email=email,
            cnpj=cnpj,
            senha=senha,
            endereco=endereco
        )

        db.add(nova_agencia)
        db.commit()
        db.refresh(nova_agencia)

        return {"success": True, "message": "Agência cadastrada com sucesso!"}

    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        print(f"Erro no cadastro de agência: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agencias/{agencia_id}/veiculos")
async def cadastrar_veiculo_agencia(
    agencia_id: int,
    placa: str = Form(...),
    marca_codigo: str = Form(...),
    modelo_codigo: str = Form(...),
    ano_codigo: str = Form(...),
    valor_diaria: float = Form(...),
    db: Session = Depends(obter_conexao)
):
    try:
        agencia = db.query(AgenciaModel).filter(AgenciaModel.id == agencia_id).first()
        if not agencia:
            raise HTTPException(status_code=404, detail="Agência não encontrada.")

        veiculo_fipe = VeiculoModel(
            placa=placa,
            marca_id=marca_codigo,
            modelo_id=modelo_codigo,
            ano_id=ano_codigo
        )

        ano_num = 2024
        try:
            ano_num = int(str(veiculo_fipe.ano_modelo)[:4])
        except Exception:
            pass

        nova_frota = VeiculoAgenciaModel(
            agencia_id=agencia_id,
            placa=placa.upper(),
            marca=veiculo_fipe.marca_nome,
            modelo=veiculo_fipe.modelo_nome,
            ano=ano_num,
            valor_diaria=valor_diaria,
            status="disponível",
            combustivel_nivel=1.0,
            quilometragem=0,
            km_rev=10000
        )

        db.add(nova_frota)
        db.commit()
        db.refresh(nova_frota)

        return {
            "success": True, 
            "message": "Veículo adicionado à frota da agência com sucesso!",
            "veiculo_id": nova_frota.id,
            "valor_referencia_fipe": veiculo_fipe.valor_mercado
        }

    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        print(f"Erro ao cadastrar veículo na agência: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/catalogo/veiculos")
async def listar_catalogo_veiculos(db: Session = Depends(obter_conexao)):
    veiculos = db.query(VeiculoAgenciaModel).all()
    resultado = []
    for v in veiculos:
        resultado.append({
            "id": v.id,
            "agencia_id": v.agencia_id,
            "placa": v.placa,
            "marca": v.marca,
            "modelo": v.modelo,
            "ano": v.ano,
            "valor_diaria": v.valor_diaria,
            "status": v.status,
            "combustivel_nivel": v.combustivel_nivel or 1.0,
            "quilometragem": v.quilometragem or 0,
            "km_rev": v.km_rev or 10000,
            "precisa_revisao": v.precisa_revisao()
        })
    return resultado

@app.put("/api/veiculos/{veiculo_id}/combustivel")
async def atualizar_combustivel_veiculo(
    veiculo_id: int,
    nivel: float = Form(...),
    db: Session = Depends(obter_conexao)
):
    veiculo = db.query(VeiculoAgenciaModel).filter(VeiculoAgenciaModel.id == veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado.")

    try:
        veiculo.abastecer(nivel)
        db.commit()
        db.refresh(veiculo)

        return {
            "success": True,
            "message": f"Nível de combustível atualizado para {int(veiculo.combustivel_nivel * 100)}%!",
            "combustivel_nivel": veiculo.combustivel_nivel
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/veiculos/{veiculo_id}/revisao")
async def registrar_revisao_veiculo(
    veiculo_id: int,
    db: Session = Depends(obter_conexao)
):
    veiculo = db.query(VeiculoAgenciaModel).filter(VeiculoAgenciaModel.id == veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado.")

    veiculo.registrar_revisao()
    db.commit()
    db.refresh(veiculo)

    return {
        "success": True,
        "message": f"Revisão registrada! Próxima revisão em {veiculo.km_rev} km.",
        "km_rev": veiculo.km_rev,
        "status": veiculo.status
    }

@app.put("/api/clientes/{cliente_id}/status")
async def alterar_status_cliente(
    cliente_id: int,
    status: str = Form(...),
    motivo: str = Form(None),
    db: Session = Depends(obter_conexao)
):
    cliente = db.query(ClienteModel).filter(ClienteModel.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")

    if status.upper() == "BLOQUEADO":
        cliente.bloquear(motivo or "Pendência financeira ou cadastral")
    else:
        cliente.desbloquear()

    db.commit()
    db.refresh(cliente)

    return {
        "success": True,
        "message": f"Status do cliente atualizado para {cliente.status}.",
        "status": cliente.status,
        "motivo": cliente.motivo,
        "pode_alugar": cliente.pode_alugar()
    }

# --- ROTAS DE CONSULTA DINÂMICA DA FIPE ---

@app.get("/api/fipe/marcas")
def listar_marcas_fipe():
    """Retorna todas as marcas de carros da FIPE."""
    return ServicoFipe.listar_marcas()

@app.get("/api/fipe/marcas/{marca_id}/modelos")
def listar_modelos_fipe(marca_id: str):
    """Retorna os modelos de uma determinada marca."""
    return ServicoFipe.listar_modelos(marca_id)

@app.get("/api/fipe/marcas/{marca_id}/modelos/{modelo_id}/anos")
def listar_anos_fipe(marca_id: str, modelo_id: str):
    """Retorna os anos/versões de um determinado modelo."""
    return ServicoFipe.listar_anos(marca_id, modelo_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)