import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle,
  DollarSign,
  Info,
  BarChart3,
  LineChart,
  PieChart,
  Filter,
  Download,
  Share2,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Types
type TimeRange = "7d" | "30d" | "90d" | "1y";
type GroupBy = "service" | "region" | "account" | "day" | "week" | "month";
type ChartType = "line" | "bar" | "area";

interface CostData {
  date: string;
  amount: number;
  service?: string;
  region?: string;
  account?: string;
}

interface CostBreakdown {
  name: string;
  value: number;
  percentage: number;
  change: number;
}

interface InteractiveCostAnalysisProps {
  hasCloudCredentials: boolean;
}

interface CostAnomaly {
  service: string;
  date: string;
  amount: number;
  percentage: number;
  severity: string;
  description: string;
}

export function InteractiveCostAnalysis({ hasCloudCredentials }: InteractiveCostAnalysisProps) {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [groupBy, setGroupBy] = useState<GroupBy>("service");
  const [chartType, setChartType] = useState<ChartType>("area");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [showAnomalies, setShowAnomalies] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Calculate the number of selected filters
  const selectedFilters = selectedServices.length + selectedRegions.length;
  
  // Fetch cost data with filters
  const { data: costData, isLoading } = useQuery<CostData[]>({
    queryKey: ['/api/cost-analysis', timeRange, groupBy],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', `/api/cost-analysis?timeRange=${timeRange}&groupBy=${groupBy}`);
        return await res.json();
      } catch (error) {
        console.error('Error fetching cost data:', error);
        return [];
      }
    },
    enabled: hasCloudCredentials
  });
  
  // Fetch services for filtering
  const { data: services = [] } = useQuery<string[]>({
    queryKey: ['/api/cost-analysis/services'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/cost-analysis/services');
        return await res.json();
      } catch (error) {
        console.error('Error fetching services:', error);
        return [];
      }
    },
    enabled: hasCloudCredentials
  });
  
  // Cost breakdown
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  
  // Prepare chart data
  const prepareChartData = () => {
    if (!costData || costData.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    // Group by date
    const dateMap = new Map<string, Record<string, number>>();
    const serviceSet = new Set<string>();
    
    costData.forEach(item => {
      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, {});
      }
      
      const serviceName = item[groupBy as keyof CostData] as string || 'Unknown';
      serviceSet.add(serviceName);
      
      const dateEntry = dateMap.get(item.date)!;
      dateEntry[serviceName] = (dateEntry[serviceName] || 0) + item.amount;
    });
    
    // Sort dates
    const sortedDates = Array.from(dateMap.keys()).sort();
    
    // Get services to display (either selected or all)
    const servicesToShow = selectedServices.length > 0 
      ? Array.from(serviceSet).filter(s => selectedServices.includes(s))
      : Array.from(serviceSet);
    
    // Create datasets
    const datasets = servicesToShow.map((service, index) => {
      const color = getColorForIndex(index);
      
      return {
        label: service,
        data: sortedDates.map(date => dateMap.get(date)?.[service] || 0),
        borderColor: color,
        backgroundColor: chartType === 'area' ? `${color}33` : color,
        fill: chartType === 'area',
        tension: 0.4
      };
    });
    
    return {
      labels: sortedDates,
      datasets
    };
  };
  
  // Color generation helper
  const getColorForIndex = (index: number): string => {
    const colors = [
      '#0066CC', '#00A36C', '#FF9900', '#DC3545', '#6610f2',
      '#fd7e14', '#20c997', '#0dcaf0', '#6f42c1', '#d63384'
    ];
    return colors[index % colors.length];
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          // Use proper typing for the callback
          callback: function(value: any) {
            if (typeof value === 'number') {
              return formatCurrency(value);
            }
            return value;
          }
        }
      },
    },
  };
  
  const chartData = prepareChartData();
  
  // Calculate total spend
  const totalSpend = costData ? costData.reduce((sum, item) => sum + item.amount, 0) : 0;
  
  // Sample anomalies
  const anomalies: CostAnomaly[] = [
    { 
      service: "EC2", 
      date: "2025-05-12", 
      amount: 432.15, 
      percentage: 43, 
      severity: "critical",
      description: "Unexpected compute usage spike in us-east-1"
    },
    { 
      service: "S3", 
      date: "2025-05-14", 
      amount: 213.80, 
      percentage: 22, 
      severity: "warning",
      description: "Unusual storage growth pattern detected"
    }
  ];
  
  // Handle export CSV
  const handleExportCsv = () => {
    if (!costData || costData.length === 0) {
      toast({
        title: "No data to export",
        description: "There is no cost data available to export.",
        variant: "destructive"
      });
      return;
    }
    
    // Prepare data for export
    const csvContent = [
      // Header row
      ["Date", "Service", "Region", "Amount ($)"].join(","),
      // Data rows
      ...(costData || []).map(item => 
        [
          item.date, 
          item.service || "N/A", 
          item.region || "N/A", 
          item.amount.toFixed(2)
        ].join(",")
      )
    ].join("\n");
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cloud-cost-analysis-${timeRange}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export successful",
      description: "Your cost data has been downloaded as a CSV file.",
    });
  };
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <div>
            <CardTitle className="text-lg font-semibold">Interactive Cost Analysis</CardTitle>
            <CardDescription>
              Analyze and visualize cloud spending patterns across multiple dimensions
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <Tabs value={chartType} onValueChange={(value) => setChartType(value as ChartType)} className="mr-2">
              <TabsList className="h-8">
                <TabsTrigger value="line" className="px-2 py-1 h-7">
                  <LineChart className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="bar" className="px-2 py-1 h-7">
                  <BarChart3 className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="area" className="px-2 py-1 h-7">
                  <PieChart className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-1" />
              <span className="hidden md:inline">Filters</span>
              {selectedFilters > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1">{selectedFilters}</Badge>
              )}
            </Button>
            
            <Button 
              variant="outline"
              size="sm" 
              className="h-8"
              onClick={handleExportCsv}
            >
              <Download className="h-4 w-4 mr-1" />
              <span className="hidden md:inline">Export</span>
            </Button>
            
            <Button variant="outline" size="sm" className="h-8">
              <Share2 className="h-4 w-4 mr-1" />
              <span className="hidden md:inline">Share</span>
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="h-8 text-xs w-[130px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
            <SelectTrigger className="h-8 text-xs w-[130px]">
              <SelectValue placeholder="Group By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="region">Region</SelectItem>
              <SelectItem value="account">Account</SelectItem>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 flex items-center"
            onClick={() => setShowAnomalies(!showAnomalies)}
          >
            <Info className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">{showAnomalies ? 'Hide anomalies' : 'Show anomalies'}</span>
          </Button>
        </div>
        
        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-3 p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-background">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Advanced Filters</h4>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="h-7 w-7 p-0">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Services filter */}
              <div>
                <h5 className="text-xs font-medium mb-2">Filter by Services</h5>
                <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto p-1">
                  {services.map(service => (
                    <Badge 
                      key={service}
                      variant={selectedServices.includes(service) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (selectedServices.includes(service)) {
                          setSelectedServices(selectedServices.filter(s => s !== service));
                        } else {
                          setSelectedServices([...selectedServices, service]);
                        }
                      }}
                    >
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Regions filter */}
              <div>
                <h5 className="text-xs font-medium mb-2">Filter by Regions</h5>
                <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto p-1">
                  {['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'eu-central-1'].map(region => (
                    <Badge 
                      key={region}
                      variant={selectedRegions.includes(region) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (selectedRegions.includes(region)) {
                          setSelectedRegions(selectedRegions.filter(r => r !== region));
                        } else {
                          setSelectedRegions([...selectedRegions, region]);
                        }
                      }}
                    >
                      {region}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedServices([]);
                  setSelectedRegions([]);
                }}
              >
                Reset
              </Button>
              <Button 
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ) : !hasCloudCredentials ? (
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Cloud Provider Connection</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mb-4">
              Connect your cloud accounts to see real-time cost data and detailed analytics.
            </p>
            <Button>
              Connect Cloud Provider
            </Button>
          </div>
        ) : costData && costData.length > 0 ? (
          <>
            <div className="relative h-[300px] mb-6">
              {chartType === 'bar' ? (
                <Bar data={chartData} options={chartOptions} />
              ) : (
                <Line data={chartData} options={chartOptions} />
              )}
              
              {/* Display anomalies as markers on the chart */}
              {showAnomalies && anomalies.length > 0 && (
                <div className="absolute top-2 right-2">
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {anomalies.length} Anomalies Detected
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Anomalies Section */}
            {showAnomalies && anomalies.length > 0 && (
              <div className="mb-6 border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-950/30 rounded-md p-3">
                <h3 className="text-sm font-medium flex items-center text-red-700 dark:text-red-400 mb-2">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Cost Anomalies Detected
                </h3>
                <div className="space-y-2">
                  {anomalies.map((anomaly, index) => (
                    <div key={index} className="flex justify-between items-start text-sm p-2 bg-white dark:bg-gray-800 rounded border border-red-100 dark:border-red-900/30">
                      <div>
                        <div className="font-medium">{anomaly.service}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{anomaly.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600 dark:text-red-400">{formatCurrency(anomaly.amount)}</div>
                        <div className="text-xs">
                          +{formatPercentage(anomaly.percentage)} from normal
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">Total Spend</p>
                      <p className="text-xl font-bold">{formatCurrency(totalSpend)}</p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full">
                      <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-2 text-xs">
                    <ArrowUpRight className="h-3 w-3 mr-1 text-danger" />
                    <span className="text-danger">+8.3%</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">vs previous period</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">Forecasted Spend</p>
                      <p className="text-xl font-bold">{formatCurrency(totalSpend * 1.12)}</p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-full">
                      <LineChart className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-2 text-xs">
                    <ArrowUpRight className="h-3 w-3 mr-1 text-danger" />
                    <span className="text-danger">+12%</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">projected growth</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">Optimization Potential</p>
                      <p className="text-xl font-bold">{formatCurrency(totalSpend * 0.23)}</p>
                    </div>
                    <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-full">
                      <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-2 text-xs">
                    <ArrowDownRight className="h-3 w-3 mr-1 text-green-600" />
                    <span className="text-green-600">-23%</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">potential savings</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-3">Top Services by Cost</h3>
              <div className="space-y-3">
                {costData.reduce((acc, item) => {
                  if (item.service) {
                    if (!acc[item.service]) {
                      acc[item.service] = 0;
                    }
                    acc[item.service] += item.amount;
                  }
                  return acc;
                }, {} as Record<string, number>)
                .entries()
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([service, cost], index) => (
                  <div key={service} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: getColorForIndex(index) }}
                      />
                      <span>{service}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">{formatCurrency(cost)}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">
                        ({formatPercentage((cost / totalSpend) * 100)})
                      </span>
                      <ChevronRight className="h-4 w-4 ml-1 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Cost Data Available</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mb-4">
              There is no cost data available for the selected time range and filters.
            </p>
            <Button onClick={() => {
              setTimeRange("30d");
              setSelectedServices([]);
              setSelectedRegions([]);
            }}>
              Reset Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}