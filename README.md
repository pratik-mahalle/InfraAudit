# InfraAudit

InfraAudit is a cloud infrastructure auditing and monitoring platform that helps organizations track, analyze, and optimize their cloud resources. It provides real-time monitoring, cost analysis, security drift detection, and automated recommendations for infrastructure optimization.

## Features

- **Resource Monitoring**: Track cloud resources across multiple providers (AWS, Azure, GCP)
- **Cost Analysis**: Monitor and analyze cloud spending with anomaly detection
- **Security Drift Detection**: Identify security policy changes and compliance violations
- **Automated Recommendations**: Get suggestions for cost optimization and security improvements
- **Multi-tenant Support**: Manage multiple organizations and users
- **Role-based Access Control**: Granular permissions for different user roles

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: JWT-based authentication
- **Containerization**: Docker
- **Orchestration**: Kubernetes

## Prerequisites

- Node.js 20 or higher
- PostgreSQL 15 or higher
- Docker (for containerized deployment)
- Kubernetes cluster (for production deployment)

## Installation

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/InfraAudit.git
cd InfraAudit
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

### Docker Deployment

1. Build the Docker image:
```bash
docker build -t infraaudit:latest .
```

2. Run the container:
```bash
docker run -p 5000:5000 infraaudit:latest
```

### Kubernetes Deployment

1. Update the configuration in `k8s/` directory with your settings
2. Apply the Kubernetes configurations:
```bash
kubectl apply -f k8s/
```

## Environment Variables

Required environment variables:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/database
PGDATABASE=database
PGHOST=host
PGPORT=5432
PGUSER=user
PGPASSWORD=password

# Application Configuration
NODE_ENV=development
PORT=5000
```

## API Documentation

The API documentation is available at `/api/docs` when running the application.

### Key Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/resources` - List cloud resources
- `GET /api/costs` - Get cost analysis
- `GET /api/security/drifts` - Get security drift information
- `GET /api/recommendations` - Get optimization recommendations

## Database Schema

The application uses the following main tables:

- `users` - User accounts and authentication
- `organizations` - Organization information
- `resources` - Cloud resources
- `security_drifts` - Security policy changes
- `cost_anomalies` - Cost analysis and anomalies
- `alerts` - System alerts
- `recommendations` - Optimization recommendations

## Development

### Project Structure

```
InfraAudit/
├── client/           # Frontend React application
├── server/           # Backend Node.js application
├── shared/           # Shared types and utilities
├── k8s/             # Kubernetes configuration files
├── Dockerfile       # Docker configuration
└── docker-compose.yml # Docker Compose configuration
```

### Running Tests

```bash
npm test
```

### Code Style

The project uses ESLint and Prettier for code formatting. Run:

```bash
npm run lint
npm run format
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## Acknowledgments

- [Drizzle ORM](https://orm.drizzle.team/)
- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/)

---

Made with ❤️ by [thedevopsguy](https://github.com/pratik-mahalle) 