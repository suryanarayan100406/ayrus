package utils

import (
	"mime/multipart"
	"path/filepath"
	"strings"
)

var allowedAudioExts = map[string]bool{
	".mp3": true,
	".wav": true,
}

var allowedImageExts = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".webp": true,
}

const MaxAudioSize = 15 * 1024 * 1024  // 15 MB
const MaxImageSize = 5 * 1024 * 1024   // 5 MB

func ValidateAudioFile(header *multipart.FileHeader) (bool, string) {
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedAudioExts[ext] {
		return false, "Only MP3 and WAV files are allowed"
	}
	if header.Size > MaxAudioSize {
		return false, "Audio file must be under 15MB"
	}
	return true, ""
}

func ValidateImageFile(header *multipart.FileHeader) (bool, string) {
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedImageExts[ext] {
		return false, "Only JPG, PNG, and WebP images are allowed"
	}
	if header.Size > MaxImageSize {
		return false, "Image file must be under 5MB"
	}
	return true, ""
}

func SanitizeString(s string) string {
	s = strings.TrimSpace(s)
	if len(s) > 500 {
		s = s[:500]
	}
	return s
}
