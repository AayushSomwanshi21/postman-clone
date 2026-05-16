from pydantic import BaseModel
from uuid import UUID

class FindRequestInput(BaseModel):
    workspace_id: UUID
    description: str

class GenerateDocsResponse(BaseModel):
    markdown: str
