from sqlmodel import SQLModel, create_engine, Session
from .config import Config


engine = create_engine(Config.DATABASE_URL, echo=False)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Session:
    with Session(engine) as session:
        yield session


