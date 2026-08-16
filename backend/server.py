from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import sqlite3
from pathlib import Path

HOST = "localhost"
PORT = 5000
DB_PATH = Path(__file__).with_name("enquiries.db")


def init_db():
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS enquiries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                school TEXT NOT NULL,
                contact TEXT NOT NULL,
                interest TEXT NOT NULL,
                message TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


class EnquiryHandler(BaseHTTPRequestHandler):
    def _send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send_json(204, {})

    def do_POST(self):
        if self.path != "/api/enquiries":
            self._send_json(404, {"error": "Not found"})
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length)

        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json(400, {"error": "Invalid JSON"})
            return

        required = ["name", "school", "contact", "interest"]
        if any(not str(payload.get(field, "")).strip() for field in required):
            self._send_json(400, {"error": "Missing required fields"})
            return

        with sqlite3.connect(DB_PATH) as connection:
            cursor = connection.execute(
                """
                INSERT INTO enquiries (name, school, contact, interest, message)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    str(payload.get("name", "")).strip(),
                    str(payload.get("school", "")).strip(),
                    str(payload.get("contact", "")).strip(),
                    str(payload.get("interest", "")).strip(),
                    str(payload.get("message", "")).strip(),
                ),
            )

        self._send_json(201, {"ok": True, "id": cursor.lastrowid})

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    init_db()
    server = HTTPServer((HOST, PORT), EnquiryHandler)
    print(f"OBL enquiry backend running on http://{HOST}:{PORT}")
    print(f"Saving enquiries to {DB_PATH}")
    server.serve_forever()
