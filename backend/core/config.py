from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Configs(BaseSettings):
    # Project Metadata
    PROJECT_NAME: str = "KimKhawb Hair Studio API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Security / Authentication (For your Employee Login & RBAC)
    SECRET_KEY: str = "REPLACE_THIS_WITH_A_SECURE_GENERATED_STRING_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days

    # CORS Configuration (To allow your HTML dashboard to talk to the API)
    # Use ["*"] for dev, but restrict to your actual frontend domain in production
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost", "http://127.0.0.1", "http://localhost:8000", "http://localhost:5173"]

    # PostgreSQL Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "kimkhwab"
    POSTGRES_PORT: int = 5432

    # Redis (For caching, rate limiting, or background tasks like generating reports)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        """Assembles the database URL from the components."""
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def REDIS_URI(self) -> str:
        """Assembles the Redis URL."""
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    # This tells Pydantic to read overrides from a .env file if it exists
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

Configs = Configs()