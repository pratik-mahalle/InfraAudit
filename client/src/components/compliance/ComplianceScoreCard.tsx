import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Doughnut } from 'react-chartjs-2';
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface ComplianceScoreCardProps {
    score: number;
    passing: number;
    failing: number;
}

export function ComplianceScoreCard({ score, passing, failing }: ComplianceScoreCardProps) {
    const data = {
        labels: ['Passing', 'Failing'],
        datasets: [
            {
                data: [passing, failing],
                backgroundColor: ['#10B981', '#EF4444'], // Green, Red
                borderWidth: 0,
            },
        ],
    };

    const options = {
        cutout: '80%',
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
        },
        maintainAspectRatio: false,
    };

    const getScoreColor = (s: number) => {
        if (s >= 90) return 'text-green-500';
        if (s >= 70) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Compliance Score</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="relative h-32 w-32">
                        <Doughnut data={data} options={options} />
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}%</span>
                            <span className="text-xs text-muted-foreground">Overall</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 flex-1 ml-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">Passing Controls</span>
                            </div>
                            <span className="text-lg font-bold">{passing}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-medium">Failing Controls</span>
                            </div>
                            <span className="text-lg font-bold">{failing}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
