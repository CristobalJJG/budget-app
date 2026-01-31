import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Read JS-like DB env vars (same as Back/src/db.js)
    DB_NAME = os.getenv("DB_DATABASE") or os.getenv("DB_NAME")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "3306")

    if DB_NAME and DB_USER and DB_PASSWORD:
        SQLALCHEMY_DATABASE_URI = (
            f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        )
    else:
        # Fallback to DATABASE_URL or sqlite for local dev
        SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///budget_py.db")

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-secret")
