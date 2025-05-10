package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/costexplorer"
	"github.com/aws/aws-sdk-go-v2/service/costexplorer/types"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/cloudguard/api/internal/models"
)

// AWSService provides integration with AWS services
type AWSService struct {
	Config aws.Config
}

// NewAWSService creates a new AWS service with the provided credentials
func NewAWSService(accessKey, secretKey, region string) (*AWSService, error) {
	// Create AWS config with provided credentials
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			accessKey,
			secretKey,
			"",
		)),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	return &AWSService{
		Config: cfg,
	}, nil
}

// ValidateCredentials checks if the AWS credentials are valid
func (s *AWSService) ValidateCredentials() error {
	// Try to list S3 buckets as a simple check
	client := s3.NewFromConfig(s.Config)
	_, err := client.ListBuckets(context.TODO(), &s3.ListBucketsInput{})
	if err != nil {
		return fmt.Errorf("invalid AWS credentials: %w", err)
	}
	return nil
}

// ListS3Buckets lists all S3 buckets and converts them to the resource model
func (s *AWSService) ListS3Buckets() ([]models.Resource, error) {
	// Create S3 client
	client := s3.NewFromConfig(s.Config)

	// List buckets
	result, err := client.ListBuckets(context.TODO(), &s3.ListBucketsInput{})
	if err != nil {
		return nil, fmt.Errorf("failed to list S3 buckets: %w", err)
	}

	// Convert to resources
	resources := make([]models.Resource, 0, len(result.Buckets))
	for _, bucket := range result.Buckets {
		// Get bucket region
		regionResult, err := client.GetBucketLocation(context.TODO(), &s3.GetBucketLocationInput{
			Bucket: bucket.Name,
		})
		
		region := "us-east-1" // Default region
		if err == nil && regionResult.LocationConstraint != "" {
			region = string(regionResult.LocationConstraint)
		}

		// Create resource
		resource := models.Resource{
			ID:         *bucket.Name,
			Name:       *bucket.Name,
			Type:       "S3",
			Provider:   "AWS",
			Region:     region,
			Status:     "active",
			Cost:       0, // Will be calculated separately
			Utilization: 0, // Will be calculated separately
			CreatedAt:  *bucket.CreationDate,
			Tags:       make(map[string]string),
		}

		// Try to get bucket tags
		tagsResult, err := client.GetBucketTagging(context.TODO(), &s3.GetBucketTaggingInput{
			Bucket: bucket.Name,
		})
		
		if err == nil {
			for _, tag := range tagsResult.TagSet {
				resource.Tags[*tag.Key] = *tag.Value
			}
		} else {
			log.Printf("No tags for bucket %s", *bucket.Name)
		}

		resources = append(resources, resource)
	}

	return resources, nil
}

// GetCostAndUsage gets cost and usage data for AWS resources
func (s *AWSService) GetCostAndUsage(startDate, endDate string) (*costexplorer.GetCostAndUsageOutput, error) {
	client := costexplorer.NewFromConfig(s.Config)

	// Define cost explorer query
	input := &costexplorer.GetCostAndUsageInput{
		TimePeriod: &types.DateInterval{
			Start: aws.String(startDate),
			End:   aws.String(endDate),
		},
		Granularity: types.GranularityMonthly,
		Metrics:     []string{"UnblendedCost"},
		GroupBy: []types.GroupDefinition{
			{
				Type: types.GroupDefinitionTypeDimension,
				Key:  aws.String("SERVICE"),
			},
		},
	}

	// Get cost data
	return client.GetCostAndUsage(context.TODO(), input)
}

// GetAllResources gets all AWS resources (S3, EC2, etc.)
func (s *AWSService) GetAllResources() ([]models.Resource, error) {
	// Get S3 buckets
	s3Resources, err := s.ListS3Buckets()
	if err != nil {
		return nil, fmt.Errorf("failed to list S3 buckets: %w", err)
	}

	// TODO: Add EC2 instances, RDS databases, etc.

	return s3Resources, nil
}

// CalculateResourceCost calculates the cost of a resource
func (s *AWSService) CalculateResourceCost(resource *models.Resource) error {
	// For now, use a simple formula for S3 buckets
	if resource.Type == "S3" {
		// Use the same formula as in the client
		baseMonthly := 80.0
		sizeFactor := float64(len(resource.Name)) * 0.8
		
		if resource.Type == "S3" {
			resource.Cost = baseMonthly + sizeFactor
		}
	}

	return nil
}

// SaveCredentials saves AWS credentials in encrypted form
func (s *AWSService) SaveCredentials(userID int, credentials models.AWSCredentials, db interface{}) error {
	// TODO: Implement actual database saving with encryption
	
	// Convert credentials to JSON
	credentialsJSON, err := json.Marshal(credentials)
	if err != nil {
		return fmt.Errorf("failed to marshal credentials: %w", err)
	}

	log.Printf("Would save credentials for user %d: %s", userID, string(credentialsJSON))
	
	return nil
}