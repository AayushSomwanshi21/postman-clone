import asyncio
from fastapi import FastAPI, Request


app = FastAPI(title="Benchmark Mock Upstream")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.api_route("/echo", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def echo(request: Request):
    raw_body = await request.body()
    try:
        parsed_body = await request.json() if raw_body else None
    except Exception:
        parsed_body = raw_body.decode("utf-8", errors="replace") if raw_body else None

    return {
        "method": request.method,
        "path": request.url.path,
        "query": dict(request.query_params),
        "headers": dict(request.headers),
        "body": parsed_body,
        "body_size_bytes": len(raw_body),
    }


@app.get("/delay/{ms}")
async def delay(ms: int):
    await asyncio.sleep(ms / 1000)
    return {"delayed_ms": ms}


@app.get("/payload/{kb}")
async def payload(kb: int):
    # Return a deterministic body size for repeatable payload benchmarks.
    return {
        "size_kb": kb,
        "data": "a" * (kb * 1024),
    }
