import { WebClient, ChatPostMessageArguments } from "@slack/web-api";
import { Alert, SecurityDrift, CostAnomaly } from "@shared/schema";

// Initialize Slack Web Client
if (!process.env.SLACK_BOT_TOKEN) {
  console.warn("SLACK_BOT_TOKEN environment variable is not set. Slack notifications will be disabled.");
}

if (!process.env.SLACK_CHANNEL_ID) {
  console.warn("SLACK_CHANNEL_ID environment variable is not set. Slack notifications will be disabled.");
}

const slack = new WebClient(process.env.SLACK_BOT_TOKEN || "");
const defaultChannel = process.env.SLACK_CHANNEL_ID || "";

/**
 * Service for sending notifications to Slack
 */
export class SlackService {
  /**
   * Check if Slack integration is properly configured
   */
  isConfigured(): boolean {
    return !!process.env.SLACK_BOT_TOKEN && !!process.env.SLACK_CHANNEL_ID;
  }

  /**
   * Send a simple text message to Slack
   * @param text Message text
   * @param channel Optional channel override
   */
  async sendMessage(text: string, channel?: string): Promise<string | undefined> {
    if (!this.isConfigured()) {
      console.warn("Slack is not configured. Message not sent:", text);
      return undefined;
    }

    try {
      const response = await slack.chat.postMessage({
        channel: channel || defaultChannel || "",
        text
      });
      
      return response.ts;
    } catch (error) {
      console.error("Error sending Slack message:", error);
      throw error;
    }
  }

  /**
   * Send a rich message with blocks to Slack
   * @param blocks Slack blocks
   * @param text Fallback text
   * @param channel Optional channel override
   */
  async sendRichMessage(
    blocks: any[],
    text: string,
    channel?: string
  ): Promise<string | undefined> {
    if (!this.isConfigured()) {
      console.warn("Slack is not configured. Rich message not sent:", text);
      return undefined;
    }

    try {
      const response = await slack.chat.postMessage({
        channel: channel || defaultChannel || "",
        blocks,
        text
      });
      
      return response.ts;
    } catch (error) {
      console.error("Error sending Slack rich message:", error);
      throw error;
    }
  }

  /**
   * Send an alert notification to Slack
   * @param alert Alert to notify about
   */
  async sendAlertNotification(alert: Alert): Promise<string | undefined> {
    const severity = this.getSeverityEmoji(alert.severity);
    const fallbackText = `${severity} ${alert.title}`;
    
    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${severity} New Alert: ${alert.title}`,
          emoji: true
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: alert.message
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Type:*\n${alert.type}`
          },
          {
            type: "mrkdwn",
            text: `*Severity:*\n${this.formatSeverity(alert.severity)}`
          },
          {
            type: "mrkdwn",
            text: `*Time:*\n${new Date(alert.createdAt).toLocaleString()}`
          },
          {
            type: "mrkdwn",
            text: `*Status:*\n${alert.status}`
          }
        ]
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Details",
              emoji: true
            },
            style: "primary",
            url: `${process.env.APP_URL || ""}/alerts`
          }
        ]
      },
      {
        type: "divider"
      }
    ];

    return this.sendRichMessage(blocks, fallbackText);
  }

  /**
   * Send a security drift notification to Slack
   * @param drift Security drift to notify about
   */
  async sendSecurityDriftNotification(drift: SecurityDrift): Promise<string | undefined> {
    const severity = this.getSeverityEmoji(drift.severity);
    const fallbackText = `${severity} Security Drift Detected: ${drift.driftType}`;
    
    // Extract relevant details from the drift details JSON field
    const details = drift.details as Record<string, any> || {};
    const description = details.description || "No description provided";
    const currentValue = details.currentValue || "N/A";
    const expectedValue = details.expectedValue || "N/A";
    const remediationSteps = details.remediationSteps || "No remediation steps provided";
    
    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${severity} Security Drift Detected`,
          emoji: true
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Drift Type:* ${drift.driftType}\n*Resource:* ${drift.resourceId}\n\n${description}`
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Severity:*\n${this.formatSeverity(drift.severity)}`
          },
          {
            type: "mrkdwn",
            text: `*Detected:*\n${new Date(drift.detectedAt).toLocaleString()}`
          },
          {
            type: "mrkdwn",
            text: `*Current Value:*\n\`${currentValue}\``
          },
          {
            type: "mrkdwn",
            text: `*Expected Value:*\n\`${expectedValue}\``
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Remediation Recommendation:*\n" + remediationSteps
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Details",
              emoji: true
            },
            style: "primary",
            url: `${process.env.APP_URL || ""}/security`
          }
        ]
      },
      {
        type: "divider"
      }
    ];

    return this.sendRichMessage(blocks, fallbackText);
  }

  /**
   * Send a cost anomaly notification to Slack
   * @param anomaly Cost anomaly to notify about
   */
  async sendCostAnomalyNotification(anomaly: CostAnomaly): Promise<string | undefined> {
    const emoji = this.getSeverityEmoji(anomaly.severity);
    
    // Calculate cost impact from previous and current cost
    const costImpact = anomaly.currentCost - anomaly.previousCost;
    const costImpactFormatted = (costImpact / 100).toFixed(2); // Convert from cents to dollars
    
    // Generate description based on anomaly details
    const description = `${anomaly.anomalyType} anomaly detected for resource. Cost increased by ${anomaly.percentage}% (${costImpactFormatted} USD).`;
    const fallbackText = `${emoji} Cost Anomaly Detected: ${description}`;
    
    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${emoji} Cost Anomaly Detected`,
          emoji: true
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: description
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Resource:*\n${anomaly.resourceId}`
          },
          {
            type: "mrkdwn",
            text: `*Severity:*\n${this.formatSeverity(anomaly.severity)}`
          },
          {
            type: "mrkdwn",
            text: `*Cost Impact:*\n$${costImpactFormatted}`
          },
          {
            type: "mrkdwn",
            text: `*Detected:*\n${new Date(anomaly.detectedAt).toLocaleString()}`
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Recommended Action:*\nReview resource usage and consider rightsizing or reserved instances if this is a recurring pattern."
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Details",
              emoji: true
            },
            style: "primary",
            url: `${process.env.APP_URL || ""}/cost`
          }
        ]
      },
      {
        type: "divider"
      }
    ];

    return this.sendRichMessage(blocks, fallbackText);
  }

  /**
   * Get an emoji based on severity
   * @param severity Severity level
   */
  private getSeverityEmoji(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '🚨';
      case 'high':
        return '🔴';
      case 'medium':
        return '🟠';
      case 'low':
        return '🟡';
      case 'info':
        return 'ℹ️';
      default:
        return '⚠️';
    }
  }

  /**
   * Format severity text for display
   * @param severity Severity level
   */
  private formatSeverity(severity: string): string {
    const severityMap: { [key: string]: string } = {
      'critical': '🚨 Critical',
      'high': '🔴 High',
      'medium': '🟠 Medium',
      'low': '🟡 Low',
      'info': 'ℹ️ Info'
    };
    
    return severityMap[severity.toLowerCase()] || severity;
  }
}

// Export singleton instance
export const slackService = new SlackService();