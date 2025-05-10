package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/cloudguard/api/internal/api/middleware"
	"github.com/cloudguard/api/internal/config"
	"github.com/cloudguard/api/internal/db"
	"github.com/cloudguard/api/internal/models"
	"golang.org/x/crypto/bcrypt"
)

// AuthHandler handles authentication requests
type AuthHandler struct {
	DB     *db.Database
	Config *config.Config
}

// LoginRequest represents a login request
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// RegisterRequest represents a registration request
type RegisterRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	FullName string `json:"fullName"`
}

// AuthResponse represents an authentication response
type AuthResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

// NewAuthHandler creates a new authentication handler
func NewAuthHandler(db *db.Database, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		DB:     db,
		Config: cfg,
	}
}

// Login handles user login
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
		log.Printf("Login failed for user %s: %v", req.Username, err)
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	// Compare passwords
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		log.Printf("Invalid password for user %s", req.Username)
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	// Generate token
	token, err := middleware.GenerateToken(&user, h.Config)
	if err != nil {
		log.Printf("Failed to generate token for user %s: %v", req.Username, err)
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

	// Don't include password in response
	user.Password = ""

	// Return token and user information
	response := AuthResponse{
		Token: token,
		User:  user,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Register handles user registration
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Check if username already exists
	var count int
	err := h.DB.Pool.QueryRow(r.Context(), 
		"SELECT COUNT(*) FROM users WHERE username = $1", 
		req.Username,
	).Scan(&count)

	if err != nil {
		log.Printf("Failed to check username existence: %v", err)
		http.Error(w, "Failed to check username", http.StatusInternalServerError)
		return
	}

	if count > 0 {
		http.Error(w, "Username already exists", http.StatusBadRequest)
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Failed to hash password: %v", err)
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
		log.Printf("Failed to create user: %v", err)
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	// Generate token
	token, err := middleware.GenerateToken(&user, h.Config)
	if err != nil {
		log.Printf("Failed to generate token for new user: %v", err)
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

	// Don't include password in response
	user.Password = ""

	// Return token and user information
	response := AuthResponse{
		Token: token,
		User:  user,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// Logout handles user logout
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

// GetCurrentUser gets the current authenticated user
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
		log.Printf("Failed to get user details: %v", err)
		http.Error(w, "Failed to get user details", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}