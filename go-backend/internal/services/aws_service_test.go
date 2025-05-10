package services

import (
	"context"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// Define mock for AWS S3 client
type MockS3Client struct {
	mock.Mock
}

func (m *MockS3Client) ListBuckets(ctx context.Context, params *s3.ListBucketsInput, optFns ...func(*s3.Options)) (*s3.ListBucketsOutput, error) {
	args := m.Called(ctx, params)
	return args.Get(0).(*s3.ListBucketsOutput), args.Error(1)
}

func (m *MockS3Client) GetBucketLocation(ctx context.Context, params *s3.GetBucketLocationInput, optFns ...func(*s3.Options)) (*s3.GetBucketLocationOutput, error) {
	args := m.Called(ctx, params)
	return args.Get(0).(*s3.GetBucketLocationOutput), args.Error(1)
}

func (m *MockS3Client) GetBucketTagging(ctx context.Context, params *s3.GetBucketTaggingInput, optFns ...func(*s3.Options)) (*s3.GetBucketTaggingOutput, error) {
	args := m.Called(ctx, params)
	return args.Get(0).(*s3.GetBucketTaggingOutput), args.Error(1)
}

// TestListS3Buckets verifies S3 bucket listing functionality
func TestListS3Buckets(t *testing.T) {
	// Create mock S3 client
	mockS3 := new(MockS3Client)
	
	// Setup test data
	creationDate := time.Now().Add(-24 * time.Hour)
	bucketName1 := "test-bucket-1"
	bucketName2 := "test-bucket-2"
	
	// Configure mocks to return test data
	mockS3.On("ListBuckets", mock.Anything, mock.Anything).Return(&s3.ListBucketsOutput{
		Buckets: []types.Bucket{
			{
				Name:         aws.String(bucketName1),
				CreationDate: aws.Time(creationDate),
			},
			{
				Name:         aws.String(bucketName2),
				CreationDate: aws.Time(creationDate),
			},
		},
	}, nil)
	
	// Mock GetBucketLocation for both buckets
	mockS3.On("GetBucketLocation", mock.Anything, &s3.GetBucketLocationInput{
		Bucket: aws.String(bucketName1),
	}).Return(&s3.GetBucketLocationOutput{
		LocationConstraint: types.BucketLocationConstraintUsWest2,
	}, nil)
	
	mockS3.On("GetBucketLocation", mock.Anything, &s3.GetBucketLocationInput{
		Bucket: aws.String(bucketName2),
	}).Return(&s3.GetBucketLocationOutput{
		LocationConstraint: types.BucketLocationConstraintUsEast1,
	}, nil)
	
	// Mock GetBucketTagging for both buckets
	mockS3.On("GetBucketTagging", mock.Anything, &s3.GetBucketTaggingInput{
		Bucket: aws.String(bucketName1),
	}).Return(&s3.GetBucketTaggingOutput{
		TagSet: []types.Tag{
			{
				Key:   aws.String("Environment"),
				Value: aws.String("Production"),
			},
		},
	}, nil)
	
	mockS3.On("GetBucketTagging", mock.Anything, &s3.GetBucketTaggingInput{
		Bucket: aws.String(bucketName2),
	}).Return(&s3.GetBucketTaggingOutput{
		TagSet: []types.Tag{
			{
				Key:   aws.String("Environment"),
				Value: aws.String("Development"),
			},
		},
	}, nil)
	
	// Create service with mocked client
	// Note: In a real test, we'd inject this mock client into the AWSService
	// For this example, we'll assume the AWSService has been refactored to accept a client
	
	// Normally, you'd do something like:
	// awsService := NewAWSServiceWithClient(mockS3)
	
	// Verify the results
	// resources, err := awsService.ListS3Buckets()
	// assert.NoError(t, err)
	// assert.Len(t, resources, 2)
	
	// For demonstration, we'll just verify the mocks were called correctly
	// mockS3.AssertCalled(t, "ListBuckets", mock.Anything, mock.Anything)
	// mockS3.AssertCalled(t, "GetBucketLocation", mock.Anything, &s3.GetBucketLocationInput{
	// 	Bucket: aws.String(bucketName1),
	// })
	
	// This test is incomplete without proper dependency injection
	// It serves as a template for when the service is ready for testing
	t.Skip("Skipping until AWSService is refactored to accept a client for testing")
}

// TestCalculateResourceCost verifies cost calculation logic
func TestCalculateResourceCost(t *testing.T) {
	// Create test resources
	resource1 := &models.Resource{
		ID:   "test-bucket-1",
		Name: "test-bucket-1",
		Type: "S3",
		Cost: 0, // Initial cost is 0
	}
	
	resource2 := &models.Resource{
		ID:   "test-instance-1",
		Name: "test-instance-1",
		Type: "EC2",
		Cost: 0, // Initial cost is 0
	}
	
	// Create service
	awsService := &AWSService{}
	
	// Calculate costs
	err1 := awsService.CalculateResourceCost(resource1)
	err2 := awsService.CalculateResourceCost(resource2)
	
	// Verify results
	assert.NoError(t, err1)
	assert.NoError(t, err2)
	
	// S3 buckets should have a cost based on our formula
	baseMonthly := 80.0
	sizeFactor := float64(len(resource1.Name)) * 0.8
	expectedCost := baseMonthly + sizeFactor
	
	assert.Equal(t, expectedCost, resource1.Cost)
	
	// Non-S3 resources should still have 0 cost
	assert.Equal(t, 0.0, resource2.Cost)
}