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
	friendsHandler := handlers.NewFriendsHandler(db)

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
			postRoutes.POST("", postsHandler.CreatePost)          
			postRoutes.GET("/:id", postsHandler.GetPost)          
			postRoutes.PUT("/:id", postsHandler.UpdatePost)       
			postRoutes.DELETE("/:id", postsHandler.DeletePost)    
			postRoutes.POST("/:id/like", postsHandler.LikePost)   
		}

		// Feed route separate from posts to avoid conflicts
		protected.GET("/feed", postsHandler.GetFollowingPosts)

		messageRoutes := protected.Group("/messages")
		{
			messageRoutes.POST("", messageHandler.SendMessage)
			messageRoutes.GET("/conversation", messageHandler.GetConversation)
		}

		friendsRoutes := protected.Group("/friends")
		{
			friendsRoutes.GET("/users", friendsHandler.GetAllUsers)
			friendsRoutes.POST("/follow", friendsHandler.FollowUser)
			friendsRoutes.DELETE("/unfollow/:id", friendsHandler.UnfollowUser)
			friendsRoutes.GET("/followers", friendsHandler.GetFollowers)
			friendsRoutes.GET("/following", friendsHandler.GetFollowing)
			friendsRoutes.GET("/search", friendsHandler.SearchUsers)
			friendsRoutes.GET("/status/:id", friendsHandler.CheckFollowStatus)
		}

		websocketRoutes := protected.Group("/ws")
		{
			websocketRoutes.GET("/connect", websocketHandler.HandleConnection)
		}
	}
}