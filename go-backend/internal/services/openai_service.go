package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/cloudguard/api/internal/models"
	"github.com/sashabaranov/go-openai"
)

// OpenAIService provides AI-powered analysis and recommendations
type OpenAIService struct {
	client *openai.Client
}

// NewOpenAIService creates a new OpenAI service
func NewOpenAIService(apiKey string) *OpenAIService {
	if apiKey == "" {
		log.Println("Warning: OpenAI API key is not set")
		return &OpenAIService{client: nil}
	}

	client := openai.NewClient(apiKey)
	return &OpenAIService{
		client: client,
	}
}

// IsConfigured checks if the OpenAI service is properly configured
func (s *OpenAIService) IsConfigured() bool {
	return s.client != nil
}

// PredictFutureCosts predicts future costs based on historical data
func (s *OpenAIService) PredictFutureCosts(resources []models.Resource, months int) (map[string]interface{}, error) {
	if !s.IsConfigured() {
		return simulatePrediction(resources, months), nil
	}

	// Prepare the resources for the prompt
	resourcesJSON, err := json.Marshal(resources)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal resources: %w", err)
	}

	// Create the prompt
	prompt := fmt.Sprintf(`
You are an AI assistant specialized in cloud cost prediction. I will provide you with a list of AWS resources,
and I need you to predict their costs for the next %d months. Please analyze the data and provide your predictions.

Resources:
%s

Based on this data, predict the costs for each resource for the next %d months. Consider factors like resource type,
current cost, and utilization. Return your predictions as a JSON object with the following structure:
{
  "totalPredictedCost": 123.45,
  "monthlyPredictions": [
    { "month": "Nov 2025", "cost": 100.00 },
    { "month": "Dec 2025", "cost": 105.00 }
    ...
  ],
  "resourcePredictions": [
    {
      "resourceId": "resource-id",
      "resourceName": "resource-name",
      "currentCost": 10.00,
      "predictedCost": 12.00,
      "percentageChange": 20.0
    },
    ...
  ],
  "riskFactors": ["High usage growth", "Seasonal patterns", ...]
}
`, months, string(resourcesJSON), months)

	// Create the completion request
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	resp, err := s.client.CreateChatCompletion(
		ctx,
		openai.ChatCompletionRequest{
			Model: "gpt-4o", // Use the latest model version
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
			Temperature:      0.2,
			ResponseFormat:  &openai.ChatCompletionResponseFormat{
				Type: openai.ChatCompletionResponseFormatTypeJSONObject,
			},
		},
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get OpenAI completion: %w", err)
	}

	// Parse the response
	var result map[string]interface{}
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &result); err != nil {
		return nil, fmt.Errorf("failed to parse OpenAI response: %w", err)
	}

	return result, nil
}

// GenerateOptimizationRecommendations generates cost optimization recommendations
func (s *OpenAIService) GenerateOptimizationRecommendations(resources []models.Resource) (map[string]interface{}, error) {
	if !s.IsConfigured() {
		return simulateOptimizations(resources), nil
	}

	// Prepare the resources for the prompt
	resourcesJSON, err := json.Marshal(resources)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal resources: %w", err)
	}

	// Create the prompt
	prompt := fmt.Sprintf(`
You are an AI assistant specialized in cloud cost optimization. I will provide you with a list of AWS resources,
and I need you to generate cost optimization recommendations. Please analyze the data and provide your recommendations.

Resources:
%s

Based on this data, generate cost optimization recommendations. Consider factors like resource type, current cost,
utilization, and idle resources. Return your recommendations as a JSON object with the following structure:
{
  "totalPotentialSavings": 123.45,
  "recommendations": [
    {
      "id": 1,
      "title": "Recommendation title",
      "description": "Detailed description of the recommendation",
      "type": "resource_right_sizing",
      "potentialSavings": 45.67,
      "resourcesAffected": ["resource-id-1", "resource-id-2"],
      "difficulty": "medium",
      "impact": "high"
    },
    ...
  ]
}
`, string(resourcesJSON))

	// Create the completion request
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	resp, err := s.client.CreateChatCompletion(
		ctx,
		openai.ChatCompletionRequest{
			Model: "gpt-4o", // Use the latest model version
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
			Temperature:     0.2,
			ResponseFormat: &openai.ChatCompletionResponseFormat{
				Type: openai.ChatCompletionResponseFormatTypeJSONObject,
			},
		},
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get OpenAI completion: %w", err)
	}

	// Parse the response
	var result map[string]interface{}
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &result); err != nil {
		return nil, fmt.Errorf("failed to parse OpenAI response: %w", err)
	}

	return result, nil
}

