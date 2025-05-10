# CloudGuard Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the CloudGuard Go backend to a Kubernetes cluster. 

## Prerequisites

- Kubernetes cluster (version 1.20+)
- `kubectl` CLI configured to access your cluster
- Container registry to host the Docker image
- [cert-manager](https://cert-manager.io/) installed (for TLS)
- [nginx-ingress-controller](https://kubernetes.github.io/ingress-nginx/) installed (for Ingress)

## Configuration Files

1. **deployment.yaml** - Deployment configuration for the API
2. **service.yaml** - Service definition for accessing the API
3. **ingress.yaml** - Ingress configuration for external access
4. **secrets.yaml** - Secret definitions (example only, use your own secrets)
5. **configmap.yaml** - ConfigMap for non-sensitive configuration
6. **hpa.yaml** - Horizontal Pod Autoscaler for automatic scaling

## Preparing for Deployment

1. Build and push the Docker image:

```bash
# Set variables
export DOCKER_REGISTRY="your-registry.example.com"
export VERSION="1.0.0"

# Build the image from the repository root
docker build -t ${DOCKER_REGISTRY}/cloudguard-api:${VERSION} -f go-backend/Dockerfile .

# Push the image
docker push ${DOCKER_REGISTRY}/cloudguard-api:${VERSION}
```

2. Update the secrets with your actual values:

```bash
# Create actual secrets (never commit real secrets to version control)
kubectl create secret generic cloudguard-secrets \
  --from-literal=database-url="postgresql://user:pass@postgresql-host:5432/cloudguard" \
  --from-literal=jwt-secret="your-secure-jwt-secret" \
  --from-literal=openai-api-key="your-openai-api-key" \
  --from-literal=slack-bot-token="your-slack-bot-token" \
  --from-literal=slack-channel-id="your-slack-channel-id"

kubectl create secret generic cloudguard-aws-credentials \
  --from-literal=access-key-id="your-aws-access-key-id" \
  --from-literal=secret-access-key="your-aws-secret-access-key" \
  --from-literal=region="us-east-1"
```

3. Update the ingress.yaml with your domain:

```yaml
spec:
  tls:
  - hosts:
    - api.your-domain.com  # Replace with your actual domain
    secretName: cloudguard-api-tls
  rules:
  - host: api.your-domain.com  # Replace with your actual domain
```

## Deploying

1. Create the Kubernetes namespace:

```bash
kubectl create namespace cloudguard
```

2. Apply all the configuration files:

```bash
# Apply in the correct order
kubectl apply -f k8s/configmap.yaml -n cloudguard
kubectl apply -f k8s/service.yaml -n cloudguard
kubectl apply -f k8s/deployment.yaml -n cloudguard
kubectl apply -f k8s/ingress.yaml -n cloudguard
kubectl apply -f k8s/hpa.yaml -n cloudguard
```

## Verifying Deployment

1. Check if pods are running:

```bash
kubectl get pods -n cloudguard
```

2. Check if service is created:

```bash
kubectl get services -n cloudguard
```

3. Check if ingress is configured:

```bash
kubectl get ingress -n cloudguard
```

4. Test API access (replace domain with your actual domain):

```bash
curl https://api.your-domain.com/api/health
```

## Scaling

The Horizontal Pod Autoscaler (HPA) will automatically scale the deployment based on CPU and memory usage. The configuration in hpa.yaml sets:

- Minimum 2 replicas
- Maximum 10 replicas
- Scale up when CPU usage exceeds 70%
- Scale up when memory usage exceeds 80%

You can check the current state of the HPA with:

```bash
kubectl get hpa -n cloudguard
```

## Cleanup

To remove all resources:

```bash
kubectl delete namespace cloudguard
```

## Production Considerations

1. **Secrets Management**: Use a proper secrets management solution like HashiCorp Vault or AWS Secrets Manager instead of Kubernetes secrets for production.

2. **Network Policies**: Define network policies to restrict pod communication.

3. **Resource Quotas**: Set namespace resource quotas to limit resource usage.

4. **Pod Disruption Budgets**: Define PDRs to ensure availability during cluster operations.

5. **Monitoring and Logging**: Set up proper monitoring (Prometheus, Grafana) and logging (ELK, Loki) solutions.

6. **Backup Strategy**: Implement database backup strategies for the PostgreSQL database.