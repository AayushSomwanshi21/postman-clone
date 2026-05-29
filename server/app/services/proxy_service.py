import time

import httpx


_client: httpx.AsyncClient | None = None


async def startup_proxy_client() -> None:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            follow_redirects=True,
            timeout=httpx.Timeout(30.0),
            limits=httpx.Limits(max_keepalive_connections=100, max_connections=200),
        )


async def shutdown_proxy_client() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


def get_proxy_client() -> httpx.AsyncClient:
    if _client is None:
        raise RuntimeError("Proxy HTTP client has not been initialized")
    return _client


async def forward_request(method, url, headers, params, body):
    client = get_proxy_client()
    start = time.monotonic()
    response = await client.request(
        method=method,
        url=url,
        headers=headers,
        params=params,
        json=body if body else None,
    )
    elapsed = (time.monotonic() - start) * 1000

    return {
        "status_code": response.status_code,
        "headers": dict(response.headers),
        "body": response.text,
        "elapsed_ms": round(elapsed, 2),
    }
