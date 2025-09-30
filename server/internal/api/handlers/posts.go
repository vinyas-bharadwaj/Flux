package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"flux/internal/cloudinary"
	"flux/internal/models"
)

type PostsHandler struct {
	db                *gorm.DB
	cloudinaryService *cloudinary.CloudinaryService
}

// CreatePostRequest represents the request structure for creating a post
type CreatePostRequest struct {
	Caption  string `json:"caption" binding:"required"`
	ImageURL string `json:"image_url"`
}

// UpdatePostRequest represents the request structure for updating a post
type UpdatePostRequest struct {
	Caption  string `json:"caption"`
	ImageURL string `json:"image_url"`
}

func NewPostsHandler(db *gorm.DB) *PostsHandler {
	cloudinaryService, err := cloudinary.NewCloudinaryService()
	if err != nil {
		// Log the error but don't fail - posts can work without images
		fmt.Printf("Warning: Failed to initialize Cloudinary service: %v\n", err)
		cloudinaryService = nil
	}
	
	return &PostsHandler{
		db:                db,
		cloudinaryService: cloudinaryService,
	}
}

// GetAllUserPosts - Get all posts for the authenticated user
func (h *PostsHandler) GetAllUserPosts(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	var posts []models.Post
	if err := h.db.Preload("User").Where("user_id = ?", userID).Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch posts",
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"posts": posts})
}

// GetPost - Get a specific post by ID (only if owned by user)
func (h *PostsHandler) GetPost(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	postID := c.Param("id")
	var post models.Post
	
	if err := h.db.Preload("User").Where("id = ? AND user_id = ?", postID, userID).First(&post).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Post not found or you don't have permission to view it",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch post",
			})
		}
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"post": post})
}

// CreatePost - Create a new post for the authenticated user
func (h *PostsHandler) CreatePost(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	// Debug: Print the user_id type and value
	fmt.Printf("CreatePost - user_id type: %T, value: %v\n", userID, userID)

	var caption, imageURL string
	// Check content type to determine how to parse the request
	contentType := c.GetHeader("Content-Type")
	
	if contentType == "application/json" {
		// Handle JSON request (legacy support)
		var req CreatePostRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format: " + err.Error()})
			return
		}
		caption = req.Caption
		imageURL = req.ImageURL
	} else {
		// Handle multipart form data (for file uploads)
		caption = c.PostForm("caption")
		if caption == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Caption is required"})
			return
		}

		// Handle image upload
		file, header, err := c.Request.FormFile("image")
		if err != nil {
			// No file uploaded, check if image_url is provided
			imageURL = c.PostForm("image_url")
		} else {
			defer file.Close()
			
			// Validate and upload image to Cloudinary
			if h.cloudinaryService == nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Image upload service not available"})
				return
			}

			// Validate the image file
			if err := cloudinary.ValidateImageFile(file, header); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image file: " + err.Error()})
				return
			}

			// Upload to Cloudinary
			imageURL, err = h.cloudinaryService.UploadImage(file, header, userID.(uint))
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload image: " + err.Error()})
				return
			}
		}
	}
	
	// Create post from request data
	post := models.Post{
		Caption:  caption,
		ImageURL: imageURL,
		UserID:   userID.(uint),
		Likes:    0,
	}
	
	fmt.Printf("CreatePost - Setting post.UserID to: %d\n", post.UserID)
	
	if err := h.db.Create(&post).Error; err != nil {
		// If image was uploaded, try to clean it up
		if imageURL != "" && h.cloudinaryService != nil {
			h.cloudinaryService.DeleteImage(imageURL)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
		return
	}

	// Preload the User data before returning
	if err := h.db.Preload("User").First(&post, post.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load post with user data"})
		return
	}

	fmt.Printf("CreatePost - Post created with UserID: %d, PostID: %d\n", post.UserID, post.ID)
	c.JSON(http.StatusCreated, gin.H{"post": post})
}

// UpdatePost - Update a post (only if owned by user)
func (h *PostsHandler) UpdatePost(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	postID := c.Param("id")
	var existingPost models.Post
	
	// Check if post exists and belongs to user
	if err := h.db.Where("id = ? AND user_id = ?", postID, userID).First(&existingPost).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Post not found or you don't have permission to update it",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch post",
			})
		}
		return
	}

	var req UpdatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}
	
	// Update only the fields that are allowed to be changed
	if req.Caption != "" {
		existingPost.Caption = req.Caption
	}
	if req.ImageURL != "" {
		existingPost.ImageURL = req.ImageURL
	}
	
	if err := h.db.Save(&existingPost).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update post"})
		return
	}

	// Preload the User data before returning
	if err := h.db.Preload("User").First(&existingPost, existingPost.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load updated post with user data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"post": existingPost})
}

// DeletePost - Delete a post (only if owned by user)
func (h *PostsHandler) DeletePost(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	postID := c.Param("id")
	var post models.Post
	
	// Check if post exists and belongs to user
	if err := h.db.Where("id = ? AND user_id = ?", postID, userID).First(&post).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Post not found or you don't have permission to delete it",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch post",
			})
		}
		return
	}
	
	if err := h.db.Delete(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post"})
		return
	}

	// Clean up Cloudinary image if it exists
	if post.ImageURL != "" && h.cloudinaryService != nil {
		if err := h.cloudinaryService.DeleteImage(post.ImageURL); err != nil {
			// Log the error but don't fail the deletion
			fmt.Printf("Warning: Failed to delete image from Cloudinary: %v\n", err)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully"})
}

// LikePost - Toggle like on a post (only if owned by user)
func (h *PostsHandler) LikePost(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	postID := c.Param("id")
	var post models.Post
	
	// Check if post exists and belongs to user
	if err := h.db.Where("id = ? AND user_id = ?", postID, userID).First(&post).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Post not found or you don't have permission to like it",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch post",
			})
		}
		return
	}
	
	// Increment likes
	post.Likes++
	
	if err := h.db.Save(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to like post"})
		return
	}

	// Preload the User data before returning
	if err := h.db.Preload("User").First(&post, post.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load liked post with user data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"post": post, "message": "Post liked successfully"})
}

// GetFollowingPosts - Get all posts from users that the authenticated user is following
func (h *PostsHandler) GetFollowingPosts(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	// Get pagination parameters
	page := 1
	limit := 20 // Default limit for feed
	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 50 {
			limit = l
		}
	}

	offset := (page - 1) * limit

	// First, get the list of users that the current user is following
	var followingUserIDs []uint
	if err := h.db.Table("friends").
		Select("following_id").
		Where("follower_id = ?", userID).
		Pluck("following_id", &followingUserIDs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch following users",
		})
		return
	}

	// If not following anyone, return empty posts
	if len(followingUserIDs) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"posts":       []models.Post{},
			"total_count": 0,
			"page":        page,
			"limit":       limit,
			"total_pages": 0,
		})
		return
	}

	// Get posts from followed users
	var posts []models.Post
	if err := h.db.Preload("User").
		Where("user_id IN ?", followingUserIDs).
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch following posts",
		})
		return
	}

	// Get total count for pagination
	var totalCount int64
	h.db.Model(&models.Post{}).Where("user_id IN ?", followingUserIDs).Count(&totalCount)

	c.JSON(http.StatusOK, gin.H{
		"posts":       posts,
		"total_count": totalCount,
		"page":        page,
		"limit":       limit,
		"total_pages": (totalCount + int64(limit) - 1) / int64(limit),
	})
}