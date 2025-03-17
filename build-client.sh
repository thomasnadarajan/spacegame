#!/bin/bash

# Create a build directory
mkdir -p dist

# Clean any previous build
rm -rf dist/*

# Copy the client files
cp -r src/client/serve/* dist/

# Copy static assets
cp -r src/client/assets dist/ 2>/dev/null || :

# Create environment-specific configs with the actual server URL
sed "s|GAME_SERVER_URL_PLACEHOLDER|${GAME_SERVER_URL:-https://your-game-server-domain.com}|g" src/client/serve/config.js > dist/config.js

echo "Client build complete. Files ready in ./dist directory."
echo "Game server URL set to: ${GAME_SERVER_URL:-https://your-game-server-domain.com}" 