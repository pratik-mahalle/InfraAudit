# CloudGuard Visual Architecture

```
+----------------------------------------------------------------------------------------------------------------------+
|                                            CLOUDGUARD ARCHITECTURE                                                    |
+----------------------------------------------------------------------------------------------------------------------+

+------------------------+        +--------------------+        +-------------------------+        +-------------------+
|                        |        |                    |        |                         |        |                   |
|   FRONTEND (React)     |<------>|   Express Backend  |<------>|   Integration Services  |<------>|   Cloud Providers |
|                        |   HTTP  |                    |  API    |                         |  SDK    |                   |
+------------------------+        +--------------------+        +-------------------------+        +-------------------+
         |                                |                                 |
         |                                |                                 |
         v                                v                                 v
+------------------------+        +--------------------+        +-------------------------+
|                        |        |                    |        |                         |
|   UI Components        |        |   API Controllers  |        |   Provider Services     |
|                        |        |                    |        |                         |
+------------------------+        +--------------------+        +-------------------------+
| - Dashboard            |        | - User Routes      |        | - AWS Service           |
| - CostOptimization     |        | - Resources        |        |   * S3                  |
| - SecurityMonitoring   |        | - Monitoring       |        |   * EC2                 |
| - ResourceUtilization  |        | - Recommendations  |        |   * Cost Explorer       |
| - Alerts               |        | - Alerts           |        | - Azure Service         |
| - CloudProviders       |        | - AI Analysis      |        | - GCP Service           |
+------------------------+        +--------------------+        +-------------------------+
         |                                |                                 |
         |                                |                                 |
         v                                v                                 v
+------------------------+        +--------------------+        +-------------------------+
|                        |        |                    |        |                         |
|   State Management     |        |   Data Services    |        |   External Services     |
|                        |        |                    |        |                         |
+------------------------+        +--------------------+        +-------------------------+
| - React Query          |        | - Drizzle ORM      |        | - Slack API             |
| - Context Providers    |        | - PostgreSQL       |        | - OpenAI                |
| - Custom Hooks         |        | - Auth Services    |        |                         |
+------------------------+        +--------------------+        +-------------------------+
                                           |
                                           v
                                  +--------------------+
                                  |                    |
                                  |   Database Schema  |
                                  |                    |
                                  +--------------------+
                                  | - Users            |
                                  | - Resources        |
                                  | - SecurityDrifts   |
                                  | - CostAnomalies    |
                                  | - Alerts           |
                                  | - Recommendations  |
                                  | - CloudCredentials |
                                  +--------------------+

DATA FLOW DIAGRAM:
================

[User Browser] --> (Authentication) --> [Protected Routes] --> (React Components)
                                                                     |
                                                                     v
[React Components] --> (API Requests) --> [Express Handlers] --> (Business Logic)
                                                                     |
                                                                     v
[Express Handlers] <--> (Database Operations) <--> [PostgreSQL Database]
                               |
                               v
[Express Handlers] <--> (Cloud Provider APIs) <--> [AWS/Azure/GCP]
                               |
                               v
[Express Handlers] <--> (Notification Service) <--> [Slack API]
                               |
                               v
[Express Handlers] <--> (AI Analysis) <--> [OpenAI API]
                               |
                               v
[React Components] <-- (API Responses) <-- [Express Handlers]


KEY FEATURES:
===========
• Multi-cloud provider integration and monitoring
• Cost anomaly detection and optimization recommendations
• Security configuration drift monitoring
• Real-time resource utilization tracking
• AI-powered cost prediction and forecasting
• Slack notifications for critical events
• Customizable dashboard with real-time metrics
```

## Technology Stack

### Frontend
- **React**: Core UI library
- **TypeScript**: Type-safe JavaScript
- **TailwindCSS**: Utility-first CSS framework
- **shadcn/ui**: Component library
- **React Query**: Data fetching and caching
- **Recharts/Chart.js**: Data visualization
- **Wouter**: Client-side routing

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **Drizzle ORM**: SQL query builder
- **PostgreSQL**: Database
- **Passport.js**: Authentication middleware
- **AWS SDK Packages**: AWS cloud service integration
- **OpenAI API**: AI-powered analysis

### DevOps
- **Vite**: Frontend build tool
- **Node.js**: API server
- **Replit**: Hosting and deployment

### External Services
- **AWS Services**: Cloud resources and cost data
- **Slack API**: Notifications and alerts
- **OpenAI API**: Cost prediction and analysis