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
        description="Benchmark direct upstream latency versus proxied latency."
    )
    parser.add_argument("--upstream-base", default=DEFAULT_UPSTREAM_BASE)
    parser.add_argument("--server-base", default=DEFAULT_SERVER_BASE)
    parser.add_argument("--path", default=DEFAULT_PATH)
    parser.add_argument("--method", default="GET")
    parser.add_argument("--iterations", type=int, default=50)
    parser.add_argument("--warmup", type=int, default=5)
    parser.add_argument("--timeout", type=float, default=10.0)
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


async def time_direct_request(
    client: httpx.AsyncClient,
    method: str,
    upstream_url: str,
) -> float:
    start = time.perf_counter()
    response = await client.request(method=method, url=upstream_url)
    elapsed_ms = (time.perf_counter() - start) * 1000
    response.raise_for_status()
    return elapsed_ms


async def time_proxy_request(
    client: httpx.AsyncClient,
    server_base: str,
    method: str,
    upstream_url: str,
    token: str,
) -> tuple[float, float]:
    payload: dict[str, Any] = {
        "method": method,
        "url": upstream_url,
        "headers": {},
        "params": {},
        "body": None,
    }
    start = time.perf_counter()
    response = await client.post(
        f"{server_base.rstrip('/')}/proxy",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    total_elapsed_ms = (time.perf_counter() - start) * 1000
    response.raise_for_status()
    body = response.json()
    proxy_elapsed_ms = float(body.get("elapsed_ms", 0.0))
    return total_elapsed_ms, proxy_elapsed_ms


async def run_benchmark(args: argparse.Namespace) -> None:
    upstream_url = f"{args.upstream_base.rstrip('/')}/{args.path.lstrip('/')}"
    timeout = httpx.Timeout(args.timeout)

    async with httpx.AsyncClient(timeout=timeout) as client:
        token = await ensure_token(client, args)

        for _ in range(args.warmup):
            await time_direct_request(client, args.method, upstream_url)
            await time_proxy_request(
                client, args.server_base, args.method, upstream_url, token
            )

        direct_latencies: list[float] = []
        proxy_total_latencies: list[float] = []
        proxy_internal_latencies: list[float] = []

        for _ in range(args.iterations):
            direct_latencies.append(
                await time_direct_request(client, args.method, upstream_url)
            )
            proxy_total_ms, proxy_internal_ms = await time_proxy_request(
                client, args.server_base, args.method, upstream_url, token
            )
            proxy_total_latencies.append(proxy_total_ms)
            proxy_internal_latencies.append(proxy_internal_ms)

    direct_summary = summarize(direct_latencies)
    proxy_total_summary = summarize(proxy_total_latencies)
    proxy_internal_summary = summarize(proxy_internal_latencies)

    print("Benchmark complete")
    print(f"Server base: {args.server_base}")
    print(f"Upstream URL: {upstream_url}")
    print(f"Iterations: {args.iterations}")
    print()
    print("Direct upstream")
    print(format_summary(direct_summary))
    print()
    print("Proxy total")
    print(format_summary(proxy_total_summary))
    print()
    print("Proxy internal elapsed_ms")
    print(format_summary(proxy_internal_summary))
    print()
    print(
        "Overhead\n"
        f"avg_ms: {proxy_total_summary['avg_ms'] - direct_summary['avg_ms']:.2f}\n"
        f"p95_ms: {proxy_total_summary['p95_ms'] - direct_summary['p95_ms']:.2f}"
    )


def format_summary(summary: dict[str, float]) -> str:
    ordered_keys = ["avg_ms", "min_ms", "max_ms", "p50_ms", "p95_ms", "p99_ms"]
    return "\n".join(f"{key}: {summary[key]:.2f}" for key in ordered_keys)


if __name__ == "__main__":
    arguments = parse_args()
    asyncio.run(run_benchmark(arguments))
