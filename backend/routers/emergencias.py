from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.database.conexao_postgres import obter_conexao
from backend.modelos.emergencia import Emergencia, EmergenciaError, EmergenciaModel
from backend.modelos.locacao import Locacao as LocacaoModel

router = APIRouter(prefix="/api", tags=["Emergências"])

class AlertaEmergenciaSchema(BaseModel):
    locacao_id: int
    tipo: str
    latitude: float
    longitude: float
    descricao: str = ""

@router.post("/emergencias")
async def emitir_alerta_emergencia(
    dados: AlertaEmergenciaSchema,
    db: Session = Depends(obter_conexao)
):
    try:
        locacao_db = db.query(LocacaoModel).filter(LocacaoModel.id == dados.locacao_id).first()
        if not locacao_db:
            raise HTTPException(status_code=404, detail="Locação não encontrada.")

        alerta = Emergencia(
            locacao=locacao_db,
            tipo=dados.tipo,
            latitude=dados.latitude,
            longitude=dados.longitude,
            descricao=dados.descricao
        )

        protocolo = alerta.acionar_seguro()

        nova_emergencia = EmergenciaModel(
            locacao_id=dados.locacao_id,
            agencia_id=locacao_db.veiculo.agencia_id,
            tipo=alerta.tipo,
            latitude=alerta.latitude,
            longitude=alerta.longitude,
            descricao=alerta.descricao,
            status=alerta.status.value if hasattr(alerta.status, "value") else str(alerta.status),
            protocolo_seguro=protocolo,
            data_hora=alerta.data_hora
        )

        db.add(nova_emergencia)
        db.commit()
        db.refresh(nova_emergencia)

        return {
            "success": True,
            "message": "Alerta de emergência emitido com sucesso e agência notificada!",
            "protocolo": protocolo,
            "emergencia_id": nova_emergencia.id
        }

    except EmergenciaError as ee:
        raise HTTPException(status_code=400, detail=str(ee))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/agencias/{agencia_id}/emergencias")
async def listar_emergencias_agencia(
    agencia_id: int,
    db: Session = Depends(obter_conexao)
):
    alertas = db.query(EmergenciaModel).filter(EmergenciaModel.agencia_id == agencia_id).all()
    resultado = []
    for a in alertas:
        resultado.append({
            "id": a.id,
            "locacao_id": a.locacao_id,
            "tipo": a.tipo,
            "latitude": a.latitude,
            "longitude": a.longitude,
            "descricao": a.descricao,
            "status": a.status,
            "protocolo_seguro": a.protocolo_seguro,
            "data_hora": a.data_hora.strftime("%d/%m/%Y %H:%M:%S")
        })
    return resultado