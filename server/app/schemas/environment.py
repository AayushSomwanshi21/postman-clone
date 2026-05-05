from pydantic import BaseModel

class EnvironmentCreate(BaseModel):
    name: str

class VariableCreate(BaseModel):
    key: str
    value: str
    is_secret: bool = False
