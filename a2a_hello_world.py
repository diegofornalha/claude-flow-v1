#!/usr/bin/env python3
"""
A2A-compatible Hello World server that runs on port 9999
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from datetime import datetime

class A2AHelloWorldHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests for agent card"""
        if self.path == '/' or self.path == '/agent':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            # A2A Agent Card format
            agent_card = {
                "name": "Hello World Agent",
                "description": "A simple Hello World agent for testing",
                "url": "http://localhost:9999/",
                "version": "1.0.0",
                "default_input_modes": ["text"],
                "default_output_modes": ["text"],
                "capabilities": {
                    "streaming": True
                },
                "skills": [
                    {
                        "id": "hello_world",
                        "name": "Say Hello",
                        "description": "Returns a greeting message",
                        "tags": ["hello", "greeting", "test"],
                        "examples": ["Say hello", "Greet me", "Hello world"]
                    }
                ],
                "supports_authenticated_extended_card": False
            }
            
            self.wfile.write(json.dumps(agent_card, indent=2).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        """Handle POST requests for tasks"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            request_data = json.loads(post_data)
            
            # Handle A2A task requests
            if request_data.get('method') == 'send_task':
                task_id = f"task_{datetime.now().timestamp()}"
                
                response = {
                    "jsonrpc": "2.0",
                    "result": {
                        "task_id": task_id,
                        "status": "completed",
                        "messages": [
                            {
                                "role": "assistant",
                                "content": "Hello World! This is a greeting from the A2A Hello World Agent.",
                                "timestamp": datetime.now().isoformat()
                            }
                        ]
                    },
                    "id": request_data.get("id", 1)
                }
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response, indent=2).encode())
            else:
                # Return method not found error
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                
                error_response = {
                    "jsonrpc": "2.0",
                    "error": {
                        "code": -32601,
                        "message": "Method not found"
                    },
                    "id": request_data.get("id", 1)
                }
                self.wfile.write(json.dumps(error_response, indent=2).encode())
                
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            error_response = {
                "error": str(e)
            }
            self.wfile.write(json.dumps(error_response, indent=2).encode())
    
    def log_message(self, format, *args):
        """Override to add timestamp to logs"""
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")

if __name__ == '__main__':
    # Kill any existing process on port 9999
    import os
    os.system("pkill -f simple_hello_world.py")
    
    server_address = ('', 9999)
    httpd = HTTPServer(server_address, A2AHelloWorldHandler)
    print('A2A Hello World Agent running on port 9999...')
    print('Agent Card available at: http://localhost:9999/')
    print('Press Ctrl+C to stop')
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down server...')
        httpd.shutdown()