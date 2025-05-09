import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Calculator, Coins, Info, Loader2, PiggyBank, TrendingDown, TrendingUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface SavingsPlan {
  id: string;
  type: string;
  term: number; // in months
  upfrontPayment: number;
  monthlyCommitment: number;
  estimatedCoverage: number; // percentage
  estimatedSavings: number; // percentage
  totalSavingsAmount: number;
  resourceTypes: string[];
  regions: string[];
  provider: string;
}

interface ReservedInstance {
  id: string;
  instanceType: string;
  region: string;
  term: number; // in months
  paymentOption: "all_upfront" | "partial_upfront" | "no_upfront";
  upfrontPayment: number;
  monthlyPayment: number;
  onDemandCost: number;
  savingsPercentage: number;
  totalSavingsAmount: number;
  provider: string;
}

interface UsagePattern {
  resourceType: string;
  region: string;
  monthlyHours: number;
  averageUtilization: number;
  onDemandCost: number;
  provider: string;
}

interface SavingsPlansOptimizerProps {
  savingsPlans?: SavingsPlan[];
  reservedInstances?: ReservedInstance[];
  usagePatterns?: UsagePattern[];
  isLoading?: boolean;
  onPurchase?: (items: string[], type: 'savings_plan' | 'reserved_instance') => void;
}

