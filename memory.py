import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.environ.get("CLIPSLICER_DB", "clipslicer.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                youtube_url TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'processing',
                clips TEXT NOT NULL DEFAULT '[]',
                error TEXT,
                created_at TEXT NOT NULL
            )
        """)
        conn.commit()


def create_job(job_id: str, youtube_url: str) -> dict:
    now = datetime.utcnow().isoformat()
    with get_db() as conn:
        conn.execute(
            "INSERT INTO jobs (id, youtube_url, status, clips, created_at) VALUES (?, ?, 'processing', '[]', ?)",
            (job_id, youtube_url, now),
        )
        conn.commit()
    return {"id": job_id, "youtube_url": youtube_url, "status": "processing", "clips": [], "created_at": now}


def get_job(job_id: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    if row is None:
        return None
    return _row_to_dict(row)


def update_job(job_id: str, status: str, clips: list = None, error: str = None):
    with get_db() as conn:
        if error is not None:
            conn.execute(
                "UPDATE jobs SET status = ?, error = ? WHERE id = ?",
                (status, error, job_id),
            )
        else:
            conn.execute(
                "UPDATE jobs SET status = ?, clips = ? WHERE id = ?",
                (status, json.dumps(clips or []), job_id),
            )
        conn.commit()


def list_jobs(limit: int = 50) -> list[dict]:
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
    return [_row_to_dict(r) for r in rows]


def _row_to_dict(row: sqlite3.Row) -> dict:
    d = dict(row)
    d["clips"] = json.loads(d["clips"])
    return d
