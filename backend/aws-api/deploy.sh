#!/bin/bash

# FinanzApp Backend Deployment Script for EC2
# This script builds and runs the Docker container

set -e

APP_NAME="finanzapp-backend"
IMAGE_NAME="finanzapp-backend"
CONTAINER_NAME="finanzapp-api"
PORT=8080

echo "FinanzApp Backend Deployment"
echo "================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please copy .env.example to .env and fill in your credentials."
    exit 1
fi

# Stop and remove existing container if running
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "Stopping existing container..."
    docker stop $CONTAINER_NAME
fi

if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "Removing existing container..."
    docker rm $CONTAINER_NAME
fi

# Build the Docker image
echo "Building Docker image..."
docker build -t $IMAGE_NAME:latest .

# Run the container
echo "Starting container..."
docker run -d \
    --name $CONTAINER_NAME \
    -p $PORT:$PORT \
    --env-file .env \
    --restart unless-stopped \
    $IMAGE_NAME:latest

# Wait for container to be healthy
echo "Waiting for container to be healthy..."
sleep 5

# Check container status
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "Container is running!"
    echo ""
    echo "Container Status:"
    docker ps -f name=$CONTAINER_NAME
    echo ""
    echo "Health Check:"
    curl -f http://localhost:$PORT/health || echo "Health check failed"
    echo ""
    echo "View logs with: docker logs -f $CONTAINER_NAME"
else
    echo "Container failed to start!"
    echo "Check logs with: docker logs $CONTAINER_NAME"
    exit 1
fi
