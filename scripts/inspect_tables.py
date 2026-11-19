import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(".env.local")
if not os.environ.get("DATABASE_URL"):
    load_dotenv(".env")

conn = psycopg2.connect(os.environ["DATABASE_URL"])
cur = conn.cursor()

for table in ["asset", "gallery", "gallery_item", "session_override"]:
    cur.execute(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = %s",
        (table,),
    )
    cols = cur.fetchall()
    print(table, ":", [c[0] for c in cols])

conn.close()
