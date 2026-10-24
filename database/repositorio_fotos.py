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
  # Testa a conexão imediatamente
  mongo_client.admin.command("ping")

  db_mongo = mongo_client["poodev_imagens"]
  colecao_fotos = db_mongo["fotos_clientes"]
  print("Conexão com o MongoDB Atlas estabelecida com sucesso!")
except Exception as e:
  print(f"Erro ao conectar ao MongoDB Atlas: {e}")


def salvar_foto(cliente_id, veiculo_id, caminho_arquivo):
  """Função responsável por inserir o documento da foto no MongoDB Atlas."""
  if colecao_fotos is None:
    raise Exception(
        "A coleção do MongoDB não está disponível devido a um erro de"
        " conexão prévio."
    )

  documento_foto = {
      "cliente_id": cliente_id,
      "veiculo_id": veiculo_id,
      "caminho_arquivo": caminho_arquivo,
      "enviado_em": datetime.utcnow(),
  }
  resultado = colecao_fotos.insert_one(documento_foto)
  return resultado.inserted_id