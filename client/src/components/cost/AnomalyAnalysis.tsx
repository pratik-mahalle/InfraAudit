import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, DollarSign, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CostAnomaly } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AnomalyAnalysisProps {
  anomaly: CostAnomaly;
  isOpen: boolean;
  onClose: () => void;
}

export function AnomalyAnalysis({ anomaly, isOpen, onClose }: AnomalyAnalysisProps) {
  const { toast } = useToast();
  const [analyzed, setAnalyzed] = useState(false);
  
  // Fetch the AI analysis for this anomaly
  const { 
    data: analysis,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["/api/ai-cost/analyze-anomaly", anomaly.id],
    queryFn: async () => {
      const response = await fetch(`/api/ai-cost/analyze-anomaly/${anomaly.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch anomaly analysis");
      }
      return response.json();
    },
    enabled: false,
  });

  // Function to analyze the anomaly
  const handleAnalyze = async () => {
    try {
      await refetch();
      setAnalyzed(true);
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze cost anomaly",
        variant: "destructive",
      });
    }
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value / 100); // Convert from cents to dollars
  };

  // Get severity badge color
  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <span>Cost Anomaly Analysis</span>
          </DialogTitle>
          <DialogDescription>
            AI-powered analysis of the cost anomaly and recommended actions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Anomaly Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Anomaly Type</h3>
              <p className="font-medium">{anomaly.anomalyType}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Severity</h3>
              <Badge className={getSeverityColor(anomaly.severity)}>{anomaly.severity}</Badge>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Previous Cost</h3>
              <p className="font-medium">{formatCurrency(anomaly.previousCost)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Current Cost</h3>
              <p className="font-medium text-red-600">{formatCurrency(anomaly.currentCost)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Increase</h3>
              <p className="font-medium text-red-600">
                {anomaly.percentage.toFixed(1)}%
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Detected At</h3>
              <p className="font-medium">
                {new Date(anomaly.detectedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <Separator />

          {/* AI Analysis */}
          {!analyzed ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Button 
                onClick={handleAnalyze} 
                className="mb-2" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Analyze with AI
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                Get AI-powered insights on cause and remediation steps
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-muted-foreground">Analyzing anomaly data...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-4">
              {/* Root Causes */}
              {analysis.root_causes && (
                <div>
                  <h3 className="text-md font-medium mb-2">Root Causes</h3>
                  <ul className="space-y-2">
                    {analysis.root_causes.map((cause: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <ArrowRight className="h-5 w-5 mr-2 text-blue-500 shrink-0 mt-0.5" />
                        <span>{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Impact */}
              {analysis.impact && (
                <div>
                  <h3 className="text-md font-medium mb-2">Business Impact</h3>
                  <p>{analysis.impact}</p>
                </div>
              )}

              {/* Recommended Actions */}
              {analysis.recommended_actions && (
                <div>
                  <h3 className="text-md font-medium mb-2">Recommended Actions</h3>
                  <ul className="space-y-2">
                    {analysis.recommended_actions.map((action: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <ArrowRight className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Forecast */}
              {analysis.forecast && (
                <div>
                  <h3 className="text-md font-medium mb-2">Cost Forecast</h3>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-muted-foreground" />
                      <p>{analysis.forecast}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Analysis failed. Please try again.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {analyzed && analysis && (
            <Button onClick={handleAnalyze}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Analysis
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}