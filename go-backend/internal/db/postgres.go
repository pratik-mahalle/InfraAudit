package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/cloudguard/api/internal/config"
	"github.com/jackc/pgx/v4/pgxpool"
)

// Database represents a connection to the PostgreSQL database
type Database struct {
	Pool *pgxpool.Pool
}

// NewDatabase creates a new database connection
func NewDatabase(cfg *config.Config) (*Database, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("database URL is not configured")
	}

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

// Close closes the database connection
func (db *Database) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}

// IsConnected checks if the database connection is still valid
func (db *Database) IsConnected() bool {
	if db.Pool == nil {
		return false
	}

	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	return db.Pool.Ping(ctx) == nil
}