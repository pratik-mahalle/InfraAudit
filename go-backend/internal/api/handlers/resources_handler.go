package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/cloudguard/api/internal/api/middleware"
	"github.com/cloudguard/api/internal/config"
	"github.com/cloudguard/api/internal/db"
	"github.com/cloudguard/api/internal/models"
	"github.com/cloudguard/api/internal/services"
	"github.com/go-chi/chi/v5"
)

// ResourcesHandler handles resource-related requests
type ResourcesHandler struct {
	DB     *db.Database
	Config *config.Config
}

// NewResourcesHandler creates a new resources handler
func NewResourcesHandler(db *db.Database, cfg *config.Config) *ResourcesHandler {
	return &ResourcesHandler{
		DB:     db,
		Config: cfg,
	}
}

// GetResources gets all resources
func (h *ResourcesHandler) GetResources(w http.ResponseWriter, r *http.Request) {
	// Get resources from database
	rows, err := h.DB.Pool.Query(r.Context(),
		`SELECT id, name, type, provider, region, status, cost, utilization, created_at 
         FROM resources`)
	if err != nil {
		log.Printf("Failed to get resources: %v", err)
		http.Error(w, "Failed to get resources", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	resources := []models.Resource{}
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
			log.Printf("Failed to scan resource: %v", err)
			http.Error(w, "Failed to scan resource", http.StatusInternalServerError)
			return
		}
		
		// Get tags for resource
		tagRows, err := h.DB.Pool.Query(r.Context(),
			`SELECT key, value FROM resource_tags WHERE resource_id = $1`,
			resource.ID)
		if err != nil {
			log.Printf("Failed to get resource tags: %v", err)
			http.Error(w, "Failed to get resource tags", http.StatusInternalServerError)
			return
		}
		
		resource.Tags = make(map[string]string)
		for tagRows.Next() {
			var key, value string
			if err := tagRows.Scan(&key, &value); err != nil {
				tagRows.Close()
				log.Printf("Failed to scan tag: %v", err)
				http.Error(w, "Failed to scan tag", http.StatusInternalServerError)
				return
			}
			resource.Tags[key] = value
		}
		tagRows.Close()
		
		resources = append(resources, resource)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resources)
}

// GetResourceById gets a resource by ID
func (h *ResourcesHandler) GetResourceById(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "Resource ID is required", http.StatusBadRequest)
		return
	}

	var resource models.Resource
	err := h.DB.Pool.QueryRow(r.Context(),
		`SELECT id, name, type, provider, region, status, cost, utilization, created_at 
         FROM resources WHERE id = $1`,
		id,
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
		log.Printf("Resource not found: %v", err)
		http.Error(w, "Resource not found", http.StatusNotFound)
		return
	}
	
	// Get tags for resource
	tagRows, err := h.DB.Pool.Query(r.Context(),
		`SELECT key, value FROM resource_tags WHERE resource_id = $1`,
		resource.ID)
	if err != nil {
		log.Printf("Failed to get resource tags: %v", err)
		http.Error(w, "Failed to get resource tags", http.StatusInternalServerError)
		return
	}
	
	resource.Tags = make(map[string]string)
	for tagRows.Next() {
		var key, value string
		if err := tagRows.Scan(&key, &value); err != nil {
			tagRows.Close()
			log.Printf("Failed to scan tag: %v", err)
			http.Error(w, "Failed to scan tag", http.StatusInternalServerError)
			return
		}
		resource.Tags[key] = value
	}
	tagRows.Close()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resource)
}

// GetResourcesByProvider gets resources by provider
func (h *ResourcesHandler) GetResourcesByProvider(w http.ResponseWriter, r *http.Request) {
	provider := chi.URLParam(r, "provider")
	if provider == "" {
		http.Error(w, "Provider is required", http.StatusBadRequest)
		return
	}

	// Get resources from database
	rows, err := h.DB.Pool.Query(r.Context(),
		`SELECT id, name, type, provider, region, status, cost, utilization, created_at 
         FROM resources WHERE provider = $1`,
		provider)
	if err != nil {
		log.Printf("Failed to get resources by provider: %v", err)
		http.Error(w, "Failed to get resources", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	resources := []models.Resource{}
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
			log.Printf("Failed to scan resource: %v", err)
			http.Error(w, "Failed to scan resource", http.StatusInternalServerError)
			return
		}
		
		// Get tags for resource
		tagRows, err := h.DB.Pool.Query(r.Context(),
			`SELECT key, value FROM resource_tags WHERE resource_id = $1`,
			resource.ID)
		if err != nil {
			log.Printf("Failed to get resource tags: %v", err)
			http.Error(w, "Failed to get resource tags", http.StatusInternalServerError)
			return
		}
		
		resource.Tags = make(map[string]string)
		for tagRows.Next() {
			var key, value string
			if err := tagRows.Scan(&key, &value); err != nil {
				tagRows.Close()
				log.Printf("Failed to scan tag: %v", err)
				http.Error(w, "Failed to scan tag", http.StatusInternalServerError)
				return
			}
			resource.Tags[key] = value
		}
		tagRows.Close()
		
		resources = append(resources, resource)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resources)
}

// GetAWSResources gets resources from AWS
func (h *ResourcesHandler) GetAWSResources(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user, ok := r.Context().Value(middleware.UserContextKey).(*models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	// Get AWS credentials from database
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

	if err != nil {
		log.Printf("AWS credentials not found: %v", err)
		http.Error(w, "AWS credentials not found", http.StatusNotFound)
		return
	}

	// Create AWS service
	awsService, err := services.NewAWSService(accessKey, secretKey, region)
	if err != nil {
		log.Printf("Failed to create AWS service: %v", err)
		http.Error(w, "Failed to create AWS service", http.StatusInternalServerError)
		return
	}

	// Log that we're fetching AWS resources
	log.Println("Fetching AWS resources...")

	// Get AWS resources
	resources, err := awsService.GetAllResources()
	if err != nil {
		log.Printf("Failed to get AWS resources: %v", err)
		http.Error(w, "Failed to get AWS resources: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Calculate costs for resources
	for i := range resources {
		if err := awsService.CalculateResourceCost(&resources[i]); err != nil {
			log.Printf("Failed to calculate cost for resource %s: %v", resources[i].ID, err)
			// Continue anyway, don't fail the whole request
		}
	}

	log.Printf("Fetched %d AWS resources", len(resources))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resources)
}