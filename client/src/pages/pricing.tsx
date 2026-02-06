import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, CloudLightning } from "lucide-react";
import { Link } from "wouter";

export default function PricingPage() {
  const { user } = useAuth();
  const [billingInterval, setBillingInterval] = useState("monthly");

  // Pricing tiers with monthly and annual pricing
  const pricingTiers = [
    {
      name: "Community (Open Source)",
      description: "Self-hosted, free forever. Ideal for individuals and small teams",
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        "Core features",
        "Community support",
        "MIT License",
      ],
      isPopular: false,
      ctaText: "Deploy Self-Hosted",
      isOss: true,
    },
    {
      name: "Starter",
      description: "Essential monitoring for small cloud deployments",
      monthlyPrice: 49,
      annualPrice: 470,
      features: [
        "Up to 50 cloud resources",
        "Basic security drift detection",
        "7-day data retention",
        "Cost monitoring",
        "Email support",
      ],
      isPopular: false,
      ctaText: "Start Starter Plan",
    },
    {
      name: "Professional",
      description: "Advanced monitoring and optimization for growing teams",
      monthlyPrice: 99,
      annualPrice: 950,
      features: [
        "Up to 200 cloud resources",
        "Advanced security drift detection",
        "30-day data retention",
        "Cost optimization recommendations",
        "Predictive cost analysis",
        "Slack integration",
        "Priority email support",
      ],
      isPopular: true,
      ctaText: "Start Pro Plan",
    },
    {
      name: "Enterprise",
      description: "Comprehensive solution for large-scale cloud infrastructure",
      monthlyPrice: 249,
      annualPrice: 2390,
      features: [
        "Unlimited cloud resources",
        "Custom compliance policies",
        "90-day data retention",
        "Advanced AI recommendations",
        "Multi-account management",
        "Custom integrations",
        "SSO/SAML authentication",
        "Dedicated support manager",
      ],
      isPopular: false,
      ctaText: "Contact Sales",
    },
  ];

  return (
    <div className="container max-w-6xl py-10">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl mb-4">
          Upgrade to <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">InfrAudit Pro</span>
        </h1>

        {user?.trialStatus === "expired" ? (
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            Your free trial has expired. Choose a plan to continue using InfrAudit.
          </p>
        ) : (
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            Choose the perfect plan for your infrastructure monitoring needs
          </p>
        )}

        <div className="flex justify-center mb-8">
          <Tabs
            defaultValue="monthly"
            value={billingInterval}
            onValueChange={setBillingInterval}
            className="w-[400px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="annual">Annual <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">Save 20%</span></TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 place-items-center">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.name}
              className={`flex flex-col ${tier.isPopular ? 'border-blue-500 dark:border-blue-400 shadow-lg relative' : ''}`}
            >
              {tier.isPopular && (
                <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/2">
                  <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className={`${tier.isPopular ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-grow">
                <div className="mt-2 mb-6">
                  {tier.isOss ? (
                    <>
                      <p className="text-4xl font-bold">Free</p>
                      <p className="text-gray-500 dark:text-gray-400">Self-hosted</p>
                    </>
                  ) : (
                    <>
                      <p className="text-4xl font-bold">
                        ${billingInterval === "monthly" ? tier.monthlyPrice : tier.annualPrice}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        per {billingInterval === "monthly" ? "month" : "year"}
                      </p>
                    </>
                  )}
                </div>

                <ul className="space-y-2">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {tier.isOss ? (
                  <a
                    className="w-full inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium transition-colors bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    href="https://github.com/thedevopsguy/InfraAudit"
                    target="_blank" rel="noopener noreferrer"
                  >
                    {tier.ctaText}
                  </a>
                ) : (
                  <Button
                    className={`w-full ${tier.isPopular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={tier.isPopular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link href="/subscription">{tier.ctaText}</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-16 text-center">
        <div className="inline-flex items-center gap-2 p-6 rounded-lg bg-blue-50 dark:bg-blue-950/30 mb-4">
          <CloudLightning className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <span className="font-medium text-lg">Need something custom?</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Enterprise-Grade Solutions</h2>
        <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300 mb-6">
          Contact our sales team for custom pricing, dedicated support, and tailored solutions for your organization's unique cloud infrastructure requirements.
        </p>
        <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
          Contact Sales Team
        </Button>
      </div>
    </div>
  );
}