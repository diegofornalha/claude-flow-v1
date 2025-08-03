#!/usr/bin/env python3
"""
Simple Hello World server that runs on port 9999
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class HelloWorldHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        response = {
            "message": "Hello World from Agent!",
            "agent": "Hello World Agent",
            "version": "1.0.0",
            "skills": ["hello_world"]
        }
        
        self.wfile.write(json.dumps(response, indent=2).encode())
    
    def do_POST(self):
        """Handle POST requests"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        response = {
            "message": "Hello World! I received your message.",
            "received_data_length": content_length,
            "agent": "Hello World Agent"
        }
        
        self.wfile.write(json.dumps(response, indent=2).encode())

if __name__ == '__main__':
    server_address = ('', 9999)
    httpd = HTTPServer(server_address, HelloWorldHandler)
    print('Hello World Agent running on port 9999...')
    print('Access at http://localhost:9999/')
    print('Press Ctrl+C to stop')
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down server...')
        httpd.shutdown()