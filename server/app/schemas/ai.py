from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class FindRequestInput(BaseModel):
    workspace_id: UUID
    description: str

class GenerateDocsRequest(BaseModel):
    name: Optional[str] = None
