import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Cloud,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Zap,
    Shield,
    DollarSign,
    Play,
    ExternalLink,
    CloudCog,
} from "lucide-react";

interface OnboardingWizardProps {
    onComplete?: () => void;
    onSkip?: () => void;
}

interface Step {
    id: number;
    title: string;
    description: string;
    icon: React.ElementType;
}

const steps: Step[] = [
    {
        id: 1,
        title: "Select provider",
        description: "Choose your cloud provider",
        icon: Cloud,
    },
    {
        id: 2,
        title: "Connect account",
        description: "Securely link your cloud account",
        icon: Shield,
    },
    {
        id: 3,
        title: "Start optimizing",
        description: "Get insights and recommendations",
        icon: Sparkles,
    },
];

// AWS Logo Component
const AwsLogo = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 64 64" fill="currentColor">
        <path d="M18.5 27.8c0 .7.1 1.3.2 1.7.2.4.4.9.7 1.4.1.2.1.3.1.4 0 .2-.1.4-.3.5l-1 .7c-.2.1-.3.2-.4.2-.2 0-.3-.1-.5-.3-.3-.3-.5-.7-.7-1-.2-.4-.4-.8-.7-1.3-1.6 1.9-3.7 2.8-6.1 2.8-1.8 0-3.2-.5-4.2-1.5-1.1-1-1.6-2.3-1.6-4 0-1.8.6-3.2 1.9-4.3 1.3-1.1 3-1.6 5.1-1.6.7 0 1.4 0 2.2.1.8.1 1.6.2 2.4.4v-1.5c0-1.6-.3-2.7-1-3.3-.7-.7-1.9-1-3.6-1-.8 0-1.6.1-2.4.3-.8.2-1.6.4-2.4.8-.4.2-.6.2-.8.2-.3 0-.5-.2-.5-.7v-.8c0-.4.1-.6.2-.8.1-.2.4-.4.7-.5.8-.4 1.7-.8 2.9-1.1 1.1-.3 2.3-.5 3.6-.5 2.7 0 4.7.6 6 1.9 1.2 1.2 1.9 3.1 1.9 5.7v7.5l.1-.1zm-8.4 3.1c.7 0 1.4-.1 2.2-.4.8-.3 1.4-.8 2-1.4.3-.4.6-.9.7-1.4.1-.5.2-1.2.2-2v-1c-.6-.1-1.2-.2-1.9-.3-.7-.1-1.3-.1-2-.1-1.4 0-2.4.3-3.1.8-.7.5-1 1.3-1 2.4 0 1 .2 1.7.7 2.2.5.5 1.3.7 2.2.7v.5zm16.6 2.2c-.4 0-.7-.1-.8-.3-.2-.2-.3-.5-.5-1l-5.1-16.8c-.1-.5-.2-.8-.2-1 0-.4.2-.6.6-.6h1.5c.4 0 .7.1.9.3.2.2.3.5.4 1l3.6 14.3L30.2 15c.1-.5.2-.8.4-1 .2-.2.5-.3.9-.3h1.3c.4 0 .7.1.9.3.2.2.3.5.4 1l3.6 14.5 3.7-14.5c.1-.5.3-.8.4-1 .2-.2.5-.3.9-.3h1.4c.4 0 .6.2.6.6 0 .1 0 .3-.1.4 0 .2-.1.4-.2.6l-5.3 16.8c-.1.5-.3.8-.5 1-.2.2-.5.3-.8.3h-1.4c-.4 0-.7-.1-.9-.3-.2-.2-.3-.5-.4-1L31.3 18l-3.6 14.1c-.1.5-.2.8-.4 1-.2.2-.5.3-.9.3h-1.4l.3-.3zm26.5.7c-1.1 0-2.1-.1-3.1-.4-1-.3-1.8-.6-2.3-.9-.3-.2-.5-.4-.6-.6-.1-.2-.1-.4-.1-.6v-.9c0-.4.2-.7.5-.7.1 0 .3 0 .4.1.1.1.3.1.5.2.7.3 1.5.6 2.3.8.9.2 1.7.3 2.6.3 1.4 0 2.4-.2 3.1-.7.7-.5 1.1-1.2 1.1-2.1 0-.6-.2-1.1-.6-1.5-.4-.4-1.1-.8-2.3-1.1l-3.2-.9c-1.6-.5-2.8-1.2-3.6-2.1-.7-.9-1.1-2-1.1-3.1 0-.9.2-1.7.6-2.4.4-.7.9-1.3 1.6-1.8.7-.5 1.4-.9 2.3-1.1.9-.3 1.8-.4 2.8-.4.5 0 1 0 1.5.1.5.1 1 .2 1.5.3.5.1.9.3 1.3.4.4.2.7.3.9.5.3.2.5.4.6.6.1.2.2.5.2.9v.8c0 .4-.2.7-.5.7-.2 0-.5-.1-.8-.3-1.2-.5-2.6-.8-4-.8-1.2 0-2.2.2-2.9.6-.6.4-1 1.1-1 2 0 .6.2 1.1.7 1.6.4.4 1.3.8 2.5 1.2l3.1.9c1.6.5 2.7 1.1 3.4 2 .7.9 1 1.9 1 3 0 .9-.2 1.8-.6 2.5-.4.7-1 1.4-1.7 1.9-.7.5-1.5.9-2.5 1.2-1 .3-2 .4-3.1.4z" />
    </svg>
);

