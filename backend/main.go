package main

import (
	"log"
	"os"

	"spotify-clone/config"
	"spotify-clone/routes"
)

func main() {
	// Initialize Firebase
	config.InitFirebase()
	defer config.CloseFirebase()

	// Setup router
	router := routes.SetupRouter()

	// Get port from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🎵 Spotify Clone API server starting on port %s", port)
	log.Printf("📡 API available at http://localhost:%s/api", port)
	log.Printf("❤️  Health check at http://localhost:%s/health", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
