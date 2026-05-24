import json
from typing import Any, Iterable

from openai import APIError, OpenAI, RateLimitError

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


def _markdown_fragment(value: str | None, fallback: str) -> str:
    text = (value or "").strip()
    return text or fallback


def _pretty_json(value: Any) -> str:
    if value in (None, "", {}, []):
        return "{}"
    try:
        return json.dumps(value, indent=2, ensure_ascii=False, sort_keys=True)
    except TypeError:
        return json.dumps(str(value), indent=2, ensure_ascii=False)


def _normalize_request_body(body: Any) -> Any:
    if not isinstance(body, dict):
        return body

    if set(body.keys()) != {"content"}:
        return body

    content = body.get("content")
    if not isinstance(content, str):
        return body

    text = content.strip()
    if not text:
        return {}

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return content


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


def _build_request_context(requests: Iterable[Request]) -> list[dict[str, Any]]:
    context: list[dict[str, Any]] = []

    for index, request in enumerate(requests, start=1):
        context.append(
            {
                "endpoint_number": index,
                "name": request.name,
                "method": request.method,
                "url": request.url,
                "headers": request.headers or {},
                "query_params": request.params or {},
                "path_variables": request.path_vars or {},
                "auth_type": (request.auth or {}).get("type", "none"),
                "request_body": _normalize_request_body(request.body or {}),
            }
        )

    return context


def build_collection_markdown(
    collection: Collection,
    requests: Iterable[Request],
    generated_sections: list[dict[str, str]] | None = None,
) -> str:
    sections: list[str] = [
        f"# {collection.name}",
        "",
        collection.description or "No collection description provided.",
        "",
    ]

    generated_sections = generated_sections or []

    for index, request in enumerate(requests, start=1):
        generated = generated_sections[index -
                                       1] if index - 1 < len(generated_sections) else {}
        sections.extend(
            [
                f"## Endpoint {index}: {request.name}",
                f"### Method\n{request.method}",
                f"### URL\n{request.url}",
                _table_from_mapping("Headers", request.headers),
                _table_from_mapping("Query Params", request.params),
                _table_from_mapping("Path Variables", request.path_vars),
                f"#### Auth Type\n{(request.auth or {}).get('type', 'none')}\n",
                "#### Request Body",
                "```json",
                _pretty_json(_normalize_request_body(request.body)),
                "```",
                "",
                "#### Description",
                _markdown_fragment(
                    generated.get("description"),
                    "Description could not be generated.",
                ),
                "",
                "#### Example Request",
                "```json",
                _markdown_fragment(
                    generated.get("example_request"),
                    "{}",
                ),
                "```",
                "",
                "#### Example Response",
                "```json",
                _markdown_fragment(
                    generated.get("example_response"),
                    "{}",
                ),
                "```",
                "",
            ]
        )

    return "\n".join(sections).strip()


def _build_docs_prompt(collection: Collection, request_context: list[dict[str, Any]]) -> str:
    description = collection.description or "No collection description provided."
    return f"""
You are an API documentation writer.

Rules:
- Write clear and concise endpoint descriptions.
- Use realistic example requests and responses based on the endpoint shape.
- Return only valid JSON as an object with this exact shape:
  {{
    "endpoints": [
      {{
        "description": "...",
        "example_request": "...",
        "example_response": "..."
      }}
    ]
  }}
- The endpoints array must contain exactly one object per endpoint, in the same order as the input.
- Each endpoint object must have these string fields:
  - description
  - example_request
  - example_response
- Each field should contain a markdown fragment only for that section's content.
- Do not include outer explanations, headings, or markdown for other sections.

# Collection
Name: {collection.name}
Description: {description}

# Endpoints
{json.dumps(request_context, indent=2, ensure_ascii=False)}
""".strip()


def _parse_generated_sections(content: str, expected_count: int) -> list[dict[str, str]]:
    raw = (content or "").strip()
    if raw.startswith("```"):
        lines = raw.splitlines()
        if len(lines) >= 2:
            raw = "\n".join(lines[1:-1]).strip()

    if not raw.startswith("{") and "[" in raw and "]" in raw:
        start = raw.find("[")
        end = raw.rfind("]")
        if start != -1 and end != -1 and end > start:
            raw = raw[start:end + 1]

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise DocsGenerationError(
            "AI returned invalid documentation JSON.") from exc

    if isinstance(parsed, dict):
        parsed = parsed.get("endpoints")

    if not isinstance(parsed, list) or len(parsed) != expected_count:
        raise DocsGenerationError(
            "AI returned an unexpected number of endpoint descriptions.")

    sections: list[dict[str, str]] = []
    for item in parsed:
        if not isinstance(item, dict):
            raise DocsGenerationError(
                "AI returned malformed endpoint documentation.")
        sections.append(
            {
                "description": str(item.get("description", "")).strip(),
                "example_request": str(item.get("example_request", "")).strip(),
                "example_response": str(item.get("example_response", "")).strip(),
            }
        )
    return sections


def generate_collection_docs(collection: Collection, requests: list[Request]) -> str:
    if not requests:
        return (
            f"# {collection.name}\n\n"
            f"{collection.description or 'No collection description provided.'}\n\n"
            "No requests are available in this collection yet."
        )

    request_context = _build_request_context(requests)
    prompt = _build_docs_prompt(collection, request_context)

    try:
        response = client.chat.completions.create(
            model=settings.grok_model_name,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
    except RateLimitError as exc:
        raise DocsGenerationQuotaError(
            "AI quota exceeded. Please try again later.") from exc
    except APIError as exc:
        raise DocsGenerationError(
            "AI documentation generation failed.") from exc

    generated_sections = _parse_generated_sections(
        response.choices[0].message.content or "",
        expected_count=len(requests),
    )
    return build_collection_markdown(collection, requests, generated_sections)
