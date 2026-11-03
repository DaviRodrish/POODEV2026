import os
from fastapi import FastAPI, Depends, File, Form, HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# Importações dos modelos e validadores
from backend.modelos.agencia import AgenciaModel
from backend.modelos.cnpj import CNPJ, CNPJError
from backend.modelos.veiculo_agencia import VeiculoAgenciaModel
from backend.modelos.fipe import ServicoFipe
from backend.modelos.veiculo import VeiculoModel
from backend.modelos.cpf import CPF, CPFError
from backend.modelos.cliente import ClienteModel

# Importações dos bancos de dados
from backend.database.conexao_postgres import obter_conexao
from backend.database.repositorio_fotos import salvar_cnh_motorista

load_dotenv()

app = FastAPI(title="API Sistema de Aluguel de Carros")

# Configuração do CORS para permitir a comunicação com o React (Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Garantir que a pasta de uploads existe e torná-la acessível publicamente via URL
os.makedirs("backend/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="backend/uploads"), name="uploads")

@app.get("/")
def raiz():
    return {"mensagem": "API do Sistema de Aluguel de Carros a rodar com sucesso!"}

# Rota de autenticação unificada para Clientes, Motoristas e Agências
@app.post("/api/login")
async def login_usuario(
    identificador: str = Form(...), # Pode ser email, CPF ou CNPJ
    senha: str = Form(...),
    db: Session = Depends(obter_conexao)
):
    try:
        # 1. Tenta procurar o cliente/motorista por e-mail ou CPF
        cliente = db.query(ClienteModel).filter(
            (ClienteModel.email == identificador) | (ClienteModel._cpf == identificador)
        ).first()

        if cliente and cliente.senha == senha:
            return {
                "success": True,
                "message": "Login efetuado com sucesso!",
                "tipoPerfil": cliente.tipo_perfil if hasattr(cliente, 'tipo_perfil') and cliente.tipo_perfil else "cliente",
                "usuario": {
                    "id": cliente.id,
                    "nome": cliente.nome,
                    "email": cliente.email
                }
            }

        # 2. Se não for cliente, tenta procurar nas agências por e-mail ou CNPJ
        agencia = db.query(AgenciaModel).filter(
            (AgenciaModel.email == identificador) | (AgenciaModel._cnpj == identificador)
        ).first()

        if agencia and agencia.senha == senha:
            return {
                "success": True,
                "message": "Login de agência efetuado com sucesso!",
                "tipoPerfil": "agencia",
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

# Rota de cadastro integrada com PostgreSQL (com suporte a tipo_perfil) e MongoDB (foto da CNH)
@app.post("/api/cadastro")
async def cadastrar_usuario(
    nome: str = Form(...),
    email: str = Form(...),
    cpf: str = Form(...),
    tipoPerfil: str = Form(...), # 'cliente' ou 'motorista'
    senha: str = Form(...),
    cnh: str = Form(None),
    fotoCnh: UploadFile = File(None),
    db: Session = Depends(obter_conexao)
):
    try:
        # 1. Validação matemática e estrutural do CPF
        try:
            cpf_obj = CPF(cpf)
        except CPFError:
            raise HTTPException(
                status_code=400, 
                detail="CPF inválido. Verifique os números digitados."
            )

        print(f"CPF Validado com sucesso: {cpf_obj.formatado()}")
        print(f"Recebendo cadastro para: {nome} ({email}) - Tipo: {tipoPerfil}")

        # 2. Verificar se o e-mail ou CPF já existem na base de dados
        cliente_existente = db.query(ClienteModel).filter(
            (ClienteModel.email == email) | (ClienteModel._cpf == cpf_obj.numero)
        ).first()

        if cliente_existente:
            raise HTTPException(
                status_code=400, 
                detail="E-mail ou CPF já registados no sistema."
            )

        # 3. Instanciar o ClienteModel guardando o tipo de perfil escolhido
        cnh_valor = cnh if cnh else "Não informada"

        novo_cliente = ClienteModel(
            nome=nome,
            email=email,
            cpf=cpf,
            cnh=cnh_valor,
            senha=senha,
            tipo_perfil=tipoPerfil
        )

        db.add(novo_cliente)
        db.commit()
        db.refresh(novo_cliente)
        
        cliente_id = novo_cliente.id
        print(f"Cliente gravado no PostgreSQL com ID: {cliente_id} (Perfil: {tipoPerfil})")

        # 4. Se for motorista e enviou a foto da CNH, salvar no MongoDB Atlas
        if tipoPerfil == "motorista" and fotoCnh:
            caminho_relativo = f"backend/uploads/{fotoCnh.filename}"
            
            with open(caminho_relativo, "wb") as buffer:
                buffer.write(await fotoCnh.read())
            
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

# Rota para o cadastro de Agências
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
        # 1. Validar CNPJ utilizando a classe orientada a objetos
        try:
            cnpj_obj = CNPJ(cnpj)
        except CNPJError:
            raise HTTPException(
                status_code=400, 
                detail="CNPJ inválido. Verifique os números digitados."
            )

        print(f"CNPJ Validado com sucesso: {cnpj_obj.formatado()}")

        # 2. Verificar se o e-mail ou CNPJ já estão registados
        agencia_existente = db.query(AgenciaModel).filter(
            (AgenciaModel.email == email) | (AgenciaModel._cnpj == cnpj_obj.numero)
        ).first()

        if agencia_existente:
            raise HTTPException(
                status_code=400, 
                detail="E-mail ou CNPJ já registados no sistema."
            )

        # 3. Instanciar e persistir no PostgreSQL
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

        print(f"Agência gravada no PostgreSQL com ID: {nova_agencia.id}")
        return {"success": True, "message": "Agência cadastrada com sucesso!"}

    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        print(f"Erro no cadastro de agência: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Rota para cadastrar veículos associados a uma agência (utilizando os dados da FIPE)
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
        # 1. Validar se a agência existe no PostgreSQL
        agencia = db.query(AgenciaModel).filter(AgenciaModel.id == agencia_id).first()
        if not agencia:
            raise HTTPException(status_code=404, detail="Agência não encontrada.")

        # 2. Utilizar o ServicoFipe e VeiculoModel para buscar os nomes reais e valor oficial da FIPE
        veiculo_fipe = VeiculoModel(
            placa=placa,
            marca_id=marca_codigo,
            modelo_id=modelo_codigo,
            ano_id=ano_codigo
        )

        # 3. Criar o registo do veículo ligado à agência
        nova_frota = VeiculoAgenciaModel(
            agencia_id=agencia_id,
            placa=placa.upper(),
            marca=veiculo_fipe.marca_nome if hasattr(veiculo_fipe, 'marca_nome') else "Marca FIPE",
            modelo=veiculo_fipe.modelo_nome if hasattr(veiculo_fipe, 'modelo_nome') else "Modelo FIPE",
            ano=veiculo_fipe.ano_nome if hasattr(veiculo_fipe, 'ano_nome') else "Ano FIPE",
            valor_diaria=valor_diaria,
            status="disponível"
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

# Rota pública para listar o catálogo de veículos disponíveis de todas as agências
@app.get("/api/catalogo/veiculos")
async def listar_catalogo_veiculos(db: Session = Depends(obter_conexao)):
    veiculos = db.query(VeiculoAgenciaModel).filter(VeiculoAgenciaModel.status == "disponível").all()
    return veiculos

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)