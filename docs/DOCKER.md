# Docker Setup Guide

This document explains how to run WorkNest using Docker for both development and production environments.

## Prerequisites

- Docker Desktop (v20.10+)
- Docker Compose (v2.0+)

## Quick Start

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

---

## Development Setup

### 1. Start the Full Stack

```bash
# Navigate to project root
cd WorkNest

# Start all services in detached mode
docker-compose up -d

# View all running containers
docker ps
```

### 2. Services Overview

| Service | Port | Description |
|---------|------|-------------|
| `client` | 5173 | React frontend (Vite dev server) |
| `server` | 5000 | Node.js backend API |
| `mongo` | 27017 | MongoDB database |
| `redis` | 6380 | Redis cache |

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **MongoDB**: mongodb://localhost:27017
- **Redis**: localhost:6380

---

## Common Commands

### Container Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart a specific service
docker-compose restart server

# Rebuild containers (after Dockerfile changes)
docker-compose up -d --build

# Remove volumes (deletes all data!)
docker-compose down -v
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f client

# Last 50 lines
docker-compose logs --tail 50 server
```

### Executing Commands in Containers

```bash
# Access server shell
docker exec -it worknest-server-1 sh

# Run npm commands in server
docker exec worknest-server-1 npm run lint

# Access MongoDB shell
docker exec -it worknest-mongo-1 mongosh

# Access Redis CLI
docker exec -it worknest-redis-1 redis-cli
```

### Database Operations

```bash
# Export MongoDB database
docker exec worknest-mongo-1 mongodump --db worknest --out /data/backup

# Import MongoDB database
docker exec worknest-mongo-1 mongorestore --db worknest /data/backup/worknest

# Clear Redis cache
docker exec worknest-redis-1 redis-cli FLUSHALL
```

---

## Environment Variables

### Server Environment (`server/.env`)

```bash
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://mongo:27017/worknest

# Redis
REDIS_URI=redis://redis:6379

# JWT
JWT_SECRET=your-secret-key
REFRESH_TOKEN_SECRET=your-refresh-secret

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Client URL
CLIENT_URL=http://localhost:5173
```

> **Note**: In Docker, use service names (`mongo`, `redis`) instead of `localhost`.

---

## Troubleshooting

### Container won't start

```bash
# Check container logs
docker-compose logs server

# Restart with rebuild
docker-compose down
docker-compose up -d --build
```

### Port already in use

```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### MongoDB connection issues

```bash
# Verify MongoDB is running
docker exec worknest-mongo-1 mongosh --eval "db.adminCommand('ismaster')"

# Check MongoDB logs
docker-compose logs mongo
```

### Reset everything

```bash
# Stop and remove all containers, networks, volumes
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a

# Start fresh
docker-compose up -d --build
```

---

## Production Deployment

### 1. Build Production Images

```bash
# Build all images
docker-compose -f docker-compose.prod.yml build

# Push to registry
docker-compose -f docker-compose.prod.yml push
```

### 2. Production Environment Variables

Ensure these are set in your production environment:

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
REDIS_URI=redis://...
JWT_SECRET=<secure-random-string>
REFRESH_TOKEN_SECRET=<secure-random-string>
CLIENT_URL=https://your-domain.com
```

### 3. Deploy

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## File Structure

```
WorkNest/
├── docker-compose.yml      # Development orchestration
├── Dockerfile              # Frontend container
├── server/
│   └── Dockerfile          # Backend container
└── docs/
    └── DOCKER.md           # This file
```
