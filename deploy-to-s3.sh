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

# Sync with S3
echo "Deploying to S3 bucket: $S3_BUCKET"
aws s3 sync dist/ s3://$S3_BUCKET --delete

# Set cache control headers for optimal performance
echo "Setting cache control headers"
aws s3 cp s3://$S3_BUCKET/client.js s3://$S3_BUCKET/client.js --metadata-directive REPLACE --cache-control "max-age=2592000"
aws s3 cp s3://$S3_BUCKET/config.js s3://$S3_BUCKET/config.js --metadata-directive REPLACE --cache-control "no-cache"
aws s3 cp s3://$S3_BUCKET/index.html s3://$S3_BUCKET/index.html --metadata-directive REPLACE --cache-control "no-cache"

echo "Deployment complete!"
echo "Your client is now available at: http://$S3_BUCKET.s3-website-$(aws configure get region).amazonaws.com"
echo "For production use, configure CloudFront with your domain." 