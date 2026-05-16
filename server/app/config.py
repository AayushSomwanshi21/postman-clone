from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    redis_url: str = "redis://localhost:6379"
    gemini_api_key: str
    grok_api_key: str
    grok_model_name: str
    jwt_secret: str
    jwt_expire_minutes: int = 10080

    class Config:
        env_file = ".env"


settings = Settings()
