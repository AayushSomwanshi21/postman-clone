from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.collection import Collection, Request
from app.models.document import Document
from app.schemas.ai import GenerateDocsRequest
from app.schemas.document import DocumentListResponse, DocumentResponse, DocumentUpdate
from app.services.ai_service import (
    DocsGenerationError,
    DocsGenerationQuotaError,
    generate_collection_docs,
)
from app.middleware.auth import get_current_user
from app.services.db import get_collection, get_document, get_workspace

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=List[DocumentListResponse])
def list_documents(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    workspace = get_workspace(
        workspace_id=workspace_id, db=db, user_id=user_id)
    return (
        db.query(Document)
        .join(Collection, Document.collection_id == Collection.id)
        .filter(Collection.workspace_id == workspace.id)
        .order_by(Document.updated_at.desc())
        .all()
    )


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document_by_id(
    document: Document = Depends(get_document),
):
    return document


@router.post("/generate-docs/{collection_id}", response_model=DocumentResponse)
def generate_docs(
    data: GenerateDocsRequest | None = None,
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
    document_name = data.name.strip() if data and data.name and data.name.strip() else f"{collection.name} Docs"
    if document is None:
        document = Document(
            collection_id=collection.id,
            name=document_name,
            content=markdown,
            is_stale=False,
        )
        db.add(document)
    else:
        document.name = document_name
        document.content = markdown
        document.is_stale = False
    db.commit()
    db.refresh(document)
    return document


@router.put("/{document_id}", response_model=DocumentResponse)
def update_document(
    data: DocumentUpdate,
    document: Document = Depends(get_document),
    db: Session = Depends(get_db),
):
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(document, field, value)
    db.commit()
    db.refresh(document)
    return document


@router.delete("/{document_id}", status_code=204)
def delete_document(
    document: Document = Depends(get_document),
    db: Session = Depends(get_db),
):
    db.delete(document)
    db.commit()
