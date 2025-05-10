import React from 'react';
import { OnboardingStep } from './OnboardingContext';

// Content for different onboarding steps
export const OnboardingContent: Record<OnboardingStep, {
  title: string;
  message: string;
  mascotExpression: 'happy' | 'thinking' | 'alert';
  position?: string;
  targetElementId?: string;
}> = {
  'welcome': {
    title: 'Welcome to CloudGuard!',
    message: "I'm Cirrus, your cloud assistant! I'll help you get started with monitoring and optimizing your cloud infrastructure.",
    mascotExpression: 'happy',
    position: 'center',
  },
  'dashboard-overview': {
    title: 'Dashboard Overview',
    message: "This is your main dashboard. Here you can see important metrics from all your cloud providers at a glance. Let's set up your first provider!",
    mascotExpression: 'happy',
    targetElementId: 'dashboard-overview-section',
  },
  'connect-aws': {
    title: 'Connect Your Cloud Provider',
    message: "Let's connect your AWS account to monitor resources, security, and costs. Click on Cloud Providers in the sidebar.",
    mascotExpression: 'thinking',
    targetElementId: 'cloud-providers-nav',
  },
  'security-monitoring': {
    title: 'Security Monitoring',
    message: "CloudGuard automatically scans for security configuration drifts and compliance issues in your infrastructure.",
    mascotExpression: 'alert',
    targetElementId: 'security-monitoring-section',
  },
  'cost-optimization': {
    title: 'Cost Optimization',
    message: "Our AI analyzes your usage patterns to recommend ways to reduce cloud spending. We've already identified some potential savings!",
    mascotExpression: 'happy',
    targetElementId: 'cost-optimization-section',
  },
  'alerts-setup': {
    title: 'Set Up Alerts',
    message: "Configure notifications for cost anomalies and security issues. We can send these to Slack, email, or other channels.",
    mascotExpression: 'thinking',
    targetElementId: 'alerts-section',
  },
  'completed': {
    title: 'All Set!',
    message: "Great job! You're now ready to start monitoring your cloud infrastructure with CloudGuard. I'll be here if you need help!",
    mascotExpression: 'happy',
    position: 'center',
  },
};

// Helper component to get content for a specific step
interface OnboardingMessageProps {
  step: OnboardingStep;
}

export const OnboardingMessage: React.FC<OnboardingMessageProps> = ({ step }) => {
  const content = OnboardingContent[step];
  
  return (
    <div className="onboarding-message">
      <h4 className="text-lg font-semibold mb-1">{content.title}</h4>
      <p>{content.message}</p>
    </div>
  );
};