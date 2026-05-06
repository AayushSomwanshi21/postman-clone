from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class WorkspaceCreate(BaseModel):
    name: str


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None


class WorkspaceResponse(BaseModel):
    id: UUID
    owner_id: UUID
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}
