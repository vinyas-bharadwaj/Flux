package middleware

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware verifies the JWT token and sets user information in the context
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Add debug output
		fmt.Println("Auth middleware processing request:", c.Request.URL.Path)
		
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			fmt.Println("No Authorization header found")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Check if the format is "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			fmt.Println("Invalid Authorization format:", authHeader)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer <token>"})
			c.Abort()
			return
		}

		// Get the token string
		tokenString := parts[1]
		fmt.Println("Token received:", tokenString[:10], "...")

		// Parse and validate the token
		claims := &jwt.MapClaims{}

		// Get the JWT secret key from environment variable or use a default one
		secretKey := os.Getenv("JWT_SECRET_KEY")
		if secretKey == "" {
			secretKey = "your-secret-key-change-in-production"
		}

		// Parse the token
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			// Validate the alg
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}
			return []byte(secretKey), nil
		})

		if err != nil {
			fmt.Println("Token parsing error:", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		if !token.Valid {
			fmt.Println("Token is invalid")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Set user information in the context
		userID, ok := (*claims)["user_id"]
		if !ok {
			fmt.Println("No user_id found in token claims")
			fmt.Println("Available claims:", *claims)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		// Convert user_id to uint and set in context
		var userIDValue uint
		switch v := userID.(type) {
		case float64:
			userIDValue = uint(v)
		case int:
			userIDValue = uint(v)
		case uint:
			userIDValue = v
		default:
			fmt.Printf("Unexpected user_id type: %T, value: %v\n", userID, userID)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user_id format in token"})
			c.Abort()
			return
		}
		
		fmt.Println("Setting user_id in context:", userIDValue)
		c.Set("user_id", userIDValue)
		c.Set("username", (*claims)["username"])

		c.Next()
	}
}