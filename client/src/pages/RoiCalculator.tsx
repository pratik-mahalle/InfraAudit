import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Loader2, DollarSign, BarChart, Shield, TrendingDown, HelpCircle, Download, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Chart imports (commented out for now)
// import { Bar, Line } from 'react-chartjs-2';
// import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
// ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

type CloudProvider = 'aws' | 'azure' | 'gcp' | 'multi';
type CompanySize = 'startup' | 'smb' | 'enterprise';

interface CalculatorInputs {
  monthlyCloudSpend: number;
  companySize: CompanySize;
  resourceCount: number;
  cloudProvider: CloudProvider;
  securityIncidents: number;
  enableAI: boolean;
  optimizationLevel: number; // 1-3
}

interface SavingsResult {
  costSavings: {
    monthly: number;
    yearly: number;
    threeYear: number;
    percentage: number;
  };
  securitySavings: {
    incidentReduction: number;
    costAvoidance: number;
  };
  timeToValue: number; // days
  roi: number; // percentage
  paybackPeriod: number; // months
}

export default function RoiCalculator() {
  const { toast } = useToast();
  const [calculating, setCalculating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'calculator' | 'results'>('calculator');
  
  const [inputs, setInputs] = useState<CalculatorInputs>({
    monthlyCloudSpend: 10000,
    companySize: 'smb',
    resourceCount: 100,
    cloudProvider: 'aws',
    securityIncidents: 2,
    enableAI: true,
    optimizationLevel: 2,
  });
  
  const [results, setResults] = useState<SavingsResult>({
    costSavings: {
      monthly: 0,
      yearly: 0,
      threeYear: 0,
      percentage: 0,
    },
    securitySavings: {
      incidentReduction: 0,
      costAvoidance: 0,
    },
    timeToValue: 0,
    roi: 0,
    paybackPeriod: 0,
  });
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Format percentage values
  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      maximumFractionDigits: 1,
    }).format(value / 100);
  };
  
  // Handle input changes
  const handleInputChange = (field: keyof CalculatorInputs, value: any) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };
  
  // Calculate estimated savings
  const calculateSavings = () => {
    setCalculating(true);
    
    // Simulate calculation delay
    setTimeout(() => {
      try {
        // Base savings percentage based on company size and cloud provider
        let baseSavingsPercentage = 0;
        
        switch (inputs.companySize) {
          case 'startup':
            baseSavingsPercentage = 25; // 25% baseline savings for startups
            break;
          case 'smb':
            baseSavingsPercentage = 22; // 22% baseline savings for SMBs
            break;
          case 'enterprise':
            baseSavingsPercentage = 18; // 18% baseline savings for enterprises (already have some optimizations)
            break;
        }
        
        // Adjust for cloud provider
        switch (inputs.cloudProvider) {
          case 'aws':
            // Base case, no adjustment
            break;
          case 'azure':
            baseSavingsPercentage *= 1.05; // 5% more savings potential
            break;
          case 'gcp':
            baseSavingsPercentage *= 1.02; // 2% more savings potential
            break;
          case 'multi':
            baseSavingsPercentage *= 1.15; // 15% more savings potential for multi-cloud
            break;
        }
        
        // Adjust for resource count (more resources = more optimization opportunities)
        const resourceFactor = Math.min(1.3, 1 + (inputs.resourceCount / 1000) * 0.3);
        baseSavingsPercentage *= resourceFactor;
        
        // Adjust for AI enablement
        if (inputs.enableAI) {
          baseSavingsPercentage *= 1.2; // 20% more savings with AI-powered recommendations
        }
        
        // Adjust for optimization level
        baseSavingsPercentage *= (0.8 + (inputs.optimizationLevel * 0.2));
        
        // Cap at 45% maximum savings
        baseSavingsPercentage = Math.min(45, baseSavingsPercentage);
        
        // Calculate cost savings
        const monthlySavings = inputs.monthlyCloudSpend * (baseSavingsPercentage / 100);
        const yearlySavings = monthlySavings * 12;
        const threeYearSavings = yearlySavings * 3;
        
        // Calculate security savings
        const incidentReduction = inputs.securityIncidents * 0.6; // 60% reduction in security incidents
        const costPerIncident = inputs.companySize === 'enterprise' ? 150000 : 
                                inputs.companySize === 'smb' ? 50000 : 20000;
        const securityCostAvoidance = incidentReduction * costPerIncident;
        
        // Calculate ROI metrics
        // Assume annual InfraAudit cost is 10% of annual savings
        const annualCost = yearlySavings * 0.1;
        const threeYearCost = annualCost * 3;
        const roi = ((threeYearSavings + securityCostAvoidance) / threeYearCost - 1) * 100;
        const paybackPeriod = (annualCost / yearlySavings) * 12; // in months
        
        // Time to value based on company size
        const timeToValue = inputs.companySize === 'enterprise' ? 21 : 
                           inputs.companySize === 'smb' ? 14 : 7; // days
        
        // First update the results state
        setResults({
          costSavings: {
            monthly: monthlySavings,
            yearly: yearlySavings,
            threeYear: threeYearSavings,
            percentage: baseSavingsPercentage,
          },
          securitySavings: {
            incidentReduction: incidentReduction,
            costAvoidance: securityCostAvoidance,
          },
          timeToValue: timeToValue,
          roi: roi,
          paybackPeriod: paybackPeriod,
        });
        
        // Then update UI states in the correct order
        setShowResults(true);
        setCalculating(false);
        
        // Use a small delay to ensure state updates have propagated before switching tabs
        setTimeout(() => {
          setActiveTab('results');
          
          toast({
            title: "ROI Analysis Complete",
            description: `Estimated ${formatPercentage(baseSavingsPercentage)} cost reduction with InfraAudit`,
          });
        }, 100);
        
      } catch (error) {
        console.error("Error calculating savings:", error);
        setCalculating(false);
        toast({
          title: "Calculation Error",
          description: "There was an error calculating your potential savings. Please try again.",
          variant: "destructive"
        });
      }
    }, 1500);
  };
  
  // Reset calculator
  const resetCalculator = () => {
    setInputs({
      monthlyCloudSpend: 10000,
      companySize: 'smb',
      resourceCount: 100,
      cloudProvider: 'aws',
      securityIncidents: 2,
      enableAI: true,
      optimizationLevel: 2,
    });
    setShowResults(false);
    setActiveTab('calculator');
  };
  
  // Generate PDF report (placeholder)
  const generateReport = () => {
    toast({
      title: "Report Generation",
      description: "Your ROI report is being prepared and will be available for download soon.",
    });
  };
  
  // Send results via email (placeholder)
  const emailResults = () => {
    toast({
      title: "Email Sent",
      description: "A detailed ROI analysis has been sent to your email address.",
    });
  };
  
  return (
    <>
      <Helmet>
        <title>ROI Calculator | InfraAudit</title>
        <meta name="description" content="Calculate your potential cost savings and ROI with InfraAudit's cloud optimization platform." />
      </Helmet>
      
      <div className="container max-w-7xl mx-auto py-12 px-4 md:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Cloud Savings Calculator</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Estimate how much your organization could save with InfraAudit's AI-powered cloud optimization platform.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 lg:col-start-3">
            <Card>
              <CardHeader>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'calculator' | 'results')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="calculator" disabled={calculating}>Input Parameters</TabsTrigger>
                    <TabsTrigger value="results" disabled={!showResults || calculating}>Savings Analysis</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              
              <CardContent className="pt-6">
                {activeTab === 'calculator' && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="monthly-spend" className="text-base">
                          Monthly Cloud Spend
                        </Label>
                        <div className="flex items-center mt-2">
                          <DollarSign className="h-5 w-5 text-muted-foreground mr-2" />
                          <Input
                            id="monthly-spend"
                            type="number"
                            value={inputs.monthlyCloudSpend}
                            onChange={(e) => handleInputChange('monthlyCloudSpend', parseInt(e.target.value) || 0)}
                            placeholder="Monthly cloud spend in USD"
                            className="flex-1"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your current average monthly spending across all cloud providers.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="company-size" className="text-base">Company Size</Label>
                          <Select
                            value={inputs.companySize}
                            onValueChange={(value) => handleInputChange('companySize', value as CompanySize)}
                          >
                            <SelectTrigger id="company-size" className="mt-2">
                              <SelectValue placeholder="Select company size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="startup">Startup (1-50 employees)</SelectItem>
                              <SelectItem value="smb">SMB (51-500 employees)</SelectItem>
                              <SelectItem value="enterprise">Enterprise (500+ employees)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="cloud-provider" className="text-base">Primary Cloud Provider</Label>
                          <Select
                            value={inputs.cloudProvider}
                            onValueChange={(value) => handleInputChange('cloudProvider', value as CloudProvider)}
                          >
                            <SelectTrigger id="cloud-provider" className="mt-2">
                              <SelectValue placeholder="Select cloud provider" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="aws">AWS</SelectItem>
                              <SelectItem value="azure">Azure</SelectItem>
                              <SelectItem value="gcp">Google Cloud</SelectItem>
                              <SelectItem value="multi">Multi-Cloud</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="resource-count" className="text-base">
                          Number of Cloud Resources
                        </Label>
                        <div className="flex items-center mt-2">
                          <Input
                            id="resource-count"
                            type="number"
                            value={inputs.resourceCount}
                            onChange={(e) => handleInputChange('resourceCount', parseInt(e.target.value) || 0)}
                            placeholder="Approximate number of resources"
                            className="flex-1"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Total EC2 instances, S3 buckets, databases, containers, etc.
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="security-incidents" className="text-base">
                          Security Incidents per Year
                        </Label>
                        <div className="flex items-center mt-2">
                          <Input
                            id="security-incidents"
                            type="number"
                            value={inputs.securityIncidents}
                            onChange={(e) => handleInputChange('securityIncidents', parseInt(e.target.value) || 0)}
                            placeholder="Number of security incidents"
                            className="flex-1"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Security incidents, breaches, or compliance violations related to cloud resources.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between">
                            <Label htmlFor="optimization-level" className="text-base">Optimization Level</Label>
                            <span className="text-sm text-muted-foreground">
                              {inputs.optimizationLevel === 1 ? 'Basic' : 
                               inputs.optimizationLevel === 2 ? 'Standard' : 'Advanced'}
                            </span>
                          </div>
                          <Slider
                            id="optimization-level"
                            min={1}
                            max={3}
                            step={1}
                            value={[inputs.optimizationLevel]}
                            onValueChange={(value) => handleInputChange('optimizationLevel', value[0])}
                            className="mt-2"
                          />
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-muted-foreground">Basic</span>
                            <span className="text-xs text-muted-foreground">Standard</span>
                            <span className="text-xs text-muted-foreground">Advanced</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between space-x-2">
                          <Label htmlFor="enable-ai" className="text-base cursor-pointer">
                            Enable AI-Powered Optimizations
                          </Label>
                          <Switch
                            id="enable-ai"
                            checked={inputs.enableAI}
                            onCheckedChange={(checked) => handleInputChange('enableAI', checked)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={calculateSavings}
                      disabled={calculating}
                      className="w-full"
                      size="lg"
                    >
                      {calculating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Calculating Savings...
                        </>
                      ) : (
                        <>
                          Calculate Potential Savings
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
                {activeTab === 'results' && showResults && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-muted/40">
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-muted-foreground mb-1">Annual Savings</p>
                          <p className="text-2xl font-bold text-primary">
                            {formatCurrency(results.costSavings.yearly)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/40">
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-muted-foreground mb-1">Cost Reduction</p>
                          <p className="text-2xl font-bold text-primary">
                            {formatPercentage(results.costSavings.percentage)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/40">
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-muted-foreground mb-1">ROI</p>
                          <p className="text-2xl font-bold text-primary">
                            {formatPercentage(results.roi)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/40">
                        <CardContent className="p-4 text-center">
                          <p className="text-sm text-muted-foreground mb-1">Payback Period</p>
                          <p className="text-2xl font-bold text-primary">
                            {results.paybackPeriod.toFixed(1)} months
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center">
                            <BarChart className="h-5 w-5 mr-2 text-blue-500" />
                            Cost Savings Breakdown
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Monthly Savings</span>
                              <span className="font-medium">{formatCurrency(results.costSavings.monthly)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Annual Savings</span>
                              <span className="font-medium">{formatCurrency(results.costSavings.yearly)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">3-Year Savings</span>
                              <span className="font-medium">{formatCurrency(results.costSavings.threeYear)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Total Cost Reduction</span>
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                {formatPercentage(results.costSavings.percentage)}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Placeholder for chart */}
                          <div className="mt-6 h-40 bg-muted/30 rounded-md flex items-center justify-center">
                            <p className="text-sm text-muted-foreground">Cost savings visualization</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center">
                            <Shield className="h-5 w-5 mr-2 text-green-500" />
                            Security & Compliance Benefits
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Reduced Security Incidents</span>
                              <span className="font-medium">{results.securitySavings.incidentReduction.toFixed(1)} per year</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Security Cost Avoidance</span>
                              <span className="font-medium">{formatCurrency(results.securitySavings.costAvoidance)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Time to Value</span>
                              <span className="font-medium">{results.timeToValue} days</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Total 3-Year Benefits</span>
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                {formatCurrency(results.costSavings.threeYear + results.securitySavings.costAvoidance)}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Placeholder for chart */}
                          <div className="mt-6 h-40 bg-muted/30 rounded-md flex items-center justify-center">
                            <p className="text-sm text-muted-foreground">Security benefits visualization</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        variant="outline"
                        onClick={resetCalculator}
                        className="flex-1"
                      >
                        <TrendingDown className="mr-2 h-4 w-4" />
                        Recalculate
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={generateReport}
                        className="flex-1"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF Report
                      </Button>
                      <Button
                        onClick={emailResults}
                        className="flex-1"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Email Results
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="mt-8 bg-muted/50 rounded-lg p-6">
              <h2 className="text-xl font-medium mb-4 flex items-center">
                <HelpCircle className="h-5 w-5 mr-2 text-blue-500" />
                How We Calculate Savings
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Our ROI calculator uses proprietary algorithms based on data from hundreds of cloud environments to estimate your potential savings. The calculation considers:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li>Typical resource utilization patterns for your industry and company size</li>
                <li>Cost optimization opportunities across compute, storage, networking, and database resources</li>
                <li>Potential security incident reduction and associated cost avoidance</li>
                <li>Implementation and management costs of the InfraAudit platform</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                Note: Actual results may vary based on your specific cloud environment and implementation approach. Contact us for a detailed analysis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}