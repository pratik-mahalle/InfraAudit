import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

const SubscriptionCancel = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Show cancel toast
    toast({
      title: 'Subscription Cancelled',
      description: 'Your subscription process was cancelled.',
      variant: 'default',
    });
  }, [toast]);

  return (
    <>
      <Helmet>
        <title>Subscription Cancelled - CloudGuard</title>
        <meta name="description" content="Your CloudGuard subscription process was cancelled." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="flex justify-center mb-6">
            <AlertCircle className="h-20 w-20 text-yellow-500" />
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Subscription Cancelled</h1>
          
          <p className="text-muted-foreground mb-8">
            Your subscription process was cancelled. No charges were made to your account.
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
              View Subscription Plans
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubscriptionCancel;