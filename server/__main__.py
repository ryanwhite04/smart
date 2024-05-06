import argparse
from http.server import SimpleHTTPRequestHandler, HTTPServer
import ssl
import os

# to add a custom route to the server we need to create a custom handler
# and override the end_headers method to add the headers we want



class CustomHTTPRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, directory=None, **kwargs):
        if directory is None:
            directory = os.getcwd()
        self.directory = directory
        super().__init__(*args, directory=directory, **kwargs)
    
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def run_server(port, directory, is_https=False):
    server_address = ('', port)
    httpd = HTTPServer(server_address, lambda *args, **kwargs: CustomHTTPRequestHandler(*args, directory=directory, **kwargs))

    if is_https:
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain('cert.pem', 'key.pem')
        httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

    print(f"{'https' if is_https else 'http'}://localhost:{port} {directory}")
    httpd.serve_forever()

# Set up argument parsing
parser = argparse.ArgumentParser(description='Start a HTTP/HTTPS server.')
parser.add_argument('port', type=int, help='Port number for the server.')
parser.add_argument('--secure', '-s', action='store_true', help='Run as HTTPS server')
parser.add_argument('--directory', '-d', type=str, default='.', help='Directory to serve files from')

# Parse arguments
args = parser.parse_args()

# Determine if the server should be HTTP or HTTPS and get the directory
is_https = args.secure
port = args.port
directory = args.directory

# Run the server
run_server(port, directory, is_https=is_https)
