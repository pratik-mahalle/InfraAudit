# CloudGuard Go Backend Migration Plan

## Overview
This document outlines the plan to migrate the current Node.js/Express backend to Go, while ensuring all existing APIs continue to function correctly.

## Phase 1: Setup & Environment

### Go Installation and Project Initialization
```bash
# Install Go (if not already installed)
# Create basic Go project structure
mkdir -p go-backend/cmd/api
mkdir -p go-backend/internal/api/handlers
mkdir -p go-backend/internal/api/middleware
mkdir -p go-backend/internal/models
mkdir -p go-backend/internal/db
mkdir -p go-backend/internal/services
mkdir -p go-backend/internal/config
mkdir -p go-backend/pkg/utils
```

### Initial Go Module Setup
```bash
cd go-backend
go mod init github.com/cloudguard/api
```

### Basic Configuration Files
```go
// go-backend/internal/config/config.go
package config

import (
	"os"
	"strconv"
)

type Config struct {
	ServerPort  int
	DatabaseURL string
	JWTSecret   string
	// AWS Configurations
	AWSRegion          string
	AWSAccessKeyID     string
	AWSSecretAccessKey string
	// Slack Configurations
	SlackBotToken  string
	SlackChannelID string
	// OpenAI Configurations
	OpenAIAPIKey string
}

func LoadConfig() *Config {
	port, _ := strconv.Atoi(getEnvWithDefault("SERVER_PORT", "8080"))

	return &Config{
		ServerPort:         port,
		DatabaseURL:        getEnvWithDefault("DATABASE_URL", ""),
		JWTSecret:          getEnvWithDefault("JWT_SECRET", "cloudguard-secret"),
		AWSRegion:          getEnvWithDefault("AWS_REGION", "us-east-1"),
		AWSAccessKeyID:     getEnvWithDefault("AWS_ACCESS_KEY_ID", ""),
		AWSSecretAccessKey: getEnvWithDefault("AWS_SECRET_ACCESS_KEY", ""),
		SlackBotToken:      getEnvWithDefault("SLACK_BOT_TOKEN", ""),
		SlackChannelID:     getEnvWithDefault("SLACK_CHANNEL_ID", ""),
		OpenAIAPIKey:       getEnvWithDefault("OPENAI_API_KEY", ""),
	}
}

func getEnvWithDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
```

## Phase 2: Database Integration

### PostgreSQL Connection and Setup
```go
// go-backend/internal/db/postgres.go
package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/cloudguard/api/internal/config"
	"github.com/jackc/pgx/v4/pgxpool"
)

type Database struct {
	Pool *pgxpool.Pool
}

func NewDatabase(cfg *config.Config) (*Database, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("unable to connect to database: %v", err)
	}

	// Verify connection
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("unable to ping database: %v", err)
	}

	log.Println("Successfully connected to PostgreSQL database")
	return &Database{Pool: pool}, nil
}

func (db *Database) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}
```

### Models Definition (Mapping to existing schema)
```go
// go-backend/internal/models/user.go
package models

import "time"

type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Password  string    `json:"-"` // Don't expose in JSON
	FullName  string    `json:"fullName"`
	CreatedAt time.Time `json:"createdAt"`
}

type CloudCredential struct {
	ID          int       `json:"id"`
	UserID      int       `json:"userId"`
	Provider    string    `json:"provider"`
	Credentials string    `json:"-"` // Encrypted credentials, don't expose
	CreatedAt   time.Time `json:"createdAt"`
}

type Resource struct {
	ID         string            `json:"id"`
	Name       string            `json:"name"`
	Type       string            `json:"type"`
	Provider   string            `json:"provider"`
	Region     string            `json:"region"`
	Status     string            `json:"status"`
	Cost       float64           `json:"cost"`
	Utilization float64          `json:"utilization"`
	CreatedAt  time.Time         `json:"createdAt"`
	Tags       map[string]string `json:"tags"`
}

// Additional models following the same pattern (SecurityDrift, CostAnomaly, Alert, Recommendation)
```

## Phase 3: API Structure & Authentication

### HTTP Server Setup
```go
// go-backend/cmd/api/main.go
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/cloudguard/api/internal/api/routes"
	"github.com/cloudguard/api/internal/config"
	"github.com/cloudguard/api/internal/db"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Connect to database
	database, err := db.NewDatabase(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.Close()

	// Setup router
	router := routes.SetupRouter(cfg, database)

	// Configure server
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.ServerPort),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Starting server on port %d", cfg.ServerPort)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Create context with timeout for shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Shutdown server
	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exiting")
}
```

