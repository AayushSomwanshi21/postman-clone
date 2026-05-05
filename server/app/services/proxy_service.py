import httpx
import time


async def forward_request(method, url, headers, params, body):

    start = time.monotonic()
    async with httpx.AsyncClient(follow_redirects=True) as client:
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
