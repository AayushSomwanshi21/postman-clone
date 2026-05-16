import json
from typing import Any, Iterable

from openai import OpenAI

from app.config import settings
from app.models.collection import Collection, Request

client = OpenAI(
    api_key=settings.grok_api_key,
    base_url="https://api.groq.com/openai/v1",
)


class DocsGenerationError(Exception):
    pass


class DocsGenerationQuotaError(DocsGenerationError):
    pass


def _pretty_json(value: Any) -> str:
    if value in (None, "", {}, []):
        return "{}"
    try:
        return json.dumps(value, indent=2, ensure_ascii=False, sort_keys=True)
    except TypeError:
        return json.dumps(str(value), indent=2, ensure_ascii=False)


def _table_from_mapping(title: str, mapping: dict[str, Any] | None) -> str:
    if not mapping:
        return f"#### {title}\nNone\n"

    lines = [
        f"#### {title}",
        "| Key | Value |",
        "| --- | --- |",
    ]
    for key, value in mapping.items():
        rendered_value = str(value).replace("\n", "<br>")
        lines.append(f"| {key} | {rendered_value} |")
    return "\n".join(lines) + "\n"


def build_collection_skeleton(requests: Iterable[Request]) -> str:
    sections: list[str] = []

    for index, request in enumerate(requests, start=1):
        sections.extend(
            [
                f"## Endpoint {index}: {request.name}",
                f"### Method\n`{request.method}`",
                f"### URL\n`{request.url}`",
                _table_from_mapping("Headers", request.headers),
                _table_from_mapping("Query Params", request.params),
                _table_from_mapping("Path Variables", request.path_vars),
                f"#### Auth Type\n`{(request.auth or {}).get('type', 'none')}`\n",
                "#### Request Body",
                "```json",
                _pretty_json(request.body),
                "```",
                "",
                "#### Description",
                "<to be written by Grok>",
                "",
                "#### Example Request",
                "<to be written by Grok>",
                "",
                "#### Example Response",
                "<to be written by Grok>",
                "",
            ]
        )

    return "\n".join(sections).strip()


def _build_docs_prompt(collection: Collection, skeleton: str) -> str:
    description = collection.description or "No collection description provided."
    return f"""
You are an API documentation writer.

The markdown structure below is already fixed and must be preserved.
Do not change headings, reorder sections, or remove any structural blocks.
Only replace the placeholder text in these sections:
- AI Description
- Example Request
- Example Response

Rules:
- Keep method, URL, headers, params, path variables, auth type, and request body exactly as provided.
- Write clear and concise endpoint descriptions.
- Use realistic request and response examples based on the endpoint shape.
- Return only GitHub-flavored markdown.

# Collection
Name: {collection.name}
Description: {description}

# Skeleton
{skeleton}
""".strip()


def generate_collection_docs(collection: Collection, requests: list[Request]) -> str:
    skeleton = build_collection_skeleton(requests)
    if not skeleton:
        description = collection.description or "No collection description provided."
        return (
            f"# {collection.name}\n\n"
            f"{description}\n\n"
            "No requests are available in this collection yet."
        )

    prompt = _build_docs_prompt(collection, skeleton)
    print("Prompt len:", len(prompt))
    response = client.chat.completions.create(
        model=settings.grok_model_name,
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.2
    )

    markdown = response.choices[0].message.content or ""
    return markdown.strip() or skeleton