export function SavingsPlansOptimizer({
  savingsPlans = [],
  reservedInstances = [],
  usagePatterns = [],
  isLoading = false,
  onPurchase
}: SavingsPlansOptimizerProps) {
  const [selectedSavingsPlans, setSelectedSavingsPlans] = useState<string[]>([]);
  const [selectedRIs, setSelectedRIs] = useState<string[]>([]);
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const { toast } = useToast();

  const filteredSavingsPlans = savingsPlans.filter(
    plan => filterProvider === "all" || plan.provider === filterProvider
  );

  const filteredRIs = reservedInstances.filter(
    ri => filterProvider === "all" || ri.provider === filterProvider
  );

  const handleSelectAllSavingsPlans = () => {
    if (selectedSavingsPlans.length === filteredSavingsPlans.length) {
      setSelectedSavingsPlans([]);
    } else {
      setSelectedSavingsPlans(filteredSavingsPlans.map(p => p.id));
    }
  };

  const handleSelectSavingsPlan = (id: string) => {
    setSelectedSavingsPlans(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const handleSelectAllRIs = () => {
    if (selectedRIs.length === filteredRIs.length) {
      setSelectedRIs([]);
    } else {
      setSelectedRIs(filteredRIs.map(ri => ri.id));
    }
  };

  const handleSelectRI = (id: string) => {
    setSelectedRIs(prev =>
      prev.includes(id)
        ? prev.filter(ri => ri !== id)
        : [...prev, id]
    );
  };

  const handlePurchaseSavingsPlans = () => {
    if (selectedSavingsPlans.length === 0) {
      toast({
        title: "No savings plans selected",
        description: "Please select at least one savings plan to purchase.",
      });
      return;
    }

    onPurchase?.(selectedSavingsPlans, 'savings_plan');

    // For demo purposes
    toast({
      title: "Savings Plans Purchase Initiated",
      description: `${selectedSavingsPlans.length} savings plans have been initiated for purchase.`,
    });

    setSelectedSavingsPlans([]);
  };

  const handlePurchaseRIs = () => {
    if (selectedRIs.length === 0) {
      toast({
        title: "No Reserved Instances selected",
        description: "Please select at least one Reserved Instance to purchase.",
      });
      return;
    }

    onPurchase?.(selectedRIs, 'reserved_instance');

    // For demo purposes
    toast({
      title: "Reserved Instances Purchase Initiated",
      description: `${selectedRIs.length} reserved instances have been initiated for purchase.`,
    });

    setSelectedRIs([]);
  };

  const totalSavingsPlansAmount = selectedSavingsPlans
    .map(id => savingsPlans.find(p => p.id === id)?.totalSavingsAmount || 0)
    .reduce((sum, amount) => sum + amount, 0);

  const totalRIsAmount = selectedRIs
    .map(id => reservedInstances.find(ri => ri.id === id)?.totalSavingsAmount || 0)
    .reduce((sum, amount) => sum + amount, 0);

  const providerOptions = Array.from(
    new Set([
      ...savingsPlans.map(plan => plan.provider),
      ...reservedInstances.map(ri => ri.provider)
    ])
  );

  // Prepare data for charts
  const savingsPlansByCoverage = [
    { name: '0-25%', value: 0 },
    { name: '26-50%', value: 0 },
    { name: '51-75%', value: 0 },
    { name: '76-100%', value: 0 },
  ];

  savingsPlans.forEach(plan => {
    if (plan.estimatedCoverage <= 25) {
      savingsPlansByCoverage[0].value += 1;
    } else if (plan.estimatedCoverage <= 50) {
      savingsPlansByCoverage[1].value += 1;
    } else if (plan.estimatedCoverage <= 75) {
      savingsPlansByCoverage[2].value += 1;
    } else {
      savingsPlansByCoverage[3].value += 1;
    }
  });

  const savingsBySavingsType = [
    { name: 'Savings Plans', value: savingsPlans.reduce((sum, plan) => sum + plan.totalSavingsAmount, 0) },
    { name: 'Reserved Instances', value: reservedInstances.reduce((sum, ri) => sum + ri.totalSavingsAmount, 0) },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  // Helper function to format term in readable form
  const formatTerm = (months: number) => {
    if (months === 12) return "1 Year";
    if (months === 36) return "3 Years";
    return `${months} Months`;
  };

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Savings Plans & Reserved Instances Optimizer</CardTitle>
          <CardDescription>
            Optimize your cloud spend with commitment-based discounts
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterProvider} onValueChange={setFilterProvider}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providerOptions.map(provider => (
                <SelectItem key={provider} value={provider}>{provider}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Analyzing usage patterns and generating recommendations...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="py-4 px-6">
                  <CardDescription>Potential Annual Savings</CardDescription>
                  <CardTitle className="text-3xl flex items-center">
                    {formatCurrency(
                      savingsPlans.reduce((sum, plan) => sum + plan.totalSavingsAmount, 0) +
                      reservedInstances.reduce((sum, ri) => sum + ri.totalSavingsAmount, 0)
                    )}
                    <TrendingDown className="h-5 w-5 text-green-500 ml-2" />
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="py-4 px-6">
                  <CardDescription>Commitment Recommendations</CardDescription>
                  <CardTitle className="text-3xl flex items-center">
                    {savingsPlans.length + reservedInstances.length}
                    <PiggyBank className="h-5 w-5 text-blue-500 ml-2" />
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="py-4 px-6">
                  <CardDescription>Average Discount</CardDescription>
                  <CardTitle className="text-3xl flex items-center">
                    {Math.round(
                      (savingsPlans.reduce((sum, plan) => sum + plan.estimatedSavings, 0) / 
                        (savingsPlans.length || 1) +
                      reservedInstances.reduce((sum, ri) => sum + ri.savingsPercentage, 0) / 
                        (reservedInstances.length || 1)) / 2
                    )}%
                    <Coins className="h-5 w-5 text-yellow-500 ml-2" />
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Coverage by Percentage</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={savingsPlansByCoverage}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        nameKey="name"
                        label={(entry) => `${entry.name}: ${entry.value}`}
                      >
                        {savingsPlansByCoverage.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} plans`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Savings by Type</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={savingsBySavingsType}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <Tooltip formatter={(value: number) => [`$${value}`, 'Savings']} />
                      <Bar dataKey="value" fill="#8884d8" name="Annual Savings" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="savings_plans" className="mt-6">
              <TabsList className="mb-4">
                <TabsTrigger value="savings_plans">Savings Plans</TabsTrigger>
                <TabsTrigger value="reserved_instances">Reserved Instances</TabsTrigger>
                <TabsTrigger value="usage_patterns">Usage Patterns</TabsTrigger>
              </TabsList>
              
              <TabsContent value="savings_plans">
                {selectedSavingsPlans.length > 0 && (
                  <div className="bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 rounded-md p-4 mb-4 flex items-center justify-between">
                    <div>
                      <span className="font-medium">{selectedSavingsPlans.length} savings plans selected</span>
                      <p className="text-sm text-muted-foreground">
                        Potential annual savings: {formatCurrency(totalSavingsPlansAmount)}
                      </p>
                    </div>
                    <Button 
                      onClick={handlePurchaseSavingsPlans}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <PiggyBank className="mr-2 h-4 w-4" />
                      Purchase Selected
                    </Button>
                  </div>
                )}
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox 
                            checked={selectedSavingsPlans.length === filteredSavingsPlans.length && filteredSavingsPlans.length > 0}
                            onCheckedChange={handleSelectAllSavingsPlans}
                          />
                        </TableHead>
                        <TableHead>Plan Details</TableHead>
                        <TableHead>Coverage</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Savings</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSavingsPlans.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No savings plans available for the selected provider
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSavingsPlans.map((plan) => (
                          <TableRow key={plan.id}>
                            <TableCell>
                              <Checkbox 
                                checked={selectedSavingsPlans.includes(plan.id)}
                                onCheckedChange={() => handleSelectSavingsPlan(plan.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="font-medium">{plan.type} Savings Plan</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Badge variant="outline" className="text-xs h-5">
                                    {formatTerm(plan.term)}
                                  </Badge>
                                  <span className="mx-1">•</span>
                                  <Badge variant="outline" className="text-xs h-5">
                                    {plan.provider}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  For: {plan.resourceTypes.join(', ')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Regions: {plan.regions.join(', ')}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                                  <div 
                                    className={`h-full rounded-full ${
                                      plan.estimatedCoverage < 25 ? 'bg-red-500' : 
                                      plan.estimatedCoverage < 50 ? 'bg-orange-500' : 
                                      plan.estimatedCoverage < 75 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${plan.estimatedCoverage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm">{plan.estimatedCoverage}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                {plan.upfrontPayment > 0 && (
                                  <div className="text-sm">
                                    <span className="font-medium">{formatCurrency(plan.upfrontPayment)}</span>
                                    <span className="text-xs text-muted-foreground ml-1">upfront</span>
                                  </div>
                                )}
                                <div className="text-sm">
                                  <span className="font-medium">{formatCurrency(plan.monthlyCommitment)}</span>
                                  <span className="text-xs text-muted-foreground ml-1">per month</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="text-sm">
                                  <span className="font-medium text-green-600">{plan.estimatedSavings}%</span>
                                  <span className="text-xs text-muted-foreground ml-1">discount</span>
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium text-green-600">{formatCurrency(plan.totalSavingsAmount)}</span>
                                  <span className="text-xs text-muted-foreground ml-1">per year</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mr-2"
                                  onClick={() => {
                                    toast({
                                      title: "Savings Plan Details",
                                      description: `${plan.type} plan with ${plan.estimatedSavings}% savings across ${plan.resourceTypes.join(', ')} in ${plan.regions.join(', ')}.`,
                                    });
                                  }}
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSelectSavingsPlan(plan.id)}
                                >
                                  {selectedSavingsPlans.includes(plan.id) ? "Deselect" : "Select"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="reserved_instances">
                {selectedRIs.length > 0 && (
                  <div className="bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 rounded-md p-4 mb-4 flex items-center justify-between">
                    <div>
                      <span className="font-medium">{selectedRIs.length} reserved instances selected</span>
                      <p className="text-sm text-muted-foreground">
                        Potential annual savings: {formatCurrency(totalRIsAmount)}
                      </p>
                    </div>
                    <Button 
                      onClick={handlePurchaseRIs}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <PiggyBank className="mr-2 h-4 w-4" />
                      Purchase Selected
                    </Button>
                  </div>
                )}
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox 
                            checked={selectedRIs.length === filteredRIs.length && filteredRIs.length > 0}
                            onCheckedChange={handleSelectAllRIs}
                          />
                        </TableHead>
                        <TableHead>Instance Details</TableHead>
                        <TableHead>Payment Option</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Savings</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRIs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No reserved instances available for the selected provider
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRIs.map((ri) => (
                          <TableRow key={ri.id}>
                            <TableCell>
                              <Checkbox 
                                checked={selectedRIs.includes(ri.id)}
                                onCheckedChange={() => handleSelectRI(ri.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="font-medium">{ri.instanceType}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Badge variant="outline" className="text-xs h-5">
                                    {formatTerm(ri.term)}
                                  </Badge>
                                  <span className="mx-1">•</span>
                                  <Badge variant="outline" className="text-xs h-5">
                                    {ri.provider}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Region: {ri.region}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {ri.paymentOption === "all_upfront" 
                                  ? "All Upfront" 
                                  : ri.paymentOption === "partial_upfront" 
                                    ? "Partial Upfront" 
                                    : "No Upfront"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                {ri.upfrontPayment > 0 && (
                                  <div className="text-sm">
                                    <span className="font-medium">{formatCurrency(ri.upfrontPayment)}</span>
                                    <span className="text-xs text-muted-foreground ml-1">upfront</span>
                                  </div>
                                )}
                                <div className="text-sm">
                                  <span className="font-medium">{formatCurrency(ri.monthlyPayment)}</span>
                                  <span className="text-xs text-muted-foreground ml-1">per month</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  (On-demand: {formatCurrency(ri.onDemandCost)}/mo)
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="text-sm">
                                  <span className="font-medium text-green-600">{ri.savingsPercentage}%</span>
                                  <span className="text-xs text-muted-foreground ml-1">discount</span>
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium text-green-600">{formatCurrency(ri.totalSavingsAmount)}</span>
                                  <span className="text-xs text-muted-foreground ml-1">per year</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mr-2"
                                  onClick={() => {
                                    toast({
                                      title: "Reserved Instance Details",
                                      description: `${ri.instanceType} in ${ri.region} with ${ri.savingsPercentage}% savings compared to on-demand pricing.`,
                                    });
                                  }}
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSelectRI(ri.id)}
                                >
                                  {selectedRIs.includes(ri.id) ? "Deselect" : "Select"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="usage_patterns">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resource Type</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Monthly Usage</TableHead>
                        <TableHead>Utilization</TableHead>
                        <TableHead>Monthly Cost</TableHead>
                        <TableHead>Provider</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usagePatterns.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No usage patterns available
                          </TableCell>
                        </TableRow>
                      ) : (
                        usagePatterns
                          .filter(pattern => filterProvider === "all" || pattern.provider === filterProvider)
                          .map((pattern, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div className="font-medium">{pattern.resourceType}</div>
                              </TableCell>
                              <TableCell>{pattern.region}</TableCell>
                              <TableCell>{pattern.monthlyHours.toLocaleString()} hours</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                                    <div 
                                      className={`h-full rounded-full ${
                                        pattern.averageUtilization < 30 ? 'bg-red-500' : 
                                        pattern.averageUtilization < 60 ? 'bg-yellow-500' : 'bg-green-500'
                                      }`}
                                      style={{ width: `${pattern.averageUtilization}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm">{pattern.averageUtilization}%</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(pattern.onDemandCost)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{pattern.provider}</Badge>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}