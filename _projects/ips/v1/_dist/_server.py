import http.server
import socketserver
import os
import sys

# CONFIGURATION: Serve exclusively from the built distribution folder
WEB_DIRECTORY = '_dist'
PORT = 8000

class MyHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    
    def __init__(self, *args, **kwargs):
        # Initialize standard handler pointing to the static build directory
        super().__init__(*args, directory=WEB_DIRECTORY, **kwargs)

    def do_GET(self):
        # Standardize home request to index.html
        if self.path == '/':
            self.path = '/index.html'
        
        # Remove JSX or any other dynamic intercept logic
        # This line performs the static file serving automatically from the WEB_DIRECTORY
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

Handler = MyHttpRequestHandler

# Start server only if the build folder exists, enforcing the build step
if not os.path.exists(WEB_DIRECTORY):
    print(f"Error: Static build folder '{WEB_DIRECTORY}' not found.")
    print("Please run 'npm run build' first to generate the necessary files.")
    sys.exit(1)
else:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving ips-v3 STATIC build at: http://localhost:{PORT}")
        print(f"Root Directory: {os.path.abspath(WEB_DIRECTORY)}")
        
        print("\nEnsure the build folder contains current HTML files and styles:")
        # Display the contents of the root serving directory for verification
        for root, dirs, files in os.walk(WEB_DIRECTORY):
            # Print files only from the top level and 'styles' folder
            if root == WEB_DIRECTORY or root == os.path.join(WEB_DIRECTORY, 'styles'):
                level = root.replace(WEB_DIRECTORY, "").count(os.sep)
                indent = " " * 4 * level
                print(f"{indent}{os.path.basename(root) or WEB_DIRECTORY}/")
                subindent = " " * 4 * (level + 1)
                for f in files:
                    print(f"{subindent}{f}")
        
        httpd.serve_forever()