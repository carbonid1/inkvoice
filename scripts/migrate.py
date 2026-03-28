"""
Standalone SQLite migration runner.
Applies Prisma-generated SQL migrations without requiring the Prisma CLI.
Tracks applied migrations in the _prisma_migrations table (Prisma-compatible format).

Usage: python migrate.py <db-path> <migrations-dir>
"""

import hashlib
import os
import sqlite3
import sys
import uuid

if len(sys.argv) < 3:
    print("Usage: python migrate.py <db-path> <migrations-dir>", file=sys.stderr)
    sys.exit(1)

db_path = sys.argv[1]
migrations_dir = sys.argv[2]

# Ensure parent directory exists
os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)

conn = sqlite3.connect(db_path)
conn.execute("PRAGMA journal_mode = WAL")
conn.execute("PRAGMA foreign_keys = ON")

# Create migrations tracking table (matches Prisma format)
conn.execute("""
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "checksum" TEXT NOT NULL,
        "finished_at" TEXT,
        "migration_name" TEXT NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TEXT,
        "started_at" TEXT NOT NULL DEFAULT (datetime('now')),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    )
""")
conn.commit()

# Get already applied migrations
cursor = conn.execute(
    "SELECT migration_name FROM _prisma_migrations WHERE rolled_back_at IS NULL"
)
applied = {row[0] for row in cursor.fetchall()}

# Read migration directories (sorted alphabetically = chronological for Prisma timestamps)
migration_dirs = sorted(
    d for d in os.listdir(migrations_dir) if os.path.isdir(os.path.join(migrations_dir, d))
)

applied_count = 0

for dir_name in migration_dirs:
    if dir_name in applied:
        continue

    sql_path = os.path.join(migrations_dir, dir_name, "migration.sql")
    if not os.path.exists(sql_path):
        print(f"[migrate] Skipping {dir_name} — no migration.sql")
        continue

    with open(sql_path) as f:
        sql = f.read()

    checksum = hashlib.sha256(sql.encode()).hexdigest()
    migration_id = str(uuid.uuid4())

    print(f"[migrate] Applying {dir_name}...")

    conn.executescript(sql)
    conn.execute(
        """
        INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, applied_steps_count)
        VALUES (?, ?, datetime('now'), ?, 1)
        """,
        (migration_id, checksum, dir_name),
    )
    conn.commit()
    applied_count += 1

conn.close()

if applied_count > 0:
    print(f"[migrate] Applied {applied_count} migration(s).")
else:
    print("[migrate] Database is up to date.")
