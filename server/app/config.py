from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    grok_api_key: str
    grok_model_name: str
    jwt_secret: str
    jwt_expire_minutes: int = 10080

    class Config:
        env_file = ".env"


settings = Settings()
