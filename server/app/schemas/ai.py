from pydantic import BaseModel
from uuid import UUID
from typing import Optional

class FindRequestInput(BaseModel):
    workspace_id: UUID
    description: str

class GenerateDocsInput(BaseModel):
    collection_id: UUID
