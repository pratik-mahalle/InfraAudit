import React from 'react';
import { Helmet } from 'react-helmet';
import PlanSelector from '@/components/subscription/PlanSelector';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';

const SubscriptionPage = () => {
  const { user, isLoading } = useAuth();

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
        <title>Subscription Plans - CloudGuard</title>
        <meta name="description" content="Choose the right CloudGuard subscription plan for your organization's cloud monitoring needs." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <PlanSelector />
        </div>
      </div>
    </>
  );
};

export default SubscriptionPage;