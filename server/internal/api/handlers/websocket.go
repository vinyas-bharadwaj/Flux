package handlers

import (
	"fmt"
	"net/http"

	"flux/internal/chat"
	"flux/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

type WebsocketHandler struct {
	db *gorm.DB
}

func NewWebsocketHandler(db *gorm.DB) *WebsocketHandler {
	return &WebsocketHandler{db: db}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { 
		// In production, you should validate the origin properly
		return true 
	},
}

// HandleConnection - Handle WebSocket connection for authenticated user
func (h *WebsocketHandler) HandleConnection(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	// Convert user_id to uint
	userIDValue := userID.(uint)

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		fmt.Printf("WS Upgrade failed for user %d: %v\n", userIDValue, err)
		return
	}
	defer conn.Close()

	// Register client
	chat.Clients[conn] = userIDValue
	fmt.Printf("User %d connected via WebSocket\n", userIDValue)

	// Send initial connection confirmation
	confirmMsg := models.Message{
		SenderID:   0, // System message
		ReceiverID: userIDValue,
		Content:    "Connected to chat server",
	}
	conn.WriteJSON(confirmMsg)

	// Listen for messages
	for {
		var msg models.Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			fmt.Printf("WS read error for user %d: %v\n", userIDValue, err)
			delete(chat.Clients, conn)
			break
		}

		// Validate message sender matches authenticated user
		if msg.SenderID != userIDValue {
			fmt.Printf("Invalid sender ID from user %d: attempted to send as %d\n", userIDValue, msg.SenderID)
			continue
		}

		// Validate message content
		if msg.Content == "" || msg.ReceiverID == 0 {
			fmt.Printf("Invalid message from user %d: empty content or invalid receiver\n", userIDValue)
			continue
		}

		// Check if receiver exists
		var receiver models.User
		if err := h.db.First(&receiver, msg.ReceiverID).Error; err != nil {
			fmt.Printf("Receiver %d not found for message from user %d\n", msg.ReceiverID, userIDValue)
			continue
		}

		// Save message to database
		if err := h.db.Create(&msg).Error; err != nil {
			fmt.Printf("Failed to save message from user %d: %v\n", userIDValue, err)
			continue
		}

		// Preload sender and receiver data
		if err := h.db.Preload("Sender").Preload("Receiver").First(&msg, msg.ID).Error; err != nil {
			fmt.Printf("Failed to preload message data: %v\n", err)
			continue
		}

		fmt.Printf("Message saved and broadcasting from user %d to user %d\n", msg.SenderID, msg.ReceiverID)
		
		// Broadcast message
		chat.Broadcast <- msg
	}

	fmt.Printf("User %d disconnected from WebSocket\n", userIDValue)
}
