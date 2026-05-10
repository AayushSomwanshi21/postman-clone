from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class EnvironmentCreate(BaseModel):
    workspace_id: UUID
    name: str


class EnvironmentUpdate(BaseModel):
    name: Optional[str] = None


class EnvironmentResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class VariableCreate(BaseModel):
    key: str
    value: str
    is_secret: bool = False


class VariableUpdate(BaseModel):
    key: Optional[str] = None
    value: Optional[str] = None
    is_secret: Optional[bool] = None


class VariableResponse(BaseModel):
    id: UUID
    env_id: UUID
    key: str
    value: str
    is_secret: bool

    model_config = {"from_attributes": True}
