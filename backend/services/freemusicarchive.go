package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

// Free Music Archive API
// Provides Creative Commons licensed music
// No API key required for basic access

type FMATrack struct {
	TrackID       int    `json:"track_id"`
	TrackTitle    string `json:"track_title"`
	TrackDuration string `json:"track_duration"`
	TrackURL      string `json:"track_url"`
	TrackFileURL  string `json:"track_file_url"`
	TrackImageURL string `json:"track_image_file"`
	ArtistName    string `json:"artist_name"`
	ArtistURL     string `json:"artist_url"`
	AlbumTitle    string `json:"album_title"`
	LicenseTitle  string `json:"license_title"`
}

type FMAResponse struct {
	Title   string     `json:"title"`
	Message string     `json:"message"`
	Total   string     `json:"total"`
	Dataset []FMATrack `json:"dataset"`
}

var fmaClient = &http.Client{Timeout: 10 * time.Second}

func SearchFMA(query string, limit int) ([]FMATrack, error) {
	apiURL := fmt.Sprintf(
		"https://freemusicarchive.org/api/get/tracks.json?search=%s&limit=%d",
		url.QueryEscape(query), limit,
	)

	resp, err := fmaClient.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("FMA API error: %v", err)
	}
	defer resp.Body.Close()

	var result FMAResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode FMA response: %v", err)
	}

	return result.Dataset, nil
}

func GetFMATrending(limit int) ([]FMATrack, error) {
	apiURL := fmt.Sprintf(
		"https://freemusicarchive.org/api/get/tracks.json?sort_by=track_interest&sort_dir=desc&limit=%d",
		limit,
	)

	resp, err := fmaClient.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("FMA API error: %v", err)
	}
	defer resp.Body.Close()

	var result FMAResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode FMA response: %v", err)
	}

	return result.Dataset, nil
}

func GetFMAByGenre(genreID int, limit int) ([]FMATrack, error) {
	apiURL := fmt.Sprintf(
		"https://freemusicarchive.org/api/get/tracks.json?genre_id=%d&limit=%d",
		genreID, limit,
	)

	resp, err := fmaClient.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("FMA API error: %v", err)
	}
	defer resp.Body.Close()

	var result FMAResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	return result.Dataset, nil
}
