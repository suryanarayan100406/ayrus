package routes

import (
	"spotify-clone/handlers"
	"spotify-clone/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Global middleware
	r.Use(middleware.CORSMiddleware())
	r.Use(middleware.RateLimitMiddleware())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "spotify-clone-api"})
	})

	api := r.Group("/api")
	{
		// Auth routes (no auth required)
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/verify-token", handlers.VerifyToken)
		}

		// Protected routes (auth required)
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			// User routes
			users := protected.Group("/users")
			{
				users.GET("/me", handlers.GetCurrentUser)
				users.PUT("/me", handlers.UpdateCurrentUser)
				users.GET("/me/liked-songs", handlers.GetLikedSongs)
			}

			// Song routes
			songs := protected.Group("/songs")
			{
				songs.GET("", handlers.GetSongs)
				songs.GET("/:id", handlers.GetSong)
				songs.GET("/:id/stream", handlers.StreamSong)
				songs.POST("/:id/play", handlers.RecordPlay)
				songs.POST("/:id/like", handlers.LikeSong)
			}

			// Playlist routes
			playlists := protected.Group("/playlists")
			{
				playlists.GET("", handlers.GetPlaylists)
				playlists.POST("", handlers.CreatePlaylist)
				playlists.GET("/:id", handlers.GetPlaylist)
				playlists.PUT("/:id", handlers.UpdatePlaylist)
				playlists.DELETE("/:id", handlers.DeletePlaylist)
				playlists.POST("/:id/songs", handlers.AddSongToPlaylist)
				playlists.DELETE("/:id/songs/:songId", handlers.RemoveSongFromPlaylist)
			}

			// Artist public routes
			protected.GET("/artists/:id", handlers.GetPublicArtist)
			protected.POST("/artists/:id/follow", handlers.FollowArtist)

			// Search
			protected.GET("/search", handlers.Search)

			// Recommendations
			protected.GET("/recommendations", handlers.GetRecommendations)

			// Recently played
			protected.GET("/recently-played", handlers.GetRecentlyPlayed)

			// Music discovery APIs
			discover := protected.Group("/discover")
			{
				discover.GET("/jamendo", handlers.DiscoverJamendo)
				discover.GET("/fma", handlers.DiscoverFMA)
				discover.GET("/archive", handlers.DiscoverArchive)
				discover.GET("/archive/:identifier/files", handlers.GetArchiveFiles)
				discover.GET("/spotify", handlers.SearchSpotifyMeta)
			}

			// Upload routes
			protected.POST("/upload/image", handlers.UploadCoverImage)

			// Artist panel routes (requires approved artist status)
			artist := protected.Group("/artist")
			artist.Use(middleware.RoleMiddleware("artist", "admin"))
			{
				artist.GET("/profile", handlers.GetArtistProfile)
				artist.PUT("/profile", handlers.UpdateArtistProfile)
				artist.POST("/upload", handlers.UploadSong)
				artist.GET("/analytics", handlers.GetArtistAnalytics)
				artist.POST("/albums", handlers.CreateAlbum)
				artist.GET("/albums", handlers.GetArtistAlbums)
			}

			// Artist registration (any authenticated user)
			protected.POST("/artist/register", handlers.RegisterArtist)

			// Admin routes
			admin := protected.Group("/admin")
			admin.Use(middleware.RoleMiddleware("admin"))
			{
				admin.GET("/dashboard", handlers.AdminGetDashboard)
				admin.GET("/users", handlers.AdminGetUsers)
				admin.PUT("/users/:id/role", handlers.AdminUpdateUserRole)
				admin.GET("/songs", handlers.AdminGetSongs)
				admin.PUT("/songs/:id/approve", handlers.AdminApproveSong)
				admin.DELETE("/songs/:id", handlers.AdminDeleteSong)
				admin.GET("/artists", handlers.AdminGetArtists)
				admin.PUT("/artists/:id/approve", handlers.AdminApproveArtist)
			}
		}
	}

	return r
}
