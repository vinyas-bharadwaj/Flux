package chat

import (
	"fmt"
	"flux/internal/models"

	"github.com/gorilla/websocket"
)

var Clients = make(map[*websocket.Conn]uint) // conn -> userID
var Broadcast = make(chan models.Message)

func HandleMessages() {
	// Infinite event loop
	for {
		msg := <-Broadcast
		fmt.Printf("Broadcasting message from user %d to user %d\n", msg.SenderID, msg.ReceiverID)
		
		for client, userID := range Clients {
			// Send message to the receiver
			if userID == msg.ReceiverID {
				err := client.WriteJSON(msg)
				if err != nil {
					fmt.Printf("WS send error to user %d: %v\n", userID, err)
					client.Close()
					delete(Clients, client)
				} else {
					fmt.Printf("Message delivered to user %d\n", userID)
				}
			}
		}
	}
}

func GetConnectedUsers() []uint {
	users := make([]uint, 0, len(Clients))
	for _, userID := range Clients {
		users = append(users, userID)
	}
	return users
}

func IsUserOnline(userID uint) bool {
	for _, connectedUserID := range Clients {
		if connectedUserID == userID {
			return true
		}
	}
	return false
}