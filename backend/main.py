import os
from fastapi import FastAPI, Depends, File, Form, HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# Importações dos serviços e modelos da FIPE
from backend.modelos.fipe import ServicoFipe
from backend.modelos.veiculo import VeiculoModel

# Importação da classe de validação de CPF
from backend.modelos.cpf import CPF, CPFError

# Importação do modelo do Cliente/Usuário do PostgreSQL
from backend.modelos.cliente import ClienteModel

# Importações dos bancos de dados
from backend.database.conexao_postgres import obter_conexao
from backend.database.repositorio_fotos import salvar_cnh_motorista

load_dotenv()

app = FastAPI(title="API Sistema de Aluguel de Carros")

# Configuração do CORS para permitir a comunicação com o React (Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, restrinja para o domínio exato do front-end
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Garantir que a pasta de uploads existe dentro do backend e torná-la acessível publicamente via URL
os.makedirs("backend/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="backend/uploads"), name="uploads")

@app.get("/")
def raiz():
    return {"mensagem": "API do Sistema de Aluguel de Carros a rodar com sucesso!"}

# Rota de cadastro integrada com PostgreSQL (com senha) e MongoDB (com foto da CNH)
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

        # 3. Instanciar o ClienteModel passando a senha e os dados do formulário
        cnh_valor = cnh if cnh else "Não informada"

        novo_cliente = ClienteModel(
            nome=nome,
            email=email,
            cpf=cpf,
            cnh=cnh_valor,
            senha=senha
        )

        # Adiciona e persiste no PostgreSQL
        db.add(novo_cliente)
        db.commit()
        db.refresh(novo_cliente)
        
        # Recupera o ID gerado pelo PostgreSQL
        cliente_id = novo_cliente.id
        print(f"Cliente gravado no PostgreSQL com ID: {cliente_id}")

        # 4. Se for motorista e enviou a foto/documento da CNH, salvar no MongoDB Atlas
        if tipoPerfil == "motorista" and fotoCnh:
            caminho_relativo = f"backend/uploads/{fotoCnh.filename}"
            
            # Salva o ficheiro no disco dentro da pasta do backend
            with open(caminho_relativo, "wb") as buffer:
                buffer.write(await fotoCnh.read())
            
            # Guarda no MongoDB o caminho amigável para acesso
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

# Função de teste da FIPE (opcional para testes diretos via terminal)
def executar_teste_fipe():
    print("--- A consultar Marcas na FIPE ---")
    marcas = ServicoFipe.listar_marcas()
    if not marcas:
        print("Não foi possível carregar as marcas.")
        return

    marca_exemplo = marcas[0]
    print(f"Marca Selecionada: {marca_exemplo['nome']} (Código: {marca_exemplo['codigo']})")

    modelos = ServicoFipe.listar_modelos(marca_exemplo['codigo'])
    if not modelos:
        print("Não foi possível carregar os modelos.")
        return

    modelo_exemplo = modelos[0]
    print(f"Modelo Selecionado: {modelo_exemplo['nome']} (Código: {modelo_exemplo['codigo']})")

    anos = ServicoFipe.listar_anos(marca_exemplo['codigo'], modelo_exemplo['codigo'])
    if not anos:
        print("Não foi possível carregar os anos.")
        return

    ano_exemplo = anos[0]
    print(f"Ano Selecionado: {ano_exemplo['nome']} (Código: {ano_exemplo['codigo']})")

    print("\n--- Instanciando o Veículo com os dados da FIPE ---")
    try:
        veiculo = VeiculoModel(
            placa="POO-2026",
            marca_id=marca_exemplo['codigo'],
            modelo_id=modelo_exemplo['codigo'],
            ano_id=ano_exemplo['codigo']
        )
        print(veiculo)
        print(f"Valor convertido para cálculo (float): {veiculo.valor_mercado}")
    except Exception as e:
        print(f"Erro ao instanciar o veículo: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)