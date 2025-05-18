import { useState, useEffect } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronRight, 
  AlertTriangle,
  DollarSign,
  Info,
  BarChart3,
  LineChart,
  PieChart,
  Filter,
  Download,
  Share2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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

export function InteractiveCostAnalysis({ hasCloudCredentials }: InteractiveCostAnalysisProps) {
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
  
  useEffect(() => {
    if (costData && costData.length > 0) {
      // Group and calculate cost breakdown
      const breakdown: Record<string, number> = {};
      let total = 0;
      
      costData.forEach(cost => {
        const key = cost[groupBy as keyof CostData] as string || 'Unknown';
        breakdown[key] = (breakdown[key] || 0) + cost.amount;
        total += cost.amount;
      });
      
      // Calculate percentages and format for display
      const formattedBreakdown: CostBreakdown[] = Object.entries(breakdown)
        .map(([name, value]) => ({
          name,
          value,
          percentage: (value / total) * 100,
          change: Math.random() * 30 - 15 // Placeholder for change data
        }))
        .sort((a, b) => b.value - a.value);
      
      setCostBreakdown(formattedBreakdown);
    } else {
      setCostBreakdown([]);
    }
  }, [costData, groupBy]);
  
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
  const totalSpend = costBreakdown.reduce((sum, item) => sum + item.value, 0);
  
  // Generate time range options text
  const getTimeRangeText = (range: TimeRange) => {
    switch (range) {
      case "7d": return "Last 7 days";
      case "30d": return "Last 30 days";
      case "90d": return "Last 90 days";
      case "1y": return "Last 12 months";
    }
  };
  
  // For demo purposes, mock some anomalies
  const anomalies = [
    { 
      service: "EC2", 
      date: "2025-05-12", 
      amount: 432.15, 
      percentage: 43, 
      severity: "critical" 
    },
    { 
      service: "S3", 
      date: "2025-05-14", 
      amount: 213.80, 
      percentage: 22, 
      severity: "warning" 
    }
  ];
  
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
              onClick={() => {
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
              }}
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
          
          <Button variant="outline" size="sm" className="h-8 flex items-center">
            <Info className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Show anomalies</span>
          </Button>
        </div>
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
            <div className="h-[300px] mb-6">
              {chartType === 'bar' ? (
                <Bar data={chartData} options={chartOptions} />
              ) : (
                <Line data={chartData} options={chartOptions} />
              )}
            </div>
            
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
            
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-3">{groupBy.charAt(0).toUpperCase() + groupBy.slice(1)} Breakdown</h3>
              <div className="space-y-3">
                {costBreakdown.slice(0, 5).map((item) => (
                  <div key={item.name} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <span className="font-medium">{item.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {formatPercentage(item.percentage)}
                        </Badge>
                      </div>
                      <span className="font-semibold">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-end mt-1 text-xs">
                      <span className={item.change > 0 ? 'text-danger flex items-center' : 'text-green-600 flex items-center'}>
                        {item.change > 0 ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {item.change > 0 ? '+' : ''}{Math.abs(item.change).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {costBreakdown.length > 5 && (
                <Button variant="ghost" size="sm" className="w-full mt-2">
                  Show all {costBreakdown.length} items
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
            
            {showAnomalies && anomalies.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Detected Cost Anomalies</h3>
                <div className="space-y-3">
                  {anomalies.map((anomaly, index) => (
                    <div key={index} className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                          <span className="font-medium">{anomaly.service}</span>
                          <Badge variant={anomaly.severity === 'critical' ? 'destructive' : 'outline'} className="ml-2">
                            {anomaly.severity}
                          </Badge>
                        </div>
                        <span className="font-semibold">{formatCurrency(anomaly.amount)}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {anomaly.percentage}% increase detected on {anomaly.date}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
            <Info className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Data Available</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              There is no cost data available for the selected time range and filters.
              Try adjusting your filters or time period.
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 pb-3">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Data shown for {getTimeRangeText(timeRange)} • Last updated: {new Date().toLocaleString()}
        </div>
      </CardFooter>
    </Card>
  );
}