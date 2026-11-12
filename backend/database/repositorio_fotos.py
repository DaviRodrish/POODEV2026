import os
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

db_mongo = None
colecao_fotos = None

try:
    mongo_client = MongoClient(MONGO_URI)
    mongo_client.admin.command("ping")

    db_mongo = mongo_client["poodev_imagens"]
    colecao_fotos = db_mongo["fotos_clientes"]
    print("Conexão com o MongoDB Atlas estabelecida com sucesso!")
except Exception as e:
    print(f"Erro ao conectar ao MongoDB Atlas: {e}")


def salvar_foto_binaria(cliente_id, veiculo_id, nome_arquivo, content_type, dados_binarios):
    """Salva a foto binária diretamente no MongoDB Atlas."""
    if colecao_fotos is None:
        raise Exception("A coleção do MongoDB não está disponível devido a um erro de conexão.")

    documento_foto = {
        "cliente_id": cliente_id,
        "veiculo_id": veiculo_id,
        "nome_arquivo": nome_arquivo,
        "content_type": content_type,
        "dados_binarios": dados_binarios, # O PyMongo converte bytes para BinData nativamente
        "enviado_em": datetime.utcnow(),
    }
    resultado = colecao_fotos.insert_one(documento_foto)
    return resultado.inserted_id


def salvar_cnh_motorista_binaria(cliente_id, nome_arquivo, content_type, dados_binarios):
    """Salva o documento/foto da CNH em formato binário diretamente no MongoDB Atlas."""
    if colecao_fotos is None:
        raise Exception("A coleção do MongoDB não está disponível devido a um erro de conexão.")

    documento_cnh = {
        "cliente_id": cliente_id,
        "tipo_documento": "CNH",
        "nome_arquivo": nome_arquivo,
        "content_type": content_type,
        "dados_binarios": dados_binarios,
        "enviado_em": datetime.utcnow(),
    }
    resultado = colecao_fotos.insert_one(documento_cnh)
    return resultado.inserted_id