// Azure Logo Component
const AzureLogo = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 96 96" fill="currentColor">
        <path d="M33.338 6.544h17.728L32.64 46.44l26.464 31.48H32.64l-26.464-31.48 27.162-39.896zm28.296 0h17.728L32.64 89.48H14.912L61.634 6.544z" />
    </svg>
);

// GCP Logo Component  
const GcpLogo = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 64 64" fill="currentColor">
        <path d="M32 8c-13.2 0-24 10.8-24 24s10.8 24 24 24 24-10.8 24-24S45.2 8 32 8zm0 41.6c-9.7 0-17.6-7.9-17.6-17.6S22.3 14.4 32 14.4 49.6 22.3 49.6 32 41.7 49.6 32 49.6z" />
        <path d="M42.4 26.4h-4.8V32h4.8v-5.6zM32 26.4h-4.8V32H32v-5.6zM21.6 26.4h-4.8V32h4.8v-5.6z" />
    </svg>
);

const cloudProviders = [
    {
        id: "aws",
        name: "Amazon Web Services",
        logo: AwsLogo,
        color: "text-[#FF9900]",
        bgColor: "bg-[#FF9900]/10",
        borderColor: "border-[#FF9900]/30",
        description: "EC2, S3, RDS, Lambda & more",
    },
    {
        id: "azure",
        name: "Microsoft Azure",
        logo: AzureLogo,
        color: "text-[#0089D6]",
        bgColor: "bg-[#0089D6]/10",
        borderColor: "border-[#0089D6]/30",
        description: "VMs, Blob Storage, SQL & more",
    },
    {
        id: "gcp",
        name: "Google Cloud",
        logo: GcpLogo,
        color: "text-[#4285F4]",
        bgColor: "bg-[#4285F4]/10",
        borderColor: "border-[#4285F4]/30",
        description: "Compute Engine, GCS, BigQuery & more",
    },
];

