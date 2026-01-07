import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from '@/hooks/use-auth';

interface PlanDetails {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  features: string[];
  resourceLimit: number;
  userLimit: number;
}

const PlanSelector = () => {
  const [plans, setPlans] = useState<Record<string, PlanDetails>>({});
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Default plans configuration for fallback
  const defaultPlans: Record<string, PlanDetails> = {
    free: {
      id: 'free',
      name: 'Community',
      description: 'Perfect for individuals and small projects',
      price: 0,
      features: ['Up to 3 clusters', 'Basic resource monitoring', '24h data retention', 'Community support'],
      resourceLimit: 100,
      userLimit: 1
    },
    starter: {
      id: 'starter',
      name: 'Starter',
      description: 'For growing teams and startups',
      price: 2900,
      features: ['Up to 10 clusters', 'Advanced metrics', '30-day data retention', 'Email support', 'Alerting'],
      resourceLimit: 500,
      userLimit: 5
    },
    pro: {
      id: 'pro',
      name: 'Pro',
      description: 'For scaling organizations',
      price: 9900,
      features: ['Unlimited clusters', 'Custom dashboards', '1-year data retention', 'Priority support', 'SSO Integration', 'API Access'],
      resourceLimit: 2000,
      userLimit: 20
    },
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Custom solutions for large enterprises',
      price: 29900,
      features: ['Unmetered usage', 'Dedicated infrastructure', 'Unlimited retention', '24/7 Phone support', 'On-premise deployment', 'Custom SLAs'],
      resourceLimit: 10000,
      userLimit: 100
    }
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // Fetch plans from new endpoint
        const response = await apiRequest('GET', '/api/billing/plans');

        const json = await response.json();
        // Handle { success: true, data: [...] } format
        if (json.success && Array.isArray(json.data)) {
          // Convert array to record for easy lookup
          const plansMap: Record<string, PlanDetails> = {};
          json.data.forEach((plan: any) => {
            plansMap[plan.id] = {
              id: plan.id,
              name: plan.name,
              description: plan.description || `${plan.name} plan`,
              price: (plan.price > 0 && plan.price < 1000) ? plan.price * 100 : plan.price,
              features: plan.features || [],
              resourceLimit: plan.resourceLimit || 100,
              userLimit: plan.userLimit || 1
            };
          });
          setPlans(plansMap);
        } else {
          // Fallback
          setPlans(defaultPlans);
        }

        // Fetch billing info
        try {
          const statusResponse = await apiRequest('GET', '/api/billing/info');
          if (statusResponse.ok) {
            const statusJson = await statusResponse.json();
            if (statusJson.success && statusJson.data && statusJson.data.plan) {
              setCurrentPlan(statusJson.data.plan.id);
            }
          }
        } catch (e) {
          console.log('Using default subscription status (free)');
          setCurrentPlan('free');
        }

      } catch (error) {
        console.warn('Backend not available, using default plans:', error);
        setPlans(defaultPlans);
        setCurrentPlan('free');

        if (error instanceof Error && !error.message.includes('404')) {
          toast({
            title: 'Offline Mode',
            description: 'Could not connect to billing server. Showing default plans.',
            variant: 'default',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [toast]);

  const handleSelectPlan = async (planId: string) => {
    if (planId === currentPlan) {
      return;
    }

    setProcessingPlan(planId);

    try {
      if (plans[planId].price === 0) {
        // Free plan - update subscription directly
        const response = await apiRequest('POST', '/api/billing/subscription', { planId: planId });

        if (response.ok) {
          setCurrentPlan(planId);
          toast({
            title: 'Plan Updated',
            description: `You are now on the ${plans[planId].name}.`,
          });
        } else {
          throw new Error('Failed to update plan');
        }
      } else {
        // Paid plan - create checkout session
        const response = await apiRequest('POST', '/api/billing/checkout', { planId: planId });

        if (response.ok) {
          const json = await response.json();
          // Expect { success: true, data: { checkoutUrl: "..." } } or just { checkoutUrl: "..." }
          const checkoutUrl = json.data?.checkoutUrl || json.checkoutUrl;

          if (checkoutUrl) {
            window.location.href = checkoutUrl;
          } else {
            throw new Error('Invalid checkout response');
          }
        } else {
          throw new Error('Failed to create checkout session');
        }
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to update subscription plan. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `$${(price / 100).toFixed(2)}/mo`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Subscription Plans</h2>
        <p className="text-muted-foreground">
          Choose the right plan for your cloud monitoring needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.values(plans).map((plan) => (
          <Card
            key={plan.id}
            className={`${currentPlan === plan.id ? 'border-primary ring-2 ring-primary' : 'border'} flex flex-col`}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{plan.name}</CardTitle>
                {currentPlan === plan.id && (
                  <Badge variant="default" className="bg-primary text-white">Current</Badge>
                )}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="mb-6">
                <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
              </div>
              <div className="space-y-2">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-center border-t p-4">
              {currentPlan === plan.id ? (
                <Button variant="outline" disabled className="w-full">
                  Current Plan
                </Button>
              ) : (
                <Button
                  variant={plan.price > 0 ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={!!processingPlan}
                  className="w-full"
                >
                  {processingPlan === plan.id ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {plan.price === 0 ? 'Select Plan' : 'Subscribe'}
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {user?.organizationId && user?.role === 'admin' && currentPlan !== 'free' && (
        <div className="mt-8 p-4 border rounded-lg bg-muted">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-destructive/10 rounded-full">
              <X className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-medium">Cancel Subscription</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You can cancel your subscription at any time. Your plan will remain active until the end of the current billing cycle.
              </p>
              <Button
                variant="destructive"
                className="mt-4"
                onClick={() => handleSelectPlan('free')}
                disabled={!!processingPlan}
              >
                {processingPlan === 'free' ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    Processing...
                  </>
                ) : (
                  'Cancel Subscription'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {currentPlan !== 'free' && (
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const response = await apiRequest('POST', '/api/subscriptions/billing-portal');
                if (response.ok) {
                  const { portalUrl } = await response.json();
                  window.location.href = portalUrl;
                }
              } catch (error) {
                console.error('Error opening billing portal:', error);
                toast({
                  title: 'Error',
                  description: 'Failed to open billing portal. Please try again later.',
                  variant: 'destructive',
                });
              }
            }}
          >
            Manage Billing
          </Button>
        </div>
      )}
    </div>
  );
};

export default PlanSelector;