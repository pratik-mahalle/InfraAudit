# CloudGuard Class Diagram

```
+---------------------------+             +---------------------------+
|        User               |             |      CloudCredential      |
+---------------------------+             +---------------------------+
| id: number                |             | id: number                |
| username: string          |             | userId: number            |
| password: string          |<-----------+| provider: CloudProvider   |
| fullName: string          |  1       * | credentials: string        |
| createdAt: Date           |             | createdAt: Date           |
+---------------------------+             +---------------------------+

+---------------------------+             +---------------------------+
|       Resource            |             |      SecurityDrift        |
+---------------------------+             +---------------------------+
| id: number                |             | id: number                |
| name: string              |<-----------+| resourceId: number        |
| type: string              |  1       * | description: string        |
| provider: string          |             | severity: string          |
| region: string            |             | status: string            |
| status: string            |             | detectedAt: Date          |
| cost: number              |             | remediationSteps: string  |
| utilization: number       |             | resourceType: string      |
| createdAt: Date           |             | createdAt: Date           |
| tags: Record<string,string>|            +---------------------------+
+---------------------------+
    ^                 ^
    |                 |
    |                 |
    |                 |
+---+---------------+ | +---------------------------+
|  CostAnomaly      | | |      Alert                |
+-------------------+ | +---------------------------+
| id: number        | | | id: number                |
| resourceId: number|<+ +>| resourceId: number        |
| anomalyType: string |   | title: string            |
| description: string |   | message: string          |
| severity: string    |   | type: string             |
| status: string      |   | severity: string         |
| detectedAt: Date    |   | status: string           |
| amount: number      |   | createdAt: Date          |
| baselineAmount: number|  +---------------------------+
| percentageChange: number|
| createdAt: Date      |   +---------------------------+
+---------------------+    |      Recommendation       |
                           +---------------------------+
                           | id: number                |
                           | title: string             |
                           | description: string       |
                           | type: string              |
                           | potentialSavings: number  |
                           | resourcesAffected: number[]|
                           | createdAt: Date           |
                           | status: string            |
                           +---------------------------+

+-------------------------------+       +-------------------------------+
|  IStorage (Interface)         |       |     DatabaseStorage           |
+-------------------------------+       +-------------------------------+
| sessionStore: SessionStore    |<------| sessionStore: PostgresStore   |
|                               |       |                               |
| + getUser()                   |       | + getUser()                   |
| + getUserByUsername()         |       | + getUserByUsername()         |
| + createUser()                |       | + createUser()                |
| + getResources()              |       | + getResources()              |
| + getResourceById()           |       | + getResourceById()           |
| + getResourcesByProvider()    |       | + getResourcesByProvider()    |
| + getResourcesByType()        |       | + getResourcesByType()        |
| + createResource()            |       | + createResource()            |
| + updateResource()            |       | + updateResource()            |
| + getSecurityDrifts()         |       | + getSecurityDrifts()         |
| + getSecurityDriftById()      |       | + getSecurityDriftById()      |
| + getSecurityDriftsByResource()|      | + getSecurityDriftsByResource()|
| + getSecurityDriftsBySeverity()|      | + getSecurityDriftsBySeverity()|
| + createSecurityDrift()       |       | + createSecurityDrift()       |
| + updateSecurityDrift()       |       | + updateSecurityDrift()       |
| + getCostAnomalies()          |       | + getCostAnomalies()          |
| + getCostAnomalyById()        |       | + getCostAnomalyById()        |
| + getCostAnomaliesByResource()|       | + getCostAnomaliesByResource()|
| + getCostAnomaliesBySeverity()|       | + getCostAnomaliesBySeverity()|
| + createCostAnomaly()         |       | + createCostAnomaly()         |
| + updateCostAnomaly()         |       | + updateCostAnomaly()         |
| + getAlerts()                 |       | + getAlerts()                 |
| + getAlertById()              |       | + getAlertById()              |
| + getAlertsByType()           |       | + getAlertsByType()           |
| + getAlertsBySeverity()       |       | + getAlertsBySeverity()       |
| + createAlert()               |       | + createAlert()               |
| + updateAlert()               |       | + updateAlert()               |
| + getRecommendations()        |       | + getRecommendations()        |
| + getRecommendationById()     |       | + getRecommendationById()     |
| + getRecommendationsByType()  |       | + getRecommendationsByType()  |
| + createRecommendation()      |       | + createRecommendation()      |
| + updateRecommendation()      |       | + updateRecommendation()      |
+-------------------------------+       +-------------------------------+

+-------------------------+       +-------------------------+       +-------------------------+
|  CloudProviderService   |<----->|  AWSProviderService     |<----->|  S3Service              |
+-------------------------+       +-------------------------+       +-------------------------+
| + getResources()        |       | + getResources()        |       | + listBuckets()         |
| + getResourceById()     |       | + getResourceById()     |       | + getBucketInfo()       |
| + getCredentials()      |       | + validateCredentials() |       | + getBucketTags()       |
| + validateCredentials() |       | + saveCredentials()     |       | + calculateStorageCost()|
| + saveCredentials()     |       | + getResourceCosts()    |       | + getLastAccessDate()   |
+-------------------------+       +-------------------------+       +-------------------------+
         ^                                    ^   ^
         |                                    |   |
         |                                    |   |
         |                                    |   +-------------------------+
         |                                    |                             |
+-------------------------+       +-------------------------+       +-------------------------+
|  AzureProviderService   |       |  EC2Service             |       |  CostExplorerService   |
+-------------------------+       +-------------------------+       +-------------------------+
| + getResources()        |       | + listInstances()       |       | + getCostAndUsage()     |
| + getResourceById()     |       | + getInstanceInfo()     |       | + getForecast()         |
| + validateCredentials() |       | + getInstanceTags()     |       | + getReservationUtil()  |
| + saveCredentials()     |       | + calculateHourlyCost() |       | + getSavingsPlans()     |
| + getResourceCosts()    |       | + getUtilization()      |       | + getAnomalies()        |
+-------------------------+       +-------------------------+       +-------------------------+

+-------------------------+       +-------------------------+       +-------------------------+
|  AICostService          |       |  SecurityService        |       |  NotificationsService   |
+-------------------------+       +-------------------------+       +-------------------------+
| + predictFutureCosts()  |       | + scanResources()       |       | + sendSlackMessage()    |
| + optimizeCosts()       |       | + detectDrifts()        |       | + checkStatus()         |
| + analyzeAnomalies()    |       | + evaluateSeverity()    |       | + sendAlert()           |
| + generateSaving()      |       | + suggestRemediation()  |       | + sendTest()            |
+-------------------------+       +-------------------------+       +-------------------------+
```

## Key Design Patterns

1. **Repository Pattern**: The `IStorage` interface provides a standardized way to access data, with concrete implementations (DatabaseStorage) handling the specifics.

2. **Strategy Pattern**: CloudProviderService uses different strategies (AWS, Azure, GCP) for interacting with cloud providers.

3. **Factory Pattern**: Service factories create the appropriate cloud provider services based on credentials.

4. **Adapter Pattern**: Adapters for different cloud providers translate their specific APIs into a common interface.

5. **Observer Pattern**: For notifications and alerts, allowing components to subscribe to events.

6. **Singleton Pattern**: For service instances that should exist only once in the application.

7. **Facade Pattern**: Services provide simplified interfaces to complex subsystems (like AWS SDK).

## Key Relationships

- Users can have multiple cloud credentials (one-to-many)
- Resources can have multiple security drifts (one-to-many)
- Resources can have multiple cost anomalies (one-to-many)
- Resources can have multiple alerts (one-to-many)
- Recommendations can affect multiple resources (many-to-many)
- Each cloud provider has specialized services for different resource types

This class diagram represents the core domain model and service layer of the CloudGuard application, showing the relationship between entities and the operations that can be performed on them.