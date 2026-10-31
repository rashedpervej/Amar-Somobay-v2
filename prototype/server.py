#!/usr/bin/env python3
"""Somobay prototype static server.
Serves the whole workspace so /prototype/*.html and /specs/*.md share one origin.
Markdown is served as UTF-8 plain text (browsers render instead of download).
"""
import functools
import http.server
import socketserver

PORT = 8000
ROOT = "/home/user"


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".md": "text/plain; charset=utf-8",
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".svg": "image/svg+xml",
        ".json": "application/json; charset=utf-8",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):  # keep the preview log readable
        print("[%s] %s" % (self.log_date_time_string(), fmt % args), flush=True)


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    handler = functools.partial(Handler, directory=ROOT)
    with Server(("0.0.0.0", PORT), handler) as httpd:
        print(f"Serving {ROOT} on 0.0.0.0:{PORT}", flush=True)
        print(f"  hub      -> http://0.0.0.0:{PORT}/", flush=True)
        print(f"  preview  -> http://0.0.0.0:{PORT}/prototype/preview.html", flush=True)
        print(f"  workspace-> http://0.0.0.0:{PORT}/prototype/workspace.html", flush=True)
        print(f"  screens  -> http://0.0.0.0:{PORT}/prototype/screens.html", flush=True)
        print(f"  system   -> http://0.0.0.0:{PORT}/prototype/system.html", flush=True)
        httpd.serve_forever()
