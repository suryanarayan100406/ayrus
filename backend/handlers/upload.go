package handlers

import (
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"spotify-clone/models"
	"spotify-clone/services"
	"spotify-clone/utils"

	"github.com/gin-gonic/gin"
)

// UploadSong uploads a song file and creates a song entry
func UploadSong(c *gin.Context) {
	uid := c.GetString("uid")

	// Verify artist status
	artist, err := services.GetArtist(c.Request.Context(), uid)
	if err != nil || artist.Status != "approved" {
		utils.ErrorResponse(c, http.StatusForbidden, "Only approved artists can upload songs")
		return
	}

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(20 << 20); err != nil { // 20MB max
		utils.ErrorResponse(c, http.StatusBadRequest, "File too large")
		return
	}

	// Get audio file
	audioFile, audioHeader, err := c.Request.FormFile("audio")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Audio file required")
		return
	}
	defer audioFile.Close()

	// Validate audio file
	if valid, msg := utils.ValidateAudioFile(audioHeader); !valid {
		utils.ErrorResponse(c, http.StatusBadRequest, msg)
		return
	}

	// Get form fields
	title := utils.SanitizeString(c.PostForm("title"))
	if title == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Song title is required")
		return
	}
	genre := utils.SanitizeString(c.PostForm("genre"))
	albumID := c.PostForm("albumId")

	// Upload audio to Firebase Storage
	ext := strings.ToLower(filepath.Ext(audioHeader.Filename))
	contentType := "audio/mpeg"
	if ext == ".wav" {
		contentType = "audio/wav"
	}

	audioURL, err := services.UploadFile(c.Request.Context(), audioFile, "songs", audioHeader.Filename, contentType)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to upload audio file")
		return
	}

	// Upload cover image if provided
	coverURL := ""
	coverFile, coverHeader, err := c.Request.FormFile("cover")
	if err == nil {
		defer coverFile.Close()
		if valid, _ := utils.ValidateImageFile(coverHeader); valid {
			url, err := services.UploadFile(c.Request.Context(), coverFile, "covers", coverHeader.Filename, "image/jpeg")
			if err == nil {
				coverURL = url
			}
		}
	}

	// Get album name if albumID provided
	albumName := ""
	if albumID != "" {
		album, err := services.GetAlbum(c.Request.Context(), albumID)
		if err == nil {
			albumName = album.Title
		}
	}

	// Create song entry
	song := models.Song{
		Title:      title,
		ArtistID:   uid,
		ArtistName: artist.DisplayName,
		AlbumID:    albumID,
		AlbumName:  albumName,
		CoverURL:   coverURL,
		AudioURL:   audioURL,
		Source:      "upload",
		Genre:      genre,
		Status:     "pending",
		Tags:       []string{},
		CreatedAt:  time.Now(),
	}

	id, err := services.CreateSong(c.Request.Context(), song)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create song entry")
		return
	}

	song.ID = id
	utils.SuccessResponse(c, http.StatusCreated, gin.H{
		"message": "Song uploaded successfully. Awaiting admin approval.",
		"song":    song,
	})
}

// UploadCoverImage uploads a cover image for an artist or album
func UploadCoverImage(c *gin.Context) {
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Image file required")
		return
	}
	defer file.Close()

	if valid, msg := utils.ValidateImageFile(header); !valid {
		utils.ErrorResponse(c, http.StatusBadRequest, msg)
		return
	}

	url, err := services.UploadFile(c.Request.Context(), file, "images", header.Filename, "image/jpeg")
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to upload image")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{"url": url})
}
