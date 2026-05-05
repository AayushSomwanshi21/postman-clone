from pydantic import BaseModel
from typing import Any

class ProxyRequest(BaseModel):
    method: str
    url: str
    headers: dict[str, str] = {}
    params: dict[str, str] = {}
    body: Any = None

class ProxyResponse(BaseModel):
    status_code: int
    headers: dict[str, str]
    body: Any
    elapsed_ms: float
