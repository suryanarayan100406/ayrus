package handlers

import (
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"spotify-clone/config"
	"spotify-clone/models"
	"spotify-clone/services"
	"spotify-clone/utils"

	"github.com/gin-gonic/gin"
	"google.golang.org/api/iterator"
)

// AdminGetUsers returns all users (admin only)
func AdminGetUsers(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	iter := config.FirestoreClient.Collection("users").
		Limit(limit).
		Documents(c.Request.Context())
	defer iter.Stop()

	var users []interface{}
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			break
		}
		users = append(users, doc.Data())
	}

	utils.SuccessResponse(c, http.StatusOK, users)
}

// AdminGetSongs returns all songs with any status (admin only)
func AdminGetSongs(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	statusFilter := c.DefaultQuery("status", "")
	limit, _ := strconv.Atoi(limitStr)

	songs, err := services.GetSongs(c.Request.Context(), limit, "", statusFilter)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch songs")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, songs)
}

// AdminApproveSong approves or rejects a song
func AdminApproveSong(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Status is required (approved/rejected)")
		return
	}

	if req.Status != "approved" && req.Status != "rejected" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Status must be 'approved' or 'rejected'")
		return
	}

	if err := services.UpdateSong(c.Request.Context(), id, map[string]interface{}{
		"status": req.Status,
	}); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update song status")
		return
	}

	utils.SuccessMessage(c, "Song "+req.Status)
}

// AdminApproveArtist approves or rejects an artist application
func AdminApproveArtist(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Status is required (approved/rejected)")
		return
	}

	if req.Status != "approved" && req.Status != "rejected" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Status must be 'approved' or 'rejected'")
		return
	}

	if err := services.UpdateArtist(c.Request.Context(), id, map[string]interface{}{
		"status": req.Status,
	}); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update artist status")
		return
	}

	if req.Status == "approved" {
		services.UpdateUser(c.Request.Context(), id, map[string]interface{}{
			"role": "artist",
		})
	}

	utils.SuccessMessage(c, "Artist "+req.Status)
}

// AdminGetArtists returns all artist applications
func AdminGetArtists(c *gin.Context) {
	statusFilter := c.DefaultQuery("status", "")
	limitStr := c.DefaultQuery("limit", "50")
	limit, _ := strconv.Atoi(limitStr)

	artists, err := services.GetArtists(c.Request.Context(), statusFilter, limit)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch artists")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, artists)
}

// AdminGetDashboard returns platform-wide statistics
func AdminGetDashboard(c *gin.Context) {
	stats, err := services.GetDashboardStats(c.Request.Context())
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch dashboard stats")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, stats)
}

// AdminDeleteSong deletes a song
func AdminDeleteSong(c *gin.Context) {
	id := c.Param("id")

	if err := services.DeleteSong(c.Request.Context(), id); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete song")
		return
	}

	utils.SuccessMessage(c, "Song deleted")
}

// AdminUpdateUserRole changes a user's role
func AdminUpdateUserRole(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Role string `json:"role" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Role is required")
		return
	}

	validRoles := map[string]bool{"user": true, "artist": true, "admin": true}
	if !validRoles[req.Role] {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid role. Must be: user, artist, or admin")
		return
	}

	if err := services.UpdateUser(c.Request.Context(), id, map[string]interface{}{
		"role": req.Role,
	}); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update user role")
		return
	}

	utils.SuccessMessage(c, "User role updated to "+req.Role)
}

// AdminUploadSong allows an admin to upload a song without artist restrictions
func AdminUploadSong(c *gin.Context) {
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

	if valid, msg := utils.ValidateAudioFile(audioHeader); !valid {
		utils.ErrorResponse(c, http.StatusBadRequest, msg)
		return
	}

	title := utils.SanitizeString(c.PostForm("title"))
	artistName := utils.SanitizeString(c.PostForm("artistName"))
	if title == "" || artistName == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Song title and artist name are required")
		return
	}
	genre := utils.SanitizeString(c.PostForm("genre"))

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

	song := models.Song{
		Title:      title,
		ArtistID:   "admin", // Indicates an admin upload rather than a specific artist
		ArtistName: artistName,
		CoverURL:   coverURL,
		AudioURL:   audioURL,
		Source:     "upload",
		Duration:   0,
		PlayCount:  0,
		Genre:      genre,
		Status:     "approved", // Admins auto-approve
		CreatedAt:  time.Now(),
	}

	id, err := services.CreateSong(c.Request.Context(), song)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to save song entry")
		return
	}

	song.ID = id
	utils.SuccessResponse(c, http.StatusCreated, song)
}

// AdminToggleFeatured toggles the featured status of a catalog song
func AdminToggleFeatured(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Featured bool `json:"featured"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Featured boolean is required")
		return
	}

	if err := services.UpdateSong(c.Request.Context(), id, map[string]interface{}{
		"featured": req.Featured,
	}); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update featured status")
		return
	}

	statusStr := "unfeatured"
	if req.Featured {
		statusStr = "featured"
	}
	utils.SuccessMessage(c, "Song successfully "+statusStr)
}