### Authentication Implementation
```go
// go-backend/internal/api/middleware/auth.go
package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/cloudguard/api/internal/config"
	"github.com/cloudguard/api/internal/models"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
)

type contextKey string

const (
	UserContextKey contextKey = "user"
)

func AuthMiddleware(cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Check for Authorization header
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				// Check for session cookie as alternative
				cookie, err := r.Cookie("session")
				if err != nil || cookie.Value == "" {
					http.Error(w, "Unauthorized: No authentication provided", http.StatusUnauthorized)
					return
				}
				authHeader = "Bearer " + cookie.Value
			}

			// Extract the token
			tokenString := strings.TrimPrefix(authHeader, "Bearer ")
			if tokenString == authHeader {
				http.Error(w, "Unauthorized: Invalid token format", http.StatusUnauthorized)
				return
			}

			// Parse and validate token
			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte(cfg.JWTSecret), nil
			})

			if err != nil || !token.Valid {
				http.Error(w, "Unauthorized: Invalid token", http.StatusUnauthorized)
				return
			}

			// Extract claims
			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				http.Error(w, "Unauthorized: Invalid token claims", http.StatusUnauthorized)
				return
			}

			// Create user from claims
			userID := int(claims["id"].(float64))
			username := claims["username"].(string)

			// Set user in request context
			user := &models.User{
				ID:       userID,
				Username: username,
			}

			ctx := context.WithValue(r.Context(), UserContextKey, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// Helper to create JWT tokens
func GenerateToken(user *models.User, cfg *config.Config) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":       user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
		"jti":      uuid.New().String(),
	})

	return token.SignedString([]byte(cfg.JWTSecret))
}
```

## Phase 4: Core Service Implementation

### AWS Integration Service
```go
// go-backend/internal/services/aws_service.go
package services

import (
	"context"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/cloudguard/api/internal/models"
)

type AWSService struct {
	Config aws.Config
}

func NewAWSService(accessKey, secretKey, region string) (*AWSService, error) {
	// Create AWS config with provided credentials
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			accessKey,
			secretKey,
			"",
		)),
	)
	if err != nil {
		return nil, err
	}

	return &AWSService{
		Config: cfg,
	}, nil
}

// List S3 buckets and convert to our resource model
func (s *AWSService) ListS3Buckets() ([]models.Resource, error) {
	// Create S3 client
	client := s3.NewFromConfig(s.Config)

	// List buckets
	result, err := client.ListBuckets(context.TODO(), &s3.ListBucketsInput{})
	if err != nil {
		return nil, err
	}

	// Convert to resources
	resources := make([]models.Resource, 0, len(result.Buckets))
	for _, bucket := range result.Buckets {
		// Get bucket region
		regionResult, err := client.GetBucketLocation(context.TODO(), &s3.GetBucketLocationInput{
			Bucket: bucket.Name,
		})
		
		region := "us-east-1" // Default region
		if err == nil && regionResult.LocationConstraint != "" {
			region = string(regionResult.LocationConstraint)
		}

		// Create resource
		resource := models.Resource{
			ID:         *bucket.Name,
			Name:       *bucket.Name,
			Type:       "S3",
			Provider:   "AWS",
			Region:     region,
			Status:     "active",
			Cost:       0, // Will be calculated separately
			Utilization: 0, // Will be calculated separately
			CreatedAt:  *bucket.CreationDate,
			Tags:       make(map[string]string),
		}

		// Get bucket tags
		tagsResult, err := client.GetBucketTagging(context.TODO(), &s3.GetBucketTaggingInput{
			Bucket: bucket.Name,
		})
		
		if err == nil {
			for _, tag := range tagsResult.TagSet {
				resource.Tags[*tag.Key] = *tag.Value
			}
		}

		resources = append(resources, resource)
	}

	return resources, nil
}

// Implement remaining AWS service methods
// - EC2 instances
// - Cost Explorer integration
// - IAM roles and policies
// - Other AWS services
```

