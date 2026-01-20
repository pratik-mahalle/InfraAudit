import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sparkles,
    Send,
    Loader2,
    Lightbulb,
    TrendingDown,
    Shield,
    Zap,
    Bot,
    User,
    X,
} from "lucide-react";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface AskInfraAuditProps {
    className?: string;
}

const suggestedPrompts = [
    {
        icon: TrendingDown,
        text: "How can I reduce my AWS costs?",
        color: "text-emerald-500",
    },
    {
        icon: Shield,
        text: "Are there any security vulnerabilities?",
        color: "text-blue-500",
    },
    {
        icon: Zap,
        text: "What resources are underutilized?",
        color: "text-amber-500",
    },
    {
        icon: Lightbulb,
        text: "Show me cost optimization recommendations",
        color: "text-violet-500",
    },
];

export function AskInfraAudit({ className }: AskInfraAuditProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e?: React.FormEvent, promptText?: string) => {
        e?.preventDefault();
        const text = promptText || query.trim();
        if (!text) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: text,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setQuery("");
        setIsLoading(true);

        // Simulate AI response (replace with actual API call)
        setTimeout(() => {
            const responses: Record<string, string> = {
                "How can I reduce my AWS costs?": `Based on your infrastructure analysis, here are the top cost optimization opportunities:

**1. Right-size EC2 Instances** - $2,340/month savings
   - 5 instances are running at <20% CPU utilization
   - Recommend downsizing from m5.xlarge to m5.large

**2. Delete Unused EBS Volumes** - $890/month savings
   - 12 unattached EBS volumes detected (320 GB total)

**3. Reserved Instances** - $4,500/month potential savings
   - Consider 1-year reserved instances for stable workloads

Would you like me to create optimization jobs for any of these?`,
                "Are there any security vulnerabilities?": `I found **3 security issues** requiring attention:

🔴 **Critical**: S3 bucket "data-exports" has public access enabled
🟡 **Medium**: 2 security groups allow unrestricted SSH access (0.0.0.0/0)
🟡 **Medium**: IAM user "deploy-bot" has unused access keys older than 90 days

**Recommendation**: Address the S3 bucket configuration immediately. Would you like me to generate remediation steps?`,
                "What resources are underutilized?": `Here's your resource utilization summary:

**Low Utilization (<30%)**:
- 8 EC2 instances averaging 15% CPU
- 3 RDS instances with <5% connection usage
- 2 Lambda functions with 0 invocations in 30 days

**Potential Monthly Savings**: $3,200

Would you like detailed recommendations for each resource?`,
                "Show me cost optimization recommendations": `Here are your top 5 cost optimization recommendations:

1. **Hibernate Dev/Test Clusters** ⏰
   Schedule: Weeknights & weekends
   Savings: $1,200/month

2. **Enable S3 Intelligent Tiering** 📦
   Affected: 15 buckets (4.2 TB)
   Savings: $450/month

3. **Migrate to Graviton Instances** 🚀
   Eligible: 12 instances
   Savings: $680/month (20% reduction)

4. **Clean Up Unused NAT Gateways** 🧹
   Found: 3 in unused VPCs
   Savings: $280/month

5. **Consolidate CloudWatch Logs** 📊
   Current retention: 5+ years
   Recommended: 90 days
   Savings: $120/month

**Total Monthly Savings: $2,730**`,
            };

            const defaultResponse = `I analyzed your query: "${text}"

Based on your current infrastructure:
- **Active Resources**: 156 across 3 cloud providers
- **Monthly Spend**: $24,850
- **Security Score**: 87/100

How can I help you further? You can ask about:
• Cost optimization opportunities
• Security vulnerabilities
• Resource utilization
• Compliance status`;

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: responses[text] || defaultResponse,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
            setIsLoading(false);
        }, 1500);
    };

    const handleSuggestedPrompt = (prompt: string) => {
        handleSubmit(undefined, prompt);
    };

    return (
        <>
            {/* Trigger Button */}
            <Button
                onClick={() => setIsOpen(true)}
                variant="outline"
                className={cn(
                    "gap-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all",
                    className
                )}
            >
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span className="hidden sm:inline">Ask InfraAudit</span>
            </Button>

            {/* Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-2xl h-[600px] flex flex-col p-0 gap-0">
                    {/* Header */}
                    <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                        <DialogTitle className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            Ask InfraAudit AI
                        </DialogTitle>
                        <DialogDescription>
                            Get instant insights about your infrastructure, costs, and security
                        </DialogDescription>
                    </DialogHeader>

                    {/* Messages Area */}
                    <ScrollArea className="flex-1 px-6 py-4">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 mb-6">
                                    <Bot className="h-12 w-12 text-blue-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    How can I help you today?
                                </h3>
                                <p className="text-sm text-gray-500 mb-6 max-w-sm">
                                    Ask me anything about your cloud infrastructure, costs, security, or optimization opportunities.
                                </p>

                                {/* Suggested Prompts */}
                                <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                                    {suggestedPrompts.map((prompt, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSuggestedPrompt(prompt.text)}
                                            className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 text-left transition-all group"
                                        >
                                            <prompt.icon className={cn("h-4 w-4 flex-shrink-0", prompt.color)} />
                                            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">
                                                {prompt.text}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {messages.map((message) => (
                                        <motion.div
                                            key={message.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "flex gap-3",
                                                message.role === "user" ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            {message.role === "assistant" && (
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                                                    <Bot className="h-4 w-4 text-white" />
                                                </div>
                                            )}
                                            <div
                                                className={cn(
                                                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                                                    message.role === "user"
                                                        ? "bg-blue-600 text-white rounded-br-md"
                                                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md"
                                                )}
                                            >
                                                <div className="whitespace-pre-wrap">{message.content}</div>
                                            </div>
                                            {message.role === "user" && (
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                    <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex gap-3"
                                    >
                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                                            <Bot className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Analyzing your infrastructure...
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Ask about costs, security, or optimization..."
                                className="flex-1"
                                disabled={isLoading}
                            />
                            <Button
                                type="submit"
                                disabled={!query.trim() || isLoading}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                            AI responses are based on your connected infrastructure data
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
