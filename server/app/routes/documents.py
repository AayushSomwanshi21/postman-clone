import re
import markdown
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from xhtml2pdf import pisa
from io import BytesIO
from app.database import get_db
from app.models.collection import Collection, Request
from app.models.document import Document
from app.models.environment import Environment, EnvVariable
from app.schemas.ai import GenerateDocsRequest
from app.schemas.document import DocumentListResponse, DocumentResponse, DocumentUpdate
from app.services.ai_service import (
    DocsGenerationError,
    DocsGenerationQuotaError,
    generate_collection_docs,
)
from app.middleware.auth import get_current_user
from app.services.db import get_collection, get_document, get_workspace
from app.utils.interpolate import interpolate_content, find_unresolved_variables

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
    document_name = data.name.strip(
    ) if data and data.name and data.name.strip() else f"{collection.name} Docs"
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


@router.post("/{document_id}/export", status_code=200)
def export_document(
    document: Document = Depends(get_document),
    db: Session = Depends(get_db),
):
    collection = (
        db.query(Collection)
        .filter(Collection.id == document.collection_id)
        .first()
    )
    if collection is None:
        raise HTTPException(status_code=404, detail="Collection not found")

    active_environment = (
        db.query(Environment)
        .filter(
            Environment.workspace_id == collection.workspace_id,
            Environment.is_active.is_(True),
        )
        .first()
    )
    variables: dict[str, str] = {}
    if active_environment is not None:
        env_variables = (
            db.query(EnvVariable)
            .filter(EnvVariable.env_id == active_environment.id)
            .all()
        )
        variables = {
            variable.key: variable.value for variable in env_variables}

    resolved_content = interpolate_content(document.content, variables)
    unresolved_variables = find_unresolved_variables(resolved_content)
    if unresolved_variables:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Some environment variables could not be resolved for export.",
                "unresolved_variables": unresolved_variables,
            },
        )

    html_content = markdown.markdown(
        resolved_content,
        extensions=["tables", "fenced_code", "toc"]
    )

    html_content = re.sub(r'<pre><code[^>]*>', '<pre>', html_content)
    html_content = re.sub(r'</code></pre>', '</pre>', html_content)
    # Wrap with styles
    full_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page {{ margin: 40px; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; line-height: 1.4; }}
        h1 {{ font-size: 28px; font-weight: 700; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin: 0 0 10px 0; }}
        h2 {{ font-size: 22px; font-weight: 600; margin: 20px 0 6px 0; }}
        h3 {{ font-size: 17px; font-weight: 600; margin: 14px 0 4px 0; }}
        h4 {{ font-size: 14px; font-weight: 600; margin: 10px 0 4px 0; }}
        p  {{ margin: 0 0 8px 0; }}
        code {{ font-family: monospace; font-size: 12px; }}
        pre {{ background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 8px; font-size: 12px; font-family: monospace; margin: 8px 0; }}
        table {{ width: 100%; border-collapse: collapse; margin: 8px 0; }}
        th {{ background: #f9fafb; text-align: left; padding: 10px 12px; border: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; }}
        td {{ padding: 9px 12px; border: 1px solid #e5e7eb; font-size: 13px; }}
        tr:nth-child(even) td {{ background: #f9fafb; }}
        blockquote {{ border-left: 4px solid #e5e7eb; margin: 0 0 8px 0; padding-left: 16px; color: #6b7280; }}
        a {{ color: #2563eb; text-decoration: none; }}
        ul, ol {{ padding-left: 24px; margin: 0 0 8px 0; }}
        li {{ margin: 0 0 2px 0; }}
      </style>
    </head>
    <body>{html_content}</body>
    </html>
    """
    buffer = BytesIO()
    result = pisa.CreatePDF(full_html, dest=buffer)
    if result.err:
        raise HTTPException(status_code=500, detail="Failed to generate PDF")

    buffer.seek(0)

    document_name = re.sub(
        r'\s+', '-', re.sub(r'[^\w\s-]', '', document.name)).strip('-') or "api-docs"

    return Response(
        content=buffer.read(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{document_name}.pdf"'
        }
    )
