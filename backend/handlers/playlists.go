package handlers

import (
	"net/http"
	"time"

	"spotify-clone/models"
	"spotify-clone/services"
	"spotify-clone/utils"

	"github.com/gin-gonic/gin"
)

// GetPlaylists returns the authenticated user's playlists
func GetPlaylists(c *gin.Context) {
	uid := c.GetString("uid")

	playlists, err := services.GetUserPlaylists(c.Request.Context(), uid)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch playlists")
		return
	}

	if playlists == nil {
		playlists = []models.Playlist{}
	}

	utils.SuccessResponse(c, http.StatusOK, playlists)
}

// GetPlaylist returns a single playlist by ID
func GetPlaylist(c *gin.Context) {
	id := c.Param("id")

	playlist, err := services.GetPlaylist(c.Request.Context(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Playlist not found")
		return
	}

	// Fetch song details for each song in playlist
	var songs []interface{}
	for _, songID := range playlist.SongIDs {
		song, err := services.GetSong(c.Request.Context(), songID)
		if err != nil {
			continue
		}
		songs = append(songs, song)
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"playlist": playlist,
		"songs":    songs,
	})
}

// CreatePlaylist creates a new playlist
func CreatePlaylist(c *gin.Context) {
	uid := c.GetString("uid")

	var req models.CreatePlaylistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Playlist name is required")
		return
	}

	playlist := models.Playlist{
		Name:      utils.SanitizeString(req.Name),
		UserID:    uid,
		IsPublic:  req.IsPublic,
		SongIDs:   []string{},
		CreatedAt: time.Now(),
	}

	id, err := services.CreatePlaylist(c.Request.Context(), playlist)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create playlist")
		return
	}

	playlist.ID = id
	utils.SuccessResponse(c, http.StatusCreated, playlist)
}

// UpdatePlaylist updates a playlist (name, public status, or songs)
func UpdatePlaylist(c *gin.Context) {
	uid := c.GetString("uid")
	id := c.Param("id")

	// Verify ownership
	playlist, err := services.GetPlaylist(c.Request.Context(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Playlist not found")
		return
	}
	if playlist.UserID != uid {
		utils.ErrorResponse(c, http.StatusForbidden, "You can only edit your own playlists")
		return
	}

	var req models.UpdatePlaylistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request")
		return
	}

	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = utils.SanitizeString(req.Name)
	}
	if req.IsPublic != nil {
		updates["isPublic"] = *req.IsPublic
	}
	if req.SongIDs != nil {
		updates["songIds"] = req.SongIDs
	}

	if len(updates) == 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "No fields to update")
		return
	}

	if err := services.UpdatePlaylist(c.Request.Context(), id, updates); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update playlist")
		return
	}

	utils.SuccessMessage(c, "Playlist updated")
}

// DeletePlaylist deletes a playlist
func DeletePlaylist(c *gin.Context) {
	uid := c.GetString("uid")
	id := c.Param("id")

	// Verify ownership
	playlist, err := services.GetPlaylist(c.Request.Context(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Playlist not found")
		return
	}
	if playlist.UserID != uid {
		utils.ErrorResponse(c, http.StatusForbidden, "You can only delete your own playlists")
		return
	}

	if err := services.DeletePlaylist(c.Request.Context(), id); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete playlist")
		return
	}

	utils.SuccessMessage(c, "Playlist deleted")
}

// AddSongToPlaylist adds a song to a playlist
func AddSongToPlaylist(c *gin.Context) {
	uid := c.GetString("uid")
	playlistID := c.Param("id")

	var req struct {
		SongID string `json:"songId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Song ID required")
		return
	}

	// Verify ownership
	playlist, err := services.GetPlaylist(c.Request.Context(), playlistID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Playlist not found")
		return
	}
	if playlist.UserID != uid {
		utils.ErrorResponse(c, http.StatusForbidden, "You can only edit your own playlists")
		return
	}

	// Check if song already in playlist
	for _, id := range playlist.SongIDs {
		if id == req.SongID {
			utils.ErrorResponse(c, http.StatusConflict, "Song already in playlist")
			return
		}
	}

	newSongIDs := append(playlist.SongIDs, req.SongID)
	if err := services.UpdatePlaylist(c.Request.Context(), playlistID, map[string]interface{}{
		"songIds": newSongIDs,
	}); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to add song")
		return
	}

	utils.SuccessMessage(c, "Song added to playlist")
}

// RemoveSongFromPlaylist removes a song from a playlist
func RemoveSongFromPlaylist(c *gin.Context) {
	uid := c.GetString("uid")
	playlistID := c.Param("id")
	songID := c.Param("songId")

	// Verify ownership
	playlist, err := services.GetPlaylist(c.Request.Context(), playlistID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Playlist not found")
		return
	}
	if playlist.UserID != uid {
		utils.ErrorResponse(c, http.StatusForbidden, "You can only edit your own playlists")
		return
	}

	// Remove song
	newSongIDs := make([]string, 0)
	for _, id := range playlist.SongIDs {
		if id != songID {
			newSongIDs = append(newSongIDs, id)
		}
	}

	if err := services.UpdatePlaylist(c.Request.Context(), playlistID, map[string]interface{}{
		"songIds": newSongIDs,
	}); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to remove song")
		return
	}

	utils.SuccessMessage(c, "Song removed from playlist")
}
