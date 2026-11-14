from fastapi import APIRouter
from backend.modelos.fipe import ServicoFipe

router = APIRouter(prefix="/api/fipe", tags=["FIPE"])

@router.get("/marcas")
def listar_marcas_fipe():
    return ServicoFipe.listar_marcas()

@router.get("/marcas/{marca_id}/modelos")
def listar_modelos_fipe(marca_id: str):
    return ServicoFipe.listar_modelos(marca_id)

@router.get("/marcas/{marca_id}/modelos/{modelo_id}/anos")
def listar_anos_fipe(marca_id: str, modelo_id: str):
    return ServicoFipe.listar_anos(marca_id, modelo_id)