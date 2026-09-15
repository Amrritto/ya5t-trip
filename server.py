import http.server
import socketserver
import webbrowser
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    global PORT
    for port in range(PORT, PORT + 10):
        try:
            with socketserver.TCPServer(("", port), Handler) as httpd:
                print(f"\n=======================================================")
                print(f"  Trip Organizer Web App running at: http://localhost:{port}")
                print(f"=======================================================\n")
                webbrowser.open(f"http://localhost:{port}")
                httpd.serve_forever()
                break
        except OSError:
            print(f"Port {port} is in use, trying port {port + 1}...")

if __name__ == "__main__":
    start_server()
