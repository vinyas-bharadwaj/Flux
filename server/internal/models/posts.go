package models

import (
	"gorm.io/gorm"
)

type Post struct {
	gorm.Model
	Caption   string `json:"caption"`
	ImageURL  string `json:"image_url"`
	Likes 	  int    `json:"likes" gorm:"default:0"`
	UserID    uint   `json:"user_id"`
    User   	  User   `json:"user" gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
}