package models

import "time"

// User represents a user in the system
type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Password  string    `json:"-"` // Don't expose password in JSON responses
	FullName  string    `json:"fullName"`
	CreatedAt time.Time `json:"createdAt"`
}