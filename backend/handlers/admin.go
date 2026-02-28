package handlers

import (
	"net/http"
	"strconv"

	"spotify-clone/config"
	"spotify-clone/services"
	"spotify-clone/utils"

	"cloud.google.com/go/firestore"
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
		OrderBy("createdAt", firestore.Desc).
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
