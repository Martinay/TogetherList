#!/bin/bash
set -e

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Starting Backend Quality Checks..."

# Determine backend directory
if [ -d "backend" ]; then
    cd backend
    echo "Filesystem: Switched to backend directory"
elif [ -f "go.mod" ]; then
    echo "Filesystem: Already in backend directory (assumed based on go.mod)"
else
    echo -e "${RED}Error: Cannot find backend directory or go.mod${NC}"
    exit 1
fi

# 1. Dependencies
echo -e "\n${GREEN}1. Downloading dependencies...${NC}"
go mod download

# 2. Build
echo -e "\n${GREEN}2. Building...${NC}"
go build -v ./...

# 3. Test
echo -e "\n${GREEN}3. Running tests...${NC}"
go test -race -coverprofile=coverage.out -covermode=atomic ./...

# 4. Vet
echo -e "\n${GREEN}4. Running go vet...${NC}"
go vet ./...

# 5. Staticcheck
echo -e "\n${GREEN}5. Running staticcheck...${NC}"
if ! command -v staticcheck &> /dev/null; then
    echo "staticcheck not found, installing..."
    go install honnef.co/go/tools/cmd/staticcheck@latest
fi
# Use full path to ensure it runs if just installed and not in PATH yet
$(go env GOPATH)/bin/staticcheck ./...

# 6. Gosec
echo -e "\n${GREEN}6. Running gosec...${NC}"
if ! command -v gosec &> /dev/null; then
    echo "gosec not found, installing..."
    go install github.com/securego/gosec/v2/cmd/gosec@latest
fi
# Use full path
$(go env GOPATH)/bin/gosec -fmt=text ./...

echo -e "\n${GREEN}All checks passed successfully!${NC}"
