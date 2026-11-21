from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, File, Response
from sqlalchemy.orm import Session

from backend.database.conexao_postgres import obter_conexao
from backend.database.repositorio_fotos import (
    salvar_foto_odometro_binaria,
    salvar_foto_veiculo_binaria,
    colecao_fotos
)
from backend.modelos.veiculo import VeiculoModel
from backend.modelos.veiculo_agencia import VeiculoAgenciaModel
from backend.modelos.agencia import AgenciaModel

router = APIRouter(prefix="/api", tags=["Veículos"])

@router.get("/catalogo/veiculos")
def listar_catalogo_veiculos(db: Session = Depends(obter_conexao)):
    veiculos = db.query(VeiculoAgenciaModel).all()
    agencias_map = {a.id: a for a in db.query(AgenciaModel).all()}
    resultado = []
    for v in veiculos:
        ag = agencias_map.get(v.agencia_id)
        resultado.append({
            "id": v.id,
            "agencia_id": v.agencia_id,
            "agencia_nome": ag.nome if ag and ag.nome else f"Agência {v.agencia_id or 1}",
            "agencia_endereco": ag.endereco if ag and ag.endereco else "Endereço não informado",
            "placa": v.placa,
            "marca": v.marca,
            "modelo": v.modelo,
            "ano": v.ano,
            "valor_diaria": v.valor_diaria,
            "status": v.status,
            "combustivel_nivel": v.combustivel_nivel,
            "quilometragem": v.quilometragem,
            "km_rev": v.km_rev,
            "fipeP": v.fipeP,
            "fipeA": v.fipeA,
            "precisa_revisao": v.precisa_revisao(),
            "cilindrada": v.cilindrada,
            "combustivel_tipo": v.tipo_combustivel,
            "emissao_100km": v.calcular_emissao(100),
            "foto_url": f"/api/veiculos/{v.id}/foto"
        })
    return resultado


