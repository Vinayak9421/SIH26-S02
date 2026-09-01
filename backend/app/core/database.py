import logging
from typing import Generator, Tuple
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from app.config import settings

logger = logging.getLogger("uvicorn.error")

Base = declarative_base()


def create_db_engine():
    """
    Creates SQLAlchemy engine configured for Neon / Supabase PostgreSQL with SSL and pooling.
    Falls back gracefully to SQLite for local development continuity if remote is not reachable.
    """
    db_url = settings.normalized_database_url

    if db_url.startswith("sqlite"):
        logger.info("Using local SQLite database.")
        return create_engine(db_url, connect_args={"check_same_thread": False})

    try:
        pg_engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            pool_recycle=300,
            connect_args={"connect_timeout": 5}
        )
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(f"Connected successfully to PostgreSQL database ({db_url.split('@')[-1] if '@' in db_url else 'configured'}).")
        return pg_engine

    except Exception as e:
        logger.warning(
            f"Could not connect to configured PostgreSQL server ({e}). "
            "Using local SQLite (sqlite:///./complaints_dev.db). "
            "Update DATABASE_URL in .env to connect to your PostgreSQL database."
        )
        return create_engine("sqlite:///./complaints_dev.db", connect_args={"check_same_thread": False})


engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a DB session per request"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> Tuple[bool, str]:
    """Health check helper to test active DB connectivity"""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            db_dialect = engine.dialect.name.upper()
            return True, f"Connected to {db_dialect} database."
    except Exception as e:
        return False, f"Database connection error: {str(e)}"


def init_db():
    """Initialize database tables defined across all models"""
    from app.models import (  # noqa: F401
        Department,
        Profile,
        Issue,
        Complaint,
        ComplaintStatusHistory,
        IssueStatusHistory,
        AuditLog
    )
    try:
        Base.metadata.create_all(bind=engine)
        logger.info(f"Database tables initialized on {engine.dialect.name.upper()}.")
    except Exception as e:
        logger.error(f"Error initializing database tables: {e}")
