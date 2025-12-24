import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Zap, AlertTriangle, Shield, BarChart3, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AiAnalysisDemo() {
  const { toast } = useToast();
  const [resourceJson, setResourceJson] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('cost');

  // Example AWS EC2 resource
  const exampleEc2 = {
    id: 'i-1234567890abcdef0',
    name: 'Production Web Server',
    type: 'EC2',
    provider: 'AWS',
    region: 'us-east-1',
    status: 'running',
    cost: 125.40,
    createdAt: '2023-10-15',
    tags: {
      Environment: 'Production',
      Department: 'Engineering',
      Project: 'Website',
    },
    metadata: {
      instanceType: 't3.xlarge',
      vCPU: 4,
      memory: '16 GiB',
      storage: 'EBS only',
      networkPerformance: 'Up to 5 Gigabit',
      lastUsed: '2025-05-20',
      utilizationData: {
        cpu: {
          average: 15,
          peak: 45,
          history: [10, 12, 15, 18, 45, 30, 20, 15, 12, 10]
        },
        memory: {
          average: 30,
          peak: 60,
          history: [25, 28, 30, 35, 60, 55, 40, 35, 30, 28]
        }
      }
    }
  };

  // Example AWS S3 resource
  const exampleS3 = {
    id: 's3-mybucket-assets',
    name: 'Assets Storage Bucket',
    type: 'S3',
    provider: 'AWS',
    region: 'us-east-1',
    status: 'active',
    cost: 75.20,
    createdAt: '2023-08-10',
    tags: {
      Environment: 'Production',
      Department: 'Engineering',
      Purpose: 'Static Assets'
    },
    metadata: {
      bucketName: 'company-assets-prod',
      storageClass: 'Standard',
      versioning: 'Enabled',
      encryption: 'AES-256',
      objectCount: 15782,
      totalSize: '512 GB',
      lastAccessed: '2025-05-23',
      publicAccess: true, // This is a potential security concern
      crossRegionReplication: false
    }
  };

  // Example RDS Database resource
  const exampleRds = {
    id: 'db-prod-users',
    name: 'Production User Database',
    type: 'RDS',
    provider: 'AWS',
    region: 'us-east-1',
    status: 'available',
    cost: 350.60,
    createdAt: '2023-06-05',
    tags: {
      Environment: 'Production',
      Department: 'Engineering',
      Data: 'Users'
    },
    metadata: {
      engine: 'PostgreSQL',
      version: '13.4',
      instanceClass: 'db.r5.xlarge',
      multiAZ: false, // This is a potential security concern
      storage: '500 GB',
      storageType: 'gp2',
      encrypted: true,
      backupRetention: 7,
      performanceInsights: true,
      maintenanceWindow: 'sun:05:00-sun:06:00',
      utilizationData: {
        cpu: {
          average: 35,
          peak: 80,
          history: [30, 35, 40, 45, 80, 75, 60, 45, 40, 35]
        },
        connections: {
          average: 150,
          peak: 450,
          history: [120, 140, 160, 200, 450, 400, 300, 250, 180, 150]
        },
        storage: {
          used: '275 GB',
          available: '225 GB',
          utilizationPercent: 55
        }
      }
    }
  };

  const loadExample = (type: string) => {
    let example;
    switch(type) {
      case 'ec2':
        example = exampleEc2;
        break;
      case 's3':
        example = exampleS3;
        break;
      case 'rds':
        example = exampleRds;
        break;
      default:
        example = exampleEc2;
    }
    setResourceJson(JSON.stringify(example, null, 2));
  };

  const analyzeResource = () => {
    if (!resourceJson.trim()) {
      toast({
        title: "No resource data",
        description: "Please enter resource JSON data or load an example",
        variant: "destructive",
      });
      return;
    }

    let resource;
    try {
      resource = JSON.parse(resourceJson);
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your JSON format and try again",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    
    // Simulate analysis with OpenAI integration
    setTimeout(() => {
      // Mock response for demonstration
      let mockResults;
      
      if (resource.type === 'EC2') {
        mockResults = {
          costAnalysis: {
            detected: true,
            description: "This EC2 instance is significantly underutilized. The average CPU utilization is only 15% and memory usage is 30%, indicating that you're paying for resources that aren't being used.",
            severity: "high",
            recommendations: [
              "Downsize from t3.xlarge to t3.medium to match actual usage patterns",
              "Consider implementing auto-scaling to adjust capacity during low-usage periods",
              "Evaluate if this workload is suitable for spot instances to reduce costs"
            ],
            estimatedSavings: 62.70
          },
          securityAnalysis: {
            detected: false,
            description: "No significant security configuration drifts detected for this EC2 instance.",
            severity: "low",
            vulnerabilities: [],
            recommendations: [
              "Continue regular security scans and updates",
              "Consider implementing EC2 instance lifecycle policies"
            ],
            complianceImpact: []
          }
        };
      } else if (resource.type === 'S3') {
        mockResults = {
          costAnalysis: {
            detected: true,
            description: "Your S3 bucket is using the Standard storage class for all objects, which may not be cost-effective for infrequently accessed data.",
            severity: "medium",
            recommendations: [
              "Implement lifecycle policies to transition older objects to Infrequent Access or Glacier storage classes",
              "Review object retention requirements and set up expiration policies for temporary data"
            ],
            estimatedSavings: 30.08
          },
          securityAnalysis: {
            detected: true,
            description: "This S3 bucket has public access enabled, which poses a significant security risk. All data could potentially be exposed to unauthorized users.",
            severity: "critical",
            vulnerabilities: [
              "Public access is enabled for the bucket",
              "No cross-region replication configured for disaster recovery"
            ],
            recommendations: [
              "Immediately disable public access to the bucket",
              "Implement bucket policies to restrict access to authorized users only",
              "Enable server-side encryption for all objects"
            ],
            complianceImpact: ["GDPR", "HIPAA", "SOC2"]
          }
        };
      } else if (resource.type === 'RDS') {
        mockResults = {
          costAnalysis: {
            detected: true,
            description: "The RDS instance is provisioned with more resources than needed and is not using the most cost-effective options.",
            severity: "high",
            recommendations: [
              "Consider downsizing from db.r5.xlarge to db.r5.large based on current usage patterns",
              "Evaluate if GP3 storage would be more cost-effective than current GP2",
              "Optimize backup retention period based on your actual recovery requirements"
            ],
            estimatedSavings: 140.24
          },
          securityAnalysis: {
            detected: true,
            description: "The RDS instance is not configured for high availability with Multi-AZ deployment, which creates a potential availability risk.",
            severity: "high",
            vulnerabilities: [
              "No Multi-AZ deployment configured, creating a single point of failure",
              "Extended maintenance window may lead to longer downtime periods"
            ],
            recommendations: [
              "Enable Multi-AZ deployment to improve availability and security",
              "Reduce the maintenance window duration to minimize potential downtime",
              "Consider implementing a read replica for improved read performance and disaster recovery"
            ],
            complianceImpact: ["SOC2", "PCI-DSS"]
          }
        };
      } else {
        mockResults = {
          costAnalysis: {
            detected: false,
            description: "No significant cost optimizations identified for this resource.",
            severity: "low",
            recommendations: ["Continue monitoring resource usage patterns"],
            estimatedSavings: 0
          },
          securityAnalysis: {
            detected: false,
            description: "No security drifts detected for this resource.",
            severity: "low",
            vulnerabilities: [],
            recommendations: ["Maintain regular security assessments"],
            complianceImpact: []
          }
        };
      }
      
      setResults(mockResults);
      setAnalyzing(false);
      
      toast({
        title: "Analysis Complete",
        description: `Analysis for ${resource.name} (${resource.type}) completed successfully`,
        variant: "default",
      });
    }, 3000);
  };

  const getSeverityBadge = (severity: string) => {
    let variant: "default" | "destructive" | "outline" = "outline";
    let className = "";
    
    switch(severity) {
      case 'critical':
        variant = "destructive";
        className = "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
        break;
      case 'high':
        variant = "destructive";
        className = "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
        break;
      case 'medium':
        variant = "outline";
        className = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
        break;
      case 'low':
        variant = "outline";
        className = "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
        break;
    }
    
    return (
      <Badge variant={variant} className={className}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  return (
    <>
      <Helmet>
        <title>AI Analysis Demo | InfrAudit</title>
        <meta name="description" content="Experience InfrAudit's AI-powered analysis for cloud resource cost optimization and security drift detection." />
      </Helmet>

      <div className="container max-w-7xl mx-auto py-12 px-4 md:px-6">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
            <Zap className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">AI-Powered Resource Analysis</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Detect cost anomalies and security drifts with our advanced AI analysis. Optimize your cloud infrastructure with intelligent recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Resource Configuration</CardTitle>
              <CardDescription>Enter resource details or load an example</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => loadExample('ec2')}>
                    EC2 Example
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => loadExample('s3')}>
                    S3 Example
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => loadExample('rds')}>
                    RDS Example
                  </Button>
                </div>
                <Textarea 
                  placeholder="Paste your JSON resource configuration here..." 
                  value={resourceJson}
                  onChange={(e) => setResourceJson(e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="default"
                onClick={analyzeResource}
                disabled={analyzing}
                className="w-full"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Analyze Resource
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>AI-generated insights and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              {analyzing ? (
                <div className="flex flex-col items-center justify-center h-80 space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">
                    Analyzing resource configuration with AI...
                  </p>
                </div>
              ) : results ? (
                <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="cost" className="flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Cost Analysis
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Security Analysis
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="cost" className="space-y-4 pt-4">
                    {results.costAnalysis.detected ? (
                      <div className="rounded-lg border p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${
                            results.costAnalysis.severity === 'low' ? 'text-blue-500' :
                            results.costAnalysis.severity === 'medium' ? 'text-yellow-500' :
                            results.costAnalysis.severity === 'high' ? 'text-orange-500' : 'text-red-500'
                          }`} />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">Cost Anomaly Detected</h3>
                              {getSeverityBadge(results.costAnalysis.severity)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {results.costAnalysis.description}
                            </p>
                            {results.costAnalysis.estimatedSavings > 0 && (
                              <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-3 py-2 rounded-md text-sm font-medium mb-3">
                                Estimated monthly savings: ${results.costAnalysis.estimatedSavings.toFixed(2)}
                              </div>
                            )}
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Recommendations:</h4>
                              <ul className="space-y-1">
                                {results.costAnalysis.recommendations.map((rec: string, index: number) => (
                                  <li key={index} className="text-sm flex items-start gap-2">
                                    <span className="text-green-500 font-bold">•</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                        <h3 className="text-lg font-medium">No Cost Anomalies Detected</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-md">
                          We didn't detect any significant cost anomalies or optimization opportunities for this resource.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="security" className="space-y-4 pt-4">
                    {results.securityAnalysis.detected ? (
                      <div className="rounded-lg border p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${
                            results.securityAnalysis.severity === 'low' ? 'text-blue-500' :
                            results.securityAnalysis.severity === 'medium' ? 'text-yellow-500' :
                            results.securityAnalysis.severity === 'high' ? 'text-orange-500' : 'text-red-500'
                          }`} />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">Security Drift Detected</h3>
                              {getSeverityBadge(results.securityAnalysis.severity)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {results.securityAnalysis.description}
                            </p>
                            
                            {results.securityAnalysis.vulnerabilities.length > 0 && (
                              <div className="space-y-2 mb-3">
                                <h4 className="text-sm font-medium">Vulnerabilities:</h4>
                                <ul className="space-y-1">
                                  {results.securityAnalysis.vulnerabilities.map((vuln: string, index: number) => (
                                    <li key={index} className="text-sm flex items-start gap-2">
                                      <span className="text-red-500 font-bold">•</span>
                                      <span>{vuln}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Recommendations:</h4>
                              <ul className="space-y-1">
                                {results.securityAnalysis.recommendations.map((rec: string, index: number) => (
                                  <li key={index} className="text-sm flex items-start gap-2">
                                    <span className="text-green-500 font-bold">•</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            {results.securityAnalysis.complianceImpact.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <h4 className="text-sm font-medium mb-2">Compliance Impact:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {results.securityAnalysis.complianceImpact.map((compliance: string, index: number) => (
                                    <Badge key={index} variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                      {compliance}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                        <h3 className="text-lg font-medium">No Security Drifts Detected</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-md">
                          We didn't detect any security configuration drifts or vulnerabilities for this resource.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex flex-col items-center justify-center h-80 space-y-4">
                  <Zap className="h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground text-center">
                    Enter resource details and click "Analyze Resource" to get AI-powered insights and recommendations.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center">
                <span className="text-primary font-bold">1</span>
              </div>
              <h3 className="font-medium">Data Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Our AI analyzes your cloud resource configuration and usage patterns to identify potential issues.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center">
                <span className="text-primary font-bold">2</span>
              </div>
              <h3 className="font-medium">Issue Detection</h3>
              <p className="text-sm text-muted-foreground">
                The system detects cost anomalies, security drifts, and potential optimization opportunities.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center">
                <span className="text-primary font-bold">3</span>
              </div>
              <h3 className="font-medium">Smart Recommendations</h3>
              <p className="text-sm text-muted-foreground">
                Get actionable, prioritized recommendations to optimize costs and strengthen security.
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Note: This is a demonstration of InfrAudit's AI capabilities. In the production version, analyses are performed in real-time on your actual cloud resources.
          </p>
        </div>
      </div>
    </>
  );
}