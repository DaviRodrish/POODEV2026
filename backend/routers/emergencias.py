from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session

from backend.database.conexao_postgres import obter_conexao
from backend.modelos.emergencia import Emergencia, EmergenciaError, EmergenciaModel
from backend.modelos.locacao import LocacaoModel

router = APIRouter(prefix="/api", tags=["Emergências"])

@router.post("/emergencias")
async def emitir_alerta_emergencia(
    locacao_id: int = Form(...),
    tipo: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    descricao: str = Form(""),
    db: Session = Depends(obter_conexao)
):
    try:
        locacao_db = db.query(LocacaoModel).filter(LocacaoModel.id == locacao_id).first()
        if not locacao_db:
            raise HTTPException(status_code=404, detail="Locação não encontrada.")

        alerta = Emergencia(
            locacao=locacao_db,
            tipo=tipo,
            latitude=latitude,
            longitude=longitude,
            descricao=descricao
        )

        protocolo = alerta.acionar_seguro()

        nova_emergencia = EmergenciaModel(
            locacao_id=locacao_id,
            agencia_id=locacao_db.agencia_id,
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


@router.put("/emergencias/{emergencia_id}/status")
def atualizar_status_emergencia(
    emergencia_id: int,
    novo_status: str = Form(None),
    status: str = Form(None),
    db: Session = Depends(obter_conexao)
):
    emergencia = db.query(EmergenciaModel).filter(EmergenciaModel.id == emergencia_id).first()
    if not emergencia:
        raise HTTPException(status_code=404, detail="Emergência não encontrada.")

    val_status = novo_status or status
    if not val_status:
        raise HTTPException(status_code=400, detail="Status não informado.")

    status_limpo = val_status.strip().upper()
    status_permitidos = ["ABERTO", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE", "RESOLVIDO", "CANCELADO"]
    if status_limpo not in status_permitidos:
        raise HTTPException(status_code=400, detail=f"Status inválido: {val_status}")

    emergencia.status = status_limpo
    db.commit()
    db.refresh(emergencia)
    return {"sucesso": True, "emergencia_id": emergencia.id, "status": emergencia.status}


@router.get("/clientes/{cliente_id}/emergencias")
def listar_emergencias_cliente(
    cliente_id: int,
    db: Session = Depends(obter_conexao)
):
    locacoes = db.query(LocacaoModel).filter(LocacaoModel.cliente_id == cliente_id).all()
    locacoes_ids = [loc.id for loc in locacoes]
    if not locacoes_ids:
        return []

    alertas = db.query(EmergenciaModel).filter(EmergenciaModel.locacao_id.in_(locacoes_ids)).all()
    return [
        {
            "id": a.id,
            "locacao_id": a.locacao_id,
            "tipo": a.tipo,
            "latitude": a.latitude,
            "longitude": a.longitude,
            "descricao": a.descricao,
            "status": a.status,
            "protocolo_seguro": a.protocolo_seguro,
            "data_hora": a.data_hora.strftime("%d/%m/%Y %H:%M:%S") if a.data_hora else None
        }
        for a in alertas
    ]