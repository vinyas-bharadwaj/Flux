package models

import (
	"gorm.io/gorm"
)

type Message struct {
	gorm.Model
	SenderID   uint   `json:"sender_id" gorm:"not null"`
	ReceiverID uint   `json:"receiver_id" gorm:"not null"`
	Content    string `json:"content" gorm:"type:text;not null"`
	Sender     User   `json:"sender" gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Receiver   User   `json:"receiver" gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}