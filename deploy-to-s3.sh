#!/bin/bash

# Default bucket if not specified
S3_BUCKET=${S3_BUCKET:-"spacegame-client-7854"}

# Ensure GAME_SERVER_URL is set
if [ -z "$GAME_SERVER_URL" ]; then
  echo "Error: GAME_SERVER_URL environment variable not set"
  echo "Usage: GAME_SERVER_URL=https://your-eb-url.elasticbeanstalk.com ./deploy-to-s3.sh"
  exit 1
fi

# Build the client
echo "Building client with server URL: $GAME_SERVER_URL"
GAME_SERVER_URL=$GAME_SERVER_URL ./build-client.sh

# First, delete all existing content
echo "Clearing existing content from S3 bucket: $S3_BUCKET"
aws s3 rm s3://$S3_BUCKET --recursive

# Upload files with correct content types
echo "Deploying to S3 bucket: $S3_BUCKET"

# Upload HTML files with correct content type
echo "Uploading HTML files..."
aws s3 cp dist/index.html s3://$S3_BUCKET/index.html --content-type "text/html" --cache-control "no-cache"

# Upload CSS files with correct content type
echo "Uploading CSS files..."
aws s3 cp dist/main.css s3://$S3_BUCKET/main.css --content-type "text/css"

# Upload JavaScript files with correct content type
echo "Uploading JavaScript files..."
aws s3 cp dist/client.js s3://$S3_BUCKET/client.js --content-type "application/javascript" --cache-control "max-age=2592000"
aws s3 cp dist/config.js s3://$S3_BUCKET/config.js --content-type "application/javascript" --cache-control "no-cache"

# Upload JSON files with correct content type
echo "Uploading JSON files..."
for file in dist/assets/*.json; do
  aws s3 cp "$file" "s3://$S3_BUCKET/assets/$(basename "$file")" --content-type "application/json"
done

# Upload image files with correct content type
echo "Uploading image files..."
for file in dist/assets/*.png; do
  aws s3 cp "$file" "s3://$S3_BUCKET/assets/$(basename "$file")" --content-type "image/png"
done

echo "Deployment complete!"
echo "Your client is now available at: http://$S3_BUCKET.s3-website-$(aws configure get region).amazonaws.com"
echo "For production use, configure CloudFront with your domain." 