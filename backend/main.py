import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from backend.routers import emergencias, fipe, veiculos, reservas, auth, clientes, manutencao, financeiro

load_dotenv()

app = FastAPI(title="API Sistema de Aluguel de Carros")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(emergencias.router)
app.include_router(fipe.router)
app.include_router(veiculos.router)
app.include_router(reservas.router)
app.include_router(auth.router)
app.include_router(clientes.router)
app.include_router(manutencao.router)
app.include_router(financeiro.router)

@app.get("/")
def raiz():
    return {"mensagem": "API do Sistema de Aluguel de Carros a rodar com sucesso!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