// AnalyzeCostAnomaly analyzes a cost anomaly and provides insights
func (s *OpenAIService) AnalyzeCostAnomaly(anomaly models.CostAnomaly, resource models.Resource) (map[string]interface{}, error) {
	if !s.IsConfigured() {
		return simulateAnomalyAnalysis(anomaly, resource), nil
	}

	// Prepare the data for the prompt
	anomalyJSON, err := json.Marshal(anomaly)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal anomaly: %w", err)
	}

	resourceJSON, err := json.Marshal(resource)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal resource: %w", err)
	}

	// Create the prompt
	prompt := fmt.Sprintf(`
You are an AI assistant specialized in cloud cost analysis. I will provide you with details of a cost anomaly
and the affected resource. Please analyze the data and provide insights into the anomaly.

Cost Anomaly:
%s

Affected Resource:
%s

Based on this data, analyze the cost anomaly and provide insights. Consider factors like resource type, anomaly type,
severity, and percentage change. Return your analysis as a JSON object with the following structure:
{
  "summary": "Brief summary of the anomaly",
  "potentialCauses": [
    "Potential cause 1",
    "Potential cause 2",
    ...
  ],
  "recommendedActions": [
    "Recommended action 1",
    "Recommended action 2",
    ...
  ],
  "riskLevel": "high",
  "estimatedImpact": "Cost increase of $X if not addressed"
}
`, string(anomalyJSON), string(resourceJSON))

	// Create the completion request
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	resp, err := s.client.CreateChatCompletion(
		ctx,
		openai.ChatCompletionRequest{
			Model: "gpt-4o", // Use the latest model version
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
			Temperature:     0.2,
			ResponseFormat: &openai.ChatCompletionResponseFormat{
				Type: openai.ChatCompletionResponseFormatTypeJSONObject,
			},
		},
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get OpenAI completion: %w", err)
	}

	// Parse the response
	var result map[string]interface{}
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &result); err != nil {
		return nil, fmt.Errorf("failed to parse OpenAI response: %w", err)
	}

	return result, nil
}

// simulatePrediction simulates cost prediction when OpenAI is not configured
func simulatePrediction(resources []models.Resource, months int) map[string]interface{} {
	// Get current month and calculate future months
	currentMonth := time.Now().Month()
	currentYear := time.Now().Year()
	
	monthNames := []string{
		"Jan", "Feb", "Mar", "Apr", "May", "Jun",
		"Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
	}
	
	// Calculate total current cost
	totalCost := 0.0
	for _, r := range resources {
		totalCost += r.Cost
	}
	
	// Generate monthly predictions
	monthlyPredictions := make([]map[string]interface{}, months)
	for i := 0; i < months; i++ {
		month := int(currentMonth) + i
		year := currentYear
		
		// Handle year overflow
		if month > 12 {
			month = month - 12
			year++
		}
		
		// Calculate predicted cost with a small increase each month
		predictedCost := totalCost * (1 + float64(i+1)*0.02)
		
		monthlyPredictions[i] = map[string]interface{}{
			"month": fmt.Sprintf("%s %d", monthNames[month-1], year),
			"cost":  fmt.Sprintf("%.2f", predictedCost),
		}
	}
	
	// Generate resource predictions
	resourcePredictions := make([]map[string]interface{}, len(resources))
	for i, r := range resources {
		// Calculate predicted cost with a random variation
		percentageChange := 2.0 + float64(i%5)
		predictedCost := r.Cost * (1 + percentageChange/100)
		
		resourcePredictions[i] = map[string]interface{}{
			"resourceId":       r.ID,
			"resourceName":     r.Name,
			"currentCost":      r.Cost,
			"predictedCost":    predictedCost,
			"percentageChange": percentageChange,
		}
	}
	
	// Generate risk factors
	riskFactors := []string{
		"Normal usage growth",
		"Possible seasonal patterns",
		"Consistent utilization trends",
	}
	
	// Create the result
	result := map[string]interface{}{
		"totalPredictedCost": totalCost * (1 + float64(months)*0.02),
		"monthlyPredictions": monthlyPredictions,
		"resourcePredictions": resourcePredictions,
		"riskFactors":        riskFactors,
		"note":               "This is a simulated prediction as OpenAI is not configured",
	}
	
	return result
}