### Slack Integration Service
```go
// go-backend/internal/services/slack_service.go
package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type SlackService struct {
	BotToken  string
	ChannelID string
}

type SlackMessage struct {
	Channel string `json:"channel"`
	Text    string `json:"text,omitempty"`
	Blocks  []any  `json:"blocks,omitempty"`
}

func NewSlackService(botToken, channelID string) *SlackService {
	return &SlackService{
		BotToken:  botToken,
		ChannelID: channelID,
	}
}

func (s *SlackService) SendMessage(message *SlackMessage) error {
	// Set default channel if not provided
	if message.Channel == "" {
		message.Channel = s.ChannelID
	}

	// Marshal message to JSON
	data, err := json.Marshal(message)
	if err != nil {
		return err
	}

	// Create request
	req, err := http.NewRequest("POST", "https://slack.com/api/chat.postMessage", bytes.NewBuffer(data))
	if err != nil {
		return err
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.BotToken))

	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// Check response
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("slack API returned non-200 status: %d", resp.StatusCode)
	}

	// Parse response
	var result struct {
		Ok    bool   `json:"ok"`
		Error string `json:"error,omitempty"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return err
	}

	if !result.Ok {
		return fmt.Errorf("slack API error: %s", result.Error)
	}

	return nil
}
```

## Phase 5: API Endpoints

### User Authentication Endpoints
```go
// go-backend/internal/api/handlers/auth_handler.go
package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/cloudguard/api/internal/api/middleware"
	"github.com/cloudguard/api/internal/config"
	"github.com/cloudguard/api/internal/db"
	"github.com/cloudguard/api/internal/models"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	DB     *db.Database
	Config *config.Config
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	FullName string `json:"fullName"`
}

type AuthResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

func NewAuthHandler(db *db.Database, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		DB:     db,
		Config: cfg,
	}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Find user by username
	var user models.User
	err := h.DB.Pool.QueryRow(r.Context(), 
		"SELECT id, username, password, full_name, created_at FROM users WHERE username = $1",
		req.Username,
	).Scan(&user.ID, &user.Username, &user.Password, &user.FullName, &user.CreatedAt)

	if err != nil {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	// Compare passwords
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	// Generate token
	token, err := middleware.GenerateToken(&user, h.Config)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Set HTTP-only cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   r.TLS != nil,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(24 * time.Hour),
	})

	// Return token and user information
	response := AuthResponse{
		Token: token,
		User:  user,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	// Create user
	var user models.User
	err = h.DB.Pool.QueryRow(r.Context(),
		`INSERT INTO users (username, password, full_name, created_at) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, username, password, full_name, created_at`,
		req.Username, string(hashedPassword), req.FullName, time.Now(),
	).Scan(&user.ID, &user.Username, &user.Password, &user.FullName, &user.CreatedAt)

	if err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	// Generate token
	token, err := middleware.GenerateToken(&user, h.Config)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Set HTTP-only cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   r.TLS != nil,
		SameSite: http.SameSiteStrictMode,
		Expires:  time.Now().Add(24 * time.Hour),
	})

	// Return token and user information
	response := AuthResponse{
		Token: token,
		User:  user,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	// Clear session cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   r.TLS != nil,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   -1,
	})

	w.WriteHeader(http.StatusOK)
}

