package handlers

import (
	"net/http"
	"time"

	"spotify-clone/config"
	"spotify-clone/models"
	"spotify-clone/services"
	"spotify-clone/utils"

	"github.com/gin-gonic/gin"
)

// Register creates a new user in Firestore after Firebase Auth signup
func Register(c *gin.Context) {
	var req struct {
		UID         string `json:"uid" binding:"required"`
		Email       string `json:"email" binding:"required"`
		DisplayName string `json:"displayName"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
		return
	}

	user := models.User{
		UID:            req.UID,
		Email:          req.Email,
		DisplayName:    req.DisplayName,
		Role:           "user",
		LikedSongs:     []string{},
		Following:      []string{},
		RecentlyPlayed: []string{},
		CreatedAt:      time.Now(),
	}

	if err := services.CreateUser(c.Request.Context(), user); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create user")
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, user)
}

// VerifyToken verifies a Firebase ID token and returns user info
func VerifyToken(c *gin.Context) {
	var req struct {
		Token string `json:"token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Token required")
		return
	}

	token, err := config.AuthClient.VerifyIDToken(c.Request.Context(), req.Token)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid token")
		return
	}

	// Get or create user in Firestore
	user, err := services.GetUser(c.Request.Context(), token.UID)
	if err != nil {
		// User doesn't exist in Firestore yet, create them
		newUser := models.User{
			UID:            token.UID,
			Email:          token.Claims["email"].(string),
			DisplayName:    "",
			Role:           "user",
			LikedSongs:     []string{},
			Following:      []string{},
			RecentlyPlayed: []string{},
			CreatedAt:      time.Now(),
		}
		if name, ok := token.Claims["name"].(string); ok {
			newUser.DisplayName = name
		}
		if photo, ok := token.Claims["picture"].(string); ok {
			newUser.PhotoURL = photo
		}

		if err := services.CreateUser(c.Request.Context(), newUser); err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create user")
			return
		}
		user = &newUser
	}

	utils.SuccessResponse(c, http.StatusOK, user)
}
