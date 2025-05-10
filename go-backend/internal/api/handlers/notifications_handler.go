package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/cloudguard/api/internal/api/middleware"
	"github.com/cloudguard/api/internal/config"
	"github.com/cloudguard/api/internal/db"
	"github.com/cloudguard/api/internal/services"
)

// NotificationsHandler handles notification-related requests
type NotificationsHandler struct {
	DB     *db.Database
	Config *config.Config
}

// SlackMessageRequest represents a request to send a Slack message
type SlackMessageRequest struct {
	Message string `json:"message"`
	Channel string `json:"channel,omitempty"`
}

// TestNotificationRequest represents a request to send a test notification
type TestNotificationRequest struct {
	Type string `json:"type"` // slack, email, etc.
}

// NotificationStatusResponse represents the status of notification integrations
type NotificationStatusResponse struct {
	Slack struct {
		Configured bool   `json:"configured"`
		ChannelID  string `json:"channelId,omitempty"`
	} `json:"slack"`
}

// NewNotificationsHandler creates a new notifications handler
func NewNotificationsHandler(db *db.Database, cfg *config.Config) *NotificationsHandler {
	return &NotificationsHandler{
		DB:     db,
		Config: cfg,
	}
}

// SendSlackMessage sends a message to Slack
func (h *NotificationsHandler) SendSlackMessage(w http.ResponseWriter, r *http.Request) {
	// Check if Slack is configured
	if h.Config.SlackBotToken == "" || h.Config.SlackChannelID == "" {
		http.Error(w, "Slack integration is not configured", http.StatusBadRequest)
		return
	}

	// Parse request
	var req SlackMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if req.Message == "" {
		http.Error(w, "Message is required", http.StatusBadRequest)
		return
	}

	// Create Slack service
	slackService := services.NewSlackService(h.Config.SlackBotToken, h.Config.SlackChannelID)

	// Create Slack message
	channel := req.Channel
	if channel == "" {
		channel = h.Config.SlackChannelID
	}

	message := &services.SlackMessage{
		Channel: channel,
		Text:    req.Message,
	}

	// Send message
	if err := slackService.SendMessage(message); err != nil {
		http.Error(w, "Failed to send Slack message: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// SendTestNotification sends a test notification
func (h *NotificationsHandler) SendTestNotification(w http.ResponseWriter, r *http.Request) {
	// Parse request
	var req TestNotificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get user from context
	user, ok := r.Context().Value(middleware.UserContextKey).(*models.User)
	if !ok {
		http.Error(w, "User not found in context", http.StatusInternalServerError)
		return
	}

	// Send test notification based on type
	switch req.Type {
	case "slack":
		// Check if Slack is configured
		if h.Config.SlackBotToken == "" || h.Config.SlackChannelID == "" {
			http.Error(w, "Slack integration is not configured", http.StatusBadRequest)
			return
		}

		// Create Slack service
		slackService := services.NewSlackService(h.Config.SlackBotToken, h.Config.SlackChannelID)

		// Send test message
		if err := slackService.SendTestMessage(); err != nil {
			http.Error(w, "Failed to send test notification: "+err.Error(), http.StatusInternalServerError)
			return
		}

	default:
		http.Error(w, "Unsupported notification type", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// GetNotificationStatus gets the status of notification integrations
func (h *NotificationsHandler) GetNotificationStatus(w http.ResponseWriter, r *http.Request) {
	// Create response
	var status NotificationStatusResponse

	// Check Slack configuration
	status.Slack.Configured = h.Config.SlackBotToken != "" && h.Config.SlackChannelID != ""
	if status.Slack.Configured {
		status.Slack.ChannelID = h.Config.SlackChannelID
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}