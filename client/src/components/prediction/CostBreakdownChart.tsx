import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { Server, Database, HardDrive, Globe, Cpu, Cloud } from "lucide-react";

interface CostCategory {
  name: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  change: number;
}

interface CostBreakdownChartProps {
  data?: CostCategory[];
  totalCost?: number;
  isLoading?: boolean;
}

const defaultData: CostCategory[] = [
  { name: "Compute", value: 12450, color: "#3b82f6", icon: <Cpu className="h-4 w-4" />, change: 8.2 },
  { name: "Storage", value: 5230, color: "#10b981", icon: <HardDrive className="h-4 w-4" />, change: -3.1 },
  { name: "Database", value: 4180, color: "#8b5cf6", icon: <Database className="h-4 w-4" />, change: 12.5 },
  { name: "Networking", value: 2340, color: "#f59e0b", icon: <Globe className="h-4 w-4" />, change: 2.3 },
  { name: "Other", value: 650, color: "#6b7280", icon: <Cloud className="h-4 w-4" />, change: -5.7 },
];

// Custom active shape for the pie chart
const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{
          filter: `drop-shadow(0 0 10px ${fill}50)`,
          transition: "all 0.3s ease"
        }}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 16}
        fill={fill}
        opacity={0.3}
      />
    </g>
  );
};

export function CostBreakdownChart({ 
  data = defaultData, 
  totalCost,
  isLoading = false 
}: CostBreakdownChartProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const total = totalCost || data.reduce((sum, item) => sum + item.value, 0);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur border border-gray-200/60 dark:border-slate-800/60 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Server className="h-5 w-5 text-violet-500" />
            Cost by Category
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Last 30 days
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Donut Chart */}
          <div className="relative w-64 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  animationBegin={0}
                  animationDuration={1000}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      style={{ outline: "none" }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="text-center"
                >
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(data[activeIndex].value)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {data[activeIndex].name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {((data[activeIndex].value / total) * 100).toFixed(1)}% of total
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 w-full space-y-3">
            {data.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200",
                  activeIndex === index 
                    ? "bg-gray-100 dark:bg-slate-800 shadow-sm" 
                    : "hover:bg-gray-50 dark:hover:bg-slate-800/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <div 
                    className={cn(
                      "p-2 rounded-lg",
                      `bg-opacity-10`
                    )}
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <span style={{ color: category.color }}>{category.icon}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{category.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {((category.value / total) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(category.value)}
                  </p>
                  <p className={cn(
                    "text-xs flex items-center justify-end gap-1",
                    category.change > 0 ? "text-red-500" : "text-emerald-500"
                  )}>
                    {category.change > 0 ? "+" : ""}{category.change}%
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="mt-6 pt-4 border-t border-gray-200/60 dark:border-slate-700/60 flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Total Monthly Cost</span>
          <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

