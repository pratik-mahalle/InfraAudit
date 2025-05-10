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

// AuthMiddleware is a middleware that verifies JWT tokens
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
				// Validate signing method
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				// Return the key used for signing
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

			// Check token expiration
			exp, ok := claims["exp"].(float64)
			if !ok {
				http.Error(w, "Unauthorized: Invalid token expiration", http.StatusUnauthorized)
				return
			}

			if time.Unix(int64(exp), 0).Before(time.Now()) {
				http.Error(w, "Unauthorized: Token expired", http.StatusUnauthorized)
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

// GenerateToken generates a JWT token for a user
func GenerateToken(user *models.User, cfg *config.Config) (string, error) {
	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":       user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
		"jti":      uuid.New().String(), // Unique token ID
	})

	// Sign the token with the secret key
	return token.SignedString([]byte(cfg.JWTSecret))
}