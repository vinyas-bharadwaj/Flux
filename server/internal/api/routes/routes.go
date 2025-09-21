package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"flux/internal/api/handlers"
	"flux/internal/api/middleware"
)

func SetupRoutes(router *gin.Engine, db *gorm.DB) {

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db)
	postsHandler := handlers.NewPostsHandler(db)
	messageHandler := handlers.NewMessageHandler(db)
	websocketHandler := handlers.NewWebsocketHandler(db)

	// Auth routes
	authRoutes := router.Group("/auth")
	{
		authRoutes.POST("/register", authHandler.Register)
		authRoutes.POST("/login", authHandler.Login)
	}

	// Protected routes 
	protected := router.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{
		postRoutes := protected.Group("/posts")
		{
			postRoutes.GET("", postsHandler.GetAllUserPosts)      
			postRoutes.GET("/:id", postsHandler.GetPost)          
			postRoutes.POST("", postsHandler.CreatePost)          
			postRoutes.PUT("/:id", postsHandler.UpdatePost)       
			postRoutes.DELETE("/:id", postsHandler.DeletePost)    
			postRoutes.POST("/:id/like", postsHandler.LikePost)   
		}

		messageRoutes := protected.Group("/messages")
		{
			messageRoutes.POST("", messageHandler.SendMessage)
			messageRoutes.GET("/conversation", messageHandler.GetConversation)
		}

		websocketRoutes := protected.Group("/ws")
		{
			websocketRoutes.GET("/connect", websocketHandler.HandleConnection)
		}
	}
}