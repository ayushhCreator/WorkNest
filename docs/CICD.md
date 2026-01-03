# CI/CD Pipeline Guide

This document explains the Continuous Integration and Continuous Deployment (CI/CD) setup for WorkNest.

## Overview

WorkNest uses **GitHub Actions** for automated testing, linting, and deployment pipelines.

---

## GitHub Actions Workflow

### File Location
`.github/workflows/main.yml`

### Workflow Triggers

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

---

## Pipeline Stages

### 1. Lint & Type Check

```bash
# Frontend linting
npm run lint

# Backend linting
cd server && npm run lint

# TypeScript check (frontend)
npm run type-check
```

### 2. Build

```bash
# Frontend build
npm run build

# Backend (no build step for Node.js)
```

### 3. Test

```bash
# Unit tests
npm run test

# Backend tests
cd server && npm run test
```

---

## Local CI Commands

Run these commands locally to verify before pushing:

### Frontend

```bash
# Navigate to project root
cd WorkNest

# Install dependencies
npm install

# Lint
npm run lint

# Fix lint issues
npm run lint:fix

# Type check
npm run type-check

# Build
npm run build

# Run tests
npm run test
```

### Backend

```bash
# Navigate to server directory
cd WorkNest/server

# Install dependencies
npm install

# Lint
npm run lint

# Run tests
npm run test

# Start in development
npm run dev
```

---

## Sample GitHub Actions Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      # Frontend
      - name: Install frontend dependencies
        run: npm ci

      - name: Lint frontend
        run: npm run lint

      - name: Build frontend
        run: npm run build

      # Backend
      - name: Install backend dependencies
        working-directory: ./server
        run: npm ci

      - name: Lint backend
        working-directory: ./server
        run: npm run lint

  docker-build:
    runs-on: ubuntu-latest
    needs: lint-and-build
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build Docker images
        run: docker-compose build

  # Optional: Deploy to staging
  deploy-staging:
    runs-on: ubuntu-latest
    needs: docker-build
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - name: Deploy to staging
        run: echo "Deploy to staging environment"

  # Optional: Deploy to production
  deploy-production:
    runs-on: ubuntu-latest
    needs: docker-build
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to production
        run: echo "Deploy to production environment"
```

---

## Branch Strategy

| Branch | Purpose | Auto-Deploy |
|--------|---------|-------------|
| `main` | Production code | Production |
| `develop` | Staging/testing | Staging |
| `feature/*` | New features | None |
| `bugfix/*` | Bug fixes | None |
| `hotfix/*` | Production fixes | None |

---

## Deployment Commands

### Manual Deployment

```bash
# Build production images
docker-compose -f docker-compose.yml build

# Deploy using Docker
docker-compose up -d

# Or deploy to cloud (example: Railway)
railway up
```

### Environment Variables for CI/CD

Set these in GitHub Secrets (Settings → Secrets → Actions):

```
MONGODB_URI
JWT_SECRET
REFRESH_TOKEN_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
```

---

## Pre-commit Hooks (Optional)

Install Husky for pre-commit hooks:

```bash
# Install husky
npm install -D husky

# Initialize husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint"
```

---

## Recommended Hosting Platforms

| Platform | Free Tier | Best For |
|----------|-----------|----------|
| **Railway** | ✅ | Full stack MERN apps |
| **Render** | ✅ | Node.js backends |
| **Vercel** | ✅ | React frontends |
| **Cyclic** | ✅ | Full stack JS apps |

---

## Quick Reference

### Before Pushing

```bash
# Run all checks
npm run lint && npm run build

# Fix issues
npm run lint:fix
```

### After PR Merge

GitHub Actions will automatically:
1. Run lint checks
2. Build the application
3. Run tests
4. Deploy (if configured)
