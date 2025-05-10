.PHONY: build run test test-race test-cover lint docker-build docker-run docker-push k8s-apply k8s-delete help

# Variables
APP_NAME = cloudguard-api
VERSION ?= $(shell git describe --tags --always --dirty)
DOCKER_REGISTRY ?= example.com/cloudguard
DOCKER_IMAGE = $(DOCKER_REGISTRY)/$(APP_NAME):$(VERSION)
DOCKER_LATEST = $(DOCKER_REGISTRY)/$(APP_NAME):latest

# Default target
.DEFAULT_GOAL := help

# Build the binary
build:
	@echo "Building $(APP_NAME)..."
	@CGO_ENABLED=0 go build -o bin/$(APP_NAME) ./cmd/api

# Run the application
run:
	@echo "Running $(APP_NAME)..."
	@go run ./cmd/api

# Run tests
test:
	@echo "Running tests..."
	@go test -v ./...

# Run tests with race detection
test-race:
	@echo "Running tests with race detection..."
	@go test -race -v ./...

# Run tests with coverage
test-cover:
	@echo "Running tests with coverage..."
	@go test -coverprofile=coverage.out ./...
	@go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated at coverage.html"

# Run linters
lint:
	@echo "Running linters..."
	@golangci-lint run ./...

# Build Docker image
docker-build:
	@echo "Building Docker image $(DOCKER_IMAGE)..."
	@docker build -t $(DOCKER_IMAGE) -t $(DOCKER_LATEST) -f Dockerfile ..

# Run Docker container
docker-run:
	@echo "Running Docker container..."
	@docker run -p 8080:8080 \
		-e DATABASE_URL=postgres://postgres:postgres@host.docker.internal:5432/cloudguard?sslmode=disable \
		-e JWT_SECRET=development-jwt-secret-key \
		-e AWS_ACCESS_KEY_ID=$(AWS_ACCESS_KEY_ID) \
		-e AWS_SECRET_ACCESS_KEY=$(AWS_SECRET_ACCESS_KEY) \
		-e AWS_REGION=$(AWS_REGION) \
		-e OPENAI_API_KEY=$(OPENAI_API_KEY) \
		-e SLACK_BOT_TOKEN=$(SLACK_BOT_TOKEN) \
		-e SLACK_CHANNEL_ID=$(SLACK_CHANNEL_ID) \
		$(DOCKER_IMAGE)

# Push Docker image
docker-push:
	@echo "Pushing Docker image $(DOCKER_IMAGE)..."
	@docker push $(DOCKER_IMAGE)
	@docker push $(DOCKER_LATEST)

# Start local development environment
dev:
	@echo "Starting development environment with Docker Compose..."
	@docker-compose up -d

# Stop local development environment
dev-stop:
	@echo "Stopping development environment..."
	@docker-compose down

# Apply Kubernetes manifests
k8s-apply:
	@echo "Applying Kubernetes manifests..."
	@kubectl apply -f k8s/configmap.yaml
	@kubectl apply -f k8s/service.yaml
	@kubectl apply -f k8s/deployment.yaml
	@kubectl apply -f k8s/hpa.yaml
	@kubectl apply -f k8s/ingress.yaml

# Delete Kubernetes resources
k8s-delete:
	@echo "Deleting Kubernetes resources..."
	@kubectl delete -f k8s/ingress.yaml
	@kubectl delete -f k8s/hpa.yaml
	@kubectl delete -f k8s/deployment.yaml
	@kubectl delete -f k8s/service.yaml
	@kubectl delete -f k8s/configmap.yaml

# Generate database migration
db-migrate:
	@echo "Generating database migration..."
	@migrate create -ext sql -dir db/migrations -seq $(name)

# Run database migrations
db-up:
	@echo "Running database migrations..."
	@migrate -path db/migrations -database "$(DATABASE_URL)" up

# Rollback database migrations
db-down:
	@echo "Rolling back database migrations..."
	@migrate -path db/migrations -database "$(DATABASE_URL)" down 1

# Load test the API
load-test:
	@echo "Running load tests..."
	@k6 run tests/load-test.js

# Help command
help:
	@echo "CloudGuard API - Makefile targets:"
	@echo "  build        - Build the binary"
	@echo "  run          - Run the application"
	@echo "  test         - Run tests"
	@echo "  test-race    - Run tests with race detection"
	@echo "  test-cover   - Run tests with coverage"
	@echo "  lint         - Run linters"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run   - Run Docker container"
	@echo "  docker-push  - Push Docker image"
	@echo "  dev          - Start local development environment"
	@echo "  dev-stop     - Stop local development environment"
	@echo "  k8s-apply    - Apply Kubernetes manifests"
	@echo "  k8s-delete   - Delete Kubernetes resources"
	@echo "  db-migrate   - Generate database migration (usage: make db-migrate name=migration_name)"
	@echo "  db-up        - Run database migrations"
	@echo "  db-down      - Rollback database migrations"
	@echo "  load-test    - Run load tests"
	@echo "  help         - Show this help message"