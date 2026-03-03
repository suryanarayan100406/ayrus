package handlers

import (
	"net/http"
	"strconv"
	"time"

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

	// Parse incoming song metadata (frontend now sends full song object for caching)
	var req struct {
		ID         string `json:"id"`
		Title      string `json:"title"`
		ArtistName string `json:"artistName"`
		CoverURL   string `json:"coverURL"`
		Source     string `json:"source"`
		Duration   int    `json:"duration"`
	}
	if err := c.ShouldBindJSON(&req); err == nil && req.ID != "" {
		// If it's an external song, ensure it's cached in our Firestore songs collection for History queries
		if req.Source == "jamendo" || req.Source == "youtube" || req.Source == "fma" {
			// GetSong will return an error if it doesn't exist yet
			if _, getErr := services.GetSong(c.Request.Context(), songID); getErr != nil {
				// Stub created dynamically
				frontendSong := models.Song{
					ID:         req.ID,
					Title:      req.Title,
					ArtistName: req.ArtistName,
					CoverURL:   req.CoverURL,
					Source:     req.Source,
					Duration:   req.Duration,
					CreatedAt:  time.Now(),
					Status:     "approved",
					PlayCount:  0,
				}
				
				// Fix the ID in Firestore manually to match the frontend passed ID (important for yt-dlp compatibility)
				services.CreateSongWithID(c.Request.Context(), songID, frontendSong)
			}
		}
	}

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
