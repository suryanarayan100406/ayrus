package main

import (
	"log"
	"os"

	"spotify-clone/config"
	"spotify-clone/routes"
)

func main() {
	// Load .env file manually (simple approach, no extra dependency)
	loadEnv()

	// Initialize Firebase
	config.InitFirebase()
	defer config.CloseFirebase()

	// Setup router
	router := routes.SetupRouter()

	// Serve uploaded files as static content
	router.Static("/uploads", "./uploads")

	// Get port from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🎵 Ayrus Music API server starting on port %s", port)
	log.Printf("📡 API available at http://localhost:%s/api", port)
	log.Printf("❤️  Health check at http://localhost:%s/health", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// loadEnv reads .env file and sets environment variables
func loadEnv() {
	data, err := os.ReadFile(".env")
	if err != nil {
		log.Println("No .env file found, using system environment variables")
		return
	}

	for _, line := range splitLines(string(data)) {
		line = trimSpace(line)
		if line == "" || line[0] == '#' {
			continue
		}
		parts := splitFirst(line, '=')
		if len(parts) == 2 {
			key := trimSpace(parts[0])
			val := trimSpace(parts[1])
			if os.Getenv(key) == "" {
				os.Setenv(key, val)
			}
		}
	}
}

func splitLines(s string) []string {
	var lines []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == '\n' {
			line := s[start:i]
			if len(line) > 0 && line[len(line)-1] == '\r' {
				line = line[:len(line)-1]
			}
			lines = append(lines, line)
			start = i + 1
		}
	}
	if start < len(s) {
		lines = append(lines, s[start:])
	}
	return lines
}

func trimSpace(s string) string {
	start, end := 0, len(s)
	for start < end && (s[start] == ' ' || s[start] == '\t') {
		start++
	}
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t') {
		end--
	}
	return s[start:end]
}

func splitFirst(s string, sep byte) []string {
	for i := 0; i < len(s); i++ {
		if s[i] == sep {
			return []string{s[:i], s[i+1:]}
		}
	}
	return []string{s}
}
