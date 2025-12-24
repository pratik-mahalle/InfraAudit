import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import PlanSelector from '@/components/subscription/PlanSelector';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, InfoIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SubscriptionPage = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('plans');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <>
      <Helmet>
        <title>Subscription Plans - InfraAudit</title>
        <meta name="description" content="Choose the right InfraAudit subscription plan for your organization's cloud monitoring needs." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Subscription & Billing</h1>
            <p className="text-muted-foreground">
              Manage your InfraAudit subscription and billing information
            </p>
          </div>
          
          {user.organizationId && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Organization Account</AlertTitle>
              <AlertDescription>
                You're viewing the subscription for <span className="font-medium">{user.organization?.name || 'your organization'}</span>. 
                All changes will affect all users in your organization.
              </AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue="plans" onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
              <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
              <TabsTrigger value="billing">Billing History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="plans" className="mt-6">
              <div className="mb-4 p-4 rounded border bg-muted/40 text-sm">
                InfraAudit is open source. You can use the Community edition by self-hosting for free, or choose a managed plan below.
                <a
                  href="https://github.com/thedevopsguy/InfraAudit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 underline"
                >
                  View on GitHub
                </a>
              </div>
              <PlanSelector />
            </TabsContent>
            
            <TabsContent value="billing" className="mt-6">
              <div className="bg-muted/40 rounded-lg p-12 text-center border">
                <h3 className="text-xl font-medium mb-2">Billing History</h3>
                <p className="text-muted-foreground mb-6">
                  View and download your past invoices and payment history
                </p>
                
                {user.stripeCustomerId ? (
                  <div className="text-center mb-6">
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/subscriptions/billing-portal', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                          });
                          
                          if (response.ok) {
                            const { portalUrl } = await response.json();
                            window.location.href = portalUrl;
                          } else {
                            throw new Error('Failed to open billing portal');
                          }
                        } catch (error) {
                          console.error('Error opening billing portal:', error);
                        }
                      }}
                      className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium text-white transition-colors bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      View Billing Portal
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="mb-4">No billing information available yet.</p>
                    <button
                      onClick={() => setActiveTab('plans')}
                      className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium transition-colors bg-background border border-input rounded-md hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      Choose a Plan
                    </button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default SubscriptionPage;