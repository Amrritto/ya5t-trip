import http.server
import socketserver
import webbrowser
import os
import json
import threading
from datetime import datetime, timezone

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(DIRECTORY, "data", "trip_state.json")
STATE_LOCK = threading.Lock()
STATE_KEYS = ("expenses", "participants", "payments", "pendingPayments")


def read_state():
    if not os.path.exists(STATE_FILE):
        return None
    with open(STATE_FILE, "r", encoding="utf-8") as state_file:
        return json.load(state_file)


def write_state(payload):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    temporary_file = STATE_FILE + ".tmp"
    with open(temporary_file, "w", encoding="utf-8") as state_file:
        json.dump({
            key: payload.get(key, []) for key in STATE_KEYS
        } | {"updatedAt": datetime.now(timezone.utc).isoformat()}, state_file, indent=2)
    os.replace(temporary_file, STATE_FILE)

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/state":
            with STATE_LOCK:
                state = read_state()
            if state is None:
                self.send_json(404, {"error": "No shared state has been created yet."})
            else:
                self.send_json(200, state)
            return
        super().do_GET()

    def do_PUT(self):
        if self.path != "/api/state":
            self.send_error(404)
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(content_length))
            if not all(isinstance(payload.get(key), list) for key in STATE_KEYS):
                raise ValueError("State collections must be arrays")
            with STATE_LOCK:
                write_state(payload)
                state = read_state()
            self.send_json(200, state)
        except (ValueError, json.JSONDecodeError):
            self.send_json(400, {"error": "Invalid shared state payload."})

def start_server():
    global PORT
    for port in range(PORT, PORT + 10):
        try:
            with socketserver.ThreadingTCPServer(("", port), Handler) as httpd:
                httpd.allow_reuse_address = True
                print(f"\n=======================================================")
                print(f"  Trip Organizer Web App running at: http://0.0.0.0:{port}")
                print("  Open this PC's LAN IP on other devices to share the same data.")
                print(f"=======================================================\n")
                webbrowser.open(f"http://localhost:{port}")
                httpd.serve_forever()
                break
        except OSError:
            print(f"Port {port} is in use, trying port {port + 1}...")

if __name__ == "__main__":
    start_server()
