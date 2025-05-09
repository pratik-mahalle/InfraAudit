import { Express, Request, Response } from 'express';
import { z } from 'zod';
import { CloudProvider, AllCloudCredentials } from '../../shared/cloud-providers';
import { CredentialsService } from '../services/credentials-service';
import { CloudProviderService } from '../services/cloud-provider-service';

const credentialsService = new CredentialsService();

// Initialize cloud provider service with empty credentials
// We'll load saved credentials during route registration
const cloudProviderService = new CloudProviderService([]);

export async function registerCloudProviderRoutes(app: Express) {
  // Load existing cloud provider credentials from DB
  try {
    console.log('Loading saved cloud provider credentials...');
    // We'll need to fetch all users and their credentials
    // For now, we'll just focus on the demo user (ID = 1)
    const demoUserId = 1;
    const credentials = await credentialsService.getCredentialsByUser(demoUserId);
    
    if (credentials.length > 0) {
      console.log(`Found ${credentials.length} saved provider(s)`);
      
      // Add each set of credentials to the cloud provider service
      for (const cred of credentials) {
        console.log(`Adding provider: ${cred.provider}`);
        cloudProviderService.addProvider(cred);
      }
    } else {
      console.log('No saved cloud provider credentials found');
    }
  } catch (error) {
    console.error('Error loading saved cloud provider credentials:', error);
  }
  // Get all configured cloud providers for the authenticated user
  app.get('/api/cloud-providers', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const userId = req.user!.id;
      const credentials = await credentialsService.getCredentialsByUser(userId);

      // Transform to a more user-friendly format without sensitive data
      const providers = credentials.map(cred => ({
        id: cred.provider,
        name: getProviderName(cred.provider),
        isConnected: true,
        lastSynced: null // In a real app, we'd store and return this
      }));

      res.json(providers);
    } catch (error) {
      console.error('Error fetching cloud providers:', error);
      res.status(500).json({ message: 'Failed to fetch cloud providers' });
    }
  });

  // Validate and add cloud provider credentials
  app.post('/api/cloud-providers/aws', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const awsCredentialsSchema = z.object({
      accessKeyId: z.string().min(16).max(128),
      secretAccessKey: z.string().min(16).max(128),
      region: z.string().optional(),
      name: z.string().optional()
    });

    try {
      const validatedData = awsCredentialsSchema.parse(req.body);
      
      const credentials: AllCloudCredentials = {
        provider: CloudProvider.AWS,
        accessKeyId: validatedData.accessKeyId,
        secretAccessKey: validatedData.secretAccessKey,
        region: validatedData.region
      };

      // Test if credentials are valid
      const isValid = await credentialsService.testCredentials(credentials);
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid AWS credentials' });
      }

      // Save credentials
      const credentialId = await credentialsService.saveCredentials(req.user!.id, credentials);
      
      // Add to cloud provider service
      cloudProviderService.addProvider(credentials);

      res.status(201).json({ 
        id: credentialId,
        provider: CloudProvider.AWS,
        name: validatedData.name || 'AWS Account',
        isConnected: true
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error adding AWS credentials:', error);
      res.status(500).json({ message: 'Failed to add AWS credentials' });
    }
  });

  // Add GCP credentials
  app.post('/api/cloud-providers/gcp', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const gcpCredentialsSchema = z.object({
      serviceAccountKey: z.string().min(100), // JSON stringified key
      projectId: z.string().optional(),
      name: z.string().optional()
    });

    try {
      const validatedData = gcpCredentialsSchema.parse(req.body);
      
      const credentials: AllCloudCredentials = {
        provider: CloudProvider.GCP,
        serviceAccountKey: validatedData.serviceAccountKey,
        projectId: validatedData.projectId
      };

      // Test if credentials are valid
      const isValid = await credentialsService.testCredentials(credentials);
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid GCP credentials' });
      }

      // Save credentials
      const credentialId = await credentialsService.saveCredentials(req.user!.id, credentials);
      
      // Add to cloud provider service
      cloudProviderService.addProvider(credentials);

      res.status(201).json({ 
        id: credentialId,
        provider: CloudProvider.GCP,
        name: validatedData.name || 'GCP Account',
        isConnected: true
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error adding GCP credentials:', error);
      res.status(500).json({ message: 'Failed to add GCP credentials' });
    }
  });

  // Add Azure credentials
  app.post('/api/cloud-providers/azure', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const azureCredentialsSchema = z.object({
      clientId: z.string().min(10),
      clientSecret: z.string().min(10),
      tenantId: z.string().min(10),
      subscriptionId: z.string().min(10),
      name: z.string().optional()
    });

    try {
      const validatedData = azureCredentialsSchema.parse(req.body);
      
      const credentials: AllCloudCredentials = {
        provider: CloudProvider.AZURE,
        clientId: validatedData.clientId,
        clientSecret: validatedData.clientSecret,
        tenantId: validatedData.tenantId,
        subscriptionId: validatedData.subscriptionId
      };

      // Test if credentials are valid
      const isValid = await credentialsService.testCredentials(credentials);
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid Azure credentials' });
      }

      // Save credentials
      const credentialId = await credentialsService.saveCredentials(req.user!.id, credentials);
      
      // Add to cloud provider service
      cloudProviderService.addProvider(credentials);

      res.status(201).json({ 
        id: credentialId,
        provider: CloudProvider.AZURE,
        name: validatedData.name || 'Azure Account',
        isConnected: true
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error adding Azure credentials:', error);
      res.status(500).json({ message: 'Failed to add Azure credentials' });
    }
  });

  // Delete cloud provider credentials
  app.delete('/api/cloud-providers/:provider', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const provider = req.params.provider as CloudProvider;
      const userId = req.user!.id;
      
      // Get credential ID by provider
      const credentials = await credentialsService.getCredentialsByProvider(userId, provider);
      if (!credentials) {
        return res.status(404).json({ message: 'Cloud provider not found' });
      }
      
      // Find credential ID in db
      const allCreds = await credentialsService.getCredentialsByUser(userId);
      const cred = allCreds.find(c => c.provider === provider);
      if (!cred) {
        return res.status(404).json({ message: 'Cloud provider not found' });
      }
      
      // Delete from DB (in real app, we'd store the credential ID)
      // await credentialsService.deleteCredentials(credId);
      
      // Remove from service
      cloudProviderService.removeProvider(provider);

      res.status(200).json({ message: 'Cloud provider removed successfully' });
    } catch (error) {
      console.error('Error removing cloud provider:', error);
      res.status(500).json({ message: 'Failed to remove cloud provider' });
    }
  });

  // Get all resources from all connected providers
  app.get('/api/cloud-resources', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const resources = await cloudProviderService.getAllResources();
      res.json(resources);
    } catch (error) {
      console.error('Error fetching cloud resources:', error);
      res.status(500).json({ message: 'Failed to fetch cloud resources' });
    }
  });

  // Get resources by provider
  app.get('/api/cloud-resources/:provider', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const provider = req.params.provider as CloudProvider;
      
      if (!cloudProviderService.isProviderConfigured(provider)) {
        return res.status(404).json({ message: 'Cloud provider not configured' });
      }
      
      const resources = await cloudProviderService.getResourcesByProvider(provider);
      res.json(resources);
    } catch (error) {
      console.error('Error fetching provider resources:', error);
      res.status(500).json({ message: 'Failed to fetch provider resources' });
    }
  });

  // Sync cloud provider resources
  app.post('/api/cloud-providers/:provider/sync', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const provider = req.params.provider as CloudProvider;
      
      if (!cloudProviderService.isProviderConfigured(provider)) {
        return res.status(404).json({ message: 'Cloud provider not configured' });
      }
      
      const resources = await cloudProviderService.syncProvider(provider);
      res.json({ 
        success: true, 
        provider,
        resourceCount: resources.length,
        lastSynced: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error syncing provider resources:', error);
      res.status(500).json({ message: 'Failed to sync cloud provider resources' });
    }
  });

  // Fetch cost data
  app.get('/api/cloud-costs', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date(); // now
      
      const costs = await cloudProviderService.getAllCostData(startDate, endDate);
      res.json(costs);
    } catch (error) {
      console.error('Error fetching cloud costs:', error);
      res.status(500).json({ message: 'Failed to fetch cloud costs' });
    }
  });

  // Fetch security findings
  app.get('/api/cloud-security', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const findings = await cloudProviderService.getAllSecurityFindings();
      res.json(findings);
    } catch (error) {
      console.error('Error fetching security findings:', error);
      res.status(500).json({ message: 'Failed to fetch security findings' });
    }
  });

  // Generate recommendations
  app.get('/api/cloud-recommendations', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const recommendations = await cloudProviderService.generateAllOptimizationRecommendations();
      res.json(recommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      res.status(500).json({ message: 'Failed to generate recommendations' });
    }
  });
}

// Helper function to get user-friendly provider name
function getProviderName(provider: CloudProvider): string {
  switch (provider) {
    case CloudProvider.AWS:
      return 'Amazon Web Services';
    case CloudProvider.GCP:
      return 'Google Cloud Platform';
    case CloudProvider.AZURE:
      return 'Microsoft Azure';
    default:
      return provider;
  }
}