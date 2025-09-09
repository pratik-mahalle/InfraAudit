import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  BarChart3,
  Shield,
  DollarSign,
  LineChart,
  ArrowRight,
  CloudLightning,
  ChevronRight,
  Plus,
  Quote,
  Layers,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
// Import founder photo
const founderPhoto = "/me.jpg";

// FAQ data structure
const faqItems = [
  {
    question: "What is InfrAudit, and who is it for?",
    answer: "InfrAudit is a comprehensive cloud infrastructure monitoring platform designed for DevOps teams, cloud engineers, and IT managers who need to maintain security compliance and cost efficiency across AWS, Azure, and Google Cloud environments."
  },
  {
    question: "How does InfrAudit help reduce cloud management risks?",
    answer: "InfrAudit continuously monitors your cloud infrastructure for security vulnerabilities, cost anomalies, and resource inefficiencies. Our AI-powered analysis detects issues before they become problems, helping to prevent data breaches and unexpected billing spikes."
  },
  {
    question: "Can InfrAudit integrate with our existing systems?",
    answer: "Yes, InfrAudit provides seamless integration with your existing DevOps toolchain, including Slack, PagerDuty, Jira, and GitHub. We also provide a REST API for custom integrations with your specific workflows and internal systems."
  },
  {
    question: "What makes InfrAudit unique compared to other monitoring tools?",
    answer: "Unlike competitors who focus on either cost or security, InfrAudit provides comprehensive coverage across all cloud providers with AI-driven insights, interactive visualizations, and customizable alerting—all in one unified dashboard."
  },
  {
    question: "What kind of reports can InfrAudit generate?",
    answer: "InfrAudit generates detailed cost analysis reports, security compliance audits, resource utilization summaries, and predictive forecasts. All reports are customizable, exportable, and can be scheduled for regular delivery to stakeholders."
  }
];

