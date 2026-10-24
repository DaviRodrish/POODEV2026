from database.repositorio_fotos import (
    salvar_foto,
)  # Ajusta o import se o ficheiro estiver numa pasta como 'database.repositorio_fotos'


def main():
  print("--- A TESTAR APENAS O MONGODB ATLAS ---")

  try:
    # Usamos IDs de exemplo para testar a gravação no MongoDB
    cliente_id = 1
    veiculo_id = 1
    caminho_arquivo_foto = "fotos/veiculo_exemplo.jpg"

    # Chama a função do repositório do MongoDB
    id_foto_mongo = salvar_foto(
        cliente_id=cliente_id,
        veiculo_id=veiculo_id,
        caminho_arquivo=caminho_arquivo_foto,
    )
    print(f"Foto salva com sucesso no MongoDB Atlas! ID: {id_foto_mongo}")

  except Exception as e:
    print(f"Erro ao salvar a foto no MongoDB: {e}")

  print("\n--- TESTE CONCLUÍDO ---")


if __name__ == "__main__":
  main()