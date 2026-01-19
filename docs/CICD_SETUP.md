# CI/CD Pipeline Setup Guide

This document describes how to set up the CI/CD pipeline for TogetherList.

## Overview

The pipeline uses **GitHub Actions** to build, test, and deploy to **Azure Container Apps**.  
Container images are stored in **GitHub Container Registry** (ghcr.io).

```mermaid
graph LR
    A[Push to main] --> B[Backend CI]
    A --> C[Frontend CI]
    B --> D[Docker Build]
    C --> D
    D -->|Push to ghcr.io| E[Deploy to Azure]
```

## Pipeline Jobs

| Job | Description | Duration |
|-----|-------------|----------|
| `backend-ci` | Go build, test, lint, gosec security scan | ~2 min |
| `frontend-ci` | Bun install, TypeScript check, Vitest, audit | ~2 min |
| `docker-build-push` | Multi-stage Docker build, push to ghcr.io | ~3 min |
| `deploy` | Update Azure Container App | ~1 min |

## GitHub Secrets Setup

Navigate to **Repository → Settings → Secrets and variables → Actions** and add:

### Required Secrets for Deployment

| Secret | Purpose | How to Obtain |
|--------|---------|---------------|
| `AZURE_CREDENTIALS` | Azure service principal JSON | See below |
| `AZURE_CONTAINER_APP_NAME` | Container App name | From Azure portal |
| `AZURE_RESOURCE_GROUP` | Resource group name | From Azure portal |

> **Note**: `GITHUB_TOKEN` is automatically provided by GitHub Actions for GHCR authentication.

### Creating Azure Credentials

```bash
# Login to Azure CLI
az login

# Create service principal (replace {subscription-id})
az ad sp create-for-rbac \
  --name "togetherlist-cicd" \
  --role contributor \
  --scopes /subscriptions/{subscription-id} \
  --sdk-auth
```

Copy the entire JSON output and paste as the `AZURE_CREDENTIALS` secret value.

## Azure Setup Commands

### Prerequisites

```bash
# Install Azure CLI
brew install azure-cli  # macOS

# Login
az login
```

### Full Setup Script

```bash
# Variables
RESOURCE_GROUP="togetherlist-rg"
LOCATION="westeurope"
CONTAINER_APP_ENV="togetherlist-env"
CONTAINER_APP_NAME="togetherlist"
GHCR_IMAGE="ghcr.io/YOUR_GITHUB_USERNAME/shared-list:latest"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Container Apps environment
az containerapp env create \
  --name $CONTAINER_APP_ENV \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Create Container App with GHCR image
az containerapp create \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_APP_ENV \
  --image $GHCR_IMAGE \
  --target-port 8080 \
  --ingress external \
  --registry-server ghcr.io \
  --registry-username YOUR_GITHUB_USERNAME \
  --registry-password YOUR_GITHUB_PAT

# Create service principal for GitHub Actions
az ad sp create-for-rbac \
  --name "togetherlist-cicd" \
  --role contributor \
  --scopes /subscriptions/$(az account show --query id -o tsv) \
  --sdk-auth
```

> **Note**: For GHCR access from Azure, create a GitHub Personal Access Token (PAT) with `read:packages` scope.

## GitHub Container Registry

Images are automatically pushed to:
```
ghcr.io/YOUR_USERNAME/shared-list:SHA
ghcr.io/YOUR_USERNAME/shared-list:latest
```

### Making Packages Public (Optional)

1. Go to your GitHub profile → Packages
2. Click on the `shared-list` package
3. Package settings → Change visibility → Public

## Local Docker Testing

Test the Docker build locally before pushing:

```bash
# Build
docker build -t togetherlist:local .

# Run
docker run --rm -p 8080:8080 -v $(pwd)/data:/data togetherlist:local

# Test
curl http://localhost:8080/health
```

## Monitoring

- **GitHub Actions**: Repository → Actions tab
- **Container Images**: Repository → Packages
- **Azure Portal**: Container Apps → your-app → Metrics/Logs
- **Coverage Reports**: Download artifacts from Actions run

## Troubleshooting

| Issue | Solution |
|-------|----------|
| GHCR push fails | Ensure repo has `packages: write` permission |
| Container won't start | Check logs: `az containerapp logs show --name togetherlist --resource-group myResourceGroup` |
| Azure can't pull from GHCR | Use a GitHub PAT with `read:packages` scope |
| Tests fail in CI | Run locally: `go test ./...` or `bun run test:run` |
