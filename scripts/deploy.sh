#!/bin/bash

# =====================================================
# HabilitFy - Deploy Script
# Usage: ./scripts/deploy.sh [environment]
# Environments: production, staging
# =====================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-production}"
APP_NAME="habilitfy"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo -e "${GREEN}🚀 Deploying HabilitFy - Environment: ${ENVIRONMENT}${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check for .env file
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}⚠️  No .env file found. Copying from .env.example...${NC}"
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please edit .env with your production values before continuing.${NC}"
        exit 1
    else
        echo -e "${RED}❌ No .env or .env.example file found.${NC}"
        exit 1
    fi
fi

# Validate required environment variables
echo -e "${YELLOW}📋 Validating environment variables...${NC}"
source .env

REQUIRED_VARS=("DATABASE_URL" "SESSION_SECRET")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Required variable $var is not set in .env${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Environment variables validated${NC}"

# Build the Docker image
echo -e "${YELLOW}🔨 Building Docker image...${NC}"
docker build -t ${APP_NAME}:${IMAGE_TAG} .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker image built successfully${NC}"

# Push to registry if configured
if [ -n "$DOCKER_REGISTRY" ]; then
    echo -e "${YELLOW}📤 Pushing image to registry...${NC}"
    docker tag ${APP_NAME}:${IMAGE_TAG} ${DOCKER_REGISTRY}/${APP_NAME}:${IMAGE_TAG}
    docker push ${DOCKER_REGISTRY}/${APP_NAME}:${IMAGE_TAG}
    echo -e "${GREEN}✅ Image pushed to registry${NC}"
fi

# Deploy based on environment
if [ "$ENVIRONMENT" == "production" ]; then
    echo -e "${YELLOW}🚀 Deploying to production...${NC}"
    
    # Stop existing containers
    docker-compose down --remove-orphans || true
    
    # Start with production profile
    docker-compose --profile production up -d
    
    echo -e "${GREEN}✅ Production deployment complete${NC}"
    
elif [ "$ENVIRONMENT" == "staging" ]; then
    echo -e "${YELLOW}🧪 Deploying to staging...${NC}"
    
    # Stop existing containers
    docker-compose down --remove-orphans || true
    
    # Start without Traefik (no SSL in staging)
    docker-compose up -d
    
    echo -e "${GREEN}✅ Staging deployment complete${NC}"
fi

# Run database migrations
echo -e "${YELLOW}🗃️  Running database migrations...${NC}"
docker-compose exec -T app npm run db:push 2>/dev/null || echo "Migration command not available"

# Health check
echo -e "${YELLOW}🏥 Checking application health...${NC}"
sleep 10

HEALTH_URL="http://localhost:5000/api/health"
for i in {1..10}; do
    if curl -s "$HEALTH_URL" | grep -q "ok"; then
        echo -e "${GREEN}✅ Application is healthy!${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ Health check failed after 10 attempts${NC}"
        docker-compose logs app
        exit 1
    fi
    echo "Waiting for application to start... (attempt $i/10)"
    sleep 5
done

# Print status
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Application URL: http://localhost:5000"
echo "Health Check: http://localhost:5000/api/health"
echo ""
echo "Useful commands:"
echo "  docker-compose logs -f app    # View logs"
echo "  docker-compose ps             # View status"
echo "  docker-compose down           # Stop all services"
echo ""
