from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


DATABASE_URL = "postgresql://postgres:bgzykDEPwcFteth8@db.qztitlhtomlaudxtyvvu.supabase.co:5432/postgres"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def obter_conexao():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()