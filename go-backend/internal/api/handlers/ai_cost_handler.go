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

// AICostHandler handles AI-powered cost analysis requests
type AICostHandler struct {
	DB     *db.Database
	Config *config.Config
}

// NewAICostHandler creates a new AI cost handler
func NewAICostHandler(db *db.Database, cfg *config.Config) *AICostHandler {
	return &AICostHandler{
		DB:     db,
		Config: cfg,
	}
}

// PredictCosts predicts future costs based on historical data
func (h *AICostHandler) PredictCosts(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value(middleware.UserContextKey).(*models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	// Parse query parameters
	monthsStr := r.URL.Query().Get("months")
	months := 3 // Default to 3 months
	if monthsStr != "" {
		parsedMonths, err := strconv.Atoi(monthsStr)
		if err == nil && parsedMonths > 0 && parsedMonths <= 12 {
			months = parsedMonths
		}
	}

	// Parse resource ID if provided
	resourceID := r.URL.Query().Get("resourceId")

	// Get resources from database or cloud providers
	var resources []models.Resource
	var err error

	if resourceID != "" {
		// Get specific resource
		var resource models.Resource
		err = h.DB.Pool.QueryRow(r.Context(),
			`SELECT id, name, type, provider, region, status, cost, utilization, created_at 
             FROM resources WHERE id = $1`,
			resourceID,
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

		resources = []models.Resource{resource}
	} else {
		// Get all resources
		rows, err := h.DB.Pool.Query(r.Context(),
			`SELECT id, name, type, provider, region, status, cost, utilization, created_at 
             FROM resources`)
		if err != nil {
			http.Error(w, "Failed to get resources", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		resources = []models.Resource{}
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

			resources = append(resources, resource)
		}
	}

	// If no resources found, try to fetch from cloud providers
	if len(resources) == 0 {
		// Get AWS credentials
		var accessKey, secretKey, region string
		err := h.DB.Pool.QueryRow(r.Context(),
			`SELECT 
               (credentials->>'accessKeyId') as access_key,
               (credentials->>'secretAccessKey') as secret_key,
               COALESCE(credentials->>'region', 'us-east-1') as region
             FROM cloud_credentials 
             WHERE user_id = $1 AND provider = 'AWS'`,
			user.ID,
		).Scan(&accessKey, &secretKey, &region)

		if err == nil {
			// Create AWS service
			awsService, err := services.NewAWSService(accessKey, secretKey, region)
			if err == nil {
				// Get AWS resources
				awsResources, err := awsService.GetAllResources()
				if err == nil {
					resources = awsResources
				}
			}
		}
	}

	// If still no resources, return error
	if len(resources) == 0 {
		http.Error(w, "No resources found", http.StatusNotFound)
		return
	}

	// Create OpenAI service
	openAIService := services.NewOpenAIService(h.Config.OpenAIAPIKey)

	// Get cost prediction
	prediction, err := openAIService.PredictFutureCosts(resources, months)
	if err != nil {
		http.Error(w, "Failed to predict costs: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(prediction)
}

// GenerateOptimizations generates cost optimization recommendations
func (h *AICostHandler) GenerateOptimizations(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value(middleware.UserContextKey).(*models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	// Parse resource ID if provided
	resourceID := r.URL.Query().Get("resourceId")

	// Get resources from database or cloud providers
	var resources []models.Resource
	var err error

	if resourceID != "" {
		// Get specific resource
		var resource models.Resource
		err = h.DB.Pool.QueryRow(r.Context(),
			`SELECT id, name, type, provider, region, status, cost, utilization, created_at 
             FROM resources WHERE id = $1`,
			resourceID,
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

		resources = []models.Resource{resource}
	} else {
		// Get all resources
		rows, err := h.DB.Pool.Query(r.Context(),
			`SELECT id, name, type, provider, region, status, cost, utilization, created_at 
             FROM resources`)
		if err != nil {
			http.Error(w, "Failed to get resources", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		resources = []models.Resource{}
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

			resources = append(resources, resource)
		}
	}

	// If no resources found, try to fetch from cloud providers
	if len(resources) == 0 {
		// Get AWS credentials
		var accessKey, secretKey, region string
		err := h.DB.Pool.QueryRow(r.Context(),
			`SELECT 
               (credentials->>'accessKeyId') as access_key,
               (credentials->>'secretAccessKey') as secret_key,
               COALESCE(credentials->>'region', 'us-east-1') as region
             FROM cloud_credentials 
             WHERE user_id = $1 AND provider = 'AWS'`,
			user.ID,
		).Scan(&accessKey, &secretKey, &region)

		if err == nil {
			// Create AWS service
			awsService, err := services.NewAWSService(accessKey, secretKey, region)
			if err == nil {
				// Get AWS resources
				awsResources, err := awsService.GetAllResources()
				if err == nil {
					resources = awsResources
				}
			}
		}
	}

	// If still no resources, return error
	if len(resources) == 0 {
		http.Error(w, "No resources found", http.StatusNotFound)
		return
	}

	// Create OpenAI service
	openAIService := services.NewOpenAIService(h.Config.OpenAIAPIKey)

	// Get optimization recommendations
	optimizations, err := openAIService.GenerateOptimizationRecommendations(resources)
	if err != nil {
		http.Error(w, "Failed to generate optimizations: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(optimizations)
}

// AnalyzeAnomaly analyzes a cost anomaly and provides insights
func (h *AICostHandler) AnalyzeAnomaly(w http.ResponseWriter, r *http.Request) {
	// Get anomaly ID from URL
	anomalyID := chi.URLParam(r, "id")
	if anomalyID == "" {
		http.Error(w, "Anomaly ID is required", http.StatusBadRequest)
		return
	}

	// Parse anomaly ID
	id, err := strconv.Atoi(anomalyID)
	if err != nil {
		http.Error(w, "Invalid anomaly ID", http.StatusBadRequest)
		return
	}

	// Get anomaly from database
	var anomaly models.CostAnomaly
	err = h.DB.Pool.QueryRow(r.Context(),
		`SELECT id, resource_id, anomaly_type, description, severity, status, detected_at, amount, baseline_amount, percentage_change, created_at 
         FROM cost_anomalies WHERE id = $1`,
		id,
	).Scan(
		&anomaly.ID,
		&anomaly.ResourceID,
		&anomaly.AnomalyType,
		&anomaly.Description,
		&anomaly.Severity,
		&anomaly.Status,
		&anomaly.DetectedAt,
		&anomaly.Amount,
		&anomaly.BaselineAmount,
		&anomaly.PercentageChange,
		&anomaly.CreatedAt,
	)

	if err != nil {
		http.Error(w, "Anomaly not found", http.StatusNotFound)
		return
	}

	// Get resource from database
	var resource models.Resource
	err = h.DB.Pool.QueryRow(r.Context(),
		`SELECT id, name, type, provider, region, status, cost, utilization, created_at 
         FROM resources WHERE id = $1`,
		anomaly.ResourceID,
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

	// Create OpenAI service
	openAIService := services.NewOpenAIService(h.Config.OpenAIAPIKey)

	// Analyze the anomaly
	analysis, err := openAIService.AnalyzeCostAnomaly(anomaly, resource)
	if err != nil {
		http.Error(w, "Failed to analyze anomaly: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(analysis)
}