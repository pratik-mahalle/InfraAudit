package models

import "time"

// Resource represents a cloud resource
type Resource struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Type        string            `json:"type"`
	Provider    string            `json:"provider"`
	Region      string            `json:"region"`
	Status      string            `json:"status"`
	Cost        float64           `json:"cost"`
	Utilization float64           `json:"utilization"`
	CreatedAt   time.Time         `json:"createdAt"`
	LastUsed    *time.Time        `json:"lastUsed,omitempty"`
	Tags        map[string]string `json:"tags"`
	Metadata    map[string]any    `json:"metadata,omitempty"`
}

// CloudResource represents a resource from a cloud provider
type CloudResource struct {
	ID            string            `json:"id"`
	Name          string            `json:"name"`
	Type          string            `json:"type"`
	Region        string            `json:"region"`
	Provider      CloudProvider     `json:"provider"`
	Status        string            `json:"status"`
	Tags          map[string]string `json:"tags,omitempty"`
	CreatedAt     string            `json:"createdAt"`
	LastUsed      string            `json:"lastUsed,omitempty"`
	Cost          float64           `json:"cost"`
	CostPerMonth  float64           `json:"costPerMonth,omitempty"`
	Utilization   float64           `json:"utilization,omitempty"`
	Metadata      map[string]any    `json:"metadata,omitempty"`
}

// SecurityDrift represents a security configuration drift
type SecurityDrift struct {
	ID               int       `json:"id"`
	ResourceID       string    `json:"resourceId"`
	DriftType        string    `json:"driftType"`
	Description      string    `json:"description"`
	Severity         string    `json:"severity"`  // low, medium, high, critical
	Status           string    `json:"status"`    // open, investigating, resolved, dismissed
	DetectedAt       time.Time `json:"detectedAt"`
	RemediationSteps string    `json:"remediationSteps"`
	ResourceType     string    `json:"resourceType"`
	CreatedAt        time.Time `json:"createdAt"`
}

// CostAnomaly represents a cost anomaly
type CostAnomaly struct {
	ID               int       `json:"id"`
	ResourceID       string    `json:"resourceId"`
	AnomalyType      string    `json:"anomalyType"`
	Description      string    `json:"description"`
	Severity         string    `json:"severity"`  // low, medium, high, critical
	Status           string    `json:"status"`    // open, investigating, resolved, dismissed
	DetectedAt       time.Time `json:"detectedAt"`
	Amount           float64   `json:"amount"`
	BaselineAmount   float64   `json:"baselineAmount"`
	PercentageChange float64   `json:"percentageChange"`
	CreatedAt        time.Time `json:"createdAt"`
}

// Alert represents a system alert
type Alert struct {
	ID         int       `json:"id"`
	Title      string    `json:"title"`
	Message    string    `json:"message"`
	Type       string    `json:"type"`      // resource, security, cost
	Severity   string    `json:"severity"`  // low, medium, high, critical
	Status     string    `json:"status"`    // open, acknowledged, resolved, dismissed
	ResourceID string    `json:"resourceId"`
	CreatedAt  time.Time `json:"createdAt"`
}

// Recommendation represents a cost optimization recommendation
type Recommendation struct {
	ID                int       `json:"id"`
	Title             string    `json:"title"`
	Description       string    `json:"description"`
	Type              string    `json:"type"`
	PotentialSavings  float64   `json:"potentialSavings"`
	ResourcesAffected []string  `json:"resourcesAffected"`
	CreatedAt         time.Time `json:"createdAt"`
	Status            string    `json:"status"` // open, in_progress, implemented, dismissed
}