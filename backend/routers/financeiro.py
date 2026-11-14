from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from backend.database.conexao_postgres import obter_conexao
from backend.modelos.agencia import AgenciaModel
from backend.modelos.cliente import ClienteModel
from backend.modelos.veiculo_agencia import VeiculoAgenciaModel
from backend.modelos.locacao import LocacaoModel

router = APIRouter(prefix="/api", tags=["Financeiro"])

@router.get("/agencias/{agencia_id}/financeiro")
def obter_financeiro_agencia(agencia_id: int, db: Session = Depends(obter_conexao)):
    agencia = db.query(AgenciaModel).get(agencia_id)
    if not agencia:
        raise HTTPException(status_code=404, detail="Agência não encontrada")

    reservas = db.query(LocacaoModel).filter_by(agencia_id=agencia_id).order_by(LocacaoModel.id.desc()).all()
    locacoes = []
    faturamento_total = 0.0

    for r in reservas:
        cli = db.query(ClienteModel).get(r.cliente_id)
        veic = db.query(VeiculoAgenciaModel).get(r.veiculo_id)
        valor = float(r.valor_estimado or 0.0)
        if r.status in ("ATIVA", "CONCLUIDA"):
            faturamento_total += valor

        nome_cli = cli.nome if cli else f"Cliente #{r.cliente_id}"
        desc_veic = f"{veic.marca} {veic.modelo} ({veic.placa})" if veic else f"Veículo #{r.veiculo_id}"
        data_str = r.data_criacao.strftime("%d/%m/%Y %H:%M") if getattr(r, "data_criacao", None) else "-"

        locacoes.append({
            "id": r.id,
            "reservaId": r.id,
            "cliente": nome_cli,
            "veiculo": desc_veic,
            "metodo": "PIX",
            "valor": round(valor, 2),
            "dias": r.dias_contratados,
            "status": r.status,
            "status_pagamento": r.status_pagamento,
            "data": data_str
        })

    return {
        "agencia_id": agencia.id,
        "cnpj": agencia.cnpj,
        "chave_pix": agencia.chave_pix or agencia.cnpj,
        "faturamento_total": round(faturamento_total, 2),
        "locacoes": locacoes
    }

@router.put("/agencias/{agencia_id}/chave-pix")
def atualizar_chave_pix(agencia_id: int, payload: dict = Body(...), db: Session = Depends(obter_conexao)):
    agencia = db.query(AgenciaModel).get(agencia_id)
    if not agencia:
        raise HTTPException(status_code=404, detail="Agência não encontrada")
    agencia.chave_pix = str(payload.get("chave_pix", "")).strip()
    db.commit()
    return {"sucesso": True, "chave_pix": agencia.chave_pix}