// simulateOptimizations simulates optimization recommendations when OpenAI is not configured
func simulateOptimizations(resources []models.Resource) map[string]interface{} {
	// Calculate total potential savings
	totalSavings := 0.0
	for _, r := range resources {
		// Assume 15% potential savings
		totalSavings += r.Cost * 0.15
	}
	
	// Generate recommendations
	recommendations := []map[string]interface{}{
		{
			"id":                1,
			"title":             "Right-size over-provisioned resources",
			"description":       "Resources consistently using <20% of CPU and memory could be downsized.",
			"type":              "resource_right_sizing",
			"potentialSavings":  totalSavings * 0.4,
			"resourcesAffected": []string{resources[0].ID},
			"difficulty":        "medium",
			"impact":            "high",
		},
	}
	
	// Add more recommendations if we have enough resources
	if len(resources) > 1 {
		recommendations = append(recommendations, map[string]interface{}{
			"id":                2,
			"title":             "Optimize storage classes",
			"description":       "Move infrequently accessed data to cheaper storage tiers.",
			"type":              "storage_optimization",
			"potentialSavings":  totalSavings * 0.3,
			"resourcesAffected": []string{resources[1].ID},
			"difficulty":        "low",
			"impact":            "medium",
		})
	}
	
	if len(resources) > 2 {
		recommendations = append(recommendations, map[string]interface{}{
			"id":                3,
			"title":             "Implement auto-scaling",
			"description":       "Use auto-scaling to match resource capacity with demand.",
			"type":              "auto_scaling",
			"potentialSavings":  totalSavings * 0.3,
			"resourcesAffected": []string{resources[2].ID},
			"difficulty":        "high",
			"impact":            "high",
		})
	}
	
	// Create the result
	result := map[string]interface{}{
		"totalPotentialSavings": totalSavings,
		"recommendations":       recommendations,
		"note":                  "This is a simulated recommendation as OpenAI is not configured",
	}
	
	return result
}

// simulateAnomalyAnalysis simulates anomaly analysis when OpenAI is not configured
func simulateAnomalyAnalysis(anomaly models.CostAnomaly, resource models.Resource) map[string]interface{} {
	// Create a simulated analysis
	potentialCauses := []string{
		"Increased usage due to higher traffic",
		"Price changes for the resource type",
		"Resource configuration changes",
	}
	
	recommendedActions := []string{
		"Review recent usage patterns",
		"Check for recent configuration changes",
		"Implement cost alerts for this resource",
	}
	
	// Create the result
	result := map[string]interface{}{
		"summary":           fmt.Sprintf("Cost increase of %.2f%% detected for %s", anomaly.PercentageChange, resource.Name),
		"potentialCauses":   potentialCauses,
		"recommendedActions": recommendedActions,
		"riskLevel":         anomaly.Severity,
		"estimatedImpact":   fmt.Sprintf("Cost increase of $%.2f if not addressed", anomaly.Amount - anomaly.BaselineAmount),
		"note":              "This is a simulated analysis as OpenAI is not configured",
	}
	
	return result
}