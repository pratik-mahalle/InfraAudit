import React, { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Line, Bar, Doughnut } from "react-chartjs-2";

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

export function UtilizationCharts() {
  const [timeframe, setTimeframe] = useState("7d");

  // Generate line chart data
  const lineChartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "CPU Utilization",
        data: [35, 40, 30, 50, 45, 60, 38],
        borderColor: "#0066CC",
        backgroundColor: "rgba(0, 102, 204, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Memory Usage",
        data: [60, 65, 70, 68, 75, 80, 72],
        borderColor: "#FF9900",
        backgroundColor: "rgba(255, 153, 0, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Storage Usage",
        data: [50, 52, 53, 54, 55, 56, 54],
        borderColor: "#00A36C",
        backgroundColor: "rgba(0, 163, 108, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Network I/O",
        data: [70, 75, 65, 80, 85, 90, 89],
        borderColor: "#DC3545",
        backgroundColor: "rgba(220, 53, 69, 0.1)",
        fill: true,
        tension: 0.4,
      }
    ],
  };

  // Generate bar chart data
  const barChartData = {
    labels: ["EC2", "RDS", "S3", "Lambda", "API Gateway", "CloudFront"],
    datasets: [
      {
        label: "Current Utilization (%)",
        data: [38, 72, 54, 25, 40, 65],
        backgroundColor: "#0066CC",
      }
    ],
  };

  // Generate doughnut chart data
  const doughnutChartData = {
    labels: ["EC2", "RDS", "S3", "Lambda", "Others"],
    datasets: [
      {
        data: [42, 35, 13, 5, 5],
        backgroundColor: [
          "#0066CC",
          "#00A36C",
          "#FF9900",
          "#DC3545",
          "#6C757D",
        ],
      }
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: "Utilization (%)",
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: "Utilization (%)",
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed}%`;
          }
        }
      }
    },
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold font-inter">Utilization Metrics</CardTitle>
        <Select
          value={timeframe}
          onValueChange={setTimeframe}
        >
          <SelectTrigger className="h-8 text-xs border-gray-300 w-[110px]">
            <SelectValue placeholder="Last 7 days" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="timeline">
          <TabsList className="mb-4">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="byResource">By Resource Type</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>
          
          <TabsContent value="timeline">
            <div className="h-[350px] w-full">
              <Line data={lineChartData} options={lineOptions} />
            </div>
          </TabsContent>
          
          <TabsContent value="byResource">
            <div className="h-[350px] w-full">
              <Bar data={barChartData} options={barOptions} />
            </div>
          </TabsContent>
          
          <TabsContent value="distribution">
            <div className="h-[350px] w-full">
              <Doughnut data={doughnutChartData} options={doughnutOptions} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
