from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class DocumentCreate(BaseModel):
    collection_id: UUID
    content: str
    is_stale: bool = False


class DocumentUpdate(BaseModel):
    content: Optional[str] = None
    is_stale: Optional[bool] = None


class DocumentResponse(BaseModel):
    id: UUID
    collection_id: UUID
    content: str
    is_stale: bool
    updated_at: datetime

    model_config = {"from_attributes": True}
