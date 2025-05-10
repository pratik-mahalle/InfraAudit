import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const SubscriptionSuccess = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [planName, setPlanName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan');
    
    const fetchPlanDetails = async () => {
      try {
        if (plan) {
          const response = await apiRequest('GET', '/api/subscriptions/plans');
          if (response.ok) {
            const plans = await response.json();
            if (plans[plan]) {
              setPlanName(plans[plan].name);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching plan details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlanDetails();
    
    // Show success toast
    toast({
      title: 'Subscription Successful',
      description: 'Your subscription has been activated successfully.',
      variant: 'default',
    });
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Subscription Successful - CloudGuard</title>
        <meta name="description" content="Your CloudGuard subscription has been activated successfully." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="h-20 w-20 text-primary" />
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Subscription Successful!</h1>
          
          <p className="text-muted-foreground mb-8">
            {planName ? (
              <>Your CloudGuard <span className="font-medium">{planName}</span> has been activated successfully.</>
            ) : (
              <>Your CloudGuard subscription has been activated successfully.</>
            )}
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={() => setLocation('/dashboard')}
              className="w-full"
            >
              Go to Dashboard
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setLocation('/subscription')}
              className="w-full"
            >
              Manage Subscription
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubscriptionSuccess;