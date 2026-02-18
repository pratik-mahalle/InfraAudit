import { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient, getAccessToken } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, UploadCloud, FileText, Info } from 'lucide-react';

enum BillingFileType {
  AWS_COST_EXPLORER = "AWS_COST_EXPLORER",
  GCP_BILLING_EXPORT = "GCP_BILLING_EXPORT",
  AZURE_COST_MANAGEMENT = "AZURE_COST_MANAGEMENT"
}

export default function BillingImport() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [provider, setProvider] = useState<string>('aws');
  const [fileType, setFileType] = useState<BillingFileType>(BillingFileType.AWS_COST_EXPLORER);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Fetch current billing data status
  const { data: billingStatus, isLoading: isStatusLoading } = useQuery<{
    success: boolean;
    recordCount: number;
    dateRange: { oldest: string; newest: string };
    providerCount: number;
  }>({
    queryKey: ['/api/billing-import/status'],
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 30000,
    enabled: false, // Billing import endpoint not yet available in Go backend
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 200);

      try {
        // Can't use apiRequest because it adds Content-Type: application/json
        // which breaks multipart/form-data uploads
        const headers: Record<string, string> = {};
        const token = getAccessToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('/api/billing-import/upload', {
          method: 'POST',
          headers,
          body: formData,
          credentials: 'include'
          // Don't set Content-Type header as it's automatically set with form boundary
        });
        
        // Clear the progress interval
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || response.statusText);
        }
        
        // Return the response data
        return await response.json();
      } catch (error) {
        // Clear the progress interval in case of error
        clearInterval(progressInterval);
        setUploadProgress(0);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'File Uploaded Successfully',
        description: 'Your billing data has been processed and is now available for cost analysis.',
        variant: 'default',
      });
      
      // Reset form state
      setSelectedFile(null);
      setUploadProgress(0);
      
      // Invalidate queries that depend on billing data
      queryClient.invalidateQueries({ queryKey: ['/api/v1/costs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/v1/costs/trends'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Upload Failed',
        description: error.message || 'There was an error uploading your file. Please try again.',
        variant: 'destructive',
      });
      setUploadProgress(0);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleProviderChange = (value: string) => {
    setProvider(value);
    // Update file type based on provider
    switch (value) {
      case 'aws':
        setFileType(BillingFileType.AWS_COST_EXPLORER);
        break;
      case 'gcp':
        setFileType(BillingFileType.GCP_BILLING_EXPORT);
        break;
      case 'azure':
        setFileType(BillingFileType.AZURE_COST_MANAGEMENT);
        break;
      default:
        setFileType(BillingFileType.AWS_COST_EXPLORER);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a CSV file to upload.',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('provider', provider);
    formData.append('fileType', fileType);

    uploadMutation.mutate(formData);
  };

  const renderInstructions = () => {
    switch (fileType) {
      case BillingFileType.AWS_COST_EXPLORER:
        return (
          <div className="space-y-2 mt-4">
            <h4 className="text-sm font-semibold">AWS Cost Explorer CSV Format</h4>
            <p className="text-sm text-muted-foreground">
              Download a Cost & Usage Report from AWS Cost Explorer with the following columns:
            </p>
            <ul className="text-sm list-disc pl-6 text-muted-foreground">
              <li>Time Period (YYYY-MM-DD)</li>
              <li>Linked Account</li>
              <li>Service</li>
              <li>Amount</li>
              <li>Unit (USD)</li>
              <li>Resource (optional)</li>
              <li>Region (optional)</li>
            </ul>
          </div>
        );
      case BillingFileType.GCP_BILLING_EXPORT:
        return (
          <div className="space-y-2 mt-4">
            <h4 className="text-sm font-semibold">GCP Billing Export CSV Format</h4>
            <p className="text-sm text-muted-foreground">
              Download a Billing Export from GCP with the following columns:
            </p>
            <ul className="text-sm list-disc pl-6 text-muted-foreground">
              <li>Billing Account ID</li>
              <li>Service Description</li>
              <li>Start Time (YYYY-MM-DD)</li>
              <li>Cost</li>
              <li>Currency</li>
              <li>Project ID</li>
              <li>Resource name (optional)</li>
              <li>Location (optional)</li>
            </ul>
          </div>
        );
      case BillingFileType.AZURE_COST_MANAGEMENT:
        return (
          <div className="space-y-2 mt-4">
            <h4 className="text-sm font-semibold">Azure Cost Management CSV Format</h4>
            <p className="text-sm text-muted-foreground">
              Download a Cost Management report from Azure with the following columns:
            </p>
            <ul className="text-sm list-disc pl-6 text-muted-foreground">
              <li>Date (MM/DD/YYYY)</li>
              <li>ServiceName</li>
              <li>ResourceGroup</li>
              <li>ResourceLocation</li>
              <li>ConsumedService</li>
              <li>PreTaxCost</li>
              <li>ResourceId (optional)</li>
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing Data Import</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Import your cloud provider billing data for cost analysis and prediction.</p>
        </div>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList>
          <TabsTrigger value="upload">Upload CSV</TabsTrigger>
          <TabsTrigger value="status">Billing Data Status</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Billing CSV</CardTitle>
              <CardDescription>
                Import your cloud billing data by uploading a CSV file from your cloud provider.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Cloud Provider</label>
                  <Select value={provider} onValueChange={handleProviderChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Providers</SelectLabel>
                        <SelectItem value="aws">Amazon Web Services (AWS)</SelectItem>
                        <SelectItem value="gcp">Google Cloud Platform (GCP)</SelectItem>
                        <SelectItem value="azure">Microsoft Azure</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">File Type</label>
                  <Select value={fileType} onValueChange={(value) => setFileType(value as BillingFileType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select file type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>AWS</SelectLabel>
                        <SelectItem value={BillingFileType.AWS_COST_EXPLORER}>AWS Cost Explorer</SelectItem>
                        <SelectLabel>GCP</SelectLabel>
                        <SelectItem value={BillingFileType.GCP_BILLING_EXPORT}>GCP Billing Export</SelectItem>
                        <SelectLabel>Azure</SelectLabel>
                        <SelectItem value={BillingFileType.AZURE_COST_MANAGEMENT}>Azure Cost Management</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}>
                <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">CSV files only (max 10MB)</p>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept=".csv" 
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {selectedFile && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}

              {uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} max={100} />
                </div>
              )}

              {renderInstructions()}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}>
                Clear
              </Button>
              <Button 
                disabled={!selectedFile || uploadMutation.isPending} 
                onClick={handleUpload}
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload CSV'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Billing Data Status</CardTitle>
              <CardDescription>
                Overview of your cloud billing data in the system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isStatusLoading ? (
                <div className="flex justify-center p-6">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
                </div>
              ) : billingStatus?.recordCount ? (
                <>
                  <Alert variant="default" className="bg-muted">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Billing Data Summary</AlertTitle>
                    <AlertDescription>
                      You have {billingStatus.recordCount} billing records in the system.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="border rounded-lg p-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Date Range</h3>
                      <p className="text-2xl font-bold mt-1">
                        {new Date(billingStatus.dateRange.oldest).toLocaleDateString()} - {new Date(billingStatus.dateRange.newest).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Services</h3>
                      <p className="text-2xl font-bold mt-1">
                        {billingStatus.providerCount}
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Records</h3>
                      <p className="text-2xl font-bold mt-1">
                        {billingStatus.recordCount}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Billing Data Available</AlertTitle>
                  <AlertDescription>
                    You haven't imported any billing data yet. Go to the Upload tab to import your first billing CSV.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Import History</CardTitle>
              <CardDescription>
                History of your billing data import activities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="py-6 flex flex-col items-center justify-center text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">No Import History Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mt-1">
                    When you upload billing CSV files, your import history will appear here.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </DashboardLayout>
  );
}