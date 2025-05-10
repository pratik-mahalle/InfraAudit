# CloudGuard Go Backend Testing Guide

This document provides guidelines for testing the CloudGuard Go backend. It covers unit testing, integration testing, and end-to-end testing approaches.

## Testing Framework

The CloudGuard Go backend uses the following testing tools:

- **Go's Built-in Testing Package**: For writing unit and integration tests
- **Testify**: For assertions and mocks
- **Httptest**: For HTTP handler testing
- **Docker**: For integration testing with dependencies

## Running Tests

### Unit Tests

To run all unit tests:

```bash
cd go-backend
go test -v ./...
```

To run tests with race detection:

```bash
go test -race -v ./...
```

To run tests with coverage:

```bash
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out  # View coverage in browser
```

To run tests for a specific package:

```bash
go test -v ./internal/api/handlers
```

### Mock Dependencies

When testing components that have external dependencies (database, AWS services, etc.), use mocks to isolate the component under test. The project uses the Testify mock package for creating mocks.

Example from `auth_handler_test.go`:

```go
// Create mock DB
mockDB := new(MockDB)

// Set up expectations
mockDB.On("QueryRow", mock.Anything, "SELECT id, username, password, full_name, created_at FROM users WHERE username = $1", "testuser").Return(...)

// Create handler with mock
authHandler := &AuthHandler{
    DB:     &struct{ Pool interface{} }{Pool: mockDB},
    Config: cfg,
}

// Test the handler
// ...

// Verify expectations
mockDB.AssertExpectations(t)
```

## Test Organization

### Unit Tests

Unit tests should be placed in the same package as the code they test, with a `_test.go` suffix. For example, tests for `auth_handler.go` should be in `auth_handler_test.go`.

### Integration Tests

Integration tests that require external dependencies should be placed in a separate `tests` package. These tests should be tagged so they can be skipped in regular test runs:

```go
// +build integration

package tests

// Integration test code here
```

Run integration tests with:

```bash
go test -tags=integration ./tests
```

## Test Conventions

1. **Test Function Naming**: Use the format `Test<FunctionName>_<Scenario>` for test functions. For example, `TestLogin_Success`, `TestLogin_InvalidCredentials`.

2. **Table-Driven Tests**: Use table-driven tests for testing multiple scenarios:

```go
func TestValidateCredentials(t *testing.T) {
    testCases := []struct {
        name     string
        input    Credentials
        expected bool
        errMsg   string
    }{
        {
            name:     "valid credentials",
            input:    Credentials{Username: "user", Password: "pass"},
            expected: true,
            errMsg:   "",
        },
        {
            name:     "empty username",
            input:    Credentials{Username: "", Password: "pass"},
            expected: false,
            errMsg:   "username is required",
        },
        // More test cases...
    }

    for _, tc := range testCases {
        t.Run(tc.name, func(t *testing.T) {
            result, err := ValidateCredentials(tc.input)
            assert.Equal(t, tc.expected, result)
            if tc.errMsg != "" {
                assert.Contains(t, err.Error(), tc.errMsg)
            } else {
                assert.NoError(t, err)
            }
        })
    }
}
```

3. **Test Helpers**: Create helper functions for common test setup and teardown. Place them in a separate `testing.go` file.

## CI/CD Integration

Tests are automatically run as part of the CI/CD pipeline configured in `.github/workflows/ci.yml`. The pipeline:

1. Runs all unit tests
2. Checks code coverage
3. Runs linters
4. Builds the Docker image
5. Deploys to Kubernetes if all tests pass

## End-to-End Testing

For end-to-end testing, we use a combination of:

1. **API Tests**: Testing the API endpoints using HTTP clients
2. **Integration Tests**: Testing the interaction with external services

### API Testing with curl

Basic health check:

```bash
curl -v https://api.example.com/api/health
```

Authentication:

```bash
# Login
curl -X POST -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}' \
  https://api.example.com/api/login

# Use the JWT token
curl -H "Authorization: Bearer <token>" \
  https://api.example.com/api/user
```

### Load Testing

For load testing, use [hey](https://github.com/rakyll/hey) or [k6](https://k6.io/):

```bash
# Run 100 requests with 10 concurrent users
hey -n 100 -c 10 https://api.example.com/api/health
```

## Test Coverage Goals

The project aims for at least 80% code coverage for critical components:

- Authentication handlers
- AWS integration services
- Business logic

## Troubleshooting Tests

1. **Docker required but not running**:
   - Ensure Docker is running for integration tests

2. **Auth tests failing**:
   - Check if JWT_SECRET is properly set in the test environment

3. **AWS service tests failing**:
   - Verify mock responses match expected formats
   - Check if AWS SDK version has changed requiring mock updates