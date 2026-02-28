package handlers

import (
	"net/http"

	"spotify-clone/services"
	"spotify-clone/utils"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
)

// GetCurrentUser returns the authenticated user's profile
func GetCurrentUser(c *gin.Context) {
	uid := c.GetString("uid")

	user, err := services.GetUser(c.Request.Context(), uid)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, user)
}

// UpdateCurrentUser updates the authenticated user's profile
func UpdateCurrentUser(c *gin.Context) {
	uid := c.GetString("uid")

	var req struct {
		DisplayName string `json:"displayName"`
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
	if req.PhotoURL != "" {
		updates["photoURL"] = req.PhotoURL
	}

	if len(updates) == 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "No fields to update")
		return
	}

	if err := services.UpdateUser(c.Request.Context(), uid, updates); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	utils.SuccessMessage(c, "Profile updated successfully")
}

// LikeSong toggles the like status of a song for the authenticated user
func LikeSong(c *gin.Context) {
	uid := c.GetString("uid")
	songID := c.Param("id")

	user, err := services.GetUser(c.Request.Context(), uid)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User not found")
		return
	}

	// Check if already liked
	liked := false
	for _, id := range user.LikedSongs {
		if id == songID {
			liked = true
			break
		}
	}

	var update map[string]interface{}
	if liked {
		update = map[string]interface{}{
			"likedSongs": firestore.ArrayRemove(songID),
		}
	} else {
		update = map[string]interface{}{
			"likedSongs": firestore.ArrayUnion(songID),
		}
	}

	if err := services.UpdateUser(c.Request.Context(), uid, update); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update likes")
		return
	}

	status := "liked"
	if liked {
		status = "unliked"
	}
	utils.SuccessResponse(c, http.StatusOK, gin.H{"status": status, "songId": songID})
}

// FollowArtist toggles following an artist
func FollowArtist(c *gin.Context) {
	uid := c.GetString("uid")
	artistID := c.Param("id")

	user, err := services.GetUser(c.Request.Context(), uid)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User not found")
		return
	}

	following := false
	for _, id := range user.Following {
		if id == artistID {
			following = true
			break
		}
	}

	var update map[string]interface{}
	if following {
		update = map[string]interface{}{
			"following": firestore.ArrayRemove(artistID),
		}
		// Decrement follower count
		services.UpdateArtist(c.Request.Context(), artistID, map[string]interface{}{
			"followerCount": firestore.Increment(-1),
		})
	} else {
		update = map[string]interface{}{
			"following": firestore.ArrayUnion(artistID),
		}
		// Increment follower count
		services.UpdateArtist(c.Request.Context(), artistID, map[string]interface{}{
			"followerCount": firestore.Increment(1),
		})
	}

	if err := services.UpdateUser(c.Request.Context(), uid, update); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update following")
		return
	}

	status := "followed"
	if following {
		status = "unfollowed"
	}
	utils.SuccessResponse(c, http.StatusOK, gin.H{"status": status, "artistId": artistID})
}

// GetRecentlyPlayed returns the user's recently played songs
func GetRecentlyPlayed(c *gin.Context) {
	uid := c.GetString("uid")

	user, err := services.GetUser(c.Request.Context(), uid)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User not found")
		return
	}

	// Fetch song details for recently played IDs
	var songs []interface{}
	for _, songID := range user.RecentlyPlayed {
		song, err := services.GetSong(c.Request.Context(), songID)
		if err != nil {
			continue
		}
		songs = append(songs, song)
	}

	utils.SuccessResponse(c, http.StatusOK, songs)
}

// GetLikedSongs returns the user's liked songs
func GetLikedSongs(c *gin.Context) {
	uid := c.GetString("uid")

	user, err := services.GetUser(c.Request.Context(), uid)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User not found")
		return
	}

	var songs []interface{}
	for _, songID := range user.LikedSongs {
		song, err := services.GetSong(c.Request.Context(), songID)
		if err != nil {
			continue
		}
		songs = append(songs, song)
	}

	utils.SuccessResponse(c, http.StatusOK, songs)
}
