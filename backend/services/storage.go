package services

import (
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"

	"github.com/google/uuid"
)

// Local uploads directory
const uploadsDir = "./uploads"

func init() {
	// Create upload directories
	dirs := []string{
		filepath.Join(uploadsDir, "songs"),
		filepath.Join(uploadsDir, "covers"),
		filepath.Join(uploadsDir, "images"),
	}
	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			log.Printf("Warning: could not create dir %s: %v", dir, err)
		}
	}
}

// UploadFile saves a file locally and returns the URL path
func UploadFile(ctx context.Context, file io.Reader, folder, filename, contentType string) (string, error) {
	uniqueName := fmt.Sprintf("%s-%s", uuid.New().String()[:8], filename)
	savePath := filepath.Join(uploadsDir, folder, uniqueName)

	out, err := os.Create(savePath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %v", err)
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		return "", fmt.Errorf("failed to write file: %v", err)
	}

	// Return a URL path that the Go server will serve
	url := fmt.Sprintf("/uploads/%s/%s", folder, uniqueName)
	return url, nil
}

// DeleteFile deletes a locally stored file
func DeleteFile(ctx context.Context, objectPath string) error {
	// objectPath looks like "/uploads/songs/abc-song.mp3"
	localPath := "." + objectPath
	return os.Remove(localPath)
}
