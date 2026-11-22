from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from backend.database.conexao_postgres import obter_conexao
from backend.modelos.cliente import ClienteModel
from backend.modelos.locacao import LocacaoModel
from backend.modelos.agencia import AgenciaModel
from backend.security import decrypt_value

router = APIRouter(prefix="/api", tags=["Clientes"])


@router.get("/clientes")
def listar_clientes(db: Session = Depends(obter_conexao)):
    clientes = db.query(ClienteModel).order_by(ClienteModel.id.asc()).all()
    resultado = []
    for c in clientes:
        total_loc = db.query(LocacaoModel).filter_by(cliente_id=c.id).count()
        doc_cpf = c.cpf if hasattr(c, "cpf") else c.get_documento()
        cpf_claro = decrypt_value(str(doc_cpf)) if doc_cpf else None
        cnh_clara = decrypt_value(c.cnh) if c.cnh and c.cnh != "Não informada" else c.cnh
        st = getattr(c.status, "value", c.status) or "ATIVO"
        resultado.append({
            "id": c.id,
            "nome": c.nome,
            "email": c.email,
            "cpf": cpf_claro,
            "cnh": cnh_clara,
            "status": st,
            "motivo": c.motivo,
            "total_locacoes": total_loc
        })
    return resultado


# [BLOQUEIO 1/2] RF27 - Altera status (ATIVO/BLOQUEADO) via modelos/cliente.py -> Postgres
@router.put("/clientes/{cliente_id}/status")
def atualizar_status_cliente(cliente_id: int, payload: dict = Body(...), db: Session = Depends(obter_conexao)):
    cliente = db.query(ClienteModel).get(cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")

    novo_status = str(payload.get("status", "")).strip().upper()
    motivo = payload.get("motivo", "")

    if novo_status == "BLOQUEADO":
        cliente.bloquear(motivo)
    elif novo_status == "ATIVO":
        cliente.desbloquear()
    else:
        raise HTTPException(status_code=400, detail="Status inválido. Use 'ATIVO' ou 'BLOQUEADO'.")

    db.commit()
    db.refresh(cliente)

    st = getattr(cliente.status, "value", cliente.status)
    return {
        "sucesso": True,
        "cliente_id": cliente.id,
        "status": st,
        "motivo": cliente.motivo,
        "mensagem": f"Status do cliente atualizado para {st} com sucesso."
    }


# RF17 - Historico de locacoes do cliente
@router.get("/clientes/{cliente_id}/reservas")
def listar_reservas_cliente(cliente_id: int, db: Session = Depends(obter_conexao)):
    reservas = db.query(LocacaoModel).filter_by(cliente_id=cliente_id).all()
    resultado = []
    for r in reservas:
        agencia = db.query(AgenciaModel).get(r.agencia_id) if hasattr(r, "agencia_id") else None
        chave_pix_raw = (
            agencia.get_chave_pix()
            if agencia and hasattr(agencia, "get_chave_pix")
            else (getattr(agencia, "chave_pix", None) or getattr(agencia, "cnpj", None) or "agencia@poodev.uenf.br")
        )
        chave_pix = decrypt_value(chave_pix_raw)
        motorista_cnh_clara = decrypt_value(r.motorista_cnh) if getattr(r, "motorista_cnh", None) else None
        agencia_nome = agencia.nome if agencia and agencia.nome else f"Agência #{r.agencia_id}"
        agencia_endereco = agencia.endereco if agencia and agencia.endereco else "Endereço da filial de retirada"
        resultado.append({
            "id": r.id,
            "status": r.status,
            "veiculo_id": r.veiculo_id,
            "agencia_id": getattr(r, "agencia_id", None),
            "agencia_nome": agencia_nome,
            "agencia_endereco": agencia_endereco,
            "endereco_retirada": agencia_endereco,
            "dias": r.dias_contratados,
            "valor_total": r.valor_estimado,
            "motorista_secundario": getattr(r, "motorista_secundario", False),
            "motorista_nome": getattr(r, "motorista_nome", None),
            "motorista_cnh": motorista_cnh_clara,
            "outra_agencia": getattr(r, "outra_agencia", False),
            "agencia_destino": getattr(r, "agencia_destino", None),
            "agencia_pix": chave_pix
        })
    return resultado