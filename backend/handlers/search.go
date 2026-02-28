package handlers

import (
	"net/http"
	"strconv"

	"spotify-clone/services"
	"spotify-clone/utils"

	"github.com/gin-gonic/gin"
)

// Search performs a global search across songs and artists
func Search(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Search query required (?q=...)")
		return
	}

	limitStr := c.DefaultQuery("limit", "10")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 30 {
		limit = 10
	}

	// Search songs
	songs, err := services.SearchSongs(c.Request.Context(), query, limit)
	if err != nil {
		songs = nil
	}

	// Search artists
	artists, err := services.SearchArtists(c.Request.Context(), query, limit)
	if err != nil {
		artists = nil
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"songs":   songs,
		"artists": artists,
		"query":   query,
	})
}
