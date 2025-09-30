package models

import (
	"gorm.io/gorm"
)

type Friend struct {
	gorm.Model
	FollowerID  uint `json:"follower_id" gorm:"not null"`
	FollowingID uint `json:"following_id" gorm:"not null"`
	
	// Relationships
	Follower  User `json:"follower" gorm:"foreignKey:FollowerID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
	Following User `json:"following" gorm:"foreignKey:FollowingID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
}

// Ensure a user can't follow the same person twice
func (f *Friend) BeforeCreate(tx *gorm.DB) error {
	// Prevent self-following
	if f.FollowerID == f.FollowingID {
		return gorm.ErrInvalidData
	}
	return nil
}