const features = [
    {
        icon: DollarSign,
        title: "Cost Monitoring",
        description: "Track and optimize cloud spending in real-time",
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
    },
    {
        icon: Shield,
        title: "Security Analysis",
        description: "Detect misconfigurations and vulnerabilities",
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
    },
    {
        icon: Zap,
        title: "Auto-Optimization",
        description: "Automated recommendations and actions",
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
    },
    {
        icon: Sparkles,
        title: "AI Insights",
        description: "Intelligent predictions and anomaly detection",
        color: "text-violet-500",
        bgColor: "bg-violet-500/10",
    },
];

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
    const [, navigate] = useLocation();
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

    const handleProviderSelect = (providerId: string) => {
        setSelectedProvider(providerId);
    };

    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete?.();
        }
    };

    const handleConnectProvider = () => {
        navigate("/cloud-providers");
        onComplete?.();
    };

    const handleExploreDemo = () => {
        onSkip?.();
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            {/* Welcome Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10"
            >
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-3">
                    Welcome to <span className="text-blue-600">InfraAudit</span>! Get started in 3 simple steps
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Connect your cloud provider to unlock cost optimization and security insights
                </p>
            </motion.div>

            {/* Step Indicator */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-center mb-12"
            >
                {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center">
                            {/* Step Circle */}
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                                    currentStep > step.id
                                        ? "bg-emerald-500 text-white"
                                        : currentStep === step.id
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                            : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                                )}
                            >
                                {currentStep > step.id ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                    step.id
                                )}
                            </div>
                            {/* Step Label */}
                            <div className="mt-2 text-center">
                                <p
                                    className={cn(
                                        "text-sm font-medium",
                                        currentStep >= step.id
                                            ? "text-gray-900 dark:text-white"
                                            : "text-gray-400"
                                    )}
                                >
                                    {step.title}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                            </div>
                        </div>
                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                            <div
                                className={cn(
                                    "w-24 h-0.5 mx-4 mt-[-28px]",
                                    currentStep > step.id
                                        ? "bg-emerald-500"
                                        : "bg-gray-200 dark:bg-gray-700"
                                )}
                            />
                        )}
                    </React.Fragment>
                ))}
            </motion.div>

            {/* Main Content Area */}
            <AnimatePresence mode="wait">
                {currentStep === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        {/* Cloud Provider Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            {cloudProviders.map((provider) => (
                                <button
                                    key={provider.id}
                                    onClick={() => handleProviderSelect(provider.id)}
                                    className={cn(
                                        "relative p-6 rounded-xl border-2 transition-all duration-300 text-left",
                                        selectedProvider === provider.id
                                            ? `${provider.borderColor} ${provider.bgColor} shadow-lg`
                                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-slate-900"
                                    )}
                                >
                                    {selectedProvider === provider.id && (
                                        <div className="absolute top-3 right-3">
                                            <CheckCircle2 className={cn("h-5 w-5", provider.color)} />
                                        </div>
                                    )}
                                    <provider.logo className={cn("h-10 w-10 mb-4", provider.color)} />
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                        {provider.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">{provider.description}</p>
                                </button>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-center gap-4">
                            <Button
                                variant="outline"
                                onClick={handleExploreDemo}
                                className="px-6"
                            >
                                Explore with demo data
                            </Button>
                            <span className="text-gray-400">or</span>
                            <Button
                                onClick={handleConnectProvider}
                                disabled={!selectedProvider}
                                className="px-6 bg-blue-600 hover:bg-blue-700 gap-2"
                            >
                                Connect {selectedProvider ? cloudProviders.find(p => p.id === selectedProvider)?.name.split(' ')[0] : 'provider'}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Features Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-16"
            >
                <h2 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-6">
                    All InfraAudit Products
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                        >
                            <Card className="h-full hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 cursor-pointer group">
                                <CardContent className="p-5">
                                    <div
                                        className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                                            feature.bgColor
                                        )}
                                    >
                                        <feature.icon className={cn("h-5 w-5", feature.color)} />
                                    </div>
                                    <h3 className="font-medium text-gray-900 dark:text-white mb-1 flex items-center gap-1">
                                        {feature.title}
                                        <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                    </h3>
                                    <p className="text-sm text-gray-500">{feature.description}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Demo Cluster Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-12"
            >
                <Card className="overflow-hidden border-dashed">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Explore Demo Environment
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    Click and play with demo data to discover how InfraAudit can help you.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={handleExploreDemo}
                                    className="gap-2"
                                >
                                    <Play className="h-4 w-4" />
                                    Start Demo Tour
                                </Button>
                            </div>
                            <div className="hidden md:block text-right">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Demo Available
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Helpful Resources */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-12"
            >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Helpful resources to get started
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                        href="/documentation"
                        className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
                    >
                        <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600">
                                Docs & Tutorials
                            </h4>
                            <p className="text-sm text-gray-500">Learn with our guides</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                    </a>
                    <a
                        href="/documentation#api"
                        className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
                    >
                        <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600">
                                REST API
                            </h4>
                            <p className="text-sm text-gray-500">Integrate with our API</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                    </a>
                    <a
                        href="https://github.com/pratik-mahalle/InfraAudit"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
                    >
                        <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600">
                                Community
                            </h4>
                            <p className="text-sm text-gray-500">Join our GitHub</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                    </a>
                </div>
            </motion.div>
        </div>
    );
}
