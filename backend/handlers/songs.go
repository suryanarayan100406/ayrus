package handlers

import (
	"net/http"
	"strconv"

	"spotify-clone/models"
	"spotify-clone/services"
	"spotify-clone/utils"

	"github.com/gin-gonic/gin"
)

// GetSongs returns a paginated list of approved songs
func GetSongs(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "20")
	genre := c.Query("genre")

	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	songs, err := services.GetSongs(c.Request.Context(), limit, genre, "approved")
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch songs")
		return
	}

	if songs == nil {
		songs = []models.Song{}
	}

	utils.SuccessResponse(c, http.StatusOK, songs)
}

// GetSong returns a single song by ID
func GetSong(c *gin.Context) {
	id := c.Param("id")

	song, err := services.GetSong(c.Request.Context(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Song not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, song)
}

// StreamSong returns the audio URL for streaming
func StreamSong(c *gin.Context) {
	id := c.Param("id")

	song, err := services.GetSong(c.Request.Context(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Song not found")
		return
	}

	if song.AudioURL == "" {
		utils.ErrorResponse(c, http.StatusNotFound, "No audio available for this song")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"audioURL": song.AudioURL,
		"songId":   song.ID,
		"title":    song.Title,
		"artist":   song.ArtistName,
		"coverURL": song.CoverURL,
		"duration": song.Duration,
	})
}

// RecordPlay records a play event and updates recently played
func RecordPlay(c *gin.Context) {
	uid := c.GetString("uid")
	songID := c.Param("id")

	if err := services.RecordPlay(c.Request.Context(), songID, uid); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to record play")
		return
	}

	user, err := services.GetUser(c.Request.Context(), uid)
	if err == nil {
		recent := user.RecentlyPlayed

		filtered := make([]string, 0, len(recent))
		for _, id := range recent {
			if id != songID {
				filtered = append(filtered, id)
			}
		}

		filtered = append([]string{songID}, filtered...)
		if len(filtered) > 50 {
			filtered = filtered[:50]
		}

		services.UpdateUser(c.Request.Context(), uid, map[string]interface{}{
			"recentlyPlayed": filtered,
		})
	}

	utils.SuccessMessage(c, "Play recorded")
}

// GetRecommendations returns personalized song recommendations
func GetRecommendations(c *gin.Context) {
	uid := c.GetString("uid")
	limitStr := c.DefaultQuery("limit", "20")

	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	songs, err := services.GetRecommendations(c.Request.Context(), uid, limit)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to get recommendations")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, songs)
}
