package config

import (
	"os"
	"strconv"
)

type Config struct {
	Environment      string
	ServerPort       int
	DatabaseURL      string
	JWTSecret        string
	
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

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {
	port, _ := strconv.Atoi(getEnvWithDefault("SERVER_PORT", "8080"))

	return &Config{
		Environment:        getEnvWithDefault("ENVIRONMENT", "development"),
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

// getEnvWithDefault gets environment variable or returns default value if not set
func getEnvWithDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}