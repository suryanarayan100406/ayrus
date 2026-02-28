package handlers

import (
	"net/http"
	"time"

	"spotify-clone/models"
	"spotify-clone/services"
	"spotify-clone/utils"

	"github.com/gin-gonic/gin"
)

// RegisterArtist submits an artist application (requires admin approval)
func RegisterArtist(c *gin.Context) {
	uid := c.GetString("uid")

	// Check if already registered
	existing, _ := services.GetArtist(c.Request.Context(), uid)
	if existing != nil {
		utils.ErrorResponse(c, http.StatusConflict, "Artist application already submitted (status: "+existing.Status+")")
		return
	}

	var req models.ArtistRegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Display name is required")
		return
	}

	artist := models.Artist{
		UID:         uid,
		DisplayName: utils.SanitizeString(req.DisplayName),
		Bio:         utils.SanitizeString(req.Bio),
		Status:      "pending",
		CreatedAt:   time.Now(),
	}

	if err := services.CreateArtist(c.Request.Context(), artist); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to submit artist application")
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, gin.H{
		"message": "Artist application submitted. Awaiting admin approval.",
		"artist":  artist,
	})
}

// GetArtistProfile returns the artist's own profile
func GetArtistProfile(c *gin.Context) {
	uid := c.GetString("uid")

	artist, err := services.GetArtist(c.Request.Context(), uid)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Artist profile not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, artist)
}

// UpdateArtistProfile updates the artist's profile
func UpdateArtistProfile(c *gin.Context) {
	uid := c.GetString("uid")

	var req struct {
		DisplayName string `json:"displayName"`
		Bio         string `json:"bio"`
		PhotoURL    string `json:"photoURL"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request")
		return
	}

	updates := make(map[string]interface{})
	if req.DisplayName != "" {
		updates["displayName"] = utils.SanitizeString(req.DisplayName)
	}
	if req.Bio != "" {
		updates["bio"] = utils.SanitizeString(req.Bio)
	}
	if req.PhotoURL != "" {
		updates["photoURL"] = req.PhotoURL
	}

	if err := services.UpdateArtist(c.Request.Context(), uid, updates); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	utils.SuccessMessage(c, "Artist profile updated")
}

// GetPublicArtist returns a public view of an artist profile
func GetPublicArtist(c *gin.Context) {
	id := c.Param("id")

	artist, err := services.GetArtist(c.Request.Context(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Artist not found")
		return
	}

	if artist.Status != "approved" {
		utils.ErrorResponse(c, http.StatusNotFound, "Artist not found")
		return
	}

	// Get artist's songs
	songs, err := services.GetSongsByArtist(c.Request.Context(), id, 20)
	if err != nil {
		songs = []models.Song{}
	}

	// Get artist's albums
	albums, err := services.GetAlbumsByArtist(c.Request.Context(), id)
	if err != nil {
		albums = []models.Album{}
	}

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"artist": artist,
		"songs":  songs,
		"albums": albums,
	})
}

// GetArtistAnalytics returns analytics for the authenticated artist
func GetArtistAnalytics(c *gin.Context) {
	uid := c.GetString("uid")

	artist, err := services.GetArtist(c.Request.Context(), uid)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Artist not found")
		return
	}

	songs, err := services.GetSongsByArtist(c.Request.Context(), uid, 50)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch analytics")
		return
	}

	totalPlays := 0
	var topSongs []models.SongWithPlay
	for _, song := range songs {
		totalPlays += song.PlayCount
		topSongs = append(topSongs, models.SongWithPlay{
			Song:      song,
			PlayCount: song.PlayCount,
		})
	}

	analytics := models.ArtistAnalytics{
		TotalPlays:    totalPlays,
		TotalSongs:    len(songs),
		FollowerCount: artist.FollowerCount,
		TopSongs:      topSongs,
	}

	utils.SuccessResponse(c, http.StatusOK, analytics)
}

// CreateAlbum creates a new album for the artist
func CreateAlbum(c *gin.Context) {
	uid := c.GetString("uid")

	var req models.CreateAlbumRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Album title is required")
		return
	}

	album := models.Album{
		Title:     utils.SanitizeString(req.Title),
		ArtistID:  uid,
		Year:      req.Year,
		CreatedAt: time.Now(),
	}

	id, err := services.CreateAlbum(c.Request.Context(), album)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create album")
		return
	}

	album.ID = id
	utils.SuccessResponse(c, http.StatusCreated, album)
}

// GetArtistAlbums returns the artist's albums
func GetArtistAlbums(c *gin.Context) {
	uid := c.GetString("uid")

	albums, err := services.GetAlbumsByArtist(c.Request.Context(), uid)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch albums")
		return
	}

	if albums == nil {
		albums = []models.Album{}
	}

	utils.SuccessResponse(c, http.StatusOK, albums)
}