export default function HomePage() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [expandedFaqs, setExpandedFaqs] = useState<number[]>([]);
  
  // Add scroll animation hooks
  const [scrollY, setScrollY] = useState(0);
  
  // Toggle FAQ expansion
  const toggleFaq = (index: number) => {
    setExpandedFaqs(prev => 
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Redirect to dashboard if already logged in
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);
  
  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Section */}
      <section className="w-full py-20 px-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">

              
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                <span className="bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400 bg-clip-text text-transparent">Cloud Monitoring Made</span> <br />
                <span className="relative">
                  Effortless through AI
                </span>
              </h1>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                AI-powered platform to monitor, secure, and optimize your cloud infrastructure across all providers.
              </p>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-4">
                Tailor-made for DevOps and Cloud Engineering teams
              </p>
              
              <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-900/50">
                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                  Companies using InfrAudit save an average of <span className="font-bold">32%</span> on cloud costs
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <Button asChild size="lg" className="h-12 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600">
                  <Link href="/roi-calculator" className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Calculate Your Cloud Savings
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-6">
                  <Link href="/auth">
                    Get Started
                  </Link>
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mb-8 mt-6">
                <div className="flex-grow group">
                  <Input 
                    type="email" 
                    placeholder="contact@infraudit.io" 
                    className="w-full h-12 transition-all duration-300 group-hover:border-primary" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button className="h-12 px-6 relative overflow-hidden group"
                  onClick={() => {
                    window.location.href = "mailto:contact@infraudit.in?subject=Schedule InfrAudit Demo";
                  }}
                >
                  <span className="relative z-10 flex items-center">
                    Schedule Demo
                    <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Button>
              </div>
            </div>
            
            <div className="md:w-1/2">
              <div className="relative">
                <div className="absolute -top-5 -left-5 w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-lg z-0"></div>
                <div className="absolute -bottom-5 -right-5 w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-lg z-0"></div>
                <div className="relative z-10 bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex gap-4">
                      <Tabs defaultValue="dashboard">
                        <TabsList>
                          <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
                          <TabsTrigger value="cost" className="text-xs">Cost Analysis</TabsTrigger>
                          <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                      <Card className="bg-blue-50 dark:bg-blue-950/30 p-3">
                        <CardContent className="p-0">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Resources</span>
                            <span className="text-xl font-bold dark:text-white">248</span>
                            <div className="w-full h-8 mt-2">
                              <div className="w-full h-[2px] bg-gray-200 dark:bg-gray-700 relative">
                                <div className="absolute h-[2px] bg-blue-500 left-0 top-0 w-3/4"></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-green-50 dark:bg-green-950/30 p-3">
                        <CardContent className="p-0">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Compliance</span>
                            <span className="text-xl font-bold dark:text-white">94%</span>
                            <div className="w-full h-8 mt-2">
                              <div className="w-full h-[2px] bg-gray-200 dark:bg-gray-700 relative">
                                <div className="absolute h-[2px] bg-green-500 left-0 top-0 w-[94%]"></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-amber-50 dark:bg-amber-950/30 p-3 col-span-2 md:col-span-1">
                        <CardContent className="p-0">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Savings</span>
                            <span className="text-xl font-bold dark:text-white">$3,240</span>
                            <div className="w-full h-8 mt-2">
                              <div className="w-full h-[2px] bg-gray-200 dark:bg-gray-700 relative">
                                <div className="absolute h-[2px] bg-amber-500 left-0 top-0 w-1/2"></div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Card className="bg-gray-50 dark:bg-gray-900 mb-3">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-medium">Cost Analysis</h3>
                          <Tabs defaultValue="month" className="h-7">
                            <TabsList className="h-7">
                              <TabsTrigger value="week" className="text-xs h-6 px-2">Week</TabsTrigger>
                              <TabsTrigger value="month" className="text-xs h-6 px-2">Month</TabsTrigger>
                              <TabsTrigger value="year" className="text-xs h-6 px-2">Year</TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>
                        
                        <div className="h-32 flex items-end justify-between">
                          {[40, 65, 35, 85, 45, 75, 55].map((height, i) => (
                            <div key={i} className="h-full flex flex-col justify-end items-center">
                              <div
                                className="w-6 bg-blue-200 dark:bg-blue-700 rounded-sm"
                                style={{ height: `${height}%` }}
                              ></div>
                              <span className="text-xs mt-1">{String.fromCharCode(65 + i)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="flex items-center gap-1 text-sm text-primary">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                      <span>Anomaly detected: EC2 instance spike in us-east-1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-medium mb-1">Security Monitoring</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Continuous security drift detection & compliance checks</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-medium mb-1">Cost Optimization</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">AI-driven cost reduction and usage optimization</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-medium mb-1">Resource Monitoring</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Multi-cloud resource inventory and tracking</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                <LineChart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-medium mb-1">Predictive Analysis</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">ML-powered cost forecasting and anomaly detection</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="w-full py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              All-in-One Cloud Management Solution
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              InfrAudit provides comprehensive tools to monitor, secure, and optimize your entire cloud infrastructure.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="flex flex-col gap-8">
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Multi-Cloud Support</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Unified monitoring for AWS, Azure, and Google Cloud with a single dashboard.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Security Drift Detection</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Identify security configuration drift before it becomes a vulnerability.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Cost Anomaly Detection</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    AI-powered detection of unusual spending patterns with instant alerting.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-8">
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Interactive Cost Analysis</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Drill down into cost data with interactive visualizations and period comparisons.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Slack Integration</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Real-time notifications and alerts directly to your team channels.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Resource Rightsizing</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Automated recommendations for optimizing underutilized resources.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* What Makes Us Unique */}
      <section className="w-full py-20 px-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              What Makes InfrAudit Different
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We're not just another cloud monitoring tool
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-1 rounded-xl shadow-xl">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-8">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0 mt-1">
                        <span className="font-bold text-blue-600 dark:text-blue-400">1</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-medium mb-2">True Multi-Cloud Integration</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Unlike competitors who prioritize one cloud provider, InfrAudit delivers equal depth of features across AWS, Azure, and Google Cloud from day one.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0 mt-1">
                        <span className="font-bold text-blue-600 dark:text-blue-400">2</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-medium mb-2">AI-Driven Insights</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Our advanced machine learning algorithms don't just detect issues—they predict them before they happen, with 87% accuracy in cost spike prediction.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0 mt-1">
                        <span className="font-bold text-blue-600 dark:text-blue-400">3</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-medium mb-2">Interactive Drill-Down Analytics</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          InfrAudit provides detailed, interactive visualizations that let you explore cost and security data by clicking on any element to reveal deeper insights.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">23% Average Cost Savings</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Our customers see an average of 23% reduction in cloud spending within the first quarter after implementation.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">94% Security Compliance</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    InfrAudit users maintain an average of 94% compliance with industry security standards, compared to the industry average of 71%.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <BarChart3 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">5x Faster Issue Resolution</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Teams using InfrAudit resolve infrastructure issues 5 times faster than teams using traditional monitoring tools.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section id="testimonials" className="w-full py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Trusted by DevOps Teams Worldwide
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Here's what our users are saying about InfrAudit
            </p>
          </div>
          
          {/* User Feedback */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Aarav Shah",
                role: "Head of DevOps · FinTech",
                quote:
                  "We cut nearly 28% of our monthly AWS bill in two sprints. InfrAudit surfaces waste instantly and the rightsizing tips were spot-on.",
              },
              {
                name: "Meera Iyer",
                role: "SRE Manager · SaaS",
                quote:
                  "The security drift alerts caught a public S3 policy within minutes. That alone paid for the product on day one.",
              },
              {
                name: "Vikram Patel",
                role: "Platform Lead · Marketplace",
                quote:
                  "Multi‑cloud inventory and anomaly charts made our quarterly audit painless. We finally have one place to see spend and risk.",
              },
              {
                name: "Sanjana Rao",
                role: "Cloud Architect · HealthTech",
                quote:
                  "Forecasting + recommendations helped us plan reserved capacity confidently. Budget variance dropped by 35%.",
              },
              {
                name: "Rohit Kumar",
                role: "Engineering Director · Logistics",
                quote:
                  "The sync + scan flow is fast, and Slack notifications are actionable. Our MTTR for cost spikes went down by 5x.",
              },
              {
                name: "Neha Gupta",
                role: "CEO · Keploy",
                quote:
                  "Onboarding took less than an hour. The dashboard is clean and the AI advice is actually practical for our teams.",
              },
            ].map((t, i) => (
              <div key={i} className="p-6 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-start gap-3">
                  <Quote className="h-6 w-6 text-blue-400 mt-1" />
                  <div>
                    <p className="text-gray-800 dark:text-gray-200">{t.quote}</p>
                    <div className="mt-4">
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{t.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section id="faq" className="w-full py-20 px-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Frequently asked questions
            </h2>
          </div>
          
          <div className="space-y-6">
            {/* FAQ Items with collapsible content */}
            {faqItems.map((item, index) => (
              <div 
                key={index} 
                className="border-b border-gray-200 dark:border-gray-700 py-5 cursor-pointer"
                onClick={() => toggleFaq(index)}
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-medium">{item.question}</h3>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <Plus
                      className={`h-5 w-5 transform transition-transform duration-200 ${expandedFaqs.includes(index) ? 'rotate-45' : ''}`}
                    />
                  </button>
                </div>
                
                {expandedFaqs.includes(index) && (
                  <div className="mt-4 text-gray-600 dark:text-gray-300 text-lg">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="w-full py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Choose the plan that fits your organization's needs with no hidden fees.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="overflow-hidden transform transition-transform hover:scale-105">
              <div className="p-6 bg-white dark:bg-gray-800">
                <h3 className="text-xl font-bold mb-2">Starter</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">For small teams getting started with cloud management</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$49</span>
                  <span className="text-gray-500 dark:text-gray-400">/month</span>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={() => window.location.href = "/auth"}
                >
                  Start Free Trial
                </Button>
              </div>
              
              <div className="p-6 bg-gray-50 dark:bg-gray-800/70 border-t dark:border-gray-700">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">Up to 100 resources</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">Basic cost analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">Daily security scans</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">Email notifications</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">7-day data retention</span>
                  </li>
                </ul>
              </div>
            </Card>
            
            <Card className="overflow-hidden border-primary relative transform transition-transform hover:scale-105">
              <div className="absolute top-0 right-0 bg-primary text-white text-xs py-1 px-3 rounded-bl-lg">
                Most Popular
              </div>
              
              <div className="p-6 bg-white dark:bg-gray-800">
                <h3 className="text-xl font-bold mb-2">Professional</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">For growing teams with advanced monitoring needs</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$299</span>
                  <span className="text-gray-500 dark:text-gray-400">/month</span>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={() => window.location.href = "/auth"}
                >
                  Start Free Trial
                </Button>
              </div>
              
              <div className="p-6 bg-gray-50 dark:bg-gray-800/70 border-t dark:border-gray-700">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">Up to 500 resources</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">Advanced cost analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">Hourly security scans</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">Slack integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">30-day data retention</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">AI-powered recommendations</span>
                  </li>
                </ul>
              </div>
            </Card>
            
            <Card className="overflow-hidden transform transition-transform hover:scale-105">
              <div className="p-6 bg-white dark:bg-gray-800">
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">For organizations with complex cloud environments</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    window.location.href = "mailto:contact@infraudit.io?subject=InfrAudit Enterprise Inquiry";
                  }}
                >
                  Contact Sales
                </Button>
              </div>
              
              <div className="p-6 bg-gray-50 dark:bg-gray-800/70 border-t dark:border-gray-700">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">Unlimited resources</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">Enterprise-grade security</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">Custom alerting rules</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">Dedicated support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">Unlimited data retention</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-300">Custom integrations</span>
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="w-full py-20 px-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Optimize Your Cloud?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Join our pilot users and trust InfrAudit to secure and optimize your cloud infrastructure.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="px-8 group relative overflow-hidden hover:bg-primary-600 transition-colors"
              onClick={() => window.location.href = "/auth"}
            >
              <span className="relative z-10">Start Free Trial</span>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-8 group relative overflow-hidden hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-colors"
              onClick={() => {
                // Open email client with pre-filled subject
                window.location.href = "mailto:contact@infraudit.in?subject=InfrAudit Sales Inquiry";
              }}
            >
              <span className="relative z-10">Contact Us</span>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}