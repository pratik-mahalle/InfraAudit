# CloudGuard Architecture Diagram

```
+------------------------------------------------------------------+
|                        Client Browser                             |
+------------------------------------------------------------------+
                               |
                               | HTTP/HTTPS
                               v
+------------------------------------------------------------------+
|                      Express.js Server                            |
|------------------------------------------------------------------|
|                                                                  |
|  +----------------+    +------------------+    +--------------+  |
|  | Authentication |    | API Controllers  |    | Slack        |  |
|  | Middleware     |    | & Route Handlers |    | Integration  |  |
|  +----------------+    +------------------+    +--------------+  |
|          |                      |                     |          |
|          v                      v                     v          |
|  +----------------+    +------------------+    +--------------+  |
|  | Cloud Provider |    | Storage Services |    | AI Services  |  |
|  | Integration    |    |                  |    | (OpenAI)     |  |
|  +----------------+    +------------------+    +--------------+  |
|    |        |               |                                    |
|    v        v               v                                    |
| +------+ +------+    +-------------+                             |
| | AWS  | | Azure|    | Drizzle ORM |                             |
| | SDK  | | SDK  |    +-------------+                             |
| +------+ +------+          |                                     |
|                            v                                     |
|                    +----------------+                            |
|                    | PostgreSQL DB  |                            |
|                    +----------------+                            |
|                                                                  |
+------------------------------------------------------------------+
          |                |                  |
          v                v                  v
+------------------+ +------------+ +-------------------+
| AWS Cloud        | | Azure      | | Google Cloud      |
| Services         | | Services   | | Services          |
| - S3             | | - VMs      | | - GCE             |
| - EC2            | | - Blob     | | - GCS             |
| - Cost Explorer  | | - Cost Mgmt| | - Billing API     |
| - IAM            | | - AD       | | - IAM             |
+------------------+ +------------+ +-------------------+

```

## Architecture Overview

### Frontend Components
- **React SPA**: Single page application using React and TypeScript
- **UI Framework**: TailwindCSS with shadcn/ui components
- **State Management**: React Query for server state, React Context for global state
- **Routing**: Wouter for client-side routing
- **Authentication**: JWT-based authentication with session storage

### Backend Components
- **Express.js Server**: Handles API requests, authentication, and business logic
- **Authentication**: Passport.js with local strategy
- **Database Access**: Drizzle ORM for type-safe database interactions
- **PostgreSQL**: Persistent storage for user data, resources, and monitoring information

### Integration Services
- **Cloud Provider Integration**: AWS SDK, Azure SDK, Google Cloud SDK
- **Notifications**: Slack API integration for alerts and notifications
- **AI Analysis**: OpenAI integration for cost prediction and optimization recommendations

### Major Subsystems
1. **Authentication System**
   - User registration, login, and session management
   - Role-based access control

2. **Cloud Provider Integration**
   - Multi-cloud credential management
   - Resource discovery and synchronization
   - Cost data collection

3. **Monitoring Engine**
   - Real-time resource utilization tracking
   - Security configuration drift detection
   - Cost anomaly identification

4. **AI Analytics**
   - Cost prediction and forecasting
   - Optimization recommendations
   - Anomaly analysis

5. **Notification System**
   - Real-time alerts via Slack
   - Email notifications
   - In-app notifications

## Data Flow
1. Users authenticate through the web interface
2. Backend validates credentials and establishes session
3. Frontend requests cloud resources, cost data, and recommendations
4. Backend fetches data from cloud providers using stored credentials
5. AI services analyze data and generate recommendations
6. Results are returned to frontend for visualization
7. Critical events trigger notifications to configured channels

## Security Model
- Credentials stored in encrypted format in PostgreSQL
- Session management with secure HTTP-only cookies
- Least privilege IAM roles for cloud provider access
- All external API requests use authentication tokens stored as environment variables