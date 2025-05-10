.PHONY: build run test clean

# Default target
all: build

# Build the application
build:
	@echo "Building CloudGuard Go backend..."
	@go build -o bin/server ./cmd/api

# Run the application
run:
	@echo "Running CloudGuard Go backend..."
	@go run ./cmd/api

# Run tests
test:
	@echo "Running tests..."
	@go test -v ./...

# Clean build artifacts
clean:
	@echo "Cleaning up..."
	@rm -rf bin/

# Install dependencies
deps:
	@echo "Installing dependencies..."
	@go mod download

# Format code
fmt:
	@echo "Formatting code..."
	@go fmt ./...

# Lint code
lint:
	@echo "Linting code..."
	@go vet ./...

# Help information
help:
	@echo "CloudGuard Go Backend Makefile Usage"
	@echo ""
	@echo "make build       - Build the application"
	@echo "make run         - Run the application"
	@echo "make test        - Run tests"
	@echo "make clean       - Clean build artifacts"
	@echo "make deps        - Install dependencies"
	@echo "make fmt         - Format code"
	@echo "make lint        - Lint code"
	@echo "make help        - Show this help message"