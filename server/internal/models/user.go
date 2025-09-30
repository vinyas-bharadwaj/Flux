package models

import (
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
    gorm.Model
    Username        string `json:"username" gorm:"uniqueIndex;not null"`
    Email           string `json:"email" gorm:"uniqueIndex;not null"`
    PasswordHash    string `json:"-" gorm:"not null"` // "-" means don't show in JSON responses
    FollowersCount  int    `json:"followers_count" gorm:"default:0"`
    FollowingCount  int    `json:"following_count" gorm:"default:0"`
    
    // Existing relationships
    Posts           []Post    `json:"posts" gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
    SentMessages    []Message `gorm:"foreignKey:SenderID"`
    RecvMessages    []Message `gorm:"foreignKey:ReceiverID"`
    
    // Friend relationships
    Followers       []Friend  `json:"followers" gorm:"foreignKey:FollowingID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
    Following       []Friend  `json:"following" gorm:"foreignKey:FollowerID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
}

func (u *User) HashPassword(password string) error {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    if err != nil {
        return err
    }
    u.PasswordHash = string(bytes)
    return nil
}

func (u *User) CheckPassword(password string) error {
    return bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)) 
}


