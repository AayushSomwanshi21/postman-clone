from pydantic import BaseModel
from typing import Any
from uuid import UUID

class CollectionCreate(BaseModel):
    name: str
    description: str = ""

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
