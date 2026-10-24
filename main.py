import os
from dotenv import load_dotenv
from modelos.fipe import ServicoFipe
from modelos.veiculo import VeiculoModel

load_dotenv()

def executar_teste_fipe():
    print("--- A consultar Marcas na FIPE ---")
    marcas = ServicoFipe.listar_marcas()
    if not marcas:
        print("Não foi possível carregar as marcas.")
        return

    # Seleciona a primeira marca da lista para teste
    marca_exemplo = marcas[0]
    print(f"Marca Selecionada: {marca_exemplo['nome']} (Código: {marca_exemplo['codigo']})")

    modelos = ServicoFipe.listar_modelos(marca_exemplo['codigo'])
    if not modelos:
        print("Não foi possível carregar os modelos.")
        return

    modelo_exemplo = modelos[0]
    print(f"Modelo Selecionado: {modelo_exemplo['nome']} (Código: {modelo_exemplo['codigo']})")

    anos = ServicoFipe.listar_anos(marca_exemplo['codigo'], modelo_exemplo['codigo'])
    if not anos:
        print("Não foi possível carregar os anos.")
        return

    ano_exemplo = anos[0]
    print(f"Ano Selecionado: {ano_exemplo['nome']} (Código: {ano_exemplo['codigo']})")

    print("\n--- Instanciando o Veículo com os dados da FIPE ---")
    try:
        veiculo = VeiculoModel(
            placa="POO-2026",
            marca_id=marca_exemplo['codigo'],
            modelo_id=modelo_exemplo['codigo'],
            ano_id=ano_exemplo['codigo']
        )
        print(veiculo)
        print(f"Valor convertido para cálculo (float): {veiculo.valor_mercado}")
    except Exception as e:
        print(f"Erro ao instanciar o veículo: {e}")

if __name__ == "__main__":
    executar_teste_fipe()