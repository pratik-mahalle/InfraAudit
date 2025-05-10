package services

import (
        "bytes"
        "encoding/json"
        "fmt"
        "log"
        "net/http"
        "time"
)

// SlackService provides integration with Slack
type SlackService struct {
        BotToken  string
        ChannelID string
}

// SlackMessage represents a message to be sent to Slack
type SlackMessage struct {
        Channel string                   `json:"channel"`
        Text    string                   `json:"text,omitempty"`
        Blocks  []map[string]interface{} `json:"blocks,omitempty"`
}

// SlackResponse represents a response from the Slack API
type SlackResponse struct {
        Ok    bool   `json:"ok"`
        Error string `json:"error,omitempty"`
}

// NewSlackService creates a new Slack service
func NewSlackService(botToken, channelID string) *SlackService {
        return &SlackService{
                BotToken:  botToken,
                ChannelID: channelID,
        }
}

// SendMessage sends a message to Slack
func (s *SlackService) SendMessage(message *SlackMessage) error {
        // Set default channel if not provided
        if message.Channel == "" {
                message.Channel = s.ChannelID
        }

        // Marshal message to JSON
        data, err := json.Marshal(message)
        if err != nil {
                return fmt.Errorf("failed to marshal message: %w", err)
        }

        // Create request
        req, err := http.NewRequest("POST", "https://slack.com/api/chat.postMessage", bytes.NewBuffer(data))
        if err != nil {
                return fmt.Errorf("failed to create request: %w", err)
        }

        // Set headers
        req.Header.Set("Content-Type", "application/json")
        req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.BotToken))

        // Send request
        client := &http.Client{}
        resp, err := client.Do(req)
        if err != nil {
                return fmt.Errorf("failed to send request: %w", err)
        }
        defer resp.Body.Close()

        // Check response status
        if resp.StatusCode != http.StatusOK {
                return fmt.Errorf("slack API returned status: %d", resp.StatusCode)
        }

        // Parse response
        var result SlackResponse
        if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
                return fmt.Errorf("failed to decode response: %w", err)
        }

        // Check if the API call was successful
        if !result.Ok {
                return fmt.Errorf("slack API error: %s", result.Error)
        }

        return nil
}

// SendAlertMessage sends an alert message to Slack
func (s *SlackService) SendAlertMessage(title, message, severity, resourceName, resourceType string) error {
        // Create color based on severity
        color := "#2EB67D" // Green for low severity (default)
        if severity == "medium" {
                color = "#ECB22E" // Yellow
        } else if severity == "high" {
                color = "#E01E5A" // Red
        } else if severity == "critical" {
                color = "#8E0000" // Dark red
        }

        // Create blocks for the message
        blocks := []map[string]interface{}{
                {
                        "type": "header",
                        "text": map[string]interface{}{
                                "type": "plain_text",
                                "text": "CloudGuard Alert",
                        },
                },
                {
                        "type": "section",
                        "text": map[string]interface{}{
                                "type":  "mrkdwn",
                                "text":  fmt.Sprintf("*%s*", title),
                        },
                },
                {
                        "type": "section",
                        "text": map[string]interface{}{
                                "type": "mrkdwn",
                                "text": message,
                        },
                        "fields": []map[string]interface{}{
                                {
                                        "type": "mrkdwn",
                                        "text": fmt.Sprintf("*Resource:*\n%s", resourceName),
                                },
                                {
                                        "type": "mrkdwn",
                                        "text": fmt.Sprintf("*Type:*\n%s", resourceType),
                                },
                                {
                                        "type": "mrkdwn",
                                        "text": fmt.Sprintf("*Severity:*\n%s", severity),
                                },
                                {
                                        "type": "mrkdwn",
                                        "text": fmt.Sprintf("*Time:*\n%s", time.Now().Format(time.RFC1123)),
                                },
                        },
                },
                {
                        "type": "divider",
                },
                {
                        "type": "context",
                        "elements": []map[string]interface{}{
                                {
                                        "type": "mrkdwn",
                                        "text": "Sent from CloudGuard Monitoring",
                                },
                        },
                },
        }

        // Create the message
        slackMessage := &SlackMessage{
                Channel: s.ChannelID,
                Blocks:  blocks,
        }

        // Send the message
        return s.SendMessage(slackMessage)
}

// SendTestMessage sends a test message to Slack
func (s *SlackService) SendTestMessage() error {
        log.Println("Sending test message to Slack")
        
        // Create blocks for the message
        blocks := []map[string]interface{}{
                {
                        "type": "section",
                        "text": map[string]interface{}{
                                "type":  "mrkdwn",
                                "text":  "✅ *Success!* Your Slack integration is working correctly.",
                        },
                },
                {
                        "type": "context",
                        "elements": []map[string]interface{}{
                                {
                                        "type": "mrkdwn",
                                        "text": "Sent from CloudGuard",
                                },
                        },
                },
        }

        // Create the message
        slackMessage := &SlackMessage{
                Channel: s.ChannelID,
                Blocks:  blocks,
        }

        // Send the message
        return s.SendMessage(slackMessage)
}

// CheckStatus checks if the Slack integration is properly configured
func (s *SlackService) CheckStatus() bool {
        return s.BotToken != "" && s.ChannelID != ""
}