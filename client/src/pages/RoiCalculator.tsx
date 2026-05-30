import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Link } from "wouter";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { useROIData } from "@/hooks/use-costs";
import {
  DollarSign,
  TrendingUp,
  Shield,
  Clock,
  RefreshCw,
  Download,
  Mail,
  Server,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function SavingsCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  isReal,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  color: string;
  isReal?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-start gap-3">
        <div className={cn("p-2.5 rounded-lg text-white", color)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
            {isReal && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 text-green-600 border-green-300 dark:border-green-700">
                real
              </Badge>
            )}
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>
        </div>
      </div>
    </div>
  );
}

export default function RoiCalculator() {
  const { data: roiData, isLoading: roiLoading } = useROIData();
  const contentRef = useRef<HTMLDivElement>(null);

  // Inputs — pre-filled from real data once loaded
  const [monthlySpend, setMonthlySpend] = useState(0);
  const [provider, setProvider] = useState("aws");
  const [resourceCount, setResourceCount] = useState(0);
  const [overrideMode, setOverrideMode] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [needsCalculation, setNeedsCalculation] = useState(false);
  const [calculatedValues, setCalculatedValues] = useState<{ monthlySpend: number; resourceCount: number } | null>(null);

  // Pre-fill when data loads
  useEffect(() => {
    if (roiData && !overrideMode) {
      setMonthlySpend(roiData.currentMonthlySpend);
      setResourceCount(roiData.resourceCount || 0);
      const firstProvider = Object.keys(roiData.providerBreakdown || {})[0];
      if (firstProvider) setProvider(firstProvider);
    }
  }, [roiData, overrideMode]);

  const handleReset = () => {
    setOverrideMode(false);
    setNeedsCalculation(false);
    setCalculatedValues(null);
    if (roiData) {
      setMonthlySpend(roiData.currentMonthlySpend);
      setResourceCount(roiData.resourceCount || 0);
      const firstProvider = Object.keys(roiData.providerBreakdown || {})[0];
      if (firstProvider) setProvider(firstProvider);
    }
  };

  const handleCalculate = () => {
    setCalculatedValues({ monthlySpend, resourceCount });
    setNeedsCalculation(false);
  };

  // Use calculated values in override mode, live values otherwise
  const effectiveSpend = overrideMode && calculatedValues ? calculatedValues.monthlySpend : monthlySpend;
  const effectiveResourceCount = overrideMode && calculatedValues ? calculatedValues.resourceCount : resourceCount;

  // Calculations using real data as base
  const realAppliedSavings = roiData?.appliedSavings ?? 0;
  const realPendingSavings = roiData?.pendingSavings ?? 0;
  const annualizedApplied = realAppliedSavings * 12;
  const annualizedPending = realPendingSavings * 12;
  const totalAnnualSavings = annualizedApplied + annualizedPending;
  const annualSpend = effectiveSpend * 12;
  const roiPercent = annualSpend > 0 ? (totalAnnualSavings / annualSpend) * 100 : 0;
  const paybackMonths = totalAnnualSavings > 0
    ? Math.max(1, Math.ceil((annualSpend * 0.03) / (totalAnnualSavings / 12)))
    : 0;
  const securitySavings = (roiData?.securityIncidents ?? 0) * 1500 * 0.6;
  const operationalSavings = effectiveResourceCount * 8 * 12;

  // 3-year projection data
  const projectionData = Array.from({ length: 36 }, (_, i) => ({
    month: `M${i + 1}`,
    spend: annualSpend / 12,
    withInfraAudit: Math.max(0, annualSpend / 12 - (totalAnnualSavings / 12) * Math.min(1, (i + 1) / 3)),
    cumulativeSavings: (totalAnnualSavings / 12) * (i + 1),
  }));

  const handleDownloadPdf = useCallback(async () => {
    const el = contentRef.current;
    if (!el) return;
    toast.loading("Generating PDF...", { id: "roi-pdf" });
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      pdf.setFontSize(18);
      pdf.setTextColor(30, 64, 175);
      pdf.text("InfraAudit ROI Report", margin, 15);
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated ${new Date().toLocaleDateString()}`, margin, 22);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, 25, pageWidth - margin, 25);
      const contentWidth = pageWidth - margin * 2;
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = contentWidth / imgWidth;
      const pageHeight = pdf.internal.pageSize.getHeight();
      const startY = 30;
      const usableHeight = pageHeight - startY - margin;
      let srcY = 0;
      let page = 0;
      while (srcY < imgHeight) {
        if (page > 0) pdf.addPage();
        const sliceHeight = Math.min(usableHeight / ratio, imgHeight - srcY);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = imgWidth;
        sliceCanvas.height = sliceHeight;
        sliceCanvas.getContext("2d")!.drawImage(canvas, 0, srcY, imgWidth, sliceHeight, 0, 0, imgWidth, sliceHeight);
        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", margin, page === 0 ? startY : margin, contentWidth, sliceHeight * ratio);
        srcY += sliceHeight;
        page++;
      }
      pdf.save("infraudit-roi-report.pdf");
      toast.success("PDF downloaded!", { id: "roi-pdf" });
    } catch {
      toast.error("Failed to generate PDF", { id: "roi-pdf" });
    }
  }, []);

  const handleEmailROI = useCallback(async () => {
    const trimmed = emailAddress.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setEmailSending(true);
    try {
      const res = await fetch("/api/reports/roi/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: trimmed, annualSavings: totalAnnualSavings, roiPercent }),
      });
      if (!res.ok) throw new Error("Failed to send email");
      toast.success("ROI report emailed!");
      setEmailOpen(false);
      setEmailAddress("");
    } catch {
      toast.error("Failed to send email. Check SMTP configuration.");
    } finally {
      setEmailSending(false);
    }
  }, [emailAddress, totalAnnualSavings, roiPercent]);

  if (roiLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  // Empty state — no cost data
  const hasData = (roiData?.currentMonthlySpend ?? 0) > 0 || (roiData?.appliedSavings ?? 0) > 0 || (roiData?.pendingSavings ?? 0) > 0;
  if (!hasData && !overrideMode) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">ROI Calculator</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Calculate your return on investment with InfraAudit</p>
          </div>
          <Card className="border-dashed">
            <CardContent className="py-16 text-center space-y-4">
              <DollarSign className="h-12 w-12 mx-auto text-gray-300" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">No cost data yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Import billing data or run a scan to get real ROI calculations based on your actual infrastructure.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link href="/billing-import">
                  <Button variant="default">Import Billing Data</Button>
                </Link>
                <Link href="/reports">
                  <Button variant="outline">Run a Scan</Button>
                </Link>
                <Button variant="ghost" onClick={() => { setOverrideMode(true); setNeedsCalculation(true); }}>
                  Enter manually
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" ref={contentRef}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">ROI Calculator</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {overrideMode ? "Manual mode — enter your own values" : "Pre-filled from your real cost and optimization data"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {overrideMode && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Reset to actual
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadPdf}>
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setEmailOpen(true)}>
              <Mail className="h-4 w-4" />
              Email
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Inputs */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Infrastructure</CardTitle>
                <CardDescription>
                  {!overrideMode ? "Pre-filled from real data — edit to model scenarios" : "Manual values — click 'Reset to actual' to restore real data"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="monthlySpend">Monthly Cloud Spend</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
                    <Input
                      id="monthlySpend"
                      type="number"
                      min={0}
                      value={monthlySpend || ""}
                      onChange={(e) => { setMonthlySpend(parseFloat(e.target.value) || 0); setOverrideMode(true); setNeedsCalculation(true); }}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                  {roiData && !overrideMode && (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      From your current billing data
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="provider">Primary Cloud Provider</Label>
                  <Select value={provider} onValueChange={(v) => { setProvider(v); setOverrideMode(true); setNeedsCalculation(true); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aws">Amazon Web Services</SelectItem>
                      <SelectItem value="gcp">Google Cloud Platform</SelectItem>
                      <SelectItem value="azure">Microsoft Azure</SelectItem>
                      <SelectItem value="multi">Multi-Cloud</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="resourceCount">Resource Count</Label>
                  <Input
                    id="resourceCount"
                    type="number"
                    min={0}
                    value={resourceCount || ""}
                    onChange={(e) => { setResourceCount(parseInt(e.target.value) || 0); setOverrideMode(true); setNeedsCalculation(true); }}
                    placeholder="0"
                  />
                </div>

                {roiData && (
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">From your optimization data:</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Applied optimizations</span>
                      <span className="font-medium text-green-600">${realAppliedSavings.toFixed(2)}/mo saved</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Pending optimizations</span>
                      <span className="font-medium text-blue-600">${realPendingSavings.toFixed(2)}/mo potential</span>
                    </div>
                  </div>
                )}

                {overrideMode && (
                  <Button
                    onClick={handleCalculate}
                    className="w-full mt-2 gap-2"
                    disabled={!needsCalculation}
                  >
                    <TrendingUp className="h-4 w-4" />
                    {needsCalculation ? "Calculate ROI" : "Calculated"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-3 space-y-4">
            {/* Hero */}
            <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Projected Annual Savings</p>
                    <p className="text-4xl font-bold text-green-700 dark:text-green-300 mt-1">
                      ${totalAnnualSavings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                      {roiPercent.toFixed(1)}% ROI · {paybackMonths > 0 ? `${paybackMonths} month payback` : "No payback data yet"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-500 text-white shadow-lg">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Savings Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SavingsCard
                icon={Server}
                label="Infrastructure"
                value={`$${annualizedApplied.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/yr`}
                sub={`$${realAppliedSavings.toFixed(2)}/mo applied`}
                color="bg-blue-500"
                isReal
              />
              <SavingsCard
                icon={Shield}
                label="Security"
                value={`$${securitySavings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/yr`}
                sub={`${roiData?.securityIncidents ?? 0} incidents reduced`}
                color="bg-orange-500"
              />
              <SavingsCard
                icon={Clock}
                label="Operational"
                value={`$${operationalSavings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/yr`}
                sub={`${effectiveResourceCount} resources × 8 hrs/yr`}
                color="bg-violet-500"
              />
            </div>

            {/* Before / After */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Before vs After InfraAudit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Without InfraAudit</span>
                      <span className="font-semibold">${annualSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</span>
                    </div>
                    <div className="h-3 bg-red-100 dark:bg-red-900/30 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 dark:bg-red-500 rounded-full" style={{ width: "100%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">With InfraAudit</span>
                      <span className="font-semibold text-green-600">${Math.max(0, annualSpend - totalAnnualSavings).toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</span>
                    </div>
                    <div className="h-3 bg-green-100 dark:bg-green-900/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: annualSpend > 0 ? `${Math.max(5, 100 - roiPercent)}%` : "5%" }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3-Year Projection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">3-Year Cumulative Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={projectionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={5} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={50} />
                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "Cumulative Savings"]} />
                    <Area type="monotone" dataKey="cumulativeSavings" name="Cumulative Savings" stroke="#22c55e" strokeWidth={2} fill="url(#savingsGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Email Dialog */}
      {emailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEmailOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Email ROI Report</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Send your ROI summary to an email address.
            </p>
            <Input
              type="email"
              placeholder="recipient@example.com"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEmailROI()}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEmailOpen(false)}>Cancel</Button>
              <Button onClick={handleEmailROI} disabled={emailSending} className="gap-2">
                {emailSending && <Loader2 className="h-4 w-4 animate-spin" />}
                Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
