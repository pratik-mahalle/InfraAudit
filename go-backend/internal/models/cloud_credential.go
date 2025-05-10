package models

import "time"

// CloudProvider enum for supported cloud providers
type CloudProvider string

const (
	AWS   CloudProvider = "AWS"
	GCP   CloudProvider = "GCP"
	Azure CloudProvider = "AZURE"
)

// CloudCredential represents cloud provider credentials
type CloudCredential struct {
	ID          int           `json:"id"`
	UserID      int           `json:"userId"`
	Provider    CloudProvider `json:"provider"`
	Credentials string        `json:"-"` // Encrypted credentials, don't expose
	CreatedAt   time.Time     `json:"createdAt"`
}

// AWSCredentials represents AWS specific credentials
type AWSCredentials struct {
	Provider       CloudProvider `json:"provider"`
	AccessKeyID    string        `json:"accessKeyId"`
	SecretAccessKey string        `json:"secretAccessKey"`
	Region         string        `json:"region,omitempty"`
}

// GCPCredentials represents GCP specific credentials
type GCPCredentials struct {
	Provider         CloudProvider `json:"provider"`
	ServiceAccountKey string        `json:"serviceAccountKey"`
	ProjectID        string        `json:"projectId,omitempty"`
}

// AzureCredentials represents Azure specific credentials
type AzureCredentials struct {
	Provider       CloudProvider `json:"provider"`
	ClientID       string        `json:"clientId"`
	ClientSecret   string        `json:"clientSecret"`
	TenantID       string        `json:"tenantId"`
	SubscriptionID string        `json:"subscriptionId"`
}