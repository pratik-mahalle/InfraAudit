package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/cloudguard/api/internal/config"
	"github.com/cloudguard/api/internal/models"
	"github.com/jackc/pgx/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockDB is a mock implementation of the Database interface
type MockDB struct {
	mock.Mock
}

// We'll implement the Pool interface
func (m *MockDB) QueryRow(ctx context.Context, query string, args ...interface{}) pgx.Row {
	// Create a MockRow that will return values defined in our test
	return &MockRow{m, query, args}
}

func (m *MockDB) Query(ctx context.Context, query string, args ...interface{}) (pgx.Rows, error) {
	// Not implemented for this test
	return nil, nil
}

func (m *MockDB) Exec(ctx context.Context, query string, args ...interface{}) (pgx.CommandTag, error) {
	// Not implemented for this test
	return nil, nil
}

// MockRow implements pgx.Row for testing
type MockRow struct {
	mockDB *MockDB
	query  string
	args   []interface{}
}

func (r *MockRow) Scan(dest ...interface{}) error {
	// For testing auth handler login
	if r.query == "SELECT id, username, password, full_name, created_at FROM users WHERE username = $1" {
		if r.args[0] == "testuser" {
			// Simulate finding the user
			id := dest[0].(*int)
			*id = 1

			username := dest[1].(*string)
			*username = "testuser"

			// $2a$10$Xny0xTB.zeKCFhfHbGYgY.OJGMb9q1RhtGOKPrMoZ9uYr3Fp2hkHO is bcrypt hash for "password123"
			password := dest[2].(*string)
			*password = "$2a$10$Xny0xTB.zeKCFhfHbGYgY.OJGMb9q1RhtGOKPrMoZ9uYr3Fp2hkHO"

			fullName := dest[3].(*string)
			*fullName = "Test User"

			createdAt := dest[4].(*time.Time)
			*createdAt = time.Now().Add(-24 * time.Hour)

			return nil
		}
		// User not found
		return pgx.ErrNoRows
	}

	// For testing GetCurrentUser
	if r.query == "SELECT id, username, full_name, created_at FROM users WHERE id = $1" {
		if r.args[0] == 1 {
			// Simulate finding the user
			id := dest[0].(*int)
			*id = 1

			username := dest[1].(*string)
			*username = "testuser"

			fullName := dest[2].(*string)
			*fullName = "Test User"

			createdAt := dest[3].(*time.Time)
			*createdAt = time.Now().Add(-24 * time.Hour)

			return nil
		}
		// User not found
		return pgx.ErrNoRows
	}

	return nil
}

func TestLogin_Success(t *testing.T) {
	// Create mock DB and config
	mockDB := new(MockDB)
	cfg := &config.Config{
		JWTSecret: "test-secret",
	}

	// Create handler with mock dependencies
	authHandler := &AuthHandler{
		DB: &struct{ Pool interface{} }{Pool: mockDB},
		Config: cfg,
	}

	// Create request with valid credentials
	loginRequest := LoginRequest{
		Username: "testuser",
		Password: "password123",
	}
	requestBody, _ := json.Marshal(loginRequest)

	req, err := http.NewRequest("POST", "/api/login", bytes.NewBuffer(requestBody))
	assert.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")

	// Create response recorder
	rr := httptest.NewRecorder()

	// Call login handler
	handler := http.HandlerFunc(authHandler.Login)
	handler.ServeHTTP(rr, req)

	// Check status code
	assert.Equal(t, http.StatusOK, rr.Code)

	// Parse response
	var response AuthResponse
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	assert.NoError(t, err)

	// Verify token and user data
	assert.NotEmpty(t, response.Token)
	assert.Equal(t, "testuser", response.User.Username)
	assert.Equal(t, "Test User", response.User.FullName)
}

func TestLogin_InvalidCredentials(t *testing.T) {
	// Create mock DB and config
	mockDB := new(MockDB)
	cfg := &config.Config{
		JWTSecret: "test-secret",
	}

	// Create handler with mock dependencies
	authHandler := &AuthHandler{
		DB: &struct{ Pool interface{} }{Pool: mockDB},
		Config: cfg,
	}

	// Create request with invalid credentials
	loginRequest := LoginRequest{
		Username: "wronguser",
		Password: "wrongpass",
	}
	requestBody, _ := json.Marshal(loginRequest)

	req, err := http.NewRequest("POST", "/api/login", bytes.NewBuffer(requestBody))
	assert.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")

	// Create response recorder
	rr := httptest.NewRecorder()

	// Call login handler
	handler := http.HandlerFunc(authHandler.Login)
	handler.ServeHTTP(rr, req)

	// Check status code (should be unauthorized)
	assert.Equal(t, http.StatusUnauthorized, rr.Code)
}

func TestGetCurrentUser_Success(t *testing.T) {
	// Create mock DB and config
	mockDB := new(MockDB)
	cfg := &config.Config{
		JWTSecret: "test-secret",
	}

	// Create handler with mock dependencies
	authHandler := &AuthHandler{
		DB: &struct{ Pool interface{} }{Pool: mockDB},
		Config: cfg,
	}

	// Create request
	req, err := http.NewRequest("GET", "/api/user", nil)
	assert.NoError(t, err)

	// Add user to context (as middleware would do)
	user := &models.User{
		ID:       1,
		Username: "testuser",
	}
	ctx := context.WithValue(req.Context(), "user", user)
	req = req.WithContext(ctx)

	// Create response recorder
	rr := httptest.NewRecorder()

	// Call handler
	handler := http.HandlerFunc(authHandler.GetCurrentUser)
	handler.ServeHTTP(rr, req)

	// Check status code
	assert.Equal(t, http.StatusOK, rr.Code)

	// Parse response
	var response models.User
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	assert.NoError(t, err)

	// Verify user data
	assert.Equal(t, 1, response.ID)
	assert.Equal(t, "testuser", response.Username)
	assert.Equal(t, "Test User", response.FullName)
}