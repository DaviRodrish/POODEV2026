from datetime import date, timedelta

from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session

from backend.database.conexao_postgres import obter_conexao
from backend.modelos.agencia import AgenciaModel
from backend.modelos.cliente import ClienteModel
from backend.modelos.locacao import ErroLocacao, Locacao, LocacaoModel
from backend.modelos.pagamento import PagamentoPix
from backend.modelos.veiculo_agencia import VeiculoAgenciaModel
from backend.security import decrypt_value

router = APIRouter(prefix="/api", tags=["Reservas"])


def mascarar_cnh(cnh_armazenada: str | None, visiveis_fim: int = 3) -> str:
    """Decifra a CNH armazenada e devolve mascarada, exibindo apenas os últimos caracteres."""
    if not cnh_armazenada or cnh_armazenada == "Não informada":
        return "Não informada"

    valor = str(decrypt_value(cnh_armazenada)).strip()
    if not valor:
        return "Não informada"

    if len(valor) <= visiveis_fim:
        return "•" * len(valor)

    return ("•" * (len(valor) - visiveis_fim)) + valor[-visiveis_fim:]


@router.post("/reservas")
async def solicitar_reserva(
    cliente_id: int = Form(...),
    veiculo_id: int = Form(...),
    dias: int = Form(...),
    motorista_secundario: str = Form("false"),
    motorista_nome: str = Form(None),
    motorista_cnh: str = Form(None),
    outra_agencia: str = Form("false"),
    agencia_destino: str = Form(None),
    valor_total: float = Form(...),
    ori: str = Form("Campos dos Goytacazes"),
    dest: str = Form("Campos dos Goytacazes"),
    db: Session = Depends(obter_conexao),
):
    try:
        cliente_db = db.query(ClienteModel).filter(ClienteModel.id == cliente_id).first()
        if not cliente_db:
            raise HTTPException(status_code=404, detail="Cliente não encontrado.")

        veiculo_db = db.query(VeiculoAgenciaModel).filter(VeiculoAgenciaModel.id == veiculo_id).first()
        if not veiculo_db:
            raise HTTPException(status_code=404, detail="Veículo não encontrado.")

        ini = date.today()
        fim = ini + timedelta(days=int(dias))

        nova_locacao = Locacao(
            cli=cliente_db,
            veic=veiculo_db,
            ini=ini,
            fim=fim,
            diaria=veiculo_db.valor_diaria,
            ori=ori,
            dest=dest,
        )

        registro_db = LocacaoModel(
            cliente_id=cliente_db.id,
            veiculo_id=veiculo_db.id,
            agencia_id=veiculo_db.agencia_id,
            dias_contratados=nova_locacao.qtd_dias,
            valor_estimado=float(valor_total),
            motorista_secundario=(motorista_secundario == "true"),
            motorista_nome=motorista_nome,
            motorista_cnh=motorista_cnh,
            outra_agencia=(outra_agencia == "true"),
            agencia_destino=agencia_destino,
            status="PENDENTE",
            ativa=True,
        )
        db.add(registro_db)
        db.commit()

        return {
            "success": True,
            "message": "Solicitação de reserva criada com sucesso!",
            "qtd_dias": nova_locacao.qtd_dias,
            "valor_total": float(valor_total),
            "status": "PENDENTE",
        }

    except HTTPException as he:
        raise he
    except ErroLocacao as el:
        raise HTTPException(status_code=400, detail=str(el))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agencias/{agencia_id}/reservas-pendentes")
def listar_reservas_pendentes(agencia_id: int, db: Session = Depends(obter_conexao)):
    pendentes = db.query(LocacaoModel).filter_by(agencia_id=agencia_id, status="PENDENTE").all()
    lista = []
    for loc in pendentes:
        cli = db.query(ClienteModel).get(loc.cliente_id)
        veic = db.query(VeiculoAgenciaModel).get(loc.veiculo_id)

        cliente_dados = None
        if cli:
            cnh_masc = mascarar_cnh(cli.cnh)
            cliente_dados = {
                "id": cli.id,
                "nome": cli.nome,
                "email": cli.email,
                "cnh": cnh_masc,
                "cnh_mascarada": cnh_masc,
                "cnh_valida": cli.pode_alugar(),
            }

        lista.append({
            "id": loc.id,
            "dias": loc.dias_contratados,
            "valor_total": loc.valor_estimado,
            "cliente": cliente_dados,
            "veiculo": veic,
        })
    return lista


@router.put("/reservas/{reserva_id}/responder")
def responder_reserva(reserva_id: int, aprovar: str = Form(...), db: Session = Depends(obter_conexao)):
    loc = db.query(LocacaoModel).get(reserva_id)
    if not loc:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    veic = db.query(VeiculoAgenciaModel).get(loc.veiculo_id)
    if aprovar == "true":
        loc.status = "APROVADA"
        if veic:
            veic.status = "alugado"
    else:
        loc.status = "RECUSADA"
        if veic:
            veic.status = "disponível"
    db.commit()
    return {"ok": True, "status": loc.status}


@router.put("/reservas/{reserva_id}/pagar")
def pagar_reserva(reserva_id: int, db: Session = Depends(obter_conexao)):
    loc = db.query(LocacaoModel).get(reserva_id)
    if not loc:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    if not hasattr(loc, "veiculo") or loc.veiculo is None:
        loc.veiculo = db.query(VeiculoAgenciaModel).get(loc.veiculo_id) if getattr(loc, "veiculo_id", None) else None
    if not hasattr(loc, "valor_total") or loc.valor_total is None:
        loc.valor_total = float(getattr(loc, "valor_estimado", 0.0) or 100.0)
    agencia = db.query(AgenciaModel).get(loc.veiculo.agencia_id) if loc.veiculo else None
    chave_destino = agencia.get_chave_pix() if agencia else "agencia@poodev.com"
    pagador = PagamentoPix()
    recibo = pagador.processar(valor=loc.valor_total, destino=chave_destino)
    loc.status = "AGUARDANDO_CONFIRMACAO"
    db.commit()
    return {
        "sucesso": True,
        "status": loc.status,
        "mensagem": "Pagamento PIX informado! Aguardando confirmação da agência (RF09).",
        "recibo": recibo.to_dict(),
    }


@router.put("/reservas/{reserva_id}/confirmar-pix")
def confirmar_pix_reserva(reserva_id: int, db: Session = Depends(obter_conexao)):
    loc = db.query(LocacaoModel).get(reserva_id)
    if not loc:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    loc.status = "ATIVA"
    db.commit()
    return {
        "sucesso": True,
        "status": loc.status,
        "mensagem": "Recebimento PIX confirmado pela agência! Locação ATIVA.",
    }


@router.put("/reservas/{reserva_id}/devolver")
def devolver_reserva(reserva_id: int, db: Session = Depends(obter_conexao)):
    loc = db.query(LocacaoModel).get(reserva_id)
    veic = db.query(VeiculoAgenciaModel).get(loc.veiculo_id)
    loc.status = "CONCLUIDA"
    if veic.status != "manutenção" and not veic.precisa_revisao():
        veic.status = "disponível"
    else:
        veic.colocar_em_manutencao()
    db.commit()
    return {"ok": True}