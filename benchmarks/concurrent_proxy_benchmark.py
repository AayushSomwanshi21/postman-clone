import argparse
import asyncio
import statistics
import time
from typing import Any

import httpx


DEFAULT_UPSTREAM_BASE = "http://127.0.0.1:8010"
DEFAULT_SERVER_BASE = "http://127.0.0.1:8000"
DEFAULT_PATH = "/delay/200"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Benchmark concurrent proxied requests against the backend /proxy route."
    )
    parser.add_argument("--upstream-base", default=DEFAULT_UPSTREAM_BASE)
    parser.add_argument("--server-base", default=DEFAULT_SERVER_BASE)
    parser.add_argument("--path", default=DEFAULT_PATH)
    parser.add_argument("--method", default="GET")
    parser.add_argument(
        "--concurrency-levels",
        default="10,25,50,100",
        help="Comma-separated concurrency levels to test.",
    )
    parser.add_argument(
        "--requests-per-level",
        type=int,
        default=200,
        help="Total requests to send for each concurrency level.",
    )
    parser.add_argument("--warmup", type=int, default=10)
    parser.add_argument("--timeout", type=float, default=15.0)
    parser.add_argument("--token", help="Bearer token for the /proxy route")
    parser.add_argument("--email", help="Email for login or auto-register")
    parser.add_argument("--password", help="Password for login or auto-register")
    parser.add_argument("--name", default="Benchmark User")
    parser.add_argument(
        "--auth-mode",
        choices=["login", "register-if-needed"],
        default="register-if-needed",
    )
    return parser.parse_args()


def percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = (len(ordered) - 1) * pct
    lower = int(index)
    upper = min(lower + 1, len(ordered) - 1)
    weight = index - lower
    return ordered[lower] * (1 - weight) + ordered[upper] * weight


def summarize(values: list[float]) -> dict[str, float]:
    return {
        "avg_ms": statistics.mean(values),
        "min_ms": min(values),
        "max_ms": max(values),
        "p50_ms": percentile(values, 0.50),
        "p95_ms": percentile(values, 0.95),
        "p99_ms": percentile(values, 0.99),
    }


async def ensure_token(client: httpx.AsyncClient, args: argparse.Namespace) -> str:
    if args.token:
        return args.token

    if not args.email or not args.password:
        raise SystemExit(
            "Provide either --token or both --email and --password to benchmark /proxy."
        )

    login_payload = {"email": args.email, "password": args.password}
    login_response = await client.post(f"{args.server_base}/auth/login", json=login_payload)
    if login_response.is_success:
        return login_response.json()["access_token"]

    if args.auth_mode != "register-if-needed":
        raise SystemExit(
            f"Login failed with status {login_response.status_code}: {login_response.text}"
        )

    register_payload = {
        "email": args.email,
        "password": args.password,
        "name": args.name,
    }
    register_response = await client.post(
        f"{args.server_base}/auth/register", json=register_payload
    )
    if register_response.is_success:
        return register_response.json()["access_token"]

    raise SystemExit(
        "Unable to get auth token. "
        f"Login returned {login_response.status_code}; register returned {register_response.status_code}: {register_response.text}"
    )


