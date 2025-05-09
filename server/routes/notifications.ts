import { Router, Request, Response } from "express";
import { slackService } from "../services/slack-service";
import { Alert, CostAnomaly, SecurityDrift } from "@shared/schema";
import { storage } from "../storage";
import { z } from "zod";

const router = Router();

// Schema for send notification payload
const sendNotificationSchema = z.object({
  message: z.string().min(1, "Message is required"),
  type: z.enum(["simple", "rich"]).optional().default("simple"),
  blocks: z.array(z.any()).optional(),
});

// Schema for test notification payload
const testNotificationSchema = z.object({
  type: z.enum(["alert", "security", "cost"]).default("alert"),
  id: z.number().optional(),
});

/**
 * Send a direct message to Slack
 * POST /api/notifications/slack
 */
router.post("/slack", async (req: Request, res: Response) => {
  try {
    const data = sendNotificationSchema.parse(req.body);
    
    let result: string | undefined;
    
    if (data.type === "simple") {
      result = await slackService.sendMessage(data.message);
    } else if (data.blocks) {
      result = await slackService.sendRichMessage(data.blocks, data.message);
    } else {
      return res.status(400).json({ error: "Blocks are required for rich messages" });
    }
    
    return res.status(200).json({ success: true, messageId: result });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Send a test notification
 * POST /api/notifications/test
 */
router.post("/test", async (req: Request, res: Response) => {
  try {
    const data = testNotificationSchema.parse(req.body);
    let result: string | undefined;
    
    switch (data.type) {
      case "alert": {
        let alert: Alert | undefined;
        
        if (data.id) {
          alert = await storage.getAlertById(data.id);
          if (!alert) {
            return res.status(404).json({ error: `Alert with ID ${data.id} not found` });
          }
        } else {
          const alerts = await storage.getAlerts();
          alert = alerts[0]; // Get the first alert as a test
          
          if (!alert) {
            return res.status(404).json({ error: "No alerts found for testing" });
          }
        }
        
        result = await slackService.sendAlertNotification(alert);
        break;
      }
      
      case "security": {
        let drift: SecurityDrift | undefined;
        
        if (data.id) {
          drift = await storage.getSecurityDriftById(data.id);
          if (!drift) {
            return res.status(404).json({ error: `Security drift with ID ${data.id} not found` });
          }
        } else {
          const drifts = await storage.getSecurityDrifts();
          drift = drifts[0]; // Get the first drift as a test
          
          if (!drift) {
            return res.status(404).json({ error: "No security drifts found for testing" });
          }
        }
        
        result = await slackService.sendSecurityDriftNotification(drift);
        break;
      }
      
      case "cost": {
        let anomaly: CostAnomaly | undefined;
        
        if (data.id) {
          anomaly = await storage.getCostAnomalyById(data.id);
          if (!anomaly) {
            return res.status(404).json({ error: `Cost anomaly with ID ${data.id} not found` });
          }
        } else {
          const anomalies = await storage.getCostAnomalies();
          anomaly = anomalies[0]; // Get the first anomaly as a test
          
          if (!anomaly) {
            return res.status(404).json({ error: "No cost anomalies found for testing" });
          }
        }
        
        result = await slackService.sendCostAnomalyNotification(anomaly);
        break;
      }
    }
    
    return res.status(200).json({ success: true, messageId: result });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Get Slack configuration status
 * GET /api/notifications/status
 */
router.get("/status", (req: Request, res: Response) => {
  const isConfigured = slackService.isConfigured();
  
  return res.status(200).json({
    slack: {
      configured: isConfigured,
      channel: isConfigured ? process.env.SLACK_CHANNEL_ID : null
    }
  });
});

export const notificationsRouter = router;