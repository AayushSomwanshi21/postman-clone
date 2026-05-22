from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class DocumentUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    is_stale: Optional[bool] = None


class DocumentListResponse(BaseModel):
    id: UUID
    collection_id: UUID
    name: str
    is_stale: bool
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentResponse(DocumentListResponse):
    content: str

    model_config = {"from_attributes": True}