async def proxy_request(
    client: httpx.AsyncClient,
    server_base: str,
    method: str,
    upstream_url: str,
    token: str,
) -> tuple[bool, float, float]:
    payload: dict[str, Any] = {
        "method": method,
        "url": upstream_url,
        "headers": {},
        "params": {},
        "body": None,
    }
    start = time.perf_counter()
    try:
        response = await client.post(
            f"{server_base.rstrip('/')}/proxy",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        total_elapsed_ms = (time.perf_counter() - start) * 1000
        response.raise_for_status()
        body = response.json()
        proxy_elapsed_ms = float(body.get("elapsed_ms", 0.0))
        return True, total_elapsed_ms, proxy_elapsed_ms
    except Exception:
        total_elapsed_ms = (time.perf_counter() - start) * 1000
        return False, total_elapsed_ms, 0.0


async def run_level(
    client: httpx.AsyncClient,
    args: argparse.Namespace,
    token: str,
    upstream_url: str,
    concurrency: int,
) -> dict[str, float | int]:
    total_requests = args.requests_per_level
    semaphore = asyncio.Semaphore(concurrency)

    async def run_once() -> tuple[bool, float, float]:
        async with semaphore:
            return await proxy_request(
                client, args.server_base, args.method, upstream_url, token
            )

    start = time.perf_counter()
    results = await asyncio.gather(*(run_once() for _ in range(total_requests)))
    duration_s = time.perf_counter() - start

    successes = [result for result in results if result[0]]
    failures = total_requests - len(successes)
    total_latencies = [result[1] for result in successes]
    internal_latencies = [result[2] for result in successes]

    total_summary = summarize(total_latencies) if total_latencies else None
    internal_summary = summarize(internal_latencies) if internal_latencies else None
    throughput_rps = len(successes) / duration_s if duration_s else 0.0
    error_rate = failures / total_requests if total_requests else 0.0

    return {
        "concurrency": concurrency,
        "requests": total_requests,
        "successes": len(successes),
        "failures": failures,
        "error_rate": error_rate,
        "duration_s": duration_s,
        "throughput_rps": throughput_rps,
        "avg_ms": total_summary["avg_ms"] if total_summary else 0.0,
        "p95_ms": total_summary["p95_ms"] if total_summary else 0.0,
        "p99_ms": total_summary["p99_ms"] if total_summary else 0.0,
        "proxy_avg_ms": internal_summary["avg_ms"] if internal_summary else 0.0,
        "proxy_p95_ms": internal_summary["p95_ms"] if internal_summary else 0.0,
    }


def parse_levels(raw: str) -> list[int]:
    levels = []
    for part in raw.split(","):
        value = part.strip()
        if not value:
            continue
        levels.append(int(value))
    if not levels:
        raise SystemExit("Provide at least one concurrency level.")
    return levels


def print_result(result: dict[str, float | int]) -> None:
    print(f"Concurrency: {result['concurrency']}")
    print(f"Requests: {result['requests']}")
    print(f"Successes: {result['successes']}")
    print(f"Failures: {result['failures']}")
    print(f"Error rate: {result['error_rate'] * 100:.2f}%")
    print(f"Duration_s: {result['duration_s']:.2f}")
    print(f"Throughput_rps: {result['throughput_rps']:.2f}")
    print(f"Avg_ms: {result['avg_ms']:.2f}")
    print(f"P95_ms: {result['p95_ms']:.2f}")
    print(f"P99_ms: {result['p99_ms']:.2f}")
    print(f"Proxy_avg_ms: {result['proxy_avg_ms']:.2f}")
    print(f"Proxy_p95_ms: {result['proxy_p95_ms']:.2f}")


async def run_benchmark(args: argparse.Namespace) -> None:
    upstream_url = f"{args.upstream_base.rstrip('/')}/{args.path.lstrip('/')}"
    levels = parse_levels(args.concurrency_levels)
    timeout = httpx.Timeout(args.timeout)
    limits = httpx.Limits(max_keepalive_connections=200, max_connections=400)

    async with httpx.AsyncClient(timeout=timeout, limits=limits) as client:
        token = await ensure_token(client, args)

        for _ in range(args.warmup):
            await proxy_request(client, args.server_base, args.method, upstream_url, token)

        print("Concurrent benchmark")
        print(f"Server base: {args.server_base}")
        print(f"Upstream URL: {upstream_url}")
        print(f"Requests per level: {args.requests_per_level}")
        print()

        for concurrency in levels:
            result = await run_level(client, args, token, upstream_url, concurrency)
            print_result(result)
            print()


if __name__ == "__main__":
    arguments = parse_args()
    asyncio.run(run_benchmark(arguments))
