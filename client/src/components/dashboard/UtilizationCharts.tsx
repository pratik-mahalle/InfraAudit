import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Filler,
  ArcElement
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Resource {
  id?: number;
  name: string;
  type: string;
  provider: string;
  region: string;
  status: string;
  cost?: number;
}

interface UtilizationChartsProps {
  resources?: Resource[];
}

const CHART_COLORS = [
  "#0066CC", "#00A36C", "#FF9900", "#DC3545", "#6C757D",
  "#8B5CF6", "#EC4899", "#14B8A6", "#F59E0B", "#6366F1",
];

export function UtilizationCharts({ resources = [] }: UtilizationChartsProps) {
  // Derive chart data from actual resources
  const typeCounts: Record<string, { total: number; active: number }> = {};
  const providerCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};

  resources.forEach(r => {
    // By type
    if (!typeCounts[r.type]) typeCounts[r.type] = { total: 0, active: 0 };
    typeCounts[r.type].total++;
    if (r.status === "running" || r.status === "active") {
      typeCounts[r.type].active++;
    }

    // By provider
    providerCounts[r.provider] = (providerCounts[r.provider] || 0) + 1;

    // By status
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });

  // Bar chart: active % by resource type
  const typeLabels = Object.keys(typeCounts);
  const typeActivePercents = typeLabels.map(t =>
    typeCounts[t].total > 0 ? Math.round((typeCounts[t].active / typeCounts[t].total) * 100) : 0
  );

  const barChartData = {
    labels: typeLabels.map(t => t.replace("k8s-", "K8s ").replace("ec2-", "EC2 ").replace("s3-", "S3 ")),
    datasets: [
      {
        label: "Active (%)",
        data: typeActivePercents,
        backgroundColor: "#0066CC",
      },
      {
        label: "Total Count",
        data: typeLabels.map(t => typeCounts[t].total),
        backgroundColor: "#00A36C",
      },
    ],
  };

  // Doughnut chart: distribution by provider
  const providerLabels = Object.keys(providerCounts);
  const providerValues = providerLabels.map(p => providerCounts[p]);

  const doughnutChartData = {
    labels: providerLabels.map(p => p.charAt(0).toUpperCase() + p.slice(1)),
    datasets: [
      {
        data: providerValues,
        backgroundColor: CHART_COLORS.slice(0, providerLabels.length),
      },
    ],
  };

  // Status distribution doughnut
  const statusLabels = Object.keys(statusCounts);
  const statusValues = statusLabels.map(s => statusCounts[s]);
  const statusColors: Record<string, string> = {
    running: "#10B981", active: "#10B981",
    stopped: "#6B7280", inactive: "#6B7280",
    unknown: "#F59E0B",
  };

  const statusDoughnutData = {
    labels: statusLabels.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    datasets: [
      {
        data: statusValues,
        backgroundColor: statusLabels.map(s => statusColors[s] || "#6C757D"),
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const, align: "end" as const },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Count / %" },
        grid: { color: "rgba(0, 0, 0, 0.05)" },
      },
      x: { grid: { display: false } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right" as const },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const pct = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
            return `${context.label}: ${context.parsed} (${pct}%)`;
          },
        },
      },
    },
  };

  if (resources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold font-inter">Resource Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No resources discovered yet. Connect a cloud provider or Kubernetes cluster to see analytics.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold font-inter">Resource Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="byType">
          <TabsList className="mb-4">
            <TabsTrigger value="byType">By Resource Type</TabsTrigger>
            <TabsTrigger value="byProvider">By Provider</TabsTrigger>
            <TabsTrigger value="byStatus">By Status</TabsTrigger>
          </TabsList>

          <TabsContent value="byType">
            <div className="h-[350px] w-full">
              <Bar data={barChartData} options={barOptions} />
            </div>
          </TabsContent>

          <TabsContent value="byProvider">
            <div className="h-[350px] w-full">
              <Doughnut data={doughnutChartData} options={doughnutOptions} />
            </div>
          </TabsContent>

          <TabsContent value="byStatus">
            <div className="h-[350px] w-full">
              <Doughnut data={statusDoughnutData} options={doughnutOptions} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
