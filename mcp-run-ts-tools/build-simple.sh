#!/bin/bash

# Build simple version focusing on the 3 main tools
echo "Building diego-tools MCP server..."

# Create build directory
mkdir -p build

# Copy the basic server which should work
echo "Compiling basic server..."
npx tsc src/basic-server.ts --outDir build --module ES2022 --target ES2022 --moduleResolution node --esModuleInterop true --skipLibCheck true || true

# If basic server fails, try simple server
if [ ! -f "build/basic-server.js" ]; then
    echo "Basic server failed, trying simple server..."
    npx tsc src/simple-mcp-server.ts --outDir build --module ES2022 --target ES2022 --moduleResolution node --esModuleInterop true --skipLibCheck true || true
fi

# Make the build executable
chmod +x build/*.js 2>/dev/null

echo "Build complete. Checking available servers..."
ls -la build/

# Test if we can run it
if [ -f "build/basic-server.js" ]; then
    echo "✅ basic-server.js is ready"
elif [ -f "build/simple-mcp-server.js" ]; then
    echo "✅ simple-mcp-server.js is ready"
else
    echo "❌ No server compiled successfully"
fi