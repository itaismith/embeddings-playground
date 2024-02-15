import os

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

PG_USER = os.getenv("POSTGRES_USER")
PG_PASSWORD = os.getenv("POSTGRES_PASSWORD")
PG_DB = os.getenv("POSTGRES_DB")
SQLALCHEMY_DATABASE_URL = f"postgresql+asyncpg://{PG_USER}:{PG_PASSWORD}@db/{PG_DB}"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=True
)

SessionLocal = async_sessionmaker(bind=engine)