import { Router, Request, Response } from 'express';
import { stripeService, plans } from '../services/stripe-service';
import { storage } from '../storage';

const router = Router();

/**
 * Get available subscription plans
 * GET /api/subscriptions/plans
 */
router.get('/plans', (req: Request, res: Response) => {
  res.json(plans);
});

/**
 * Create a new subscription for a user or organization
 * POST /api/subscriptions/create
 */
router.post('/create', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const { planType } = req.body;
    
    if (!plans[planType]) {
      return res.status(400).json({ message: `Invalid plan type: ${planType}` });
    }
    
    const user = req.user;
    const organizationId = user.organizationId;

    // If user is part of an organization, create/update org subscription
    if (organizationId) {
      const organization = await storage.getOrganization(organizationId);
      
      if (!organization) {
        return res.status(404).json({ message: 'Organization not found' });
      }
      
      // Create Stripe customer if not exists
      if (!organization.stripeCustomerId) {
        const customerId = await stripeService.createCustomer(organization);
        await storage.updateOrganization(organizationId, { stripeCustomerId: customerId });
        organization.stripeCustomerId = customerId;
      }
      
      // Create/Update subscription
      if (organization.stripeSubscriptionId) {
        // Update existing subscription
        const subscription = await stripeService.updateSubscription(
          organization.stripeSubscriptionId,
          planType
        );
        
        await storage.updateOrganization(organizationId, {
          planType,
          subscriptionStatus: subscription.status,
          resourceLimit: plans[planType].resourceLimit,
          userLimit: plans[planType].userLimit,
          updatedAt: new Date()
        });
        
        return res.json({
          message: 'Subscription updated successfully',
          planType,
          subscriptionStatus: subscription.status
        });
      } else {
        // Create new subscription
        const subscription = await stripeService.createSubscription(
          organization.stripeCustomerId,
          planType
        );
        
        await storage.updateOrganization(organizationId, {
          planType,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          resourceLimit: plans[planType].resourceLimit,
          userLimit: plans[planType].userLimit,
          updatedAt: new Date()
        });
        
        return res.json({
          message: 'Subscription created successfully',
          subscriptionId: subscription.id,
          planType,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
          subscriptionStatus: subscription.status
        });
      }
    } else {
      // User subscription (not part of an organization)
      if (!user.stripeCustomerId) {
        const customerId = await stripeService.createCustomer(user);
        await storage.updateUser(user.id, { stripeCustomerId: customerId });
        user.stripeCustomerId = customerId;
      }
      
      // Create/Update subscription
      if (user.stripeSubscriptionId) {
        // Update existing subscription
        const subscription = await stripeService.updateSubscription(
          user.stripeSubscriptionId,
          planType
        );
        
        await storage.updateUser(user.id, {
          planType,
          subscriptionStatus: subscription.status,
          updatedAt: new Date()
        });
        
        return res.json({
          message: 'Subscription updated successfully',
          planType,
          subscriptionStatus: subscription.status
        });
      } else {
        // Create new subscription
        const subscription = await stripeService.createSubscription(
          user.stripeCustomerId,
          planType
        );
        
        await storage.updateUser(user.id, {
          planType,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          updatedAt: new Date()
        });
        
        return res.json({
          message: 'Subscription created successfully',
          subscriptionId: subscription.id,
          planType,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
          subscriptionStatus: subscription.status
        });
      }
    }
  } catch (error: any) {
    console.error('Error creating/updating subscription:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Cancel a subscription
 * POST /api/subscriptions/cancel
 */
router.post('/cancel', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const user = req.user;
    const organizationId = user.organizationId;
    
    if (organizationId && user.role === 'admin') {
      // Cancel organization subscription
      const organization = await storage.getOrganization(organizationId);
      
      if (!organization) {
        return res.status(404).json({ message: 'Organization not found' });
      }
      
      if (!organization.stripeSubscriptionId) {
        return res.status(400).json({ message: 'No active subscription found' });
      }
      
      const subscription = await stripeService.cancelSubscription(organization.stripeSubscriptionId);
      
      await storage.updateOrganization(organizationId, {
        subscriptionStatus: 'canceled',
        planType: 'free',
        resourceLimit: plans.free.resourceLimit,
        userLimit: plans.free.userLimit,
        updatedAt: new Date()
      });
      
      return res.json({
        message: 'Subscription canceled successfully',
        subscriptionStatus: subscription.status
      });
    } else {
      // Cancel user subscription
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: 'No active subscription found' });
      }
      
      const subscription = await stripeService.cancelSubscription(user.stripeSubscriptionId);
      
      await storage.updateUser(user.id, {
        subscriptionStatus: 'canceled',
        planType: 'free',
        updatedAt: new Date()
      });
      
      return res.json({
        message: 'Subscription canceled successfully',
        subscriptionStatus: subscription.status
      });
    }
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get current subscription details
 * GET /api/subscriptions/status
 */
