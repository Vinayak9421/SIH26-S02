import logging
from typing import Generator, Tuple
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import OperationalError

from .config import settings

logger = logging.getLogger("uvicorn.error")

# Base class for SQLAlchemy models
Base = declarative_base()


def create_db_engine():
    """
    Creates SQLAlchemy engine configured for Neon PostgreSQL with SSL and connection pooling.
    If the remote PostgreSQL connection fails (e.g. invalid credentials or network outage),
    falls back automatically to SQLite for local development continuity.
    """
    db_url = settings.normalized_database_url

    # Explicit SQLite
    if db_url.startswith("sqlite"):
        logger.info("Using SQLite database.")
        return create_engine(db_url, connect_args={"check_same_thread": False})

    # Neon PostgreSQL configuration
    try:
        pg_engine = create_engine(
            db_url,
            pool_pre_ping=True,      # Tests connection validity before handing out from pool
            pool_size=10,            # Max persistent connections
            max_overflow=20,         # Temporary bursting
            pool_recycle=300,        # 5-minute connection recycle for Neon serverless
            connect_args={"connect_timeout": 5}
        )
        
        # Test connection actively
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Connected successfully to Neon PostgreSQL database.")
        return pg_engine

    except Exception as e:
        logger.warning(
            f"Could not connect to configured PostgreSQL server ({e}). "
            "Falling back to local SQLite (sqlite:///./complaints_dev.db). "
            "Update DATABASE_URL in .env with your valid Neon PostgreSQL credentials to connect."
        )
        return create_engine("sqlite:///./complaints_dev.db", connect_args={"check_same_thread": False})


engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a database session per request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> Tuple[bool, str]:
    """
    Health check helper to test active database connectivity.
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            db_dialect = engine.dialect.name.upper()
            return True, f"Connected to {db_dialect} database."
    except Exception as e:
        return False, f"Database connection error: {str(e)}"


def init_db():
    """
    Initialize all database tables defined in Base metadata.
    """
    from app.models import complaint  # noqa: F401
    try:
        Base.metadata.create_all(bind=engine)
        logger.info(f"Database tables initialized on {engine.dialect.name.upper()}.")
    except Exception as e:
        logger.error(f"Error initializing database tables: {e}")
