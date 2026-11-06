from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session

# Importa a função correta do seu módulo de conexão do Postgres e renomeia para get_db
from backend.database.conexao_postgres import obter_conexao as get_db

router = APIRouter(prefix="/api", tags=["Reservas"])

@router.post("/reservas")
def criar_reserva(cliente_id: int = Form(...), veiculo_id: int = Form(...), dias: int = Form(...), db: Session = Depends(get_db)):
    from backend.modelos.locacao import Veiculo, Reserva
    
    veiculo = db.query(Veiculo).filter(Veiculo.id == veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado.")
    
    valor_total = (veiculo.valor_diaria or 0) * dias

    nova_reserva = Reserva(
        cliente_id=cliente_id,
        veiculo_id=veiculo_id,
        dias=dias,
        valor_total=valor_total,
        status="PENDENTE"
    )
    db.add(nova_reserva)
    db.commit()
    db.refresh(nova_reserva)
    return {"message": "Reserva solicitada com sucesso!", "id": nova_reserva.id}

@router.get("/clientes/{cliente_id}/reservas")
def listar_reservas_cliente(cliente_id: int, db: Session = Depends(get_db)):
    from backend.modelos.locacao import Reserva
    reservas = db.query(Reserva).filter(Reserva.cliente_id == cliente_id).all()
    return reservas

@router.put("/reservas/{reserva_id}/responder")
def responder_reserva(reserva_id: int, aprovar: bool = Form(...), db: Session = Depends(get_db)):
    from backend.modelos.locacao import Reserva, Veiculo
    
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva não encontrada.")
    
    if aprovar:
        reserva.status = "APROVADA"
        veiculo = db.query(Veiculo).filter(Veiculo.id == reserva.veiculo_id).first()
        if veiculo:
            veiculo.status = "alugado"
    else:
        reserva.status = "RECUSADA"
        
    db.commit()
    return {"message": f"Reserva atualizada para {reserva.status}"}