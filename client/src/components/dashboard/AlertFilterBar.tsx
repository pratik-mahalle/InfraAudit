import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";

interface AlertFilterBarProps {
  alertType: string;
  setAlertType: (value: string) => void;
  alertSeverity: string;
  setAlertSeverity: (value: string) => void;
  alertStatus: string;
  setAlertStatus: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}

export function AlertFilterBar({
  alertType,
  setAlertType,
  alertSeverity,
  setAlertSeverity,
  alertStatus,
  setAlertStatus,
  searchQuery,
  setSearchQuery,
}: AlertFilterBarProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search alerts..."
              className="pl-9 w-full md:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">Filters:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select
              value={alertType}
              onValueChange={setAlertType}
            >
              <SelectTrigger className="w-[130px] h-10">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="cost">Cost</SelectItem>
                <SelectItem value="resource">Resource</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={alertSeverity}
              onValueChange={setAlertSeverity}
            >
              <SelectTrigger className="w-[130px] h-10">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={alertStatus}
              onValueChange={setAlertStatus}
            >
              <SelectTrigger className="w-[130px] h-10">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
