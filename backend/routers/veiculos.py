from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta

from backend.database.conexao_postgres import obter_conexao
from backend.modelos.locacao import Locacao, ErroLocacao
from backend.modelos.veiculo import VeiculoModel
from backend.modelos.veiculo_agencia import VeiculoAgenciaModel
from backend.modelos.cliente import ClienteModel
from backend.modelos.enums import StatusLocacao

router = APIRouter(prefix="/api", tags=["Reservas"])

@router.post("/reservas")
async def solicitar_reserva(
    cliente_id: int = Form(...),
    veiculo_id: int = Form(...),
    dias: int = Form(...),
    ori: str = Form("Campos dos Goytacazes"), # Origem padrão ou vinda do front
    dest: str = Form("Campos dos Goytacazes"), # Destino padrão ou vindo do front
    db: Session = Depends(obter_conexao)
):
    try:
        # 1. Buscar o cliente e o veículo na base de dados
        cliente_db = db.query(ClienteModel).filter(ClienteModel.id == cliente_id).first()
        if not cliente_db:
            raise HTTPException(status_code=404, detail="Cliente não encontrado.")

        veiculo_db = db.query(VeiculoAgenciaModel).filter(VeiculoAgenciaModel.id == veiculo_id).first()
        if not veiculo_db:
            raise HTTPException(status_code=404, detail="Veículo não encontrado.")

        # 2. Definir as datas com base na quantidade de dias escolhida pelo cliente
        ini = date.today()
        fim = ini + timedelta(days=int(dias))

        # 3. Instanciar a sua classe de domínio Locacao (valida regras automaticamente)
        nova_locacao = Locacao(
            cli=cliente_db,
            veic=veiculo_db,
            ini=ini,
            fim=fim,
            diaria=veiculo_db.valor_diaria,
            ori=ori,
            dest=dest
        )

        # Opcional: Se quiser persistir o estado inicial no banco de dados, 
        # pode guardar numa tabela de LocacaoModel correspondente.
        
        return {
            "success": True,
            "message": "Solicitação de reserva criada com sucesso!",
            "qtd_dias": nova_locacao.qtd_dias,
            "valor_total": nova_locacao.total(),
            "status": nova_locacao.status.value if hasattr(nova_locacao.status, "value") else str(nova_locacao.status)
        }

    except ErroLocacao as el:
        # Captura as exceções de negócio da sua classe (CNH vencida, veículo indisponível, etc.)
        raise HTTPException(status_code=400, detail=str(el))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/catalogo/veiculos")
def listar_catalogo_veiculos(db: Session = Depends(obter_conexao)):
    return db.query(VeiculoAgenciaModel).all()


@router.get("/agencias/{agencia_id}/reservas-pendentes")
def listar_reservas_pendentes(agencia_id: int):
    return []


@router.post("/agencias/{agencia_id}/veiculos")
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
        placa_limpa = placa.strip().upper()
        existente = db.query(VeiculoAgenciaModel).filter(VeiculoAgenciaModel.placa == placa_limpa).first()
        if existente:
            raise HTTPException(status_code=400, detail="Já existe um veículo cadastrado com esta placa.")

        veic_fipe = VeiculoModel(
            placa=placa_limpa,
            marca_id=marca_codigo,
            modelo_id=modelo_codigo,
            ano_id=ano_codigo
        )

        novo_veiculo = VeiculoAgenciaModel(
            agencia_id=agencia_id,
            placa=placa_limpa,
            marca=veic_fipe.marca_nome,
            modelo=veic_fipe.modelo_nome,
            ano=int(veic_fipe.ano_modelo or 2024),
            valor_diaria=float(valor_diaria),
            status="disponível",
            fipeP=veic_fipe.valor_fipe_texto,
            fipeA=ano_codigo
        )

        db.add(novo_veiculo)
        db.commit()
        db.refresh(novo_veiculo)

        return {
            "success": True,
            "message": "Veículo cadastrado com sucesso na frota!",
            "veiculo": novo_veiculo
        }
    except HTTPException as he:
        raise he
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
