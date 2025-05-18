import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Recommendation } from "@/types";
import { Badge } from "@/components/ui/badge";
import { CloudIcon } from "lucide-react";

interface CostRecommendationsProps {
  recommendations: Recommendation[];
  isLoading?: boolean;
  onApplyRecommendation?: (id: number) => void;
  onViewDetails?: (id: number) => void;
  getResourceName?: (id: number) => string;
}

export function CostRecommendations({
  recommendations,
  isLoading = false,
  onApplyRecommendation,
  onViewDetails,
  getResourceName,
}: CostRecommendationsProps) {
  const { toast } = useToast();

  const handleApplyRecommendation = (id: number) => {
    if (onApplyRecommendation) {
      onApplyRecommendation(id);
    } else {
      toast({
        title: "Recommendation applied",
        description: "The recommendation has been applied successfully",
      });
    }
  };

  const handleViewDetails = (id: number) => {
    if (onViewDetails) {
      onViewDetails(id);
    } else {
      toast({
        title: "View details",
        description: "Viewing details for recommendation #" + id,
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold font-inter">
          Cost Optimization Recommendations
        </CardTitle>
        <a href="/cost" className="text-primary text-sm font-medium hover:underline">
          Export all
        </a>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="border border-gray-300 rounded-lg p-4">
                <div className="flex justify-between mb-3">
                  <div>
                    <Skeleton className="h-5 w-[200px] mb-1" />
                    <Skeleton className="h-4 w-[300px]" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-5 w-[80px] mb-1" />
                    <Skeleton className="h-4 w-[60px]" />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-9 w-[150px]" />
                  <Skeleton className="h-9 w-[100px]" />
                </div>
              </div>
            ))
          ) : recommendations.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              No cost optimization recommendations available.
            </div>
          ) : (
            recommendations.map((recommendation) => (
              <div key={recommendation.id} className="border border-gray-300 rounded-lg p-4">
                <div className="flex justify-between">
                  <div>
                    <div className="flex items-center mb-1">
                      <h3 className="text-base font-medium">
                        {recommendation.title}
                      </h3>
                      {recommendation.id >= 1000 && (
                        <Badge 
                          variant="outline" 
                          className="ml-2 bg-blue-100/80 text-blue-700 border-blue-200 px-1.5 py-0.5 flex items-center gap-1"
                        >
                          <CloudIcon className="h-3 w-3" />
                          AWS
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {recommendation.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-secondary font-semibold mb-1">
                      {formatCurrency(recommendation.potentialSavings)}/mo
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Potential savings
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap justify-between items-center mb-3">
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <span className="font-medium mr-1">Affected Resources:</span>
                    {recommendation.resourcesAffected && recommendation.resourcesAffected.length > 0
                      ? (getResourceName 
                          ? getResourceName(recommendation.resourcesAffected[0])
                          : `Resource ${recommendation.resourcesAffected[0]}`)
                      : "Multiple resources"}
                    {recommendation.id >= 1000 && <span className="ml-1 text-blue-600">(AWS)</span>}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleApplyRecommendation(recommendation.id)}
                    className="px-4 py-2 bg-primary text-white text-sm font-medium"
                  >
                    Apply Recommendation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleViewDetails(recommendation.id)}
                    className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
