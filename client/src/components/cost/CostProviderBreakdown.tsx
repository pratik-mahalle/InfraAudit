import React from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface CostProviderBreakdownProps {
    data: Record<string, number>;
    totalCost: number;
}

export function CostProviderBreakdown({ data, totalCost }: CostProviderBreakdownProps) {
    const providers = Object.keys(data);
    const costs = Object.values(data);
    const colors = [
        '#FF9900', // AWS Orange
        '#4285F4', // GCP Blue
        '#0078D4', // Azure Blue
        '#6c757d', // Other/Gray
    ];

    const chartData = {
        labels: providers.map(p => p.toUpperCase()),
        datasets: [
            {
                data: costs,
                backgroundColor: colors.slice(0, providers.length),
                borderColor: colors.slice(0, providers.length).map(c => c),
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const percentage = totalCost > 0 ? Math.round((value / totalCost) * 100) : 0;
                        return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                    },
                },
            },
        },
        cutout: '70%', // Donut thickness
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Cost by Provider</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full relative">
                    {providers.length > 0 ? (
                        <>
                            <Doughnut data={chartData} options={options} />
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <p className="text-xs text-muted-foreground">Total</p>
                                <p className="text-xl font-bold">{formatCurrency(totalCost)}</p>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            No data available
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
