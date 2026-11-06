from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta

from backend.database.conexao_postgres import obter_conexao
from backend.modelos.locacao import Locacao, ErroLocacao
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