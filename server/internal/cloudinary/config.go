package cloudinary

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

type CloudinaryService struct {
	client *cloudinary.Cloudinary
}

// NewCloudinaryService creates a new Cloudinary service instance
func NewCloudinaryService() (*CloudinaryService, error) {
	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

	if cloudName == "" || apiKey == "" || apiSecret == "" {
		return nil, fmt.Errorf("missing Cloudinary credentials. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables")
	}

	cld, err := cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Cloudinary: %w", err)
	}

	return &CloudinaryService{
		client: cld,
	}, nil
}

// UploadImage uploads an image file to Cloudinary and returns the URL
func (cs *CloudinaryService) UploadImage(file multipart.File, header *multipart.FileHeader, userID uint) (string, error) {
	// Validate file type
	if !isValidImageType(header.Filename) {
		return "", fmt.Errorf("invalid file type. Only JPEG, PNG, GIF, and WebP files are allowed")
	}

	// Validate file size (max 10MB)
	const maxFileSize = 10 * 1024 * 1024 // 10MB
	if header.Size > maxFileSize {
		return "", fmt.Errorf("file size too large. Maximum size is 10MB")
	}

	// Create a unique public ID for the image
	publicID := fmt.Sprintf("flux/posts/%d/%d_%s", userID, time.Now().Unix(), strings.TrimSuffix(header.Filename, filepath.Ext(header.Filename)))

	// Upload to Cloudinary
	ctx := context.Background()
	uploadParams := uploader.UploadParams{
		PublicID:     publicID,
		Folder:       "flux/posts",
		ResourceType: "image",
		Transformation: "c_limit,w_1000,h_1000,q_auto,f_auto", // Auto-optimize images
		Tags:         []string{"flux", "post", fmt.Sprintf("user_%d", userID)},
	}

	result, err := cs.client.Upload.Upload(ctx, file, uploadParams)
	if err != nil {
		return "", fmt.Errorf("failed to upload image to Cloudinary: %w", err)
	}

	return result.SecureURL, nil
}

// DeleteImage deletes an image from Cloudinary using the public ID
func (cs *CloudinaryService) DeleteImage(imageURL string) error {
	if imageURL == "" {
		return nil // Nothing to delete
	}

	// Extract public ID from URL
	publicID := extractPublicIDFromURL(imageURL)
	if publicID == "" {
		return fmt.Errorf("could not extract public ID from URL: %s", imageURL)
	}

	ctx := context.Background()
	_, err := cs.client.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID:     publicID,
		ResourceType: "image",
	})

	if err != nil {
		return fmt.Errorf("failed to delete image from Cloudinary: %w", err)
	}

	return nil
}

// isValidImageType checks if the file has a valid image extension
func isValidImageType(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	validExts := []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}
	
	for _, validExt := range validExts {
		if ext == validExt {
			return true
		}
	}
	
	return false
}

// extractPublicIDFromURL extracts the public ID from a Cloudinary URL
func extractPublicIDFromURL(url string) string {
	// Example URL: https://res.cloudinary.com/your-cloud/image/upload/v1234567890/flux/posts/user_1/image_name.jpg
	parts := strings.Split(url, "/")
	
	// Find the index of "upload"
	uploadIndex := -1
	for i, part := range parts {
		if part == "upload" {
			uploadIndex = i
			break
		}
	}
	
	if uploadIndex == -1 || uploadIndex+2 >= len(parts) {
		return ""
	}
	
	// Skip version (v1234567890) and get the rest
	publicIDParts := parts[uploadIndex+2:]
	publicID := strings.Join(publicIDParts, "/")
	
	// Remove file extension
	if dotIndex := strings.LastIndex(publicID, "."); dotIndex != -1 {
		publicID = publicID[:dotIndex]
	}
	
	return publicID
}

// ValidateImageFile validates an uploaded image file
func ValidateImageFile(file multipart.File, header *multipart.FileHeader) error {
	// Check file type
	if !isValidImageType(header.Filename) {
		return fmt.Errorf("invalid file type. Only JPEG, PNG, GIF, and WebP files are allowed")
	}

	// Check file size (max 10MB)
	const maxFileSize = 10 * 1024 * 1024 // 10MB
	if header.Size > maxFileSize {
		return fmt.Errorf("file size too large. Maximum size is 10MB")
	}

	// Check if file content is actually an image by reading the first few bytes
	buffer := make([]byte, 512)
	_, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		return fmt.Errorf("failed to read file content")
	}

	// Reset file pointer to beginning
	file.Seek(0, 0)

	// Check MIME type
	contentType := http.DetectContentType(buffer)
	validTypes := []string{"image/jpeg", "image/png", "image/gif", "image/webp"}
	
	isValid := false
	for _, validType := range validTypes {
		if contentType == validType {
			isValid = true
			break
		}
	}
	
	if !isValid {
		return fmt.Errorf("invalid file content. File does not appear to be a valid image")
	}

	return nil
}