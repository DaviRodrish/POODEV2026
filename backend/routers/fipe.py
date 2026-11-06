from fastapi import APIRouter
from backend.modelos.fipe import ServicoFipe

router = APIRouter(prefix="/api/fipe", tags=["FIPE"])

@router.get("/marcas")
def listar_marcas_fipe():
    """Retorna as 10 marcas principais da FIPE."""
    return ServicoFipe.listar_marcas()

@router.get("/marcas/{marca_id}/modelos")
def listar_modelos_fipe(marca_id: str):
    """Retorna os modelos de uma determinada marca."""
    return ServicoFipe.listar_modelos(marca_id)

@router.get("/marcas/{marca_id}/modelos/{modelo_id}/anos")
def listar_anos_fipe(marca_id: str, modelo_id: str):
    """Retorna os anos/versões de um determinado modelo."""
    return ServicoFipe.listar_anos(marca_id, modelo_id)