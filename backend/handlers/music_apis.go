package handlers

import (
	"net/http"
	"strconv"

	"spotify-clone/services"
	"spotify-clone/utils"

	"github.com/gin-gonic/gin"
)

// DiscoverJamendo searches or browses Jamendo catalog
func DiscoverJamendo(c *gin.Context) {
	query := c.Query("q")
	genre := c.Query("genre")
	limitStr := c.DefaultQuery("limit", "20")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	var tracks interface{}
	var err error

	if query != "" {
		tracks, err = services.SearchJamendo(query, limit)
	} else if genre != "" {
		tracks, err = services.GetJamendoByGenre(genre, limit)
	} else {
		tracks, err = services.GetJamendoTrending(limit)
	}

	if err != nil {
		utils.ErrorResponse(c, http.StatusServiceUnavailable, "Jamendo service unavailable: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, tracks)
}

// DiscoverFMA searches or browses Free Music Archive
func DiscoverFMA(c *gin.Context) {
	query := c.Query("q")
	limitStr := c.DefaultQuery("limit", "20")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	var tracks interface{}
	var err error

	if query != "" {
		tracks, err = services.SearchFMA(query, limit)
	} else {
		tracks, err = services.GetFMATrending(limit)
	}

	if err != nil {
		utils.ErrorResponse(c, http.StatusServiceUnavailable, "Free Music Archive unavailable: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, tracks)
}

// DiscoverArchive searches Internet Archive audio
func DiscoverArchive(c *gin.Context) {
	query := c.DefaultQuery("q", "music")
	limitStr := c.DefaultQuery("limit", "20")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	items, err := services.SearchInternetArchive(query, limit)
	if err != nil {
		utils.ErrorResponse(c, http.StatusServiceUnavailable, "Internet Archive unavailable: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, items)
}

// GetArchiveFiles returns streamable files for an Internet Archive item
func GetArchiveFiles(c *gin.Context) {
	identifier := c.Param("identifier")

	files, err := services.GetIAItemFiles(identifier)
	if err != nil {
		utils.ErrorResponse(c, http.StatusServiceUnavailable, "Failed to fetch files")
		return
	}

	// Add stream URLs
	type FileWithURL struct {
		services.IAFile
		StreamURL string `json:"streamUrl"`
	}

	var filesWithURLs []FileWithURL
	for _, f := range files {
		filesWithURLs = append(filesWithURLs, FileWithURL{
			IAFile:    f,
			StreamURL: services.GetIAStreamURL(identifier, f.Name),
		})
	}

	utils.SuccessResponse(c, http.StatusOK, filesWithURLs)
}

// SearchSpotifyMetadata searches Spotify for metadata enrichment
func SearchSpotifyMeta(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Search query required")
		return
	}

	limitStr := c.DefaultQuery("limit", "10")
	limit, _ := strconv.Atoi(limitStr)

	result, err := services.SearchSpotifyMetadata(query, limit)
	if err != nil {
		utils.ErrorResponse(c, http.StatusServiceUnavailable, "Spotify metadata unavailable: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, result)
}
