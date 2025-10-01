package main

import (
	"net/http"
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/joho/godotenv"
	"gorm.io/gorm"

	"flux/internal/models"
	"flux/internal/api/routes"
	"flux/internal/chat"
)

func init() {
	// Loading the .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file:", err)
	} else {
		log.Println("Environment variables loaded from .env files")
	}
}

func initDB() (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open("dev_DB"), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Auto migrate models
	err = db.AutoMigrate(&models.User{}, &models.Post{}, &models.Message{}, &models.Friend{})
	if err != nil {
		return nil, err
	}

	return db, nil

}

func main() {
	db, err := initDB()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize router
	router := gin.Default()
	
	// Add CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://127.0.0.1:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))
	
	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Hello world!",
		})
	})
	
	// Setup routes
	routes.SetupRoutes(router, db)

	// Handle Messages 
	go chat.HandleMessages()
	
	// Start server
	router.Run(":8080")
}