@router.post("/agencias/{agencia_id}/veiculos")
async def cadastrar_veiculo_agencia(
    agencia_id: int,
    placa: str = Form(...),
    marca_codigo: str = Form(...),
    modelo_codigo: str = Form(...),
    ano_codigo: str = Form(...),
    valor_diaria: float = Form(...),
    foto: UploadFile = File(None),
    db: Session = Depends(obter_conexao)
):
    try:
        placa_limpa = placa.strip().upper()
        existente = db.query(VeiculoAgenciaModel).filter(VeiculoAgenciaModel.placa == placa_limpa).first()
        if existente:
            raise HTTPException(status_code=400, detail="Veículo já cadastrado com esta placa.")

        veic_fipe = VeiculoModel(
            placa=placa_limpa,
            marca_id=marca_codigo,
            modelo_id=modelo_codigo,
            ano_id=ano_codigo
        )

        novo_veiculo = VeiculoAgenciaModel(
            agencia_id=agencia_id,
            placa=placa_limpa,
            marca=veic_fipe.marca_nome,
            modelo=veic_fipe.modelo_nome,
            ano=int(veic_fipe.ano_modelo or 2024),
            valor_diaria=float(valor_diaria),
            status="disponível",
            fipeP=veic_fipe.valor_fipe_texto,
            fipeA=ano_codigo
        )

        db.add(novo_veiculo)
        db.commit()
        db.refresh(novo_veiculo)

        foto_id = None
        if foto and foto.filename:
            dados_foto = await foto.read()
            if len(dados_foto) <= 10 * 1024 * 1024:
                try:
                    foto_id = salvar_foto_veiculo_binaria(
                        veiculo_id=novo_veiculo.id,
                        nome_arquivo=foto.filename,
                        content_type=foto.content_type or "image/jpeg",
                        dados_binarios=dados_foto
                    )
                except Exception as e:
                    print(f"Erro foto veículo: {e}")

        return {
            "success": True,
            "message": "Veículo cadastrado com sucesso!",
            "veiculo": novo_veiculo,
            "foto_id": foto_id
        }
    except HTTPException as he:
        raise he
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/veiculos/{veiculo_id}/vistoria")
async def atualizar_vistoria_veiculo(
    veiculo_id: int,
    quilometragem: float = Form(...),
    combustivel_nivel: float = Form(...),
    foto_odometro: UploadFile = File(None),
    foto_veiculo: UploadFile = File(None),
    db: Session = Depends(obter_conexao)
):
    veiculo = db.query(VeiculoAgenciaModel).filter(VeiculoAgenciaModel.id == veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")

    km_atual = veiculo.quilometragem or 0
    if quilometragem < km_atual:
        raise HTTPException(
            status_code=400,
            detail=f"Quilometragem inválida: menor que a atual ({km_atual} km)"
        )

    if combustivel_nivel < 0.0 or combustivel_nivel > 1.0:
        raise HTTPException(
            status_code=400,
            detail="Nível de combustível inválido: entre 0.0 e 1.0"
        )

    foto_odometro_id = None
    if foto_odometro and foto_odometro.filename:
        dados_bytes = await foto_odometro.read()
        if len(dados_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Foto do odômetro excede 10MB.")
        try:
            foto_odometro_id = salvar_foto_odometro_binaria(
                veiculo_id=veiculo.id,
                nome_arquivo=foto_odometro.filename,
                content_type=foto_odometro.content_type or "image/jpeg",
                dados_binarios=dados_bytes,
                quilometragem=int(quilometragem)
            )
        except Exception as e:
            print(f"Erro foto odômetro: {e}")

    foto_veiculo_id = None
    if foto_veiculo and foto_veiculo.filename:
        dados_veiculo_bytes = await foto_veiculo.read()
        if len(dados_veiculo_bytes) <= 10 * 1024 * 1024:
            try:
                foto_veiculo_id = salvar_foto_veiculo_binaria(
                    veiculo_id=veiculo.id,
                    nome_arquivo=foto_veiculo.filename,
                    content_type=foto_veiculo.content_type or "image/jpeg",
                    dados_binarios=dados_veiculo_bytes
                )
            except Exception as e:
                print(f"Erro foto veículo: {e}")

    veiculo.quilometragem = int(quilometragem)
    veiculo.combustivel_nivel = round(float(combustivel_nivel), 2)
    if veiculo.precisa_revisao():
        veiculo.colocar_em_manutencao()
    db.commit()
    db.refresh(veiculo)

    tipo_veiculo = "NOVO" if veiculo.quilometragem <= 10000 else "USADO"
    return {
        "sucesso": True,
        "mensagem": "Vistoria registrada com sucesso",
        "veiculo_id": veiculo.id,
        "quilometragem": veiculo.quilometragem,
        "combustivel_nivel": veiculo.combustivel_nivel,
        "tipo": tipo_veiculo,
        "foto_odometro_id": foto_odometro_id,
        "foto_veiculo_id": foto_veiculo_id
    }


@router.get("/veiculos/{veiculo_id}/foto")
def obter_foto_veiculo(veiculo_id: int):
    if colecao_fotos is None:
        raise HTTPException(status_code=500, detail="MongoDB Atlas não está conectado.")
    
    doc = colecao_fotos.find_one(
        {"veiculo_id": int(veiculo_id), "tipo_documento": "FOTO_VEICULO"},
        sort=[("enviado_em", -1)]
    )
    if not doc or "dados_binarios" not in doc:
        raise HTTPException(status_code=404, detail="Foto não encontrada.")
    
    return Response(
        content=doc["dados_binarios"],
        media_type=doc.get("content_type", "image/jpeg")
    )


@router.get("/veiculos/{veiculo_id}/foto-odometro")
def obter_foto_odometro_veiculo(veiculo_id: int):
    if colecao_fotos is None:
        raise HTTPException(status_code=500, detail="MongoDB Atlas não está conectado.")
    
    doc = colecao_fotos.find_one(
        {"veiculo_id": int(veiculo_id), "tipo_documento": "ODOMETRO_VISTORIA"},
        sort=[("enviado_em", -1)]
    )
    if not doc or "dados_binarios" not in doc:
        raise HTTPException(status_code=404, detail="Foto de odômetro não encontrada.")
    
    return Response(
        content=doc["dados_binarios"],
        media_type=doc.get("content_type", "image/jpeg")
    )
