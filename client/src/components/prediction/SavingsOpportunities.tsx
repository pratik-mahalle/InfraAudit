import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  Server, 
  Database, 
  HardDrive,
  CheckCircle2,
  Clock,
  ArrowRight,
  DollarSign,
  TrendingDown
} from "lucide-react";

interface SavingsOpportunity {
  id: string;
  title: string;
  description: string;
  potentialSavings: number;
  confidence: number;
  difficulty: "easy" | "medium" | "hard";
  category: "compute" | "storage" | "database" | "networking";
  impact: "high" | "medium" | "low";
  timeToImplement: string;
  affectedResources: number;
}

interface SavingsOpportunitiesProps {
  opportunities?: SavingsOpportunity[];
  isLoading?: boolean;
  onApply?: (id: string) => void;
}

const defaultOpportunities: SavingsOpportunity[] = [
  {
    id: "1",
    title: "Right-size underutilized EC2 instances",
    description: "8 instances are consistently running below 20% CPU utilization. Downsizing to smaller instance types could save significantly.",
    potentialSavings: 2340,
    confidence: 92,
    difficulty: "easy",
    category: "compute",
    impact: "high",
    timeToImplement: "1-2 hours",
    affectedResources: 8
  },
  {
    id: "2",
    title: "Enable S3 Intelligent-Tiering",
    description: "Move infrequently accessed data to cheaper storage tiers automatically based on access patterns.",
    potentialSavings: 890,
    confidence: 88,
    difficulty: "easy",
    category: "storage",
    impact: "medium",
    timeToImplement: "30 mins",
    affectedResources: 12
  },
  {
    id: "3",
    title: "Purchase Reserved Instances",
    description: "Based on your consistent usage patterns, switching to 1-year reserved instances for stable workloads.",
    potentialSavings: 4500,
    confidence: 95,
    difficulty: "medium",
    category: "compute",
    impact: "high",
    timeToImplement: "1 day",
    affectedResources: 15
  },
  {
    id: "4",
    title: "Terminate idle RDS read replicas",
    description: "3 read replicas have received no queries in the past 30 days and can be safely terminated.",
    potentialSavings: 1250,
    confidence: 85,
    difficulty: "easy",
    category: "database",
    impact: "medium",
    timeToImplement: "15 mins",
    affectedResources: 3
  },
  {
    id: "5",
    title: "Optimize NAT Gateway usage",
    description: "Route traffic through VPC endpoints instead of NAT Gateway for AWS services to reduce data transfer costs.",
    potentialSavings: 680,
    confidence: 78,
    difficulty: "medium",
    category: "networking",
    impact: "low",
    timeToImplement: "2-3 hours",
    affectedResources: 4
  }
];

const getCategoryIcon = (category: SavingsOpportunity["category"]) => {
  switch (category) {
    case "compute":
      return <Server className="h-5 w-5" />;
    case "storage":
      return <HardDrive className="h-5 w-5" />;
    case "database":
      return <Database className="h-5 w-5" />;
    default:
      return <Zap className="h-5 w-5" />;
  }
};

const getCategoryColor = (category: SavingsOpportunity["category"]) => {
  switch (category) {
    case "compute":
      return { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/30" };
    case "storage":
      return { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30" };
    case "database":
      return { bg: "bg-violet-500/10", text: "text-violet-500", border: "border-violet-500/30" };
    default:
      return { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30" };
  }
};

const getDifficultyBadge = (difficulty: SavingsOpportunity["difficulty"]) => {
  switch (difficulty) {
    case "easy":
      return { label: "Easy", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" };
    case "medium":
      return { label: "Medium", className: "bg-amber-500/10 text-amber-600 border-amber-500/30" };
    case "hard":
      return { label: "Complex", className: "bg-red-500/10 text-red-600 border-red-500/30" };
  }
};

export function SavingsOpportunities({ 
  opportunities = defaultOpportunities,
  isLoading = false,
  onApply
}: SavingsOpportunitiesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const totalSavings = opportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % opportunities.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + opportunities.length) % opportunities.length);
  };

  const currentOpp = opportunities[currentIndex];
  const categoryColors = getCategoryColor(currentOpp.category);
  const difficultyBadge = getDifficultyBadge(currentOpp.difficulty);

  return (
    <Card className="bg-white/70 dark:bg-slate-900/50 backdrop-blur border border-gray-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Savings Opportunities
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
              <TrendingDown className="h-3 w-3 mr-1" />
              {formatCurrency(totalSavings)}/mo potential
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Total Savings Banner */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Potential Savings</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalSavings)}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/month</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">{opportunities.length} opportunities</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(totalSavings * 12)}/year
              </p>
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="p-5 rounded-xl border border-gray-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl", categoryColors.bg)}>
                    <span className={categoryColors.text}>
                      {getCategoryIcon(currentOpp.category)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {currentOpp.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={cn("text-xs capitalize", categoryColors.bg, categoryColors.text, categoryColors.border)}>
                        {currentOpp.category}
                      </Badge>
                      <Badge variant="outline" className={cn("text-xs", difficultyBadge.className)}>
                        {difficultyBadge.label}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(currentOpp.potentialSavings)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">per month</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {currentOpp.description}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Confidence</p>
                  <div className="flex items-center gap-2">
                    <Progress value={currentOpp.confidence} className="h-1.5 flex-1" />
                    <span className="text-sm font-medium">{currentOpp.confidence}%</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Time to Apply</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {currentOpp.timeToImplement}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Resources</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Server className="h-3.5 w-3.5" />
                    {currentOpp.affectedResources} affected
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                onClick={() => onApply?.(currentOpp.id)}
              >
                <CheckCircle2 className="h-4 w-4" />
                Apply Recommendation
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {opportunities.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    index === currentIndex 
                      ? "w-6 bg-emerald-500" 
                      : "w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"
                  )}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 pt-4 border-t border-gray-200/60 dark:border-slate-700/60">
          <div className="grid grid-cols-4 gap-3 text-center">
            {[
              { label: "Easy", count: opportunities.filter(o => o.difficulty === "easy").length, color: "text-emerald-500" },
              { label: "Medium", count: opportunities.filter(o => o.difficulty === "medium").length, color: "text-amber-500" },
              { label: "High Impact", count: opportunities.filter(o => o.impact === "high").length, color: "text-blue-500" },
              { label: "Total", count: opportunities.length, color: "text-gray-900 dark:text-white" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className={cn("text-xl font-bold", stat.color)}>{stat.count}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

