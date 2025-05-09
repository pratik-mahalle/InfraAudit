import { db, pool } from '../db';
import { 
  AllCloudCredentials, 
  CloudProvider,
  AWSCredentials,
  GCPCredentials,
  AzureCredentials
} from '../../shared/cloud-providers';
import { eq } from 'drizzle-orm';
import { cloudCredentials } from '../../shared/schema';
import crypto from 'crypto';

// Simple encryption class for credentials
class CredentialEncryption {
  private encryptionKey: string;
  private algorithm = 'aes-256-cbc';
  
  constructor() {
    // In a real-world application, this should be a secure environment variable
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-for-development-only';
  }

  encrypt(text: string): { encryptedData: string, iv: string } {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex')
    };
  }

  decrypt(encryptedData: string, iv: string): string {
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const decipher = crypto.createDecipheriv(
      this.algorithm, 
      key, 
      Buffer.from(iv, 'hex')
    );
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

export class CredentialsService {
  private encryption: CredentialEncryption;
  
  constructor() {
    this.encryption = new CredentialEncryption();
  }

  // Save credentials to the database
  async saveCredentials(userId: number, credentials: AllCloudCredentials): Promise<number> {
    const credentialsString = JSON.stringify(credentials);
    const { encryptedData, iv } = this.encryption.encrypt(credentialsString);
    
    const [result] = await db.insert(cloudCredentials)
      .values({
        userId,
        provider: credentials.provider,
        encryptedCredentials: encryptedData,
        encryptionIv: iv,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning({ id: cloudCredentials.id });
    
    return result.id;
  }

  // Update existing credentials
  async updateCredentials(credentialId: number, credentials: AllCloudCredentials): Promise<void> {
    const credentialsString = JSON.stringify(credentials);
    const { encryptedData, iv } = this.encryption.encrypt(credentialsString);
    
    await db.update(cloudCredentials)
      .set({
        provider: credentials.provider,
        encryptedCredentials: encryptedData,
        encryptionIv: iv,
        updatedAt: new Date()
      })
      .where(eq(cloudCredentials.id, credentialId));
  }

  // Get credentials by ID
  async getCredentialsById(credentialId: number): Promise<AllCloudCredentials | null> {
    const [result] = await db.select()
      .from(cloudCredentials)
      .where(eq(cloudCredentials.id, credentialId));
    
    if (!result) {
      return null;
    }
    
    const decrypted = this.encryption.decrypt(
      result.encryptedCredentials,
      result.encryptionIv
    );
    
    return JSON.parse(decrypted) as AllCloudCredentials;
  }

  // Get all credentials for a user
  async getCredentialsByUser(userId: number): Promise<AllCloudCredentials[]> {
    const results = await db.select()
      .from(cloudCredentials)
      .where(eq(cloudCredentials.userId, userId));
    
    return results.map(result => {
      const decrypted = this.encryption.decrypt(
        result.encryptedCredentials,
        result.encryptionIv
      );
      return JSON.parse(decrypted) as AllCloudCredentials;
    });
  }

  // Get credentials by provider for a user
  async getCredentialsByProvider(userId: number, provider: CloudProvider): Promise<AllCloudCredentials | null> {
    const [result] = await db.select()
      .from(cloudCredentials)
      .where(eq(cloudCredentials.userId, userId))
      .where(eq(cloudCredentials.provider, provider));
    
    if (!result) {
      return null;
    }
    
    const decrypted = this.encryption.decrypt(
      result.encryptedCredentials,
      result.encryptionIv
    );
    
    return JSON.parse(decrypted) as AllCloudCredentials;
  }

  // Delete credentials
  async deleteCredentials(credentialId: number): Promise<void> {
    await db.delete(cloudCredentials)
      .where(eq(cloudCredentials.id, credentialId));
  }

  // Test if credentials are valid by attempting to connect to the provider
  async testCredentials(credentials: AllCloudCredentials): Promise<boolean> {
    try {
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
      console.error(`Error testing credentials: ${error}`);
      return false;
    }
  }

  private async testAwsCredentials(credentials: AWSCredentials): Promise<boolean> {
    // Here you would use AWS SDK to verify credentials
    // For example, try to call a simple API like listing S3 buckets
    console.log("Testing AWS credentials");
    return true; // Mock implementation
  }

  private async testGcpCredentials(credentials: GCPCredentials): Promise<boolean> {
    // Here you would use GCP SDK to verify credentials
    console.log("Testing GCP credentials");
    return true; // Mock implementation
  }

  private async testAzureCredentials(credentials: AzureCredentials): Promise<boolean> {
    // Here you would use Azure SDK to verify credentials
    console.log("Testing Azure credentials");
    return true; // Mock implementation
  }
}