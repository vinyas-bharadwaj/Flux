package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	
	"flux/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type MessageHandler struct {
	db *gorm.DB
}

// SendMessageRequest represents the request structure for sending a message
type SendMessageRequest struct {
	ReceiverID uint   `json:"receiver_id" binding:"required"`
	Content    string `json:"content" binding:"required"`
}

func NewMessageHandler(db *gorm.DB) *MessageHandler {
	return &MessageHandler{db: db}
}

// SendMessage - Send a message to another user
func (h *MessageHandler) SendMessage(c *gin.Context) {
	senderID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	// Debug: Print the sender_id type and value
	fmt.Printf("SendMessage - sender_id type: %T, value: %v\n", senderID, senderID)

	var req SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format: " + err.Error()})
		return
	}

	// Check if receiver exists
	var receiver models.User
	if err := h.db.First(&receiver, req.ReceiverID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Receiver not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify receiver"})
		}
		return
	}

	// Create message
	message := models.Message{
		SenderID:   senderID.(uint),
		ReceiverID: req.ReceiverID,
		Content:    req.Content,
	}

	if err := h.db.Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return
	}

	// Preload sender and receiver data before returning
	if err := h.db.Preload("Sender").Preload("Receiver").First(&message, message.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load message with user data"})
		return
	}

	fmt.Printf("SendMessage - Message sent from user %d to user %d\n", message.SenderID, message.ReceiverID)
	c.JSON(http.StatusCreated, gin.H{"message": message})
}

// GetConversation - Fetch conversation between authenticated user and another user
func (h *MessageHandler) GetConversation(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	otherUserIDStr := c.Query("user_id")
	if otherUserIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id query parameter is required"})
		return
	}

	otherUserID, err := strconv.ParseUint(otherUserIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id format"})
		return
	}

	// Check if other user exists
	var otherUser models.User
	if err := h.db.First(&otherUser, uint(otherUserID)).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify user"})
		}
		return
	}

	var messages []models.Message
	if err := h.db.Preload("Sender").Preload("Receiver").Where(
		"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
		userID, uint(otherUserID), uint(otherUserID), userID,
	).Order("created_at asc").Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch conversation"})
		return
	}

	fmt.Printf("GetConversation - Found %d messages between users %v and %d\n", len(messages), userID, uint(otherUserID))
	c.JSON(http.StatusOK, gin.H{"messages": messages})
}