import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UtilizationMetric } from "@/types";

interface ResourceUtilizationProps {
  metrics: UtilizationMetric[];
  isLoading?: boolean;
  awsResources?: any[]; // Real AWS resources
}

export function ResourceUtilization({
  metrics,
  isLoading = false,
  awsResources = [],
}: ResourceUtilizationProps) {
  const [resourceType, setResourceType] = useState("all");
  const [timeframe, setTimeframe] = useState("7d");

  return (
    <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur border border-gray-200/60 dark:border-slate-800/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold font-inter">
          Resource Utilization
        </CardTitle>
        <div className="flex items-center space-x-3">
          <Select
            value={resourceType}
            onValueChange={setResourceType}
          >
            <SelectTrigger className="h-8 text-xs w-[140px] bg-white/60 dark:bg-slate-800/60 border border-gray-300/60 dark:border-slate-700/60">
              <SelectValue placeholder="All Resources" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
              <SelectItem value="all">All Resources</SelectItem>
              <SelectItem value="ec2">EC2 Instances</SelectItem>
              <SelectItem value="s3">S3 Buckets</SelectItem>
              <SelectItem value="rds">RDS Databases</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-gray-600 dark:text-slate-400">Last {timeframe === "7d" ? "7 days" : timeframe === "30d" ? "30 days" : "90 days"}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="aspect-w-16 aspect-h-9 mb-6 rounded-lg flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-slate-800">
          {isLoading ? (
            <Skeleton className="w-full h-full bg-gray-200 dark:bg-slate-700" />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                />
              </svg>
              <span className="text-sm">Resource utilization visualization</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-lg p-4 bg-gray-100 dark:bg-slate-800"
                >
                  <div className="flex justify-between items-start mb-2">
                    <Skeleton className="h-5 w-[120px] bg-gray-200 dark:bg-slate-700" />
                    <Skeleton className="h-5 w-[60px] bg-gray-200 dark:bg-slate-700" />
                  </div>
                  <div className="flex items-end space-x-2">
                    <Skeleton className="h-8 w-[60px] bg-gray-200 dark:bg-slate-700" />
                    <Skeleton className="h-5 w-[100px] bg-gray-200 dark:bg-slate-700" />
                  </div>
                </div>
              ))
            : metrics.map((metric, index) => (
                <div
                  key={index}
                  className="rounded-lg p-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium">{metric.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        metric.status === "healthy"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : metric.status === "warning"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-end space-x-2">
                    <span className="text-2xl font-semibold font-inter">
                      {metric.value}%
                    </span>
                    <span
                      className={`text-xs flex items-center pb-1 ${
                        metric.trend === "down"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {metric.trend === "down" ? (
                        <ArrowDown className="mr-1 h-3 w-3" />
                      ) : (
                        <ArrowUp className="mr-1 h-3 w-3" />
                      )}
                      {metric.change}% vs last week
                    </span>
                  </div>
                </div>
              ))}
        </div>
        
        {/* AWS Resources */}
        {awsResources && awsResources.length > 0 && (
          <div className="mt-6">
            <h3 className="text-base font-medium mb-3">Real-time AWS Resources ({awsResources.length})</h3>
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-slate-800">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                <thead className="bg-gray-50 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Region</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                  {awsResources.slice(0, 5).map((resource, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-slate-200">{resource.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{resource.type}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{resource.region}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          resource.status === 'running' || resource.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-emerald-500/10 dark:text-emerald-400' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-amber-500/10 dark:text-amber-400'
                        }`}>
                          {resource.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {awsResources.length > 5 && (
                <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800/60 text-right text-xs text-blue-600 dark:text-blue-400">
                  + {awsResources.length - 5} more resources
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
