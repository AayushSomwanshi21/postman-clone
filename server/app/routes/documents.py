from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.collection import Collection, Request
from app.models.document import Document
from app.schemas.ai import GenerateDocsResponse
from app.services.ai_service import (
    DocsGenerationError,
    DocsGenerationQuotaError,
    generate_collection_docs,
)
from app.services.db import get_collection

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/generate-docs/{collection_id}", response_model=GenerateDocsResponse)
def generate_docs(
    collection: Collection = Depends(get_collection),
    db: Session = Depends(get_db),
):
    requests = (
        db.query(Request)
        .filter(Request.collection_id == collection.id)
        .order_by(Request.position)
        .all()
    )
    try:
        markdown = generate_collection_docs(
            collection=collection, requests=requests
        )
    except DocsGenerationQuotaError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except DocsGenerationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    document = (
        db.query(Document)
        .filter(Document.collection_id == collection.id)
        .first()
    )
    if document is None:
        document = Document(
            collection_id=collection.id,
            content=markdown,
            is_stale=False,
        )
        db.add(document)
    else:
        document.content = markdown
        document.is_stale = False
    db.commit()
    return GenerateDocsResponse(markdown=markdown)
