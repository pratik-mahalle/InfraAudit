import crypto from 'crypto';
import { db } from '../db';
import { 
  cloudCredentials, 
  InsertCloudCredential, 
  CloudCredential 
} from '../../shared/schema';
import { 
  CloudProvider, 
  AllCloudCredentials, 
  AWSCredentials, 
  GCPCredentials, 
  AzureCredentials 
} from '../../shared/cloud-providers';
import { IAMClient, ListAccessKeysCommand } from "@aws-sdk/client-iam";
import { eq } from 'drizzle-orm';

/**
 * Service to handle cloud provider credential encryption/decryption and storage
 */
class CredentialEncryption {
  private encryptionKey: string;
  private algorithm = 'aes-256-cbc';

  constructor() {
    // In a real app, this would be a secure environment variable
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'a-secure-encryption-key-would-go-here-in-prod';
  }

  /**
   * Encrypt credential data
   */
  encrypt(text: string): { encryptedData: string, iv: string } {
    // Create an initialization vector
    const iv = crypto.randomBytes(16);
    // Create a cipher
    const cipher = crypto.createCipheriv(
      this.algorithm, 
      Buffer.from(this.encryptionKey.padEnd(32).slice(0, 32)), 
      iv
    );
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex')
    };
  }

  /**
   * Decrypt credential data
   */
  decrypt(encryptedData: string, iv: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm, 
      Buffer.from(this.encryptionKey.padEnd(32).slice(0, 32)), 
      Buffer.from(iv, 'hex')
    );
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

/**
 * Service to handle cloud provider credentials 
 */
export class CredentialsService {
  private encryption: CredentialEncryption;

  constructor() {
    this.encryption = new CredentialEncryption();
  }

  /**
   * Store credentials for a cloud provider
   */
  async saveCredentials(userId: number, credentials: AllCloudCredentials): Promise<number> {
    const { encryptedData, iv } = this.encryption.encrypt(JSON.stringify(credentials));

    // Check if there are existing credentials for this provider and user
    const existingCredsResult = await db.select({ id: cloudCredentials.id })
      .from(cloudCredentials)
      .where(
        eq(cloudCredentials.userId, userId) && 
        eq(cloudCredentials.provider, credentials.provider)
      );
    
    if (existingCredsResult.length > 0) {
      const existingCredId = existingCredsResult[0].id;
      // Update existing credentials
      await db.update(cloudCredentials)
        .set({ 
          encryptedCredentials: encryptedData,
          encryptionIv: iv,
          updatedAt: new Date()
        })
        .where(eq(cloudCredentials.id, existingCredId));
        
      return existingCredId;
    } else {
      // Insert new credentials
      const insertData: InsertCloudCredential = {
        userId,
        provider: credentials.provider,
        name: this.getDefaultName(credentials),
        encryptedCredentials: encryptedData,
        encryptionIv: iv,
        isActive: true
      };
      
      const [result] = await db.insert(cloudCredentials).values(insertData).returning({ id: cloudCredentials.id });
      return result.id;
    }
  }

  /**
   * Update existing credentials
   */
  async updateCredentials(credentialId: number, credentials: AllCloudCredentials): Promise<void> {
    const { encryptedData, iv } = this.encryption.encrypt(JSON.stringify(credentials));
    
    await db.update(cloudCredentials)
      .set({ 
        encryptedCredentials: encryptedData,
        encryptionIv: iv,
        updatedAt: new Date()
      })
      .where(eq(cloudCredentials.id, credentialId));
  }

  /**
   * Get credentials by ID
   */
  async getCredentialsById(credentialId: number): Promise<AllCloudCredentials | null> {
    const result = await db.select().from(cloudCredentials).where(eq(cloudCredentials.id, credentialId));
    
    if (result.length === 0) {
      return null;
    }
    
    return this.decryptCredentials(result[0]);
  }

  /**
   * Get all credentials for a user
   */
  async getCredentialsByUser(userId: number): Promise<AllCloudCredentials[]> {
    const results = await db.select().from(cloudCredentials).where(eq(cloudCredentials.userId, userId));
    
    return results.map(cred => this.decryptCredentials(cred)).filter(Boolean) as AllCloudCredentials[];
  }

