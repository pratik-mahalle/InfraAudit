import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatTimeAgo } from "@/lib/utils";
import { ArrowDownUp, Filter, Loader2 } from "lucide-react";

interface ChangeEvent {
  id: string;
  resourceId: number;
  resourceName: string;
  resourceType: string;
  changeType: 'created' | 'updated' | 'deleted' | 'configuration' | 'security';
  timestamp: string;
  user: string;
  details: string;
  impact: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

interface ChangeTimelineProps {
  changes?: ChangeEvent[];
  isLoading?: boolean;
}

export function ChangeTimeline({ changes = [], isLoading = false }: ChangeTimelineProps) {
  const [filteredChangeType, setFilteredChangeType] = useState<string>("all");
  const [filteredImpact, setFilteredImpact] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredChanges = changes
    .filter(change => 
      (filteredChangeType === "all" || change.changeType === filteredChangeType) &&
      (filteredImpact === "all" || change.impact === filteredImpact)
    )
    .sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'none': return 'bg-gray-100 text-gray-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'created': return 'bg-green-100 text-green-800';
      case 'updated': return 'bg-blue-100 text-blue-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      case 'configuration': return 'bg-purple-100 text-purple-800';
      case 'security': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Change Timeline</CardTitle>
          <CardDescription>
            Audit trail of infrastructure changes with user, time, and impact
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filteredChangeType} onValueChange={setFilteredChangeType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Change Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="created">Created</SelectItem>
              <SelectItem value="updated">Updated</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
              <SelectItem value="configuration">Configuration</SelectItem>
              <SelectItem value="security">Security</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filteredImpact} onValueChange={setFilteredImpact}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Impact" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Impacts</SelectItem>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading change history...</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChanges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No changes found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredChanges.map((change) => (
                    <TableRow key={change.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{change.resourceName}</span>
                          <span className="text-xs text-muted-foreground">{change.resourceType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getChangeTypeColor(change.changeType)} variant="outline">
                          {change.changeType}
                        </Badge>
                      </TableCell>
                      <TableCell>{change.user}</TableCell>
                      <TableCell>
                        <Badge className={getImpactColor(change.impact)} variant="outline">
                          {change.impact}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(change.timestamp)}
                          </span>
                          <span className="text-xs">
                            {new Date(change.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {change.details}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}