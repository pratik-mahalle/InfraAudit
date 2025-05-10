# Build stage
FROM golang:1.20-alpine AS builder

# Install necessary build tools
RUN apk add --no-cache git make

# Set the working directory
WORKDIR /app

# Copy go.mod and go.sum files
COPY go-backend/go.mod go-backend/go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY go-backend/ ./

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o cloudguard-api ./cmd/api

# Runtime stage
FROM alpine:3.18

# Install necessary runtime dependencies
RUN apk add --no-cache ca-certificates tzdata curl

# Create a non-root user to run the application
RUN adduser -D -g '' cloudguard

# Set the working directory
WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/cloudguard-api .

# Copy config files if needed
COPY --from=builder /app/configs ./configs

# Set file ownership
RUN chown -R cloudguard:cloudguard /app

# Use the non-root user
USER cloudguard

# Expose the application port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# Set environment variables
ENV GIN_MODE=release

# Run the application
CMD ["./cloudguard-api"]