import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComplianceFramework } from '@/types';
import { Shield, Check } from "lucide-react";

interface FrameworkSelectorProps {
    frameworks: ComplianceFramework[];
    selectedId: string;
    onSelect: (id: string) => void;
    onToggle: (id: string, enabled: boolean) => void;
}

export function FrameworkSelector({ frameworks, selectedId, onSelect, onToggle }: FrameworkSelectorProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {frameworks.map((fw) => (
                <Card
                    key={fw.id}
                    className={`cursor-pointer transition-all border-2 ${selectedId === fw.id ? 'border-primary' : 'border-transparent hover:border-gray-200'}`}
                    onClick={() => onSelect(fw.id)}
                >
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <Shield className={`w-5 h-5 ${fw.isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                                <h3 className="font-semibold">{fw.name}</h3>
                            </div>
                            <Badge variant={fw.isEnabled ? "default" : "outline"}>
                                {fw.isEnabled ? "Active" : "Disabled"}
                            </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 h-10">
                            {fw.description}
                        </p>

                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>v{fw.version}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggle(fw.id, !fw.isEnabled);
                                }}
                            >
                                {fw.isEnabled ? "Disable" : "Enable"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
