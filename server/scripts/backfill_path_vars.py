import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("UPDATE requests SET path_vars = '{}' WHERE path_vars IS NULL"))
    conn.commit()
    print(f"Updated {result.rowcount} rows")