router.get('/status', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const user = req.user;
    const organizationId = user.organizationId;
    
    if (organizationId) {
      // Get organization subscription
      const organization = await storage.getOrganization(organizationId);
      
      if (!organization) {
        return res.status(404).json({ message: 'Organization not found' });
      }
      
      const planType = organization.planType || 'free';
      const planDetails = plans[planType];
      
      return res.json({
        planType,
        subscriptionStatus: organization.subscriptionStatus || 'inactive',
        stripeSubscriptionId: organization.stripeSubscriptionId,
        planDetails,
        resourceLimit: organization.resourceLimit,
        userLimit: organization.userLimit
      });
    } else {
      // Get user subscription
      const planType = user.planType || 'free';
      const planDetails = plans[planType];
      
      return res.json({
        planType,
        subscriptionStatus: user.subscriptionStatus || 'inactive',
        stripeSubscriptionId: user.stripeSubscriptionId,
        planDetails
      });
    }
  } catch (error: any) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Create checkout session for subscription
 * POST /api/subscriptions/checkout
 */
router.post('/checkout', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const { planType } = req.body;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const successUrl = `${baseUrl}/subscription/success?plan=${planType}`;
    const cancelUrl = `${baseUrl}/subscription/cancel`;
    
    if (!plans[planType]) {
      return res.status(400).json({ message: `Invalid plan type: ${planType}` });
    }
    
    const user = req.user;
    const organizationId = user.organizationId;
    
    if (organizationId && user.role === 'admin') {
      // Organization checkout
      const organization = await storage.getOrganization(organizationId);
      
      if (!organization) {
        return res.status(404).json({ message: 'Organization not found' });
      }
      
      if (!organization.stripeCustomerId) {
        const customerId = await stripeService.createCustomer(organization);
        await storage.updateOrganization(organizationId, { stripeCustomerId: customerId });
        organization.stripeCustomerId = customerId;
      }
      
      const checkoutUrl = await stripeService.createCheckoutSession(
        organization.stripeCustomerId,
        planType,
        successUrl,
        cancelUrl
      );
      
      return res.json({ checkoutUrl });
    } else {
      // User checkout
      if (!user.stripeCustomerId) {
        const customerId = await stripeService.createCustomer(user);
        await storage.updateUser(user.id, { stripeCustomerId: customerId });
        user.stripeCustomerId = customerId;
      }
      
      const checkoutUrl = await stripeService.createCheckoutSession(
        user.stripeCustomerId,
        planType,
        successUrl,
        cancelUrl
      );
      
      return res.json({ checkoutUrl });
    }
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Create billing portal session
 * POST /api/subscriptions/billing-portal
 */
router.post('/billing-portal', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const returnUrl = `${baseUrl}/settings`;
    
    const user = req.user;
    const organizationId = user.organizationId;
    
    if (organizationId && user.role === 'admin') {
      // Organization billing portal
      const organization = await storage.getOrganization(organizationId);
      
      if (!organization) {
        return res.status(404).json({ message: 'Organization not found' });
      }
      
      if (!organization.stripeCustomerId) {
        return res.status(400).json({ message: 'No billing information found' });
      }
      
      const portalUrl = await stripeService.createBillingPortalSession(
        organization.stripeCustomerId,
        returnUrl
      );
      
      return res.json({ portalUrl });
    } else {
      // User billing portal
      if (!user.stripeCustomerId) {
        return res.status(400).json({ message: 'No billing information found' });
      }
      
      const portalUrl = await stripeService.createBillingPortalSession(
        user.stripeCustomerId,
        returnUrl
      );
      
      return res.json({ portalUrl });
    }
  } catch (error: any) {
    console.error('Error creating billing portal session:', error);
    res.status(500).json({ message: error.message });
  }
});

export const subscriptionsRouter = router;