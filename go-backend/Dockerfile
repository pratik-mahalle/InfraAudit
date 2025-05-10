FROM golang:1.20-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum files
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/api

# Create a minimal production image
FROM alpine:3.18
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/server .

# Set environment variables
ENV SERVER_PORT=8080
ENV GIN_MODE=release

# Expose the port
EXPOSE 8080

# Run the application
CMD ["./server"]