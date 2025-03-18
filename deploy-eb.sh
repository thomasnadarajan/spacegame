#!/bin/bash

# Deploy to Elastic Beanstalk
echo "Deploying to Elastic Beanstalk..."

# Zip the application
git archive -o deploy.zip HEAD

# Deploy to Elastic Beanstalk
eb deploy

echo "Deployment complete!" 