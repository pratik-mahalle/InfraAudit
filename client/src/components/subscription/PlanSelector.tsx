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

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await apiRequest('GET', '/api/subscriptions/plans');
        const plansData = await response.json();
        setPlans(plansData);
        
        // Also fetch current subscription status
        const statusResponse = await apiRequest('GET', '/api/subscriptions/status');
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setCurrentPlan(statusData.planType || 'free');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast({
          title: 'Error',
          description: 'Failed to load subscription plans. Please try again later.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    };
    
    fetchPlans();
  }, [toast]);

  const handleSelectPlan = async (planId: string) => {
    if (planId === currentPlan) {
      return; // Already on this plan
    }
    
    setProcessingPlan(planId);
    
    try {
      if (planId === 'free') {
        // Cancel subscription
        const response = await apiRequest('POST', '/api/subscriptions/cancel');
        if (response.ok) {
          setCurrentPlan('free');
          toast({
            title: 'Subscription Cancelled',
            description: 'Your subscription has been downgraded to the free plan.',
          });
        } else {
          throw new Error('Failed to cancel subscription');
        }
      } else if (plans[planId].price === 0) {
        // Free plan upgrade (no payment required)
        const response = await apiRequest('POST', '/api/subscriptions/create', { planType: planId });
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
        // Paid plan - redirect to checkout
        const response = await apiRequest('POST', '/api/subscriptions/checkout', { planType: planId });
        if (response.ok) {
          const { checkoutUrl } = await response.json();
          window.location.href = checkoutUrl;
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