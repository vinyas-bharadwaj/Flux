package middleware

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// WSAuthMiddleware verifies JWT token from query parameter for WebSocket connections
func WSAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		fmt.Println("WebSocket auth middleware processing request:", c.Request.URL.Path)
		
		// Get token from query parameter
		token := c.Query("token")
		if token == "" {
			fmt.Println("No token found in query parameters")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token required in query parameter"})
			c.Abort()
			return
		}

		// Parse and validate the token
		jwtSecret := os.Getenv("JWT_SECRET_KEY")
		if jwtSecret == "" {
			jwtSecret = "your-secret-key-change-in-production" // Match the default from auth.go
		}

		parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
			// Make sure the signing method is HMAC
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(jwtSecret), nil
		})

		if err != nil {
			fmt.Printf("Token parsing error: %v\n", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Check if token is valid and extract claims
		if claims, ok := parsedToken.Claims.(jwt.MapClaims); ok && parsedToken.Valid {
			// Extract user information from token
			userID := claims["user_id"]
			username := claims["username"]

			// Convert userID to proper type if needed
			var userIDFloat float64
			if id, ok := userID.(float64); ok {
				userIDFloat = id
			} else {
				fmt.Println("Invalid user_id type in token")
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token format"})
				c.Abort()
				return
			}

			// Set user information in context
			c.Set("user_id", uint(userIDFloat))
			c.Set("username", username)

			fmt.Printf("WebSocket authenticated user: %s (ID: %v)\n", username, uint(userIDFloat))
			c.Next()
		} else {
			fmt.Println("Invalid token claims")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}
	}
}