func (h *AuthHandler) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	// User is already in context from auth middleware
	user, ok := r.Context().Value(middleware.UserContextKey).(*models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	// Get full user details from database
	err := h.DB.Pool.QueryRow(r.Context(),
		"SELECT id, username, full_name, created_at FROM users WHERE id = $1",
		user.ID,
	).Scan(&user.ID, &user.Username, &user.FullName, &user.CreatedAt)

	if err != nil {
		http.Error(w, "Failed to get user details", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
```

### Resources Endpoints
```go
// go-backend/internal/api/handlers/resources_handler.go
package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/cloudguard/api/internal/api/middleware"
	"github.com/cloudguard/api/internal/config"
	"github.com/cloudguard/api/internal/db"
	"github.com/cloudguard/api/internal/models"
	"github.com/cloudguard/api/internal/services"
	"github.com/go-chi/chi/v5"
)

type ResourcesHandler struct {
	DB     *db.Database
	Config *config.Config
}

func NewResourcesHandler(db *db.Database, cfg *config.Config) *ResourcesHandler {
	return &ResourcesHandler{
		DB:     db,
		Config: cfg,
	}
}

func (h *ResourcesHandler) GetResources(w http.ResponseWriter, r *http.Request) {
	// Get resources from database
	rows, err := h.DB.Pool.Query(r.Context(),
		`SELECT id, name, type, provider, region, status, cost, utilization, created_at 
         FROM resources`)
	if err != nil {
		http.Error(w, "Failed to get resources", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	resources := []models.Resource{}
	for rows.Next() {
		var resource models.Resource
		err := rows.Scan(
			&resource.ID,
			&resource.Name,
			&resource.Type,
			&resource.Provider,
			&resource.Region,
			&resource.Status,
			&resource.Cost,
			&resource.Utilization,
			&resource.CreatedAt,
		)
		if err != nil {
			http.Error(w, "Failed to scan resource", http.StatusInternalServerError)
			return
		}
		
		// Get tags for resource
		tagRows, err := h.DB.Pool.Query(r.Context(),
			`SELECT key, value FROM resource_tags WHERE resource_id = $1`,
			resource.ID)
		if err != nil {
			http.Error(w, "Failed to get resource tags", http.StatusInternalServerError)
			return
		}
		
		resource.Tags = make(map[string]string)
		for tagRows.Next() {
			var key, value string
			if err := tagRows.Scan(&key, &value); err != nil {
				tagRows.Close()
				http.Error(w, "Failed to scan tag", http.StatusInternalServerError)
				return
			}
			resource.Tags[key] = value
		}
		tagRows.Close()
		
		resources = append(resources, resource)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resources)
}

func (h *ResourcesHandler) GetResourceById(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "Resource ID is required", http.StatusBadRequest)
		return
	}

	var resource models.Resource
	err := h.DB.Pool.QueryRow(r.Context(),
		`SELECT id, name, type, provider, region, status, cost, utilization, created_at 
         FROM resources WHERE id = $1`,
		id,
	).Scan(
		&resource.ID,
		&resource.Name,
		&resource.Type,
		&resource.Provider,
		&resource.Region,
		&resource.Status,
		&resource.Cost,
		&resource.Utilization,
		&resource.CreatedAt,
	)

	if err != nil {
		http.Error(w, "Resource not found", http.StatusNotFound)
		return
	}
	
	// Get tags for resource
	tagRows, err := h.DB.Pool.Query(r.Context(),
		`SELECT key, value FROM resource_tags WHERE resource_id = $1`,
		resource.ID)
	if err != nil {
		http.Error(w, "Failed to get resource tags", http.StatusInternalServerError)
		return
	}
	
	resource.Tags = make(map[string]string)
	for tagRows.Next() {
		var key, value string
		if err := tagRows.Scan(&key, &value); err != nil {
			tagRows.Close()
			http.Error(w, "Failed to scan tag", http.StatusInternalServerError)
			return
		}
		resource.Tags[key] = value
	}
	tagRows.Close()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resource)
}

func (h *ResourcesHandler) GetAWSResources(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value(middleware.UserContextKey).(*models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	// Get AWS credentials from database
	var creds struct {
		AccessKey string
		SecretKey string
		Region    string
	}

	err := h.DB.Pool.QueryRow(r.Context(),
		`SELECT 
           (credentials->>'accessKeyId') as access_key,
           (credentials->>'secretAccessKey') as secret_key,
           COALESCE(credentials->>'region', 'us-east-1') as region
         FROM cloud_credentials 
         WHERE user_id = $1 AND provider = 'AWS'`,
		user.ID,
	).Scan(&creds.AccessKey, &creds.SecretKey, &creds.Region)

	if err != nil {
		http.Error(w, "AWS credentials not found", http.StatusNotFound)
		return
	}

	// Create AWS service
	awsService, err := services.NewAWSService(creds.AccessKey, creds.SecretKey, creds.Region)
	if err != nil {
		http.Error(w, "Failed to create AWS service", http.StatusInternalServerError)
		return
	}

	// Get S3 buckets
	resources, err := awsService.ListS3Buckets()
	if err != nil {
		http.Error(w, "Failed to get AWS resources: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resources)
}

// Continue implementing other resource endpoints
// - Get resources by provider
// - Get resources by type 
// - Create resource
// - Update resource
```

## Phase 6: Routing Setup

### Router Configuration
```go
// go-backend/internal/api/routes/router.go
package routes

import (
	"net/http"

	"github.com/cloudguard/api/internal/api/handlers"
	"github.com/cloudguard/api/internal/api/middleware"
	"github.com/cloudguard/api/internal/config"
	"github.com/cloudguard/api/internal/db"
	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
)

func SetupRouter(cfg *config.Config, database *db.Database) http.Handler {
	r := chi.NewRouter()

	// Global middleware
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.StripSlashes)
	r.Use(chimiddleware.RequestID)

	// Create handlers
	authHandler := handlers.NewAuthHandler(database, cfg)
	resourcesHandler := handlers.NewResourcesHandler(database, cfg)
	// Initialize additional handlers...

	// Public routes
	r.Group(func(r chi.Router) {
		r.Post("/api/login", authHandler.Login)
		r.Post("/api/register", authHandler.Register)
		
		// Health check
		r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("OK"))
		})
	})

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.AuthMiddleware(cfg))

		// Auth routes
		r.Post("/api/logout", authHandler.Logout)
		r.Get("/api/user", authHandler.GetCurrentUser)

		// Resources routes
		r.Get("/api/resources", resourcesHandler.GetResources)
		r.Get("/api/resources/{id}", resourcesHandler.GetResourceById)
		r.Get("/api/aws-resources", resourcesHandler.GetAWSResources)
		
		// Additional resource routes...
		
		// Cloud provider routes
		
		// Security drift routes
		
		// Cost anomaly routes
		
		// Alerts routes
		
		// Recommendations routes
		
		// Notifications routes
	})

	// If we're in development mode, serve static files
	if cfg.Environment == "development" {
		fileServer := http.FileServer(http.Dir("./public"))
		r.Handle("/*", http.StripPrefix("/", fileServer))
	}

	return r
}
```

## Phase 7: Testing & Deployment

### Basic Test Setup
```go
// go-backend/internal/api/handlers/auth_handler_test.go
package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cloudguard/api/internal/api/handlers"
	"github.com/cloudguard/api/internal/config"
	"github.com/cloudguard/api/internal/db"
	"github.com/stretchr/testify/assert"
)

