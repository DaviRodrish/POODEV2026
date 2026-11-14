from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session

from backend.database.conexao_postgres import obter_conexao
from backend.modelos.veiculo_agencia import VeiculoAgenciaModel, Manutencao

router = APIRouter(prefix="/api", tags=["Manutenção"])

HISTORICO_MANUTENCOES = []

@router.get("/agencias/{agencia_id}/manutencoes")
def listar_manutencoes_agencia(agencia_id: int):
    return [m for m in HISTORICO_MANUTENCOES if m["agencia_id"] == agencia_id]

@router.put("/veiculos/{veiculo_id}/manutencao")
def gerenciar_manutencao_veiculo(
    veiculo_id: int,
    acao: str = Form(...),
    descricao: str = Form(""),
    origem: str = Form("REVISAO_KM"),
    db: Session = Depends(obter_conexao)
):
    veiculo = db.query(VeiculoAgenciaModel).filter(VeiculoAgenciaModel.id == veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado.")

    try:
        ordem = Manutencao(veiculo=veiculo, descricao=descricao, origem=origem)
        if acao == "iniciar":
            ordem.iniciar(descricao)
        elif acao == "finalizar":
            ordem.finalizar(descricao)
        else:
            raise HTTPException(status_code=400, detail="Ação inválida. Use 'iniciar' ou 'finalizar'.")

        db.commit()
        db.refresh(veiculo)

        registro_existente = next(
            (m for m in HISTORICO_MANUTENCOES if m["veiculo_id"] == veiculo.id and m["status"] == "EM_ANDAMENTO"),
            None
        )

        if registro_existente:
            registro_existente["descricao"] = ordem.descricao
            registro_existente["status"] = ordem.status
            registro_existente["km_revisao"] = ordem.km_revisao
            registro_existente["data_hora"] = ordem.data_hora.strftime("%d/%m/%Y %H:%M:%S")
            registro = registro_existente
        else:
            registro = {
                "id": len(HISTORICO_MANUTENCOES) + 1,
                "agencia_id": veiculo.agencia_id,
                "veiculo_id": veiculo.id,
                "placa": veiculo.placa,
                "modelo": f"{veiculo.marca} {veiculo.modelo}",
                "origem": ordem.origem,
                "km_revisao": ordem.km_revisao,
                "descricao": ordem.descricao,
                "status": ordem.status,
                "data_hora": ordem.data_hora.strftime("%d/%m/%Y %H:%M:%S")
            }
            HISTORICO_MANUTENCOES.insert(0, registro)

        return {
            "sucesso": True,
            "mensagem": (
                f"Manutenção de {veiculo.placa} colocada em andamento."
                if acao == "iniciar"
                else f"Manutenção de {veiculo.placa} finalizada. Veículo disponível (próxima revisão em {veiculo.km_rev} km)."
            ),
            "manutencao": registro,
            "veiculo_status": veiculo.status,
            "novo_km_rev": veiculo.km_rev
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
