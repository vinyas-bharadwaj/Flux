package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"flux/internal/models"
)

type FriendsHandler struct {
	db *gorm.DB
}

func NewFriendsHandler(db *gorm.DB) *FriendsHandler {
	return &FriendsHandler{db:db}
}


func (h *FriendsHandler) GetFollowing(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	var following []models.Friend
	if err := h.db.Preload("Following").Where("follower_id = ?", userID).Find(&following).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch following",
		})
		return
	}

	// Format response to match frontend expectations
	type FollowingResponse struct {
		ID        uint        `json:"ID"`
		Following models.User `json:"following"`
	}

	var response []FollowingResponse
	for _, follow := range following {
		response = append(response, FollowingResponse{
			ID:        follow.ID,
			Following: follow.Following,
		})
	}

	c.JSON(http.StatusOK, gin.H{"following": response})
}

// FollowUserRequest represents the request to follow a user
type FollowUserRequest struct {
	UserID uint `json:"user_id" binding:"required"`
}

// FollowUser - Follow another user
func (h *FriendsHandler) FollowUser(c *gin.Context) {
	followerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	var req FollowUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format: " + err.Error()})
		return
	}

	// Prevent self-following
	if followerID.(uint) == req.UserID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot follow yourself"})
		return
	}

	// Check if target user exists
	var targetUser models.User
	if err := h.db.First(&targetUser, req.UserID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find user"})
		}
		return
	}

	// Check if already following
	var existingFollow models.Friend
	if err := h.db.Where("follower_id = ? AND following_id = ?", followerID, req.UserID).First(&existingFollow).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Already following this user"})
		return
	}

	// Start transaction
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create friend relationship
	friend := models.Friend{
		FollowerID:  followerID.(uint),
		FollowingID: req.UserID,
	}

	if err := tx.Create(&friend).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to follow user"})
		return
	}

	// Update follower's following count
	if err := tx.Model(&models.User{}).Where("id = ?", followerID).UpdateColumn("following_count", gorm.Expr("following_count + ?", 1)).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update following count"})
		return
	}

	// Update target user's followers count
	if err := tx.Model(&models.User{}).Where("id = ?", req.UserID).UpdateColumn("followers_count", gorm.Expr("followers_count + ?", 1)).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update followers count"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message": "Successfully followed user",
		"friend":  friend,
	})
}

// UnfollowUser - Unfollow a user
func (h *FriendsHandler) UnfollowUser(c *gin.Context) {
	followerID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Find the friend relationship
	var friend models.Friend
	if err := h.db.Where("follower_id = ? AND following_id = ?", followerID, uint(userID)).First(&friend).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "You are not following this user"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find relationship"})
		}
		return
	}

	// Start transaction
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Delete friend relationship
	if err := tx.Delete(&friend).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unfollow user"})
		return
	}

	// Update follower's following count
	if err := tx.Model(&models.User{}).Where("id = ?", followerID).UpdateColumn("following_count", gorm.Expr("following_count - ?", 1)).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update following count"})
		return
	}

	// Update target user's followers count
	if err := tx.Model(&models.User{}).Where("id = ?", uint(userID)).UpdateColumn("followers_count", gorm.Expr("followers_count - ?", 1)).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update followers count"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message": "Successfully unfollowed user",
	})
}

// GetFollowers - Get list of followers for the authenticated user
func (h *FriendsHandler) GetFollowers(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	var followers []models.Friend
	if err := h.db.Preload("Follower").Where("following_id = ?", userID).Find(&followers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch followers",
		})
		return
	}

	// Format response to match frontend expectations
	type FollowerResponse struct {
		ID       uint        `json:"ID"`
		Follower models.User `json:"follower"`
	}

	var response []FollowerResponse
	for _, follower := range followers {
		response = append(response, FollowerResponse{
			ID:       follower.ID,
			Follower: follower.Follower,
		})
	}

	c.JSON(http.StatusOK, gin.H{"followers": response})
}

// SearchUsers - Search for users to follow
func (h *FriendsHandler) SearchUsers(c *gin.Context) {
	currentUserID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
		return
	}

	var users []models.User
	if err := h.db.Where("username LIKE ? AND id != ?", "%"+query+"%", currentUserID).
		Select("id, username, email, followers_count, following_count").
		Limit(20).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to search users",
		})
		return
	}

	// Check which users are already being followed
	var followingIDs []uint
	h.db.Model(&models.Friend{}).
		Where("follower_id = ?", currentUserID).
		Pluck("following_id", &followingIDs)

	// Create a map for quick lookup
	followingMap := make(map[uint]bool)
	for _, id := range followingIDs {
		followingMap[id] = true
	}

	// Add following status to users
	type UserWithFollowStatus struct {
		models.User
		IsFollowing bool `json:"is_following"`
	}

	var usersWithStatus []UserWithFollowStatus
	for _, user := range users {
		usersWithStatus = append(usersWithStatus, UserWithFollowStatus{
			User:        user,
			IsFollowing: followingMap[user.ID],
		})
	}

	c.JSON(http.StatusOK, gin.H{"users": usersWithStatus})
}

// CheckFollowStatus - Check if current user is following a specific user
func (h *FriendsHandler) CheckFollowStatus(c *gin.Context) {
	currentUserID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var friend models.Friend
	isFollowing := false
	if err := h.db.Where("follower_id = ? AND following_id = ?", currentUserID, uint(userID)).First(&friend).Error; err == nil {
		isFollowing = true
	}

	c.JSON(http.StatusOK, gin.H{"is_following": isFollowing})
}

// GetAllUsers - Get all users with follow status for the authenticated user
func (h *FriendsHandler) GetAllUsers(c *gin.Context) {
	currentUserID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	// Get pagination parameters
	page := 1
	limit := 50 // Default limit
	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	offset := (page - 1) * limit

	// Get all users except the current user
	var users []models.User
	if err := h.db.Where("id != ?", currentUserID).
		Select("id, username, email, followers_count, following_count, created_at").
		Offset(offset).
		Limit(limit).
		Order("created_at DESC").
		Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch users",
		})
		return
	}

	// Get all users that the current user is following
	var followingIDs []uint
	h.db.Model(&models.Friend{}).
		Where("follower_id = ?", currentUserID).
		Pluck("following_id", &followingIDs)

	// Create a map for quick lookup
	followingMap := make(map[uint]bool)
	for _, id := range followingIDs {
		followingMap[id] = true
	}

	// Add following status to users
	type UserWithFollowStatus struct {
		models.User
		IsFollowing bool `json:"is_following"`
	}

	var usersWithStatus []UserWithFollowStatus
	for _, user := range users {
		usersWithStatus = append(usersWithStatus, UserWithFollowStatus{
			User:        user,
			IsFollowing: followingMap[user.ID],
		})
	}

	// Get total count for pagination
	var totalCount int64
	h.db.Model(&models.User{}).Where("id != ?", currentUserID).Count(&totalCount)

	c.JSON(http.StatusOK, gin.H{
		"users":       usersWithStatus,
		"total_count": totalCount,
		"page":        page,
		"limit":       limit,
		"total_pages": (totalCount + int64(limit) - 1) / int64(limit),
	})
}