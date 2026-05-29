param(
    [int]$Port = 8010
)

python -m uvicorn main:app --host 127.0.0.1 --port $Port --reload
