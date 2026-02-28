package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"time"
)

// Jamendo API - Free music with Creative Commons licenses
// Register at https://devportal.jamendo.com for a free Client ID

type JamendoTrack struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Duration    int    `json:"duration"`
	ArtistID    string `json:"artist_id"`
	ArtistName  string `json:"artist_name"`
	AlbumName   string `json:"album_name"`
	AlbumImage  string `json:"album_image"`
	Audio       string `json:"audio"`
	AudioDownload string `json:"audiodownload"`
	Image       string `json:"image"`
	ShareURL    string `json:"shareurl"`
}

type JamendoResponse struct {
	Headers struct {
		Status      string `json:"status"`
		Code        int    `json:"code"`
		ResultCount int    `json:"results_count"`
	} `json:"headers"`
	Results []JamendoTrack `json:"results"`
}

var jamendoClient = &http.Client{Timeout: 10 * time.Second}

func getJamendoClientID() string {
	return os.Getenv("JAMENDO_CLIENT_ID")
}

func SearchJamendo(query string, limit int) ([]JamendoTrack, error) {
	clientID := getJamendoClientID()
	if clientID == "" {
		return nil, fmt.Errorf("JAMENDO_CLIENT_ID not set")
	}

	apiURL := fmt.Sprintf(
		"https://api.jamendo.com/v3.0/tracks/?client_id=%s&format=json&limit=%d&namesearch=%s&include=musicinfo&audioformat=mp32",
		clientID, limit, url.QueryEscape(query),
	)

	resp, err := jamendoClient.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("jamendo API error: %v", err)
	}
	defer resp.Body.Close()

	var result JamendoResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode jamendo response: %v", err)
	}

	return result.Results, nil
}

func GetJamendoTrending(limit int) ([]JamendoTrack, error) {
	clientID := getJamendoClientID()
	if clientID == "" {
		return nil, fmt.Errorf("JAMENDO_CLIENT_ID not set")
	}

	apiURL := fmt.Sprintf(
		"https://api.jamendo.com/v3.0/tracks/?client_id=%s&format=json&limit=%d&order=popularity_total&audioformat=mp32",
		clientID, limit,
	)

	resp, err := jamendoClient.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("jamendo API error: %v", err)
	}
	defer resp.Body.Close()

	var result JamendoResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	return result.Results, nil
}

func GetJamendoByGenre(genre string, limit int) ([]JamendoTrack, error) {
	clientID := getJamendoClientID()
	if clientID == "" {
		return nil, fmt.Errorf("JAMENDO_CLIENT_ID not set")
	}

	apiURL := fmt.Sprintf(
		"https://api.jamendo.com/v3.0/tracks/?client_id=%s&format=json&limit=%d&tags=%s&audioformat=mp32",
		clientID, limit, url.QueryEscape(genre),
	)

	resp, err := jamendoClient.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("jamendo API error: %v", err)
	}
	defer resp.Body.Close()

	var result JamendoResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	return result.Results, nil
}
