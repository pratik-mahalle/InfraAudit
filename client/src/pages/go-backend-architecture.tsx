import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { 
  Code,
  Database,
  GitBranch,
  Server,
  Shield,
  Lock,
  Network,
  Cloud,
  Layers
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const GoBackendArchitecture = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Go Backend Architecture</h1>
          <p className="text-muted-foreground mt-1">
            Detailed documentation of the CloudGuard Go backend architecture
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                <CardTitle>Architecture Overview</CardTitle>
              </div>
              <CardDescription>
                The architecture of our Go-based backend
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                CloudGuard's backend is built entirely in Go, providing a high-performance, secure, and scalable 
                infrastructure for cloud resource monitoring and management. The backend follows a clean architecture
                pattern that separates concerns and enforces dependency rules.
              </p>
              
              <div className="grid grid-cols-1 gap-4 mt-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-full dark:bg-blue-950 mt-1">
                    <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Layered Architecture</h4>
                    <p className="text-sm text-muted-foreground">
                      Our backend follows a clean, layered architecture with clear separation of concerns:
                    </p>
                    <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
                      <li><strong>Presentation Layer:</strong> API endpoints, request/response handling, middleware</li>
                      <li><strong>Domain Layer:</strong> Business logic, service coordination, event handling</li>
                      <li><strong>Data Access Layer:</strong> Repository implementations, database operations</li>
                      <li><strong>Infrastructure Layer:</strong> Cloud provider APIs, external service integrations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-600" />
                <CardTitle>Service Structure</CardTitle>
              </div>
              <CardDescription>
                How services are organized within the Go backend
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p>
                  CloudGuard's Go backend is structured as a collection of microservices, each with a specific 
                  area of responsibility. These services communicate via both synchronous API calls and 
                  asynchronous message passing.
                </p>
                
                <h4 className="font-medium mt-4">Core Services</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li><strong>Authentication Service:</strong> Handles user authentication and authorization</li>
                  <li><strong>Resource Service:</strong> Manages cloud resource discovery and metadata</li>
                  <li><strong>Security Service:</strong> Detects security configuration drifts</li>
                  <li><strong>Cost Service:</strong> Analyzes cost data and generates optimization recommendations</li>
                  <li><strong>Alert Service:</strong> Manages alerting rules and notifications</li>
                  <li><strong>Provider Service:</strong> Handles cloud provider connections and API interactions</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                <CardTitle>Data Layer</CardTitle>
              </div>
              <CardDescription>
                Database access and data persistence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                CloudGuard's Go backend uses a robust data layer built on modern Go database access patterns.
              </p>
              
              <div className="space-y-3">
                <h4 className="font-medium">Database Technologies</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li><strong>PostgreSQL:</strong> Primary relational database for structured data</li>
                  <li><strong>Redis:</strong> Used for caching and distributed locks</li>
                  <li><strong>TimescaleDB:</strong> Time-series data for metrics and historical analysis</li>
                </ul>
                
                <h4 className="font-medium mt-3">Data Access Patterns</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li><strong>Repository Pattern:</strong> Abstracts data access behind interfaces</li>
                  <li><strong>CQRS:</strong> Separation of read and write operations for scalability</li>
                  <li><strong>SQL Builder:</strong> Type-safe SQL query building with sqlc</li>
                  <li><strong>Migrations:</strong> Version-controlled schema changes</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-600" />
                <CardTitle>Authentication & Security</CardTitle>
              </div>
              <CardDescription>
                Security architecture of the Go backend
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Security is built into every layer of our Go backend architecture, with special emphasis
                on authentication, authorization, and secure data handling.
              </p>
              
              <div className="space-y-3">
                <h4 className="font-medium">Authentication System</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li><strong>JWT-based:</strong> Industry-standard token-based authentication</li>
                  <li><strong>Role-based Access Control:</strong> Fine-grained permission system</li>
                  <li><strong>API Key Authentication:</strong> For service-to-service communication</li>
                  <li><strong>OAuth Integration:</strong> For single sign-on with identity providers</li>
                </ul>
                
                <h4 className="font-medium mt-3">Security Measures</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li><strong>Request Validation:</strong> Input validation at API boundaries</li>
                  <li><strong>Rate Limiting:</strong> Protection against brute-force attacks</li>
                  <li><strong>Audit Logging:</strong> Comprehensive tracking of security events</li>
                  <li><strong>Secure Credential Storage:</strong> Encryption for all sensitive data</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-blue-600" />
              <CardTitle>API Structure</CardTitle>
            </div>
            <CardDescription>
              How the REST and GraphQL APIs are organized
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium mb-2">RESTful API</h4>
                <p className="text-sm mb-3">
                  Our primary API follows RESTful principles with consistent patterns and conventions.
                </p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li><strong>Resource-based:</strong> URLs map to domain resources</li>
                  <li><strong>JSON Responses:</strong> Consistent response formats</li>
                  <li><strong>HTTP Status Codes:</strong> Proper use of status codes</li>
                  <li><strong>Pagination:</strong> Consistent pagination mechanism</li>
                  <li><strong>Filtering & Sorting:</strong> Flexible query parameters</li>
                  <li><strong>API Versioning:</strong> Clear versioning strategy</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">API Categories</h4>
                <p className="text-sm mb-3">
                  Our API endpoints are organized by functional domains:
                </p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li><strong>/api/auth:</strong> Authentication and user management</li>
                  <li><strong>/api/resources:</strong> Cloud resource management</li>
                  <li><strong>/api/security:</strong> Security analysis and drift detection</li>
                  <li><strong>/api/costs:</strong> Cost management and optimization</li>
                  <li><strong>/api/alerts:</strong> Alert configuration and delivery</li>
                  <li><strong>/api/providers:</strong> Cloud provider connection management</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-blue-600" />
              <CardTitle>Cloud Provider Integration</CardTitle>
            </div>
            <CardDescription>
              How we interface with AWS, Azure, and GCP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              CloudGuard's Go backend implements clean, consistent interfaces to multiple cloud providers,
              allowing for uniform handling of resources while respecting provider-specific details.
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium mb-2">Provider Architecture</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li><strong>Provider Interface:</strong> Common abstraction for all providers</li>
                  <li><strong>SDK Wrappers:</strong> Thin wrappers around official Go SDKs</li>
                  <li><strong>Adapter Pattern:</strong> Adapts provider-specific APIs to our domain model</li>
                  <li><strong>Resource Mapping:</strong> Normalizes different providers' resource models</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Supported Cloud Features</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  <li><strong>Resource Discovery:</strong> Finds and categorizes all cloud resources</li>
                  <li><strong>Security Posture:</strong> Evaluates security configuration against best practices</li>
                  <li><strong>Cost Analysis:</strong> Retrieves and analyzes cost and usage data</li>
                  <li><strong>Metrics Collection:</strong> Gathers performance and utilization metrics</li>
                  <li><strong>Change Tracking:</strong> Detects changes to infrastructure over time</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default GoBackendArchitecture;