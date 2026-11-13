"""Local dev server for the archive site.

Same as `python -m http.server` but every response carries no-store headers,
so the browser and the service worker always revalidate — a refresh shows the
latest files on disk, no hard-refresh dance.

Usage:  python dev-server.py [port]     (default 8000, serves ./site)
"""
import functools
import http.server
import os
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'site')
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class NoStoreHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


if __name__ == '__main__':
    handler = functools.partial(NoStoreHandler, directory=ROOT)
    print(f'serving {ROOT} on http://localhost:{PORT}')
    http.server.ThreadingHTTPServer(('127.0.0.1', PORT), handler).serve_forever()
