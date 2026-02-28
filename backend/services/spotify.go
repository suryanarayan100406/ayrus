package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"time"
)

// Spotify Web API - used for METADATA ONLY (not audio streaming)
// Register at https://developer.spotify.com/dashboard
// Free tier, no credit card required

type SpotifyToken struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
}

type SpotifySearchResult struct {
	Tracks struct {
		Items []SpotifyTrack `json:"items"`
	} `json:"tracks"`
	Artists struct {
		Items []SpotifyArtist `json:"items"`
	} `json:"artists"`
}

type SpotifyTrack struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Duration   int    `json:"duration_ms"`
	PreviewURL string `json:"preview_url"`
	Album      struct {
		Name   string `json:"name"`
		Images []struct {
			URL string `json:"url"`
		} `json:"images"`
	} `json:"album"`
	Artists []struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	} `json:"artists"`
}

type SpotifyArtist struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Genres []string `json:"genres"`
	Images []struct {
		URL string `json:"url"`
	} `json:"images"`
	Followers struct {
		Total int `json:"total"`
	} `json:"followers"`
}

var (
	spotifyClient      = &http.Client{Timeout: 10 * time.Second}
	spotifyAccessToken string
	spotifyTokenExpiry time.Time
)

func getSpotifyToken() (string, error) {
	if spotifyAccessToken != "" && time.Now().Before(spotifyTokenExpiry) {
		return spotifyAccessToken, nil
	}

	clientID := os.Getenv("SPOTIFY_CLIENT_ID")
	clientSecret := os.Getenv("SPOTIFY_CLIENT_SECRET")
	if clientID == "" || clientSecret == "" {
		return "", fmt.Errorf("SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET not set")
	}

	data := url.Values{}
	data.Set("grant_type", "client_credentials")

	req, _ := http.NewRequest("POST", "https://accounts.spotify.com/api/token", nil)
	req.SetBasicAuth(clientID, clientSecret)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.URL.RawQuery = data.Encode()

	resp, err := spotifyClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("spotify auth error: %v", err)
	}
	defer resp.Body.Close()

	var token SpotifyToken
	if err := json.NewDecoder(resp.Body).Decode(&token); err != nil {
		return "", fmt.Errorf("failed to decode spotify token: %v", err)
	}

	spotifyAccessToken = token.AccessToken
	spotifyTokenExpiry = time.Now().Add(time.Duration(token.ExpiresIn-60) * time.Second)
	return spotifyAccessToken, nil
}

func SearchSpotifyMetadata(query string, limit int) (*SpotifySearchResult, error) {
	token, err := getSpotifyToken()
	if err != nil {
		return nil, err
	}

	apiURL := fmt.Sprintf(
		"https://api.spotify.com/v1/search?q=%s&type=track,artist&limit=%d",
		url.QueryEscape(query), limit,
	)

	req, _ := http.NewRequest("GET", apiURL, nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := spotifyClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("spotify API error: %v", err)
	}
	defer resp.Body.Close()

	var result SpotifySearchResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode spotify response: %v", err)
	}

	return &result, nil
}
