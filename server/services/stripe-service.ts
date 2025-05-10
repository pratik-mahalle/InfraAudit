import Stripe from 'stripe';
import { storage } from '../storage';
import { User, Organization } from '@shared/schema';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
// Note: Using default API version as the Stripe package has updated their API versions

export interface PlanDetails {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  features: string[];
  resourceLimit: number;
  userLimit: number;
}

// Available plan definitions
export const plans: Record<string, PlanDetails> = {
  free: {
    id: 'free',
    name: 'Free Plan',
    description: 'Basic monitoring for small teams',
    price: 0, // Free
    features: [
      'Monitor up to 10 resources',
      'Basic cost anomaly detection',
      'Basic security drift detection',
      'Email alerts'
    ],
    resourceLimit: 10,
    userLimit: 2
  },
  basic: {
    id: 'basic',
    name: 'Basic Plan',
    description: 'Essential monitoring for growing teams',
    price: 4900, // $49/month
    features: [
      'Monitor up to 50 resources',
      'Advanced cost anomaly detection',
      'Security drift detection with remediation',
      'Email & Slack alerts',
      'Cost optimization recommendations'
    ],
    resourceLimit: 50,
    userLimit: 5
  },
  pro: {
    id: 'pro',
    name: 'Pro Plan',
    description: 'Advanced monitoring for professional teams',
    price: 9900, // $99/month
    features: [
      'Monitor unlimited resources',
      'Real-time cost anomaly detection',
      'Advanced security drift detection with auto-remediation',
      'Email, Slack & SMS alerts',
      'AI-powered cost optimization',
      'Custom dashboards',
      'API access'
    ],
    resourceLimit: 500,
    userLimit: 20
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Plan',
    description: 'Complete solution for large organizations',
    price: 29900, // $299/month
    features: [
      'Unlimited resources',
      'All Pro features',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'On-premises deployment option',
      'SSO & advanced user management'
    ],
    resourceLimit: 10000,
    userLimit: 100
  }
};

class StripeService {
  /**
   * Creates a new Stripe customer for a user or organization
   */
  async createCustomer(entity: User | Organization): Promise<string> {
    try {
      const isOrganization = 'billingEmail' in entity;
      const customer = await stripe.customers.create({
        email: isOrganization ? entity.billingEmail : entity.email,
        name: isOrganization ? entity.displayName || entity.name : entity.fullName || entity.username,
        metadata: {
          entityId: String(entity.id),
          entityType: isOrganization ? 'organization' : 'user'
        }
      });

      return customer.id;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create customer in Stripe');
    }
  }

  /**
   * Creates a subscription for a customer
   */
  async createSubscription(customerId: string, planType: string): Promise<Stripe.Subscription> {
    try {
      const plan = plans[planType];
      if (!plan) {
        throw new Error(`Invalid plan type: ${planType}`);
      }

      // For real implementation, you should create price objects in Stripe dashboard
      // and use those IDs instead of creating prices on the fly
      // First create a product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
      });
      
      // Then create a price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price,
        currency: 'usd',
        recurring: { interval: 'month' },
      });
      
      // Create the subscription with the price
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Updates a subscription
   */
  async updateSubscription(subscriptionId: string, planType: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const plan = plans[planType];
      
      if (!plan) {
        throw new Error(`Invalid plan type: ${planType}`);
      }

      // Create a new product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
      });
      
      // Create a new price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price,
        currency: 'usd',
        recurring: { interval: 'month' },
      });
      
      // Update the subscription with the new price
      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: price.id,
          },
        ],
      });

      return updatedSubscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Cancels a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Creates a checkout session for a plan
   */
  async createCheckoutSession(customerId: string, planType: string, successUrl: string, cancelUrl: string): Promise<string> {
    try {
      const plan = plans[planType];
      if (!plan) {
        throw new Error(`Invalid plan type: ${planType}`);
      }

      // Create a product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
      });
      
      // Create a price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price,
        currency: 'usd',
        recurring: { interval: 'month' },
      });
      
      // Create checkout session with the price
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return session.url!;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Gets a subscription
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      throw new Error('Failed to retrieve subscription');
    }
  }

  /**
   * Creates a billing portal session for a customer to manage their subscription
   */
  async createBillingPortalSession(customerId: string, returnUrl: string): Promise<string> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return session.url;
    } catch (error) {
      console.error('Error creating billing portal session:', error);
      throw new Error('Failed to create billing portal session');
    }
  }
}

export const stripeService = new StripeService();