// Mock database for testing
type MockDB struct {
	// Add methods to mock database behavior
}

func TestLogin(t *testing.T) {
	// Setup
	cfg := &config.Config{
		JWTSecret: "test-secret",
	}
	
	mockDB := &MockDB{}
	
	handler := handlers.NewAuthHandler(mockDB, cfg)
	
	// Test valid login
	loginReq := handlers.LoginRequest{
		Username: "testuser",
		Password: "password123",
	}
	
	body, _ := json.Marshal(loginReq)
	req := httptest.NewRequest("POST", "/api/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	
	rr := httptest.NewRecorder()
	
	handler.Login(rr, req)
	
	assert.Equal(t, http.StatusOK, rr.Code)
	
	var response handlers.AuthResponse
	json.Unmarshal(rr.Body.Bytes(), &response)
	
	assert.NotEmpty(t, response.Token)
	assert.Equal(t, "testuser", response.User.Username)
}

// Additional tests
```

### Deployment Configuration
```yaml
# go-backend/deployment/Dockerfile
FROM golang:1.19-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o server ./cmd/api

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/server .

EXPOSE 8080

CMD ["./server"]
```

## Phase 8: Migration Strategy

1. **Parallel Operation**:
   - Deploy the Go backend alongside the existing Node.js backend
   - Initially route only a small percentage of traffic to the Go backend
   - Gradually increase traffic as confidence grows

2. **API Compatibility**:
   - Ensure all API endpoints have the same URL patterns
   - Return identical JSON structures for all endpoints
   - Match authentication mechanisms and token formats

3. **Database Sharing**:
   - Both backends should connect to the same PostgreSQL database
   - Test thoroughly to ensure no schema conflicts

4. **Testing Strategy**:
   - Create comprehensive API tests for all endpoints
   - Verify that both backends return identical responses
   - Monitor for any performance differences

5. **Rollback Plan**:
   - Keep the Node.js backend running until full confidence in the Go backend
   - Create deployment scripts that can quickly revert to the Node.js backend
   - Implement feature flags to control which backend handles requests

## Required Go Dependencies

```
go get -u github.com/go-chi/chi/v5
go get -u github.com/jackc/pgx/v4
go get -u github.com/aws/aws-sdk-go-v2
go get -u github.com/aws/aws-sdk-go-v2/config
go get -u github.com/aws/aws-sdk-go-v2/credentials
go get -u github.com/aws/aws-sdk-go-v2/service/s3
go get -u github.com/aws/aws-sdk-go-v2/service/ec2
go get -u github.com/aws/aws-sdk-go-v2/service/costexplorer
go get -u github.com/aws/aws-sdk-go-v2/service/iam
go get -u github.com/golang-jwt/jwt/v4
go get -u github.com/stretchr/testify
go get -u golang.org/x/crypto/bcrypt
go get -u github.com/google/uuid
go get -u github.com/sashabaranov/go-openai
```