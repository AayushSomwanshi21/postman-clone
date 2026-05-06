from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class CollectionCreate(BaseModel):
    workspace_id: UUID
    name: str
    description: str = ""


class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class CollectionResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RequestCreate(BaseModel):
    name: str
    method: str
    url: str
    headers: dict = {}
    params: dict = {}
    body: dict = {}
    auth: dict = {}
    description: str = ""
    position: int = 0


class RequestUpdate(BaseModel):
    name: Optional[str] = None
    method: Optional[str] = None
    url: Optional[str] = None
    headers: Optional[dict] = None
    params: Optional[dict] = None
    body: Optional[dict] = None
    auth: Optional[dict] = None
    description: Optional[str] = None
    position: Optional[int] = None


class RequestResponse(BaseModel):
    id: UUID
    collection_id: UUID
    name: str
    method: str
    url: str
    headers: dict
    params: dict
    body: dict
    auth: dict
    description: Optional[str]
    position: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CollectionWithRequests(CollectionResponse):
    requests: List[RequestResponse] = []