  /**
   * Get credentials for a specific provider
   */
  async getCredentialsByProvider(userId: number, provider: CloudProvider): Promise<AllCloudCredentials | null> {
    const results = await db.select()
      .from(cloudCredentials)
      .where(
        eq(cloudCredentials.userId, userId) && 
        eq(cloudCredentials.provider, provider)
      );
    
    if (results.length === 0) {
      return null;
    }
    
    return this.decryptCredentials(results[0]);
  }

  /**
   * Delete credentials
   */
  async deleteCredentials(credentialId: number): Promise<void> {
    await db.delete(cloudCredentials).where(eq(cloudCredentials.id, credentialId));
  }

  /**
   * Test if the credentials are valid by attempting to connect to the cloud provider
   */
  async testCredentials(credentials: AllCloudCredentials): Promise<boolean> {
    try {
      // In a real app, we would use the cloud provider SDK to test the credentials
      switch (credentials.provider) {
        case CloudProvider.AWS:
          return await this.testAwsCredentials(credentials as AWSCredentials);
        case CloudProvider.GCP:
          return await this.testGcpCredentials(credentials as GCPCredentials);
        case CloudProvider.AZURE:
          return await this.testAzureCredentials(credentials as AzureCredentials);
        default:
          return false;
      }
    } catch (error) {
      console.error('Error testing credentials:', error);
      return false;
    }
  }

  /**
   * Helper methods to test credentials for each cloud provider
   * In a real app, these would use the actual cloud SDKs
   */
  private async testAwsCredentials(credentials: AWSCredentials): Promise<boolean> {
    // Validate required credentials
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      return false;
    }

    try {
      // Use IAM client to test if credentials are valid by making a simple API call
      const region = credentials.region || 'us-east-1';
      const iamClient = new IAMClient({
        region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey
        }
      });
      
      // Make a simple call to list access keys
      // This will fail if credentials are invalid
      const command = new ListAccessKeysCommand({});
      await iamClient.send(command);
      
      console.log('AWS credentials validation successful');
      return true;
    } catch (error) {
      console.error('AWS credentials validation failed:', error);
      return false;
    }
  }

  private async testGcpCredentials(credentials: GCPCredentials): Promise<boolean> {
    // Validate required credentials
    if (!credentials.serviceAccountKey) {
      return false;
    }

    try {
      // Ensure service account key can be parsed as JSON
      JSON.parse(credentials.serviceAccountKey);
      
      // In a real app: Verify the service account key with GCP API
      // For demo purposes - return true if it's valid JSON
      return true;
    } catch (e) {
      return false;
    }
  }

  private async testAzureCredentials(credentials: AzureCredentials): Promise<boolean> {
    // Validate required credentials
    if (!credentials.clientId || !credentials.clientSecret || 
        !credentials.tenantId || !credentials.subscriptionId) {
      return false;
    }

    // In a real app: Call Azure SDK to verify credentials
    // For demo purposes - return true if they have the expected structure
    return credentials.clientId.length >= 10 && 
           credentials.clientSecret.length >= 10 &&
           credentials.tenantId.length >= 10 &&
           credentials.subscriptionId.length >= 10;
  }

  /**
   * Helper method to decrypt a credential record from the database
   */
  private decryptCredentials(credential: CloudCredential): AllCloudCredentials | null {
    try {
      const decrypted = this.encryption.decrypt(
        credential.encryptedCredentials,
        credential.encryptionIv
      );
      
      const parsed = JSON.parse(decrypted) as AllCloudCredentials;
      return parsed;
    } catch (error) {
      console.error('Error decrypting credentials:', error);
      return null;
    }
  }

  /**
   * Generate a default name for credentials if none provided
   */
  private getDefaultName(credentials: AllCloudCredentials): string {
    switch (credentials.provider) {
      case CloudProvider.AWS:
        return 'AWS Account';
      case CloudProvider.GCP:
        return 'GCP Account';
      case CloudProvider.AZURE:
        return 'Azure Account';
      default:
        return 'Cloud Account';
    }
  }
}