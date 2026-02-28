package services

import (
	"context"
	"fmt"
	"io"
	"time"

	"spotify-clone/config"

	"cloud.google.com/go/storage"
	"github.com/google/uuid"
)

// UploadFile uploads a file to Firebase Storage and returns the public URL
func UploadFile(ctx context.Context, file io.Reader, folder, filename, contentType string) (string, error) {
	if config.StorageBucket == nil {
		return "", fmt.Errorf("storage bucket not configured")
	}

	objectName := fmt.Sprintf("%s/%s-%s", folder, uuid.New().String(), filename)
	writer := config.StorageBucket.Object(objectName).NewWriter(ctx)
	writer.ContentType = contentType
	writer.CacheControl = "public, max-age=86400"

	if _, err := io.Copy(writer, file); err != nil {
		return "", fmt.Errorf("failed to upload file: %v", err)
	}

	if err := writer.Close(); err != nil {
		return "", fmt.Errorf("failed to close writer: %v", err)
	}

	// Make the file publicly readable
	if err := config.StorageBucket.Object(objectName).ACL().Set(ctx, storage.AllUsers, storage.RoleReader); err != nil {
		// If we can't set public ACL, generate a signed URL instead
		return getSignedURL(objectName)
	}

	bucketName := config.StorageBucket.BucketName()
	url := fmt.Sprintf("https://storage.googleapis.com/%s/%s", bucketName, objectName)
	return url, nil
}

func getSignedURL(objectName string) (string, error) {
	opts := &storage.SignedURLOptions{
		Method:  "GET",
		Expires: time.Now().Add(7 * 24 * time.Hour), // 7 days
	}

	url, err := config.StorageBucket.SignedURL(objectName, opts)
	if err != nil {
		return "", fmt.Errorf("failed to generate signed URL: %v", err)
	}
	return url, nil
}

// DeleteFile deletes a file from Firebase Storage
func DeleteFile(ctx context.Context, objectName string) error {
	if config.StorageBucket == nil {
		return fmt.Errorf("storage bucket not configured")
	}
	return config.StorageBucket.Object(objectName).Delete(ctx)
}
