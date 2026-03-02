from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from core.settings import settings

# Use the dynamically assembled URI from our settings file
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()