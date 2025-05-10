import React from 'react';
import { OnboardingStep } from './OnboardingContext';

// Content for different onboarding steps
export const OnboardingContent: Record<OnboardingStep, {
  title: string;
  message: string;
  mascotExpression: 'happy' | 'thinking' | 'alert';
  position?: string;
  targetElementId?: string;
  routePath?: string;
}> = {
  'welcome': {
    title: 'Welcome to CloudGuard!',
    message: "I'm Cirrus, your cloud assistant! I'll help you get started with monitoring and optimizing your cloud infrastructure across AWS, Azure, and GCP.",
    mascotExpression: 'happy',
    position: 'center',
  },
  'dashboard-overview': {
    title: 'Dashboard Overview',
    message: "This is your main dashboard. Here you can see important metrics from all your cloud providers at a glance. We monitor costs, security, and performance in one unified view.",
    mascotExpression: 'happy',
    targetElementId: 'dashboard-overview-section',
    routePath: '/',
  },
  'connect-aws': {
    title: 'Connect Your Cloud Providers',
    message: "First, let's connect your cloud accounts to monitor resources, security, and costs. CloudGuard supports AWS, Azure, and Google Cloud Platform.",
    mascotExpression: 'thinking',
    targetElementId: 'cloud-providers-nav',
    routePath: '/cloud-providers',
  },
  'aws-credentials': {
    title: 'Adding Your AWS Account',
    message: "Enter your AWS Access Key ID and Secret Key to connect your account. We'll securely store these credentials and use them to monitor your resources.",
    mascotExpression: 'thinking',
    position: 'center',
    routePath: '/cloud-providers',
  },
  'security-monitoring': {
    title: 'Security Monitoring',
    message: "CloudGuard automatically scans for security configuration drifts and compliance issues in your infrastructure. We check against industry best practices and standards like CIS, HIPAA, and PCI DSS.",
    mascotExpression: 'alert',
    targetElementId: 'security-monitoring-section',
    routePath: '/security',
  },
  'security-drifts': {
    title: 'Security Configuration Drifts',
    message: "We detect when your cloud resources deviate from your security baseline or best practices. This helps prevent potential security vulnerabilities before they're exploited.",
    mascotExpression: 'alert',
    position: 'right',
    routePath: '/security',
  },
  'cost-optimization': {
    title: 'Cost Optimization',
    message: "Our AI analyzes your usage patterns to recommend ways to reduce cloud spending. We identify idle resources, right-sizing opportunities, and reserved instance recommendations.",
    mascotExpression: 'happy',
    targetElementId: 'cost-optimization-section',
    routePath: '/cost',
  },
  'cost-prediction': {
    title: 'Cost Prediction',
    message: "We use machine learning to forecast your future cloud costs. This helps you budget more effectively and avoid unexpected expenses at the end of the month.",
    mascotExpression: 'thinking',
    position: 'bottom',
    routePath: '/cost-prediction',
  },
  'resource-utilization': {
    title: 'Resource Utilization',
    message: "Monitor how efficiently you're using your cloud resources. We track CPU, memory, storage, and network utilization to help you optimize performance and cost.",
    mascotExpression: 'thinking',
    position: 'right',
    routePath: '/resources',
  },
  'alerts-setup': {
    title: 'Set Up Alerts',
    message: "Configure notifications for cost anomalies and security issues. We can send these to Slack, email, or other channels to ensure your team stays informed.",
    mascotExpression: 'thinking',
    targetElementId: 'alerts-section',
    routePath: '/alerts',
  },
  'slack-integration': {
    title: 'Slack Integration',
    message: "Connect CloudGuard to your Slack workspace to receive real-time alerts and reports. You can customize which alerts go to specific channels for targeted notifications.",
    mascotExpression: 'happy',
    position: 'right',
    routePath: '/settings',
  },
  'settings-customization': {
    title: 'Customize Your Experience',
    message: "Visit the Settings page to customize your dashboard, notification preferences, and alert thresholds. You can tailor CloudGuard to your specific needs.",
    mascotExpression: 'thinking',
    position: 'bottom',
    routePath: '/settings',
  },
  'ai-insights': {
    title: 'AI-Powered Insights',
    message: "CloudGuard uses advanced AI to provide personalized recommendations and insights. Our AI continuously learns from your infrastructure to provide more accurate suggestions over time.",
    mascotExpression: 'happy',
    position: 'center',
    routePath: '/',
  },
  'completed': {
    title: 'All Set!',
    message: "Great job! You're now ready to start monitoring your cloud infrastructure with CloudGuard. I'll be here if you need help - just click the cloud icon in the bottom right corner.",
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