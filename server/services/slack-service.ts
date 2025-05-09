import { WebClient, ChatPostMessageArguments } from "@slack/web-api";
import { Alert } from "@shared/schema";
import { SecurityDrift } from "@shared/schema";
import { CostAnomaly } from "@shared/schema";

// Initialize Slack Web Client
if (!process.env.SLACK_BOT_TOKEN) {
  console.warn("SLACK_BOT_TOKEN environment variable is not set. Slack notifications will be disabled.");
}

if (!process.env.SLACK_CHANNEL_ID) {
  console.warn("SLACK_CHANNEL_ID environment variable is not set. Slack notifications will be disabled.");
}

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
const defaultChannel = process.env.SLACK_CHANNEL_ID;

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
        channel: channel || defaultChannel,
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
        channel: channel || defaultChannel,
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
          text: alert.description
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
          text: `*Drift Type:* ${drift.driftType}\n*Resource:* ${drift.resourceId}\n\n${drift.description}`
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
            text: `*Current Value:*\n\`${drift.currentValue}\``
          },
          {
            type: "mrkdwn",
            text: `*Expected Value:*\n\`${drift.expectedValue}\``
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Remediation Recommendation:*\n" + drift.remediationSteps
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
    const fallbackText = `${emoji} Cost Anomaly Detected: ${anomaly.description}`;
    
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
          text: anomaly.description
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
            text: `*Cost Impact:*\n$${anomaly.costImpact.toFixed(2)}`
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
          text: "*Remediation Recommendation:*\n" + anomaly.remediationSteps
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